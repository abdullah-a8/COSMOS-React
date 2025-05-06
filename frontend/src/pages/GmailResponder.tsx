import React from 'react';
import { motion } from 'framer-motion';

const GmailResponder: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.h1 
        className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 leading-relaxed py-4"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          y: [0, -20, 0]
        }}
        transition={{ 
          duration: 3,
          ease: "easeInOut",
          repeat: Infinity,
          opacity: { duration: 0.8 },
          scale: { duration: 0.8 }
        }}
      >
        Coming Soon
      </motion.h1>
    </div>
  );
};

export default GmailResponder; 