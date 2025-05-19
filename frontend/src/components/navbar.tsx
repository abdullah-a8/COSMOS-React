"use client"

import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import {
  Menu, 
  X, 
  ChevronRight, 
  Home, 
  User, 
  MessageSquare, 
  Youtube, 
  Mail,
  Settings,
  Sparkles
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useDevice } from "../hooks/useDevice"
import { useAuth } from "../hooks/useAuth.tsx"

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isMobile } = useDevice();
  const { isAdmin, isAuthenticated } = useAuth({ refreshInterval: 0 });
  
  // Open GitHub repository in a new tab
  const openGitHubRepo = () => {
    window.open("https://github.com/abdullah-a8/COSMOS-React", "_blank");
  };
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (menuOpen && !target.closest('#menu-container') && !target.closest('#menu-button')) {
        setMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <>
      {/* Streamlined Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed ${isMobile ? 'top-2 left-2 right-2 rounded-xl' : 'top-4 left-4 right-4 rounded-xl'} border border-white/10 bg-black/30 shadow-[0_0_15px_rgba(147,51,234,0.3)] z-50 flex items-center justify-between px-5 py-3 backdrop-blur-md`}
      >
        {/* Subtle background effect */}
        <div className="absolute inset-0 overflow-hidden rounded-xl opacity-20">
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-purple-500/30 rounded-full filter blur-xl animate-pulse"></div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-500/30 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Logo */}
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

        {/* Right side navigation */}
        <div className="flex items-center gap-4 relative z-20">
          {isAuthenticated ? (
            <>
              {/* Home Icon */}
              <IconNavLink to="/dashboard">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                  <Home className="w-4 h-4 text-white" />
                </div>
              </IconNavLink>
              
              {/* Profile Icon */}
              <IconNavLink to="/profile">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <User className="w-4 h-4 text-white" />
                </div>
              </IconNavLink>
              
              {/* Hamburger Menu Button - Improved size and spacing */}
              <Button 
                id="menu-button"
                variant="ghost" 
                size="icon" 
                className="text-white relative z-20 ml-1 p-2 h-10 w-10 rounded-full hover:bg-white/10"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
              >
                <AnimatePresence mode="wait">
                  {menuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </>
          ) : (
            <>
              {/* Login/Register buttons for non-authenticated users */}
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.nav>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed right-4 top-[85px] z-40" id="menu-container">
            <motion.div 
              className={`${isMobile ? 'w-[calc(100vw-32px)]' : 'w-80'} bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-xl overflow-hidden`}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4 space-y-3">
                <MenuLink 
                  to="/rag-chatbot" 
                  onClick={() => setMenuOpen(false)}
                  icon={<div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>}
                >
                  RAG Chatbot
                </MenuLink>
                
                <MenuLink 
                  to="/youtube-processor" 
                  onClick={() => setMenuOpen(false)}
                  icon={<div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-red-600 flex items-center justify-center">
                    <Youtube className="w-4 h-4 text-white" />
                  </div>}
                >
                  YouTube Processor
                </MenuLink>
                
                <MenuLink 
                  to="/gmail-responder" 
                  onClick={() => setMenuOpen(false)}
                  icon={<div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-green-600 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>}
                >
                  Gmail Responder
                </MenuLink>
                
                {isAdmin && (
                  <MenuLink 
                    to="/admin" 
                    onClick={() => setMenuOpen(false)}
                    icon={<div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-yellow-600 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-white" />
                    </div>}
                  >
                    Admin
                  </MenuLink>
                )}
              </div>
              
              <div className="p-4 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border-t border-purple-500/10">
                <h3 className="text-white/80 text-sm font-medium mb-2">Need help?</h3>
                <Button 
                  onClick={openGitHubRepo}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm py-1 h-9"
                >
                  Documentation
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

// New icon-based nav link for main navigation
function IconNavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = window.location;
  const isActive = pathname === to || pathname.startsWith(`${to}/`);
  
  return (
    <Link
      to={to}
      className="flex items-center justify-center hover:opacity-90 transition-all relative"
    >
      <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
        {children}
        {isActive && (
          <span className="absolute inset-0 rounded-full ring-2 ring-purple-400 ring-offset-1 ring-offset-black/80 animate-pulse"></span>
        )}
      </div>
    </Link>
  )
}

function MenuLink({ 
  to, 
  children, 
  onClick,
  icon
}: { 
  to: string; 
  children: React.ReactNode; 
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  const { pathname } = window.location;
  const isActive = pathname === to || pathname.startsWith(`${to}/`);
  
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-lg ${isActive ? 'bg-white/10 border border-purple-500/40' : 'bg-white/5 hover:bg-white/10 border border-transparent'} transition-all text-gray-200 hover:text-white shadow-sm`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-base font-medium">{children}</span>
      </div>
      <ChevronRight className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
    </Link>
  )
}
