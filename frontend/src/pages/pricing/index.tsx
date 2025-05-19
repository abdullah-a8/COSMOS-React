import React from 'react';
import { SparklesCore } from '../../components/sparkles';
import { useDevice } from '../../hooks/useDevice';
import Header from '../landing-page/Header';
import Footer from '../landing-page/Footer';
import { Button } from '../../components/ui/button';
import { Shield, CheckCircle, XCircle, Sparkles, Info, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';

// Feature item component for the pricing cards
const FeatureItem = ({ included, text, tooltip }: { included: boolean; text: string; tooltip?: string }) => (
  <div className="flex items-start space-x-3 py-2">
    {included ? 
      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" /> : 
      <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
    }
    <div className="flex items-center">
      <span className={`text-sm ${included ? 'text-foreground' : 'text-muted-foreground'}`}>{text}</span>
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 ml-1.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  </div>
);

// Feature section component for better organization
const FeatureSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="pb-4 mb-4 border-b border-border/40">
    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-2">{title}</h4>
    <div className="space-y-1">{children}</div>
  </div>
);

// Enhanced button component with animations
const AnimatedButton = ({ children, isPrimary = false, onClick }: { children: React.ReactNode; isPrimary?: boolean; onClick?: () => void }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <Button 
        className={`w-full group relative h-12 px-6 overflow-hidden font-medium tracking-wide rounded-lg shadow-md transition-all duration-300 ${
          isPrimary 
            ? "bg-gradient-to-r from-primary to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white" 
            : "bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white"
        }`}
        onClick={onClick}
      >
        <div className="relative z-10 flex items-center justify-center gap-2">
          {children}
          <motion.div
            initial={{ x: -5, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center"
          >
            <ArrowRight className="h-4 w-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
          </motion.div>
        </div>
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ["120%", "-120%"] }}
          transition={{ 
            repeat: Infinity, 
            duration: 2,
            ease: "linear",
          }}
        />
      </Button>
    </motion.div>
  );
};

const PricingPage: React.FC = () => {
  const { isMobile } = useDevice();

  const handleUpgradeClick = () => {
    // For now, just log a message - no actual payment processing
    console.log('Upgrade to Pro button clicked - payment integration removed');
    alert('Payment integration is currently being updated. Please check back later.');
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased relative overflow-x-hidden">
      {/* Ambient background with moving particles */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(55,48,163,0.15),rgba(0,0,0,0.5))]">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={isMobile ? 60 : 100}
          className="w-full h-full"
          particleColor="#FFFFFF"
          followMouse={false}
        />
      </div>

      <Header />
      
      <main className="relative z-10 pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Pricing header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600 mb-4">
              Choose the Perfect Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started with our powerful AI tools and upgrade anytime as your needs grow
            </p>
          </div>
          
          {/* Frosted glass container */}
          <div className="relative max-w-5xl mx-auto p-4 md:p-6 bg-black/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            {/* Pricing cards container */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-8">
              
              {/* Free Plan */}
              <motion.div 
                className="relative h-full rounded-xl overflow-hidden border border-border/40 bg-black/40 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-shadow duration-300 flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-500/40 rounded-full filter blur-xl"></div>
                </div>
                
                <div className="p-6 md:p-8 relative z-10 flex-1 flex flex-col">
                  <div className="flex items-center mb-6 gap-2">
                    <div className="rounded-full bg-muted p-1.5">
                      <Shield className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold text-xl">Free</h3>
                    <span className="ml-auto text-sm px-2.5 py-0.5 rounded-full bg-primary/20 text-white font-medium">
                      7-day Pro Trial
                    </span>
                  </div>
                  
                  <div className="mb-2 text-sm text-muted-foreground">
                    Perfect for exploring COSMOS
                  </div>
                  
                  <div className="mt-4 mb-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold">$0</span>
                      <span className="text-muted-foreground ml-2">/ month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      50 premium-model requests for 7 days (CC required)
                    </p>
                  </div>
                  
                  <div className="space-y-1 mb-6 flex-1">
                    <FeatureSection title="Core Features">
                      <FeatureItem included={true} text="100 free-model requests per month" />
                      <FeatureItem included={true} text="URL, Image, PDF inputs" />
                    </FeatureSection>
                    
                    <FeatureSection title="RAG Chatbot">
                      <FeatureItem included={true} text="Access to Mini LLMs" tooltip="Access to our free tier AI models" />
                      <FeatureItem included={true} text="Ingest PDFs, URLs, images" />
                    </FeatureSection>
                    
                    <FeatureSection title="Premium Features">
                      <FeatureItem included={false} text="YouTube Processor" tooltip="Extract transcripts from YouTube videos automatically" />
                      <FeatureItem included={false} text="Gmail Assistant" tooltip="AI-powered email management and response generation" />
                    </FeatureSection>
                  </div>
                  
                  <div className="mt-auto">
                    <AnimatedButton>Get Started Free</AnimatedButton>
                  </div>
                </div>
              </motion.div>
              
              {/* COSMOS Pro */}
              <motion.div 
                className="relative h-full rounded-xl overflow-hidden border border-primary/40 bg-black/40 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(139,92,246,0.25)] transition-shadow duration-300 flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-600/10 opacity-40"></div>
                  <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary/40 rounded-full filter blur-xl"></div>
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-blue-500/40 rounded-full filter blur-xl"></div>
                </div>
                
                <div className="p-6 md:p-8 relative z-10 flex-1 flex flex-col">
                  <div className="flex items-center mb-6 gap-2">
                    <div className="rounded-full bg-primary/20 p-1.5">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-xl">COSMOS Pro</h3>
                  </div>
                  
                  <div className="mb-2 text-sm text-muted-foreground">
                    For professionals
                  </div>
                  
                  <div className="mt-4 mb-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold">$25</span>
                      <span className="text-muted-foreground ml-2">/ month</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-6 flex-1">
                    <FeatureSection title="Premium AI">
                      <FeatureItem included={true} text="250 premium-model requests per month" tooltip="Access to the latest pro AI models" />
                      <FeatureItem included={true} text="Unlimited requests to free/mini models" />
                    </FeatureSection>
                    
                    <FeatureSection title="RAG Chatbot">
                      <FeatureItem included={true} text="All free and pro models" />
                      <FeatureItem included={true} text="Unified KB (PDF, URL, YouTube transcripts)" tooltip="All your knowledge sources in one place for seamless context retrieval" />
                      <FeatureItem included={true} text="Contextual RAG with source tracking" tooltip="Easily identify the source of information in generated responses" />
                      <FeatureItem included={true} text="Fine‑tune temperature, chunk size/overlap" tooltip="Customize parameters for optimal contextual understanding" />
                    </FeatureSection>
                    
                    <FeatureSection title="Advanced Features">
                      <FeatureItem included={true} text="YouTube Processor" tooltip="Auto‑extract & chunk transcripts with live processing status & thumbnail preview" />
                      <FeatureItem included={true} text="Gmail Responder" tooltip="OAuth‑secure fetch & classify emails with customizable tone/style/length controls" />
                      <FeatureItem included={true} text="Priority email support" tooltip="Get help when you need it with our dedicated support team" />
                    </FeatureSection>
                  </div>
                  
                  <div className="mt-auto">
                    <AnimatedButton isPrimary onClick={handleUpgradeClick}>
                      Upgrade to Pro
                    </AnimatedButton>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="bg-black/30 border border-border/40 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-2">Can I switch plans at any time?</h3>
                <p className="text-muted-foreground text-sm">Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll have immediate access to new features. When downgrading, changes will take effect at the end of your current billing cycle.</p>
              </div>
              <div className="bg-black/30 border border-border/40 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-2">How does the 7-day Pro trial work?</h3>
                <p className="text-muted-foreground text-sm">Our 7-day Pro trial gives you full access to all premium features for free. You can cancel anytime during the trial period, and you won't be charged if you decide not to continue.</p>
              </div>
              <div className="bg-black/30 border border-border/40 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-2">Are there any hidden fees?</h3>
                <p className="text-muted-foreground text-sm">No hidden fees! The price you see is what you pay. We're fully transparent about our pricing, and there are no additional costs unless you exceed usage limits.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PricingPage; 