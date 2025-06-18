import { Sandbox } from "@e2b/code-interpreter"
import { getModelClient, type LLMModel, type LLMModelConfig } from '../../../lib/models'
import { E2B_TOOL_REGISTRY, type E2BToolType, type ToolPromptContext } from '../../../lib/e2b/toolPrompts'
import templatesData from '../../../lib/templates.json'
import { ProjectAnalyzer, type ProjectStructure } from '../../../lib/project-analyzer'
import { streamObject, type LanguageModel } from "ai"
import { fragmentSchema } from '../../../lib/schema'
import { generateRequestId, logError } from '../../../lib/debug'
import ratelimit from '../../../lib/ratelimit'
import type { Duration } from '../../../lib/duration'
import { type z } from "zod";

export const maxDuration = 60

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW ? (process.env.RATE_LIMIT_WINDOW as Duration) : "1h"

interface E2BToolRequest {
  toolType: E2BToolType
  userInput: string
  templateId?: string
  model: LLMModel
  config: LLMModelConfig
  userID: string
  teamID: string
  sessionId?: string
  projectFiles?: Array<{
    name: string
    content: string
    path: string
    type: string
    size?: number
  }>
}

interface E2BToolResponse {
  success: boolean
  toolType: E2BToolType
  executionResult: any
  sandboxId?: string
  performance: {
    executionTime: number
    memoryUsage?: number
    tokenUsage?: number
  }
  requestId: string
  error?: string
  details?: any;
}

export async function POST(req: Request): Promise<Response> {
  const requestId = generateRequestId()
  let requestBody: E2BToolRequest | undefined;
  const startTime = Date.now()

  try {
    console.log(`[E2B Tools API ${requestId}] Processing tool execution request`)

    
    try {
      requestBody = await req.json() as E2BToolRequest;
    } catch (error) {
      console.error(`[E2B Tools API ${requestId}] Failed to parse request body:`, error)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
          requestId,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    
    if (!requestBody) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Request body is missing or invalid",
          requestId,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { toolType, userInput, model, config, userID, teamID, sessionId, projectFiles } = requestBody

    
    if (!toolType || !E2B_TOOL_REGISTRY[toolType]) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid or unsupported tool type: ${toolType}`,
          requestId,
          availableTools: Object.keys(E2B_TOOL_REGISTRY)
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    if (!userInput?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User input is required",
          requestId,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    if (!userID || !teamID) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User ID and Team ID are required",
          requestId,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    
    try {
      const limit = !config.apiKey
        ? await ratelimit(req.headers.get("x-forwarded-for"), rateLimitMaxRequests, ratelimitWindow)
        : false

      if (limit) {
        console.log(`[E2B Tools API ${requestId}] Rate limit hit`)
        return new Response(
          JSON.stringify({
            success: false,
            error: "Rate limit exceeded for E2B tools",
            requestId,
            retryAfter: limit.reset,
          }),
          {
            status: 429,
            headers: { 
              "Content-Type": "application/json",
              "Retry-After": limit.reset.toString()
            },
          }
        )
      }
    } catch (error) {
      console.warn(`[E2B Tools API ${requestId}] Rate limiting check failed:`, error)
      
    }

    console.log(`[E2B Tools API ${requestId}] Executing tool: ${toolType} for user: ${userID.substring(0, 8)}...`)

    
    let projectContext: ProjectStructure | undefined
    if (projectFiles && projectFiles.length > 0) {
      try {
        const analyzer = new ProjectAnalyzer()
        
        const fileObjects = projectFiles.map(file => {
          const blob = new Blob([file.content], { type: file.type || 'text/plain' })
          const fileObj = new File([blob], file.name, { type: file.type || 'text/plain' })
          return fileObj
        })
        
        const analysis = await analyzer.analyzeProject(fileObjects)
        projectContext = analysis.structure
        console.log(`[E2B Tools API ${requestId}] Project context analyzed: ${projectFiles.length} files`)
      } catch (error) {
        console.warn(`[E2B Tools API ${requestId}] Project analysis failed:`, error)
        
      }
    }

    
    const toolRegistry = E2B_TOOL_REGISTRY[toolType]
    const promptContext: ToolPromptContext = {
      userInput,
      template: templatesData,
      projectContext,
      sessionId,
      userID,
      teamID
    }

    const toolPromptResponse = toolRegistry.generator(promptContext)
    console.log(`[E2B Tools API ${requestId}] Tool prompt generated for: ${toolType}`)

    let modelClient: Exclude<LanguageModel, string>;
    try {
      const client = await getModelClient(model, config);
      
      if (typeof client === 'string') {
        throw new Error(`Model client for ${model.providerId}/${model.id} returned a string identifier instead of a model instance. This indicates a configuration issue.`);
      }
      
      modelClient = client as Exclude<LanguageModel, string>;
      console.log(`[E2B Tools API ${requestId}] Model client initialized: ${model.providerId}/${model.id}`)
    } catch (error: any) {
      console.error(`[E2B Tools API ${requestId}] Model initialization failed:`, error)
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to initialize AI model",
          provider: model.providerId,
          details: error.message,
          requestId,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    
    const apiKey = process.env.E2B_API_KEY
    if (!apiKey) {
      console.error(`[E2B Tools API ${requestId}] E2B API key not configured`)
      return new Response(
        JSON.stringify({
          success: false,
          error: "E2B sandbox service not configured",
          requestId,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    let sandbox: Sandbox | null = null
    let executionResult: any = null

    try {
      console.log(`[E2B Tools API ${requestId}] Creating E2B sandbox with template: ${toolPromptResponse.sandboxConfig.template}`)
      
      sandbox = await Sandbox.create(toolPromptResponse.sandboxConfig.template, {
        metadata: {
          toolType,
          userID: userID || "",
          teamID: teamID || "",
          requestId,
          sessionId: sessionId || "",
        },
        timeoutMs: toolPromptResponse.sandboxConfig.timeout,
        apiKey: apiKey,
      })

      console.log(`[E2B Tools API ${requestId}] Sandbox created: ${sandbox.sandboxId}`)

      
      const messages = [
        {
          role: "user" as const,
          content: toolPromptResponse.prompt
        }
      ]

      const { temperature, maxTokens, ...cleanConfig } = config
      const modelConfig = {
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 4000,
        ...cleanConfig
      }

      console.log(`[E2B Tools API ${requestId}] Executing AI model with tool prompt`)

      if (typeof modelClient === 'string') {
        throw new Error(`Model client is a string: ${modelClient}. This should not happen.`);
      }
      const stream = await streamObject({
        model: modelClient,
        schema: fragmentSchema,
        system: "You are an expert software engineer working in an E2B sandbox environment. Follow all provided instructions precisely and deliver production-ready code.",
        messages,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        maxRetries: 2,
      })

      let completeResponse = ""
      
      for await (const _part of stream.partialObjectStream) {
      }

      const finalObject = await stream.object as (z.infer<typeof fragmentSchema> & { 
        execution?: string[], 
        files?: Array<{ file_path: string; file_content: string }> 
      });
      console.log(`[E2B Tools API ${requestId}] AI response received, executing in sandbox`)

      
      if (finalObject && finalObject.files && finalObject.files.length > 0) {
        
        for (const file of finalObject.files) {
          if (file.file_path && file.file_content) {
            await sandbox.files.write(file.file_path, file.file_content)
            console.log(`[E2B Tools API ${requestId}] File written to sandbox: ${file.file_path}`)
          }
        }

        
        if (finalObject.execution && Array.isArray(finalObject.execution)) {
          for (const command of finalObject.execution) {
            const _result = await sandbox.commands.run(command)
            console.log(`[E2B Tools API ${requestId}] Command executed: ${command}`)
          }
        }
      }

      executionResult = {
        toolResponse: finalObject,
        sandboxId: sandbox.sandboxId,
        files: finalObject?.files || [],
        execution: finalObject?.execution || [],
        aiResponse: completeResponse
      }

      console.log(`[E2B Tools API ${requestId}] Tool execution completed successfully`)

    } catch (error: any) {
      console.error(`[E2B Tools API ${requestId}] Tool execution failed:`, error)
      
      const executionTime = Date.now() - startTime
      return new Response(
        JSON.stringify({
          success: false,
          toolType,
          error: error.message || "Tool execution failed",
          requestId,
          performance: {
            executionTime,
          },
          details: {
            sandboxId: sandbox?.sandboxId,
            errorStack: error.stack,
          },
          executionResult: null
        } satisfies E2BToolResponse),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      )
    } finally {
      if (sandbox) {
        try {
          console.log(`[E2B Tools API ${requestId}] Sandbox execution completed: ${sandbox.sandboxId}`)
        } catch (error) {
          console.warn(`[E2B Tools API ${requestId}] Sandbox cleanup warning:`, error)
        }
      }
    }

    const executionTime = Date.now() - startTime
    const response: E2BToolResponse = {
      success: true,
      toolType,
      executionResult,
      sandboxId: sandbox?.sandboxId,
      performance: {
        executionTime,
        tokenUsage: executionResult?.tokenUsage,
      },
      requestId
    }

    console.log(`[E2B Tools API ${requestId}] Tool execution completed in ${executionTime}ms`)

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })

  } catch (error: any) {
    const executionTime = Date.now() - startTime
    logError("E2B tool execution failed", error, { requestId, toolType: requestBody?.toolType })

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error during tool execution",
        requestId,
        performance: {
          executionTime,
        },
        details: error.message,
        toolType: (requestBody?.toolType && E2B_TOOL_REGISTRY[requestBody.toolType] 
                    ? requestBody.toolType 
                    : Object.keys(E2B_TOOL_REGISTRY)[0]) as E2BToolType,
        executionResult: null
      } satisfies E2BToolResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}


export async function GET(): Promise<Response> {
  const requestId = generateRequestId()

  interface ToolInfo {
    name: string;
    description: string;
  }

  try {
    const toolsInfo = Object.entries(E2B_TOOL_REGISTRY).map(([key, tool]) => {
      const knownTool = tool as ToolInfo;
      return {
        id: key,
        name: knownTool.name,
        description: knownTool.description,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        tools: toolsInfo,
        requestId,
        version: "1.0.0",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to retrieve tool registry",
        requestId,
      }),
      {
        status: 500,
      }
    )
  }
}
