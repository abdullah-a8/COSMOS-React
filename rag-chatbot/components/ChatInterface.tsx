"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import ChatHistory from "./ChatHistory"
import ChatInput from "./ChatInput"
import SourceFilterExpander from "./SourceFilterExpander"

interface ChatInterfaceProps {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
  onSendMessage: (content: string) => void
  isProcessing: boolean
  sourceFilters: {
    pdf: boolean
    web: boolean
    youtube: boolean
  }
  onSourceFiltersChange: (filters: { pdf: boolean; web: boolean; youtube: boolean }) => void
}

export default function ChatInterface({
  messages,
  onSendMessage,
  isProcessing,
  sourceFilters,
  onSourceFiltersChange,
}: ChatInterfaceProps) {
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div>
      <hr className="border-gray-200 dark:border-gray-700 mb-6" />

      <h1 className="text-2xl md:text-3xl font-bold mb-6">Chat with the Knowledge Base 🤖</h1>

      {/* Advanced Settings */}
      <div className="mb-6">
        <button
          onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
          className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none"
          aria-expanded={isAdvancedSettingsOpen}
          aria-controls="advanced-settings"
        >
          Advanced Settings
          {isAdvancedSettingsOpen ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />}
        </button>

        {isAdvancedSettingsOpen && (
          <div
            id="advanced-settings"
            className="mt-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <SourceFilterExpander sourceFilters={sourceFilters} onChange={onSourceFiltersChange} />
          </div>
        )}
      </div>

      {/* Chat History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="h-[400px] overflow-y-auto p-4">
          <ChatHistory messages={messages} />
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <ChatInput
            onSend={onSendMessage}
            isProcessing={isProcessing}
            placeholder="Ask a question about the content in the knowledge base:"
          />
        </div>
      </div>
    </div>
  )
}
