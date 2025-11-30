import React from 'react';
import { useStore } from '../store';
import { TabView } from '../types';
import { Menu, Home, Film, User, Activity, Shield, X, Crown, MessageSquare, Eye, EyeOff, Radio, LogOut, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = () => {
  const { toggleSidebar, isTigerBackgroundActive, toggleTigerBackground, currentUser, logout, setTab, currentTab } = useStore();

  // FORCE OVERRIDE for surya
  const isSurya = currentUser?.username?.toLowerCase() === 'surya';
  const isUserAdmin = isSurya || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const handleBack = () => {
      setTab(TabView.DASHBOARD);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 glass-panel border-b-0 border-b-white/10 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        {/* LOGIC: Show Back Arrow if NOT on Dashboard, otherwise Show Menu */}
        {currentTab !== TabView.DASHBOARD ? (
            <button 
                onClick={handleBack} 
                className="lg:hidden text-white hover:text-ntr-orange transition flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 active:scale-95"
            >
                <ArrowLeft size={20} />
            </button>
        ) : (
            <button onClick={toggleSidebar} className="lg:hidden text-white hover:text-ntr-orange transition">
                <Menu size={24} />
            </button>
        )}

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTab(TabView.DASHBOARD)}>
           <div className="w-8 h-8 rounded bg-gradient-to-tr from-ntr-gold to-yellow-600 flex items-center justify-center font-bold text-black font-royal">N</div>
           <span className="font-royal font-bold text-xl tracking-wider text-white">NTR <span className="text-ntr-orange">WORLD</span></span>
        </div>
      </div>
      
      <div className="hidden lg:flex items-center gap-6">
        <NavButton tab={TabView.DASHBOARD} label="Home" />
        <NavButton tab={TabView.UPDATES} label="Updates" />
        <NavButton tab={TabView.MOVIES} label="Movies" />
        <NavButton tab={TabView.LEADERBOARD} label="Leaderboard" />
        {/* Admin Link for Desktop */}
        {isUserAdmin && (
             <NavButton tab={TabView.ADMIN} label="Admin Panel" />
        )}
      </div>

      <div className="flex items-center gap-4">
         <button 
           onClick={toggleTigerBackground}
           className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-[10px] uppercase font-bold text-gray-300 transition"
           title="Toggle Cinematic Background"
         >
            {isTigerBackgroundActive ? <Eye size={14} className="text-ntr-orange" /> : <EyeOff size={14} />}
            {isTigerBackgroundActive ? 'Tiger ON' : 'Tiger OFF'}
         </button>

         {/* USER IDENTITY & LOGOUT */}
         {currentUser && (
             <>
                {/* Mobile Badge */}
                <div className="lg:hidden flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${isUserAdmin ? 'bg-ntr-gold text-black border-ntr-gold' : 'bg-gray-800 text-white border-white/20'}`}>
                         {isUserAdmin ? <Shield size={10} fill="currentColor" /> : <User size={10} fill="currentColor" />}
                         {isSurya ? 'SUPER ADMIN' : (currentUser.role === 'super_admin' ? 'SUPER ADMIN' : isUserAdmin ? 'ADMIN' : 'FAN')}
                    </div>
                </div>

                {/* Desktop Badge & Logout */}
                <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-white/10">
                    <div className="text-right">
                        <div className="text-xs font-bold text-white uppercase">{currentUser.displayName}</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest flex justify-end gap-1 items-center">
                            {isSurya || currentUser.role === 'super_admin' ? (
                                <span className="text-red-500 flex items-center gap-1"><Shield size={8} fill="currentColor" /> SUPER ADMIN</span>
                            ) : isUserAdmin ? (
                                <span className="text-ntr-gold flex items-center gap-1"><Shield size={8} /> ADMIN</span>
                            ) : (
                                <span className="text-gray-400">FAN</span>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={logout}
                        className="p-2 bg-red-900/20 hover:bg-red-900/50 text-red-400 rounded-full transition border border-red-500/20 cursor-pointer"
                        title="Sign Out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
             </>
         )}
      </div>
    </nav>
  );
};

const NavButton = ({ tab, label }: { tab: TabView, label: string }) => {
  const { currentTab, setTab } = useStore();
  const isActive = currentTab === tab;
  return (
    <button 
      onClick={() => setTab(tab)}
      className={`text-sm font-medium tracking-wide transition-colors ${isActive ? 'text-ntr-orange' : 'text-gray-400 hover:text-white'}`}
    >
      {label}
    </button>
  );
}

export const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar, setTab, currentTab, currentUser, logout } = useStore();

  // FORCE OVERRIDE for surya
  const isSurya = currentUser?.username?.toLowerCase() === 'surya';
  const isUserAdmin = isSurya || currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const menuItems = [
    { tab: TabView.DASHBOARD, label: 'Dashboard', icon: Home },
    { tab: TabView.UPDATES, label: 'Official Updates', icon: Radio },
    { tab: TabView.CHAT, label: 'Tiger Talk AI', icon: MessageSquare },
    { tab: TabView.MOVIES, label: 'Movies Universe', icon: Film },
    { tab: TabView.FANZONE, label: 'Fan Zone (Profile)', icon: User },
    // RADAR REMOVED
    { tab: TabView.LEADERBOARD, label: 'Leaderboard', icon: Crown },
    { tab: TabView.EMERGENCY, label: 'Donor Network', icon: Activity, alert: true },
  ];

  if (isUserAdmin) {
      menuItems.push({ tab: TabView.ADMIN, label: 'Admin Panel', icon: Shield });
  }

  const handleLogout = () => {
      toggleSidebar();
      logout();
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-ntr-black border-r border-white/10 z-50 p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <span className="font-royal font-bold text-xl text-white">MENU</span>
              <button onClick={toggleSidebar}><X className="text-gray-400 hover:text-white" /></button>
            </div>

            {currentUser && (
              <div className="mb-8 p-4 glass-panel rounded-xl border border-ntr-orange/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    {isUserAdmin ? <Shield size={64} /> : <User size={64} />}
                </div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-gray-400">Signed in as</div>
                        
                        {/* ROLE BADGE */}
                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${isUserAdmin ? 'bg-ntr-gold text-black' : 'bg-gray-700 text-gray-300'}`}>
                            {isUserAdmin ? (
                                <><Shield size={8} fill="currentColor" /> {isSurya ? 'SUPER ADMIN' : (currentUser.role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN')}</>
                            ) : (
                                <><User size={8} fill="currentColor" /> FAN</>
                            )}
                        </div>
                    </div>
                    
                    <div className="font-bold text-lg text-white truncate">{currentUser.displayName}</div>
                    <div className="text-ntr-orange text-sm font-mono">{currentUser.fanId}</div>
                </div>
              </div>
            )}

            <div className="space-y-2 flex-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setTab(item.tab)}
                  className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all ${
                    currentTab === item.tab 
                      ? 'bg-ntr-orange text-black font-bold shadow-[0_0_15px_rgba(255,215,0,0.4)]' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {/* @ts-ignore - alert property check */}
                  {item.alert && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-white/10 space-y-4">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 p-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-200 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-bold">Sign Out</span>
                </button>
                <div className="text-xs text-center text-gray-600">
                    &copy; 2025 NTR Fan Universe<br/>Unofficial Fan Community
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
