import { Routes, Route } from 'react-router-dom';
import { SparklesCore } from './components/sparkles';
import Navbar from './components/navbar';
import Home from './pages/Home';
import RagChatbot from './pages/RagChatbot';
import YouTubeProcessor from './pages/YouTubeProcessor';
import GmailResponder from './pages/GmailResponder';
import { RoboAnimation } from './components/robo-animation';
import { useDevice } from './hooks/useDevice';
import { useEffect } from 'react';

function App() {
  const { isMobile} = useDevice();
  
  // Set proper viewport meta tag for mobile devices
  useEffect(() => {
    // Find existing viewport meta tag or create a new one
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    
    // Set proper content attribute for responsive design
    viewportMeta.setAttribute(
      'content', 
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0'
    );
  }, []);

  return (
    <div className="min-h-screen bg-black/[0.96] antialiased relative overflow-x-hidden">
      {/* Ambient background with moving particles - fixed to cover entire page */}
      <div className="fixed inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={isMobile ? 60 : 100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col overflow-x-hidden">
        <Navbar />
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rag-chatbot" element={<RagChatbot />} />
            <Route path="/youtube-processor" element={<YouTubeProcessor />} />
            <Route path="/gmail-responder" element={<GmailResponder />} />
          </Routes>
        </div>

        {/* Animated robot - Only shown on non-mobile devices */}
        {!isMobile && (
          <div className="fixed bottom-4 right-4 w-64 h-64 z-10 pointer-events-none">
            <RoboAnimation />
          </div>
        )}
        
        {/* Mobile footer */}
        {isMobile && (
          <footer className="mt-auto py-4 px-4 text-center text-gray-500 text-xs">
            <p>© 2025 COSMOS AI. All rights reserved.</p>
          </footer>
        )}
      </div>
    </div>
  );
}

export default App;
