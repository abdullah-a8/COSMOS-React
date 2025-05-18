import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Bot, ArrowRight } from 'lucide-react';
import { containerVariants, itemVariants } from './AnimationVariants';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  
  return (
    <section ref={heroRef} className="relative pt-28 md:pt-36 px-4 md:px-0 min-h-screen flex items-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(93,63,211,0.2),transparent_50%)]"></div>
      <div className="container mx-auto relative z-10">
        <AnimatePresence>
          <motion.div 
            className="flex flex-col items-center justify-center text-center mb-16 md:mb-24"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            exit="exit"
            viewport={{ once: false, amount: 0.3 }}
          >
            <motion.div 
              variants={itemVariants} 
              className="w-20 h-20 md:w-24 md:h-24 mb-6 relative"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/80 to-purple-700/80 rounded-full shadow-xl">
                <Bot className="w-10 h-10 md:w-12 md:h-12 text-primary-foreground" />
              </div>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-400 via-primary to-blue-500 bg-clip-text text-transparent mb-6 tracking-tight font-heading"
            >
              COSMOS: Your Universe of AI Assistance
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl text-muted-foreground max-w-3xl mb-8 leading-relaxed font-sans"
            >
              Intelligent automation meets seamless integration. Unlock infinite potential with 
              the AI assistant platform designed for the future.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90 font-medium px-8 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-colors duration-300">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
        
        {/* Hero Visual */}
        <motion.div 
          className="relative max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ 
            duration: 0.8, 
            delay: 0.5,
            type: "spring"
          }}
          viewport={{ once: false, amount: 0.3 }}
          whileHover={{ y: -5 }}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-lg blur opacity-50"></div>
          <div className="relative bg-black/70 backdrop-blur border border-white/10 rounded-lg overflow-hidden shadow-2xl shadow-primary/20">
            <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(90,60,170,0.15),transparent_80%)]"></div>
            <div className="aspect-video rounded-lg overflow-hidden">
              <div className="p-6 md:p-8 flex flex-col h-full">
                <div className="flex space-x-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                
                <div className="flex justify-center items-center flex-1">
                  <div className="w-full md:w-4/5 h-full bg-black/50 rounded-lg p-4 flex items-center justify-center backdrop-blur-sm border border-white/5">
                    <div className="text-center">
                      <motion.div 
                        className="flex justify-center mb-4"
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <div className="w-20 h-20 md:w-24 md:h-24 relative">
                          <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl"></div>
                          <div className="relative flex items-center justify-center w-full h-full">
                            <Bot className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                          </div>
                        </div>
                      </motion.div>
                      <div className="text-foreground text-lg md:text-xl font-semibold font-[Satoshi,sans-serif]">COSMOS AI Platform</div>
                      <div className="text-muted-foreground">Intelligent. Expandable. Revolutionary.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero; 