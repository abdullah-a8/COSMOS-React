import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Slider } from "../ui/slider";
import { useDevice } from "../../hooks/useDevice";
import { X } from "lucide-react";

interface SidebarSettingsProps {
  isOpen: boolean;
  chunkSize: number;
  chunkOverlap: number;
  onChunkSizeChange: (value: number) => void;
  onChunkOverlapChange: (value: number) => void;
  onReset: () => void;
  onClose: () => void;
}

const SidebarSettings: React.FC<SidebarSettingsProps> = ({
  isOpen,
  chunkSize,
  chunkOverlap,
  onChunkSizeChange,
  onChunkOverlapChange,
  onReset,
  onClose,
}) => {
  const { isMobile } = useDevice();

  // Lock body scroll when sheet is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMobile]);

  // Staggered animation variants for children
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  // Mobile bottom sheet animation
  const sheetVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 }
  };

  // Return either a bottom sheet on mobile or a sidebar on desktop
  if (isMobile) {
    return (
      <>
        {/* Backdrop overlay */}
        {isOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
        
        {/* Bottom sheet */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 max-h-[90vh] rounded-t-2xl bg-black/90 border-t border-purple-700/30 overflow-y-auto z-[101] shadow-[0_-5px_15px_rgba(147,51,234,0.3)]"
          initial="hidden"
          animate={isOpen ? "visible" : "hidden"}
          exit="hidden"
          variants={sheetVariants}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="sticky top-0 p-4 flex justify-between items-center border-b border-purple-700/30 bg-black backdrop-blur-md z-10">
            <h2 className="text-xl font-bold text-purple-300">Settings</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-purple-900/30 text-white hover:bg-purple-900/50 transition-colors"
              aria-label="Close settings"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 text-white">
            {/* Chunk Size Slider */}
            <div className="mb-10">
              <h3 className="font-medium mb-4 text-lg text-white">Chunk Size: {chunkSize}</h3>
              <Slider 
                min={100} 
                max={3000} 
                step={50} 
                value={[chunkSize]}
                onValueChange={(value) => onChunkSizeChange(value[0])}
                className="mb-4"
              />
              <div className="text-sm text-white/70 space-y-2">
                <p className="mb-1">Number of words in each content chunk.</p>
                <div className="space-y-1">
                  <p><strong>Small (100-300):</strong> Better for specific queries</p>
                  <p><strong>Large (1000-3000):</strong> Better for summarization</p>
                </div>
              </div>
            </div>

            {/* Chunk Overlap Slider */}
            <div className="mb-10">
              <h3 className="font-medium mb-4 text-lg text-white">Chunk Overlap: {chunkOverlap}</h3>
              <Slider 
                min={10} 
                max={300} 
                step={10} 
                value={[chunkOverlap]}
                onValueChange={(value) => onChunkOverlapChange(value[0])}
                className="mb-4"
              />
              <div className="text-sm text-white/70 space-y-2">
                <p className="mb-1">Overlap between consecutive chunks.</p>
                <div className="space-y-1">
                  <p><strong>Small (10-50):</strong> Reduces redundancy</p>
                  <p><strong>Large (200-300):</strong> Ensures context continuity</p>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="space-y-3 mb-8 pb-6">
              <button
                onClick={onReset}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                aria-label="Reset all settings"
              >
                Reset All Settings
              </button>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={`fixed top-20 bottom-0 left-0 w-80 bg-black/40 backdrop-blur-lg border-r border-purple-700/30 overflow-y-auto transition-transform duration-300 ease-in-out z-50 shadow-[5px_0_15px_-5px_rgba(147,51,234,0.2)]
      ${isOpen ? "translate-x-0" : "-translate-x-full"} scrollbar-thin scrollbar-thumb-purple-600/50 scrollbar-track-transparent`}
      role="complementary"
      aria-label="Settings sidebar"
    >
      <motion.div 
        className="p-6 text-white pt-10"
        initial="hidden"
        animate={isOpen ? "show" : "hidden"}
        variants={containerVariants}
      >
        <motion.h2 
          className="text-2xl font-bold mb-8 text-purple-300"
          variants={itemVariants}
        >
          Settings
        </motion.h2>

        {/* Chunk Size Slider */}
        <motion.div 
          className="mb-10"
          variants={itemVariants}
        >
          <h3 className="font-medium mb-4 text-lg text-white">Chunk Size: {chunkSize}</h3>
          <Slider 
            min={100} 
            max={3000} 
            step={50} 
            value={[chunkSize]}
            onValueChange={(value) => onChunkSizeChange(value[0])}
            className="mb-4"
          />
          <div className="text-sm text-white/70 space-y-2">
            <p className="mb-1">Number of words in each content chunk.</p>
            <div className="space-y-1">
              <p><strong>Small (100-300):</strong> Better for specific queries</p>
              <p><strong>Large (1000-3000):</strong> Better for summarization</p>
            </div>
          </div>
        </motion.div>

        {/* Chunk Overlap Slider */}
        <motion.div 
          className="mb-10"
          variants={itemVariants}
        >
          <h3 className="font-medium mb-4 text-lg text-white">Chunk Overlap: {chunkOverlap}</h3>
          <Slider 
            min={10} 
            max={300} 
            step={10} 
            value={[chunkOverlap]}
            onValueChange={(value) => onChunkOverlapChange(value[0])}
            className="mb-4"
          />
          <div className="text-sm text-white/70 space-y-2">
            <p className="mb-1">Overlap between consecutive chunks.</p>
            <div className="space-y-1">
              <p><strong>Small (10-50):</strong> Reduces redundancy</p>
              <p><strong>Large (200-300):</strong> Ensures context continuity</p>
            </div>
          </div>
        </motion.div>

        {/* Reset Button */}
        <motion.div 
          className="space-y-3 mb-6"
          variants={itemVariants}
        >
          <button
            onClick={onReset}
            className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            aria-label="Reset all settings"
          >
            Reset All Settings
          </button>
        </motion.div>
      </motion.div>
    </aside>
  );
};

export default SidebarSettings; 