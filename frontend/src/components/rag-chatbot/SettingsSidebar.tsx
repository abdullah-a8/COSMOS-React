import React, { useState } from 'react';
import { Slider } from '../ui/slider';
import { ModelInfo } from '../../utils/models';
import { CheckSquare, Square, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface SettingsSidebarProps {
  isOpen: boolean;
  models: Record<string, ModelInfo>;
  selectedModels: string[];
  onModelsChange: (models: string[]) => void;
  temperature: number;
  onTemperatureChange: (value: number) => void;
  chunkSize: number;
  onChunkSizeChange: (value: number) => void;
  chunkOverlap: number;
  onChunkOverlapChange: (value: number) => void;
  onResetSettings: () => void;
  onResetChat: () => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
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
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedModelDetails, setSelectedModelDetails] = useState<string | null>(null);

  const toggleModel = (modelName: string) => {
    if (selectedModels.includes(modelName)) {
      // Remove model if there will still be at least one model selected
      if (selectedModels.length > 1) {
        onModelsChange(selectedModels.filter(m => m !== modelName));
      }
    } else {
      // Add model
      onModelsChange([...selectedModels, modelName]);
    }
  };

  const toggleModelDetails = (modelName: string) => {
    setSelectedModelDetails(selectedModelDetails === modelName ? null : modelName);
  };

  return (
    <aside
      className={`fixed top-20 bottom-0 left-0 w-80 bg-black/40 backdrop-blur-lg border-r border-purple-700/30 overflow-y-auto transition-transform duration-300 ease-in-out z-20 shadow-[5px_0_15px_-5px_rgba(147,51,234,0.2)]
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
      md:translate-x-0 ${!isOpen && 'md:hidden'} scrollbar-thin scrollbar-thumb-purple-600/50 scrollbar-track-transparent`}
      role="complementary"
      aria-label="Settings sidebar"
    >
      <div className="p-6 text-white pt-10">
        <h2 className="text-2xl font-bold mb-8 text-purple-300">Settings</h2>

        {/* Model Selection Dropdown */}
        <div className="mb-10">
          <h3 className="font-medium mb-4 text-lg text-white">Choose Models</h3>
          
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="w-full p-3 flex items-center justify-between bg-black/30 border border-white/10 rounded-md hover:border-purple-400/50 transition-colors"
            >
              <span>
                {selectedModels.length === 0 
                  ? "Select models..." 
                  : selectedModels.length === 1 
                    ? selectedModels[0]
                    : `${selectedModels.length} models selected`}
              </span>
              {isModelDropdownOpen ? 
                <ChevronUp className="h-5 w-5 text-purple-400" /> : 
                <ChevronDown className="h-5 w-5 text-purple-400" />
              }
            </button>
            
            {isModelDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-1 bg-black/80 backdrop-blur-lg border border-white/10 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600/50 scrollbar-track-transparent">
                {Object.keys(models).map((modelName) => (
                  <div key={modelName} className="border-b border-white/5 last:border-0">
                    <div 
                      className="flex items-center space-x-2 p-3 hover:bg-white/5 cursor-pointer group transition-colors"
                      onClick={() => toggleModel(modelName)}
                    >
                      <div className="flex-shrink-0 text-purple-400">
                        {selectedModels.includes(modelName) ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </div>
                      <span className={`flex-1 ${selectedModels.includes(modelName) ? 'text-purple-300' : 'text-white/70 group-hover:text-white'}`}>
                        {modelName}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleModelDetails(modelName);
                        }}
                        className="text-white/50 hover:text-white/90"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {selectedModelDetails === modelName && (
                      <div className="p-3 bg-purple-900/20 border-t border-purple-900/30 text-sm">
                        <div className="space-y-1 text-white/70">
                          <p><span className="text-white/50">Requests/min:</span> {models[modelName].requestsPerMinute}</p>
                          <p><span className="text-white/50">Requests/day:</span> {models[modelName].requestsPerDay || 'Unlimited'}</p>
                          <p><span className="text-white/50">Tokens/min:</span> {models[modelName].tokensPerMinute}</p>
                          <p><span className="text-white/50">Tokens/day:</span> {models[modelName].tokensPerDay || 'Unlimited'}</p>
                          <div className="mt-2">
                            <p className="text-green-300">✓ {models[modelName].advantages}</p>
                            <p className="text-amber-300">✗ {models[modelName].disadvantages}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Model Pills */}
        {selectedModels.length > 0 && (
          <div className="mb-10">
            <h3 className="font-medium mb-4 text-lg text-white">Selected Models</h3>
            <div className="flex flex-wrap gap-2">
              {selectedModels.map((modelName) => (
                <div key={modelName} 
                  className="px-3 py-1.5 bg-purple-900/30 text-purple-300 rounded-full text-sm flex items-center">
                  {modelName}
                  <button 
                    onClick={() => selectedModels.length > 1 ? toggleModel(modelName) : null}
                    className="ml-2 text-purple-400 hover:text-white"
                    disabled={selectedModels.length <= 1}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Temperature Slider */}
        <div className="mb-10">
          <h3 className="font-medium mb-4 text-lg text-white">Temperature: {temperature.toFixed(1)}</h3>
          <Slider 
            min={0} 
            max={2.0} 
            step={0.1} 
            value={[temperature]}
            onValueChange={(value) => onTemperatureChange(value[0])}
            className="mb-4"
          />
          <div className="text-sm text-white/70 space-y-2">
            <p className="mb-2">Controls the randomness of the model's output.</p>
            <div className="space-y-1">
              <p className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-blue-400 inline-block mr-2"></span>
                <strong>Low (0.1-0.3):</strong> More deterministic and focused
              </p>
              <p className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-400 inline-block mr-2"></span>
                <strong>Medium (0.7-1.0):</strong> Balanced creativity and focus
              </p>
              <p className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block mr-2"></span>
                <strong>High (1.5-2.0):</strong> More creative but less predictable
              </p>
            </div>
          </div>
        </div>

        {/* Chunk Size Slider */}
        <div className="mb-10">
          <h3 className="font-medium mb-4 text-lg text-white">Chunk Size: {chunkSize}</h3>
          <Slider 
            min={100} 
            max={3000} 
            step={50} 
            value={[chunkSize]}
            onValueChange={(value) => onChunkSizeChange(value[0])}
            className="mb-4"
          />
          <div className="text-sm text-white/70 space-y-2">
            <p className="mb-1">Number of words in each content chunk.</p>
            <div className="space-y-1">
              <p><strong>Small (100-300):</strong> Better for specific queries</p>
              <p><strong>Large (1000-3000):</strong> Better for summarization</p>
            </div>
          </div>
        </div>

        {/* Chunk Overlap Slider */}
        <div className="mb-10">
          <h3 className="font-medium mb-4 text-lg text-white">Chunk Overlap: {chunkOverlap}</h3>
          <Slider 
            min={10} 
            max={300} 
            step={10} 
            value={[chunkOverlap]}
            onValueChange={(value) => onChunkOverlapChange(value[0])}
            className="mb-4"
          />
          <div className="text-sm text-white/70 space-y-2">
            <p className="mb-1">Overlap between consecutive chunks.</p>
            <div className="space-y-1">
              <p><strong>Small (10-50):</strong> Reduces redundancy</p>
              <p><strong>Large (200-300):</strong> Ensures context continuity</p>
            </div>
          </div>
        </div>

        {/* Reset Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={onResetSettings}
            className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            aria-label="Reset all settings"
          >
            Reset All Settings
          </button>

          <button
            onClick={onResetChat}
            className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            aria-label="Reset chat and clear upload"
          >
            Reset Chat & Clear Upload
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SettingsSidebar; 