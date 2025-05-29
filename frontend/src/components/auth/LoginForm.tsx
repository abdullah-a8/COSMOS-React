import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCsrf } from '../../hooks/useCsrf';

interface LoginFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Animation variants for staggered animations
const formVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const inputVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const buttonVariants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
      delay: 0.3
    }
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 20px rgba(139, 92, 246, 0.3)",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  tap: {
    scale: 0.98
  }
};

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { csrfToken } = useCsrf();

  // Validate email function
  const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!email || !password) {
      onError('Email and password are required');
      return;
    }

    // Email validation
    if (!validateEmail(email)) {
      onError('Please enter a valid email address (e.g., name@example.com)');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Add CSRF token to the request if available
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      const response = await fetch('/api/v1/users/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          password,
          csrf_token: csrfToken, // Also include in the body for flexibility
        }),
        credentials: 'include',  // Important for cookies
        cache: 'no-store', // Prevent caching the request
      });
      
      if (!response.ok) {
        const data = await response.json();
        
        // Handle our new structured error format
        if (data.detail && typeof data.detail === 'object') {
          // First check if there are field-specific errors we want to show
          if (data.detail.fields) {
            const fieldErrors = data.detail.fields;
            
            // Prioritize password errors, then email errors
            if (fieldErrors.password) {
              onError(fieldErrors.password);
            } else if (fieldErrors.email) {
              onError(fieldErrors.email);
            } else {
              // Just take the first field error if there are multiple
              const firstField = Object.keys(fieldErrors)[0];
              onError(fieldErrors[firstField] || data.detail.message || 'Invalid login information');
            }
          } else if (data.detail.message) {
            // Use the general message if no field-specific errors
            onError(data.detail.message);
          } else {
            // Fallback for unexpected format
            onError('Invalid email or password');
          }
        } else {
          // Handle string error messages (legacy format)
          onError(data.detail || 'Invalid email or password');
        }
        return;
      }
      
      // Success - clear form and notify
      setEmail('');
      setPassword('');
      
      try {
        // Get the response data
        const data = await response.json();
        
        // Store minimal auth info in localStorage for UI purposes only
        // This doesn't affect actual authentication which is handled by cookies
        localStorage.setItem('auth_last_login', new Date().toISOString());
        
        if (data.is_admin !== undefined) {
          localStorage.setItem('is_admin', data.is_admin.toString());
        }
      } catch (e) {
        console.warn('Could not parse login response JSON:', e);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Login error:', error);
      onError('An unexpected error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit} 
      className="space-y-5"
      initial="hidden"
      animate="visible"
      variants={formVariants}
    >
      <motion.div 
        className="group"
        variants={inputVariants}
      >
        <label htmlFor="email" className="flex items-center mb-2 text-sm font-medium text-white/80">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
          Email Address
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
            title="Please enter a valid email address (e.g., name@example.com)"
            className="w-full px-4 py-3 bg-black/50 border border-white/20 focus:border-purple-500/60 hover:border-purple-500/40 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all duration-200 rounded-lg"
            placeholder="name@example.com"
          />
          <div className="absolute inset-0 pointer-events-none rounded-lg transition-opacity duration-300 opacity-0 group-focus-within:opacity-100" style={{ background: 'linear-gradient(90deg, rgba(139, 92, 246, 0) 0%, rgba(139, 92, 246, 0.1) 100%)' }}></div>
        </div>
      </motion.div>
      
      <motion.div 
        className="group"
        variants={inputVariants}
      >
        <label htmlFor="password" className="flex items-center mb-2 text-sm font-medium text-white/80">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            className="w-full px-4 py-3 bg-black/50 border border-white/20 focus:border-purple-500/60 hover:border-purple-500/40 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all duration-200 rounded-lg"
            placeholder="••••••••"
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-purple-400 transition-colors duration-200"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <div className="absolute inset-0 pointer-events-none rounded-lg transition-opacity duration-300 opacity-0 group-focus-within:opacity-100" style={{ background: 'linear-gradient(90deg, rgba(139, 92, 246, 0) 0%, rgba(139, 92, 246, 0.1) 100%)' }}></div>
        </div>
      </motion.div>
      
      <motion.div 
        className="pt-4"
        variants={inputVariants}
      >
        <motion.button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all duration-200 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 group overflow-hidden relative"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
        >
          <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out translate-y-full group-hover:translate-y-0 bg-gradient-to-r from-purple-800 to-purple-900"></span>
          <span className="relative flex items-center justify-center">
            {isLoading ? (
              <>
                <div className="h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <span className="flex items-center">
                <span>Sign In</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 transform transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </span>
        </motion.button>
      </motion.div>
    </motion.form>
  );
};

export default LoginForm; 