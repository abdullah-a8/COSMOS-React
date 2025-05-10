import React, { useState, useEffect } from "react";
import SidebarSettings from "../components/youtube-processor/SidebarSettings";
import VideoInputForm from "../components/youtube-processor/VideoInputForm";
import VideoPreview from "../components/youtube-processor/VideoPreview";
import InfoSection from "../components/youtube-processor/InfoSection";
import { useYouTubeProcessor } from "../hooks/useYouTubeProcessor";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { PanelLeft, PanelRight, Youtube, Settings } from "lucide-react";
import { useDevice } from "../hooks/useDevice";
import { AnimatePresence, motion } from "framer-motion";

const YouTubeProcessor: React.FC = () => {
  const { isMobile } = useDevice();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Close the settings when the window is resized
  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const closeSidebar = () => {
    setIsSidebarOpen(false);
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
    <div className="relative min-h-screen">
      <div className={`${isMobile ? 'pt-20' : 'pt-32'}`}>
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
        <AnimatePresence>
          <SidebarSettings
            isOpen={isSidebarOpen}
            chunkSize={chunkSize}
            chunkOverlap={chunkOverlap}
            onChunkSizeChange={setChunkSize}
            onChunkOverlapChange={setChunkOverlap}
            onReset={resetSettings}
            onClose={closeSidebar}
          />
        </AnimatePresence>

        <main className={`flex-1 ${isMobile ? 'p-3' : 'p-4 md:p-8'} transition-all duration-300 ${!isMobile && isSidebarOpen ? "ml-80" : "ml-0"}`}>
          <div className={`${isMobile ? 'mx-0' : 'max-w-4xl mx-auto'}`}>
            <div className={`${isMobile ? 'mb-4' : 'mb-8'}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 100, damping: 12 }}
                  className="flex items-center gap-3 mb-2"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                    <Youtube className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'} text-white`} />
                  </div>
                  <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-400 bg-clip-text text-transparent`}>
                    {isMobile ? 'YouTube Processor' : 'YouTube Transcript Processor'}
                  </h1>
                </motion.div>
                {!isMobile && (
                  <p className="text-lg text-gray-300">
                    Extract, process, and add YouTube video transcripts to your knowledge base for later retrieval.
                  </p>
                )}
            </div>
            
            <VideoInputForm
              videoUrl={videoUrl}
              onChangeUrl={handleUrlChange}
              onSubmit={processTranscript}
              isProcessing={isProcessing}
              error={error}
            />

            {videoId && (
              <div className={`${isMobile ? 'mt-4' : 'mt-8'}`}>
                <VideoPreview videoId={videoId} />
              </div>
            )}

            {isSuccess && (
               <div className={`${isMobile ? 'mt-4 p-4' : 'mt-8 p-6'} bg-green-900/20 border border-green-800 rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.15)]`}>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-green-400 mb-2`}>Success!</h3>
                  {!isMobile && (
                    <p className="text-green-300 mb-4">
                      The transcript has been extracted, chunked, and stored in your knowledge base.
                    </p>
                  )}
                  
                  <div className="mb-4 inline-flex items-center px-3 py-1 rounded-full bg-purple-900/30 border border-purple-700/30">
                    <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="text-purple-300 text-sm">
                      Processed in {formatProcessingTime(processingTime)}
                    </span>
                  </div>
                  
                  {!isMobile && (
                    <div className="bg-black/30 p-4 rounded-lg text-gray-300 mb-4">
                      <p className="font-medium mb-1">What happens next?</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>The video content is now searchable in the RAG Chatbot</li>
                        <li>You can ask specific questions about the video content</li>
                        <li>The AI will use relevant parts of the transcript to answer your questions</li>
                      </ul>
                    </div>
                  )}
                  
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

            {/* Show InfoSection on all devices, not just desktop */}
            <div className={`${isMobile ? 'mt-8' : 'mt-12'}`}>
              <InfoSection />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default YouTubeProcessor; 