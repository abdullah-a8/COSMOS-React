"use client"

import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import { Bot, Menu, X, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useDevice } from "../hooks/useDevice"
import { useAuth } from "../hooks/useAuth"

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile } = useDevice();
  const { isAdmin } = useAuth({ refreshInterval: 0 });
  
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen, isMobile]);

  return (
    <>
      {/* Desktop Navbar with glassmorphism effect */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed ${isMobile ? 'top-2 left-2 right-2 rounded-xl border border-white/10 bg-black/30 shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'top-4 left-4 right-4 rounded-xl border border-white/10 bg-black/30 shadow-[0_0_15px_rgba(147,51,234,0.3)]'} z-50 flex items-center justify-between px-5 sm:px-8 py-4 backdrop-blur-md`}
      >
        <Link to="/" className="flex items-center space-x-2 relative z-20">
          <Bot className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} text-purple-500`} />
          <span className="text-white font-semibold text-xl">COSMOS</span>
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <div className="flex items-center space-x-10">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/rag-chatbot">RAG Chatbot</NavLink>
            <NavLink to="/youtube-processor">YouTube Processor</NavLink>
            <NavLink to="/gmail-responder">Gmail Responder</NavLink>
            {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          </div>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white relative z-20"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        )}
      </motion.nav>

      {/* Mobile Menu Overlay - Only for mobile */}
      <AnimatePresence>
        {mobileMenuOpen && isMobile && (
          <motion.div 
            className="fixed inset-0 z-40 flex flex-col bg-gradient-to-b from-black/95 to-black/90 backdrop-blur-md"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="h-16"></div> {/* Space for navbar */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              <div className="pt-2 pb-4">

              </div>
              
              <div className="space-y-4">
                <MobileNavLink 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  icon={<div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>}
                >
                  Home
                </MobileNavLink>
                
                <MobileNavLink 
                  to="/rag-chatbot" 
                  onClick={() => setMobileMenuOpen(false)}
                  icon={<div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>}
                >
                  RAG Chatbot
                </MobileNavLink>
                
                <MobileNavLink 
                  to="/youtube-processor" 
                  onClick={() => setMobileMenuOpen(false)}
                  icon={<div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-red-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                  </div>}
                >
                  YouTube Processor
                </MobileNavLink>
                
                <MobileNavLink 
                  to="/gmail-responder" 
                  onClick={() => setMobileMenuOpen(false)}
                  icon={<div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-green-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>}
                >
                  Gmail Responder
                </MobileNavLink>
                
                {isAdmin && (
                  <MobileNavLink 
                    to="/admin" 
                    onClick={() => setMobileMenuOpen(false)}
                    icon={<div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-yellow-600 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white"><path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 1.32 4.24 2.5 2.5 0 0 0 1.98 3A2.5 2.5 0 0 0 12 13.5a2.5 2.5 0 0 0 4.96.46 2.5 2.5 0 0 0 1.98-3 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5Z"/><path d="M12 15v5"/><path d="M4 12H2"/><path d="M22 12h-2"/></svg>
                    </div>}
                  >
                    Admin
                  </MobileNavLink>
                )}
              </div>
              
              <div className="mt-auto pt-8 pb-8">
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <h3 className="text-white font-medium mb-1">Need help?</h3>
                  <p className="text-gray-400 text-sm mb-3">Check out our documentation or contact support</p>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Documentation
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-gray-200 hover:text-white font-medium tracking-wide transition-colors relative group"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full" />
    </Link>
  )
}

function MobileNavLink({ 
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
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-200 hover:text-white"
    >
      <div className="flex items-center gap-4">
        {icon}
        <span className="text-lg font-medium">{children}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </Link>
  )
}
