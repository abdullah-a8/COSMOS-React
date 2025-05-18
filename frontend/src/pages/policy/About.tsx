import React, { useEffect } from 'react';
import { SparklesCore } from '../../components/sparkles';
import { useDevice } from '../../hooks/useDevice';
import Header from '../landing-page/Header';
import Footer from '../landing-page/Footer';

const About: React.FC = () => {
  const { isMobile } = useDevice();

  // Ensure scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
      
      <main className="relative z-10 container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-purple-500/20 shadow-[0_8px_32px_rgba(147,51,234,0.15)] p-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600">
              About COSMOS
            </h1>
            
            <div className="prose prose-invert prose-purple max-w-none text-gray-300">
              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">Meet Devosmic & COSMOS</h2>
              <p className="mt-3">Hello! We're <strong>Devosmic</strong>, the team behind <strong>COSMOS</strong>.</p>
              <p className="mt-3">Ever feel like you're juggling too much information? Between documents for work or study, interesting articles you've saved, online videos, and a never-ending stream of emails, it's easy to get overwhelmed. Keeping track of it all, finding what you need when you need it, and making sense of it can feel like a full-time job.</p>
              <p className="mt-3">We believe there's a smarter way.</p>
              <p className="mt-3">That's why we created <strong>COSMOS</strong>: Your Collaborative Organized System for Multiple Operating Specialists.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">What's COSMOS All About?</h2>
              <p className="mt-3">Imagine having a super-smart assistant that doesn't just do one thing, but has a team of specialists ready to help you with different kinds of information. That's the idea behind <strong>COSMOS</strong>.</p>
              <p className="mt-3">It's a single, easy-to-use online space where these specialists work together to help you:</p>
              <ul className="list-disc pl-5 space-y-3 text-gray-300 mt-3">
                <li>
                  <strong>Chat with Your Documents and Content:</strong>
                  <p className="mt-1">Have you ever wished you could just ask questions about a PDF report, a web article you saved, or even a YouTube video you don't have time to watch fully? With <strong>COSMOS</strong>, you can! Upload your documents, add web links, or give it a YouTube video link. <strong>COSMOS</strong> reads and understands them, then lets you ask questions and get answers based directly on your information. It's like having a search engine for your own stuff.</p>
                </li>
                <li>
                  <strong>Understand YouTube Videos Faster:</strong>
                  <p className="mt-1">Found a long YouTube video packed with useful info, but short on time? Just give the link to <strong>COSMOS</strong>. It can pull out the spoken text (the transcript) from the video and make it ready for you to read or even chat with, so you can get the key points without watching for hours.</p>
                </li>
                <li>
                  <strong>Get a Handle on Your Gmail:</strong>
                  <p className="mt-1"><strong className="text-violet-400">(Coming Soon!)</strong> Soon, <strong>COSMOS</strong> will also help you with your Gmail inbox. Imagine an assistant that can help sort your emails, give you quick summaries of long messages, and even help you draft replies, all securely and under your control.</p>
                </li>
              </ul>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">Why We Built COSMOS</h2>
              <p className="mt-3">At <strong>Devosmic</strong>, we're passionate about making complex technology simple and genuinely useful for everyday people. We saw how information overload was becoming a real challenge, and how most tools only solve one piece of the puzzle, forcing you to jump between different apps.</p>
              <p className="mt-3"><strong>COSMOS</strong> is our answer to that. We wanted to create a central hub where smart technology helps you manage and understand your digital world more smoothly. It's designed to be like a helpful collaborator, bringing different skills together to make your life a bit easier.</p>
              <p className="mt-3">Our goal is for <strong>COSMOS</strong> to be an assistant that grows with you, always learning new ways to help you make the most of your information without the technical headache.</p>

              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">The Devosmic Vision</h2>
              <p className="mt-3">We believe technology should empower you, not complicate things. <strong>Devosmic</strong> is committed to building tools that are intuitive, reliable, and respectful of your data. With <strong>COSMOS</strong>, we're starting with these core information tasks, but we envision a future where your digital assistant can help with even more, all in one place, working together seamlessly.</p>
              
              <h2 className="text-xl font-semibold mt-10 mb-4 border-b border-purple-500/30 pb-2">Interested in Trying COSMOS?</h2>
              <p className="mt-3"><strong>COSMOS</strong> is currently in its early stages (you might hear techy people call this a <strong className="text-violet-400">"beta"</strong>). If you have an invite, dive in and see how it can help you! We're constantly working to make it better and add new features.</p>
              <p className="mt-3">We're excited to help you conquer information overload and bring a little more calm and clarity to your digital life.</p>
              <p className="mt-3">Thanks for learning about <strong>Devosmic</strong> and <strong>COSMOS</strong>!</p>

            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default About; 