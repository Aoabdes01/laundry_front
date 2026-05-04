import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { selectCurrentUser } from '../../store/auth/authSelector';
import OfflineBanner from '../ui/OfflineBanner';
import InstallPWA from '../ui/InstallPWA';
import { connectWebSocket, disconnectWebSocket } from '../../api/websocket';

const Layout = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  useEffect(() => {
    if (user?.id) {
      connectWebSocket(user.id, dispatch);
    }
    return () => {
      disconnectWebSocket();
    };
  }, [user?.id, dispatch]);

  // LOGIN PAGE STRUCTURAL EXEMPTION
  // Still render OfflineBanner on the login page — connectivity matters there too.
  if (isLoginPage) {
    return (
      <>
        <OfflineBanner />
        <Outlet />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col transition-all duration-300 overflow-x-hidden">
      {/* OFFLINE INDICATOR: Fixed amber strip at z-[200], above everything */}
      <OfflineBanner />

      {/* PWA INSTALL PROMPT: Bottom sheet, appears after 3s if criteria met */}
      <InstallPWA />

      {/* 1. SIDEBAR: Visible from Tablet (md) and up */}
      {user && <Sidebar user={user} />}

      {/* 2. MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col h-screen relative transition-all duration-300 
        ${user ? 'md:ms-16 lg:ms-64' : 'ms-0'}`}>
        
        {/* TOPBAR: Fixed height, handles safe area inset top */}
        <Header />

        {/* SCROLLABLE CONTENT BODY */}
        <main className="flex-1 overflow-y-auto px-5 py-6 
          pt-[calc(60px+1.5rem+env(safe-area-inset-top))] 
          pb-[calc(72px+1.5rem+env(safe-area-inset-bottom))] 
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
