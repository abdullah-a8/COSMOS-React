import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { PanelLeft, PanelRight, Database, Settings } from 'lucide-react';
import SettingsSidebar from '../components/rag-chatbot/SettingsSidebar';
import ContentUpload from '../components/rag-chatbot/ContentUpload';
import UploadStatus from '../components/rag-chatbot/UploadStatus';
import ChatInterface from '../components/rag-chatbot/ChatInterface';
import { useRagChatbot } from '../hooks/useRagChatbot';
import { models } from '../utils/models';
import { useDevice } from '../hooks/useDevice';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';

const RagChatbot: React.FC = () => {
  const { isMobile } = useDevice();
  // Always start with sidebar closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedModels, setSelectedModels] = useState<string[]>(["llama-3.3-70b-versatile"]);
  const [temperature, setTemperature] = useState(0.7);
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Update sidebar state when device type changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [isMobile]);

  // Track if mobile navigation is open
  useEffect(() => {
    const checkNavState = () => {
      // Check body overflow which is set in the Navbar component when mobile menu is open
      setIsMobileNavOpen(document.body.style.overflow === 'hidden');
    };

    // Check initially and add a mutation observer to detect changes
    checkNavState();
    
    // Use MutationObserver to watch for style changes on the body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style') {
          checkNavState();
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
    
    return () => observer.disconnect();
  }, []);

  const {
    file,
    url,
    isProcessing,
    isQueryProcessing,
    uploadStatus,
    messages,
    sourceFilters,
    statusMessage,
    elapsedTime,
    handleUrlChange,
    handleFileChange,
    processFile,
    processUrl,
    processImage,
    uploadMethod,
    handleUploadMethodChange,
    sendMessage,
    setSourceFilters,
    reset
  } = useRagChatbot(chunkSize, chunkOverlap);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const resetSettings = () => {
    setSelectedModels(["llama-3.3-70b-versatile"]);
    setTemperature(0.7);
    setChunkSize(500);
    setChunkOverlap(50);
  };

  const handleResetChat = () => {
    reset();
  };

  const handleContentUpload = () => {
    if (uploadMethod === "pdf") {
      processFile();
    } else if (uploadMethod === "url") {
      processUrl();
    } else if (uploadMethod === "image") {
      processImage();
    }
  };

  const handleSendMessage = (content: string) => {
    sendMessage(content, selectedModels, temperature);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen">
        <div className={`${isMobile ? 'pt-20 pb-6' : 'pt-32 pb-12'}`}>
          {/* Settings toggle button - hidden when mobile nav is open */}
          {!isMobileNavOpen && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
              className={`fixed ${isMobile ? 'bottom-6 left-6 z-40' : `${isMobile ? 'top-20' : 'top-32'} left-4 z-40`} bg-black/50 backdrop-blur-sm border-white/10 text-white hover:bg-purple-900/50 transition-all duration-300 ease-in-out 
              ${!isMobile && isSidebarOpen ? 'left-80 ml-4' : ''}`}
              aria-label={isSidebarOpen ? "Close settings" : "Open settings"}
            >
              {isMobile ? (
                <Settings className="h-5 w-5" />
              ) : (
                isSidebarOpen ? <PanelLeft className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Wrap settings in AnimatePresence for proper animation handling */}
          <AnimatePresence initial={false}>
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
              onResetChat={handleResetChat}
              onClose={toggleSidebar}
            />
          </AnimatePresence>

          <main className={`flex-1 ${isMobile ? 'p-3' : 'p-4 md:p-8'} transition-all duration-300 ${!isMobile && isSidebarOpen ? "md:ml-80" : "ml-0"}`}>
            <div className={`${isMobile ? 'mx-0' : 'max-w-4xl mx-auto'}`}>
              <div className={`${isMobile ? 'mb-4' : 'mb-8'}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 12 }}
                  className="flex items-center gap-3 mb-2"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                    <Database className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
                  </div>
                  <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-400 bg-clip-text text-transparent`}>
                    {isMobile ? 'RAG Chatbot' : 'RAG-Powered Knowledge Chatbot'}
                  </h1>
                </motion.div>
                {!isMobile && (
                  <p className="text-lg text-gray-300">
                    Upload documents, images, or websites, then chat with AI about their content using the power of Retrieval-Augmented Generation.
                  </p>
                )}
              </div>

              <ContentUpload
                uploadMethod={uploadMethod}
                onUploadMethodChange={handleUploadMethodChange}
                file={file}
                onFileChange={handleFileChange}
                url={url}
                onUrlChange={handleUrlChange}
                onSubmit={handleContentUpload}
                isProcessing={isProcessing}
              />

              {uploadStatus !== 'idle' && (
                <UploadStatus
                  status={uploadStatus}
                  elapsedTime={elapsedTime}
                  statusMessage={statusMessage}
                />
              )}

              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
                isQueryProcessing={isQueryProcessing}
                sourceFilters={sourceFilters}
                onSourceFiltersChange={setSourceFilters}
              />
            </div>
          </main>
        </div>
      </div>
    </MotionConfig>
  );
};

export default RagChatbot; 