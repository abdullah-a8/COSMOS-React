import React from "react";
import { motion } from "framer-motion";

const InfoSection: React.FC = () => {
  return (
    <motion.div 
      className="bg-black/30 p-6 rounded-xl border border-purple-700/20 shadow-[0_0_15px_rgba(147,51,234,0.15)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
      
      <div className="space-y-6">
        <motion.div 
          className="flex gap-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-700/30 flex items-center justify-center text-purple-300 font-bold">
            1
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Enter YouTube URL</h3>
            <p className="text-gray-400">
              Paste any YouTube video URL in the form above. The system supports most YouTube URL formats.
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          className="flex gap-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-700/30 flex items-center justify-center text-purple-300 font-bold">
            2
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Process Transcript</h3>
            <p className="text-gray-400">
              The system extracts the video transcript, divides it into meaningful chunks, and prepares it for storage.
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          className="flex gap-4"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-700/30 flex items-center justify-center text-purple-300 font-bold">
            3
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Query in RAG Chatbot</h3>
            <p className="text-gray-400">
              Once processed, you can ask questions about the video content in the RAG Chatbot section.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default InfoSection; 