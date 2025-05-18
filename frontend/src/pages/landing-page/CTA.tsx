import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { ArrowRight, Star, Sparkles, Rocket } from 'lucide-react';

const CTA: React.FC = () => {
  const ctaRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ctaRef, { once: false, amount: 0.3, margin: "100px" });
  
  // Stars animation positions
  const starPositions = [
    { top: '20%', left: '10%', delay: 0, size: 'w-3 h-3' },
    { top: '70%', left: '85%', delay: 0.2, size: 'w-2 h-2' },
    { top: '30%', left: '80%', delay: 0.5, size: 'w-4 h-4' },
    { top: '80%', left: '30%', delay: 0.3, size: 'w-2 h-2' },
    { top: '15%', left: '40%', delay: 0.7, size: 'w-3 h-3' },
  ];
  
  return (
    <section ref={ctaRef} className="py-20 md:py-32 px-4 md:px-0 relative">
      {/* Background glow effect */}
      <motion.div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-primary/10 blur-[120px]"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 0.6 } : { opacity: 0 }}
        transition={{ duration: 1.5 }}
      />
      
      <div className="container mx-auto relative z-10">
        <motion.div 
          className="max-w-4xl mx-auto rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md p-8 md:p-12 relative overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ 
            type: "spring", 
            stiffness: 50, 
            damping: 15,
            duration: 0.8, 
            delay: 0.1
          }}
          whileHover={{ 
            y: -5,
            transition: { type: "spring", stiffness: 150, damping: 15 }
          }}
        >
          {/* Background effects */}
          <div className="absolute inset-0 z-0">
            {/* Enhanced gradient effects */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full filter blur-3xl opacity-60">
              <motion.div 
                className="w-full h-full rounded-full bg-primary/30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ 
                  duration: 6, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            </div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/20 rounded-full filter blur-3xl opacity-60">
              <motion.div 
                className="w-full h-full rounded-full bg-blue-600/30"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(90,60,170,0.18),transparent_70%)]"></div>
            
            {/* Animated stars */}
            {starPositions.map((pos, index) => (
              <motion.div
                key={index}
                className={`absolute ${pos.size} text-white/40`}
                style={{ top: pos.top, left: pos.left }}
                initial={{ opacity: 0, scale: 0 }}
                animate={isInView ? { 
                  opacity: [0.4, 0.8, 0.4],
                  scale: [0.8, 1.2, 0.8],
                  rotate: [0, 45, 0]
                } : { opacity: 0, scale: 0 }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  delay: pos.delay,
                  ease: "easeInOut" 
                }}
              >
                <Star fill="currentColor" />
              </motion.div>
            ))}
          </div>
          
          <div className="relative z-10 text-center">
            {/* Title with animated icon */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <motion.div
                className="p-2 bg-gradient-to-r from-primary/80 to-blue-600/80 rounded-full"
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Rocket className="w-5 h-5 text-white" />
              </motion.div>
              <motion.h2 
                className="text-3xl md:text-4xl lg:text-5xl font-semibold bg-gradient-to-r from-purple-400 via-primary to-blue-500 bg-clip-text text-transparent font-heading inline-flex items-center"
                initial={{ opacity: 0, x: -5 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -5 }}
                transition={{
                  type: "spring",
                  stiffness: 50,
                  damping: 15,
                  delay: 0.3
                }}
              >
                Ready to explore the COSMOS?
              </motion.h2>
            </div>
            
            <motion.p 
              className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto font-sans leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{
                type: "spring",
                stiffness: 50,
                damping: 15,
                delay: 0.4
              }}
            >
              Join thousands of users who have already transformed their workflow with our AI assistant platform.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{
                type: "spring",
                stiffness: 50,
                damping: 15,
                delay: 0.5
              }}
            >
              <Link to="/register">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Button size="lg" className="relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90 font-medium px-8 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 w-full sm:w-auto">
                    {/* Animated shine effect */}
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ["120%", "-120%"] }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 2,
                        ease: "linear",
                      }}
                    />
                    
                    <span className="relative z-10 flex items-center">
                      Get Started Free
                      
                      <motion.span
                        className="ml-2 inline-flex items-center"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1.5,
                          ease: "easeInOut",
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </motion.span>
                    </span>
                  </Button>
                </motion.div>
              </Link>
              
              <Link to="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Button size="lg" variant="outline" className="border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-colors duration-300 w-full sm:w-auto">
                    <span className="flex items-center gap-1">
                      Sign In
                      <motion.span
                        animate={{ rotate: [0, 15, 0, -15, 0] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 5,
                          ease: "easeInOut"
                        }}
                      >
                        <Sparkles className="w-3 h-3 ml-1 text-primary/80" />
                      </motion.span>
                    </span>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
            
            {/* Subtle badge showing number of active users */}
            <motion.div
              className="mt-8 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 50, 
                damping: 15, 
                delay: 0.6 
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>5,000+ active users this week</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA; 