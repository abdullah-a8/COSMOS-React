import React from 'react';
import { Bot } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 px-4 md:px-0 border-t border-white/10 bg-black/50 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Bot className="w-5 h-5 text-primary" />
            <span className="text-foreground font-semibold font-heading">COSMOS</span>
          </div>
          <div className="text-sm text-muted-foreground font-sans">
            &copy; 2025 COSMOS AI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 