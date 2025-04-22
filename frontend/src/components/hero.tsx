import { motion } from "framer-motion"
import { FloatingPaper } from "./floating-paper"

export default function Hero() {
  return (
    <div className="relative min-h-[60vh] flex items-center justify-center pt-24">
      {/* Floating papers background */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <FloatingPaper count={6} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
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
            className="text-gray-400 text-xl mb-8 max-w-2xl mx-auto"
          >
            Your integrated platform for interacting with AI models for various tasks. Explore the features below to get
            started.
          </motion.p>
        </div>
      </div>
    </div>
  )
}
