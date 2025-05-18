import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { ArrowRight } from 'lucide-react';

const CTA: React.FC = () => {
  const ctaRef = useRef<HTMLDivElement>(null);
  
  return (
    <section ref={ctaRef} className="py-20 md:py-32 px-4 md:px-0 relative">
      <div className="container mx-auto">
        <motion.div 
          className="max-w-4xl mx-auto rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md p-8 md:p-12 relative overflow-hidden shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          whileHover={{ y: -5 }}
        >
          {/* Background effects */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full filter blur-3xl opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/20 rounded-full filter blur-3xl opacity-60"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(90,60,170,0.15),transparent_70%)]"></div>
          </div>
          
          <div className="relative z-10 text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold bg-gradient-to-r from-purple-400 via-primary to-blue-500 bg-clip-text text-transparent mb-6 font-heading">
              Ready to explore the COSMOS?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto font-sans leading-relaxed">
              Join thousands of users who have already transformed their workflow with our AI assistant platform.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground hover:opacity-90 font-medium px-8 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-colors duration-300 w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA; 