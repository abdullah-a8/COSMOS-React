import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '../../components/ui/button';

const Header: React.FC = () => {
  // Navbar scroll effect
  const { scrollY } = useScroll();
  const navBackground = useTransform(
    scrollY,
    [0, 100],
    ["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.85)"]
  );
  
  const navBlur = useTransform(
    scrollY,
    [0, 100],
    ["blur(0px)", "blur(10px)"]
  );
  
  const navBorder = useTransform(
    scrollY,
    [0, 100],
    ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.15)"]
  );

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
    >
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
        className="container mx-auto flex items-center justify-between rounded-xl border border-white/10"
        style={{ 
          backgroundColor: navBackground,
          backdropFilter: navBlur,
          borderColor: navBorder 
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 z-20 group p-3">
          <motion.img 
            src="/cosmos_app.png" 
            alt="COSMOS" 
            className="h-8 w-8 md:h-10 md:w-10" 
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          />
          <motion.span 
            className="text-foreground font-semibold text-lg md:text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            COSMOS
          </motion.span>
        </Link>
        
        {/* Navigation Links */}
        <div className="flex items-center gap-2 md:gap-4 p-3">
          <Link to="/login">
            <Button variant="ghost" className="text-foreground hover:bg-white/10 hover:scale-105 transition-all duration-300">
              Login
            </Button>
          </Link>
          <Link to="/register">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all duration-300">
              Register
            </Button>
          </Link>
        </div>
      </motion.nav>
    </motion.header>
  );
};

export default Header; 