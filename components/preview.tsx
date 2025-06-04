"use client"

import { DeployDialog } from './deploy-dialog'
import { FragmentCode } from './fragment-code'
import { FragmentWeb } from './fragment-web' // Corrected import path for FragmentWeb
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
// SidebarProvider and AppSidebar are not used, can be removed if not needed elsewhere, but keeping for now.
// import { SidebarProvider } from '@/components/ui/sidebar'
// import { AppSidebar } from './app-sidebar'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult, ExecutionResultWeb } from '@/lib/types' // Added ExecutionResultWeb
import { DeepPartial } from 'ai'
import { ChevronsRight, LoaderCircle, Files, Code, Globe } from 'lucide-react' // Added Globe
import { Dispatch, SetStateAction } from 'react'

export function Preview({
  teamID,
  accessToken,
  selectedTab,
  onSelectedTabChange,
  isChatLoading,
  isPreviewLoading,
  fragment,
  result,
  onClose,
}: {
  teamID: string | undefined
  accessToken: string | undefined
  selectedTab: 'code' | 'preview' // Changed 'fragment' to 'preview'
  onSelectedTabChange: Dispatch<SetStateAction<'code' | 'preview'>> // Changed 'fragment' to 'preview'
  isChatLoading: boolean
  isPreviewLoading: boolean
  fragment?: DeepPartial<FragmentSchema>
  result?: ExecutionResult
  onClose: () => void
}) {
  if (!fragment) {
    return null
  }

  const isLinkAvailable = result?.template !== 'code-interpreter-v1'

  const fragmentFiles = fragment.files?.map(file => {
    if (!file) return undefined
    return {
      name: file.file_name || file.file_path?.split('/').pop() || 'untitled',
      content: file.file_content || '',
      path: file.file_path || file.file_name || 'untitled'
    }
  }).filter((file): file is { name: string; content: string; path: string } => !!file && !!file.content && !!file.name) || []

  return (
    <div className="absolute md:relative z-10 top-0 left-0 shadow-2xl md:rounded-tl-3xl md:rounded-bl-3xl md:border-l md:border-y bg-popover h-full w-full overflow-auto">
      <Tabs
        value={selectedTab}
        onValueChange={(value) =>
          onSelectedTabChange(value as 'code' | 'preview') // Changed 'fragment' to 'preview'
        }
        className="h-full flex flex-col items-start justify-start"
      >
        <div className="w-full p-2 grid grid-cols-3 items-center border-b">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  onClick={onClose}
                >
                  <ChevronsRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex justify-center">
            <TabsList className="px-1 py-0 border h-8">
              <TabsTrigger
                className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                value="code"
              >
                {isChatLoading && (
                  <LoaderCircle
                    strokeWidth={3}
                    className="h-3 w-3 animate-spin"
                  />
                )}
                <Code className="h-3 w-3" />
                Code
              </TabsTrigger>
              <TabsTrigger
                disabled={!isLinkAvailable} // Disabled if no URL preview is available
                className="font-normal text-xs py-1 px-2 gap-1 flex items-center"
                value="preview" // Changed 'fragment' to 'preview'
              >
                <Globe className="h-3 w-3" /> {/* Changed Files to Globe */}
                Preview {/* Changed Files to Preview */}
                {isPreviewLoading && isLinkAvailable && ( // Show loader only if preview is possible and loading
                  <LoaderCircle
                    strokeWidth={3}
                    className="h-3 w-3 animate-spin"
                  />
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          {result && (
            <div className="flex items-center justify-end gap-2">
              {isLinkAvailable && (
                <DeployDialog
                  url={result.url!}
                  sbxId={result.sbxId!}
                  teamID={teamID}
                  accessToken={accessToken}
                />
              )}
            </div>
          )}
        </div>
        
        {fragment && (
          <div className="overflow-y-auto w-full h-full">
            <TabsContent value="code" className="h-full">
              {fragmentFiles.length > 0 ? (
                <div className="flex h-full">
                  {/* AppSidebar removed from here */}
                  <div className="flex-1">
                    <FragmentCode files={fragmentFiles} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center space-y-2">
                    <Code className="h-8 w-8 mx-auto opacity-50" />
                    <p>No code files available</p>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="preview" className="h-full"> {/* Changed 'fragment' to 'preview' */}
              {result && isLinkAvailable ? (
                <FragmentWeb result={result as ExecutionResultWeb} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center space-y-2">
                    <Globe className="h-8 w-8 mx-auto opacity-50" /> {/* Changed Files to Globe */}
                    <p>Live preview not available for this execution type.</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        )}
      </Tabs>
    </div>
  )
}
