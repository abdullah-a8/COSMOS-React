import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Youtube, Mail } from 'lucide-react';
import { featureCardVariants, cardHoverVariants } from './AnimationVariants';

const Features: React.FC = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  
  return (
    <section ref={featuresRef} className="py-20 md:py-32 px-4 md:px-0 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(93,63,211,0.15),transparent_70%)]"></div>
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
            Unlock the Power of COSMOS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg font-sans leading-relaxed"
          >
            A comprehensive suite of AI-powered tools designed to enhance your productivity and streamline your workflow.
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <motion.div
            className="rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm p-6 shadow-xl shadow-primary/5 relative overflow-hidden"
            variants={featureCardVariants}
            initial="offscreen"
            whileInView="onscreen"
            exit="exit"
            viewport={{ once: false, amount: 0.3 }}
            whileHover={cardHoverVariants.hover}
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
            <div className="mb-4 p-2 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2 font-heading">RAG Chatbot</h3>
            <p className="text-sm text-muted-foreground font-sans">
              Powerful chatbot with Retrieval Augmented Generation that provides accurate answers based on your data.
            </p>
          </motion.div>
          
          {/* Feature 2 */}
          <motion.div
            className="rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm p-6 shadow-xl shadow-primary/5 relative overflow-hidden"
            variants={featureCardVariants}
            initial="offscreen"
            whileInView="onscreen"
            exit="exit"
            viewport={{ once: false, amount: 0.3 }}
            transition={{ delay: 0.15 }}
            whileHover={cardHoverVariants.hover}
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
            <div className="mb-4 p-2 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
              <Youtube className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2 font-heading">YouTube Processor</h3>
            <p className="text-sm text-muted-foreground font-sans">
              Automatically process YouTube videos for intelligent summaries, insights, and key points extraction.
            </p>
          </motion.div>
          
          {/* Feature 3 */}
          <motion.div
            className="rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm p-6 shadow-xl shadow-primary/5 relative overflow-hidden"
            variants={featureCardVariants}
            initial="offscreen"
            whileInView="onscreen"
            exit="exit"
            viewport={{ once: false, amount: 0.3 }}
            transition={{ delay: 0.3 }}
            whileHover={cardHoverVariants.hover}
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
            <div className="mb-4 p-2 bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2 font-heading">Gmail Responder</h3>
            <p className="text-sm text-muted-foreground font-sans">
              Intelligently respond to emails with context-aware AI that understands communication nuances.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Features; 