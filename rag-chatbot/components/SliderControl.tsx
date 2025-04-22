"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { ReactNode } from "react"

interface SliderControlProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  helpText?: ReactNode
}

export default function SliderControl({ label, min, max, step, value, onChange, helpText }: SliderControlProps) {
  const [showHelp, setShowHelp] = useState(false)

  // Calculate percentage for styling the slider
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center text-sm font-medium focus:outline-none"
          aria-expanded={showHelp}
          aria-controls={`${label.toLowerCase()}-help`}
        >
          {label}
          {helpText && <span className="ml-1">{showHelp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>}
        </button>
        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 text-xs font-medium rounded">
          {value}
        </span>
      </div>

      {helpText && showHelp && (
        <div id={`${label.toLowerCase()}-help`} className="mb-3 text-xs text-gray-600 dark:text-gray-300">
          {helpText}
        </div>
      )}

      <div className="relative">
        <input
          id={label.replace(/\s+/g, "-").toLowerCase()}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          style={{
            background: `linear-gradient(to right, #9333ea ${percentage}%, rgb(229 231 235 / var(--tw-bg-opacity)) ${percentage}%)`,
          }}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          role="slider"
        />

        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  )
}
