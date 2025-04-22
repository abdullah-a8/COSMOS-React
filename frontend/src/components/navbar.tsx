"use client"

import React from "react"
import { Link } from "react-router-dom"
import { Button } from "./ui/button"
import { Bot, Menu } from "lucide-react"
import { motion } from "framer-motion"

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between px-8 py-5 rounded-xl backdrop-blur-md border border-white/10 bg-black/30 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
    >
      <Link to="/" className="flex items-center space-x-2">
        <Bot className="w-8 h-8 text-purple-500" />
        <span className="text-white font-semibold text-xl">COSMOS</span>
      </Link>

      <div className="hidden md:flex items-center space-x-10">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/rag-chatbot">RAG Chatbot</NavLink>
        <NavLink to="/youtube-processor">YouTube Processor</NavLink>
        <NavLink to="/gmail-responder">Gmail Responder</NavLink>
      </div>

      <Button variant="ghost" size="icon" className="md:hidden text-white">
        <Menu className="w-6 h-6" />
      </Button>
    </motion.nav>
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
