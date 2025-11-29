
import React, { useState } from 'react';
import { MOVIES_DATA } from '../constants';
import { Movie } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Calendar, DollarSign, Music, User, Film, ArrowLeft, Star, PlayCircle, BarChart3 } from 'lucide-react';

export const Movies = () => {
  const [filter, setFilter] = useState<'All' | 'Mass' | 'Class' | 'Pan-India'>('All');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const filteredMovies = MOVIES_DATA.filter(m => filter === 'All' || m.type === filter);

  // Detailed View Component
  if (selectedMovie) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto">
        {/* Background Blur of Poster */}
        <div className="absolute inset-0 z-0">
             <img src={selectedMovie.image} className="w-full h-full object-cover blur-3xl opacity-20" />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-black/60" />
        </div>

        <div className="relative z-10 p-4 lg:p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
            <button 
            onClick={() => setSelectedMovie(null)}
            className="mb-8 self-start flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition border border-white/10"
            >
            <ArrowLeft size={18} /> <span className="text-sm font-bold uppercase tracking-wider">Back to Gallery</span>
            </button>

            <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1"
            >
            {/* Poster & Quick Stats */}
            <div className="lg:col-span-4 space-y-6">
                <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 group">
                <img src={selectedMovie.image} alt={selectedMovie.title} className="w-full object-cover aspect-[2/3]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="inline-block px-3 py-1 bg-ntr-orange text-black font-bold text-xs rounded mb-2 uppercase tracking-wider">
                    {selectedMovie.verdict}
                    </div>
                </div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-white/10">
                    <h4 className="text-xs text-gray-500 uppercase font-bold mb-4 tracking-widest flex items-center gap-2">
                        <BarChart3 size={14} /> Production Stats
                    </h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-gray-400 text-sm">Budget</span>
                            <span className="text-white font-mono font-bold">{selectedMovie.budget || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-gray-400 text-sm">Box Office</span>
                            <span className="text-ntr-gold font-mono font-bold text-glow">{selectedMovie.boxOffice || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Release Date</span>
                            <span className="text-white font-mono font-bold">{selectedMovie.releaseDate || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8 lg:pt-4">
                <div>
                    <h1 className="text-5xl lg:text-7xl font-display font-black text-white leading-none mb-4 text-glow tracking-tight uppercase">
                        {selectedMovie.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-gray-300">
                        <span className="text-xl font-light">{selectedMovie.year}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-ntr-orange" />
                        <span className="text-xl font-light">{selectedMovie.type} Entertainer</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-ntr-orange" />
                        <span className="text-xl font-bold text-ntr-gold uppercase tracking-wider">{selectedMovie.role}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StatBox icon={User} label="Director" value={selectedMovie.director || 'N/A'} />
                    <StatBox icon={Music} label="Music Director" value={selectedMovie.musicDirector || 'N/A'} />
                </div>

                <div className="bg-white/5 p-8 rounded-2xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Film size={120} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4 font-display tracking-wide relative z-10">PLOT SYNOPSIS</h3>
                    <p className="text-gray-300 leading-relaxed text-lg relative z-10 font-light">
                        {selectedMovie.description || "No description available."}
                    </p>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-white mb-6 font-display tracking-wide flex items-center gap-2">
                        <Music className="text-ntr-orange" /> AUDIO JUKEBOX
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedMovie.songs?.map((song, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={idx} 
                            className="flex items-center gap-4 p-4 bg-black/40 border border-white/5 rounded-xl hover:bg-white/10 hover:border-ntr-gold/50 transition cursor-pointer group"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                                <PlayCircle size={24} className="text-ntr-gold ml-1" />
                            </div>
                            <div className="flex-1">
                                <span className="text-base text-white font-bold block group-hover:text-ntr-gold transition">{song}</span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Track {idx + 1}</span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition text-gray-400">
                                <div className="flex gap-0.5 items-end h-4">
                                    <div className="w-1 bg-ntr-orange h-2 animate-[pulse_1s_ease-in-out_infinite]" />
                                    <div className="w-1 bg-ntr-orange h-4 animate-[pulse_1.2s_ease-in-out_infinite]" />
                                    <div className="w-1 bg-ntr-orange h-3 animate-[pulse_0.8s_ease-in-out_infinite]" />
                                </div>
                            </div>
                        </motion.div>
                        ))}
                    </div>
                </div>

            </div>
            </motion.div>
        </div>
      </div>
    );
  }

  // Gallery View
  return (
    <div className="p-4 lg:p-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
        <div>
           <h1 className="text-4xl font-display font-black text-white">FILMOGRAPHY</h1>
           <p className="text-gray-400">The journey of the Young Tiger</p>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 max-w-full">
          {['All', 'Mass', 'Class', 'Pan-India'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border ${
                filter === f 
                  ? 'bg-ntr-gold text-black border-ntr-gold' 
                  : 'bg-transparent text-gray-400 border-gray-700 hover:border-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredMovies.map((movie, index) => (
          <motion.div
            key={movie.id}
            layoutId={`movie-${movie.id}`}
            onClick={() => setSelectedMovie(movie)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative h-[400px] rounded-xl overflow-hidden bg-gray-900 border border-white/5 cursor-pointer shadow-lg hover:shadow-ntr-orange/20 transition-all hover:scale-[1.02]"
          >
            <img src={movie.image} alt={movie.title} className="w-full h-full object-cover transition duration-700 opacity-80 group-hover:opacity-100" />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex flex-col justify-end p-6">
               <div className="transform translate-y-4 group-hover:translate-y-0 transition duration-300">
                 <span className="inline-block px-2 py-0.5 bg-ntr-orange text-black text-[10px] font-bold uppercase rounded mb-2">
                   {movie.type}
                 </span>
                 <h3 className="text-2xl font-bold text-white font-display leading-none mb-1">{movie.title}</h3>
                 <p className="text-gray-300 text-sm mb-2">{movie.year} • {movie.role}</p>
                 
                 <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                   <p className="text-ntr-gold font-bold text-xs uppercase tracking-wider">{movie.verdict}</p>
                   <div className="flex items-center gap-1 mt-2 text-xs text-blue-400">
                     <span>View Full Data</span> <ArrowLeft className="rotate-180" size={12} />
                   </div>
                 </div>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const StatBox = ({ icon: Icon, label, value, highlight = false }: any) => (
  <div className={`p-4 rounded-xl border ${highlight ? 'bg-ntr-gold/10 border-ntr-gold/30' : 'bg-white/5 border-white/5'}`}>
    <div className="flex items-center gap-2 mb-2 text-gray-400">
      <Icon size={14} />
      <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
    </div>
    <div className={`font-bold font-display tracking-wide ${highlight ? 'text-ntr-gold text-xl' : 'text-white text-lg'}`}>
      {value}
    </div>
  </div>
);
