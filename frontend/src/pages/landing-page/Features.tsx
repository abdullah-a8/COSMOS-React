import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useInView, useSpring } from 'framer-motion';
import { MessageSquare, Youtube, Mail, Sparkles, Zap, Brain } from 'lucide-react';
import { featureCardVariants } from './AnimationVariants';

// Custom 3D tilt effect for feature cards
const TiltCard: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Use springs for smoother motion
  const springX = useSpring(x, { stiffness: 50, damping: 20 });
  const springY = useSpring(y, { stiffness: 50, damping: 20 });
  
  const rotateX = useTransform(springY, [-100, 100], [5, -5]);
  const rotateY = useTransform(springX, [-100, 100], [-5, 5]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate the center of the card
    const centerX = rect.left + width / 2;
    const centerY = rect.top + height / 2;
    
    // Calculate the mouse position relative to the center of the card
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Update motion values with smoother transitions
    x.set(mouseX / 3); // Reduced sensitivity for smoother movement
    y.set(mouseY / 3);
  };
  
  const handleMouseLeave = () => {
    // Reset to original position
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      className="rounded-xl border border-white/10 bg-black/40 p-5 sm:p-6 shadow-xl shadow-primary/5 relative overflow-hidden h-full"
      variants={featureCardVariants}
      initial="offscreen"
      whileInView="onscreen"
      exit="exit"
      viewport={{ once: false, amount: 0.3 }}
      transition={{ 
        type: "spring", 
        stiffness: 100, 
        damping: 20, 
        delay 
      }}
      style={{ 
        rotateX, 
        rotateY, 
        perspective: 1000,
      }}
      whileHover={{
        y: -10,
        scale: 1.02,
        transition: { type: "spring", stiffness: 100, damping: 20 }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
};

const Features: React.FC = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(featuresRef, { once: false, amount: 0.2 });
  
  const features = [
    {
      title: "RAG Chatbot",
      description: "Powerful chatbot with Retrieval Augmented Generation that provides accurate answers based on your data.",
      icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      color: "from-blue-500 to-primary",
      secondaryIcon: <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300" />,
      delay: 0
    },
    {
      title: "YouTube Processor",
      description: "Automatically process YouTube videos for intelligent summaries, insights, and key points extraction.",
      icon: <Youtube className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      color: "from-red-500 to-orange-400",
      secondaryIcon: <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-orange-300" />,
      delay: 0.15
    },
    {
      title: "Gmail Responder",
      description: "Intelligently respond to emails with context-aware AI that understands communication nuances.",
      icon: <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      color: "from-green-500 to-emerald-400",
      secondaryIcon: <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-300" />,
      delay: 0.3
    }
  ];
  
  return (
    <section id="features" ref={featuresRef} className="py-16 sm:py-20 md:py-32 px-4 md:px-0 relative">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(93,63,211,0.18),transparent_70%)]"></div>
      
      {/* Animated gradient orb */}
      <motion.div 
        className="absolute bottom-1/3 left-1/4 w-[15rem] sm:w-[30rem] h-[15rem] sm:h-[30rem] rounded-full bg-primary/5 blur-[128px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      ></motion.div>
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-5 sm:mb-6"
          >
            <motion.div 
              className="relative inline-flex items-center justify-center p-1 overflow-hidden rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 backdrop-blur-sm"
              animate={{ 
                scale: [1, 1.03, 1],
                rotate: [0, 2, 0, -2, 0]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary/80 to-blue-600/80 rounded-full shadow-lg">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <motion.div 
                  className="absolute inset-0 border border-white/20 rounded-full" 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold bg-gradient-to-r from-purple-400 via-primary to-blue-500 bg-clip-text text-transparent mb-4 sm:mb-6 font-heading px-2"
          >
            Unlock the Power of COSMOS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-sans leading-relaxed px-2"
          >
            A comprehensive suite of AI-powered tools designed to enhance your productivity and streamline your workflow.
          </motion.p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {features.map((feature, index) => (
            <TiltCard key={index} delay={feature.delay}>
              {/* Animated glow background */}
              <div className={`absolute -top-8 -right-8 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br ${feature.color} opacity-20 rounded-full blur-xl`}>
                <motion.div 
                  className="w-full h-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut", 
                    delay: index * 0.5
                  }}
                />
              </div>
              
              {/* Icon wrapper */}
              <div className="relative mb-3 sm:mb-4">
                <div className={`p-2 sm:p-3 bg-gradient-to-r ${feature.color} rounded-lg sm:rounded-xl w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg`}>
                  {feature.icon}
                  
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{
                      y: [0, -5, 0],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 3, 
                      repeat: Infinity, 
                      ease: "easeInOut",
                      delay: index * 0.3
                    }}
                  >
                    {feature.secondaryIcon}
                  </motion.div>
                </div>
              </div>
              
              <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 font-heading">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                {feature.description}
              </p>
              
              {/* Interactive element */}
              <motion.div 
                className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3"
                whileHover={{ 
                  scale: 1.2, 
                  rotate: 5,
                  transition: { type: "spring", stiffness: 400, damping: 17 }
                }}
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary/40" />
              </motion.div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features; 