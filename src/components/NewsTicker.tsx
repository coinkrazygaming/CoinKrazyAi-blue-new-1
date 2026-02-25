import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { 
  Trophy, 
  UserPlus, 
  Zap, 
  Gamepad2, 
  Star,
  TrendingUp,
  Tag
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function NewsTicker() {
  const { data } = useQuery({
    queryKey: ['ticker'],
    queryFn: async () => {
      const res = await fetch('/api/ticker');
      return res.json();
    },
    refetchInterval: 30000
  });

  if (!data) return null;

  const items = [
    // New Users
    ...(data.newUsers || []).map((u: any) => ({
      icon: UserPlus,
      text: `Welcome ${u.username}!`,
      color: 'text-blue-400'
    })),
    // Recent Wins
    ...(data.recentWins || []).map((w: any) => ({
      icon: Trophy,
      text: `${w.username} won ${w.win_amount.toFixed(2)} ${w.currency.toUpperCase()} in ${w.game_name}`,
      color: 'text-yellow-400'
    })),
    // Top Players
    ...(data.topPlayers || []).map((p: any, i: number) => ({
      icon: TrendingUp,
      text: `#${i+1} Leaderboard: ${p.username}`,
      color: 'text-emerald-400'
    })),
    // Achievements
    ...(data.latestAchievements || []).map((a: any) => ({
      icon: Star,
      text: `${a.username} unlocked ${a.achievement_name}`,
      color: 'text-purple-400'
    })),
    // Deals
    ...(data.deals || []).map((d: any) => ({
      icon: Tag,
      text: `${d.title}: ${d.description}`,
      color: 'text-rose-400'
    }))
  ];

  return (
    <div className="fixed top-16 left-0 right-0 h-8 bg-slate-950 border-b border-white/5 z-30 overflow-hidden flex items-center">
      <motion.div 
        className="flex items-center gap-12 whitespace-nowrap px-4"
        animate={{ x: [0, -2000] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-medium">
            <item.icon className={cn("w-3 h-3", item.color)} />
            <span className="text-slate-300">{item.text}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
