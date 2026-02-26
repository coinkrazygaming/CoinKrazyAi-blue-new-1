import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Pause, Play, Search, Gift, Clock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Bonus {
  id: number;
  name: string;
  type: string;
  description: string;
  code: string;
  reward_gc: number;
  reward_sc: number;
  min_deposit: number;
  wagering_requirement: number;
  game_eligibility: string;
  max_win: number;
  expiration_days: number;
  status: string;
  created_at: string;
}

export const BonusManager: React.FC = () => {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBonus, setEditingBonus] = useState<Partial<Bonus> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBonuses();
  }, []);

  const fetchBonuses = async () => {
    try {
      const response = await fetch('/api/admin/bonuses');
      const data = await response.json();
      setBonuses(data.bonuses);
    } catch (error) {
      console.error('Error fetching bonuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingBonus?.id ? 'PUT' : 'POST';
    const url = editingBonus?.id ? `/api/admin/bonuses/${editingBonus.id}` : '/api/admin/bonuses';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBonus),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setEditingBonus(null);
        fetchBonuses();
      }
    } catch (error) {
      console.error('Error saving bonus:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bonus?')) return;
    try {
      await fetch(`/api/admin/bonuses/${id}`, { method: 'DELETE' });
      fetchBonuses();
    } catch (error) {
      console.error('Error deleting bonus:', error);
    }
  };

  const handleToggleStatus = async (bonus: Bonus) => {
    const newStatus = bonus.status === 'active' ? 'paused' : 'active';
    try {
      await fetch(`/api/admin/bonuses/${bonus.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bonus, status: newStatus }),
      });
      fetchBonuses();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const filteredBonuses = bonuses.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-emerald-400" />
            Bonus Management
          </h2>
          <p className="text-zinc-400 text-sm">Create and manage player incentives and rewards.</p>
        </div>
        <button
          onClick={() => {
            setEditingBonus({
              type: 'deposit_match',
              reward_gc: 0,
              reward_sc: 0,
              min_deposit: 0,
              wagering_requirement: 0,
              game_eligibility: 'all',
              expiration_days: 7,
              status: 'active'
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Bonus
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Search bonuses by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredBonuses.map((bonus) => (
            <motion.div
              key={bonus.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  bonus.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {bonus.status.toUpperCase()}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingBonus(bonus);
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(bonus)}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  >
                    {bonus.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(bonus.id)}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{bonus.name}</h3>
              <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{bonus.description}</p>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Type</span>
                  <span className="text-zinc-300 capitalize">{bonus.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Reward</span>
                  <span className="text-emerald-400 font-medium">
                    {bonus.reward_gc > 0 && `${bonus.reward_gc.toLocaleString()} GC`}
                    {bonus.reward_gc > 0 && bonus.reward_sc > 0 && ' + '}
                    {bonus.reward_sc > 0 && `${bonus.reward_sc.toLocaleString()} SC`}
                  </span>
                </div>
                {bonus.code && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Code</span>
                    <span className="text-zinc-300 font-mono">{bonus.code}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {bonus.expiration_days} Days
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {bonus.wagering_requirement}x Wager
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <form onSubmit={handleSave} className="p-8">
              <h3 className="text-xl font-bold text-white mb-6">
                {editingBonus?.id ? 'Edit Bonus' : 'Create New Bonus'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Bonus Name</label>
                  <input
                    type="text"
                    required
                    value={editingBonus?.name || ''}
                    onChange={e => setEditingBonus({ ...editingBonus, name: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Type</label>
                  <select
                    value={editingBonus?.type || 'deposit_match'}
                    onChange={e => setEditingBonus({ ...editingBonus, type: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="deposit_match">Deposit Match</option>
                    <option value="free_spins">Free Spins</option>
                    <option value="cashback">Cashback</option>
                    <option value="loyalty">Loyalty Reward</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Description</label>
                  <textarea
                    value={editingBonus?.description || ''}
                    onChange={e => setEditingBonus({ ...editingBonus, description: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white h-24 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Promo Code (Optional)</label>
                  <input
                    type="text"
                    value={editingBonus?.code || ''}
                    onChange={e => setEditingBonus({ ...editingBonus, code: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Min Deposit (SC)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingBonus?.min_deposit || 0}
                    onChange={e => setEditingBonus({ ...editingBonus, min_deposit: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Reward GC</label>
                  <input
                    type="number"
                    value={editingBonus?.reward_gc || 0}
                    onChange={e => setEditingBonus({ ...editingBonus, reward_gc: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Reward SC</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingBonus?.reward_sc || 0}
                    onChange={e => setEditingBonus({ ...editingBonus, reward_sc: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Wagering Requirement (x)</label>
                  <input
                    type="number"
                    value={editingBonus?.wagering_requirement || 0}
                    onChange={e => setEditingBonus({ ...editingBonus, wagering_requirement: parseFloat(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Expiration (Days)</label>
                  <input
                    type="number"
                    value={editingBonus?.expiration_days || 7}
                    onChange={e => setEditingBonus({ ...editingBonus, expiration_days: parseInt(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 rounded-xl text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-bold"
                >
                  {editingBonus?.id ? 'Update Bonus' : 'Create Bonus'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
