import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Menu, X, Star, Sparkles, Globe, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.tsx';

interface NavItemProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
  isScrollLink?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, children, onClick, isScrollLink = false }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (isScrollLink && to.startsWith('#')) {
      e.preventDefault();
      const element = document.getElementById(to.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        if (onClick) onClick();
      }
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div className="relative group">
      <Link 
        to={to}
        className="text-foreground hover:text-white transition-colors duration-300 px-3 py-2 inline-block"
        onClick={handleClick}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          {children}
        </motion.div>
      </Link>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] w-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 bg-gradient-to-r from-primary via-indigo-400 to-purple-400 rounded-full origin-center"></div>
    </div>
  );
};

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth({ refreshInterval: 0 });

  // Simple scroll detection - no complex transforms that could cause issues
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);
  
  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-[100] px-2 sm:px-4 py-2 sm:py-3"
      initial={{ y: 0 }}
      animate={{ 
        y: 0,
        top: scrolled ? '0.5rem' : '0'
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
    >
      {/* Navbar with purple-accented glassmorphism */}
      <motion.div 
        className={`relative container mx-auto flex items-center justify-between rounded-xl overflow-hidden ${
          scrolled ? 'border border-purple-500/20' : 'border-none'
        } shadow-[0_8px_32px_rgba(147,51,234,0.15)] backdrop-blur-xl`}
        initial={{ 
          background: "rgba(9, 6, 27, 0.1)", 
          y: 0 
        }}
        animate={{ 
          background: scrolled ? "rgba(9, 6, 27, 0.7)" : "rgba(9, 6, 27, 0.1)",
          y: 0,
          backdropFilter: scrolled ? "blur(16px)" : "blur(0px)"
        }}
        transition={{ duration: 0.4 }}
        style={{
          WebkitBackdropFilter: scrolled ? "blur(16px)" : "blur(0px)", // For Safari
        }}
      >
        {/* Purple glow overlay effect */}
        <div className="absolute inset-0 overflow-hidden rounded-xl opacity-20 pointer-events-none">
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-purple-500/40 rounded-full filter blur-xl"></div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-500/40 rounded-full filter blur-xl"></div>
          {scrolled && (
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5"></div>
          )}
        </div>
        
        {/* Content */}
        <Link to="/" className="flex items-center space-x-2 z-20 group relative">
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
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 py-3 pr-3 relative z-10">
          <NavItem to="#features-section" isScrollLink={true}>Features</NavItem>
          <NavItem to="#how-it-works-section" isScrollLink={true}>How It Works</NavItem>
          <NavItem to="/pricing">Pricing</NavItem>
          
          <div className="flex items-center gap-3 ml-2 lg:ml-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button variant="ghost" className="text-foreground hover:bg-indigo-500/10 transition-all duration-300">
                      Dashboard
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/profile">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="default" className="relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90 transition-all duration-300">
                      <span className="relative z-10 flex items-center gap-2">
                        Profile
                        <User className="h-4 w-4" />
                      </span>
                    </Button>
                  </motion.div>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button variant="ghost" className="text-foreground hover:bg-indigo-500/10 transition-all duration-300">
                      Login
                    </Button>
                  </motion.div>
                </Link>
                <Link to="/register">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="default" className="relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90 transition-all duration-300">
                      <motion.span
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ["120%", "-120%"] }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          ease: "linear",
                        }}
                      />
                      <span className="relative z-10">Register</span>
                    </Button>
                  </motion.div>
                </Link>
              </>
            )}
          </div>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden p-2 sm:p-3 relative z-10">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 sm:p-2 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>
      </motion.div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed top-16 left-3 right-3 sm:left-4 sm:right-4 rounded-xl overflow-hidden z-50 bg-black/70 backdrop-blur-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(147,51,234,0.15)]"
          >
            <div className="flex flex-col p-4 space-y-3 relative z-10">
              <Link to="#features-section" className="px-4 py-2 hover:bg-purple-500/10 rounded-lg transition-colors" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}>
                Features
              </Link>
              <Link to="#how-it-works-section" className="px-4 py-2 hover:bg-purple-500/10 rounded-lg transition-colors" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}>
                How It Works
              </Link>
              <Link to="/pricing" className="px-4 py-2 hover:bg-purple-500/10 rounded-lg transition-colors" onClick={() => setIsMenuOpen(false)}>
                Pricing
              </Link>
              <div className="pt-2 flex flex-col gap-2 border-t border-purple-500/20">
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-purple-500/10">
                        Dashboard
                      </Button>
                    </Link>
                    <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90">
                        Profile
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-foreground hover:bg-purple-500/10">
                        Login
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                      <Button className="w-full bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90">
                        Register
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subtle floating elements for visual flair */}
      <motion.div
        className="fixed top-24 right-12 text-primary/20 hidden md:block"
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Globe size={16} />
      </motion.div>
      
      <motion.div
        className="fixed top-36 left-12 text-blue-500/20 hidden md:block"
        animate={{
          y: [0, 8, 0],
          rotate: [0, -5, 0, 5, 0],
        }}
        transition={{
          duration: 10,
          delay: 1,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Star size={14} />
      </motion.div>
    </motion.header>
  );
};

export default Header; 