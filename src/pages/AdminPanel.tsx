import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Settings,
  DollarSign,
  Activity,
  ShieldAlert,
  Save,
  CreditCard,
  ShoppingBag,
  CloudRain,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Edit2,
  Bot,
  MessageSquare,
  FileText,
  Plus,
  Ticket,
  Share2,
  Layers,
  Bell,
  Gamepad2,
  Megaphone,
  HelpCircle,
  Gift
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';

import ScratchAndPullTabsAdmin from './ScratchAndPullTabsAdmin';
import AdminNotifications from '../components/admin/AdminNotifications';
import ManageGames from '../components/admin/ManageGames';
import SocialManager from '../components/admin/SocialManager';
import AiGameBuilder from '../components/admin/AiGameBuilder';
import { BonusManager } from '../components/BonusManager';
import { CommunityManager } from '../components/CommunityManager';

export default function AdminPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [rainAmountGC, setRainAmountGC] = useState('1000');
  const [rainAmountSC, setRainAmountSC] = useState('1');

  // AI State
  const [selectedAiChat, setSelectedAiChat] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Unauthorized');
      return res.json();
    }
  });

  // Fetch AI Employees
  const { data: aiEmployees } = useQuery({
    queryKey: ['ai-employees'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ai/employees');
      return res.json();
    },
    enabled: activeTab === 'ai-manager' || activeTab === 'ai-employees'
  });

  // Fetch AI Logs
  const { data: aiLogs } = useQuery({
    queryKey: ['ai-logs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ai/logs');
      return res.json();
    },
    enabled: activeTab === 'ai-manager'
  });

  // Fetch AI Chat
  const { data: aiChatHistory } = useQuery({
    queryKey: ['ai-chat', selectedAiChat?.id],
    queryFn: async () => {
      if (!selectedAiChat) return { messages: [] };
      const res = await fetch(`/api/admin/ai/chat/${selectedAiChat.id}`);
      return res.json();
    },
    enabled: !!selectedAiChat,
    refetchInterval: 3000
  });

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChatHistory]);

  // AI Mutations
  const sendAiMessageMutation = useMutation({
    mutationFn: async ({ employeeId, message }: { employeeId: number, message: string }) => {
      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, message })
      });
      return res.json();
    },
    onSuccess: () => {
      setChatMessage('');
      queryClient.invalidateQueries({ queryKey: ['ai-chat', selectedAiChat?.id] });
    }
  });

  const generateReportsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/ai/generate-reports', { method: 'POST' });
      return res.json();
    },
    onSuccess: () => {
      alert('Reports generated! Check the logs.');
      queryClient.invalidateQueries({ queryKey: ['ai-logs'] });
    }
  });

  const createAiEmployeeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/ai/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      alert('AI Employee created!');
      queryClient.invalidateQueries({ queryKey: ['ai-employees'] });
    }
  });

  const updateAiLogMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await fetch(`/api/admin/ai/logs/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-logs'] });
    }
  });

  // Fetch Settings
  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      return res.json();
    }
  });

  // Fetch Users
  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users');
      return res.json();
    },
    enabled: activeTab === 'users'
  });

  // Fetch Redemptions
  const { data: redemptionsData } = useQuery({
    queryKey: ['admin-redemptions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/redemptions');
      return res.json();
    },
    enabled: activeTab === 'redemptions'
  });

  // Fetch Packages
  const { data: packagesData } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await fetch('/api/store/packages');
      return res.json();
    },
    enabled: activeTab === 'store'
  });

  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);

  // Mutations
  const updateAiEmployeeMutation = useMutation({
    mutationFn: async ({ id, current_task, status }: { id: number, current_task?: string, status?: string }) => {
      const res = await fetch(`/api/admin/ai/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_task, status })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-employees'] });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      return res.json();
    },
    onSuccess: () => {
      alert('Settings saved!');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    }
  });

  const savePackageMutation = useMutation({
    mutationFn: async (pkg: any) => {
      const url = pkg.id ? `/api/admin/packages/${pkg.id}` : '/api/admin/packages';
      const method = pkg.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pkg)
      });
      return res.json();
    },
    onSuccess: () => {
      alert('Package saved!');
      setIsEditingPackage(false);
      setEditingPackage(null);
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    }
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/packages/${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    }
  });

  const rainMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/rain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountGC: parseFloat(rainAmountGC), amountSC: parseFloat(rainAmountSC) })
      });
      return res.json();
    },
    onSuccess: () => alert('It rained!')
  });

  const verifyUserMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number, status: string }) => {
      const res = await fetch('/api/admin/kyc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status })
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  const processRedemptionMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number, status: string }) => {
      const res = await fetch('/api/admin/redemptions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status })
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-redemptions'] })
  });

  const adjustBalanceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      alert('Balance adjusted');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    updateSettingsMutation.mutate(data);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'games', label: 'Manage Games', icon: Gamepad2 },
    { id: 'social', label: 'Social & Marketing', icon: Megaphone },
    { id: 'users', label: 'Users & KYC', icon: Users },
    { id: 'redemptions', label: 'Redemptions', icon: DollarSign },
    { id: 'store', label: 'Store & Packages', icon: ShoppingBag },
    { id: 'ai-manager', label: 'AI Manager', icon: Bot },
    { id: 'ai-employees', label: 'AI Employees', icon: MessageSquare },
    { id: 'scratch-pull', label: 'Scratch & Pull', icon: Ticket },
    { id: 'bonuses', label: 'Bonuses', icon: Gift },
    { id: 'community-moderation', label: 'Community', icon: ShieldAlert },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Admin Panel</h1>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "bg-slate-900 text-slate-500 hover:text-white hover:bg-slate-800"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'notifications' && <AdminNotifications />}
      {activeTab === 'games' && <ManageGames onOpenBuilder={(gameId) => { setActiveTab('game-builder'); setEditingGameId(gameId); }} />}
      {activeTab === 'game-builder' && <AiGameBuilder gameId={editingGameId} onClose={() => setActiveTab('games')} />}
      {activeTab === 'social' && <SocialManager />}
      
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-400 uppercase tracking-wider">Total Users</div>
                  <div className="text-3xl font-black text-white">{stats?.totalUsers || 0}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Total Wagered</div>
                  <div className="text-3xl font-black text-white">{stats?.totalWagered?.toLocaleString() || 0}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/10 border-purple-500/20">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-purple-400 uppercase tracking-wider">System Status</div>
                  <div className="text-3xl font-black text-white">Online</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Make it Rain */}
          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/20">
            <CardHeader>
              <h3 className="font-bold text-white flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-blue-400" />
                Make it Rain
              </h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="space-y-2 flex-1 w-full">
                  <label className="text-xs font-bold text-slate-500 uppercase">GC Amount</label>
                  <input 
                    type="number" 
                    value={rainAmountGC}
                    onChange={(e) => setRainAmountGC(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div className="space-y-2 flex-1 w-full">
                  <label className="text-xs font-bold text-slate-500 uppercase">SC Amount</label>
                  <input 
                    type="number" 
                    value={rainAmountSC}
                    onChange={(e) => setRainAmountSC(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <Button 
                  onClick={() => rainMutation.mutate()}
                  disabled={rainMutation.isPending}
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  Start Rain
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card className="animate-in fade-in duration-500">
          <CardHeader>
            <h3 className="font-bold text-white">User Management</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">User</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Balances</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">KYC Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersData?.users?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{u.username}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-yellow-500 font-bold">{u.gc_balance.toLocaleString()} GC</div>
                        <div className="text-xs text-emerald-500 font-bold">{u.sc_balance.toFixed(2)} SC</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          u.kyc_status === 'verified' ? "bg-emerald-500/10 text-emerald-500" :
                          u.kyc_status === 'pending' ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-slate-800 text-slate-500"
                        )}>
                          {u.kyc_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        {u.kyc_status !== 'verified' && (
                          <Button 
                            size="sm" 
                            className="h-7 text-xs bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
                            onClick={() => verifyUserMutation.mutate({ userId: u.id, status: 'verified' })}
                          >
                            Verify
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            const amount = prompt('Enter GC amount to add (negative to subtract):');
                            if (amount) adjustBalanceMutation.mutate({ userId: u.id, amountGC: parseFloat(amount), amountSC: 0 });
                          }}
                        >
                          Adj GC
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            const amount = prompt('Enter SC amount to add (negative to subtract):');
                            if (amount) adjustBalanceMutation.mutate({ userId: u.id, amountGC: 0, amountSC: parseFloat(amount) });
                          }}
                        >
                          Adj SC
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'redemptions' && (
        <Card className="animate-in fade-in duration-500">
          <CardHeader>
            <h3 className="font-bold text-white">Redemption Requests</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">User</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Payout</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {redemptionsData?.requests?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{r.username}</div>
                        <div className="text-xs text-slate-500">{r.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-white">{r.amount_sc.toFixed(2)} SC</td>
                      <td className="px-4 py-3 font-mono text-emerald-500 font-bold">${r.payout_amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-white capitalize">{r.payment_method}</div>
                        <div className="text-xs text-slate-500 font-mono">{r.payment_details}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          r.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" :
                          r.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-red-500/10 text-red-500"
                        )}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        {r.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              className="h-7 text-xs bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
                              onClick={() => processRedemptionMutation.mutate({ requestId: r.id, status: 'paid' })}
                            >
                              Pay
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-7 text-xs bg-red-500/20 text-red-500 hover:bg-red-500/30"
                              onClick={() => processRedemptionMutation.mutate({ requestId: r.id, status: 'rejected' })}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'store' && (
        <Card className="animate-in fade-in duration-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="font-bold text-white">Coin Packages</h3>
            {isEditingPackage && (
              <Button variant="ghost" size="sm" onClick={() => { setIsEditingPackage(false); setEditingPackage(null); }}>
                Cancel
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditingPackage ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  savePackageMutation.mutate({
                    id: editingPackage?.id,
                    name: formData.get('name'),
                    price: parseFloat(formData.get('price') as string),
                    gc_amount: parseInt(formData.get('gc_amount') as string),
                    sc_amount: parseFloat(formData.get('sc_amount') as string),
                    is_featured: formData.get('is_featured') === 'on'
                  });
                }}
                className="space-y-4 max-w-md"
              >
                <div>
                  <label className="text-sm font-medium text-slate-400">Package Name</label>
                  <input 
                    name="name" 
                    defaultValue={editingPackage?.name} 
                    required 
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400">Price ($)</label>
                    <input 
                      name="price" 
                      type="number" 
                      step="0.01" 
                      defaultValue={editingPackage?.price} 
                      required 
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">GC Amount</label>
                    <input 
                      name="gc_amount" 
                      type="number" 
                      defaultValue={editingPackage?.gc_amount} 
                      required 
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400">SC Amount</label>
                    <input 
                      name="sc_amount" 
                      type="number" 
                      step="0.01" 
                      defaultValue={editingPackage?.sc_amount} 
                      required 
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name="is_featured" 
                    defaultChecked={editingPackage?.is_featured} 
                    id="is_featured"
                  />
                  <label htmlFor="is_featured" className="text-sm text-slate-400">Featured Package</label>
                </div>
                <Button type="submit" disabled={savePackageMutation.isPending}>
                  {savePackageMutation.isPending ? 'Saving...' : 'Save Package'}
                </Button>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packagesData?.packages?.map((p: any) => (
                  <div key={p.id} className="p-4 bg-slate-900 rounded-xl border border-white/5 relative group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white">{p.name}</h4>
                      <span className="text-xs font-mono text-slate-500">{p.id}</span>
                    </div>
                    <div className="space-y-1 text-sm mb-4">
                      <div className="flex justify-between"><span className="text-slate-500">Price:</span> <span className="text-white">${p.price}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">GC:</span> <span className="text-yellow-500">{p.gc_amount.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">SC:</span> <span className="text-emerald-500">{p.sc_amount}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 text-xs"
                        onClick={() => { setEditingPackage(p); setIsEditingPackage(true); }}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                        onClick={() => {
                          if (confirm('Delete this package?')) deletePackageMutation.mutate(p.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                <div 
                  className="p-4 bg-slate-900/50 rounded-xl border border-dashed border-white/10 flex items-center justify-center cursor-pointer hover:bg-slate-900 transition-colors min-h-[180px]"
                  onClick={() => { setEditingPackage({}); setIsEditingPackage(true); }}
                >
                  <span className="text-sm font-bold text-slate-500">+ Add New Package</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'ai-manager' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  AI Employee Logs & Reports
                </h3>
                <Button 
                  size="sm" 
                  onClick={() => generateReportsMutation.mutate()}
                  disabled={generateReportsMutation.isPending}
                >
                  {generateReportsMutation.isPending ? 'Generating...' : 'Generate Daily Reports'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {aiLogs?.logs?.length === 0 && (
                    <div className="text-center py-12 text-slate-500 italic">
                      No reports or logs found.
                    </div>
                  )}
                  {aiLogs?.logs?.map((log: any) => (
                    <div key={log.id} className="p-4 bg-slate-900/50 border border-white/5 rounded-xl">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <img src={log.avatar_url} alt={log.employee_name} className="w-8 h-8 rounded-full bg-slate-800" />
                          <div>
                            <p className="text-sm font-bold text-white">{log.employee_name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{new Date(log.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          log.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" :
                          log.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                          "bg-red-500/10 text-red-500"
                        )}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed italic">"{log.content}"</p>
                      {log.status === 'pending' && (
                        <div className="flex gap-2 mt-4">
                          <Button 
                            size="sm" 
                            className="h-7 text-[10px] bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
                            onClick={() => updateAiLogMutation.mutate({ id: log.id, status: 'approved' })}
                          >
                            Approve Suggestion
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-7 text-[10px] bg-red-500/20 text-red-500 hover:bg-red-500/30"
                            onClick={() => updateAiLogMutation.mutate({ id: log.id, status: 'denied' })}
                          >
                            Deny
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" />
                  Create New AI Employee
                </h3>
              </CardHeader>
              <CardContent>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createAiEmployeeMutation.mutate({
                      name: formData.get('name'),
                      role: formData.get('role'),
                      description: formData.get('description')
                    });
                    (e.target as HTMLFormElement).reset();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
                    <input name="name" required className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. MarketingAi" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                    <input name="role" required className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="e.g. Social Media Manager" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description / Tasks</label>
                    <textarea name="description" required rows={4} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" placeholder="Describe what this AI should focus on..." />
                  </div>
                  <Button type="submit" className="w-full" disabled={createAiEmployeeMutation.isPending}>
                    {createAiEmployeeMutation.isPending ? 'Creating...' : 'Deploy AI Employee'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'ai-employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in duration-500 h-[700px]">
          {/* Employee List */}
          <Card className="lg:col-span-1 overflow-y-auto">
            <CardHeader>
              <h3 className="font-bold text-white">AI Staff</h3>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {aiEmployees?.employees?.map((emp: any) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedAiChat(emp)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                      selectedAiChat?.id === emp.id ? "bg-blue-600/10 border border-blue-500/20" : "hover:bg-white/5"
                    )}
                  >
                    <div className="relative">
                      <img src={emp.avatar_url} alt={emp.name} className="w-10 h-10 rounded-full bg-slate-800" />
                      <div className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#020617]",
                        emp.status === 'active' ? "bg-emerald-500" : "bg-slate-500"
                      )} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-white truncate">{emp.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{emp.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-3 flex flex-col">
            {selectedAiChat ? (
              <>
                <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={selectedAiChat.avatar_url} alt={selectedAiChat.name} className="w-10 h-10 rounded-full bg-slate-800" />
                    <div>
                      <h3 className="font-bold text-white">{selectedAiChat.name}</h3>
                      <p className="text-xs text-slate-500">{selectedAiChat.role}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Current Task</p>
                    <div className="flex items-center gap-2">
                      <input 
                        className="bg-slate-900 border border-white/5 rounded px-2 py-1 text-xs text-blue-400 italic focus:outline-none focus:border-blue-500/50 w-48"
                        defaultValue={selectedAiChat.current_task || ''}
                        onBlur={(e) => {
                          if (e.target.value !== selectedAiChat.current_task) {
                            updateAiEmployeeMutation.mutate({ id: selectedAiChat.id, current_task: e.target.value });
                          }
                        }}
                        placeholder="Assign a new task..."
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
                  {aiChatHistory?.messages?.map((msg: any) => (
                    <div key={msg.id} className={cn(
                      "flex flex-col max-w-[80%]",
                      msg.sender === 'admin' ? "ml-auto items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-3 rounded-2xl text-sm",
                        msg.sender === 'admin' ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none"
                      )}>
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 font-mono">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </CardContent>
                <div className="p-4 border-t border-white/5">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!chatMessage.trim()) return;
                      sendAiMessageMutation.mutate({ employeeId: selectedAiChat.id, message: chatMessage });
                    }}
                    className="flex gap-2"
                  >
                    <input 
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder={`Message ${selectedAiChat.name}...`}
                      className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                    <Button type="submit" disabled={sendAiMessageMutation.isPending}>
                      {sendAiMessageMutation.isPending ? '...' : 'Send'}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
                <Bot className="w-16 h-16 opacity-10" />
                <p className="font-medium italic">Select an AI Employee to start a private consultation</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'scratch-pull' && (
        <div className="animate-in fade-in duration-500">
          <ScratchAndPullTabsAdmin />
        </div>
      )}

      {activeTab === 'bonuses' && (
        <div className="animate-in fade-in duration-500">
          <BonusManager />
        </div>
      )}

      {activeTab === 'community-moderation' && (
        <div className="animate-in fade-in duration-500">
          <CommunityManager />
        </div>
      )}

      {activeTab === 'settings' && (
        <Card className="animate-in fade-in duration-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-white">Site Settings</h3>
            </div>
          </CardHeader>
          <CardContent>
            {settings && (
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Site Name</label>
                  <input 
                    name="site_name" 
                    defaultValue={settings.site_name} 
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Enable CashApp</label>
                    <select 
                      name="enable_cashapp" 
                      defaultValue={settings.enable_cashapp}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Enable Google Pay</label>
                    <select 
                      name="enable_googlepay" 
                      defaultValue={settings.enable_googlepay}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-blue-400" />
                      Social & Referral
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Referral Bonus (GC)</label>
                        <input 
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                          defaultValue={settings?.referral_bonus_gc}
                          onBlur={(e) => updateSettingsMutation.mutate({ referral_bonus_gc: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Referral Bonus (SC)</label>
                        <input 
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                          defaultValue={settings?.referral_bonus_sc}
                          onBlur={(e) => updateSettingsMutation.mutate({ referral_bonus_sc: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Share Template</label>
                        <textarea 
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                          rows={4}
                          defaultValue={settings?.social_share_template}
                          onBlur={(e) => updateSettingsMutation.mutate({ social_share_template: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      Game Settings
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Min Redemption SC</label>
                        <input 
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                          defaultValue={settings?.min_redemption_sc}
                          onBlur={(e) => updateSettingsMutation.mutate({ min_redemption_sc: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Redemption Fee ($)</label>
                        <input 
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                          defaultValue={settings?.redemption_fee}
                          onBlur={(e) => updateSettingsMutation.mutate({ redemption_fee: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-white/5">
                        <span className="text-sm text-slate-300">Enable Facebook Share</span>
                        <input type="checkbox" defaultChecked={settings?.enable_social_facebook === 'true'} onChange={(e) => updateSettingsMutation.mutate({ enable_social_facebook: e.target.checked.toString() })} />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-white/5">
                        <span className="text-sm text-slate-300">Enable Twitter Share</span>
                        <input type="checkbox" defaultChecked={settings?.enable_social_twitter === 'true'} onChange={(e) => updateSettingsMutation.mutate({ enable_social_twitter: e.target.checked.toString() })} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button type="submit" className="w-full gap-2" disabled={updateSettingsMutation.isPending}>
                  <Save className="w-4 h-4" /> Save Settings
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
      {activeTab === 'help' && (
        <Card className="animate-in fade-in duration-500">
          <CardHeader>
            <h3 className="font-bold text-white">Help & Documentation</h3>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <h4 id="ai-features">AI Features</h4>
            <p>Our platform is powered by advanced AI employees that handle various aspects of the site:</p>
            <ul>
              <li><strong>DevAi:</strong> Lead Game Developer. Can build new games from scratch or rebrand existing URLs. Handles the daily new games pipeline.</li>
              <li><strong>SocialAi:</strong> Marketing Manager. Generates social media campaigns, promotional emails, SMS, and player retention messages.</li>
              <li><strong>SecurityAi:</strong> Monitors site safety and detects anomalies.</li>
              <li><strong>PlayersAi:</strong> Assists with KYC and player support.</li>
              <li><strong>AdminAi:</strong> General assistant for site management.</li>
            </ul>
            <h4>AI Game Builder</h4>
            <p>Open the AI Game Builder to create new games or rebrand existing ones. You can chat naturally with DevAi to describe the game you want.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
