import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ message = "Chargement de votre session..." }) => {
  const content = (
    <div className="fixed inset-0 bg-gray-50/80 backdrop-blur-sm flex flex-col items-center justify-center z-[9999]">
      <div className="bg-white p-8 rounded-[2rem] shadow-modal flex flex-col items-center max-w-sm w-full mx-4 border border-border/50 animate-in zoom-in-95 duration-300">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-100 rounded-full"></div>
          <Loader2 className="w-16 h-16 text-primary-600 animate-spin absolute top-0 start-0" />
        </div>
        <h2 className="mt-6 text-xl font-black text-text-primary text-center uppercase tracking-tight">
          {message}
        </h2>
        <p className="mt-2 text-xs font-bold text-text-muted text-center uppercase tracking-widest opacity-60">
          Veuillez patienter quelques instants.
        </p>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default LoadingScreen;

