import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Gamepad2, Search, Filter, Play, Gift, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'motion/react';
import { PlayerBonuses } from '../components/PlayerBonuses';

export default function Games() {
  const [showBonuses, setShowBonuses] = React.useState(false);
  const { data: gamesData, isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await fetch('/api/games');
      return res.json();
    }
  });

  return (
    <div className="space-y-12">
      {/* Hero Section - Recipe 2: Editorial */}
      <div className="relative h-[300px] md:h-[400px] rounded-[48px] overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-600/40 to-transparent z-10" />
        <img 
          src="https://picsum.photos/seed/gaming/1920/1080" 
          alt="Gaming Hero" 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/20 z-10" />
        
        <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-12 max-w-2xl space-y-6">
          <div className="space-y-2">
            <span className="px-4 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-[0.3em] border border-white/10">
              Featured Experience
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
              Krazy <br /> <span className="text-blue-400">Jackpots</span>
            </h1>
          </div>
          <p className="text-base md:text-lg text-slate-200 font-bold leading-relaxed hidden sm:block">
            Experience the next generation of social gaming. AI-powered odds, massive rewards, and a community like no other.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="h-12 md:h-14 px-8 md:px-10 font-black uppercase italic tracking-tighter text-base md:text-lg shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              Play Now
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
            <Gamepad2 className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Game Lobby</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Explore our premium selection</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search games..." 
              className="bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64 transition-all"
            />
          </div>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/5 hover:bg-white/5">
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {isLoading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[4/5] bg-slate-900/50 rounded-[40px] animate-pulse" />
          ))
        ) : (
          gamesData?.games?.map((game: any, idx: number) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative aspect-[4/5] rounded-[40px] overflow-hidden cursor-pointer bg-slate-900 border border-white/5"
            >
              <Link to={`/games/${game.slug}`} className="block h-full">
                <img 
                  src={game.image_url} 
                  alt={game.name} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                
                <div className="absolute top-6 right-6 z-20">
                  <div className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    RTP: {game.rtp}%
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 z-20 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="space-y-1 mb-4">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{game.type}</p>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{game.name}</h3>
                  </div>
                  
                  <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Min Play</span>
                      <span className="text-sm font-black text-white">1.00 GC</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
