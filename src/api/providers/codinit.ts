import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI from "openai"
import axios from "axios"
import { ApiHandler } from ".."
import { ApiHandlerOptions, ModelInfo, openRouterDefaultModelId, openRouterDefaultModelInfo } from "@shared/api"
import { ApiStream, ApiStreamUsageChunk } from "../transform/stream"
import { OpenRouterErrorResponse } from "./types"
import { createOpenRouterStream } from "../transform/openrouter-stream"

export class ClineHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: OpenAI // Assuming Cline API is compatible with OpenAI client
	lastGenerationId?: string

	constructor(options: ApiHandlerOptions) {
		this.options = options
		this.client = new OpenAI({
			baseURL: "https://api.cline.bot/v1",
			defaultHeaders: {
				"HTTP-Referer": "https://cline.bot", // Optional, for including your app on cline.bot rankings.
				"X-Title": "CodinIT", // Optional. Shows in rankings on cline.bot.
				"X-Task-ID": this.options.taskId || "", // Include the task ID in the request headers (if applicable)
			},
		})
	}

	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		this.lastGenerationId = undefined

		const stream = await createOpenRouterStream(
			// Reusing OpenRouter stream creation logic
			this.client,
			systemPrompt,
			messages,
			this.getModel(),
			this.options.o3MiniReasoningEffort,
			this.options.thinkingBudgetTokens,
			this.options.openRouterProviderSorting,
		)

		let didOutputUsage: boolean = false

		for await (const chunk of stream) {
			// Process chunks from the stream
			// openrouter returns an error object instead of the openai sdk throwing an error
			if ("error" in chunk) {
				const error = chunk.error as OpenRouterErrorResponse["error"]
				console.error(`Cline API Error: ${error?.code} - ${error?.message}`)
				// Include metadata in the error message if available
				const metadataStr = error.metadata ? `\nMetadata: ${JSON.stringify(error.metadata, null, 2)}` : ""
				throw new Error(`Cline API Error ${error.code}: ${error.message}${metadataStr}`)
			}

			if (!this.lastGenerationId && chunk.id) {
				// Capture generation ID if available
				this.lastGenerationId = chunk.id
			}

			const delta = chunk.choices[0]?.delta
			if (delta?.content) {
				yield {
					// Yield text content
					type: "text",
					text: delta.content,
				}
			}

			// Reasoning tokens are returned separately from the content
			if ("reasoning" in delta && delta.reasoning) {
				yield {
					// Yield reasoning content
					type: "reasoning",
					// @ts-ignore-next-line
					reasoning: delta.reasoning,
				}
			}

			if (!didOutputUsage && chunk.usage) {
				yield {
					// Yield usage information
					type: "usage",
					cacheWriteTokens: 0,
					cacheReadTokens: chunk.usage.prompt_tokens_details?.cached_tokens || 0,
					inputTokens: chunk.usage.prompt_tokens || 0,
					outputTokens: chunk.usage.completion_tokens || 0,
					// @ts-ignore-next-line
					totalCost: chunk.usage.cost || 0,
				}
				didOutputUsage = true
			}
		}

		// Fallback to generation endpoint if usage chunk not returned
		if (!didOutputUsage) {
			const apiStreamUsage = await this.getApiStreamUsage() // Attempt to retrieve usage from a separate endpoint
			if (apiStreamUsage) {
				yield apiStreamUsage
			}
		}
	}

	async getApiStreamUsage(): Promise<ApiStreamUsageChunk | undefined> {
		if (this.lastGenerationId) {
			try {
				// Attempt to fetch generation details
				const response = await axios.get(`https://api.cline.bot/v1/generation?id=${this.lastGenerationId}`, {
					// Assuming Cline API has a similar endpoint
					headers: {},
					timeout: 15_000, // this request hangs sometimes
				})
				// Process the response data
				const generation = response.data
				return {
					type: "usage",
					// at this time there's no support for gatting cached_tokens from generation endpoint
					cacheWriteTokens: 0,
					cacheReadTokens: 0,
					inputTokens: generation?.native_tokens_prompt || 0,
					outputTokens: generation?.native_tokens_completion || 0,
					totalCost: generation?.total_cost || 0,
				} // Return usage data
			} catch (error) {
				// ignore if fails
				console.error("Error fetching Cline generation details:", error)
			} // Handle errors gracefully
		}
		return undefined // Return undefined if no generation ID or fetch fails
	}

	getModel(): { id: string; info: ModelInfo } {
		const modelId = this.options.openRouterModelId
		const modelInfo = this.options.openRouterModelInfo
		if (modelId && modelInfo) {
			return { id: modelId, info: modelInfo } // Use provided model ID and info if available
		}
		return { id: openRouterDefaultModelId, info: openRouterDefaultModelInfo }
	}
}
