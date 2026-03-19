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
  Users,
  Coins
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import AiRecommendations from '../components/AiRecommendations';
import AiChallenges from '../components/AiChallenges';
import LiveActivityFeed from '../components/LiveActivityFeed';

export default function Home() {
  const { user } = useAuth();
  const featuredGames = [
    { id: 1, name: 'Krazy Slots', type: 'Slots', image: 'https://picsum.photos/seed/slots/800/600', slug: 'krazy-slots', players: '2.4k' },
    { id: 2, name: 'Neon Dice', type: 'Dice', image: 'https://picsum.photos/seed/dice/800/600', slug: 'neon-dice', players: '1.1k' },
    { id: 3, name: 'Scratch Tickets', type: 'Instant', image: 'https://picsum.photos/seed/scratch/800/600', slug: 'scratch-tickets', players: '850' },
    { id: 4, name: 'Pull Tabs', type: 'Instant', image: 'https://picsum.photos/seed/pull/800/600', slug: 'pull-tabs', players: '420' },
  ];

  const liveWinners = [
    { user: 'LuckyJack', amount: '25,000 GC', game: 'Krazy Slots', time: 'Just now' },
    { user: 'SpinQueen', amount: '500.00 SC', game: 'Neon Dice', time: '2m ago' },
    { user: 'CoinKing', amount: '10,000 GC', game: 'Scratch Tickets', time: '5m ago' },
    { user: 'SlotMaster', amount: '2,500.00 SC', game: 'Krazy Slots', time: '8m ago' },
  ];

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Section - Recipe 2: Editorial + Recipe 7: Atmospheric */}
      <section className="relative min-h-[85vh] flex flex-col justify-center overflow-hidden -mt-8 -mx-4 md:-mx-8 px-4 md:px-8">
        {/* Atmospheric Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse delay-700" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        </div>
        
        <div className="relative z-10 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-4 mb-8">
              <span className="px-4 py-1.5 rounded-full glass-surface text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">
                The Future of Social Gaming
              </span>
              <div className="h-px w-24 bg-gradient-to-r from-blue-500/40 to-transparent" />
            </div>

            <h1 className="text-[14vw] md:text-[11vw] font-black leading-[0.8] tracking-tighter uppercase italic text-white mb-10 select-none">
              Play <br />
              <span className="text-blue-600 text-glow-blue">Krazy</span> <br />
              Win <span className="text-yellow-500 text-glow-gold">Real</span>
            </h1>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
              <Link to="/games">
                <Button size="lg" className="h-20 px-16 text-2xl font-black uppercase italic tracking-tighter shadow-[0_0_40px_rgba(59,130,246,0.4)] hover:scale-105 transition-all duration-300">
                  Start Playing
                </Button>
              </Link>
              <div className="max-w-sm border-l-2 border-white/10 pl-8">
                <p className="text-slate-400 text-lg leading-tight font-medium">
                  Join 12,000+ players in the most immersive AI-driven social casino. 
                  <span className="block mt-2 text-sm text-slate-500 font-bold uppercase tracking-widest">No Purchase Necessary</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating 3D-like elements */}
        <motion.div 
          animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-[10%] hidden xl:block"
        >
          <div className="w-64 h-64 glass-surface rounded-[40px] rotate-12 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:opacity-100 transition-opacity" />
            <Coins className="w-32 h-32 text-blue-500/40 animate-float" />
          </div>
        </motion.div>
      </section>

      {/* Live Winners Ticker */}
      <section className="relative -mt-20 z-20">
        <div className="glass-surface rounded-[32px] p-8 border border-white/10 bg-slate-950/40 backdrop-blur-xl">
          <LiveActivityFeed />
        </div>
      </section>

      {/* AI Challenges */}
      {user && <AiChallenges />}

      {/* AI Recommendations */}
      {user && <AiRecommendations />}

      {/* Featured Games - Bento Grid Style */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <span className="text-xs font-black text-blue-500 uppercase tracking-[0.3em]">Hot Right Now</span>
            </div>
            <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter">The Lobby</h2>
          </div>
          <Link to="/games">
            <Button variant="outline" className="group">
              View All Games <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {featuredGames.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "group relative overflow-hidden rounded-[32px] border border-white/5 hover:border-blue-500/30 transition-all duration-500",
                idx === 0 ? "md:col-span-8 aspect-[16/9]" : "md:col-span-4 aspect-square"
              )}
            >
              <Link to={`/games/${game.slug}`} className="block w-full h-full">
                <img 
                  src={game.image} 
                  alt={game.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                
                <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-[10px] font-black text-white uppercase tracking-tighter">
                        {game.type}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {game.players} Playing
                      </span>
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">{game.name}</h3>
                  </div>
                  <div className="w-14 h-14 rounded-2xl glass-surface flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-300">
                    <Play className="w-6 h-6 text-white fill-current translate-x-0.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Dual Currency System Info */}
      <section className="py-24 bg-slate-900/30 rounded-[4rem] border border-white/5 p-8 md:p-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#3b82f6_0%,transparent_50%)] opacity-10" />
        
        <div className="max-w-5xl mx-auto text-center space-y-16 relative z-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">
              How it Works
            </div>
            <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter">Dual Currency System</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Two ways to play, double the fun. Understand how CoinKrazy AI works and how you can win real prizes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="p-10 bg-slate-950/80 rounded-[40px] border border-yellow-500/10 text-left space-y-6 relative overflow-hidden group hover:border-yellow-500/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 blur-[80px] group-hover:bg-yellow-500/10 transition-colors" />
              <div className="w-16 h-16 rounded-[24px] bg-yellow-500/10 flex items-center justify-center">
                <Coins className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Gold Coins (GC)</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Gold Coins are used for social play. They have no monetary value and cannot be redeemed. 
                  Get them for free via daily bonuses, tournaments, and social tasks!
                </p>
              </div>
              <ul className="space-y-3">
                {['Free to play forever', 'Unlimited social fun', 'Earn via daily login'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                Free to Play <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            <div className="p-10 bg-slate-950/80 rounded-[40px] border border-emerald-500/10 text-left space-y-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] group-hover:bg-emerald-500/10 transition-colors" />
              <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Sweeps Coins (SC)</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Sweeps Coins can be used to enter sweepstakes games. 
                  Winnings from Sweeps Coins play can be redeemed for real prizes! 
                  SC can never be purchased—they are only given as free bonuses.
                </p>
              </div>
              <ul className="space-y-3">
                {['Redeemable for real prizes', 'Earn as free bonus', 'Secure redemptions'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-4 flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                Redeemable <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Recipe 3: Hardware */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Users, label: 'Active Players', value: '12,482', color: 'text-blue-500', trend: '+12%' },
          { icon: Trophy, label: 'Total Payouts', value: '850.4M', color: 'text-yellow-500', trend: '+5.4%' },
          { icon: Zap, label: 'Daily Bonuses', value: '5,291', color: 'text-emerald-500', trend: '+22%' },
        ].map((stat, i) => (
          <Card key={i} className="relative p-10 bg-slate-900/40 border-white/5 overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-24 h-24" />
            </div>
            <div className="relative z-10 space-y-6">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.color.replace('text', 'bg') + '/10')}>
                <stat.icon className={cn("w-7 h-7", stat.color)} />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <div className="text-5xl font-black text-white tracking-tighter">{stat.value}</div>
                  <div className="text-xs font-bold text-emerald-500">{stat.trend}</div>
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">{stat.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
