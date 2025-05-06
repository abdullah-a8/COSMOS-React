import React, { ChangeEvent, useRef, useState } from 'react';
import { FileText, Link as LinkIcon, Upload, ChevronDown, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentUploadProps {
  uploadMethod: 'pdf' | 'url' | 'image';
  onUploadMethodChange: (method: 'pdf' | 'url' | 'image') => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
}

const ContentUpload: React.FC<ContentUploadProps> = ({
  uploadMethod,
  onUploadMethodChange,
  file,
  onFileChange,
  url,
  onUrlChange,
  onSubmit,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    onUrlChange(e.target.value);
  };

  const handleReset = () => {
    onFileChange(null);
    onUrlChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Determine file input accept attribute based on upload method
  const getAcceptTypes = () => {
    if (uploadMethod === 'pdf') {
      return '.pdf';
    } else if (uploadMethod === 'image') {
      return 'image/*,.pdf'; // Accept both images and PDFs
    }
    return '';
  };

  // Get the appropriate button text based on upload method
  const getProcessButtonText = () => {
    if (isProcessing) return 'Processing...';
    
    if (uploadMethod === 'pdf') {
      return 'Process PDF';
    } else if (uploadMethod === 'image') {
      return 'Process Image';
    }
    return 'Process';
  };

  // Get placeholder text based on upload method
  const getPlaceholderText = () => {
    if (uploadMethod === 'pdf') {
      return 'Drop your PDF file here or click to browse';
    } else if (uploadMethod === 'image') {
      return 'Drop your image or PDF here or click to browse';
    }
    return 'Drop your file here or click to browse';
  };

  // Get format description text based on upload method
  const getFormatText = () => {
    if (uploadMethod === 'pdf') {
      return 'PDF files only, max 10MB';
    } else if (uploadMethod === 'image') {
      return 'Images or PDF files, max 10MB';
    }
    return 'Max 10MB';
  };

  return (
    <motion.div 
      className="mb-8 p-6 bg-black/40 backdrop-blur-md border border-purple-700/30 rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.15)]"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex justify-between items-center cursor-pointer" onClick={toggleExpanded}>
        <motion.h2 
          className="text-xl font-bold mb-0 text-white flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Upload className="mr-2 h-5 w-5 text-purple-400" />
          Add Content to Knowledge Base
        </motion.h2>
        <motion.button 
          className="text-white/70 hover:text-white transition-colors"
          aria-label={isExpanded ? "Collapse section" : "Expand section"}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="mt-4"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Upload Method Selection */}
            <motion.div 
              className="flex space-x-1 mb-4 bg-black/20 rounded-lg p-1 w-fit"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <motion.button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  uploadMethod === 'pdf'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => onUploadMethodChange('pdf')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF File
                </div>
              </motion.button>
              <motion.button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  uploadMethod === 'image'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => onUploadMethodChange('image')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center">
                  <Image className="h-4 w-4 mr-2" />
                  Image
                </div>
              </motion.button>
              <motion.button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  uploadMethod === 'url'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => onUploadMethodChange('url')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  URL
                </div>
              </motion.button>
            </motion.div>

            {/* File Upload (PDF or Image) */}
            <AnimatePresence mode="wait">
              {(uploadMethod === 'pdf' || uploadMethod === 'image') && (
                <motion.div 
                  className="space-y-4"
                  key={`${uploadMethod}-upload`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className="relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept={getAcceptTypes()}
                      disabled={isProcessing}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <motion.div 
                      className={`w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center
                        ${file ? 'border-purple-600 bg-purple-600/10' : 'border-white/20 hover:border-purple-400/50 hover:bg-white/5'} 
                        transition-all duration-200`}
                      whileHover={!file ? { scale: 1.01, borderColor: 'rgba(168, 85, 247, 0.5)' } : {}}
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {file ? (
                          <>
                            {uploadMethod === 'image' && file.type.startsWith('image/') ? (
                              <Image className="h-8 w-8 text-purple-400 mb-2" />
                            ) : (
                              <FileText className="h-8 w-8 text-purple-400 mb-2" />
                            )}
                            <p className="text-sm font-medium text-white mb-1">{file.name}</p>
                            <p className="text-xs text-white/60">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </>
                        ) : (
                          <>
                            {uploadMethod === 'image' ? (
                              <Image className="h-8 w-8 text-white/40 mb-2" />
                            ) : (
                              <FileText className="h-8 w-8 text-white/40 mb-2" />
                            )}
                            <p className="text-sm font-medium text-white mb-1">{getPlaceholderText()}</p>
                            <p className="text-xs text-white/60">{getFormatText()}</p>
                          </>
                        )}
                      </motion.div>
                    </motion.div>
                  </motion.div>

                  <motion.div 
                    className="flex space-x-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <motion.button
                      onClick={onSubmit}
                      disabled={!file || isProcessing}
                      className={`px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium flex-1 transition-colors
                      ${(!file || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      whileHover={!(!file || isProcessing) ? { scale: 1.03 } : {}}
                      whileTap={!(!file || isProcessing) ? { scale: 0.97 } : {}}
                    >
                      {getProcessButtonText()}
                    </motion.button>
                    <AnimatePresence>
                      {file && (
                        <motion.button
                          onClick={handleReset}
                          disabled={isProcessing}
                          className={`px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md font-medium transition-colors
                          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                          initial={{ opacity: 0, width: 0, scale: 0.8 }}
                          animate={{ opacity: 1, width: 'auto', scale: 1 }}
                          exit={{ opacity: 0, width: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          whileHover={!isProcessing ? { scale: 1.05 } : {}}
                          whileTap={!isProcessing ? { scale: 0.95 } : {}}
                        >
                          Reset
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              )}

              {/* URL Input */}
              {uploadMethod === 'url' && (
                <motion.div 
                  className="space-y-4"
                  key="url-upload"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <div className="flex">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <LinkIcon className="h-5 w-5 text-white/40" />
                        </div>
                        <motion.input
                          type="url"
                          value={url}
                          onChange={handleUrlChange}
                          disabled={isProcessing}
                          placeholder="Enter article or news URL"
                          className="block w-full pl-10 pr-3 py-2.5 bg-black/20 border border-white/10 rounded-md focus:ring-purple-500 focus:border-purple-500 text-white placeholder-white/40"
                          whileFocus={{ borderColor: 'rgba(168, 85, 247, 0.5)' }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="flex space-x-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <motion.button
                      onClick={onSubmit}
                      disabled={!url || isProcessing}
                      className={`px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium flex-1 transition-colors
                      ${(!url || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      whileHover={!(!url || isProcessing) ? { scale: 1.03 } : {}}
                      whileTap={!(!url || isProcessing) ? { scale: 0.97 } : {}}
                    >
                      {isProcessing ? 'Processing...' : 'Process URL'}
                    </motion.button>
                    <AnimatePresence>
                      {url && (
                        <motion.button
                          onClick={handleReset}
                          disabled={isProcessing}
                          className={`px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-md font-medium transition-colors
                          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                          initial={{ opacity: 0, width: 0, scale: 0.8 }}
                          animate={{ opacity: 1, width: 'auto', scale: 1 }}
                          exit={{ opacity: 0, width: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          whileHover={!isProcessing ? { scale: 1.05 } : {}}
                          whileTap={!isProcessing ? { scale: 0.95 } : {}}
                        >
                          Reset
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ContentUpload; 