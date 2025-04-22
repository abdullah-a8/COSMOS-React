"use client"

import { CheckCircle, XCircle, Clock, FileText, Scissors, Database } from "lucide-react"

interface UploadStatusProps {
  status: "idle" | "extracting" | "splitting" | "adding" | "success" | "error"
  elapsedTime: number
}

export default function UploadStatus({ status, elapsedTime }: UploadStatusProps) {
  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")
    const secs = (seconds % 60).toString().padStart(2, "0")
    return `${mins}:${secs}`
  }

  const steps = [
    { id: "extracting", label: "Extracting text from source…", icon: FileText },
    { id: "splitting", label: "Splitting into chunks…", icon: Scissors },
    { id: "adding", label: "Adding to vector store…", icon: Database },
    {
      id: "success",
      label: "Successfully added to knowledge base.",
      icon: CheckCircle,
      isComplete: status === "success",
    },
    {
      id: "error",
      label: "Failed to add to knowledge base.",
      icon: XCircle,
      isError: status === "error",
    },
  ]

  // Find the current step index
  const currentStepIndex = steps.findIndex((step) => step.id === status)

  return (
    <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Processing Content</h3>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-1" />
          <span>⏱️ {formatTime(elapsedTime)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          // Skip the error step if we're not in error state
          if (step.isError && status !== "error") return null
          // Skip the success step if we're not in success state
          if (step.id === "success" && status !== "success") return null

          const StepIcon = step.icon
          const isActive = index === currentStepIndex
          const isCompleted = index < currentStepIndex || step.isComplete

          return (
            <div
              key={step.id}
              className={`flex items-center ${
                step.isError
                  ? "text-red-600 dark:text-red-400"
                  : isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.isError
                    ? "bg-red-100 dark:bg-red-900/30"
                    : isCompleted
                      ? "bg-green-100 dark:bg-green-900/30"
                      : isActive
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <StepIcon className="w-5 h-5" />
              </div>
              <span className="ml-3">{step.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
