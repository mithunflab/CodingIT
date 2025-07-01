'use client'

import { ViewType } from '@/components/auth'
import { AuthDialog } from '@/components/auth-dialog'
import { Chat } from '@/components/chat'
import { ChatInput } from '@/components/chat-input'
import { ChatPicker } from '@/components/chat-picker'
import { ChatSettings } from '@/components/chat-settings'
import { NavBar } from '@/components/navbar'
import { Preview } from '@/components/preview'
import Sidebar from '@/components/sidebar'
import { useAuth } from '@/lib/auth'
import { Project, createProject, saveMessage, getProjectMessages, generateProjectTitle } from '@/lib/database'
import { Message, toAISDKMessages, toMessageImage } from '@/lib/messages'
import { LLMModelConfig } from '@/lib/models'
import modelsList from '@/lib/models.json'
import { FragmentSchema, fragmentSchema as schema } from '@/lib/schema'
import { supabase } from '@/lib/supabase'
import templates, { TemplateId } from '@/lib/templates'
import { ExecutionResult } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DeepPartial } from 'ai'
import { experimental_useObject as useObject } from 'ai/react'
import { usePostHog } from 'posthog-js/react'
import { SetStateAction, useCallback, useEffect, useState } from 'react'
import { useLocalStorage } from 'usehooks-ts'

export default function Home() {
  const [chatInput, setChatInput] = useLocalStorage('chat', '')
  const [files, setFiles] = useState<File[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<'auto' | TemplateId>('auto')
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>(
    'languageModel',
    {
      model: 'claude-3-5-sonnet-latest',
    },
  )

  const posthog = usePostHog()

  const [result, setResult] = useState<ExecutionResult>()
  const [messages, setMessages] = useState<Message[]>([])
  const [fragment, setFragment] = useState<DeepPartial<FragmentSchema>>()
  const [currentTab, setCurrentTab] = useState<'code' | 'fragment'>('code')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isAuthDialogOpen, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState<ViewType>('sign_in')
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Project management state
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoadingProject, setIsLoadingProject] = useState(false)

  // Sidebar open state
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const { session, userTeam } = useAuth(setAuthDialog, setAuthView)

  const filteredModels = modelsList.models.filter((model) => {
    if (process.env.NEXT_PUBLIC_HIDE_LOCAL_MODELS) {
      return model.providerId !== 'ollama'
    }
    return true
  })

  const currentModel = filteredModels.find(
    (model) => model.id === languageModel.model,
  )
  const currentTemplate =
    selectedTemplate === 'auto'
      ? templates
      : { [selectedTemplate]: templates[selectedTemplate] }
  const lastMessage = messages[messages.length - 1]

  useEffect(() => {
    if (lastMessage) {
      console.log('Last message:', lastMessage)
    }
  }, [lastMessage])

  const { object, submit, isLoading, stop, error } = useObject({
    api: '/api/chat',
    schema,
    onError: (error) => {
      console.error('Error submitting request:', error)
      if (error.message.includes('limit')) {
        setIsRateLimited(true)
      }
      setErrorMessage(error.message)
    },
    onFinish: async ({ object: fragment, error }) => {
      if (!error) {
        setIsPreviewLoading(true)
        posthog.capture('fragment_generated', {
          template: fragment?.template,
        })

        const response = await fetch('/api/sandbox', {
          method: 'POST',
          body: JSON.stringify({
            fragment,
            userID: session?.user?.id,
            teamID: userTeam?.id,
            accessToken: session?.access_token,
          }),
        })

        const result = await response.json()
        posthog.capture('sandbox_created', { url: result.url })

        setResult(result)
        setCurrentPreview({ fragment, result })
        setMessage({ result })
        setCurrentTab('fragment')
        setIsPreviewLoading(false)
      }
    },
  })

  useEffect(() => {
    async function loadProjectMessages() {
      if (!currentProject) {
        setMessages([])
        return
      }

      setIsLoadingProject(true)
      const projectMessages = await getProjectMessages(currentProject.id)
      setMessages(projectMessages)
      setIsLoadingProject(false)
    }

    loadProjectMessages()
  }, [currentProject])

  useEffect(() => {
    async function saveMessagesToDb() {
      if (!currentProject || !session || messages.length === 0) return

      const lastMessage = messages[messages.length - 1]
      const sequenceNumber = messages.length - 1

      await saveMessage(currentProject.id, lastMessage, sequenceNumber)
    }

    if (messages.length > 0 && currentProject && session) {
      saveMessagesToDb()
    }
  }, [messages, currentProject, session])

  useEffect(() => {
    if (object) {
      setFragment(object)
      const content: Message['content'] = [
        { type: 'text', text: object.commentary || '' },
        { type: 'code', text: object.code || '' },
      ]
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1]
        if (!lastMessage || lastMessage.role !== 'assistant') {
          return [
            ...prev,
            {
              role: 'assistant',
              content,
              object,
            },
          ]
        } else {
          const newMessages = [...prev]
          newMessages[prev.length - 1] = {
            ...lastMessage,
            content,
            object,
          }
          return newMessages
        }
      })
    }
  }, [object])

  useEffect(() => {
    if (error) stop()
  }, [error, stop])

  function setMessage(message: Partial<Message>, index?: number) {
    setMessages((previousMessages) => {
      const updatedMessages = [...previousMessages]
      updatedMessages[index ?? previousMessages.length - 1] = {
        ...previousMessages[index ?? previousMessages.length - 1],
        ...message,
      }
      return updatedMessages
    })
  }

  async function handleSubmitAuth(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!session) {
      return setAuthDialog(true)
    }

    if (isLoading) {
      stop()
    }

    // Create new project if none exists
    if (!currentProject) {
      const title = await generateProjectTitle(chatInput)
      const newProject = await createProject(title, selectedTemplate === 'auto' ? undefined : selectedTemplate)
      if (newProject) {
        setCurrentProject(newProject)
      }
    }

    const content: Message['content'] = [{ type: 'text', text: chatInput }]
    const images = await toMessageImage(files)

    if (images.length > 0) {
      images.forEach((image) => {
        content.push({ type: 'image', image })
      })
    }

    const newMessage: Message = {
      role: 'user',
      content,
    }
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)

    submit({
      userID: session?.user?.id,
      teamID: userTeam?.id,
      messages: toAISDKMessages(updatedMessages),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
    })

    setChatInput('')
    setFiles([])
    setCurrentTab('code')

    posthog.capture('chat_submit', {
      template: selectedTemplate,
      model: languageModel.model,
    })
  }

  function retry() {
    submit({
      userID: session?.user?.id,
      teamID: userTeam?.id,
      messages: toAISDKMessages(messages),
      template: currentTemplate,
      model: currentModel,
      config: languageModel,
    })
  }

  const handleSaveInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setChatInput(e.target.value)
    },
    [setChatInput],
  )

  const handleFileChange = useCallback((change: SetStateAction<File[]>) => {
    setFiles(change)
  }, [])

  function logout() {
    supabase
      ? supabase.auth.signOut()
      : console.warn('Supabase is not initialized')
  }

  function handleLanguageModelChange(e: LLMModelConfig) {
    setLanguageModel({ ...languageModel, ...e })
  }

  function handleSocialClick(target: 'github' | 'x' | 'discord') {
    if (target === 'github') {
      window.open('https://github.com/Gerome-Elassaad/CodingIT', '_blank')
    } else if (target === 'x') {
      window.open('https://x.com/codinit_dev', '_blank')
    } else if (target === 'discord') {
      window.open('https://discord.gg/', '_blank')
    }

    posthog.capture(`${target}_click`)
  }

  function handleClearChat() {
    stop()
    setChatInput('')
    setFiles([])
    setMessages([])
    setFragment(undefined)
    setResult(undefined)
    setCurrentTab('code')
    setIsPreviewLoading(false)
    setCurrentProject(null)
  }

  function setCurrentPreview(preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) {
    setFragment(preview.fragment)
    setResult(preview.result)
  }

  function handleUndo() {
    setMessages((previousMessages) => [...previousMessages.slice(0, -2)])
    setCurrentPreview({ fragment: undefined, result: undefined })
  }

  function handleProjectSelect(project: Project | null) {
    setCurrentProject(project)
    if (!project) {
      handleClearChat()
    }
  }

  async function handleNewProject() {
    setCurrentProject(null)
    handleClearChat()
  }

  return (
    <main className="flex min-h-screen max-h-screen">
      {supabase && (
        <AuthDialog
          open={isAuthDialogOpen}
          setOpen={setAuthDialog}
          view={authView}
          supabase={supabase}
        />
      )}

      <Sidebar
        onStateChange={setSidebarOpen}
        userName={userTeam?.name}
        userPlan={userTeam?.tier}
      />


      {/* Main content with left margin to account for collapsed sidebar */}
      <div className={cn(
        "grid w-full md:grid-cols-2 transition-all duration-300",
        session ? "ml-16" : "ml-0"
      )}>
        <div
          className={`flex flex-col w-full max-h-full max-w-[800px] mx-auto px-4 overflow-auto ${fragment ? 'col-span-1' : 'col-span-2'}`}
        >
          <NavBar
            session={session}
            showLogin={() => setAuthDialog(true)}
            signOut={logout}
            onSocialClick={handleSocialClick}
            onClear={handleClearChat}
            canClear={messages.length > 0}
            canUndo={messages.length > 1 && !isLoading}
            onUndo={handleUndo}
          />
          
          {isLoadingProject ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading project...</div>
            </div>
          ) : (
            <Chat
              messages={messages}
              isLoading={isLoading}
              setCurrentPreview={setCurrentPreview}
            />
          )}
          
          <ChatInput
            retry={retry}
            isErrored={error !== undefined}
            errorMessage={errorMessage}
            isLoading={isLoading}
            isRateLimited={isRateLimited}
            stop={stop}
            input={chatInput}
            handleInputChange={handleSaveInputChange}
            handleSubmit={handleSubmitAuth}
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
              languageModel={languageModel}
              onLanguageModelChange={handleLanguageModelChange}
              apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
              baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
            />
          </ChatInput>
        </div>
        <Preview
          teamID={userTeam?.id}
          accessToken={session?.access_token}
          selectedTab={currentTab}
          onSelectedTabChange={setCurrentTab}
          isChatLoading={isLoading}
          isPreviewLoading={isPreviewLoading}
          fragment={fragment}
          result={result as ExecutionResult}
          onClose={() => setFragment(undefined)}
        />
      </div>
    </main>
  )
}