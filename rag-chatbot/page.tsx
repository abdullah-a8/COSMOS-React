"use client"

import { useState } from "react"
import Header from "../components/Header"
import SettingsSidebar from "./components/SettingsSidebar"
import ContentUpload from "./components/ContentUpload"
import UploadStatus from "./components/UploadStatus"
import ChatInterface from "./components/ChatInterface"
import { models } from "./utils/models"

export default function KnowledgeBaseChatbotPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedModels, setSelectedModels] = useState<string[]>(["gpt-4o"])
  const [temperature, setTemperature] = useState(0.7)
  const [chunkSize, setChunkSize] = useState(500)
  const [chunkOverlap, setChunkOverlap] = useState(50)
  const [uploadMethod, setUploadMethod] = useState<"pdf" | "url">("pdf")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fetchUrl, setFetchUrl] = useState("")
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "extracting" | "splitting" | "adding" | "success" | "error"
  >("idle")
  const [elapsedTime, setElapsedTime] = useState(0)
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant" | "system"; content: string }>>([
    { role: "system", content: "Connecting to knowledge base... How can I help?" },
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [sourceFilters, setSourceFilters] = useState({
    pdf: true,
    web: true,
    youtube: true,
  })

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const resetSettings = () => {
    setSelectedModels(["gpt-4o"])
    setTemperature(0.7)
    setChunkSize(500)
    setChunkOverlap(50)
  }

  const resetChat = () => {
    setMessages([{ role: "system", content: "Connecting to knowledge base... How can I help?" }])
    setUploadedFile(null)
    setFetchUrl("")
    setProcessingStatus("idle")
    setElapsedTime(0)
  }

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    simulateProcessing()
  }

  const handleUrlFetch = () => {
    if (fetchUrl.trim()) {
      simulateProcessing()
    }
  }

  const simulateProcessing = () => {
    setProcessingStatus("extracting")
    setElapsedTime(0)

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    setTimeout(() => {
      setProcessingStatus("splitting")

      setTimeout(() => {
        setProcessingStatus("adding")

        setTimeout(() => {
          setProcessingStatus("success")
          clearInterval(timer)
        }, 3000)
      }, 2000)
    }, 2000)
  }

  const sendMessage = (content: string) => {
    if (!content.trim() || isProcessing) return

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content }])
    setIsProcessing(true)

    // Simulate AI response after a delay
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `This is a simulated response to your question: "${content}". In a real implementation, this would use the selected models (${selectedModels.join(", ")}) with temperature ${temperature}, chunk size ${chunkSize}, and chunk overlap ${chunkOverlap}.`,
        },
      ])
      setIsProcessing(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <SettingsSidebar
          isOpen={isSidebarOpen}
          models={models}
          selectedModels={selectedModels}
          onModelsChange={setSelectedModels}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          chunkSize={chunkSize}
          onChunkSizeChange={setChunkSize}
          chunkOverlap={chunkOverlap}
          onChunkOverlapChange={setChunkOverlap}
          onResetSettings={resetSettings}
          onResetChat={resetChat}
        />

        {/* Main Content */}
        <main
          className={`flex-1 p-4 md:p-8 transition-all duration-300 ${isSidebarOpen ? "md:ml-[300px]" : ""}`}
          role="main"
        >
          <ContentUpload
            uploadMethod={uploadMethod}
            onUploadMethodChange={setUploadMethod}
            uploadedFile={uploadedFile}
            onFileUpload={handleFileUpload}
            fetchUrl={fetchUrl}
            onUrlChange={setFetchUrl}
            onUrlFetch={handleUrlFetch}
          />

          {processingStatus !== "idle" && <UploadStatus status={processingStatus} elapsedTime={elapsedTime} />}

          <ChatInterface
            messages={messages}
            onSendMessage={sendMessage}
            isProcessing={isProcessing}
            sourceFilters={sourceFilters}
            onSourceFiltersChange={setSourceFilters}
          />
        </main>
      </div>
    </div>
  )
}
