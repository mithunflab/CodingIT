"use client"

import React from "react"

import type { ViewType } from "@/components/auth"
import { AuthDialog } from "@/components/auth-dialog"
import { Chat } from "@/components/chat"
import { EnhancedChatInput } from "@/components/enhanced-chat-input"
import { ChatPicker } from "@/components/chat-picker"
import { ChatSettings } from "@/components/chat-settings"
import { NavBar } from "@/components/navbar"
import { Preview } from "@/components/preview"
import CommandPalette from "@/components/ui/command-palette"
import { ProjectDialog } from "@/components/ui/project-dialog"
import { useProjectDialog } from "@/hooks/use-project-dialog"
import { useAuth } from "@/lib/auth"
import { type Message, toAISDKMessages, toMessageImage } from "@/lib/messages"
import type { LLMModelConfig } from "@/lib/models"
import modelsList from "@/lib/models.json"
import { type FragmentSchema, fragmentSchema as schema } from "@/lib/schema"
import { supabase } from "@/lib/supabase"
import templates, { type TemplateId } from "@/lib/templates"
import type { ExecutionResult } from "@/lib/types"
import type { DeepPartial } from "ai"
import { experimental_useObject as useObject } from "ai/react"
import { FolderPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { usePostHog } from "posthog-js/react"
import { useCallback, useEffect, useState } from "react"
import { useLocalStorage } from "usehooks-ts"
import { useProjectStore } from "@/lib/stores/projects"

interface ProjectAnalysis {
  structure: {
    files: Array<{
      name: string
      path: string
      language: string
      size: number
      type: string
      content?: string
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
    configFiles?: string[]
  }
  analysis: string
  recommendations: string[]
}

type ParsedApiError = { code: string; message: string; rawData: any }

const parseApiError = (error: Error | any): ParsedApiError => {
  let errorData: any = {}
  let errorCode = "UNKNOWN_ERROR"
  let errorMessage = error.message || "An unexpected error occurred"

  try {
    const errorText = error.message || ""
    const jsonMatch = errorText.match(/\{[\s\S]*\}/)
    if (jsonMatch && jsonMatch[0]) {
      errorData = JSON.parse(jsonMatch[0])
      errorCode = errorData.code || errorCode
      errorMessage = errorData.error || errorData.message || errorMessage
    } else if (errorText.includes("Internal Server Error")) {
      errorCode = "INTERNAL_SERVER_ERROR"
      errorMessage = "Internal server error occurred. Please try again."
    } else if (errorText.toLowerCase().includes("fetch") || errorText.toLowerCase().includes("networkerror")) {
      errorCode = "NETWORK_ERROR"
      errorMessage = "Network error. Please check your connection and try again."
    } else if (errorText.toLowerCase().includes("rate limit")) {
      errorCode = "RATE_LIMIT_ERROR"
      errorMessage = "Rate limit exceeded. Please wait before trying again."
    }
  } catch (parseError) {
    console.warn("Could not parse error details:", parseError)
  }

  return {
    code: errorCode,
    message: errorMessage,
    rawData: errorData,
  }
}

export default function Home() {
  const posthog = usePostHog()

  // Auth and session state
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<ViewType>("sign_in")
  const [authError, setAuthError] = useState<string | null>(null)
  const { session, isLoading, userTeam } = useAuth(setAuthDialog, setAuthView)

  const {
    isOpen: isProjectDialogOpen,
    mode: projectDialogMode,
    editingProject,
    openCreateDialog,
    openEditDialog,
    closeDialog: closeProjectDialog,
    handleSave: handleProjectSave,
  } = useProjectDialog()

  // Chat and UI state
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("nextjs-developer")
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>(
    "languageModel",
    modelsList.models[0] as LLMModelConfig
  )
  const [currentTab, setCurrentTab] = useState<"code" | "preview" | "editor">("code")
  const [currentPreview, setCurrentPreview] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [currentRequestId, setCurrentRequestId] = useState<string>("")
  const [hasMounted, setHasMounted] = useState(false)
  const [projectContext, setProjectContext] = useState<{
    files: File[]
    analysis: ProjectAnalysis | null
  }>({ files: [], analysis: null })

  // Template and model configuration
  const currentTemplate = templates[selectedTemplate]
  const availableModels = modelsList.models.filter((model) => 
    !("providerId" in currentTemplate) || model.providerId === (currentTemplate as any).providerId
  )
  const currentModel = availableModels.find((model) => model.id === languageModel.model)

  // Object streaming for fragment generation
  const { object, submit, isLoading: isSubmitting, stop, error } = useObject({
    api: "/api/chat",
    schema,
    onFinish: useCallback((event: { object: DeepPartial<FragmentSchema> | undefined; error: Error | undefined }) => {
      const result = event.object
      if (result && result.files && result.files.length > 0) {
        setCurrentTab("preview")
      }
    }, []),
    onError: useCallback((error: Error) => {
      console.error("[useObject] Error:", error)
      const parsedError = parseApiError(error)
      
      if (parsedError.code === "RATE_LIMIT_ERROR") {
        setIsRateLimited(true)
      }
      
      setErrorMessage(parsedError.message)
      setCurrentTab("code")
    }, []),
  })

  // Fragment state management
  const [fragment, setFragment] = useState<FragmentSchema | null>(null)
  const [result, setResult] = useState<ExecutionResult | undefined>()
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)

  // Navigation and action handlers
  const handleSocialClick = useCallback((platform: string) => {
    const urls = {
      twitter: "https://twitter.com/intent/tweet?text=Check%20out%20this%20amazing%20AI%20App%20Builder!",
      github: "https://github.com/Gerome-Elassaad/CodinIT",
      discord: "https://discord.gg/invite",
    }
    window.open(urls[platform as keyof typeof urls], "_blank")
  }, [])

  const handleClearChat = useCallback(() => {
    setMessages([])
    setChatInput("")
    setFragment(null)
    setResult(undefined)
    setErrorMessage("")
    setFiles([])
    setCurrentPreview(null)
    setProjectContext({ files: [], analysis: null })
  }, [])

  const handleUndo = useCallback(() => {
    if (messages.length > 1) {
      const newMessages = messages.slice(0, -1)
      setMessages(newMessages)
      
      const lastMessage = newMessages[newMessages.length - 1]
      if (!lastMessage || lastMessage.role !== "assistant") {
        setFragment(null)
        setResult(undefined)
      }
    }
  }, [messages])

  const handleRetryAuth = useCallback(() => {
    setAuthError(null)
    setAuthDialog(true)
  }, [])

  const handlePreviewClose = useCallback(() => {
    setFragment(null)
    setResult(undefined)
    setCurrentPreview(null)
  }, [])

  const handleSaveInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value)
  }, [])

  const handleFileChange = useCallback((change: React.SetStateAction<File[]>) => {
    setFiles(change)
  }, [])

  const handleLanguageModelChange = useCallback((newModel: LLMModelConfig) => {
    setLanguageModel(newModel)
  }, [setLanguageModel])

  const retry = useCallback(() => {
    if (fragment) {
      // Retry the last submission
      const form = document.querySelector("form") as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }
  }, [fragment])

  // Fragment execution effect
  useEffect(() => {
    if (!fragment || !session?.access_token || !userTeam?.id) return

    const executeFragment = async () => {
      setIsPreviewLoading(true)
      setErrorMessage("")
      setResult(undefined)

      try {
          const response = await fetch("/api/sandbox", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            fragment,
            userID: session.user.id,
            teamID: userTeam.id,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const executionResult = await response.json()
        setResult(executionResult)
        setCurrentTab("preview")
      } catch (error) {
        console.error("[Fragment Execution] Error:", error)
        const parsedError = parseApiError(error)
        setErrorMessage(parsedError.message)
        setResult(undefined)
        setCurrentTab("code")
      } finally {
        setIsPreviewLoading(false)
      }
    }

    executeFragment()
  }, [fragment, session?.access_token, session?.user?.id, userTeam?.id])

  // Object update effect
  useEffect(() => {
    if (!object) return

    console.log("[useObject] Object updated:", {
      template: object.template,
      hasFiles: !!(object.files && object.files.length > 0),
      codeFinished: object.code_finished,
    })

    if (
      object &&
      typeof object.commentary === "string" &&
      typeof object.template === "string" &&
      typeof object.template_ready === "boolean" &&
      typeof object.title === "string" &&
      typeof object.description === "string" &&
      typeof object.has_additional_dependencies === "boolean" &&
      typeof object.install_dependencies_ready === "boolean" &&
      ("port" in object)
    ) {
      setFragment(object as FragmentSchema)
    } else {
      // Optionally, handle the case where required fields are missing
      setFragment(null)
    }

    setMessages((prevMessages) => {
      const newAssistantContent: Message["content"] = [
        { type: "text", text: object.commentary || "Generating code..." }
      ]

      if (object.files?.[0]?.file_content) {
        newAssistantContent.push({ 
          type: "code", 
          text: `\`\`\`\n${object.files[0].file_content}\n\`\`\`` 
        })
      }

      const currentLastMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : null

      if (!currentLastMessage || currentLastMessage.role !== "assistant") {
        return [...prevMessages, { 
          role: "assistant", 
          content: newAssistantContent, 
          object 
        }]
      }

      const updatedMessages = [...prevMessages]
      updatedMessages[prevMessages.length - 1] = {
        ...currentLastMessage,
        content: newAssistantContent,
        object,
      }
      return updatedMessages
    })
  }, [object])

  // Error handling effect
  useEffect(() => {
    if (error) {
      console.error("[useObject] Stopping due to error:", error)
      stop()
    }
  }, [error, stop])

  // Effect to track component mounting for client-side only logic
  useEffect(() => {
    setHasMounted(true)
  }, [])



  // Main form submission handler
  const handleSubmitAuth = useCallback(async (
    e: React.FormEvent<HTMLFormElement>, 
    projectFiles?: File[], 
    projectAnalysis?: ProjectAnalysis
  ) => {
    e.preventDefault()

    if (isLoading) {
      console.log("[handleSubmitAuth] Still loading auth state")
      return
    }

    if (!session) {
      console.log("[handleSubmitAuth] No session, opening auth dialog")
      return setAuthDialog(true)
    }

    if (!session?.user?.id) {
      console.error("[handleSubmitAuth] Missing user ID")
      setErrorMessage("Authentication error: Missing user information. Please sign out and sign in again.")
      return
    }

    if (!userTeam?.id) {
      console.error("[handleSubmitAuth] Missing team ID")
      setErrorMessage("Team setup incomplete. Please refresh the page or contact support if the issue persists.")
      return
    }

    if (!currentModel) {
      console.error("[handleSubmitAuth] No model selected")
      setErrorMessage("Please select a model before submitting.")
      return
    }

    if (isSubmitting) {
      console.log("[handleSubmitAuth] Already submitting, stopping current request")
      stop()
      return
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setCurrentRequestId(requestId)

    const content: Message["content"] = [{ type: "text", text: chatInput }]
    const images = await toMessageImage(files)

    if (images.length > 0) {
      images.forEach((image) => {
        content.push({ type: "image", image })
      })
    }

    const newUserMessage: Message = {
      role: "user",
      content,
    }

    const currentMessagesSnapshot = [...messages]
    setMessages((prevMessages) => [...prevMessages, newUserMessage])

    const messagesForApi = [...currentMessagesSnapshot, newUserMessage]

    const submitData = {
      userID: session.user.id,
      teamID: userTeam.id,
      messages: toAISDKMessages(messagesForApi),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
      uploadedFiles: projectFiles,
      projectAnalysis: projectAnalysis,
    }

    console.log("[handleSubmitAuth] Submitting request:", {
      requestId,
      userID: submitData.userID.substring(0, 8) + "...",
      teamID: submitData.teamID.substring(0, 8) + "...",
      messagesCount: submitData.messages.length,
      model: submitData.model.id,
      provider: submitData.model.providerId,
      template: selectedTemplate,
      hasProjectFiles: !!(projectFiles && projectFiles.length > 0),
      hasProjectAnalysis: !!projectAnalysis,
      isGitHubImport: !!(projectAnalysis && projectAnalysis.structure),
    })

    try {
      submit(submitData)

      setChatInput("")
      setFiles([])
      setCurrentTab("code")
      setErrorMessage("")
      setIsRateLimited(false)

      if (projectFiles || projectAnalysis) {
        setProjectContext({
          files: projectFiles || [],
          analysis: projectAnalysis || null
        })
      }

      posthog.capture("chat_submit", {
        template: selectedTemplate,
        model: languageModel.model,
        requestId,
        hasProjectContext: !!(projectFiles && projectFiles.length > 0),
        importSource: projectAnalysis ? "github" : projectFiles ? "upload" : "none",
        gitHubRepository: projectAnalysis?.structure?.configFiles?.some(f => 
          f.includes('package.json') || f.includes('.git')
        ) ? "detected" : "none",
      })
    } catch (error) {
      console.error("[handleSubmitAuth] Submission error:", error)
      const parsedError = parseApiError(error)
      
      if (parsedError.code === "RATE_LIMIT_ERROR") {
        setIsRateLimited(true)
      }
      
      setErrorMessage(parsedError.message)
    }
  }, [
    isLoading,
    session,
    userTeam,
    currentModel,
    chatInput,
    files,
    selectedTemplate,
    languageModel,
    messages,
    submit,
    stop,
    isSubmitting,
    currentTemplate,
    posthog
  ])

  function logout(): void {
    supabase.auth.signOut().then(() => {
      window.location.reload()
    }).catch((error) => {
      console.error("Logout failed:", error)
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex w-full ${
          fragment ? "md:grid md:grid-cols-2" : ""
        }`}>
          {supabase && (
            <AuthDialog 
              open={isAuthDialogOpen} 
              setOpen={setAuthDialog} 
              view={authView} 
              supabase={supabase} 
            />
          )}

          {/* Main Chat Area */}
          <div className="flex flex-col w-full max-w-4xl mx-auto px-4 min-h-0">
            {/* Navigation Bar */}
            <NavBar
              session={session}
              showLogin={() => setAuthDialog(true)}
              signOut={logout}
              onSocialClick={handleSocialClick}
              onClear={handleClearChat}
              canClear={messages.length > 0}
              canUndo={messages.length > 1 && !isSubmitting}
              onUndo={handleUndo}
              authError={authError}
              onRetryAuth={handleRetryAuth}
            />

            {/* Chat Messages Area - Flexible, scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <Chat 
                messages={messages} 
                isLoading={isSubmitting} 
                setCurrentPreview={(preview) => setCurrentPreview(preview?.fragment?.title ?? null)} 
              />
            </div>

            {/* Chat Input - Fixed at bottom */}
            <div className="flex-shrink-0 border-t bg-background">
              {hasMounted ? (
                <EnhancedChatInput
                  input={chatInput}
                  handleInputChange={handleSaveInputChange}
                  handleSubmit={handleSubmitAuth}
                  isLoading={isSubmitting}
                  isErrored={error !== undefined}
                  errorMessage={errorMessage}
                  isRateLimited={isRateLimited}
                  retry={retry}
                  stop={stop}
                  isMultiModal={currentModel?.multiModal || false}
                  files={files}
                  handleFileChange={handleFileChange}
                >
                  {/* ChatPicker is already using hasMounted internally or via its props */}
                   <ChatPicker
                      templates={templates}
                      selectedTemplate={selectedTemplate}
                      onSelectedTemplateChange={(template) => {
                        if (template !== "auto") {
                          setSelectedTemplate(template)
                        }
                      }}
                      models={availableModels}
                      languageModel={languageModel}
                      onLanguageModelChange={handleLanguageModelChange}
                      hasMounted={hasMounted}
                    />
                  <ChatSettings
                    apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
                    baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
                    languageModel={languageModel}
                    onLanguageModelChange={handleLanguageModelChange}
                  />
                </EnhancedChatInput>
              ) : (
                <div className="p-4 space-y-3">
                  <div className="h-10 bg-muted rounded-lg animate-pulse" />
                  <div className="h-20 bg-muted rounded-2xl animate-pulse" />
                  <div className="h-10 bg-muted rounded-lg animate-pulse" />
                  <div className="h-4 w-1/2 mx-auto bg-muted rounded animate-pulse mt-1" />
                  </div>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          {fragment && hasMounted && ( // Also ensure preview panel respects hasMounted if its content could cause issues
            <div className="hidden md:flex md:flex-col border-l border-border">
              <Preview
                teamID={userTeam?.id}
                accessToken={session?.access_token}
                selectedTab={currentTab}
                onSelectedTabChange={setCurrentTab}
                isChatLoading={isSubmitting}
                isPreviewLoading={isPreviewLoading}
                fragment={fragment}
                result={result as ExecutionResult}
                onClose={handlePreviewClose}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for New Project */}
      <AnimatePresence>
        {session && hasMounted && (
          <motion.button
            onClick={openCreateDialog}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
            }}
            title="Create New Project"
          >
            <FolderPlus className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Command Palette Integration */}
      <CommandPalette 
        onCreateFragment={() => {
          setChatInput("Create a new Next.js React component with modern best practices including TypeScript, responsive design, and accessibility features.")
          setSelectedTemplate("nextjs-developer")
          
          setTimeout(() => {
            const form = document.querySelector("form") as HTMLFormElement
            if (form) {
              form.requestSubmit()
            }
          }, 100)
        }}
        onClearChat={handleClearChat}
        onOpenSettings={() => {
        }}
      />

      {/* Floating Action Button for New Project */}
      <AnimatePresence>
        {session && hasMounted && (
          <motion.button
            onClick={openCreateDialog}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
            }}
            title="Create New Project"
          >
            <FolderPlus className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Project Dialog */}
      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={closeProjectDialog}
        mode={projectDialogMode}
        project={editingProject}
        onSave={handleProjectSave}
      />
    </div>
  )
}