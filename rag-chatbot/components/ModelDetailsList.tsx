"use client"

import React from "react"
import type { ModelInfo } from "../types/models"

interface ModelDetailsListProps {
  models: Record<string, ModelInfo>
  selectedModels: string[]
}

export default function ModelDetailsList({ models, selectedModels }: ModelDetailsListProps) {
  if (selectedModels.length === 0) {
    return null
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Selected Model Details</h2>

      {selectedModels.map((modelName, index) => {
        const model = models[modelName]
        if (!model) {
          // Handle missing model gracefully
          return (
            <div key={modelName} className="mb-4 p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded-md">
              <p className="text-red-600 dark:text-red-400">Model &quot;{modelName}&quot; information not available.</p>
            </div>
          )
        }

        return (
          <div key={modelName} className="mb-4">
            <h3 className="text-md font-medium mb-2">{model.name || modelName}</h3>
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              {model.description}
            </div>
            <ul className="space-y-1 text-sm">
              <li>
                <strong>Context Window:</strong> {model.contextWindow?.toLocaleString() || "N/A"} tokens
              </li>
              <li>
                <strong>Speed:</strong> {model.speed || "N/A"}
              </li>
              <li>
                <strong>Reasoning:</strong> {model.reasoning || "N/A"}
              </li>
              <li>
                <strong>Math:</strong> {model.math || "N/A"}
              </li>
              <li>
                <strong>Coding:</strong> {model.coding || "N/A"}
              </li>
              <li>
                <strong>Throughput:</strong> {model.throughput || "N/A"}
              </li>
              <li>
                <strong>Cost:</strong> {model.cost || "N/A"}
              </li>
              {model.requestsPerMinute && (
                <li>
                  <strong>Requests Per Minute:</strong> {model.requestsPerMinute}
                </li>
              )}
              {model.requestsPerDay !== undefined && (
                <li>
                  <strong>Requests Per Day:</strong> {model.requestsPerDay}
                </li>
              )}
              {model.tokensPerMinute && (
                <li>
                  <strong>Tokens Per Minute:</strong> {model.tokensPerMinute}
                </li>
              )}
              {model.tokensPerDay !== undefined && (
                <li>
                  <strong>Tokens Per Day:</strong> {model.tokensPerDay?.toLocaleString() || "Unlimited"}
                </li>
              )}
              {model.advantages && (
                <li>
                  <strong>Advantages:</strong> {model.advantages}
                </li>
              )}
              {model.disadvantages && (
                <li>
                  <strong>Disadvantages:</strong> {model.disadvantages}
                </li>
              )}
            </ul>
            {index < selectedModels.length - 1 && <hr className="my-3 border-gray-200 dark:border-gray-700" />}
          </div>
        )
      })}
    </div>
  )
}
