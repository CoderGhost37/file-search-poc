'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef } from 'react'

import { ChatHeader } from './chat-header'
import { ChatInput } from './chat-input'
import { ChatMessages } from './chat-messages'
import { DataSourceSelectionDialog } from './data-source-selection-dialog'
import type { DataSource } from '@/lib/types'

interface ChatWindowProps {
  dataSources: DataSource[]
}

interface SelectedDataSource {
  id: string
  name: string
}

export function ChatWindow({ dataSources }: ChatWindowProps) {
  const [input, setInput] = useState<string>('')
  const [selectedDataSources, setSelectedDataSources] = useState<SelectedDataSource[]>([])
  const [chatStarted, setChatStarted] = useState(false)

  // Use a ref to hold the current selected data sources to avoid stale closure
  const selectedDataSourcesRef = useRef<SelectedDataSource[]>([])
  selectedDataSourcesRef.current = selectedDataSources

  const { messages, sendMessage, status, regenerate, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: async (url, init) => {
        const body = init?.body ? JSON.parse(init.body as string) : {}
        return fetch(url, {
          ...init,
          body: JSON.stringify({
            ...body,
            selectedDataSources: selectedDataSourcesRef.current,
          }),
        })
      },
    }),
    messages: [],
  })

  const handleStartChat = (selected: SelectedDataSource[]) => {
    setSelectedDataSources(selected)
    setChatStarted(true)
    setMessages([
      {
        id: 'initial',
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: 'Hello! How can I help you today?',
          },
        ],
      },
    ])
  }

  const clearChat = () => {
    setMessages([])
    setChatStarted(false)
    setSelectedDataSources([])
  }

  const getSelectedDataSources = () => {
    return dataSources.filter((ds) => selectedDataSources.some(selected => selected.id === ds.id))
  }

  const handleChangeInput = (val: string) => {
    setInput(val)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sendMessage({
      parts: [{ type: 'text', text: input }],
    })
    setInput('')
  }

  if (!chatStarted) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <StartNewChatView dataSources={dataSources} onStartChat={handleStartChat} />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatHeader
        clearChat={clearChat}
        selectedDataSources={getSelectedDataSources()}
      />

      <ChatMessages messages={messages} status={status} regenerate={regenerate} />

      <ChatInput
        input={input}
        handleInputChange={handleChangeInput}
        onSubmit={onSubmit}
        disabled={status === 'streaming' || status === 'submitted'}
      />
    </div>
  )
}

interface StartNewChatViewProps {
  dataSources: DataSource[]
  onStartChat: (selected: SelectedDataSource[]) => void
}

function StartNewChatView({ dataSources, onStartChat }: StartNewChatViewProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome to Your Knowledge Base
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Select the documents you want to chat with and start asking questions.
        </p>
        <div className="pt-4">
          <DataSourceSelectionDialog
            dataSources={dataSources}
            onStartChat={onStartChat}
          />
        </div>
      </div>
    </div>
  )
}
