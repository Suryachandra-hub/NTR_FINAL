
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { TabView } from '../types';
import { FanCard } from '../components/FanCard';
import { TrendingUp, Activity, Film, MessageSquare, RefreshCw, Globe, ExternalLink, ShieldCheck, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import { getDailyQuote } from '../constants';

export const Dashboard = () => {
  const { currentUser, setTab, leaderboardCache, fetchLeaderboard } = useStore();
  const [updates, setUpdates] = useState<string>('');
  const [sources, setSources] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  
  // Get Daily Quote
  const dailyQuote = getDailyQuote();

  useEffect(() => {
     fetchLeaderboard();
     fetchRealTimeUpdates();
  }, []);

  const fetchRealTimeUpdates = async () => {
    // Correctly using process.env.API_KEY as per guidelines
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      setUpdates("API Key missing (API_KEY in environment). Cannot fetch live updates.");
      setLoadingNews(false);
      return;
    }
    setLoadingNews(true);
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Search for the absolute latest breaking news, rumors, and shooting updates for Jr NTR. Specifically look for: 1. Updates on Devara & War 2. 2. Any news regarding his sons (Abhay Ram, Bhargav Ram) visiting sets (like Varanasi), acting debuts, or viral photos. 3. Recent public appearances. Summarize the top 3 most exciting updates with a "Mass" tone.',
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text;
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      
      const chunks = groundingMetadata?.groundingChunks || [];
      const webSources = chunks
        .filter((c: any) => c.web?.uri)
        .map((c: any) => ({
          title: c.web.title || 'Source',
          uri: c.web.uri
        }));

      setUpdates(text || "No updates found.");
      setSources(webSources);

    } catch (error) {
      console.error("News fetch failed", error);
      setUpdates("Secure connection to News Network failed. Please try again later.");
    } finally {
      setLoadingNews(false);
    }
  };

  if (!currentUser) return null;

  const totalFans = leaderboardCache.length;
  const totalDonors = leaderboardCache.filter(u => u.isDonor).length;

  return (
    <div className="p-4 lg:p-8 pb-20 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl lg:text-6xl font-royal font-black text-white leading-none mb-2 uppercase drop-shadow-lg tracking-tight">
            WELCOME <span className="text-transparent bg-clip-text bg-gold-gradient">{currentUser.fullName ? currentUser.fullName.toUpperCase() : currentUser.displayName.toUpperCase()}</span>
          </h1>
          <p className="text-gray-400 text-sm font-mono tracking-wider flex items-center gap-2">
            <ShieldCheck size={14} className="text-green-500" />
            FAN ID: {currentUser.fanId} • DISTRICT: {currentUser.district}
          </p>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={() => setTab(TabView.FANZONE)}
             className="px-6 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-sm text-xs font-bold uppercase tracking-wider transition font-royal"
           >
             Edit Profile
           </button>
           <button 
             onClick={() => setTab(TabView.CHAT)}
             className="px-6 py-2 bg-ntr-gold text-black rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-ntr-goldDark transition flex items-center gap-2 shadow-[0_0_15px_rgba(255,215,0,0.3)] font-royal"
           >
             <MessageSquare size={14} /> Talk to AI
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Fan ID (Passport Style) */}
        <div className="lg:col-span-4 xl:col-span-3 flex justify-center lg:justify-start">
           <div className="sticky top-24">
              <FanCard user={currentUser} />
              <div className="text-center mt-6">
                 <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold">Digital Pass Status</p>
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-black uppercase tracking-wider animate-pulse">
                   <div className="w-2 h-2 bg-green-500" /> ACTIVE
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <ActionCard 
               icon={Film} 
               label="MOVIES" 
               sub="FILMOGRAPHY" 
               onClick={() => setTab(TabView.MOVIES)} 
               color="text-blue-400"
             />
             <ActionCard 
               icon={Activity} 
               label="DONOR SQUAD" 
               sub="EMERGENCY" 
               onClick={() => setTab(TabView.EMERGENCY)} 
               color="text-red-500"
             />
             <ActionCard 
               icon={TrendingUp} 
               label="RANKINGS" 
               sub="LEADERBOARD" 
               onClick={() => setTab(TabView.LEADERBOARD)} 
               color="text-ntr-gold"
             />
          </div>

          {/* Tiger Tracker: Real Time News */}
          <div className="glass-panel rounded-lg p-1 border border-ntr-gold/20 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ntr-gold via-ntr-orange to-yellow-600" />
             
             <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-ntr-gold/10 rounded-sm">
                        <Newspaper className="text-ntr-gold" size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white font-royal tracking-wide uppercase">TIGER TRACKER</h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1 font-bold">
                          <Globe size={10} /> Live Intelligence • Rumors • News
                        </p>
                      </div>
                   </div>
                   <button 
                     onClick={fetchRealTimeUpdates} 
                     disabled={loadingNews}
                     className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition"
                   >
                     <RefreshCw size={18} className={loadingNews ? 'animate-spin' : ''} />
                   </button>
                </div>

                {loadingNews ? (
                  <div className="space-y-3 py-4">
                    <div className="h-4 bg-white/5 w-3/4 animate-pulse" />
                    <div className="h-4 bg-white/5 w-1/2 animate-pulse" />
                    <div className="h-4 bg-white/5 w-5/6 animate-pulse" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="text-gray-200 whitespace-pre-line leading-relaxed border-l-4 border-ntr-gold pl-4 font-medium font-sans text-lg">
                        {updates}
                      </div>
                    </div>

                    {sources.length > 0 && (
                      <div className="pt-4 border-t border-white/5">
                        <span className="text-[10px] text-gray-500 uppercase font-bold block mb-2 tracking-widest">Verified Sources</span>
                        <div className="flex flex-wrap gap-2">
                          {sources.slice(0, 3).map((source, idx) => (
                            <a 
                              key={idx}
                              href={source.uri}
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-black/40 border border-white/10 text-[10px] text-blue-400 hover:text-blue-300 hover:border-blue-500/30 transition truncate max-w-[200px] uppercase font-bold tracking-wider"
                            >
                              <ExternalLink size={10} />
                              <span className="truncate">{source.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
             </div>
          </div>

          {/* Featured Content / Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-lg border border-white/5">
               <h4 className="font-black text-white mb-4 text-sm uppercase tracking-widest font-royal">Community Pulse</h4>
               <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-4xl font-black text-white font-royal">{totalFans.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Active Fans</div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center">
                    <div className="text-4xl font-black text-ntr-gold font-royal">{totalDonors.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Donors Ready</div>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center">
                    <div className="text-4xl font-black text-white font-royal">24/7</div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Admin Watch</div>
                  </div>
               </div>
            </div>

            {/* Quote of the day - DYNAMIC */}
            <div className="glass-panel p-6 rounded-lg border border-white/5 flex flex-col justify-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-ntr-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
               <div className="relative z-10">
                   <span className="text-[10px] text-ntr-gold font-black uppercase tracking-[0.2em] block mb-2">Quote of the Day</span>
                   <blockquote className="italic text-gray-200 text-lg border-l-2 border-ntr-orange pl-3 font-medium">
                     "{dailyQuote.text}"
                   </blockquote>
                   <cite className="block text-right text-xs font-black text-white mt-3 uppercase not-italic font-royal tracking-wider">
                     - {dailyQuote.movie}
                   </cite>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ icon: Icon, label, sub, onClick, color }: any) => (
  <motion.button 
    whileHover={{ y: -5 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="glass-panel p-4 rounded-lg border border-white/5 hover:bg-white/5 hover:border-white/10 transition text-left group w-full"
  >
    <div className={`p-3 rounded-sm w-fit mb-3 ${color} bg-white/5 group-hover:bg-white/10 transition`}>
       <Icon size={24} />
    </div>
    <div className="font-black text-white text-xl leading-none mb-1 font-royal tracking-wide uppercase">{label}</div>
    <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">{sub}</div>
  </motion.button>
);
