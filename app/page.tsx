"use client"

import type React from "react"

import type { ViewType } from "@/components/auth"
import { AuthDialog } from "@/components/auth-dialog"
import { Chat } from "@/components/chat"
import { EnhancedChatInput } from "@/components/enhanced-chat-input"
import { ChatPicker } from "@/components/chat-picker"
import { ChatSettings } from "@/components/chat-settings"
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

// +++ ADDED CONSTANTS AND HELPER FUNCTIONS START +++
const TEMPLATE_IDS = {
  CODE_INTERPRETER_V1: "code-interpreter-v1",
  NEXTJS_DEVELOPER: "nextjs-developer",
  VUE_DEVELOPER: "vue-developer",
  STREAMLIT_DEVELOPER: "streamlit-developer",
  GRADIO_DEVELOPER: "gradio-developer",
  CODINIT_ENGINEER: "codinit-engineer",
} as const;

type ParsedApiError = { code: string; message: string; rawData: any };

const parseApiError = (error: Error | any): ParsedApiError => {
  let errorData: any = {};
  let errorCode = "UNKNOWN_ERROR"; // Default error code
  let errorMessage = error.message || "An unexpected error occurred";

  try {
    const errorText = error.message || "";
    // Attempt to parse a JSON string if present in the error message
    const jsonMatch = errorText.match(/\{[\s\S]*\}/); // Replaced 's' flag with [\s\S] for broader compatibility
    if (jsonMatch && jsonMatch[0]) {
      errorData = JSON.parse(jsonMatch[0]);
      errorCode = errorData.code || errorCode;
      errorMessage = errorData.error || errorData.message || errorMessage; // Prefer specific error fields
    } else if (errorText.includes("Internal Server Error")) {
      errorCode = "INTERNAL_SERVER_ERROR";
      errorMessage = "Internal server error occurred. Please try again.";
    } else if (errorText.includes("fetch") || errorText.toLowerCase().includes("networkerror")) {
      errorCode = "NETWORK_ERROR";
      errorMessage = "Network error. Please check your connection and try again.";
    } else if (error.name === 'AbortError') {
      errorCode = "REQUEST_ABORTED";
      errorMessage = "The request was cancelled.";
    }
    // Add more specific error text checks if needed
  } catch (parseError) {
    console.warn("[parseApiError] Failed to parse error response:", parseError, "Original error message:", error.message);
    // Fallback to original error message if parsing fails, ensure errorCode is set
    errorCode = errorCode === "UNKNOWN_ERROR" && error.message?.includes("rate limit") ? "RATE_LIMITED" : errorCode;
    errorMessage = error.message || "An unexpected error occurred after failing to parse error details.";
  }
  return { code: errorCode, message: errorMessage, rawData: errorData };
};

const API_ERROR_DISPLAY_MESSAGES: Record<string, string> = {
  MISSING_AUTH: "Authentication error: Please sign out and sign in again to refresh your session.",
  AUTH_ERROR: "Authentication error: Please sign out and sign in again to refresh your session.",
  RATE_LIMITED: "Rate limit exceeded. Please try again later or use your own API key.",
  PROVIDER_RATE_LIMITED: "Rate limit exceeded. Please try again later or use your own API key.",
  ACCESS_DENIED: "Access denied. Please check your API key configuration.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  TIMEOUT_ERROR: "Network error or timeout. Please check your connection and try again.",
  SERVICE_UNAVAILABLE: "AI service is temporarily unavailable. Please try again in a few moments.",
  PROVIDER_OVERLOADED: "AI service is temporarily unavailable. Please try again in a few moments.",
  MODEL_NOT_FOUND: "The selected model is not available. Please choose a different model.",
  MODEL_INIT_ERROR: "Failed to initialize the AI model. Please try a different model or check your API key.",
  VALIDATION_ERROR: "Invalid request data. Please refresh the page and try again.",
  INTERNAL_SERVER_ERROR: "A server error occurred. Please try again or contact support if the issue persists.",
  INTERNAL_ERROR: "An internal error occurred. Please try again or contact support if the issue persists.",
  REQUEST_ABORTED: "The operation was cancelled.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
};

const getDisplayErrorMessageForCode = (errorCode: string, specificMessage?: string): string => {
  const defaultMessage = API_ERROR_DISPLAY_MESSAGES[errorCode] || API_ERROR_DISPLAY_MESSAGES.UNKNOWN_ERROR;

  if (
    ["INTERNAL_SERVER_ERROR", "INTERNAL_ERROR", "UNKNOWN_ERROR"].includes(errorCode) &&
    specificMessage &&
    typeof specificMessage === "string" &&
    specificMessage.trim().length > 10 &&
    !/internal server error/i.test(specificMessage) &&
    !/an unexpected error occurred/i.test(specificMessage) &&
    !/status code [45]\d\d/i.test(specificMessage)
  ) {
    return specificMessage;
  }

  return defaultMessage;
};

async function handleSandboxCreation(
  completedFragment: DeepPartial<FragmentSchema>,
  sessionData: { userId?: string; teamId?: string; accessToken?: string } | undefined,
  posthogInstance: ReturnType<typeof usePostHog>,
  currentRequestIdValue: string | null
): Promise<ExecutionResult> {
  const sandboxPayload = {
    fragment: completedFragment,
    userID: sessionData?.userId,
    teamID: sessionData?.teamId,
    accessToken: sessionData?.accessToken,
    TEMPLATE_IDS: TEMPLATE_IDS,
  };

  console.log("[handleSandboxCreation] Creating sandbox with payload:", {
    template: sandboxPayload.fragment.template,
    userID: sandboxPayload.userID ? sandboxPayload.userID.substring(0, 8) + "..." : "N/A",
    teamID: sandboxPayload.teamID ? sandboxPayload.teamID.substring(0, 8) + "..." : "N/A",
    hasFiles: !!(sandboxPayload.fragment.files && sandboxPayload.fragment.files.length > 0),
    filesCount: sandboxPayload.fragment.files?.length || 0,
  });

  const response = await fetch("/api/sandbox", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sandboxPayload),
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error("[handleSandboxCreation] Sandbox creation failed:", {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
    });
    // Ensure the error thrown has a meaningful message for the user
    const apiErrorMessage = responseData.error || responseData.message || `Sandbox API error: ${response.status}`;
    throw new Error(apiErrorMessage);
  }

  console.log("[handleSandboxCreation] Sandbox created successfully:", {
    sbxId: responseData.sbxId,
    template: responseData.template,
    url: responseData.url,
  });

  posthogInstance.capture("sandbox_created", {
    url: responseData.url,
    template: responseData.template,
    requestId: currentRequestIdValue,
  });
  return responseData as ExecutionResult;
}

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

export default function Home() {
  const [chatInput, setChatInput] = useLocalStorage("chat", "")
  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<"auto" | TemplateId>("auto")
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>("languageModel", {
    model: "gemini-2.5-flash-preview-05-20"
  })

  const posthog = usePostHog()

  const [result, setResult] = useState<ExecutionResult>()
  const [messages, setMessages] = useState<Message[]>([])
  const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>()
  const [currentTab, setCurrentTab] = useState<"code" | "preview">("code") // Changed 'fragment' to 'preview'
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<ViewType>("sign_in")
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null)
  const [projectContext, setProjectContext] = useState<{
    files: File[]
    analysis: ProjectAnalysis | null
  }>({ files: [], analysis: null })

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
    console.log("[Enhanced Chat] Auth state:", {
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
  // const lastMessage = messages[messages.length - 1]; // Removed unused variable

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
      console.error("[useObject] Error in onError:", error); // Added more specific log
      const parsedError = parseApiError(error);
      const displayMessage = getDisplayErrorMessageForCode(parsedError.code, parsedError.message);

      console.log("[useObject] Processed error in onError:", { 
        errorCode: parsedError.code, 
        errorMessage: parsedError.message, 
        displayMessage,
        requestId: currentRequestId 
      });

      setErrorMessage(displayMessage);

      if (parsedError.code === "RATE_LIMITED" || parsedError.code === "PROVIDER_RATE_LIMITED") {
        setIsRateLimited(true);
      }

      setIsPreviewLoading(false);
      setCurrentTab("code");

      posthog.capture("chat_error", {
        errorCode: parsedError.code,
        errorMessage: parsedError.message,
        provider: currentModel?.providerId,
        model: currentModel?.id,
        requestId: currentRequestId,
      });
    },
    onFinish: async ({ object: completedFragment, error }) => {
      if (error) {
        console.error("[useObject] Finished with error (also see onError for details):", error);
        const parsedError = parseApiError(error);
        const displayMessage = getDisplayErrorMessageForCode(parsedError.code, parsedError.message);
        setErrorMessage(displayMessage);
        setIsPreviewLoading(false);
        setCurrentTab("code");
        return;
      }

      if (!completedFragment) {
        console.warn("[useObject] No fragment returned onFinish");
        setErrorMessage("Failed to generate content. The AI model did not return a valid response.");
        setIsPreviewLoading(false);
        setCurrentTab("code");
        return;
      }

      // Normalize template ID if it's the known incorrect variant from the AI
      if (completedFragment.template === "codinit template") {
        console.warn(
          `[useObject] Normalizing template ID from "codinit template" to "${TEMPLATE_IDS.CODINIT_ENGINEER}"`,
        );
        completedFragment.template = TEMPLATE_IDS.CODINIT_ENGINEER;
      }

      console.log("[useObject] Fragment generation completed:", {
        template: completedFragment.template,
        hasFiles: !!(completedFragment.files && completedFragment.files.length > 0),
        requestId: currentRequestId,
      });

      posthog.capture("fragment_generated", {
        template: completedFragment.template,
        requestId: currentRequestId,
      });

      if (completedFragment.template === TEMPLATE_IDS.CODINIT_ENGINEER) {
        console.log("[useObject] CodinIT Engineer template - no sandbox needed");
        setResult(undefined);
        setCurrentTab("code");
        setIsPreviewLoading(false);
        return;
      }

      setIsPreviewLoading(true);
      try {
        const sessionData = {
          userId: session?.user?.id,
          teamId: userTeam?.id,
          accessToken: session?.access_token,
        };
        const sandboxResult = await handleSandboxCreation(
          completedFragment, 
          sessionData, 
          posthog, 
          currentRequestId
        );
        
        setResult(sandboxResult);
        setMessage({ result: sandboxResult });

        if (sandboxResult.template !== TEMPLATE_IDS.CODE_INTERPRETER_V1) {
          // This is not a code-interpreter template, so we might expect a URL for preview.
          // Explicitly check for 'url' property and its type.
          if ('url' in sandboxResult && typeof (sandboxResult as any).url === 'string' && (sandboxResult as any).url) {
            setCurrentTab("preview");
          } else {
            // Non-interpreter template but no valid URL found.
            console.warn("[onFinish] Non-interpreter template but no valid URL on sandboxResult, defaulting to code tab. Template:", sandboxResult.template);
            setCurrentTab("code");
          }
        } else {
          // This is TEMPLATE_IDS.CODE_INTERPRETER_V1, which defaults to the code tab.
          setCurrentTab("code");

        }
      } catch (sandboxError: any) {
        console.error("[useObject] Sandbox creation failed in onFinish:", sandboxError);
        let parsedSandboxError: ParsedApiError | null = null;
        if (sandboxError && typeof sandboxError === "object" && sandboxError.message) {
          parsedSandboxError = parseApiError(sandboxError);
        }
        const displayError = getDisplayErrorMessageForCode(
          parsedSandboxError?.code || "INTERNAL_ERROR",
          parsedSandboxError?.message || sandboxError.message || "Failed to create dev environment."
        );
        setErrorMessage(displayError);
        setResult(undefined);
        setCurrentTab("code");
      } finally {
        setIsPreviewLoading(false);
      }
    },
  })

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

      if (object.files?.[0]?.file_content) {
        newAssistantContent.push({ type: "code", text: `\`\`\`\n${object.files[0].file_content}\n\`\`\`` })
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

  async function handleSubmitAuth(
    e: React.FormEvent<HTMLFormElement>, 
    projectFiles?: File[], 
    projectAnalysis?: ProjectAnalysis
  ) {
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

    const currentMessagesSnapshot = [...messages];
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

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
    })

    try {
      submit(submitData)

      setChatInput("")
      setFiles([])
      setCurrentTab("code")
      setErrorMessage("")
      setIsRateLimited(false)

      // Store project context for future reference
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
      // Include project context in retry
      uploadedFiles: projectContext.files.length > 0 ? projectContext.files : undefined,
      projectAnalysis: projectContext.analysis,
    }

    console.log("[retry] Retrying request:", {
      requestId,
      messagesCount: submitData.messages.length,
      model: submitData.model.id,
      hasProjectContext: !!(projectContext.files.length > 0),
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
      window.open("https://github.com/Gerome-Elassaad/CodinIT", "_blank")
    } else if (target === "x") {
      window.open("https://x.com/codinit_dev", "_blank")
    } else if (target === "discord") {
      window.open("https://discord.gg/codinit", "_blank")
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
    setProjectContext({ files: [], analysis: null })
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
      {/* Main content area */}
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
                <ChatPicker
                  templates={templates}
                  selectedTemplate={selectedTemplate}
                  onSelectedTemplateChange={setSelectedTemplate}
                  models={filteredModels}
                  languageModel={languageModel}
                  onLanguageModelChange={handleLanguageModelChange}
                />
                <ChatSettings
                  apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
                  baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
                  languageModel={languageModel}
                  onLanguageModelChange={handleLanguageModelChange}
                />
              </EnhancedChatInput>
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
    </div>
  )
}
