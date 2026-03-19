import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Play, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

export default function AiRecommendations() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-recommendations'],
    queryFn: async () => {
      const res = await fetch('/api/ai/recommendations');
      return res.json();
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-4 glass-surface rounded-[40px] border border-white/5">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">LuckyAI is analyzing your playstyle...</p>
      </div>
    );
  }

  const recommendations = data?.games || [];

  if (recommendations.length === 0) return null;

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
            <Sparkles className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">AI For You</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Personalized picks based on your playstyle</p>
          </div>
        </div>
        <Link to="/games">
          <Button variant="ghost" className="group gap-2 font-black uppercase italic tracking-tighter">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {recommendations.map((game: any, idx: number) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative h-80 rounded-[40px] overflow-hidden bg-slate-900 border border-white/5 cursor-pointer"
          >
            <Link to={`/games/${game.slug}`} className="block h-full">
              <img 
                src={game.image_url || `https://picsum.photos/seed/${game.slug}/800/600`} 
                alt={game.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              
              <div className="absolute top-6 left-6 z-20">
                <div className="px-3 py-1 rounded-lg bg-blue-600 text-[8px] font-black text-white uppercase tracking-widest shadow-lg">
                  {game.match_score}% Match
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                <div className="space-y-1 mb-4">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{game.type}</p>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{game.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold line-clamp-1">{game.reason}</p>
                </div>
                
                <Button className="w-full h-12 font-black uppercase italic tracking-tighter rounded-2xl">
                  Play Now
                </Button>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
