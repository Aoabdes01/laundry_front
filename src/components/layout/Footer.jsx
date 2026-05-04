import React from 'react';
import logo from '../../assets/logo.png'; // Adjust path as needed

const Footer = () => {
  return (
    <footer className="w-full bg-[#0D1B2A] text-white py-12 px-5 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">

        {/* LOGO SECTION */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#0D7377] to-[#14A3A8] rounded-[10px] flex items-center justify-center shadow-lg">
             <img
               src={logo}
               alt="Pure Clean"
               className="h-5 w-5 object-contain brightness-0 invert"
             />
          </div>
          <span className="font-['Plus_Jakarta_Sans'] font-bold text-xl tracking-tight uppercase whitespace-nowrap">
            Pure <span className="text-[var(--primary-light)]">Clean</span>
          </span>
        </div>

        {/* LINKS OR DIVIDER */}
        <div className="w-full h-px bg-white/10 max-w-sm"></div>

        {/* COPYRIGHT TEXT */}
        <div className="text-center space-y-3">
          <p className="font-['Inter'] text-[11px] font-bold tracking-[0.2em] uppercase text-white/40">
            © 2026 PURE CLEAN MANAGEMENT
          </p>
          <p className="font-['Inter'] text-[11px] font-medium uppercase tracking-[0.1em] text-white/20 leading-relaxed max-w-xs mx-auto">
            Système Premium de Gestion de Blanchisserie pour Professionnels
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
