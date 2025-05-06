"use client"

import React, { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { formatModelNameForDisplay } from "../utils/models"

interface ModelSelectorProps {
  models: string[]
  selectedModels: string[]
  onChange: (models: string[]) => void
}

export default function ModelSelector({ models, selectedModels, onChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleModel = (model: string) => {
    if (selectedModels.includes(model)) {
      onChange(selectedModels.filter((m) => m !== model))
    } else {
      onChange([...selectedModels, model])
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex flex-wrap gap-2 p-2 min-h-[42px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedModels.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 p-1">Select models...</div>
        ) : (
          selectedModels.map((model) => (
            <div
              key={model}
              className="flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-md"
            >
              <span className="text-sm">{formatModelNameForDisplay(model)}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleModel(model)
                }}
                className="ml-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 focus:outline-none"
                aria-label={`Remove ${model}`}
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
        <div className="ml-auto flex items-center">
          <ChevronDown
            size={18}
            className={`text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-[300px] overflow-auto">
          {models.map((model) => (
            <div
              key={model}
              className={`flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                selectedModels.includes(model) ? "bg-purple-50 dark:bg-purple-900/20" : ""
              }`}
              onClick={() => toggleModel(model)}
            >
              <div
                className={`w-5 h-5 rounded-md border ${
                  selectedModels.includes(model)
                    ? "bg-purple-600 border-purple-600 flex items-center justify-center"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {selectedModels.includes(model) && <Check size={14} className="text-white" />}
              </div>
              <span className="ml-2">{formatModelNameForDisplay(model)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
