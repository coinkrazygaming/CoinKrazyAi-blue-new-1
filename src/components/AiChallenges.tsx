import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap, Trophy, Target, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface Challenge {
  id: number;
  title: string;
  description: string;
  requirement_type: string;
  requirement_value: number;
  reward_gc: number;
  reward_sc: number;
  difficulty: number;
  progress: number;
  status: string;
  expires_at: string;
}

export default function AiChallenges() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-challenges'],
    queryFn: async () => {
      const res = await fetch('/api/ai/challenges');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-4 glass-surface rounded-[40px] border border-white/5">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">LuckyAI is generating your daily challenges...</p>
      </div>
    );
  }

  const challenges = data?.challenges || [];

  if (challenges.length === 0) return null;

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center border border-emerald-500/20">
            <Target className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Daily Challenges</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Complete tasks to earn extra GC & SC</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {challenges.map((challenge: Challenge, idx: number) => {
          const progressPercent = Math.min(100, (challenge.progress / challenge.requirement_value) * 100);
          
          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative glass-surface rounded-[40px] p-8 border border-white/5 hover:border-emerald-500/30 transition-all duration-500 overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] group-hover:bg-emerald-500/10 transition-colors" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                        challenge.difficulty >= 4 ? "bg-red-500/20 text-red-400" : 
                        challenge.difficulty >= 2 ? "bg-yellow-500/20 text-yellow-400" : 
                        "bg-emerald-500/20 text-emerald-400"
                      )}>
                        Difficulty {challenge.difficulty}/5
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase">
                        <Clock className="w-3 h-3" />
                        {new Date(challenge.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{challenge.title}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5">
                    <Zap className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>

                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  {challenge.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-emerald-500">{Math.floor(challenge.progress)} / {challenge.requirement_value}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    {challenge.reward_gc > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        </div>
                        <span className="text-xs font-black text-white">{challenge.reward_gc.toLocaleString()}</span>
                      </div>
                    )}
                    {challenge.reward_sc > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-xs font-black text-white">{challenge.reward_sc} SC</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 px-4 text-[10px] font-black uppercase italic tracking-tighter hover:bg-emerald-500/10 hover:text-emerald-500"
                  >
                    Details
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
