import { motion } from "framer-motion"
import { FloatingPaper } from "./floating-paper"
import { useDevice } from "../hooks/useDevice"
import { Button } from "./ui/button"
import { ArrowRight } from "lucide-react"

export default function Hero() {
  const { isMobile, isTablet } = useDevice();

  return (
    <div className="relative min-h-[60vh] flex items-center justify-center pt-24">
      {/* Floating papers background */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <FloatingPaper count={isMobile ? 3 : isTablet ? 4 : 6} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
          >
            <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} md:text-6xl lg:text-7xl font-bold text-white mb-6`}>
              Welcome to
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                {" "}
                COSMOS
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`text-gray-400 ${isMobile ? 'text-base' : 'text-xl'} mb-8 max-w-2xl mx-auto`}
          >
            Your integrated platform for interacting with AI models for various tasks. Explore the features below to get
            started.
          </motion.p>

          {/* Call to action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6"
          >
            <Button className="bg-purple-600 hover:bg-purple-700 text-white min-w-[180px] h-11">
              Get Started
            </Button>
            <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 min-w-[180px] h-11">
              <span>Learn More</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
      
      {/* Decorative gradient elements */}
      <div className="absolute top-1/3 -left-24 w-72 h-72 bg-purple-600/20 rounded-full filter blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-1/4 -right-24 w-72 h-72 bg-blue-600/20 rounded-full filter blur-3xl opacity-50 pointer-events-none" />
    </div>
  )
}