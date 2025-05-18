import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout: React.FC = () => {
  return (
    // Use bg-background for shadcn theme compatibility (usually dark)
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Fixed, blurred navbar - styled to match the landing page */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-4 left-4 right-4 rounded-xl border border-white/10 bg-black/30 shadow-[0_0_15px_rgba(147,51,234,0.3)] z-50 flex items-center justify-between px-5 py-3 backdrop-blur-md"
      >
        {/* Subtle background effect */}
        <div className="absolute inset-0 overflow-hidden rounded-xl opacity-20">
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-purple-500/30 rounded-full filter blur-xl animate-pulse"></div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-500/30 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Logo - exactly matching the landing page */}
        <Link to="/dashboard" className="flex items-center space-x-2 z-20 group p-2 sm:p-3 relative">
          <motion.div
            className="relative"
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <motion.div
              className="absolute inset-0 bg-primary/30 rounded-full blur-lg"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.img 
              src="/cosmos_app.png" 
              alt="COSMOS" 
              className="h-8 w-8 md:h-10 md:w-10 relative"
            />
            <motion.div
              className="absolute -top-1 -right-1 text-primary"
              animate={{
                rotate: [0, 10, 0, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 5, 
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.2, 0.5, 0.8, 1]
              }}
            >
              <Sparkles size={12} />
            </motion.div>
          </motion.div>
          
          <div className="flex flex-col items-start">
            <span className="text-foreground font-semibold text-base sm:text-lg md:text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600">
              COSMOS
            </span>
          </div>
        </Link>
        
        {/* Keep any nav links on the right */}
        <div className="relative z-20">
          {/* Additional nav items can go here */}
        </div>
      </motion.nav>

      {/* Add padding top to main content to offset fixed navbar */}
      <main className="flex-grow container mx-auto p-4 pt-24"> 
        <Outlet /> {/* This is where the routed page components will be rendered */}
      </main>

      {/* Adjusted footer for dark theme */}
      <footer className="bg-muted text-muted-foreground text-center p-4 mt-auto">
        COSMOS App Footer
      </footer>
    </div>
  );
};

export default Layout; 