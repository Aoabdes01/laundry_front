import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ message = "Chargement de votre session..." }) => {
  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full mx-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-100 rounded-full"></div>
          <Loader2 className="w-16 h-16 text-primary-600 animate-spin absolute top-0 start-0" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-gray-900 text-center">
          {message}
        </h2>
        <p className="mt-2 text-sm text-gray-500 text-center">
          Veuillez patienter quelques instants.
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;

