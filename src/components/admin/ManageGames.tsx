import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gamepad2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  ToggleLeft,
  ToggleRight,
  MoreVertical,
  Wand2,
  X,
  Save
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ManageGamesProps {
  onOpenBuilder: (gameId?: number) => void;
}

interface GameEditForm {
  id?: number;
  name: string;
  description: string;
  rtp: number;
  min_bet: number;
  max_bet: number;
}

export default function ManageGames({ onOpenBuilder }: ManageGamesProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingGame, setEditingGame] = useState<GameEditForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-games'],
    queryFn: async () => {
      const res = await fetch('/api/admin/games');
      if (!res.ok) throw new Error('Failed to fetch games');
      return res.json();
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number, enabled: boolean }) => {
      const res = await fetch(`/api/admin/games/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-games'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!confirm('Are you sure you want to delete this game?')) return;
      const res = await fetch(`/api/admin/games/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-games'] });
    }
  });

  const editMutation = useMutation({
    mutationFn: async (game: GameEditForm) => {
      const res = await fetch(`/api/admin/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game)
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-games'] });
      setEditingGame(null);
    }
  });

  const handleEditGame = (game: any) => {
    setEditingGame({
      id: game.id,
      name: game.name,
      description: game.description || '',
      rtp: game.rtp,
      min_bet: game.min_bet,
      max_bet: game.max_bet
    });
  };

  const handleSaveGame = async () => {
    if (!editingGame || !editingGame.name.trim()) return;
    setIsSaving(true);
    try {
      await editMutation.mutateAsync(editingGame);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-white">Loading games...</div>;

  const games = data?.games || [];
  const filteredGames = games.filter((g: any) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) || 
                         g.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'enabled' && g.enabled) || 
                         (filter === 'disabled' && !g.enabled);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-purple-500" />
          Manage Games
        </h2>
        <div className="flex gap-3">
          <Button 
            className="bg-purple-600 hover:bg-purple-500 text-white gap-2"
            onClick={() => onOpenBuilder()}
          >
            <Plus className="w-4 h-4" />
            Add New Game
          </Button>
          <Button 
            variant="outline" 
            className="border-white/10 text-white gap-2"
            onClick={() => onOpenBuilder()}
          >
            <Wand2 className="w-4 h-4 text-purple-400" />
            AI Game Builder
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900 border-white/5">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Search games..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className={cn("gap-2", filter === 'all' ? "bg-white/10 text-white" : "text-slate-400")}
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className={cn("gap-2", filter === 'enabled' ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400")}
                onClick={() => setFilter('enabled')}
              >
                Enabled
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className={cn("gap-2", filter === 'disabled' ? "bg-red-500/20 text-red-400" : "text-slate-400")}
                onClick={() => setFilter('disabled')}
              >
                Disabled
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game: any) => (
          <Card key={game.id} className="bg-slate-900 border-white/5 overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
            <div className="aspect-video relative overflow-hidden">
              <img 
                src={game.thumbnail_url || `https://picsum.photos/seed/${game.id}/400/225`} 
                alt={game.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              <div className="absolute top-2 right-2 flex gap-2">
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] font-bold uppercase border",
                  game.enabled 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                )}>
                  {game.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">{game.name}</h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{game.type}</p>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => toggleMutation.mutate({ id: game.id, enabled: !game.enabled })}
                    className={cn(
                      "p-1.5 rounded-lg border transition-colors",
                      game.enabled ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-950 border-white/10 text-slate-500"
                    )}
                  >
                    {game.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-slate-400 line-clamp-2 mb-4 h-10">
                {game.description || 'No description provided.'}
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-950 p-2 rounded-lg border border-white/5 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">RTP</p>
                  <p className="text-xs text-white font-mono">{game.rtp}%</p>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-white/5 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Min</p>
                  <p className="text-xs text-white font-mono">{game.min_bet}</p>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-white/5 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Max</p>
                  <p className="text-xs text-white font-mono">{game.max_bet}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/10 text-white gap-2 text-xs"
                  onClick={() => onOpenBuilder(game.id)}
                >
                  <RefreshCw className="w-3 h-3 text-purple-400" />
                  Rework AI
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white p-2 hover:bg-white/5"
                  onClick={() => handleEditGame(game)}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/20 text-red-400 p-2 hover:bg-red-500/10"
                  onClick={() => deleteMutation.mutate(game.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Game Modal */}
      <AnimatePresence>
        {editingGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-purple-400" />
                  Edit Game
                </h2>
                <button
                  onClick={() => setEditingGame(null)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Game Name</label>
                  <input
                    type="text"
                    value={editingGame.name}
                    onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white mb-2">Description</label>
                  <textarea
                    value={editingGame.description}
                    onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">RTP %</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                      value={editingGame.rtp}
                      onChange={(e) => setEditingGame({ ...editingGame, rtp: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Min Bet</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editingGame.min_bet}
                      onChange={(e) => setEditingGame({ ...editingGame, min_bet: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Max Bet</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editingGame.max_bet}
                      onChange={(e) => setEditingGame({ ...editingGame, max_bet: parseFloat(e.target.value) })}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-white/10">
                <Button
                  variant="outline"
                  className="flex-1 border-white/10 text-white"
                  onClick={() => setEditingGame(null)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white gap-2"
                  onClick={handleSaveGame}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
