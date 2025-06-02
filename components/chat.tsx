import { Message } from '@/lib/messages'
import { FragmentSchema } from '@/lib/schema'
import { ExecutionResult } from '@/lib/types'
import { DeepPartial } from 'ai'
import { LoaderIcon, Terminal } from 'lucide-react'
import { useEffect } from 'react'
import Image from 'next/image'

export function Chat({
  messages,
  isLoading,
  setCurrentPreview,
}: {
  messages: Message[]
  isLoading: boolean
  setCurrentPreview: (preview: {
    fragment: DeepPartial<FragmentSchema> | undefined
    result: ExecutionResult | undefined
  }) => void
}) {
  const messagesString = JSON.stringify(messages)
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  }, [messagesString])

  return (
    <div
      id="chat-container"
      className="flex flex-col pb-12 gap-2 overflow-y-auto max-h-full"
    >
      {messages.map((message: Message, index: number) => (
        <div
          className={`flex flex-col px-4 shadow-sm whitespace-pre-wrap ${message.role !== 'user' ? 'bg-accent border border-border text-accent-foreground py-4 rounded-2xl gap-4 w-full' : 'bg-primary/10 dark:bg-primary/20 text-primary-foreground py-2 rounded-xl gap-2 w-fit'} font-serif`}
          key={index}
        >
          {message.content.map((content, id) => {
            if (content.type === 'text') {
              return content.text
            }
            if (content.type === 'image') {
              return (
                <Image
                  key={id}
                  src={content.image}
                  alt="fragment"
                  width={48}
                  height={48}
                  className="mr-2 inline-block w-12 h-12 object-cover rounded-lg bg-card mb-2"
                />
              )
            }
          })}
          {message.object && (
            <div
              onClick={() =>
                setCurrentPreview({
                  fragment: message.object,
                  result: message.result,
                })
              }
              className="py-2 pl-2 w-full md:w-max flex items-center border border-border rounded-xl select-none hover:bg-accent/80 hover:cursor-pointer"
            >
              <div className="rounded-[0.5rem] w-10 h-10 bg-muted self-stretch flex items-center justify-center">
                <Terminal strokeWidth={2} className="text-primary" />
              </div>
              <div className="pl-2 pr-4 flex flex-col">
                <span className="font-bold font-sans text-sm text-primary">
                  {message.object.title}
                </span>
                <span className="font-sans text-sm text-muted-foreground">
                  Click to see fragment
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
      {isLoading && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <LoaderIcon strokeWidth={2} className="animate-spin w-4 h-4" />
          <span>Generating...</span>
        </div>
      )}
    </div>
  )
}
