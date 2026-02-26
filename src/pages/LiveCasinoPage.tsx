import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Gamepad2, Search, Filter, Play, Zap, Users } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'motion/react';

export default function LiveCasinoPage() {
  const { data: gamesData, isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await fetch('/api/games');
      return res.json();
    }
  });

  // For now, including our featured new game in Live Casino as requested
  const liveGames = gamesData?.games?.filter((g: any) => g.slug === '4egypt-pots') || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Live Casino</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Real-time action</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [...Array(1)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-slate-900/50 rounded-2xl animate-pulse" />
          ))
        ) : (
          liveGames.length > 0 ? (
            liveGames.map((game: any, idx: number) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to={`/games/${game.slug}`}>
                  <Card className="group cursor-pointer border-white/5 hover:border-blue-500/30 transition-all overflow-hidden rounded-2xl">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={game.image_url} 
                        alt={game.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4 z-10">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-600 text-[10px] font-black uppercase text-white animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          Live
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />
                      <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                          <Play className="w-7 h-7 text-white fill-current" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-4 bg-slate-900">
                      <h3 className="font-black text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter">{game.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Featured Live</span>
                        <span className="text-[10px] font-black text-blue-500 uppercase">Provider: CoinKrazy Studios</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <Zap className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-500 uppercase italic tracking-tighter">More Live Games Coming Soon</h3>
            </div>
          )
        )}
      </div>
    </div>
  );
}
