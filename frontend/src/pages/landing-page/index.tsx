import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesCore } from '../../components/sparkles';
import { useDevice } from '../../hooks/useDevice';
import { useAuth } from '../../hooks/useAuth.tsx';
import Header from './Header';
import Hero from './Hero.tsx';
import Features from './Features.tsx';
import HowItWorks from './HowItWorks';
import CTA from './CTA';
import Footer from './Footer';

const LandingPage: React.FC = () => {
  const { isMobile } = useDevice();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
      <div id="hero-section">
        <Hero />
      </div>
      <div id="features-section">
        <Features />
      </div>
      <div id="how-it-works-section">
        <HowItWorks />
      </div>
      <div id="cta-section">
        <CTA />
      </div>
      <Footer />
    </div>
  );
};

export default LandingPage; 