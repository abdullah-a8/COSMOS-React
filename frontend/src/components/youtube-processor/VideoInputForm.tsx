import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";

interface VideoInputFormProps {
  videoUrl: string;
  onChangeUrl: (url: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  error: string | null;
}

const VideoInputForm: React.FC<VideoInputFormProps> = ({
  videoUrl,
  onChangeUrl,
  onSubmit,
  isProcessing,
  error,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Timer effect
  useEffect(() => {
    let timerId: number | null = null;
    
    if (isProcessing) {
      // Reset timer when processing starts
      setElapsedTime(0);
      
      // Start timer
      timerId = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (timerId) {
      // Clear timer when processing ends
      clearInterval(timerId);
    }
    
    // Clean up timer on unmount
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isProcessing]);
  
  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-4 bg-black/30 p-6 rounded-xl border border-purple-700/30 shadow-[0_0_15px_rgba(147,51,234,0.15)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="space-y-2">
        <label htmlFor="videoUrl" className="block text-white font-medium">
          YouTube URL
        </label>
        <input
          type="text"
          id="videoUrl"
          value={videoUrl}
          onChange={(e) => onChangeUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full p-3 bg-black/50 text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          disabled={isProcessing}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      <Button
        type="submit"
        disabled={isProcessing || !videoUrl}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors"
      >
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        ) : (
          "Process Video"
        )}
      </Button>
      
      {/* Timer display */}
      {isProcessing && (
        <div className="mt-4 flex justify-center">
          <div className="bg-black/50 px-4 py-2 rounded-lg flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse mr-2"></div>
            <div className="text-white font-mono">
              <span className="mr-2">Processing time:</span>
              <span className="font-bold">{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>
      )}
    </motion.form>
  );
};

export default VideoInputForm; 