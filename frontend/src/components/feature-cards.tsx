import { Link as RouterLink } from "react-router-dom"
import { motion } from "framer-motion"
import { MessageSquare, Youtube, Mail } from "lucide-react"
import { Button } from "./ui/button"
import { useDevice } from "../hooks/useDevice"

export default function FeatureCards() {
  const { isMobile } = useDevice();

  return (
    <section className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16 -mt-5 sm:mt-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* RAG Chatbot Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-5 md:p-6 hover:border-purple-500/50 transition-all flex flex-col h-full shadow-lg"
        >
          <div className="mb-4 flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
              <MessageSquare className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white`}>RAG Chatbot</h3>
              <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Chat with your documents</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm md:text-base mb-5 md:mb-6 flex-grow">
            Upload your documents and ask questions. The AI will use Retrieval-Augmented Generation to provide answers
            based on the content.
          </p>
          <RouterLink to="/rag-chatbot" className="mt-auto">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Go to Chatbot</Button>
          </RouterLink>
        </motion.div>

        {/* YouTube Processor Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-5 md:p-6 hover:border-purple-500/50 transition-all flex flex-col h-full shadow-lg"
        >
          <div className="mb-4 flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
              <Youtube className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white`}>YouTube Processor</h3>
              <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Summarize & Analyze Videos</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm md:text-base mb-5 md:mb-6 flex-grow">
            Provide a YouTube video URL to get summaries, key topics, or ask specific questions about the video content.
          </p>
          <RouterLink to="/youtube-processor" className="mt-auto">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Go to Processor</Button>
          </RouterLink>
        </motion.div>

        {/* Gmail Responder Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-5 md:p-6 hover:border-purple-500/50 transition-all flex flex-col h-full shadow-lg"
        >
          <div className="mb-4 flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
              <Mail className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white`}>Gmail Responder</h3>
              <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>AI-Powered Email Assistance</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm md:text-base mb-5 md:mb-6 flex-grow">
            Connect your Gmail account to get AI-drafted replies or summaries for your emails, helping you manage your
            inbox efficiently.
          </p>
          <div className="mb-3 px-3 py-1.5 rounded-full bg-purple-600/20 border border-purple-600/30 inline-block">
            <span className="text-xs font-medium text-purple-400">Coming Soon</span>
          </div>
          <RouterLink to="/gmail-responder" className="mt-auto">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Go to Responder</Button>
          </RouterLink>
        </motion.div>
      </div>
    </section>
  )
}
