import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import { LLMModelConfig } from '@/lib/models'
import { Settings2 } from 'lucide-react'

export function ChatSettings({
  apiKeyConfigurable,
  baseURLConfigurable,
  languageModel,
  onLanguageModelChange,
}: {
  apiKeyConfigurable: boolean
  baseURLConfigurable: boolean
  languageModel: LLMModelConfig
  onLanguageModelChange: (model: LLMModelConfig) => void
}) {
  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground h-6 w-6 rounded-sm">
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>LLM settings</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="start">
        {apiKeyConfigurable && (
          <>
            <div className="flex flex-col gap-2 px-2 py-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder={languageModel.apiKey ? "" : "Auto (uses default)"}
                value={languageModel.apiKey || ""} // Controlled component
                onChange={(e) =>
                  onLanguageModelChange({
                    apiKey:
                      e.target.value.trim().length > 0 ? e.target.value.trim() : undefined,
                  })
                }
                className="text-sm"
              />
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        {baseURLConfigurable && (
          <>
            <div className="flex flex-col gap-2 px-2 py-2">
              <Label htmlFor="baseURL">Base URL</Label>
              <Input
                id="baseURL"
                name="baseURL"
                type="text"
                placeholder={languageModel.baseURL ? "" : "Auto (uses default)"}
                value={languageModel.baseURL || ""} // Controlled component
                onChange={(e) =>
                  onLanguageModelChange({
                    baseURL:
                      e.target.value.trim().length > 0 ? e.target.value.trim() : undefined,
                  })
                }
                className="text-sm"
              />
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <div className="flex flex-col gap-1.5 px-2 py-2">
          <span className="text-sm font-medium">Parameters</span>
          <div className="flex space-x-4 items-center">
            <Label htmlFor="outputTokens" className="text-sm flex-1 text-muted-foreground font-normal">
              Output tokens
            </Label>
            <Input
              id="outputTokens"
              name="outputTokens"
              type="number"
              defaultValue={languageModel.maxTokens}
              min={50}
              max={10000}
              step={1}
              className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  maxTokens: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex space-x-4 items-center">
            <Label htmlFor="temperature" className="text-sm flex-1 text-muted-foreground font-normal">
              Temperature
            </Label>
            <Input
              id="temperature"
              name="temperature"
              type="number"
              defaultValue={languageModel.temperature}
              min={0}
              max={5}
              step={0.01}
              className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  temperature: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex space-x-4 items-center">
            <Label htmlFor="topP" className="text-sm flex-1 text-muted-foreground font-normal">Top P</Label>
            <Input
              id="topP"
              name="topP"
              type="number"
              defaultValue={languageModel.topP}
              min={0}
              max={1}
              step={0.01}
              className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  topP: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex space-x-4 items-center">
            <Label htmlFor="topK" className="text-sm flex-1 text-muted-foreground font-normal">Top K</Label>
            <Input
              id="topK"
              name="topK"
              type="number"
              defaultValue={languageModel.topK}
              min={0}
              max={500}
              step={1}
              className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  topK: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex space-x-4 items-center">
            <Label htmlFor="frequencyPenalty" className="text-sm flex-1 text-muted-foreground font-normal">
              Frequency penalty
            </Label>
            <Input
              id="frequencyPenalty"
              name="frequencyPenalty"
              type="number"
              defaultValue={languageModel.frequencyPenalty}
              min={0}
              max={2}
              step={0.01}
              className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  frequencyPenalty: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex space-x-4 items-center">
            <Label htmlFor="presencePenalty" className="text-sm flex-1 text-muted-foreground font-normal">
              Presence penalty
            </Label>
            <Input
              id="presencePenalty"
              name="presencePenalty"
              type="number"
              defaultValue={languageModel.presencePenalty}
              min={0}
              max={2}
              step={0.01}
              className="h-6 rounded-sm w-[84px] text-xs text-center tabular-nums"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  presencePenalty: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
