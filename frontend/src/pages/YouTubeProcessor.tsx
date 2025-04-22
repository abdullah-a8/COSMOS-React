import React, { useState } from "react";
import SidebarSettings from "../components/youtube-processor/SidebarSettings";
import VideoInputForm from "../components/youtube-processor/VideoInputForm";
import VideoPreview from "../components/youtube-processor/VideoPreview";
import InfoSection from "../components/youtube-processor/InfoSection";
import { useYouTubeProcessor } from "../hooks/useYouTubeProcessor";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { PanelLeft, PanelRight, Youtube } from "lucide-react";

const YouTubeProcessor: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);

  const { 
    videoUrl, 
    videoId, 
    isProcessing, 
    error, 
    isSuccess,
    processingTime,
    handleUrlChange, 
    processTranscript 
  } = useYouTubeProcessor({ chunkSize, chunkOverlap });

  const resetSettings = () => {
    setChunkSize(500);
    setChunkOverlap(50);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Format processing time nicely
  const formatProcessingTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins} minute${mins !== 1 ? 's' : ''} and ${secs} second${secs !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="relative min-h-screen pt-32">
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

      <SidebarSettings
        isOpen={isSidebarOpen}
        chunkSize={chunkSize}
        chunkOverlap={chunkOverlap}
        onChunkSizeChange={setChunkSize}
        onChunkOverlapChange={setChunkOverlap}
        onReset={resetSettings}
      />

      <main className={`flex-1 p-4 md:p-8 transition-all duration-300 ${isSidebarOpen ? "md:ml-80" : "ml-0"}`}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center text-white">
                  YouTube Transcript Processor
                  <span className="ml-2 text-purple-400">
                     <Youtube className="h-8 w-8" />
                  </span>
              </h1>
              <p className="text-lg text-gray-300">
                Extract, process, and add YouTube video transcripts to your knowledge base for later retrieval.
              </p>
          </div>
          
          <VideoInputForm
            videoUrl={videoUrl}
            onChangeUrl={handleUrlChange}
            onSubmit={processTranscript}
            isProcessing={isProcessing}
            error={error}
          />

          {videoId && (
            <div className="mt-8">
              <VideoPreview videoId={videoId} />
            </div>
          )}

          {isSuccess && (
             <div className="mt-8 p-6 bg-green-900/20 border border-green-800 rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.15)]">
                <h3 className="text-xl font-bold text-green-400 mb-2">Transcript Processed Successfully!</h3>
                <p className="text-green-300 mb-4">
                  The transcript has been extracted, chunked, and stored in your knowledge base.
                </p>
                
                <div className="mb-4 inline-flex items-center px-3 py-1 rounded-full bg-purple-900/30 border border-purple-700/30">
                  <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span className="text-purple-300 text-sm">
                    Processed in {formatProcessingTime(processingTime)}
                  </span>
                </div>
                
                <div className="bg-black/30 p-4 rounded-lg text-gray-300 mb-4">
                  <p className="font-medium mb-1">What happens next?</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>The video content is now searchable in the RAG Chatbot</li>
                    <li>You can ask specific questions about the video content</li>
                    <li>The AI will use relevant parts of the transcript to answer your questions</li>
                  </ul>
                </div>
                <Link 
                  to="/rag-chatbot" 
                  className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Go to RAG Chatbot
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
          )}

          <div className="mt-12">
            <InfoSection />
          </div>
        </div>
      </main>
    </div>
  );
};

export default YouTubeProcessor; 