import React from 'react';
import { Loader2, CheckCircle, AlertCircle} from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadStatusProps {
  status: 'idle' | 'processing' | 'success' | 'error';
  elapsedTime: number;
  statusMessage: string;
}

const UploadStatus: React.FC<UploadStatusProps> = ({ status, elapsedTime, statusMessage }) => {
  // Format processing time in the exact same way as YouTubeProcessor.tsx
  const formatProcessingTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins} minute${mins !== 1 ? 's' : ''} and ${secs} second${secs !== 1 ? 's' : ''}`;
    }
  };

  // Don't show anything if idle
  if (status === 'idle') return null;

  return (
    <motion.div 
      className={`mb-8 p-5 rounded-lg border shadow-[0_0_15px_rgba(147,51,234,0.15)] ${
        status === 'processing' ? 'bg-blue-900/20 border-blue-800/50' :
        status === 'success' ? 'bg-green-900/20 border-green-800/50' :
        'bg-red-900/20 border-red-800/50'
      }`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start space-x-4">
        <motion.div 
          className="flex-shrink-0 mt-0.5"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {status === 'processing' && <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />}
          {status === 'success' && <CheckCircle className="h-5 w-5 text-green-400" />}
          {status === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
        </motion.div>
        
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${
            status === 'processing' ? 'text-blue-300' :
            status === 'success' ? 'text-green-300' :
            'text-red-300'
          }`}>
            {status === 'processing' ? 'Processing Content' : 
             status === 'success' ? 'Processing Complete' : 
             'Processing Failed'}
          </h3>
          <motion.div 
            className="mt-1 text-sm text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {statusMessage}
          </motion.div>
          
          {/* Timer Display - YouTube processor style */}
          {(status === 'success' || status === 'error') && (
            <motion.div 
              className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-purple-900/30 border border-purple-700/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-purple-300 text-sm">
                {status === 'success' 
                  ? `Processed in ${formatProcessingTime(elapsedTime)}` 
                  : `Failed after ${formatProcessingTime(elapsedTime)}`}
              </span>
            </motion.div>
          )}
        </div>
        
        {/* Processing Timer */}
        {status === 'processing' && (
          <motion.div 
            className="px-3 py-2 rounded-lg bg-blue-900/30 border border-blue-700/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse mr-2"></div>
              <span className="font-mono text-sm font-semibold text-blue-300">
                {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:
                {(elapsedTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default UploadStatus; 