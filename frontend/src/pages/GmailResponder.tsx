import React from 'react';

const GmailResponder: React.FC = () => {
  return (
    <div className="container mx-auto p-8">
      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-6">Gmail Responder</h1>
        <p className="text-white/70 mb-8">
          Connect your Gmail account to get AI-drafted replies or summaries for your emails, 
          helping you manage your inbox efficiently.
        </p>
        {/* Gmail Responder UI components will go here */}
        <div className="text-white/70 text-center py-16">
          Gmail responder interface will be implemented here
        </div>
      </div>
    </div>
  );
};

export default GmailResponder; 