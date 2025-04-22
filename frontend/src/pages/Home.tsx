import React from 'react';
import Hero from "../components/hero";
import FeatureCards from "../components/feature-cards";

const Home: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col">
      <Hero />
      <FeatureCards />
    </div>
  );
};

export default Home; 