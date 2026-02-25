import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Gamepad2, Search, Filter, Play } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'motion/react';

export default function Games() {
  const { data: gamesData, isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await fetch('/api/games');
      return res.json();
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5 text-blue-500" />
          </div>
          <h1 className="text-3xl font-black text-white">Game Lobby</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search games..." 
              className="bg-slate-900 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-slate-900/50 rounded-2xl animate-pulse" />
          ))
        ) : (
          gamesData?.games?.map((game: any, idx: number) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link to={`/games/${game.slug}`}>
                <Card className="group cursor-pointer hover:border-blue-500/30 transition-all">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={game.image_url} 
                      alt={game.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-emerald-400">
                      RTP: {game.rtp}%
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{game.name}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">{game.type}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
