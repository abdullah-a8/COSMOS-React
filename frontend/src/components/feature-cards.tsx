import { Link as RouterLink } from "react-router-dom"
import { motion } from "framer-motion"
import { MessageSquare, Youtube, Mail } from "lucide-react"
import { Button } from "./ui/button"

export default function FeatureCards() {
  return (
    <section className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-16 mt-[-5rem]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* RAG Chatbot Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all flex flex-col h-full"
        >
          <div className="mb-4 flex items-center">
            <MessageSquare className="h-6 w-6 text-purple-400 mr-2" />
            <div>
              <h3 className="text-xl font-bold text-white">RAG Chatbot</h3>
              <p className="text-gray-400 text-sm">Chat with your documents</p>
            </div>
          </div>
          <p className="text-gray-300 mb-6 flex-grow">
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
          className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all flex flex-col h-full"
        >
          <div className="mb-4 flex items-center">
            <Youtube className="h-6 w-6 text-purple-400 mr-2" />
            <div>
              <h3 className="text-xl font-bold text-white">YouTube Processor</h3>
              <p className="text-gray-400 text-sm">Summarize & Analyze Videos</p>
            </div>
          </div>
          <p className="text-gray-300 mb-6 flex-grow">
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
          className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all flex flex-col h-full"
        >
          <div className="mb-4 flex items-center">
            <Mail className="h-6 w-6 text-purple-400 mr-2" />
            <div>
              <h3 className="text-xl font-bold text-white">Gmail Responder</h3>
              <p className="text-gray-400 text-sm">AI-Powered Email Assistance</p>
            </div>
          </div>
          <p className="text-gray-300 mb-6 flex-grow">
            Connect your Gmail account to get AI-drafted replies or summaries for your emails, helping you manage your
            inbox efficiently.
          </p>
          <RouterLink to="/gmail-responder" className="mt-auto">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Go to Responder</Button>
          </RouterLink>
        </motion.div>
      </div>
    </section>
  )
}
