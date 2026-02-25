import React, { useState } from 'react';
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
  Edit2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function AdminPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rainAmountGC, setRainAmountGC] = useState('1000');
  const [rainAmountSC, setRainAmountSC] = useState('1');

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Unauthorized');
      return res.json();
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
    { id: 'users', label: 'Users & KYC', icon: Users },
    { id: 'redemptions', label: 'Redemptions', icon: DollarSign },
    { id: 'store', label: 'Store & Packages', icon: ShoppingBag },
    { id: 'settings', label: 'Settings', icon: Settings },
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Signup Bonus (GC)</label>
                    <input 
                      name="signup_bonus_gc" 
                      type="number"
                      defaultValue={settings.signup_bonus_gc} 
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Signup Bonus (SC)</label>
                    <input 
                      name="signup_bonus_sc" 
                      type="number"
                      defaultValue={settings.signup_bonus_sc} 
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Redemption Fee ($)</label>
                    <input 
                      name="redemption_fee" 
                      type="number"
                      defaultValue={settings.redemption_fee} 
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Min Redemption (SC)</label>
                    <input 
                      name="min_redemption_sc" 
                      type="number"
                      defaultValue={settings.min_redemption_sc} 
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                    />
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
    </div>
  );
}
