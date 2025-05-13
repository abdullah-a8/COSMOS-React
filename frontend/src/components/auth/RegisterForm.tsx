import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCsrf } from '../../hooks/useCsrf';

interface RegisterFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

// Animation variants for staggered animations
const formVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.07,
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
      delay: 0.4
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

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-4 strength level
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { csrfToken } = useCsrf();

  // Calculate password strength whenever password changes
  useEffect(() => {
    calculatePasswordStrength(password);
  }, [password]);

  // Calculate password strength on a scale of 0-4
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    
    // Length check (basic requirement)
    if (pass.length >= 10) strength++;
    
    // Character variety checks
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass) && /[0-9]/.test(pass)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>~\-_=+[\]]/.test(pass)) strength++;
    
    // Penalize for common patterns
    if (/12345|qwerty|password|admin|letmein/i.test(pass)) strength = Math.max(1, strength - 1);
    
    // Penalize for repetitive characters
    if (/(.)\1{2,}/.test(pass)) strength = Math.max(1, strength - 1);
    
    setPasswordStrength(strength);
  };

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 0: return "Too weak";
      case 1: return "Weak";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Strong";
      default: return "";
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return "bg-red-600";
      case 1: return "bg-orange-600";
      case 2: return "bg-yellow-600";
      case 3: return "bg-blue-600";
      case 4: return "bg-green-600";
      default: return "bg-gray-600";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!email || !password || !confirmPassword || !inviteCode || !displayName) {
      onError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      onError('Passwords do not match');
      return;
    }
    
    // Password strength validation
    if (password.length < 10) {
      onError('Password must be at least 10 characters');
      return;
    }
    
    if (!/[A-Z]/.test(password)) {
      onError('Password must include at least one uppercase letter');
      return;
    }
    
    if (!/[a-z]/.test(password)) {
      onError('Password must include at least one lowercase letter');
      return;
    }
    
    if (!/[0-9]/.test(password)) {
      onError('Password must include at least one number');
      return;
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>~\-_=+[\]]/.test(password)) {
      onError('Password must include at least one special character');
      return;
    }
    
    // Check for common patterns
    if (/12345|qwerty|password|admin|letmein/i.test(password)) {
      onError('Password contains a common pattern. Please choose a stronger password');
      return;
    }
    
    // Check for repetitive characters
    if (/(.)\1{2,}/.test(password)) {
      onError('Password contains too many repeated characters');
      return;
    }
    
    // Check for keyboard sequences
    const keyboardSequences = ['qwerty', 'asdfgh', 'zxcvbn', '123456'];
    for (const seq of keyboardSequences) {
      if (password.toLowerCase().includes(seq)) {
        onError('Password contains a keyboard sequence. Please choose a stronger password');
        return;
      }
    }
    
    if (displayName && displayName.length < 3) {
      onError('Display name must be at least 3 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Add CSRF token to the request if available
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      const response = await fetch('/api/v1/users/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          password,
          confirm_password: confirmPassword,
          display_name: displayName || undefined,
          invite_code: inviteCode,
          csrf_token: csrfToken, // Also include in the body for flexibility
        }),
        credentials: 'include', // Important for cookies
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Special handling for the compromised password error
        if (data.detail && data.detail.includes("data breach")) {
          setPassword(''); // Clear the password for security
          setConfirmPassword(''); // Clear confirmation too
          onError('This password has appeared in a data breach. Please choose a different password for security.');
          return;
        }
        
        onError(data.detail || 'Registration failed');
        return;
      }
      
      // Success - clear form and notify
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
      setInviteCode('');
      
      onSuccess();
    } catch (error) {
      console.error('Registration error:', error);
      onError('An unexpected error occurred during registration');
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
            placeholder="name@example.com"
            className="w-full px-4 py-3 bg-black/50 border border-white/20 focus:border-purple-500/60 hover:border-purple-500/40 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all duration-200 rounded-lg"
          />
          <div className="absolute inset-0 pointer-events-none rounded-lg transition-opacity duration-300 opacity-0 group-focus-within:opacity-100" style={{ background: 'linear-gradient(90deg, rgba(139, 92, 246, 0) 0%, rgba(139, 92, 246, 0.1) 100%)' }}></div>
        </div>
      </motion.div>
      
      <motion.div 
        className="group"
        variants={inputVariants}
      >
        <label htmlFor="displayName" className="flex items-center mb-2 text-sm font-medium text-white/80">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          Display Name
        </label>
        <div className="relative">
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isLoading}
            required
            placeholder="How you'll appear to others"
            className="w-full px-4 py-3 bg-black/50 border border-white/20 focus:border-purple-500/60 hover:border-purple-500/40 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all duration-200 rounded-lg"
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 bg-black/50 border border-white/20 focus:border-purple-500/60 hover:border-purple-500/40 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all duration-200 rounded-lg"
            aria-describedby="password-requirements"
          />
          <div className="absolute inset-0 pointer-events-none rounded-lg transition-opacity duration-300 opacity-0 group-focus-within:opacity-100" style={{ background: 'linear-gradient(90deg, rgba(139, 92, 246, 0) 0%, rgba(139, 92, 246, 0.1) 100%)' }}></div>
        </div>
        
        {/* Password strength meter and requirements - always present but animated */}
        <div 
          className="mt-2 overflow-hidden transition-all duration-300 ease-in-out"
          style={{ 
            maxHeight: password.length > 0 ? '200px' : '0px',
            opacity: password.length > 0 ? 1 : 0,
            transform: `translateY(${password.length > 0 ? '0' : '-8px'})`,
            marginBottom: password.length > 0 ? '8px' : '0'
          }}
        >
          <div className="flex justify-between items-center mb-1">
            <div className="flex h-2 w-full bg-gray-900/60 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getStrengthColor()} transition-all duration-300`} 
                style={{ width: `${(passwordStrength / 4) * 100}%` }}
              ></div>
            </div>
            <span className={`text-xs ml-3 font-medium ${
              passwordStrength === 0 ? 'text-red-500' :
              passwordStrength === 1 ? 'text-orange-500' :
              passwordStrength === 2 ? 'text-yellow-500' :
              passwordStrength === 3 ? 'text-blue-400' :
              'text-green-500'
            }`}>
              {getStrengthLabel()}
            </span>
          </div>
          
          {/* Password requirements with interactive checkmarks */}
          <div id="password-requirements" className="grid grid-cols-2 gap-1 text-xs mt-1">
            <div className={`flex items-center transition-colors duration-300 ${password.length >= 10 ? 'text-green-400' : 'text-white/40'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                {password.length >= 10 ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                )}
              </svg>
              <span>10+ characters</span>
            </div>
            <div className={`flex items-center transition-colors duration-300 ${/[A-Z]/.test(password) ? 'text-green-400' : 'text-white/40'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                {/[A-Z]/.test(password) ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                )}
              </svg>
              <span>Uppercase letter</span>
            </div>
            <div className={`flex items-center transition-colors duration-300 ${/[a-z]/.test(password) ? 'text-green-400' : 'text-white/40'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                {/[a-z]/.test(password) ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                )}
              </svg>
              <span>Lowercase letter</span>
            </div>
            <div className={`flex items-center transition-colors duration-300 ${/[0-9]/.test(password) ? 'text-green-400' : 'text-white/40'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                {/[0-9]/.test(password) ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                )}
              </svg>
              <span>Number</span>
            </div>
            <div className={`flex items-center transition-colors duration-300 ${/[!@#$%^&*(),.?":{}|<>~\-_=+[\]]/.test(password) ? 'text-green-400' : 'text-white/40'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                {/[!@#$%^&*(),.?":{}|<>~\-_=+[\]]/.test(password) ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                )}
              </svg>
              <span>Special character</span>
            </div>
            <div className={`flex items-center transition-colors duration-300 ${!(/(.)\1{2,}/.test(password) || /12345|qwerty|password|admin|letmein/i.test(password)) ? 'text-green-400' : 'text-white/40'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                {!(/(.)\1{2,}/.test(password) || /12345|qwerty|password|admin|letmein/i.test(password)) ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                )}
              </svg>
              <span>No common patterns</span>
            </div>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        className="group"
        variants={inputVariants}
      >
        <label htmlFor="confirmPassword" className="flex items-center mb-2 text-sm font-medium text-white/80">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
            placeholder="••••••••"
            className="w-full px-4 py-3 bg-black/50 border border-white/20 focus:border-purple-500/60 hover:border-purple-500/40 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all duration-200 rounded-lg"
          />
          <div className="absolute inset-0 pointer-events-none rounded-lg transition-opacity duration-300 opacity-0 group-focus-within:opacity-100" style={{ background: 'linear-gradient(90deg, rgba(139, 92, 246, 0) 0%, rgba(139, 92, 246, 0.1) 100%)' }}></div>
        </div>
      </motion.div>
      
      <motion.div 
        className="group"
        variants={inputVariants}
      >
        <label htmlFor="inviteCode" className="flex items-center mb-2 text-sm font-medium text-white/80">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          Invite Code
        </label>
        <div className="relative">
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            disabled={isLoading}
            required
            placeholder="Enter your invite code"
            className="w-full px-4 py-3 bg-black/50 border border-white/20 focus:border-purple-500/60 hover:border-purple-500/40 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all duration-200 rounded-lg"
          />
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
                <span>Creating Account...</span>
              </>
            ) : (
              <span className="flex items-center">
                <span>Create Account</span>
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

export default RegisterForm; 