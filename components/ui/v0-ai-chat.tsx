"use client"

import type React from "react"
import { useEffect, useRef, useCallback, type SetStateAction, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ImageIcon, MonitorIcon, CircleUserRound, ArrowUpIcon, Paperclip, PlusIcon, Loader2, X } from "lucide-react"
import { ChatPicker } from "@/components/chat-picker"
import { ChatSettings } from "@/components/chat-settings"
import type { LLMModel, LLMModelConfig } from "@/lib/models"
import type { TemplateId, TemplatesDataObject } from "@/lib/templates"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FigmaImportModal } from "@/components/modals/figma-import-modal"
import { ProjectUploadModal } from "@/components/modals/project-upload-modal"
import { ScreenshotCloneModal } from "@/components/modals/screenshot-clone-modal"
import { countWords, isWithinWordLimit, getWordLimitMessage } from "@/lib/prompt-utils"
import { TypingAnimation } from "@/components/typing-animation"
import "@/components/rainbow-animations.css"

interface UseAutoResizeTextareaProps {
  minHeight: number
  maxHeight?: number
  value: string
}

function useAutoResizeTextarea({ minHeight, maxHeight, value }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return

      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }

      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY))
      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight],
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = `${minHeight}px`
      adjustHeight()
    }
  }, [minHeight, adjustHeight, value])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

interface VercelV0ChatProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  isErrored: boolean
  errorMessage?: string
  isRateLimited: boolean
  retry: () => void
  stop: () => void
  isMultiModal: boolean
  files: File[]
  handleFileChange: (change: SetStateAction<File[]>) => void
  templates: TemplatesDataObject
  selectedTemplate: "auto" | TemplateId
  onSelectedTemplateChange: (template: "auto" | TemplateId) => void
  models: LLMModel[]
  languageModel: LLMModelConfig
  onLanguageModelChange: (config: LLMModelConfig) => void
  apiKeyConfigurable: boolean
  baseURLConfigurable: boolean
}

const MAX_WORDS = 100

export function VercelV0Chat({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  isErrored,
  errorMessage,
  isRateLimited,
  retry,
  stop,
  isMultiModal,
  files,
  handleFileChange,
  templates,
  selectedTemplate,
  onSelectedTemplateChange,
  models,
  languageModel,
  onLanguageModelChange,
  apiKeyConfigurable,
  baseURLConfigurable,
}: VercelV0ChatProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
    value: input,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [programmaticSubmitCounter, setProgrammaticSubmitCounter] = useState(0)

  const currentWordCount = countWords(input)
  const isOverLimit = !isWithinWordLimit(input, MAX_WORDS)
  const wordLimitMessage = getWordLimitMessage(currentWordCount, MAX_WORDS)

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault()
      if ((input.trim() || files.length > 0) && !isOverLimit && formRef.current) {
        formRef.current.requestSubmit()
        // adjustHeight(true) is called by handleFormSubmit
      }
    }
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if ((input.trim() || files.length > 0) && !isOverLimit) {
      handleSubmit(e)
      adjustHeight(true)
    }
  }

  const onAttachClick = () => {
    fileInputRef.current?.click()
  }

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files)
      handleFileChange((prevFiles) => [...prevFiles, ...newFiles].slice(0, 5))
      event.target.value = ""
    }
  }

  const removeFile = (index: number) => {
    handleFileChange((prevFiles) => prevFiles.filter((_, i) => i !== index))
  }

  useEffect(() => {
    if (!isLoading && input === "") {
      adjustHeight(true)
    }
  }, [isLoading, input, adjustHeight])

  // Effect for programmatic submissions
  useEffect(() => {
    if (programmaticSubmitCounter > 0 && formRef.current) {
      if (!isLoading) { // Only attempt if not already loading
        // Check submission conditions again, as parent state might influence them
        // The main check is within handleFormSubmit, triggered by requestSubmit
        formRef.current.requestSubmit()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programmaticSubmitCounter, isLoading]) // isLoading is included to prevent re-submission if it becomes true

  // Action handlers
  const handleFigmaImport = async (figmaUrl: string, customPrompt?: string) => {
    const prompt = `🎨 **Import from Figma**: ${figmaUrl}\n\nAnalyze this Figma design and recreate it as functional React components. ${customPrompt ? `\n\nAdditional requirements: ${customPrompt}` : ""}`
    handleInputChange({ target: { value: prompt } } as any)
    onSelectedTemplateChange("nextjs-developer")
    setProgrammaticSubmitCounter(prev => prev + 1)
  }

  const handleProjectUpload = (uploadedFiles: File[], instructions?: string) => {
    const prompt = `📁 **Project Analysis & Enhancement**\n\nAnalyze these ${uploadedFiles.length} uploaded files and provide comprehensive improvements. ${instructions ? `\n\nFocus areas: ${instructions}` : ""}`
    handleFileChange(uploadedFiles)
    handleInputChange({ target: { value: prompt } } as any)
    onSelectedTemplateChange("auto")
    setProgrammaticSubmitCounter(prev => prev + 1)
  }

  const handleScreenshotClone = (image: File, instructions?: string) => {
    const prompt = `📸 **Clone Screenshot**\n\nRecreate this design as functional code with pixel-perfect accuracy. ${instructions ? `\n\nRequirements: ${instructions}` : ""}`
    handleFileChange([image])
    handleInputChange({ target: { value: prompt } } as any)
    onSelectedTemplateChange("nextjs-developer")
    setProgrammaticSubmitCounter(prev => prev + 1)
  }

  const handleLandingPage = () => {
    const prompt = `🏠 **Professional Landing Page**\n\nCreate a modern, conversion-optimized landing page with hero section, features, testimonials, pricing, and contact form.`
    handleInputChange({ target: { value: prompt } } as any)
    onSelectedTemplateChange("nextjs-developer")
    setProgrammaticSubmitCounter(prev => prev + 1)
  }

  const handleSignUpForm = () => {
    const prompt = `👤 **Secure Sign-Up Form**\n\nBuild a comprehensive registration form with validation, security features, and modern UX design.`
    handleInputChange({ target: { value: prompt } } as any)
    onSelectedTemplateChange("nextjs-developer")
    setProgrammaticSubmitCounter(prev => prev + 1)
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleFormSubmit}
      className="flex flex-col items-center w-full p-4 pt-2 space-y-4"
    >
      {/* Error and Rate Limit Handling */}
      {isErrored && errorMessage && (
        <Alert variant="destructive" className="w-full">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errorMessage}
            {isRateLimited && (
              <Button onClick={retry} variant="link" className="p-0 h-auto ml-1">
                Retry with your API key?
              </Button>
            )}
            {!isRateLimited && (
              <Button onClick={retry} variant="link" className="p-0 h-auto ml-1">
                Retry?
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="w-full">
        {/* Rainbow glowing chat container */}
        <div className="rainbow-chat-container">
          <div className="rainbow-chat-inner">
            {/* Attached files preview */}
            {isMultiModal && files.length > 0 && (
              <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-1.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300"
                    >
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="w-3 h-3" />
                      ) : (
                        <Paperclip className="w-3 h-3" />
                      )}
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="overflow-y-auto relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  handleInputChange(e)
                }}
                onKeyDown={handleTextareaKeyDown}
                placeholder=""
                className={cn(
                  "w-full px-4 py-3",
                  "resize-none",
                  "bg-transparent",
                  "border-none",
                  "text-neutral-900 dark:text-white text-sm",
                  "focus:outline-none",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "min-h-[60px]",
                  isOverLimit && "text-red-500 dark:text-red-400",
                )}
                style={{
                  overflow: "hidden",
                }}
                disabled={isLoading}
              />
              {/* Animated placeholder */}
              {!input && (
                <div className="absolute top-3 left-4 pointer-events-none">
                  <TypingAnimation
                    texts={[
                      "Ask a question or describe what you want to build...",
                      "Create stunning UI components with AI...",
                      "Build full-stack applications effortlessly...",
                      "Transform your ideas into reality...",
                    ]}
                    className="text-neutral-400 dark:text-neutral-500 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Word count indicator */}
            {input.trim() && (
              <div className="px-4 pb-2">
                <p className={cn("text-xs", isOverLimit ? "text-red-500" : "text-neutral-500")}>
                  {currentWordCount}/{MAX_WORDS} words ({wordLimitMessage})
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-3 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                {isMultiModal && (
                  <>
                    <button
                      type="button"
                      onClick={onAttachClick}
                      disabled={isLoading || files.length >= 5}
                      className="group p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <Paperclip className="w-4 h-4 text-neutral-700 dark:text-white" />
                      <span className="text-xs text-neutral-600 dark:text-zinc-400 hidden group-hover:inline transition-opacity">
                        Attach
                      </span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*,application/pdf,.txt,.md,.json,.html,.css,.js,.ts,.py"
                      onChange={onFileSelected}
                      className="hidden"
                      disabled={isLoading || files.length >= 5}
                    />
                  </>
                )}
                <ChatPicker
                  templates={templates}
                  selectedTemplate={selectedTemplate}
                  onSelectedTemplateChange={onSelectedTemplateChange}
                  models={models}
                  languageModel={languageModel}
                  onLanguageModelChange={onLanguageModelChange}
                />
                <ChatSettings
                  languageModel={languageModel}
                  onLanguageModelChange={onLanguageModelChange}
                  apiKeyConfigurable={apiKeyConfigurable}
                  baseURLConfigurable={baseURLConfigurable}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-2 py-1 rounded-lg text-sm text-zinc-400 transition-colors border border-dashed border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800 flex items-center justify-between gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  Project
                </button>
                {isLoading ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={stop}
                    className="bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-800 border-neutral-300 dark:border-zinc-700 hover:border-neutral-400 dark:hover:border-zinc-600"
                  >
                    <Loader2 className="w-4 h-4 text-neutral-700 dark:text-white animate-spin" />
                    <span className="sr-only">Stop</span>
                  </Button>
                ) : (
                  <div className="rainbow-submit-border">
                    <Button
                      type="submit"
                      size="icon"
                      disabled={(!input.trim() && files.length === 0) || isLoading || isOverLimit}
                      className={cn(
                        "rainbow-submit-content",
                        "px-1.5 py-1.5 text-sm transition-colors",
                        (!input.trim() && files.length === 0) || isLoading || isOverLimit
                          ? "opacity-50 cursor-not-allowed"
                          : "",
                      )}
                    >
                      <ArrowUpIcon className="w-4 h-4" />
                      <span className="sr-only">Send</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rainbow border action buttons */}
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <div className="rainbow-button-border">
            <div className="rainbow-button-content">
              <ScreenshotCloneModal onClone={handleScreenshotClone} isLoading={isLoading} />
            </div>
          </div>
          <div className="rainbow-button-border">
            <div className="rainbow-button-content">
              <FigmaImportModal onImport={handleFigmaImport} isLoading={isLoading} />
            </div>
          </div>
          <div className="rainbow-button-border">
            <div className="rainbow-button-content">
              <ProjectUploadModal onUpload={handleProjectUpload} isLoading={isLoading} />
            </div>
          </div>
          <div className="rainbow-button-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLandingPage}
              disabled={isLoading}
              className="rainbow-button-content flex items-center gap-2 px-4 py-2 transition-colors border-none"
            >
              <MonitorIcon className="w-4 h-4" />
              <span className="text-xs">Landing Page</span>
            </Button>
          </div>
          <div className="rainbow-button-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignUpForm}
              disabled={isLoading}
              className="rainbow-button-content flex items-center gap-2 px-4 py-2 transition-colors border-none"
            >
              <CircleUserRound className="w-4 h-4" />
              <span className="text-xs">Sign Up Form</span>
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
