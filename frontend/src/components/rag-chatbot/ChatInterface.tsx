import React, { useState, useRef, useEffect } from 'react';
import { Send, Settings, FileText, Link as LinkIcon, Video, Loader2, MessageSquare, Image } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SourceFilters {
  pdf: boolean;
  url: boolean;
  youtube: boolean;
  image: boolean;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isProcessing: boolean;
  isQueryProcessing: boolean;
  sourceFilters: SourceFilters;
  onSourceFiltersChange: (filters: SourceFilters) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isProcessing,
  isQueryProcessing,
  sourceFilters,
  onSourceFiltersChange,
}) => {
  const [input, setInput] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing && !isQueryProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  const toggleFilter = (key: keyof SourceFilters) => {
    onSourceFiltersChange({
      ...sourceFilters,
      [key]: !sourceFilters[key],
    });
  };

  return (
    <motion.div 
      className="bg-black/40 backdrop-blur-md border border-purple-700/30 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(147,51,234,0.15)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex justify-between items-center p-4 border-b border-purple-700/20">
        <h2 className="text-xl font-bold text-white flex items-center">
          <MessageSquare className="mr-2 h-5 w-5 text-purple-400" />
          Chat with Knowledge Base
        </h2>
        <motion.button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          aria-label="Advanced settings"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div 
            className="p-4 bg-black/30 border-b border-purple-700/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-sm font-medium mb-3 text-white">Knowledge Source Filters</h3>
            <div className="flex flex-wrap gap-2">
              <motion.button
                onClick={() => toggleFilter('pdf')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                  sourceFilters.pdf
                    ? 'bg-purple-600/80 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF Documents
              </motion.button>
              <motion.button
                onClick={() => toggleFilter('url')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                  sourceFilters.url
                    ? 'bg-purple-600/80 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Web Articles
              </motion.button>
              <motion.button
                onClick={() => toggleFilter('youtube')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                  sourceFilters.youtube
                    ? 'bg-purple-600/80 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Video className="h-4 w-4 mr-2" />
                YouTube Transcripts
              </motion.button>
              <motion.button
                onClick={() => toggleFilter('image')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                  sourceFilters.image
                    ? 'bg-purple-600/80 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Image className="h-4 w-4 mr-2" />
                Images (OCR)
              </motion.button>
            </div>
            {!sourceFilters.pdf && !sourceFilters.url && !sourceFilters.youtube && !sourceFilters.image && (
              <p className="text-amber-300 text-xs mt-2 flex items-center">
                <span className="mr-1">⚠️</span> Please select at least one knowledge source type
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-600/50 scrollbar-track-transparent">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className={`max-w-[75%] px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-purple-600/80 text-white'
                  : message.role === 'system'
                  ? 'bg-white/10 text-white'
                  : 'bg-white/10 text-white'
              }`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-300 underline">
                        {children}
                      </a>
                    ),
                    code: ({ children }) => <code className="bg-black/40 px-1 py-0.5 rounded">{children}</code>,
                    strong: ({ children }) => <strong className="font-semibold text-purple-300">{children}</strong>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          </motion.div>
        ))}
        {isQueryProcessing && (
          <motion.div 
            className="flex justify-start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            key="thinking-animation"
          >
            <motion.div
              className="bg-white/10 text-white px-4 py-3 rounded-lg flex items-center"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Thinking...</span>
            </motion.div>
          </motion.div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Form */}
      <motion.form 
        onSubmit={handleSubmit} 
        className="p-4 border-t border-purple-700/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing || isQueryProcessing}
            placeholder="Ask a question about the content in the knowledge base..."
            className="flex-1 bg-black/30 border border-white/10 rounded-l-md px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isProcessing || isQueryProcessing}
            className={`bg-purple-600 text-white px-4 rounded-r-md flex items-center justify-center transition-colors 
            ${!input.trim() || isProcessing || isQueryProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'}`}
            whileHover={!(!input.trim() || isProcessing || isQueryProcessing) ? { scale: 1.05 } : {}}
            whileTap={!(!input.trim() || isProcessing || isQueryProcessing) ? { scale: 0.95 } : {}}
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
};

export default ChatInterface; 