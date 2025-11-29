
import React from 'react';
import { useStore } from '../store';
import { Crown, Trophy, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

export const Leaderboard = () => {
  const { leaderboardCache, currentUser } = useStore();
  
  // Use cache or empty
  const leaderboardData = leaderboardCache;

  return (
    <div className="p-4 lg:p-8 pb-20 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-black text-white mb-2">TOP FANS</h1>
        <p className="text-gray-400">Real-time Community Rankings</p>
      </div>

      <div className="space-y-4">
        {leaderboardData.length === 0 ? (
          <div className="text-center text-gray-500">No fans active yet. Be the first!</div>
        ) : (
          leaderboardData.map((entry, idx) => {
            let Icon = Medal;
            let color = "text-gray-400";
            if (idx === 0) { Icon = Crown; color = "text-ntr-gold"; }
            if (idx === 1) { Icon = Trophy; color = "text-gray-200"; }
            if (idx === 2) { Icon = Trophy; color = "text-orange-400"; }
            
            const isMe = currentUser && currentUser.fanId === entry.fanId;

            return (
              <motion.div
                key={entry.fanId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`glass-panel p-4 rounded-xl flex items-center gap-4 border transition-all ${
                  isMe 
                    ? 'border-ntr-orange bg-ntr-orange/10 scale-[1.02] shadow-[0_0_20px_rgba(255,77,0,0.3)]' 
                    : idx === 0 ? 'border-ntr-gold/50 bg-ntr-gold/5' : 'border-white/5'
                }`}
              >
                <div className="w-8 font-bold text-center text-gray-500 font-mono">#{entry.rank}</div>
                
                <div className={`w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-white/10 ${color}`}>
                   <Icon size={24} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold ${isMe ? 'text-ntr-orange' : 'text-white'}`}>
                        {entry.name} {isMe && '(You)'}
                    </h3>
                    {idx === 0 && <span className="text-[10px] bg-ntr-gold text-black px-1.5 rounded font-bold">TOP</span>}
                  </div>
                  <div className="text-xs text-gray-400 flex gap-3">
                    <span className="font-mono">{entry.fanId}</span>
                    <span>•</span>
                    <span>{entry.district}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-display font-bold text-xl text-white">{entry.points.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-500 uppercase">Points</div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
