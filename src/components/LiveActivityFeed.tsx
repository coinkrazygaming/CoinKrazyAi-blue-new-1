import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Trophy, Coins, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '../lib/utils';

interface Activity {
  username: string;
  avatar_url: string;
  game_id: string;
  win_amount: number;
  currency_type: 'GC' | 'SC';
  created_at: string;
}

export default function LiveActivityFeed() {
  const { data: activityData } = useQuery({
    queryKey: ['social-activity'],
    queryFn: async () => {
      const res = await fetch('/api/social/activity');
      return res.json();
    },
    refetchInterval: 5000 // Poll every 5 seconds
  });

  const activities = activityData?.activity || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-black text-white uppercase tracking-widest">Live Activity</h3>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase">Live</span>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
        <AnimatePresence initial={false}>
          {activities.map((act, i) => (
            <motion.div
              key={`${act.username}-${act.created_at}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 p-3 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-slate-800/50 transition-colors group"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                  {act.avatar_url ? (
                    <img src={act.avatar_url} alt={act.username} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-950 flex items-center justify-center border border-white/10">
                  <Trophy className="w-2 h-2 text-yellow-500" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white truncate">{act.username}</span>
                  <span className="text-[8px] text-slate-600 font-mono">
                    {new Date(act.created_at).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-slate-500">won in</span>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">{act.game_id.replace('-', ' ')}</span>
                </div>
              </div>

              <div className="text-right">
                <div className={cn(
                  "text-xs font-black tracking-tighter",
                  act.currency_type === 'SC' ? "text-emerald-500" : "text-yellow-500"
                )}>
                  +{act.win_amount.toLocaleString()} {act.currency_type}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
