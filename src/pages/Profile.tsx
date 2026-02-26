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
  Gift
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
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import FriendsAndInvites from '../components/FriendsAndInvites';
import { PlayerBonuses } from '../components/PlayerBonuses';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [cashappTag, setCashappTag] = useState(user?.cashapp_tag || '');
  const [isEditingCashapp, setIsEditingCashapp] = useState(false);

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
      {/* Header / Banner */}
      <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden bg-slate-900 border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col md:flex-row md:items-end gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-800 border-4 border-slate-950 flex items-center justify-center shadow-2xl">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="w-full h-full rounded-3xl object-cover" />
            ) : (
              <User className="w-12 h-12 md:w-16 md:h-16 text-slate-500" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white">{user.username}</h1>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                {user.vip_status} VIP
              </span>
              {user.kyc_status === 'verified' && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" /> Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/5 pb-px overflow-x-auto no-scrollbar">
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
              "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap",
              activeTab === tab.id 
                ? "border-blue-500 text-blue-500 bg-blue-500/5" 
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {/* Left Column: Stats & Achievements */}
          <div className="lg:col-span-1 space-y-8">
            {/* Balances */}
            <Card className="p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Balances</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-yellow-500/60 uppercase">Gold Coins</div>
                      <div className="text-xl font-black text-white">{user.gc_balance.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-emerald-500/60 uppercase">Sweeps Coins</div>
                      <div className="text-xl font-black text-white">{user.sc_balance.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Achievements */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Achievements</h3>
                <span className="text-xs font-bold text-blue-500">
                  {achievementsData?.achievements?.length || 0} Unlocked
                </span>
              </div>
              <div className="space-y-4">
                {achievementsData?.achievements?.length > 0 ? (
                  achievementsData.achievements.map((ach: any) => (
                    <div key={ach.id} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-white/5">
                      <div className="text-2xl">{ach.icon}</div>
                      <div>
                        <div className="text-sm font-bold text-white">{ach.name}</div>
                        <div className="text-[10px] text-slate-500">{ach.description}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Medal className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">No achievements yet. Start playing to unlock!</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Activity & Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Wagering Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <h3 className="font-bold text-white">Wagering Activity</h3>
                </div>
                <div className="text-xs font-bold text-slate-500">Last 30 Days</div>
              </div>
              
              <div className="h-[300px] w-full">
                {historyLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
                  </div>
                ) : historyData?.history?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historyData.history}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorAmount)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600">
                    <TrendingUp className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm">No wagering data available yet.</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Activity Placeholder */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <History className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-white">Recent Sessions</h3>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Krazy Slots Session</div>
                        <div className="text-[10px] text-slate-500">2 hours ago</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-500">+450.00 GC</div>
                      <div className="text-[10px] text-slate-500">12 spins</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
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

    </div>
  );
}
