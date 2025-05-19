import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useAnimation } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Bot, ArrowRight, Sparkles } from 'lucide-react';
import { itemVariants } from './AnimationVariants';
import { useAuth } from '../../hooks/useAuth.tsx';

const Hero: React.FC = () => {
  const { isAuthenticated } = useAuth({ refreshInterval: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const isInView = useInView(contentRef, { 
    once: false, 
    amount: 0.3,
    margin: "-100px 0px" // Triggers animation slightly before element comes into view
  });
  
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    } else {
      controls.start("hidden"); // Animate out when scrolling away
    }
  }, [isInView, controls]);
  
  // Update the containerVariants to include better fade effects
  const enhancedContainerVariants = {
    hidden: { 
      opacity: 0,
      y: 50,
      transition: { 
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.7,
        ease: "easeOut",
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: { 
        duration: 0.5,
        ease: "easeIn",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };
  
  return (
    <section ref={heroRef} className="relative pt-24 sm:pt-28 md:pt-36 px-4 md:px-0 min-h-screen flex items-center">
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(93,63,211,0.25),transparent_60%)] opacity-80"></div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 sm:w-64 h-32 sm:h-64 rounded-full bg-purple-600/10 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 rounded-full bg-blue-600/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="container mx-auto relative z-10">
        <AnimatePresence>
          <motion.div 
            ref={contentRef}
            className="flex flex-col items-center justify-center text-center mb-10 sm:mb-16 md:mb-24"
            variants={enhancedContainerVariants}
            initial="hidden"
            animate={controls}
            exit="exit"
          >
            <motion.div 
              variants={itemVariants} 
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-6 relative"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl"></div>
              <div className="relative flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/80 to-purple-700/80 rounded-full shadow-xl">
                <Bot className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary-foreground" />
              </div>
              
              {/* Add sparkles effect around the icon */}
              <div className="absolute -inset-1">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-full h-full rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 blur-md"
                />
              </div>
              
              {/* Subtle rotating ring */}
              <motion.div 
                className="absolute -inset-3 border border-primary/20 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-purple-400 via-primary to-blue-500 bg-clip-text text-transparent mb-4 sm:mb-6 tracking-tight font-heading leading-tight"
            >
              COSMOS: Your Universe of AI Assistance
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mb-6 sm:mb-8 leading-relaxed font-sans px-2"
            >
              Intelligent automation meets seamless integration. Unlock infinite potential with 
              the AI assistant platform designed for the future.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              {isAuthenticated ? (
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="w-full sm:w-auto"
                  >
                    <Button size="lg" className="relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90 font-medium px-8 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 w-full sm:w-auto">
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ["120%", "-120%"] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          ease: "linear",
                        }}
                      />
                      Go to COSMOS
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </Link>
              ) : (
                <>
                  <Link to="/register" className="w-full sm:w-auto">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="w-full sm:w-auto"
                    >
                      <Button size="lg" className="relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90 font-medium px-8 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 w-full sm:w-auto">
                        <motion.span
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{ x: ["120%", "-120%"] }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 2,
                            ease: "linear",
                          }}
                        />
                        Get Started Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/login" className="w-full sm:w-auto">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      className="w-full sm:w-auto"
                    >
                      <Button size="lg" variant="outline" className="border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-colors duration-300 w-full sm:w-auto">
                        <span>Sign In</span>
                      </Button>
                    </motion.div>
                  </Link>
                </>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
        
        {/* Enhanced Hero Visual - Only page load animation, no scroll animation */}
        <motion.div 
          className="relative max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ 
            duration: 0.8, 
            delay: 0.3,
            type: "spring"
          }}
          whileHover={{ y: -5 }}
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-lg blur opacity-70"></div>
          <div className="relative bg-black/70 backdrop-blur border border-white/10 rounded-lg overflow-hidden shadow-2xl shadow-primary/20">
            <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(90,60,170,0.15),transparent_80%)]"></div>
            
            {/* Glass morphism effect */}
            <div className="absolute inset-0 backdrop-blur-sm bg-white/5 rounded-lg"></div>
            
            <div className="aspect-video rounded-lg overflow-hidden">
              <div className="p-4 sm:p-6 md:p-8 flex flex-col h-full">
                <div className="flex space-x-2 mb-3 sm:mb-4">
                  <motion.div 
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  ></motion.div>
                  <motion.div 
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  ></motion.div>
                  <motion.div 
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  ></motion.div>
                </div>
                
                <div className="flex justify-center items-center flex-1">
                  <div className="w-full md:w-4/5 h-full bg-black/50 rounded-lg p-3 sm:p-4 flex items-center justify-center backdrop-blur-sm border border-white/5">
                    <div className="text-center">
                      <motion.div 
                        className="flex justify-center mb-3 sm:mb-4 relative"
                        animate={{ 
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 relative">
                          {/* Multiple overlapping glows for a more vibrant effect */}
                          <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl"></div>
                          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg"></div>
                          
                          <div className="relative flex items-center justify-center w-full h-full">
                            <motion.div
                              animate={{ 
                                rotate: 360,
                              }}
                              transition={{
                                duration: 20, 
                                repeat: Infinity, 
                                ease: "linear"
                              }}
                              className="absolute inset-0 rounded-full border border-primary/30 border-dashed"
                            ></motion.div>
                            
                            <Bot className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary" />
                            
                            {/* Small floating sparkles */}
                            <motion.div
                              className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2"
                              animate={{
                                y: [0, -10, 0],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            >
                              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary/80" />
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                      <div className="text-foreground text-base sm:text-lg md:text-xl font-semibold font-[Satoshi,sans-serif]">COSMOS AI Platform</div>
                      <div className="text-muted-foreground text-xs sm:text-sm">
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.5 }}
                        >
                          Intelligent.
                        </motion.span>{" "}
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.2, duration: 0.5 }}
                        >
                          Expandable.
                        </motion.span>{" "}
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.6, duration: 0.5 }}
                        >
                          Revolutionary.
                        </motion.span>
                      </div>
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