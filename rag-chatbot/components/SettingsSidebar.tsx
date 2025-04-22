"use client"

import ModelSelector from "./ModelSelector"
import ModelDetailsList from "./ModelDetailsList"
import SliderControl from "./SliderControl"
import type { ModelInfo } from "../types/models"

interface SettingsSidebarProps {
  isOpen: boolean
  models: Record<string, ModelInfo>
  selectedModels: string[]
  onModelsChange: (models: string[]) => void
  temperature: number
  onTemperatureChange: (value: number) => void
  chunkSize: number
  onChunkSizeChange: (value: number) => void
  chunkOverlap: number
  onChunkOverlapChange: (value: number) => void
  onResetSettings: () => void
  onResetChat: () => void
}

export default function SettingsSidebar({
  isOpen,
  models,
  selectedModels,
  onModelsChange,
  temperature,
  onTemperatureChange,
  chunkSize,
  onChunkSizeChange,
  chunkOverlap,
  onChunkOverlapChange,
  onResetSettings,
  onResetChat,
}: SettingsSidebarProps) {
  return (
    <aside
      className={`fixed top-[57px] bottom-0 left-0 w-[300px] bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto transition-transform duration-300 ease-in-out z-20 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 ${!isOpen && "md:hidden"}`}
      role="complementary"
      aria-label="Settings sidebar"
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>

        {/* Model Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Choose Models</label>
          <ModelSelector models={Object.keys(models)} selectedModels={selectedModels} onChange={onModelsChange} />
        </div>

        {/* Selected Model Details */}
        <div className="mb-6">
          <ModelDetailsList models={models} selectedModels={selectedModels} />
        </div>

        {/* Temperature Slider */}
        <div className="mb-6">
          <SliderControl
            label="Temperature"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            onChange={onTemperatureChange}
            helpText={
              <>
                <p className="mb-2">Controls the randomness of the model's output.</p>
                <ul className="space-y-1 text-sm">
                  <li>
                    - <strong>Low Values (e.g., 0.1–0.3):</strong> Makes the responses more deterministic and focused.
                  </li>
                  <li>
                    - <strong>Medium Values (e.g., 0.7–1.0):</strong> Balanced creativity and focus.
                  </li>
                  <li>
                    - <strong>High Values (e.g., 1.5–2.0):</strong> Increases creativity and variability, but may lead
                    to less accurate or unpredictable responses.
                  </li>
                </ul>
              </>
            }
          />
        </div>

        {/* Chunk Size Slider */}
        <div className="mb-6">
          <SliderControl
            label="Chunk Size"
            min={100}
            max={3000}
            step={50}
            value={chunkSize}
            onChange={onChunkSizeChange}
            helpText={
              <>
                <p className="mb-2">Defines the number of words in each content chunk.</p>
                <ul className="space-y-1 text-sm">
                  <li>
                    - <strong>Small Chunks (e.g., 100–300):</strong> Ideal for highly specific queries or short
                    articles.
                  </li>
                  <li>
                    - <strong>Large Chunks (e.g., 1000–3000):</strong> Better for summarization or broader context but
                    may lose finer details.
                  </li>
                </ul>
              </>
            }
          />
        </div>

        {/* Chunk Overlap Slider */}
        <div className="mb-6">
          <SliderControl
            label="Chunk Overlap"
            min={10}
            max={300}
            step={10}
            value={chunkOverlap}
            onChange={onChunkOverlapChange}
            helpText={
              <>
                <p className="mb-2">Specifies the overlap between consecutive content chunks.</p>
                <ul className="space-y-1 text-sm">
                  <li>
                    - <strong>Smaller Overlap (e.g., 10–50):</strong> Reduces redundancy but may miss context in some
                    queries.
                  </li>
                  <li>
                    - <strong>Larger Overlap (e.g., 200–300):</strong> Ensures more context but may increase processing
                    time.
                  </li>
                </ul>
              </>
            }
          />
        </div>

        {/* Reset Buttons */}
        <div className="space-y-3">
          <button
            onClick={onResetSettings}
            className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-gray-200"
            aria-label="Reset all settings"
          >
            Reset All Settings
          </button>

          <button
            onClick={onResetChat}
            className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-gray-200"
            aria-label="Reset chat and clear upload"
          >
            Reset Chat & Clear Upload
          </button>
        </div>
      </div>
    </aside>
  )
}
