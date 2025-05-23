import React, { useRef } from 'react';
import { motion } from 'framer-motion';

const HowItWorks: React.FC = () => {
  const howItWorksRef = useRef<HTMLDivElement>(null);
  
  return (
    <section ref={howItWorksRef} id="how-it-works-section" className="py-16 sm:py-20 md:py-32 px-4 md:px-0 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(93,63,211,0.15),transparent_70%)]"></div>
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold bg-gradient-to-r from-purple-400 via-primary to-blue-500 bg-clip-text text-transparent mb-4 sm:mb-6 font-heading px-2"
          >
            How COSMOS Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-sans leading-relaxed px-2"
          >
            Seamless integration of artificial intelligence into your daily workflow
          </motion.p>
        </div>

        {/* Steps - Redesigned modern layout with cards instead of vertical line */}
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-5 sm:gap-6">
            {/* Step 1 */}
            <motion.div
              className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6 relative overflow-hidden flex-1"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                transition: { type: "spring", stiffness: 300, damping: 15 }
              }}
            >
              <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-primary/10 rounded-full blur-2xl -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 opacity-60"></div>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-primary/30">
                <span className="text-base sm:text-lg font-bold text-white">1</span>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-3 font-heading">Create your account</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                Sign up for COSMOS in seconds and gain immediate access to our suite of AI tools.
              </p>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div
              className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6 relative overflow-hidden flex-1"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                transition: { type: "spring", stiffness: 300, damping: 15 }
              }}
            >
              <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 opacity-60"></div>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-blue-500/30">
                <span className="text-base sm:text-lg font-bold text-white">2</span>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-3 font-heading">Choose your AI assistant</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                Select from our specialized AI tools designed for different tasks and requirements.
              </p>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div
              className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6 relative overflow-hidden flex-1"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
                transition: { type: "spring", stiffness: 300, damping: 15 }
              }}
            >
              <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-purple-600/10 rounded-full blur-2xl -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 opacity-60"></div>
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-purple-600/30">
                <span className="text-base sm:text-lg font-bold text-white">3</span>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2 sm:mb-3 font-heading">Experience the future</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                Watch as COSMOS handles complex tasks with unprecedented intelligence and efficiency.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 