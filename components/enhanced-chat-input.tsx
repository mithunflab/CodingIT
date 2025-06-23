"use client"

import type React from "react"
import Image from "next/image"
import { RepoBanner } from "./repo-banner"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { isFileInArray } from "@/lib/utils"
import { ArrowUp, Paperclip, Square, X, AlertTriangle, RefreshCw, Sparkles, Loader2, Github } from "lucide-react"
import { type SetStateAction, useEffect, useMemo, useState, useCallback } from "react"
import TextareaAutosize from "react-textarea-autosize"
import { GitHubImportModal } from "./modals/github-import-modal"
import "./rainbow-animations.css"
import { parseApiError } from "@/lib/utils"; // Import the shared error parser

interface ProjectAnalysis {
  structure: {
    files: Array<{
      name: string
      path: string
      language: string
      size: number
      type: string
    }>
    dependencies: Set<string>
    frameworks: Set<string>
    patterns: Set<string>
    components: Set<string>
    types: Set<string>
    utilities: Set<string>
    architecture: {
      type: string
      description: string
    }
  }
  analysis: string
  recommendations: string[]
}

export function EnhancedChatInput({
  retry,
  isErrored,
  errorMessage,
  isLoading,
  isRateLimited,
  stop,
  input,
  handleInputChange,
  handleSubmit,
  isMultiModal,
  files,
  handleFileChange,
  children,
  onRateLimit, // New prop to signal rate limit
}: {
  retry: () => void
  isErrored: boolean
  errorMessage: string
  isLoading: boolean
  isRateLimited: boolean // This prop reflects global rate limit state
  stop: () => void
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, projectFiles?: File[], projectAnalysis?: ProjectAnalysis) => void
  isMultiModal: boolean
  files: File[]
  handleFileChange: (change: SetStateAction<File[]>) => void
  children: React.ReactNode
  onRateLimit?: () => void // Optional callback
}) {
  const [dragActive, setDragActive] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)
  const [showGitHubImport, setShowGitHubImport] = useState(false)

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileChange((prev) => {
      const newFiles = Array.from(e.target.files || [])
      const uniqueFiles = newFiles.filter((file) => !isFileInArray(file, prev))
      return [...prev, ...uniqueFiles]
    })
  }

  const handleFileRemove = useCallback((file: File) => {
    handleFileChange((prev) => prev.filter((f) => f !== file))
  }, [handleFileChange])

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items)

    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault()

        const file = item.getAsFile()
        if (file) {
          handleFileChange((prev) => {
            if (!isFileInArray(file, prev)) {
              return [...prev, file]
            }
            return prev
          })
        }
      }
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

    if (droppedFiles.length > 0) {
      handleFileChange((prev) => {
        const uniqueFiles = droppedFiles.filter((file) => !isFileInArray(file, prev))
        return [...prev, ...uniqueFiles]
      })
    }
  }

  const handleGitHubImport = useCallback((files: File[], analysis: ProjectAnalysis, repositoryInfo: { owner: string; repo: string }) => {
    handleFileChange(() => files)
    
    const contextMessage = `I've imported the repository ${repositoryInfo.owner}/${repositoryInfo.repo}. Please analyze and help me work with this codebase.`
    
    const syntheticEvent = {
      preventDefault: () => {},
      currentTarget: {
        checkValidity: () => true,
        reportValidity: () => true
      }
    } as React.FormEvent<HTMLFormElement>
    
    // Use handleInputChange to update the input state in the parent component (app/page.tsx)
    // Create a synthetic event that mimics a textarea change event
    if (input.trim() === '') {
      const syntheticChangeEvent = {
        target: { value: contextMessage },
        currentTarget: { value: contextMessage }, // Ensure currentTarget is also set for consistency
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleInputChange(syntheticChangeEvent);
    }
    
    // Consider if handleSubmit needs to wait for state update or if current logic is fine.
    // For now, keeping the setTimeout to allow React to process the state update from handleInputChange.
    setTimeout(() => {
      handleSubmit(syntheticEvent, files, analysis)
    }, 100)
  }, [handleFileChange, handleInputChange, handleSubmit, input])

  const handleEnhanceMessage = async () => {
    if (!input.trim() || isLoading || isEnhancing || isErrored) return;

    setIsEnhancing(true);
    setEnhanceError(null);

    try {
      const response = await fetch("/api/ai/enhance-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textToEnhance: input }),
      });

      if (!response.ok) {
        // Try to get a structured error message from the response body
        let parsedError;
        try {
          const errorData = await response.json();
          // Create a synthetic error object for parseApiError
          parsedError = parseApiError({ 
            message: `Server error: ${response.status}`, // Fallback message
            ...errorData // Spread potential error structure from response
          });
        } catch (e) {
          // If parsing response.json() fails, create a more generic error
          parsedError = parseApiError(new Error(`Server error: ${response.status} ${response.statusText}`));
        }
        throw new Error(parsedError.message); // Throw with the parsed message
      }

      const data = await response.json();
      const enhancedMessage = data.enhancedText;

      if (typeof enhancedMessage !== 'string') {
        throw new Error("Invalid response from enhancement service.");
      }

      // Use handleInputChange to update the input state in the parent component (app/page.tsx)
      const syntheticChangeEvent = {
        target: { value: enhancedMessage },
        currentTarget: { value: enhancedMessage },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleInputChange(syntheticChangeEvent);

    } catch (error: any) {
      const parsedError = parseApiError(error); // Use the already imported parser
      setEnhanceError(parsedError.message);
      if (parsedError.code === "RATE_LIMIT_ERROR" && onRateLimit) {
        onRateLimit(); // Call the callback if it's a rate limit error
      }
    } finally {
      setIsEnhancing(false);
    }
  };

  const filePreview = useMemo(() => {
    if (files.length === 0) return null
    return Array.from(files).map((file) => {
      return (
        <div className="relative" key={file.name}>
          <span
            onClick={() => handleFileRemove(file)}
            className="absolute top-[-8] right-[-8] bg-muted rounded-full p-1"
          >
            <X className="h-3 w-3 cursor-pointer" />
          </span>
          <Image
            src={URL.createObjectURL(file) || "/placeholder.svg"}
            alt={file.name}
            width={40}
            height={40}
            className="rounded-xl w-10 h-10 object-cover"
          />
        </div>
      )
    })
  }, [files, handleFileRemove])

  function onEnter(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (e.currentTarget.checkValidity()) {
        handleSubmit(e)
      } else {
        e.currentTarget.reportValidity()
      }
    }
  }

  useEffect(() => {
    if (!isMultiModal) {
      handleFileChange([])
    }
  }, [isMultiModal, handleFileChange])

  const isAuthError =
    errorMessage.includes("Authentication error") ||
    errorMessage.includes("Missing user") ||
    errorMessage.includes("Missing team") ||
    errorMessage.includes("sign out and sign in")

  const isServerError =
    errorMessage.includes("Server error") || errorMessage.includes("Internal") || errorMessage.includes("server error")

  const isNetworkError =
    errorMessage.includes("Network error") || errorMessage.includes("connection") || errorMessage.includes("timeout")

  const isModelError = errorMessage.includes("model") || errorMessage.includes("API key")

  const getErrorStyling = () => {
    if (isAuthError) return "bg-red-400/10 text-red-400 border border-red-400/20"
    if (isServerError) return "bg-orange-400/10 text-orange-400 border border-orange-400/20"
    if (isNetworkError) return "bg-blue-400/10 text-blue-400 border border-blue-400/20"
    if (isRateLimited) return "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
    return "bg-red-400/10 text-red-400 border border-red-400/20"
  }

  const getErrorIcon = () => {
    if (isNetworkError) return <RefreshCw className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  const getErrorAction = () => {
    if (isAuthError) {
      return (
        <button
          className="px-2 py-1 rounded-sm bg-red-400/20 hover:bg-red-400/30 transition-colors"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      )
    }

    if (isServerError || isNetworkError || isModelError) {
      return (
        <button
          className="px-2 py-1 rounded-sm bg-orange-400/20 hover:bg-orange-400/30 transition-colors"
          onClick={retry}
        >
          Try Again
        </button>
      )
    }

    if (isRateLimited) {
      return (
        <button
          className="px-2 py-1 rounded-sm bg-yellow-400/20 hover:bg-yellow-400/30 transition-colors"
          onClick={retry}
        >
          Retry
        </button>
      )
    }

    return (
      <Button className="px-2 py-1 rounded-sm bg-red-400/20 hover:bg-red-400/30 transition-colors" onClick={retry}>
        Try Again
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={onEnter}
      className="mb-2 mt-auto flex flex-col bg-background"
      onDragEnter={isMultiModal ? handleDrag : undefined}
      onDragLeave={isMultiModal ? handleDrag : undefined}
      onDragOver={isMultiModal ? handleDrag : undefined}
      onDrop={isMultiModal ? handleDrop : undefined}
      suppressHydrationWarning
    >
      {isErrored && (
        <div className={`flex items-center p-3 text-sm font-medium mx-4 mb-4 rounded-xl ${getErrorStyling()}`}>
          <div className="flex items-center gap-2 flex-1">
            {getErrorIcon()}
            <span className="flex-1">{errorMessage}</span>
          </div>
          <div className="ml-2">{getErrorAction()}</div>
        </div>
      )}
      {enhanceError && (
        <div className="flex items-center p-2 mx-4 mb-2 rounded-md text-xs bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20">
          <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="flex-1">Enhancement failed: {enhanceError}</span>
          <Button variant="ghost" size="sm" className="ml-2 h-6 p-1 text-xs" onClick={() => setEnhanceError(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="relative">
        <RepoBanner className="absolute bottom-full inset-x-2 translate-y-1 z-0 pb-2" />
        <div
          className={`rainbow-chat-input rainbow-border shadow-md rounded-2xl relative z-10 bg-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background transition-shadow duration-200 ${
            dragActive
              ? "before:absolute before:inset-0 before:rounded-2xl before:border-2 before:border-dashed before:border-primary"
              : ""
          }`}
        >
          <div className="flex items-center px-3 py-2 gap-1">{children}</div>
          <TextareaAutosize
            autoFocus={true}
            minRows={1}
            maxRows={5}
            className="text-normal px-3 resize-none ring-0 bg-inherit w-full m-0 outline-none overflow-y-auto"
            required={true}
            placeholder="What would you like to ship today...?"
            autoComplete="off"
            id="chat-textarea"
            name="chat-textarea"
            disabled={isErrored}
            value={input}
            onChange={handleInputChange}
            onPaste={isMultiModal ? handlePaste : undefined}
          />
          <div className="flex p-3 gap-2 items-center">
            <input
              type="file"
              id="multimodal"
              name="multimodal"
              accept="image/*"
              multiple={true}
              className="hidden"
              onChange={handleFileInput}
            />
            <div className="flex items-center flex-1 gap-2">
              <div className="relative">
                  <div className="rounded-xl h-10 w-10" />
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={!isMultiModal || isErrored}
                        type="button"
                        variant="outline"
                        size="icon"
                        className="absolute inset-0 rounded-xl h-10 w-10 z-10"
                        onClick={(e) => {
                          e.preventDefault()
                          document.getElementById("multimodal")?.click()
                        }}
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add attachments</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="relative">
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={isErrored}
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-10 w-10"
                        onClick={() => setShowGitHubImport(true)}
                      >
                        <Github className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Import from GitHub</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                  <GitHubImportModal
                    open={showGitHubImport}
                    onOpenChange={setShowGitHubImport}
                    onImport={handleGitHubImport}
                    isLoading={isLoading}
                  />
              </div>

              {files.length > 0 && filePreview}
            </div>
            <div>
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={!input.trim() || isLoading || isEnhancing || isErrored}
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-10 w-10 mr-2" // Added mr-2 for spacing
                        onClick={handleEnhanceMessage}
                      >
                        {isEnhancing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Enhance message with AI</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              {!isLoading ? (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={isErrored}
                        variant="default"
                        size="icon"
                        type="submit"
                        className="rounded-xl h-10 w-10"
                      >
                        <ArrowUp className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-xl h-10 w-10"
                        onClick={(e) => {
                          e.preventDefault()
                          stop()
                        }}
                      >
                        <Square className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Stop generation</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        CodinIT Powered By{" "}
        <a href="https://codinit.dev" target="_blank" className="text-[#ff8800]" rel="noreferrer">
          ✶ E2B
        </a>
      </p>
    </form>
  )
}
