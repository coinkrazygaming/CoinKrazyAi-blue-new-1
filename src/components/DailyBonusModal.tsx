import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Calendar, Star, X, CheckCircle2, Coins } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function DailyBonusModal() {
  const { user, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedData, setClaimedData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      const lastClaim = user.last_bonus_claim ? new Date(user.last_bonus_claim) : null;
      const now = new Date();
      
      // If never claimed or more than 24h ago
      if (!lastClaim || (now.getTime() - lastClaim.getTime()) >= 24 * 60 * 60 * 1000) {
        setIsOpen(true);
      }
    }
  }, [user?.last_bonus_claim]);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const res = await fetch('/api/auth/daily-bonus', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setClaimedData(data);
        await refreshUser();
      }
    } catch (error) {
      console.error('Failed to claim bonus:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isOpen || !user) return null;

  const streak = user.login_streak || 0;
  const days = [1, 2, 3, 4, 5, 6, 7];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10"
        >
          {/* Header */}
          <div className="p-8 pb-0 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <Gift className="w-8 h-8 text-emerald-400" />
                Daily Rewards
              </h2>
              <p className="text-slate-400 mt-2">
                Log in every day to increase your streak and earn bigger rewards!
              </p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <div className="p-8">
            {claimedData ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Reward Claimed!</h3>
                <p className="text-slate-400 mb-8">
                  You've received your daily bonus. Come back tomorrow for Day {claimedData.streak + 1}!
                </p>
                
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                    <div className="text-amber-400 font-bold text-xl">+{claimedData.rewardGc}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Gold Coins</div>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                    <div className="text-emerald-400 font-bold text-xl">+{claimedData.rewardSc}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Sweeps Coins</div>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all"
                >
                  Awesome!
                </button>
              </motion.div>
            ) : (
              <>
                {/* Streak Progress */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 mb-8">
                  {days.map((day) => {
                    const isCurrent = day === (streak % 7) + 1;
                    const isCompleted = day <= (streak % 7);
                    const isSpecial = day === 7;

                    return (
                      <div 
                        key={day}
                        className={cn(
                          "relative p-3 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all",
                          isCurrent ? "bg-emerald-500/10 border-emerald-500/50 scale-105 shadow-lg shadow-emerald-500/10" : 
                          isCompleted ? "bg-slate-800/30 border-emerald-500/20 opacity-50" :
                          "bg-slate-800/50 border-white/5"
                        )}
                      >
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Day {day}</span>
                        {isSpecial ? (
                          <Star className={cn("w-6 h-6", isCurrent ? "text-amber-400" : "text-slate-600")} />
                        ) : (
                          <Coins className={cn("w-5 h-5", isCurrent ? "text-emerald-400" : "text-slate-600")} />
                        )}
                        {isCompleted && (
                          <div className="absolute top-1 right-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-800/50 rounded-3xl p-6 border border-white/5 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-white font-bold">Current Streak</div>
                        <div className="text-slate-400 text-sm">{streak} Days</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500 text-xs uppercase tracking-wider">Next Reward</div>
                      <div className="text-emerald-400 font-bold">Day {(streak % 7) + 1}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className={cn(
                    "w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xl rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3",
                    isClaiming && "animate-pulse"
                  )}
                >
                  {isClaiming ? 'Claiming...' : 'Claim Daily Reward'}
                  {!isClaiming && <Gift className="w-6 h-6" />}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
