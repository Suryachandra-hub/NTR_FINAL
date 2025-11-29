
import React from 'react';
import { User } from '../types';
import { ShieldCheck, Wifi, Cpu } from 'lucide-react';
import QRCode from 'react-qr-code';

interface FanCardProps {
  user: User;
}

export const FanCard: React.FC<FanCardProps> = ({ user }) => {
  const getAvatarUrl = (user: User) => {
    // If real photo exists, user that
    if (user.photoUrl) return user.photoUrl;

    const baseUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`;
    
    // Use custom config if available
    if (user.avatarConfig) {
       const { top, facialHair, accessories, hairColor } = user.avatarConfig;
       // We join array parameters for the API
       const topParam = top.map(t => `top[]=${t}`).join('&');
       return `${baseUrl}&${topParam}&facialHair[]=${facialHair}&accessories[]=${accessories}&hairColor[]=${hairColor}`;
    }

    // Fallback logic
    if (user.gender === 'male') {
        return `${baseUrl}&top[]=shortHair&top[]=shortFlat&top[]=shortRound&top[]=caesar&top[]=curvy&facialHairProbability=20`;
    } else {
        return `${baseUrl}&top[]=longHair&top[]=straight01&top[]=straight02&top[]=curvy&top[]=bob&top[]=bigHair&facialHairProbability=0`;
    }
  };

  // Extract the 4 digits
  const fanIdNumber = user.fanId.split('-')[1] || '0000';

  return (
    <div className="group relative w-[320px] h-[520px] mx-auto perspective-1000 select-none">
       {/* Card Container */}
       <div className="relative w-full h-full rounded-[24px] bg-[#050505] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 transition-transform duration-500 group-hover:scale-[1.02] group-hover:rotate-y-2">
           
           {/* Animated Holographic sheen */}
           <div className="absolute inset-0 z-30 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay" style={{ backgroundSize: '200% 200%' }} />

           {/* Background Texture */}
           <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40" />
           <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#1a1a1a] via-[#050505] to-black opacity-90" />
           
           {/* Decorative Gold Elements */}
           <div className="absolute top-0 right-0 w-48 h-48 bg-ntr-gold/10 blur-[80px] rounded-full" />
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-ntr-orange/10 blur-[60px] rounded-full" />

           {/* Border Frame */}
           <div className="absolute inset-3 border border-ntr-gold/20 rounded-[20px] z-10 pointer-events-none">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-ntr-gold to-transparent" />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-ntr-gold to-transparent" />
           </div>

           {/* Content Layer */}
           <div className="relative z-20 h-full flex flex-col p-6">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-lg font-display font-black text-white tracking-widest leading-none">
                      NTR<span className="text-ntr-gold">WORLD</span>
                    </h2>
                    <p className="text-[8px] text-gray-500 tracking-[0.3em] uppercase mt-0.5">Official Member</p>
                 </div>
                 <Wifi size={18} className="text-gray-600" />
              </div>

              {/* Chip & Status */}
              <div className="flex justify-between items-end mb-6">
                 <Cpu size={36} className="text-yellow-200/90 drop-shadow-lg" strokeWidth={1} />
                 <div className="text-right">
                    <span className="inline-block px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-green-500 font-bold uppercase tracking-wider">
                      Active
                    </span>
                 </div>
              </div>

              {/* Avatar Main */}
              <div className="flex-1 flex flex-col items-center justify-center relative">
                 <div className="absolute w-44 h-44 border border-white/5 rounded-full animate-spin-slow" />
                 
                 <div className="w-36 h-36 rounded-full p-1 bg-gradient-to-br from-ntr-gold via-yellow-500 to-transparent shadow-2xl relative z-10">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black relative">
                       <img 
                         src={getAvatarUrl(user)} 
                         alt="Avatar" 
                         className="w-full h-full object-cover transform scale-105"
                         onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.displayName}&background=random`; }}
                       />
                       {/* Gloss */}
                       <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                    </div>
                    
                    {user.isDonor && (
                      <div className="absolute -bottom-1 -right-1 bg-red-600 text-white p-1.5 rounded-full shadow-lg border-2 border-black z-20">
                        <ShieldCheck size={12} />
                      </div>
                    )}
                 </div>

                 <div className="mt-6 text-center">
                    <h1 className="text-2xl font-black text-white font-display uppercase tracking-wider drop-shadow-md">
                      {user.displayName}
                    </h1>
                    <p className="text-xs text-ntr-gold font-bold uppercase tracking-[0.2em] mt-1 opacity-80">
                      {user.district}
                    </p>
                 </div>
              </div>

              {/* Bottom Section: ID & QR */}
              <div className="mt-auto pt-4 flex items-end justify-between">
                  <div>
                     <p className="text-[8px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Fan Identity</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-gray-600">NTR</span>
                        <span className="text-3xl font-mono font-black text-white text-glow tracking-widest">{fanIdNumber}</span>
                     </div>
                  </div>
                  
                  <div className="p-1 bg-white rounded-lg shadow-lg">
                     <QRCode value={`NTR-WORLD-ID:${user.fanId}`} size={42} />
                  </div>
              </div>

           </div>
       </div>
    </div>
  );
};
