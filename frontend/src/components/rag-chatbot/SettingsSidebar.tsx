import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '../ui/slider';
import { ModelInfo, formatModelNameForDisplay } from '../../utils/models';
import { CheckSquare, Square, ChevronDown, ChevronUp, Info, X, MessageSquare, RefreshCw } from 'lucide-react';
import { useDevice } from '../../hooks/useDevice';

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
  onClose: () => void;
  sessionId?: string | null;
  clearConversation: () => void;
  startNewSession: () => void;
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
  onClose,
  sessionId,
  clearConversation,
  startNewSession
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [selectedModelDetails, setSelectedModelDetails] = useState<string | null>(null);
  const { isMobile } = useDevice();

  // Lock body scroll when sheet is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

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

  // Mobile bottom sheet animation
  const sheetVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 }
  };

  // Session Management Section
  const SessionManagementSection = () => (
    <div className="mb-10">
      <h3 className="font-medium mb-4 text-lg text-white">Session Management</h3>
      
      {sessionId && (
        <div className="mb-4 p-3 bg-black/30 border border-white/10 rounded-md">
          <div className="flex items-center mb-1">
            <MessageSquare className="h-4 w-4 text-purple-400 mr-2" />
            <span className="text-white/70 text-sm">Current Session ID:</span>
          </div>
          <div className="font-mono text-xs text-purple-300 break-all">
            {sessionId}
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        <button
          onClick={clearConversation}
          className="w-full py-2.5 px-4 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
        >
          <X className="h-4 w-4 text-purple-400" />
          <span>Clear Messages</span>
        </button>
        
        <button
          onClick={startNewSession}
          className="w-full py-2.5 px-4 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
        >
          <RefreshCw className="h-4 w-4 text-purple-400" />
          <span>New Session</span>
        </button>
      </div>
    </div>
  );

  // Return either a bottom sheet on mobile or a sidebar on desktop
  if (isMobile) {
    return (
      <>
        {/* Backdrop overlay */}
        {isOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
        
        {/* Bottom sheet */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 max-h-[90vh] rounded-t-2xl bg-black/90 border-t border-purple-700/30 overflow-y-auto z-[101] shadow-[0_-5px_15px_rgba(147,51,234,0.3)]"
          initial="hidden"
          animate={isOpen ? "visible" : "hidden"}
          exit="hidden"
          variants={sheetVariants}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="sticky top-0 p-4 flex justify-between items-center border-b border-purple-700/30 bg-black backdrop-blur-md z-10">
            <h2 className="text-xl font-bold text-purple-300">Settings</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-purple-900/30 text-white hover:bg-purple-900/50 transition-colors"
              aria-label="Close settings"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 text-white">
            {/* Session Management Section */}
            <SessionManagementSection />

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
                        ? formatModelNameForDisplay(selectedModels[0])
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
                            {formatModelNameForDisplay(modelName)}
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
                      {formatModelNameForDisplay(modelName)}
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
            <div className="space-y-3 mb-8 pb-6">
              <button
                onClick={onResetSettings}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                aria-label="Reset all settings"
              >
                Reset All Settings
              </button>

              <button
                onClick={onResetChat}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                aria-label="Reset chat and clear upload"
              >
                Reset Chat & Clear Upload
              </button>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={`fixed top-20 bottom-0 left-0 w-80 bg-black/40 backdrop-blur-lg border-r border-purple-700/30 overflow-y-auto transition-transform duration-300 ease-in-out z-50 shadow-[5px_0_15px_-5px_rgba(147,51,234,0.2)]
      ${isOpen ? 'translate-x-0' : '-translate-x-full'} scrollbar-thin scrollbar-thumb-purple-600/50 scrollbar-track-transparent`}
      role="complementary"
      aria-label="Settings sidebar"
    >
      <div className="p-6 text-white pt-10">
        <h2 className="text-2xl font-bold mb-8 text-purple-300">Settings</h2>

        {/* Session Management Section */}
        <SessionManagementSection />

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
                    ? formatModelNameForDisplay(selectedModels[0])
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
                        {formatModelNameForDisplay(modelName)}
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
                  {formatModelNameForDisplay(modelName)}
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