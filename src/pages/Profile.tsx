import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Users,
  Trophy, 
  TrendingUp, 
  History, 
  Settings, 
  ShieldCheck,
  Medal,
  Coins,
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Gift,
  Clock
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import FriendsAndInvites from '../components/FriendsAndInvites';
import { PlayerBonuses } from '../components/PlayerBonuses';
import AiRecommendations from '../components/AiRecommendations';
import AvatarCustomizer from '../components/AvatarCustomizer';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [cashappTag, setCashappTag] = useState(user?.cashapp_tag || '');
  const [isEditingCashapp, setIsEditingCashapp] = useState(false);
  const [isCustomizingAvatar, setIsCustomizingAvatar] = useState(false);

  const { data: achievementsData } = useQuery({
    queryKey: ['my-achievements'],
    queryFn: async () => {
      const res = await fetch('/api/achievements/my');
      return res.json();
    }
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['wagered-history'],
    queryFn: async () => {
      const res = await fetch('/api/stats/wagered-history');
      return res.json();
    }
  });

  const kycMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/user/kyc/request', { method: 'POST' });
      return res.json();
    },
    onSuccess: () => {
      alert('KYC verification requested!');
      refreshUser();
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/user/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      alert('Profile updated!');
      setIsEditingCashapp(false);
      refreshUser();
    }
  });

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header / Banner - Recipe 4: Dark Luxury */}
      <div className="relative h-64 md:h-80 rounded-[40px] overflow-hidden bg-slate-900 border border-white/5 group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col md:flex-row md:items-end gap-8 z-10">
          <div className="relative group/avatar">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] glass-surface border-4 border-slate-950 flex items-center justify-center shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 md:w-20 md:h-20 text-blue-500/40" />
              )}
            </div>
            <button 
              onClick={() => setIsCustomizingAvatar(true)}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center border-4 border-slate-950 shadow-lg cursor-pointer hover:scale-110 transition-transform"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-4">
              <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">{user.username}</h1>
              <div className="flex gap-2">
                <span className="px-4 py-1 rounded-full bg-blue-600 text-[10px] font-black text-white uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  {user.vip_status} VIP
                </span>
                {user.kyc_status === 'verified' && (
                  <span className="px-4 py-1 rounded-full glass-surface text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6 text-slate-400 text-sm font-bold">
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Joined {new Date(user.created_at || Date.now()).toLocaleDateString()}</span>
              <span className="flex items-center gap-2"><Users className="w-4 h-4" /> 12 Friends</span>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="flex gap-4 glass-surface p-2 rounded-[24px] overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'bonuses', label: 'Bonuses', icon: Gift },
          { id: 'friends', label: 'Friends & Invites', icon: Users },
          { id: 'security', label: 'Security & Verification', icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-3 px-8 py-4 text-sm font-black uppercase italic tracking-tighter transition-all rounded-2xl",
              activeTab === tab.id 
                ? "bg-blue-600 text-white shadow-lg" 
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Bento Grid Layout */}
          
          {/* Balances - Bento Large */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-8 space-y-8 bg-slate-900/40 border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Coins className="w-32 h-32" />
              </div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Vault Balances</h3>
              
              <div className="space-y-6">
                <div className="p-6 glass-surface rounded-[32px] group/item hover:border-yellow-500/30 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
                      <Coins className="w-6 h-6 text-yellow-500" />
                    </div>
                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Gold Coins</span>
                  </div>
                  <div className="text-4xl font-black text-white tracking-tighter text-glow-gold">{user.gc_balance.toLocaleString()}</div>
                  <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 w-[70%]" />
                  </div>
                </div>

                <div className="p-6 glass-surface rounded-[32px] group/item hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sweeps Coins</span>
                  </div>
                  <div className="text-4xl font-black text-white tracking-tighter text-glow-emerald">{user.sc_balance.toLocaleString()}</div>
                  <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[45%]" />
                  </div>
                </div>
              </div>

              <Link to="/wallet" className="block">
                <Button className="w-full h-14 font-black uppercase italic tracking-tighter">
                  Manage Funds
                </Button>
              </Link>
            </Card>

            {/* Quick Stats - Bento Small */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 bg-slate-900/40 border-white/5 flex flex-col items-center text-center space-y-2">
                <div className="text-2xl font-black text-white">124</div>
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Games Played</div>
              </Card>
              <Card className="p-6 bg-slate-900/40 border-white/5 flex flex-col items-center text-center space-y-2">
                <div className="text-2xl font-black text-white">12</div>
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Big Wins</div>
              </Card>
            </div>
          </div>

          {/* Activity Chart - Bento Extra Large */}
          <div className="lg:col-span-8 space-y-8">
            <Card className="p-8 bg-slate-900/40 border-white/5">
              <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Wagering Performance</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Your activity over the last 30 days</p>
                </div>
                <div className="flex gap-2">
                  {['7D', '30D', 'ALL'].map(p => (
                    <button key={p} className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black transition-all",
                      p === '30D' ? "bg-blue-600 text-white" : "text-slate-500 hover:text-white hover:bg-white/5"
                    )}>{p}</button>
                  ))}
                </div>
              </div>
              
              <div className="h-[350px] w-full">
                {historyLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : historyData?.history?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData.history}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#475569" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      />
                      <YAxis 
                        stroke="#475569" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#3b82f6" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorAmount)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700">
                    <TrendingUp className="w-16 h-16 mb-4 opacity-10" />
                    <p className="text-sm font-bold uppercase tracking-widest">No activity recorded yet</p>
                  </div>
                )}
              </div>
            </Card>

            {/* AI Recommendations */}
            <AiRecommendations />

            {/* Achievements & Recent Activity - Bento Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 bg-slate-900/40 border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Trophy Room</h3>
                  <Link to="/achievements" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">View All</Link>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className={cn(
                      "aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all hover:scale-110 cursor-help",
                      i <= 3 ? "glass-surface border-blue-500/30" : "bg-slate-950/50 border border-white/5 grayscale opacity-30"
                    )}>
                      {i === 1 ? '🎰' : i === 2 ? '🎲' : i === 3 ? '🔥' : '🔒'}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8 bg-slate-900/40 border-white/5">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Recent Wins</h3>
                  <History className="w-4 h-4 text-slate-500" />
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 glass-surface rounded-2xl group cursor-pointer hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center group-hover:rotate-6 transition-transform">
                          <Zap className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-white">Krazy Slots</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase">2h ago</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-500">+450.00 GC</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bonuses' && (
        <div className="animate-in fade-in duration-500">
          <PlayerBonuses />
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="animate-in fade-in duration-500">
          <FriendsAndInvites />
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
          {/* Verification Card */}
          <Card className="p-6 space-y-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Identity Verification</h3>
            
            <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    user.kyc_status === 'verified' ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-800 text-slate-500"
                  )}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-white">KYC Verification</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Status: {user.kyc_status}</p>
                  </div>
                </div>
                {user.kyc_status === 'verified' && <CheckCircle className="w-6 h-6 text-emerald-500" />}
              </div>
              
              <p className="text-sm text-slate-400">
                {user.kyc_status === 'verified' 
                  ? 'Your identity has been verified. You can now redeem Sweeps Coins for real prizes.' 
                  : user.kyc_status === 'pending'
                  ? 'Your verification request is currently being reviewed by our team.'
                  : 'Verify your identity to unlock prize redemptions and higher limits.'}
              </p>

              {user.kyc_status === 'unverified' && (
                <Button 
                  className="w-full" 
                  onClick={() => kycMutation.mutate()}
                  disabled={kycMutation.isPending}
                >
                  {kycMutation.isPending ? 'Processing...' : 'Start Verification'}
                </Button>
              )}
            </div>

            {/* CashApp Tag */}
            <div className="p-6 bg-slate-900/50 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-white">CashApp Payout Method</p>
                  <p className="text-xs text-slate-500">Used for prize redemptions</p>
                </div>
              </div>

              {isEditingCashapp ? (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={cashappTag}
                    onChange={(e) => setCashappTag(e.target.value)}
                    placeholder="$yourtag"
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                  <Button 
                    onClick={() => updateProfileMutation.mutate({ cashappTag })}
                    disabled={updateProfileMutation.isPending}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-white/5">
                  <span className="text-sm text-slate-300 font-mono">{user.cashapp_tag || 'Not set'}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs hover:bg-white/5"
                    onClick={() => setIsEditingCashapp(true)}
                  >
                    Change
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Account Security Card */}
          <Card className="p-6 space-y-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Account Security</h3>
            <div className="space-y-4">
              <div className="p-4 flex items-center justify-between border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Two-Factor Authentication</p>
                    <p className="text-[10px] text-slate-500">Add an extra layer of security</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="p-4 flex items-center justify-between border border-white/5 rounded-2xl opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                    <History className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Login History</p>
                    <p className="text-[10px] text-slate-500">Monitor account access</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Avatar Customizer Modal */}
      {isCustomizingAvatar && (
        <AvatarCustomizer onClose={() => setIsCustomizingAvatar(false)} />
      )}
    </div>
  );
}
