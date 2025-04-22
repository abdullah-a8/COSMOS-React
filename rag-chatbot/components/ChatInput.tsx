"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

interface ChatInputProps {
  onSend: (content: string) => void
  isProcessing: boolean
  placeholder?: string
}

export default function ChatInput({ onSend, isProcessing, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSend = () => {
    if (message.trim() && !isProcessing) {
      onSend(message)
      setMessage("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Type your message..."}
        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600 resize-none min-h-[56px] max-h-[200px]"
        disabled={isProcessing}
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={!message.trim() || isProcessing}
        className={`absolute right-3 bottom-3 p-2 rounded-full ${
          !message.trim() || isProcessing
            ? "text-gray-400 cursor-not-allowed"
            : "text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/30"
        } transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500`}
        aria-label="Send message"
      >
        <Send size={20} />
      </button>

      {isProcessing && (
        <div className="absolute inset-0 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-5 w-5 border-2 border-purple-500 rounded-full border-t-transparent"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Processing...</span>
          </div>
        </div>
      )}
    </div>
  )
}
