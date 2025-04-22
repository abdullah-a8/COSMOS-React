import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { PanelLeft, PanelRight, Database } from 'lucide-react';
import SettingsSidebar from '../components/rag-chatbot/SettingsSidebar';
import ContentUpload from '../components/rag-chatbot/ContentUpload';
import UploadStatus from '../components/rag-chatbot/UploadStatus';
import ChatInterface from '../components/rag-chatbot/ChatInterface';
import { useRagChatbot } from '../hooks/useRagChatbot';
import { models } from '../utils/models';

const RagChatbot: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedModels, setSelectedModels] = useState<string[]>(["llama3-70b-8192"]);
  const [temperature, setTemperature] = useState(0.7);
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [uploadMethod, setUploadMethod] = useState<"pdf" | "url">("pdf");

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
    sendMessage,
    setSourceFilters,
    reset
  } = useRagChatbot(chunkSize, chunkOverlap);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const resetSettings = () => {
    setSelectedModels(["llama3-70b-8192"]);
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
    } else {
      processUrl();
    }
  };

  const handleSendMessage = (content: string) => {
    sendMessage(content, selectedModels, temperature);
  };

  return (
    <div className="relative min-h-screen">
      <div className="pt-32 pb-12">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className={`fixed top-32 z-50 bg-black/50 backdrop-blur-sm border-white/10 text-white hover:bg-purple-900/50 transition-all duration-300 ease-in-out 
          ${isSidebarOpen ? 'left-80 ml-4' : 'left-4'}`}
          aria-label={isSidebarOpen ? "Close settings sidebar" : "Open settings sidebar"}
        >
          {isSidebarOpen ? <PanelLeft className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
        </Button>

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
        />

        <main className={`flex-1 p-4 md:p-8 transition-all duration-300 ${isSidebarOpen ? "md:ml-80" : "ml-0"}`}>
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center text-white">
                RAG-Powered Knowledge Chatbot
                <span className="ml-2 text-purple-400">
                  <Database className="h-8 w-8" />
                </span>
              </h1>
              <p className="text-lg text-gray-300">
                Upload documents or websites, then chat with AI about their content using the power of Retrieval-Augmented Generation.
              </p>
            </div>

            <ContentUpload
              uploadMethod={uploadMethod}
              onUploadMethodChange={setUploadMethod}
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
  );
};

export default RagChatbot; 