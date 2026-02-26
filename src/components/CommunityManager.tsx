import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, UserX, UserCheck, Clock, MessageSquare, History, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModerationLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  reason: string;
  duration_minutes: number;
  moderator_id: string;
  created_at: string;
}

export const CommunityManager: React.FC = () => {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/community/moderation-logs');
      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (userId: number, action: 'unban' | 'unmute' | 'reset_offenses') => {
    if (!confirm(`Are you sure you want to ${action.replace('_', ' ')} this user?`)) return;
    try {
      const response = await fetch('/api/admin/community/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      if (response.ok) {
        fetchLogs();
      }
    } catch (error) {
      console.error('Error overriding moderation:', error);
    }
  };

  const filteredLogs = logs.filter(l => 
    l.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-400" />
            Community Moderation
          </h2>
          <p className="text-zinc-400 text-sm">SecurityAi automated moderation logs and admin overrides.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search logs by username, reason, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-800/50 text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">User</th>
                  <th className="px-6 py-4 font-medium">Action</th>
                  <th className="px-6 py-4 font-medium">Reason</th>
                  <th className="px-6 py-4 font-medium">Duration</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{log.username}</div>
                      <div className="text-xs text-zinc-500">ID: #{log.user_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        log.action === 'ban' ? 'bg-red-500/10 text-red-400' :
                        log.action === 'kick' ? 'bg-orange-500/10 text-orange-400' :
                        log.action === 'mute' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-zinc-300 max-w-xs truncate" title={log.reason}>
                        {log.reason}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {log.duration_minutes > 0 ? `${log.duration_minutes}m` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {log.action === 'ban' && (
                          <button
                            onClick={() => handleOverride(log.user_id, 'unban')}
                            className="p-2 hover:bg-zinc-700 rounded-lg text-emerald-400 transition-colors"
                            title="Unban User"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        {log.action === 'mute' && (
                          <button
                            onClick={() => handleOverride(log.user_id, 'unmute')}
                            className="p-2 hover:bg-zinc-700 rounded-lg text-emerald-400 transition-colors"
                            title="Unmute User"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOverride(log.user_id, 'reset_offenses')}
                          className="p-2 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors"
                          title="Reset Offenses"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredLogs.length === 0 && (
              <div className="p-12 text-center text-zinc-500">
                No moderation logs found.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              SecurityAi Rules
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700">
                <div className="text-xs font-bold text-zinc-400 uppercase mb-1">Zero Tolerance</div>
                <p className="text-sm text-zinc-300">Swearing, slurs, ads, spam, and off-topic promotions are automatically detected.</p>
              </div>
              <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700">
                <div className="text-xs font-bold text-zinc-400 uppercase mb-1">Enforcement</div>
                <ul className="text-sm text-zinc-300 space-y-2 mt-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    1st: 5-min Mute
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    2nd: 1-hour Kick
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    3rd: Permanent Ban
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Moderation Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total Actions</span>
                <span className="text-white font-medium">{logs.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Bans Issued</span>
                <span className="text-red-400 font-medium">
                  {logs.filter(l => l.action === 'ban').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Mutes Issued</span>
                <span className="text-amber-400 font-medium">
                  {logs.filter(l => l.action === 'mute').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
