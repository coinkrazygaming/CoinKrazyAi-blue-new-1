import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Trophy, 
  Calendar, 
  Clock, 
  Coins, 
  Users, 
  ChevronRight,
  Medal,
  Swords,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function Tournaments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState<any>(null);

  const { data: tournamentsData, isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: async () => {
      const res = await fetch('/api/tournaments');
      return res.json();
    }
  });

  const { data: tournamentDetails } = useQuery({
    queryKey: ['tournament', selectedTournament?.id],
    queryFn: async () => {
      if (!selectedTournament) return null;
      const res = await fetch(`/api/tournaments/${selectedTournament.id}`);
      return res.json();
    },
    enabled: !!selectedTournament
  });

  const joinMutation = useMutation({
    mutationFn: async (tournamentId: number) => {
      const res = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament'] });
      alert('Joined tournament successfully!');
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  const formatDuration = (end: string) => {
    const diff = new Date(end).getTime() - new Date().getTime();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Tournaments</h1>
          <p className="text-slate-400">Compete for glory and massive prizes</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-xl border border-white/5">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-bold text-white">Total Prize Pool: </span>
          <span className="text-sm font-black text-emerald-500">1,000,000+ GC</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tournament List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500">Loading tournaments...</p>
            </div>
          ) : tournamentsData?.tournaments?.length > 0 ? (
            tournamentsData.tournaments.map((t: any) => (
              <div 
                key={t.id}
                onClick={() => setSelectedTournament(t)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border transition-all cursor-pointer",
                  selectedTournament?.id === t.id 
                    ? "bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/50" 
                    : "bg-slate-900/50 border-white/5 hover:border-white/10 hover:bg-slate-900"
                )}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                  {/* Icon/Image */}
                  <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-white/5">
                    {t.game_slug === 'krazy-slots' ? (
                      <span className="text-2xl">🎰</span>
                    ) : (
                      <span className="text-2xl">🎲</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white truncate">{t.name}</h3>
                      {t.status === 'active' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase border border-emerald-500/20 animate-pulse">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDuration(t.end_time)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        {t.participant_count} Players
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Swords className="w-3.5 h-3.5" />
                        {t.scoring_type.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Prize & Action */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prize Pool</div>
                      <div className="text-xl font-black text-yellow-500 flex items-center justify-end gap-1">
                        {t.prize_pool.toLocaleString()}
                        <span className="text-xs font-bold text-yellow-500/50">{t.currency.toUpperCase()}</span>
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-5 h-5 text-slate-600 transition-transform",
                      selectedTournament?.id === t.id && "rotate-90 text-blue-500"
                    )} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-white/5">
              <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No Active Tournaments</h3>
              <p className="text-slate-500">Check back later for upcoming events!</p>
            </div>
          )}
        </div>

        {/* Details Sidebar */}
        <div className="lg:col-span-1">
          {selectedTournament ? (
            <div className="sticky top-24 space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card className="overflow-hidden border-blue-500/20">
                <div className="h-32 bg-gradient-to-br from-blue-600/20 to-purple-600/20 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-white/10" />
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <h2 className="text-xl font-black text-white">{selectedTournament.name}</h2>
                    <p className="text-xs text-blue-200 font-medium">
                      {selectedTournament.game_slug === 'krazy-slots' ? 'Krazy Slots' : 'Neon Dice'}
                    </p>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Entry Fee</div>
                      <div className="text-sm font-bold text-white flex items-center gap-1">
                        {selectedTournament.entry_fee === 0 ? 'Free' : selectedTournament.entry_fee.toLocaleString()}
                        <span className="text-[10px] text-slate-500">{selectedTournament.currency.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Scoring</div>
                      <div className="text-xs font-bold text-white capitalize">
                        {selectedTournament.scoring_type.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {selectedTournament.is_joined ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Medal className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-emerald-400">You are registered!</div>
                        <div className="text-[10px] text-emerald-500/60">Good luck in the tournament</div>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      className="w-full h-12 text-lg font-bold shadow-lg shadow-blue-500/20"
                      onClick={() => joinMutation.mutate(selectedTournament.id)}
                      disabled={joinMutation.isPending || !user}
                    >
                      {joinMutation.isPending ? 'Joining...' : 'Join Tournament'}
                    </Button>
                  )}

                  {/* Leaderboard Preview */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Top Players</h3>
                    <div className="space-y-2">
                      {tournamentDetails?.participants?.length > 0 ? (
                        tournamentDetails.participants.slice(0, 5).map((p: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                i === 0 ? "bg-yellow-500 text-black" :
                                i === 1 ? "bg-slate-400 text-black" :
                                i === 2 ? "bg-orange-700 text-white" :
                                "bg-slate-800 text-slate-500"
                              )}>
                                {i + 1}
                              </div>
                              <span className="text-sm font-medium text-slate-300">{p.username}</span>
                            </div>
                            <span className="text-sm font-mono font-bold text-white">{p.score.toLocaleString()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-600 text-xs">
                          No participants yet. Be the first!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="hidden lg:flex h-full items-center justify-center p-8 border-2 border-dashed border-white/5 rounded-3xl bg-slate-900/20">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Select a tournament to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
