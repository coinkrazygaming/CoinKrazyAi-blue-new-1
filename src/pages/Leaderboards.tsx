import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, TrendingUp, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { cn } from '../lib/utils';

export default function Leaderboards() {
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboards'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboards');
      return res.json();
    }
  });

  const [activeTab, setActiveTab] = React.useState('wagered');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-black text-white">Leaderboards</h1>
      </div>

      <div className="flex gap-2 p-1 bg-slate-900 border border-white/5 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('wagered')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'wagered' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
          )}
        >
          Top Wagered
        </button>
        <button 
          onClick={() => setActiveTab('winners')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'winners' ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
          )}
        >
          Top Winners
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">Rank</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Player</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-600" />
                  </td>
                </tr>
              ) : (
                (activeTab === 'wagered' ? leaderboardData?.topWagered : leaderboardData?.topWinners)?.map((entry: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm",
                        idx === 0 ? "bg-yellow-500/20 text-yellow-500" :
                        idx === 1 ? "bg-slate-300/20 text-slate-300" :
                        idx === 2 ? "bg-orange-500/20 text-orange-500" :
                        "bg-slate-800 text-slate-500"
                      )}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                          <Users className="w-4 h-4 text-slate-500" />
                        </div>
                        <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{entry.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-mono font-bold text-slate-200">
                        {entry.score?.toLocaleString()}
                        <span className="text-[10px] text-slate-500 ml-1 uppercase">
                          {activeTab === 'wagered' ? 'GC' : 'SC'}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
