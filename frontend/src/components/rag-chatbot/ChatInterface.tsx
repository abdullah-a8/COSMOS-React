import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Settings, FileText, Link as LinkIcon, Video, Loader2, MessageSquare, Image } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence} from 'framer-motion';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw'; // Import rehype-raw
import 'katex/dist/katex.min.css';
import type { Components } from 'react-markdown';
import LaTeXErrorBoundary from './LaTeXErrorBoundary';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: { number: number; text: string; type: string; identifier: string }[];
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
  const [renderError, setRenderError] = useState<string | null>(null);

  const formatMessageWithCitations = (content: string, messageId: string | number): { processedContent: string; sources: Array<{ number: number; text: string; type: string; identifier: string }> } => {
    const sourceRegex = /\[Source: (PDF document|image|url|youtube) ([a-f0-9]+)\]/g;
    let match;
    const foundSources: Array<{ fullMatch: string; type: string; identifier: string }> = [];
    
    // First pass: find all sources
    while ((match = sourceRegex.exec(content)) !== null) {
      foundSources.push({ fullMatch: match[0], type: match[1], identifier: match[2] });
    }

    if (foundSources.length === 0) {
      return { processedContent: content, sources: [] };
    }

    const uniqueSources: Array<{ number: number; text: string; type: string; identifier: string }> = [];
    const sourceMap = new Map<string, number>();
    let processedContent = content;
    let citationCounter = 1;

    foundSources.forEach(source => {
      const sourceKey = `${source.type}:${source.identifier}`;
      let citationNumber: number;

      if (sourceMap.has(sourceKey)) {
        citationNumber = sourceMap.get(sourceKey)!;
      } else {
        citationNumber = citationCounter++;
        sourceMap.set(sourceKey, citationNumber);
        uniqueSources.push({
          number: citationNumber,
          text: `${source.type === 'PDF document' ? 'PDF' : source.type.charAt(0).toUpperCase() + source.type.slice(1)}: ${source.identifier.substring(0, 12)}...`, // Shorten identifier for display
          type: source.type,
          identifier: source.identifier
        });
      }
      // Replace only the first occurrence of this specific fullMatch to avoid issues with identical sources in different places
      // This is a simplification; a more robust approach might involve replacing based on match indices if content could have identical [Source:...] strings that are meant to be distinct.
      // However, for typical RAG outputs where a source is cited multiple times, this should correctly use the same number.
      processedContent = processedContent.replace(
        source.fullMatch,
        `<a href="#source_item_${messageId}_${citationNumber}" style="text-decoration: none; color: inherit; cursor: pointer;"><sup>${citationNumber}</sup></a>`
      );
    });
    
    let sourcesSection = `\n\n---\n<div id="sources_list_${messageId}">\n\n**Sources:**\n`;
    uniqueSources.sort((a,b) => a.number - b.number).forEach(source => {
      // Using div for each source item to ensure the ID works correctly for navigation
      sourcesSection += `<div id="source_item_${messageId}_${source.number}">${source.number}. ${source.text}</div>\n`;
    });
    sourcesSection += "\n</div>"

    return { processedContent: processedContent + sourcesSection, sources: uniqueSources };
  };


  // Scroll to bottom on new messages
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset render error when messages change
  useEffect(() => {
    setRenderError(null);
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

  // Safe LaTeX rendering with error handling
  const handleRenderError = useCallback((error: Error) => {
    console.error('KaTeX rendering error:', error);
    setRenderError('There was an error rendering LaTeX content. The interface will remain functional.');
  }, []);

  // Custom components for markdown rendering including LaTeX
  const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
    li: ({ children }) => <li className="mb-1">{children}</li>,
    a: ({ node, href, children, ...props }) => {
      if (href && href.startsWith('#')) {
        // Internal link for citations
        return (
          <a
            href={href}
            {...props}
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              const targetId = href.substring(1); // Remove #
              const targetElement = document.getElementById(targetId);
              if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            // style from formatMessageWithCitations is already applied via rehypeRaw
            // but we can ensure cursor pointer here if needed, though it should be inherited
          >
            {children}
          </a>
        );
      }
      // External link
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props} className="text-purple-300 underline">
          {children}
        </a>
      );
    },
    code: ({ children }) => <code className="bg-black/40 px-1 py-0.5 rounded">{children}</code>,
    strong: ({ children }) => <strong className="font-semibold text-purple-300">{children}</strong>,
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
            className="bg-black/30 border-b border-purple-700/20 overflow-hidden"
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4">
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
                  transition={{ duration: 0.3 }}
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
                  transition={{ duration: 0.3 }}
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
                  transition={{ duration: 0.3 }}
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
                  transition={{ duration: 0.3 }}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Images (OCR)
                </motion.button>
              </div>
              
              {!sourceFilters.pdf && !sourceFilters.url && !sourceFilters.youtube && !sourceFilters.image && (
                <motion.p 
                  className="text-amber-300 text-xs mt-2 flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="mr-1">⚠️</span> Please select at least one knowledge source type
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-purple-600/50 scrollbar-track-transparent">
        {renderError && (
          <div className="bg-red-900/30 border border-red-500/30 text-white p-2 rounded text-xs mb-2">
            {renderError}
            <button 
              className="ml-2 text-red-300 hover:text-red-100" 
              onClick={() => setRenderError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
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
              <LaTeXErrorBoundary onError={handleRenderError}>
                <div className="prose prose-invert prose-sm max-w-none latex-container">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false, output: 'html' }], rehypeRaw]} // Add rehypeRaw here
                    components={markdownComponents}
                  >
                    {message.role === 'assistant' ? formatMessageWithCitations(message.content, index).processedContent : message.content}
                  </ReactMarkdown>
                </div>
              </LaTeXErrorBoundary>
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