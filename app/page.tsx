"use client"

import React, { ChangeEvent, FormEvent, SetStateAction } from "react" 
import { AuthDialog } from "@/components/auth-dialog"
import { Chat } from "@/components/chat"
import { EnhancedChatInput } from "@/components/enhanced-chat-input"
import { ChatPicker } from "@/components/chat-picker"
import { ChatSettings } from "@/components/chat-settings"
import { NavBar } from "@/components/navbar"
import { Preview } from "@/components/preview"
import { E2BToolsPanel } from "@/components/e2b-tools/E2BToolsPanel"
import { CommandPalette } from "@/components/ui/command-palette"
import { EditorCommandPalette } from "@/components/ui/editor-command-palette"
import { useProjectDialog } from "@/hooks/use-project-dialog"
import { useAuth } from "@/contexts/AuthContext"
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
import { useCallback, useEffect, useState } from "react"
import { useLocalStorage } from "usehooks-ts"
import { ViewType } from "@/components/auth/types"
import { parseApiError } from "@/lib/utils"
import { SettingsDialog } from "@/components/chat-sidebar/settings-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

export default function Home() {
  const posthog = usePostHog()

  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<ViewType>("sign_in")
  const { session, isLoading, userTeam } = useAuth()

  useProjectDialog()

  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState("")
  const [files, setFiles] = useState<File[]>([])
  
  const [selectedTemplate, setSelectedTemplate] = useLocalStorage<TemplateId>(
    "selectedTemplate", 
    "vue-developer"
  )
  
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>(
    "languageModel",
    modelsList.models[0] as LLMModelConfig
  )
  const [currentTab, setCurrentTab] = useState<"preview" | "editor">("preview")
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [] = useState<string>("")
  const [hasMounted, setHasMounted] = useState(false)
  const [, setProjectContext] = useState<{
    files: File[]
    analysis: ProjectAnalysis | null
  }>({ files: [], analysis: null })
  const [isE2BToolsModalOpen, setIsE2BToolsModalOpen] = useState(false)
  const [isEditorCommandPaletteOpen, setEditorCommandPaletteOpen] = useState(false)

  const handleToggleE2BToolsModal = () => {
    if (session && currentModel) { // Ensure user is authenticated and model is loaded
      setIsE2BToolsModalOpen(!isE2BToolsModalOpen);
    } else if (!session) {
      setAuthDialog(true); // Prompt login if not authenticated
    }
    // If model is not loaded, we might want to show a toast or disable the button,
    // but for now, opening the modal relies on the check within its render.
  };
  

  useEffect(() => {
    console.log("[Debug] Current template config:", {
      selectedTemplate,
      isDefaulting: selectedTemplate === "nextjs-developer",
      persistenceWorking: !!selectedTemplate
    })
  }, [selectedTemplate])

  let currentTemplateConfig: (typeof templates)[keyof typeof templates] | Record<string, any>;
  if (selectedTemplate in templates) {
    currentTemplateConfig = templates[selectedTemplate as keyof typeof templates];
  } else if (selectedTemplate === 'codinit-engineer') {
    console.warn(`Template ID '${selectedTemplate}' not found in templates.json. Using special fallback configuration.`);
    currentTemplateConfig = { 
      name: "CodinIT.dev Engineer (Fallback)", 
      lib: [], 
      files: {}, 
      instructions: "Default instructions for CodinIT.dev Engineer (fallback). Please define this template in templates.json if it's a standard persona.", 
      port: null 
    };
  } else {
    console.warn(`Unknown template ID: '${selectedTemplate}'. Using a very basic default config. Consider adding this template to templates.json.`);
    currentTemplateConfig = {
      name: `Unknown Template (${selectedTemplate})`,
      lib: [],
      files: {},
      instructions: `Configuration for template '${selectedTemplate}' not found.`,
      port: null
    };
  }

  const availableModels = modelsList.models.filter((model) =>
    !("providerId" in currentTemplateConfig) || model.providerId === (currentTemplateConfig as any).providerId
  )
  const currentModel = availableModels.find((model) => model.id === languageModel.model)

  
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
      setCurrentTab("preview")
    }, []),
  })

  
  const [fragment, setFragment] = useState<FragmentSchema | null>(null)
  const [result, setResult] = useState<ExecutionResult | undefined>()
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)

  useEffect(() => {
    console.log("Settings dialog state:", isSettingsDialogOpen)
  }, [isSettingsDialogOpen, setIsSettingsDialogOpen])

  
  const handleSocialClick = useCallback((platform: "github" | "discord" | "x") => { 
    const urls = {
      x: "https://twitter.com/intent/tweet?text=Check%20out%20this%20amazing%20AI%20App%20Builder!&url=https://codinit.dev", 
      github: "https://github.com/codinit-dev/ai-app-builder",
      discord: "https://discord.gg/codinit"
    }
    window.open(urls[platform], "_blank")
  }, [])

  const handleClearChat = useCallback(() => {
    setMessages([])
    setChatInput("")
    setFragment(null)
    setResult(undefined)
    setErrorMessage("")
    setFiles([])
    setProjectContext({ files: [], analysis: null })
    setCurrentTab("preview")
  }, [])

  const handleUndo = useCallback(() => {
    if (messages.length > 0) {
      const newMessages = messages.slice(0, -2) 
      setMessages(newMessages)
      const lastUserMessage = newMessages.findLast(m => m.role === 'user')
      if (lastUserMessage && lastUserMessage.content) {
        const textContent = lastUserMessage.content.find(c => c.type === 'text') as { type: "text"; text: string } | undefined; 
        if (textContent) {
          setChatInput(textContent.text)
        }
      } else {
        setChatInput("")
      }
      setFragment(null)
      setResult(undefined)
      setErrorMessage("")
    }
  }, [messages])


  const handlePreviewClose = useCallback(() => {
    setFragment(null)
    setResult(undefined)
  }, [])

  const handleSaveInputChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => { 
    setChatInput(e.target.value)
  }, [])

  const handleFileChange = useCallback((change: SetStateAction<File[]>) => { 
    setFiles(change)
  }, [])

  const handleLanguageModelChange = useCallback((newModel: LLMModelConfig) => {
    setLanguageModel(prevModel => ({ ...prevModel, ...newModel }))
  }, [setLanguageModel])

  const retry = useCallback(() => {
    if (fragment) {
      const form = document.querySelector("form") as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }
  }, [fragment])

  
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
        if (parsedError.code === "RATE_LIMIT_ERROR") {
          setIsRateLimited(true)
        }
        setResult(undefined)
        setCurrentTab("preview")
      } finally {
        setIsPreviewLoading(false)
      }
    }

    executeFragment()
  }, [fragment, session?.access_token, session?.user?.id, userTeam?.id])

  
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

  useEffect(() => {
    if (error) {
      console.error("[useObject] Stopping due to error:", error)
      stop()
    }
  }, [error, stop])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setEditorCommandPaletteOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSubmitAuth = useCallback(async (
    e: FormEvent<HTMLFormElement>, 
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

    
    const requestId = `req_${Date.now()}_${crypto.randomUUID()}`
    

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
      template: currentTemplateConfig,
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
      setCurrentTab("preview")
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
      console.error("[handleSubmitAuth] Submit error:", error)
      const parsedError = parseApiError(error)
      setErrorMessage(parsedError.message)
      if (parsedError.code === "RATE_LIMIT_ERROR") {
        setIsRateLimited(true)
      }
    }
  }, [
    isLoading,
    session,
    userTeam?.id,
    currentModel,
    isSubmitting,
    stop,
    chatInput,
    files,
    messages,
    currentTemplateConfig,
    languageModel,
    selectedTemplate,
    submit,
    posthog,
  ])

  const handleRetryAuth = useCallback(() => {
    console.log("[handleRetryAuth] Retrying authentication")
    setAuthView("sign_in")
    setAuthDialog(true)
  }, [])

  const fragmentFiles = fragment?.files?.map(file => {
    if (!file) return undefined
    return {
      name: file.file_name || file.file_path?.split('/').pop() || 'untitled',
      content: file.file_content || '',
      path: file.file_path || file.file_name || 'untitled'
    }
  }).filter((file): file is { name: string; content: string; path: string } => !!file && !!file.content && !file.content.includes('__pycache__'))

  const showPreviewPanel = fragment && hasMounted;

  let gridLayoutClass = "flex w-full"; 

  if (showPreviewPanel) {
    gridLayoutClass = "flex w-full md:grid md:grid-cols-2";
  }
  // If preview is not shown, it's a single column layout.

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex flex-1 overflow-hidden">
      <div className={gridLayoutClass}>
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
        
        <NavBar
          showLogin={() => setAuthDialog(true)}
          onSocialClick={handleSocialClick}
          onClear={handleClearChat}
          canClear={messages.length > 0}
          canUndo={messages.length > 1 && !isSubmitting}
          onUndo={handleUndo}
          onRetryAuth={handleRetryAuth}
          onOpenToolsModal={handleToggleE2BToolsModal}
        />

        {/* Chat Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Chat
          messages={messages}
          isLoading={isSubmitting}
          onFragmentSelect={(selectedFragment, selectedResult) => {
            setFragment(selectedFragment ? (selectedFragment as FragmentSchema) : null);
            setResult(selectedResult);
            if (selectedFragment?.files && selectedFragment.files.length > 0) {
            setCurrentTab("preview");
            } else {
            setCurrentTab("preview");
            }
          }}
          />
        </div>

        {/* Chat Input */}
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
            onRateLimit={() => setIsRateLimited(true)}
          >
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
            apiKeyConfigurable={process.env.NEXT_PUBLIC_NO_API_KEY_INPUT !== 'true'}
            baseURLConfigurable={process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT !== 'true'}
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
        
        {/* Preview Area (conditionally rendered) */}
        {showPreviewPanel && ( 
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

      {/* E2B Tools Modal */}
      {session && session.user && userTeam && currentModel && hasMounted && (
      <Dialog open={isE2BToolsModalOpen} onOpenChange={setIsE2BToolsModalOpen}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Tools Panel</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-auto p-6 pt-0">
          <E2BToolsPanel
          userID={session.user.id}
          teamID={userTeam.id}
          model={currentModel}
          config={languageModel}
          className="border-none shadow-none p-0"
          />
        </div>
        </DialogContent>
      </Dialog>
      )}
      
      {/* Command Palette */}
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
      onOpenSettings={() => setIsSettingsDialogOpen(true)}
      />

      {/* Settings Dialog */}
      {hasMounted && (
      <SettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
      />
      )}

      <EditorCommandPalette
        isOpen={isEditorCommandPaletteOpen}
        onOpenChange={setEditorCommandPaletteOpen}
        files={fragmentFiles || []}
      />
    </div>
  )
}
