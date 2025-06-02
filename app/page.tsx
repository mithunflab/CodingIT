"use client"

import type React from "react"

import type { ViewType } from "@/components/auth"
import { AuthDialog } from "@/components/auth-dialog"
import { Chat } from "@/components/chat"
import { VercelV0Chat } from "@/components/ui/v0-ai-chat"
import { NavBar } from "@/components/navbar"
import { Preview } from "@/components/preview"
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
import { usePostHog } from "posthog-js/react"
import { type SetStateAction, useCallback, useEffect, useState } from "react"
import { useLocalStorage } from "usehooks-ts"
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar"

export default function Home() {
  const [chatInput, setChatInput] = useLocalStorage("chat", "")
  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<"auto" | TemplateId>("auto")
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>("languageModel", {
  })

  const posthog = usePostHog()

  const [result, setResult] = useState<ExecutionResult>()
  const [messages, setMessages] = useState<Message[]>([])
  const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>()
  const [currentTab, setCurrentTab] = useState<"code" | "fragment">("code")
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<ViewType>("sign_in")
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null)
  const { session, userTeam, isLoading, authError } = useAuth(setAuthDialog, setAuthView)

  const setMessage = useCallback(
    (message: Partial<Message>, index?: number) => {
      setMessages((previousMessages) => {
        const updatedMessages = [...previousMessages]
        const targetIndex = index ?? previousMessages.length - 1
        if (previousMessages[targetIndex]) {
          updatedMessages[targetIndex] = {
            ...previousMessages[targetIndex],
            ...message,
          }
        }
        return updatedMessages
      })
    },
    [setMessages],
  )

  // Debug logging for auth state
  useEffect(() => {
    console.log("[Chat] Auth state:", {
      sessionId: session?.user?.id?.substring(0, 8) + "...",
      teamId: userTeam?.id?.substring(0, 8) + "...",
      isLoading,
      authError,
    })
  }, [session, userTeam, isLoading, authError])

  const filteredModels = modelsList.models.filter((model) => {
    if (process.env.NEXT_PUBLIC_HIDE_LOCAL_MODELS) {
      return model.providerId !== "ollama"
    }
    return true
  })

  const currentModel = filteredModels.find((model) => model.id === languageModel.model)
  const currentTemplate = selectedTemplate === "auto" ? templates : { [selectedTemplate]: templates[selectedTemplate] }
  const lastMessage = messages[messages.length - 1]

  const {
    object,
    submit,
    isLoading: isSubmitting,
    stop,
    error,
  } = useObject({
    api: "/api/chat",
    schema,
    onError: (error) => {
      console.error("[useObject] Error:", error)

      // Enhanced error parsing
      let errorData: any = {}
      let errorCode = "UNKNOWN_ERROR"
      let errorMsg = error.message || "An unexpected error occurred"

      try {
        // Try to parse JSON error response
        const errorText = error.message || ""
        const jsonMatch = errorText.match(/\{.*\}/)
        if (jsonMatch) {
          errorData = JSON.parse(jsonMatch[0])
          errorCode = errorData.code || "UNKNOWN_ERROR"
          errorMsg = errorData.error || errorText
        } else if (errorText.includes("Internal Server Error")) {
          errorCode = "INTERNAL_SERVER_ERROR"
          errorMsg = "Internal server error occurred. Please try again."
        } else if (errorText.includes("fetch")) {
          errorCode = "NETWORK_ERROR"
          errorMsg = "Network error. Please check your connection and try again."
        }
      } catch (parseError) {
        console.warn("[useObject] Failed to parse error response:", parseError)
      }

      console.log("[useObject] Processed error:", { errorCode, errorMsg, requestId: currentRequestId })

      // Handle specific error types
      switch (errorCode) {
        case "MISSING_AUTH":
        case "AUTH_ERROR":
          setErrorMessage("Authentication error: Please sign out and sign in again to refresh your session.")
          break

        case "RATE_LIMITED":
        case "PROVIDER_RATE_LIMITED":
          setIsRateLimited(true)
          setErrorMessage("Rate limit exceeded. Please try again later or use your own API key.")
          break

        case "ACCESS_DENIED":
          setErrorMessage("Access denied. Please check your API key configuration.")
          break

        case "NETWORK_ERROR":
        case "TIMEOUT_ERROR":
          setErrorMessage("Network error. Please check your connection and try again.")
          break

        case "SERVICE_UNAVAILABLE":
        case "PROVIDER_OVERLOADED":
          setErrorMessage("AI service is temporarily unavailable. Please try again in a few moments.")
          break

        case "MODEL_NOT_FOUND":
          setErrorMessage("The selected model is not available. Please choose a different model.")
          break

        case "MODEL_INIT_ERROR":
          setErrorMessage("Failed to initialize the AI model. Please try a different model or check your API key.")
          break

        case "VALIDATION_ERROR":
          setErrorMessage("Invalid request data. Please refresh the page and try again.")
          break

        case "INTERNAL_SERVER_ERROR":
        case "INTERNAL_ERROR":
        default:
          setErrorMessage(
            errorMsg.includes("Internal")
              ? "Server error occurred. Please try again or contact support if the issue persists."
              : errorMsg,
          )
          break
      }

      // Clear loading states on error
      setIsPreviewLoading(false)
      setCurrentTab("code")

      // Log error for analytics
      posthog.capture("chat_error", {
        errorCode,
        errorMessage: errorMsg,
        provider: currentModel?.providerId,
        model: currentModel?.id,
        requestId: currentRequestId,
      })
    },
    onFinish: async ({ object: completedFragment, error }) => {
      if (error) {
        console.error("[useObject] Finished with error:", error)
        setIsPreviewLoading(false)
        return
      }

      if (!completedFragment) {
        console.warn("[useObject] No fragment returned")
        setIsPreviewLoading(false)
        return
      }

      console.log("[useObject] Fragment generation completed:", {
        template: completedFragment.template,
        hasFiles: !!(completedFragment.files && completedFragment.files.length > 0),
        requestId: currentRequestId,
      })

      posthog.capture("fragment_generated", {
        template: completedFragment.template,
        requestId: currentRequestId,
      })

      // Check if this is a code-only template (no sandbox needed)
      if (completedFragment.template === "codinit-engineer") {
        console.log("[useObject] CodinIT Engineer template - no sandbox needed")
        setResult(undefined)
        setCurrentTab("code")
        setIsPreviewLoading(false)
        return
      }

      // Create sandbox for other templates
      setIsPreviewLoading(true)
      try {
        console.log("[useObject] Creating sandbox for template:", completedFragment.template)
        
        const sandboxPayload = {
          fragment: completedFragment,
          userID: session?.user?.id,
          teamID: userTeam?.id,
          accessToken: session?.access_token,
        }

        console.log("[useObject] Sandbox payload:", {
          template: sandboxPayload.fragment.template,
          userID: sandboxPayload.userID?.substring(0, 8) + "...",
          teamID: sandboxPayload.teamID?.substring(0, 8) + "...",
          hasFiles: !!(sandboxPayload.fragment.files && sandboxPayload.fragment.files.length > 0),
          filesCount: sandboxPayload.fragment.files?.length || 0,
        })

        const response = await fetch("/api/sandbox", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sandboxPayload),
        })

        const responseData = await response.json()

        if (!response.ok) {
          console.error("[useObject] Sandbox creation failed:", {
            status: response.status,
            statusText: response.statusText,
            data: responseData,
          })
          throw new Error(responseData.error || `Sandbox API error: ${response.status}`)
        }

        console.log("[useObject] Sandbox created successfully:", {
          sbxId: responseData.sbxId,
          template: responseData.template,
          url: responseData.url,
        })

        posthog.capture("sandbox_created", {
          url: responseData.url,
          template: responseData.template,
          requestId: currentRequestId,
        })

        setResult(responseData)
        setMessage({ result: responseData })
        setCurrentTab("fragment")
      } catch (sandboxError: any) {
        console.error("[useObject] Sandbox creation failed:", sandboxError)
        setErrorMessage(`Failed to create sandbox: ${sandboxError.message}`)
        setResult(undefined)
        setCurrentTab("code")
      } finally {
        setIsPreviewLoading(false)
      }
    },
  })

  // Update fragment and messages when object changes
  useEffect(() => {
    if (!object) return

    console.log("[useObject] Object updated:", {
      template: object.template,
      hasFiles: !!(object.files && object.files.length > 0),
      codeFinished: object.code_finished,
    })

    setFragment(object)

    // Update messages with current fragment state
    setMessages((prevMessages) => {
      const newAssistantContent: Message["content"] = [
        { type: "text", text: object.commentary || "Generating code..." }
      ]

      // Add code block if there's file content
      if (object.files?.[0]?.file_content) {
        newAssistantContent.push({ type: "code", text: object.files[0].file_content })
      }

      const currentLastMessage = prevMessages.length > 0 ? prevMessages[prevMessages.length - 1] : null

      if (!currentLastMessage || currentLastMessage.role !== "assistant") {
        return [...prevMessages, { role: "assistant", content: newAssistantContent, object }]
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

  useEffect(() => {
    if (error) {
      console.error("[useObject] Stopping due to error:", error)
      stop()
    }
  }, [error, stop])

  async function handleSubmitAuth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Check if still loading auth state
    if (isLoading) {
      console.log("[handleSubmitAuth] Still loading auth state")
      return
    }

    if (!session) {
      console.log("[handleSubmitAuth] No session, opening auth dialog")
      return setAuthDialog(true)
    }

    // Enhanced validation with better error messages
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

    // Generate request ID for tracking
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

    // Capture current messages snapshot before queuing the state update
    const currentMessagesSnapshot = messages
    setMessages((prevMessages) => [...prevMessages, newUserMessage])

    // Use snapshot + new message for the API call
    const messagesForApi = [...currentMessagesSnapshot, newUserMessage]

    const submitData = {
      userID: session.user.id,
      teamID: userTeam.id,
      messages: toAISDKMessages(messagesForApi),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
    }

    console.log("[handleSubmitAuth] Submitting request:", {
      requestId,
      userID: submitData.userID.substring(0, 8) + "...",
      teamID: submitData.teamID.substring(0, 8) + "...",
      messagesCount: submitData.messages.length,
      model: submitData.model.id,
      provider: submitData.model.providerId,
      template: selectedTemplate,
    })

    try {
      submit(submitData)

      setChatInput("")
      setFiles([])
      setCurrentTab("code")
      setErrorMessage("")
      setIsRateLimited(false)

      posthog.capture("chat_submit", {
        template: selectedTemplate,
        model: languageModel.model,
        requestId,
      })
    } catch (error: any) {
      console.error("[handleSubmitAuth] Submit error:", error)
      setErrorMessage("Failed to submit request. Please try again.")
    }
  }

  function retry() {
    if (!session?.user?.id || !userTeam?.id) {
      console.error("[retry] Missing authentication data")
      setErrorMessage("Authentication error. Please sign out and sign in again.")
      return
    }

    if (!currentModel) {
      console.error("[retry] No model selected")
      setErrorMessage("Please select a model before retrying.")
      return
    }

    // Generate new request ID for retry
    const requestId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setCurrentRequestId(requestId)

    setErrorMessage("")
    setIsRateLimited(false)
    setIsPreviewLoading(false)

    const submitData = {
      userID: session.user.id,
      teamID: userTeam.id,
      messages: toAISDKMessages(messages),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
    }

    console.log("[retry] Retrying request:", {
      requestId,
      messagesCount: submitData.messages.length,
      model: submitData.model.id,
    })

    submit(submitData)
  }

  function handleSaveInputChange(e: React.ChangeEvent<HTMLTextAreaElement> | React.ChangeEvent<HTMLInputElement>) {
    setChatInput(e.target.value)
  }

  function handleFileChange(change: SetStateAction<File[]>) {
    setFiles(change)
  }

  function logout() {
    supabase ? supabase.auth.signOut() : console.warn("Supabase is not initialized")
  }

  function handleLanguageModelChange(e: LLMModelConfig) {
    setLanguageModel({ ...languageModel, ...e })
  }

  function handleSocialClick(target: "github" | "x" | "discord") {
    if (target === "github") {
      window.open("https://github.com/your-username/your-repo-name", "_blank")
    } else if (target === "x") {
      window.open("https://x.com/your-twitter-handle", "_blank")
    } else if (target === "discord") {
      window.open("https://discord.gg/your-discord-invite", "_blank")
    }

    posthog.capture(`${target}_click`)
  }

  function handleClearChat() {
    stop()
    setChatInput("")
    setFiles([])
    setMessages([])
    setFragment(undefined)
    setResult(undefined)
    setCurrentTab("code")
    setIsPreviewLoading(false)
    setErrorMessage("")
    setIsRateLimited(false)
    setCurrentRequestId(null)
  }

  function setCurrentPreview(preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) {
    setFragment(preview.fragment)
    setResult(preview.result)
  }

  function handleUndo() {
    if (messages.length > 1) {
      setMessages((previousMessages) => [...previousMessages.slice(0, -2)])
      setCurrentPreview({ fragment: undefined, result: undefined })
      setErrorMessage("")
      setIsPreviewLoading(false)
    }
  }

  function handleRetryAuth() {
    if (supabase) {
      supabase.auth.signOut().then(() => {
        setTimeout(() => setAuthDialog(true), 500)
      })
    }
  }

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <main className="flex min-h-screen max-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <div className="flex h-screen max-h-screen">
      {/* Sidebar and main content area */}
      <SidebarProvider>
      <Sidebar>
        {/* Sidebar content */}
      </Sidebar>
      <div className="flex flex-1 min-h-0">
        {/* Main chat area */}
        <div className={`flex-1 grid w-full min-h-0 ${fragment ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
        {/* AuthDialog */}
        {supabase && (
          <AuthDialog open={isAuthDialogOpen} setOpen={setAuthDialog} view={authView} supabase={supabase} />
        )}

        {/* Chat Area */}
        <div className="flex flex-col w-full max-w-4xl max-h-full mx-auto px-4 overflow-y-auto">
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
          <Chat messages={messages} isLoading={isSubmitting} setCurrentPreview={setCurrentPreview} />
          <div className="mt-auto">
          <VercelV0Chat
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
            // ChatPicker props
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelectedTemplateChange={setSelectedTemplate}
            models={filteredModels}
            languageModel={languageModel}
            onLanguageModelChange={handleLanguageModelChange}
            // ChatSettings props
            apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
            baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
          />
          </div>
        </div>

        {/* Preview Area: only shown if fragment exists */}
        {fragment && (
          <div className="hidden md:flex md:flex-col max-h-full overflow-y-auto">
          <Preview
            teamID={userTeam?.id}
            accessToken={session?.access_token}
            selectedTab={currentTab}
            onSelectedTabChange={setCurrentTab}
            isChatLoading={isSubmitting}
            isPreviewLoading={isPreviewLoading}
            fragment={fragment}
            result={result as ExecutionResult}
            onClose={() => {
            setFragment(undefined)
            setResult(undefined)
            setCurrentTab("code")
            }}
          />
          </div>
        )}
        </div>
      </div>
      </SidebarProvider>
    </div>
  )
}
