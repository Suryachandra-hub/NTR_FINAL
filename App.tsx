
import React, { useEffect } from 'react';
import { useStore } from './store';
import { TabView } from './types';
import { Navbar, Sidebar } from './components/Layout';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { Movies } from './pages/Movies';
import { Emergency } from './pages/Emergency';
import { Leaderboard } from './pages/Leaderboard';
import { FanZone } from './pages/FanZone';
import { Admin } from './pages/Admin';
import { Chat } from './pages/Chat';
import { Updates } from './pages/Updates';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Siren, Loader2 } from 'lucide-react';

const App = () => {
  const { currentTab, currentUser, isTigerBackgroundActive, initBroadcastListener, initFeedListener, latestAlert, dismissAlert, restoreSession, isLoading, authError, syncTab } = useStore();

  useEffect(() => {
     restoreSession();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
        const hash = window.location.hash.replace('#', '');
        if (hash && Object.values(TabView).includes(hash as TabView)) {
            syncTab(hash as TabView);
        } else {
            if (useStore.getState().currentUser) {
                syncTab(TabView.DASHBOARD);
            } else {
                syncTab(TabView.LANDING);
            }
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
     if (currentUser) {
         initBroadcastListener();
         initFeedListener();
     }
  }, [currentUser]);

  if (isLoading && !authError) {
      return (
          <div className="min-h-screen bg-black flex items-center justify-center">
              <Loader2 className="animate-spin text-ntr-gold" size={48} />
          </div>
      );
  }

  if (currentTab === TabView.LANDING || !currentUser) {
    return <Landing />;
  }

  return (
    <div className="min-h-screen bg-transparent text-white font-sans selection:bg-ntr-orange selection:text-black relative">
      
      {/* PREMIUM CINEMATIC TIGER BACKGROUND */}
      {isTigerBackgroundActive && (
         <div className="tiger-bg animate-tiger-enter" />
      )}

      {/* GLOBAL ALERT TOAST */}
      <AnimatePresence>
        {latestAlert && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4"
          >
             <div className="bg-red-900/90 border border-red-500 backdrop-blur-md p-4 rounded-xl shadow-[0_0_50px_rgba(255,0,0,0.5)] flex items-start gap-4">
                <div className="p-2 bg-red-600 rounded-full animate-pulse">
                   <Siren className="text-white" size={24} />
                </div>
                <div className="flex-1">
                   <h3 className="font-black text-white text-lg font-display uppercase tracking-wider">EMERGENCY BROADCAST</h3>
                   <p className="text-white/90 text-sm font-medium">{latestAlert.message}</p>
                </div>
                <button onClick={dismissAlert} className="text-white/50 hover:text-white">
                   <X size={20} />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />
      <Sidebar />
      
      <main className="pt-16 min-h-screen relative z-10">
        {currentTab === TabView.DASHBOARD && <Dashboard />}
        {currentTab === TabView.UPDATES && <Updates />}
        {currentTab === TabView.CHAT && <Chat />}
        {currentTab === TabView.MOVIES && <Movies />}
        {currentTab === TabView.EMERGENCY && <Emergency />}
        {currentTab === TabView.LEADERBOARD && <Leaderboard />}
        {currentTab === TabView.FANZONE && <FanZone />}
        {currentTab === TabView.ADMIN && <Admin />}
      </main>
    </div>
  );
};

export default App;
