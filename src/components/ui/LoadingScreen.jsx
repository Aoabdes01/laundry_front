import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ message = "Chargement en cours..." }) => {
  const content = (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-[10px] flex flex-col items-center justify-center z-[9999] animate-fade-in">
      <div className="flex flex-col items-center">
        {/* PREMIUM LOADER */}
        <div className="relative w-16 h-16 flex items-center justify-center mb-8">
          <div className="absolute inset-0 rounded-full border-[3px] border-[var(--primary-glow)]"></div>
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[var(--primary)] animate-spin"></div>
          <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse"></div>
        </div>

        <h2 className="font-['Plus_Jakarta_Sans'] text-[22px] font-bold text-[var(--text)] tracking-tight text-center">
          {message}
        </h2>
        <p className="font-['Inter'] text-[13px] text-[var(--text-muted)] font-medium mt-2 uppercase tracking-[0.06em]">
          PureClean Management
        </p>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default LoadingScreen;

