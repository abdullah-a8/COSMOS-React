import React, { useRef } from 'react';
import { motion } from 'framer-motion';

const HowItWorks: React.FC = () => {
  const howItWorksRef = useRef<HTMLDivElement>(null);
  
  return (
    <section ref={howItWorksRef} className="py-20 md:py-32 px-4 md:px-0 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(93,63,211,0.15),transparent_70%)]"></div>
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl lg:text-5xl font-semibold bg-gradient-to-r from-purple-400 via-primary to-blue-500 bg-clip-text text-transparent mb-6 font-heading"
          >
            How COSMOS Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg font-sans leading-relaxed"
          >
            Seamless integration of artificial intelligence into your daily workflow
          </motion.p>
        </div>

        {/* Steps - Redesigned modern layout with cards instead of vertical line */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <motion.div
              className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6 relative overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16 opacity-60"></div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
                <span className="text-lg font-bold text-white">1</span>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3 font-heading">Create your account</h3>
              <p className="text-muted-foreground font-sans">
                Sign up for COSMOS in seconds and gain immediate access to our suite of AI tools.
              </p>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div
              className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6 relative overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 opacity-60"></div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-primary flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                <span className="text-lg font-bold text-white">2</span>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3 font-heading">Choose your AI assistant</h3>
              <p className="text-muted-foreground font-sans">
                Select from our specialized AI tools designed for different tasks and requirements.
              </p>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div
              className="bg-black/30 backdrop-blur-md border border-white/10 rounded-xl p-6 relative overflow-hidden"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl -mr-16 -mt-16 opacity-60"></div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-purple-600/30">
                <span className="text-lg font-bold text-white">3</span>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3 font-heading">Experience the future</h3>
              <p className="text-muted-foreground font-sans">
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