import React from 'react';
import logo from '../../assets/logo.png'; // Adjust path as needed

const Footer = () => {
  return (
    <footer className="w-full bg-laundry-deep text-white py-10 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">

        {/* LOGO SECTION */}
        <div className="flex items-center gap-3 opacity-90 transition-opacity hover:opacity-100">
          <img
            src={logo}
            alt="Pure Clean"
            className="h-8 w-8 object-contain brightness-0 invert"
          />
          <span className="font-black text-xl tracking-tighter uppercase whitespace-nowrap">
            PURE <span className="text-laundry-fresh">CLEAN</span>
          </span>
        </div>

        {/* LINKS OR DIVIDER */}
        <div className="w-full h-px bg-white/10 max-w-xs"></div>

        {/* COPYRIGHT TEXT */}
        <div className="text-center space-y-2">
          <p className="text-laundry-sky/60 text-xs font-bold tracking-widest uppercase">
            © 2026 PURE CLEAN
          </p>
          <p className="text-laundry-sky/40 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
            Système Premium de Gestion de Blanchisserie
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
