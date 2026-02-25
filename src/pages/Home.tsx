import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Gamepad2, 
  Trophy, 
  TrendingUp, 
  Zap, 
  Star,
  Play,
  ArrowRight,
  Users
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { cn } from '../lib/utils';

export default function Home() {
  const featuredGames = [
    { id: 1, name: 'Krazy Slots', type: 'Slots', image: 'https://picsum.photos/seed/slots/400/300', slug: 'krazy-slots' },
    { id: 2, name: 'Neon Dice', type: 'Dice', image: 'https://picsum.photos/seed/dice/400/300', slug: 'neon-dice' },
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section - Recipe 2: Editorial */}
      <section className="relative min-h-[80vh] flex flex-col justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3b82f6_0%,transparent_50%)]" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">
              Next Gen Social Casino
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-blue-500/20 to-transparent" />
          </div>

          <h1 className="text-[12vw] md:text-[10vw] font-black leading-[0.85] tracking-tighter uppercase italic text-white mb-8">
            Play <br />
            <span className="text-blue-600">Krazy</span> <br />
            Win Big
          </h1>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <Link to="/games">
              <Button size="lg" className="h-16 px-12 text-xl font-black uppercase italic tracking-tighter shadow-2xl shadow-blue-600/40">
                Enter Lobby
              </Button>
            </Link>
            <div className="max-w-xs">
              <p className="text-slate-400 text-sm leading-relaxed">
                Experience the thrill of the world's first AI-powered social casino. 
                Free to play, forever. No purchase necessary.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-10 md:right-40 w-32 h-32 md:w-64 md:h-64 bg-blue-600/10 rounded-full blur-3xl" 
        />
      </section>

      {/* Featured Games */}
      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Featured Games</h2>
            <p className="text-slate-500 text-sm">Hand-picked favorites from our community.</p>
          </div>
          <Link to="/games" className="text-blue-500 hover:text-blue-400 font-bold text-sm flex items-center gap-2 group">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuredGames.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Link to={`/games/${game.slug}`}>
                <Card className="group overflow-hidden border-white/5 hover:border-blue-500/30 transition-all duration-500">
                  <div className="relative aspect-[21/9] overflow-hidden">
                    <img 
                      src={game.image} 
                      alt={game.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-6 left-6">
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">{game.type}</div>
                      <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">{game.name}</h3>
                    </div>
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats / Trust Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Users, label: 'Active Players', value: '12.4k+', color: 'text-blue-500' },
          { icon: Trophy, label: 'Total Payouts', value: '850M+', color: 'text-yellow-500' },
          { icon: Zap, label: 'Daily Bonuses', value: '5k+', color: 'text-emerald-500' },
        ].map((stat, i) => (
          <Card key={i} className="p-8 bg-slate-900/50 border-white/5 flex flex-col items-center text-center space-y-4">
            <div className={cn("w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center", stat.color.replace('text', 'bg') + '/10')}>
              <stat.icon className={cn("w-8 h-8", stat.color)} />
            </div>
            <div>
              <div className="text-3xl font-black text-white tracking-tighter">{stat.value}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
