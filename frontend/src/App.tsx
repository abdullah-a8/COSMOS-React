import { Routes, Route } from 'react-router-dom';
import { SparklesCore } from './components/sparkles';
import Navbar from './components/navbar';
import Home from './pages/Home';
import RagChatbot from './pages/RagChatbot';
import YouTubeProcessor from './pages/YouTubeProcessor';
import GmailResponder from './pages/GmailResponder';
import { RoboAnimation } from './components/robo-animation';

function App() {
  return (
    <div className="min-h-screen bg-black/[0.96] antialiased relative">
      {/* Ambient background with moving particles - fixed to cover entire page */}
      <div className="fixed inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rag-chatbot" element={<RagChatbot />} />
            <Route path="/youtube-processor" element={<YouTubeProcessor />} />
            <Route path="/gmail-responder" element={<GmailResponder />} />
          </Routes>
        </div>

        {/* Animated robot - positioned in bottom right without overlapping content */}
        <div className="fixed bottom-4 right-4 w-64 h-64 z-10 pointer-events-none">
          <RoboAnimation />
        </div>
      </div>
    </div>
  );
}

export default App;
