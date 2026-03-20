import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Gift, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Coins,
  ArrowRight,
  Loader2,
  UserCheck,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ReferralStat {
  id: number;
  username: string;
  avatar_url: string;
  joined_at: string;
  total_wagered: number;
  milestones: string[];
}

interface ReferralSummary {
  referrals: ReferralStat[];
  total_earned_gc: number;
  total_earned_sc: number;
}

export const ReferralStats: React.FC = () => {
  const { data: stats, isLoading } = useQuery<ReferralSummary>({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const res = await fetch('/api/referrals/stats');
      return res.json();
    }
  });

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const milestones = [
    { id: 'signup', label: 'Signup', icon: UserCheck, reward: `${settings?.referral_bonus_sc || 1.00} SC` },
    { id: 'first_deposit', label: 'First Deposit', icon: Zap, reward: '5.00 SC' },
    { id: 'wager_100', label: 'Wager 100 SC', icon: Target, reward: '10.00 SC' },
    { id: 'wager_1000', label: 'Wager 1000 SC', icon: Trophy, reward: '50.00 SC' },
  ];

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/40 border-white/5 p-6 rounded-[32px] group hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Referrals</div>
              <div className="text-2xl font-black text-white tracking-tighter">{stats?.referrals.length || 0}</div>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/40 border-white/5 p-6 rounded-[32px] group hover:border-yellow-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Coins className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GC Earned</div>
              <div className="text-2xl font-black text-white tracking-tighter">{stats?.total_earned_gc.toLocaleString() || 0}</div>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/40 border-white/5 p-6 rounded-[32px] group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SC Earned</div>
              <div className="text-2xl font-black text-white tracking-tighter">{stats?.total_earned_sc.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tiered Rewards Guide */}
      <Card className="bg-slate-900/40 border-white/5 rounded-[32px] overflow-hidden">
        <CardHeader className="border-b border-white/5 py-6 px-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="font-black text-white uppercase italic tracking-tighter">Tiered Referral Rewards</h3>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {milestones.map((m, idx) => (
              <div key={m.id} className="relative flex flex-col items-center text-center space-y-4">
                {idx < milestones.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-[24px] bg-slate-800 border border-white/5 flex items-center justify-center relative z-10">
                  <m.icon className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs font-black text-white uppercase tracking-widest mb-1">{m.label}</div>
                  <div className="text-emerald-500 font-black text-sm tracking-tighter">+{m.reward}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral List */}
      <Card className="bg-slate-900/40 border-white/5 rounded-[32px] overflow-hidden">
        <CardHeader className="border-b border-white/5 py-6 px-8">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-500" />
            <h3 className="font-black text-white uppercase italic tracking-tighter">Your Referrals</h3>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {stats?.referrals && stats.referrals.length > 0 ? (
            <div className="divide-y divide-white/5">
              {stats.referrals.map((ref) => (
                <div key={ref.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.02] transition-all">
                  <div className="flex items-center gap-4">
                    <img 
                      src={ref.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ref.username}`} 
                      className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10"
                      alt=""
                    />
                    <div>
                      <div className="font-black text-white text-lg tracking-tight">{ref.username}</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Joined {new Date(ref.joined_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {milestones.map((m) => {
                      const isReached = ref.milestones.includes(m.id);
                      return (
                        <div 
                          key={m.id}
                          className={cn(
                            "px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                            isReached 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                              : "bg-slate-950/50 border-white/5 text-slate-600"
                          )}
                        >
                          {isReached ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {m.label}
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Total Wagered</div>
                    <div className="text-sm font-black text-white tracking-tighter">{ref.total_wagered.toFixed(2)} SC</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-slate-800/30 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-white/5">
                <Users className="w-10 h-10 text-slate-700" />
              </div>
              <h4 className="text-xl font-black text-white mb-2">No referrals yet</h4>
              <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                Share your referral link with friends to start earning tiered rewards!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
