import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  // Estimate navbar height (adjust if necessary based on actual padding/content)
  const navbarHeight = 'h-16'; // Example: h-16 corresponds to 4rem or 64px

  return (
    // Use bg-background for shadcn theme compatibility (usually dark)
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Fixed, blurred navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 ${navbarHeight} border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}
      >
        {/* Use flex justify-end to move content to the right */}
        <div className="container mx-auto flex h-full items-center justify-end">
          {/* Title linked to Home */}
          <Link to="/" className="text-xl font-bold hover:text-primary transition-colors">
            COSMOS UI
          </Link>
        </div>
      </nav>

      {/* Add padding top to main content to offset fixed navbar */}
      <main className={`flex-grow container mx-auto p-4 pt-[calc(4rem+1rem)]`}> {/* Adjust 4rem based on navbarHeight + desired space */}
        <Outlet /> {/* This is where the routed page components will be rendered */}
      </main>

      {/* Adjusted footer for dark theme */}
      <footer className="bg-muted text-muted-foreground text-center p-4 mt-auto">
        COSMOS App Footer
      </footer>
    </div>
  );
};

export default Layout; 