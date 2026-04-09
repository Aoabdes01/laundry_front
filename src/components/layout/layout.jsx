import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { selectCurrentUser } from '../../store/auth/authSelector';

const Layout = () => {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  // LOGIN PAGE STRUCTURAL EXEMPTION
  if (isLoginPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col transition-all duration-300">
      {/* 1. DESKTOP SIDEBAR (Fixed) */}
      {user && <Sidebar user={user} />}

      {/* 2. MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col h-screen relative transition-all duration-300 ${user ? 'md:ms-16 lg:ms-60' : 'ms-0'}`}>
        {/* CONTEXTUAL TOP HEADER (Fixed) */}
        <Header />

        {/* SCROLLABLE CONTENT BODY */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 pt-20 pb-32 md:pb-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* MOBILE BOTTOM NAVIGATION */}
        {user && <BottomNav user={user} />}
      </div>
    </div>
  );
};

export default Layout;
