"use client"

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
        if (!model) return null

        return (
          <div key={modelName} className="mb-4">
            <h3 className="text-md font-medium mb-2">{modelName}</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <strong>Requests Per Minute:</strong> {model.requestsPerMinute}
              </li>
              <li>
                <strong>Requests Per Day:</strong> {model.requestsPerDay}
              </li>
              <li>
                <strong>Tokens Per Minute:</strong> {model.tokensPerMinute}
              </li>
              <li>
                <strong>Tokens Per Day:</strong> {model.tokensPerDay}
              </li>
              <li>
                <strong>Advantages:</strong> {model.advantages}
              </li>
              <li>
                <strong>Disadvantages:</strong> {model.disadvantages}
              </li>
            </ul>
            {index < selectedModels.length - 1 && <hr className="my-3 border-gray-200 dark:border-gray-700" />}
          </div>
        )
      })}
    </div>
  )
}
