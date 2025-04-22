"use client"

import { motion } from "framer-motion"

interface ChatHistoryProps {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>
}

export default function ChatHistory({ messages }: ChatHistoryProps) {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex ${
            message.role === "user" ? "justify-end" : message.role === "system" ? "justify-center" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              message.role === "user"
                ? "bg-purple-600 text-white"
                : message.role === "system"
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            }`}
          >
            {message.content}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
