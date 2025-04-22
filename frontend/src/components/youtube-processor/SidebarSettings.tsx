import React from "react";
import { motion } from "framer-motion";
import { Slider } from "../ui/slider";

interface SidebarSettingsProps {
  isOpen: boolean;
  chunkSize: number;
  chunkOverlap: number;
  onChunkSizeChange: (value: number) => void;
  onChunkOverlapChange: (value: number) => void;
  onReset: () => void;
}

const SidebarSettings: React.FC<SidebarSettingsProps> = ({
  isOpen,
  chunkSize,
  chunkOverlap,
  onChunkSizeChange,
  onChunkOverlapChange,
  onReset,
}) => {
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

  return (
    <aside
      className={`fixed top-20 bottom-0 left-0 w-80 bg-black/40 backdrop-blur-lg border-r border-purple-700/30 overflow-y-auto transition-transform duration-300 ease-in-out z-20 shadow-[5px_0_15px_-5px_rgba(147,51,234,0.2)]
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