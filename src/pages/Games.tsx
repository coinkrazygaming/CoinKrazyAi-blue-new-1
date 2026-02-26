import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Gamepad2, Search, Filter, Play, Coins, Users, Zap, Star } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Games() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: gamesData, isLoading } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await fetch('/api/games');
      return res.json();
    }
  });

  const categories = [
    { id: 'all', label: 'All Games', icon: Gamepad2 },
    { id: 'slots', label: 'Slots & Reels', icon: Coins, path: '/games/slots' },
    { id: 'live', label: 'Live Casino', icon: Users, path: '/games/live-casino' },
    { id: 'new', label: 'New Releases', icon: Star },
  ];

  const filteredGames = gamesData?.games?.filter((game: any) => {
    const matchesCategory = activeCategory === 'all' || 
                           (activeCategory === 'slots' && game.type === 'slots') ||
                           (activeCategory === 'new' && game.slug === '4egypt-pots');
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Hero / Featured Slider Placeholder */}
      <div className="relative h-64 md:h-80 rounded-[2.5rem] overflow-hidden bg-slate-900 border border-white/5">
        <img 
          src="https://images.pexels.com/photos/3352398/pexels-photo-3352398.jpeg?auto=compress&cs=tinysrgb&w=1200" 
          alt="Featured Game" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-y-0 left-0 flex flex-col justify-center p-8 md:p-12 max-w-xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 rounded-md bg-yellow-500 text-[10px] font-black uppercase text-black">New Release</span>
            <span className="text-[10px] font-black uppercase text-white tracking-widest">CoinKrazy Studios</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-4">4 Pots of Egypt</h2>
          <p className="text-slate-400 text-sm mb-6 line-clamp-2">Experience the power of the ancient pharaohs in this stunning new slot adventure. Win up to 10.00 SC on a single spin!</p>
          <Link to="/games/4egypt-pots">
            <Button size="lg" className="bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase italic h-14 px-8 shadow-xl shadow-yellow-500/20">
              Play Now
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {categories.map((cat) => (
            cat.path ? (
              <Link key={cat.id} to={cat.path}>
                <Button 
                  variant="ghost" 
                  className="rounded-full px-6 py-2 h-10 border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white whitespace-nowrap"
                >
                  <cat.icon className="w-4 h-4 mr-2" />
                  {cat.label}
                </Button>
              </Link>
            ) : (
              <Button 
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'ghost'}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "rounded-full px-6 py-2 h-10 border transition-all whitespace-nowrap",
                  activeCategory === cat.id 
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20" 
                    : "border-white/5 bg-slate-900/50 text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <cat.icon className="w-4 h-4 mr-2" />
                {cat.label}
              </Button>
            )
          ))}
        </div>

        <div className="relative min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search games..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-slate-900/50 rounded-2xl animate-pulse" />
          ))
        ) : (
          filteredGames?.map((game: any, idx: number) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>
                    {game.slug === '4egypt-pots' && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-yellow-500 text-[8px] font-black uppercase text-black">
                        New
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-emerald-400">
                      RTP: {game.rtp}%
                    </div>
                  </div>
                  <CardContent className="p-4 bg-slate-900">
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter">{game.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{game.type}</p>
                      {game.slug === '4egypt-pots' && (
                        <p className="text-[10px] text-yellow-600 font-bold uppercase">CoinKrazy Studios</p>
                      )}
                    </div>
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
