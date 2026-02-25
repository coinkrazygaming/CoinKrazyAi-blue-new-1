import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Ticket, 
  Layers, 
  Settings, 
  Activity, 
  TrendingUp, 
  Users, 
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { cn } from '../lib/utils';

export default function ScratchAndPullTabsAdmin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('inventory');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch Ticket Types
  const { data: ticketTypes, isLoading: loadingTypes } = useQuery({
    queryKey: ['admin-ticket-types'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tickets/types');
      return res.json();
    }
  });

  // Fetch Stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-ticket-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tickets/stats');
      return res.json();
    }
  });

  // Mutations
  const createTypeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/tickets/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-types'] });
      setIsCreating(false);
    }
  });

  const toggleTypeMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number, is_active: boolean }) => {
      const res = await fetch(`/api/admin/tickets/types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active })
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-ticket-types'] })
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    createTypeMutation.mutate({
      type: formData.get('type'),
      price_sc: parseFloat(formData.get('price_sc') as string),
      custom_name: formData.get('name'),
      custom_description: formData.get('description')
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Scratch & Pull Tabs</h1>
          <p className="text-slate-500">Manage your luck-based games and track performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create New Ticket
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Revenue</span>
            </div>
            <div className="text-2xl font-black text-white">{statsData?.stats?.total_revenue?.toFixed(2) || '0.00'} SC</div>
            <div className="text-xs text-slate-500 mt-1">All-time ticket sales</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Payouts</span>
            </div>
            <div className="text-2xl font-black text-white">{statsData?.stats?.total_payout?.toFixed(2) || '0.00'} SC</div>
            <div className="text-xs text-slate-500 mt-1">Total winnings claimed</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Net Profit</span>
            </div>
            <div className="text-2xl font-black text-white">{statsData?.stats?.net_profit?.toFixed(2) || '0.00'} SC</div>
            <div className="text-xs text-slate-500 mt-1">House edge earnings</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="w-5 h-5 text-orange-500" />
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Sold</span>
            </div>
            <div className="text-2xl font-black text-white">{statsData?.stats?.total_sold || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Total tickets revealed</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 border-b border-white/5">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "px-4 py-2 text-sm font-bold transition-colors relative",
            activeTab === 'inventory' ? "text-blue-500" : "text-slate-500 hover:text-white"
          )}
        >
          Inventory
          {activeTab === 'inventory' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "px-4 py-2 text-sm font-bold transition-colors relative",
            activeTab === 'analytics' ? "text-blue-500" : "text-slate-500 hover:text-white"
          )}
        >
          Analytics
          {activeTab === 'analytics' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ticketTypes?.types?.map((type: any) => (
            <Card key={type.id} className={cn("overflow-hidden group", !type.is_active && "opacity-60")}>
              <div className="aspect-video relative bg-slate-800">
                <img 
                  src={JSON.parse(type.theme_images || '[]')[0]} 
                  alt={type.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase",
                    type.type === 'scratch' ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
                  )}>
                    {type.type}
                  </span>
                  <button 
                    onClick={() => toggleTypeMutation.mutate({ id: type.id, is_active: !type.is_active })}
                    className="p-1.5 rounded bg-black/50 hover:bg-black/70 text-white transition-colors"
                  >
                    {type.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-white mb-1">{type.name}</h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{type.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-mono text-emerald-500 font-bold">{type.price_sc} SC</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Odds: 1/7</div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {isCreating && (
            <Card className="border-dashed border-blue-500/30 bg-blue-500/5">
              <CardHeader>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  New AI Generated Ticket
                </h3>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Game Type</label>
                    <select name="type" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                      <option value="scratch">Scratch Ticket</option>
                      <option value="pulltab">Pull Tab</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price (SC)</label>
                    <select name="price_sc" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                      <option value="0.50">0.50 SC</option>
                      <option value="1.00">1.00 SC</option>
                      <option value="2.00">2.00 SC</option>
                      <option value="5.00">5.00 SC</option>
                    </select>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                    <p className="text-[10px] text-slate-500 mb-2 italic">Leave name/description empty to let DevAi generate a theme!</p>
                    <div className="space-y-3">
                      <input name="name" placeholder="Theme Name (Optional)" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                      <textarea name="description" placeholder="Description (Optional)" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" rows={2} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={createTypeMutation.isPending}>
                      {createTypeMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Generate & Create'}
                    </Button>
                    <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="font-bold text-white">Top Winning Players</h3>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Player</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total Won</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {statsData?.topWinners?.map((winner: any, i: number) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="px-4 py-3 font-bold text-white">{winner.username.replace(/(?<=.{2}).(?=.{2})/g, '*')}</td>
                        <td className="px-4 py-3 font-mono text-emerald-500">{winner.total_won.toFixed(2)} SC</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">Verified</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
