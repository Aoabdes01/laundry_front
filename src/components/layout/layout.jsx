import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './Header';
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
    <div className="min-h-screen bg-background font-sans flex flex-col transition-all duration-300 overflow-x-hidden">
      {/* 1. SIDEBAR: Visible from Tablet (md) and up */}
      {user && <Sidebar user={user} />}

      {/* 2. MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col h-screen relative transition-all duration-300 
        ${user ? 'md:ms-16 lg:ms-64' : 'ms-0'}`}>
        
        {/* TOPBAR: Fixed height, handles safe area inset top */}
        <Header />

        {/* SCROLLABLE CONTENT BODY */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 
          pt-[calc(4rem+env(safe-area-inset-top))] 
          pb-[calc(5rem+env(safe-area-inset-bottom))] 
          md:pb-8 scroll-smooth">
          
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* BOTTOM NAVIGATION: Strictly for Phone (below md) */}
        {user && (
          <div className="md:hidden">
            <BottomNav user={user} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
