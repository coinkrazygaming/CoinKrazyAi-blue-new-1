import React, { useState, useEffect } from 'react';
import { Gift, Clock, Shield, CheckCircle2, AlertCircle, ArrowRight, Star } from 'lucide-react';
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
}

interface PlayerBonus {
  id: number;
  bonus_id: number;
  name: string;
  description: string;
  type: string;
  reward_gc: number;
  reward_sc: number;
  status: string;
  wagering_progress: number;
  wagering_target: number;
  expires_at: string;
  claimed_at: string;
}

export const PlayerBonuses: React.FC = () => {
  const [availableBonuses, setAvailableBonuses] = useState<Bonus[]>([]);
  const [myBonuses, setMyBonuses] = useState<PlayerBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchBonuses();
  }, []);

  const fetchBonuses = async () => {
    try {
      const [availRes, myRes] = await Promise.all([
        fetch('/api/bonuses/available'),
        fetch('/api/bonuses/my')
      ]);
      const availData = await availRes.json();
      const myData = await myRes.json();
      setAvailableBonuses(availData.bonuses);
      setMyBonuses(myData.bonuses);
    } catch (error) {
      console.error('Error fetching bonuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (bonusId?: number, code?: string) => {
    setClaiming(true);
    setMessage(null);
    try {
      const response = await fetch('/api/bonuses/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonusId, code }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Bonus claimed successfully!' });
        setPromoCode('');
        fetchBonuses();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to claim bonus' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Star className="w-8 h-8 text-emerald-400 fill-emerald-400" />
            Bonuses & Rewards
          </h2>
          <p className="text-emerald-100/70 text-lg mb-6">
            Boost your balance with our exclusive rewards. Claim free spins, deposit matches, and more!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter Promo Code..."
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 bg-black/40 border border-emerald-500/30 rounded-xl px-4 py-3 text-white placeholder:text-emerald-100/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <button
              onClick={() => handleClaim(undefined, promoCode)}
              disabled={claiming || !promoCode}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              {claiming ? 'Claiming...' : 'Apply Code'}
            </button>
          </div>
          
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 flex items-center gap-2 text-sm font-medium ${
                message.type === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </motion.div>
          )}
        </div>
        
        <Gift className="absolute -right-8 -bottom-8 w-64 h-64 text-emerald-500/10 rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-400" />
            Available Bonuses
          </h3>
          <div className="space-y-4">
            {availableBonuses.map((bonus) => (
              <motion.div
                key={bonus.id}
                whileHover={{ scale: 1.01 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white mb-1">{bonus.name}</h4>
                  <p className="text-sm text-zinc-400 mb-3">{bonus.description}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      {bonus.wagering_requirement}x Wagering
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {bonus.expiration_days} Days
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center sm:items-end gap-3">
                  <div className="text-2xl font-black text-emerald-400">
                    {bonus.reward_sc > 0 ? `${bonus.reward_sc} SC` : `${bonus.reward_gc} GC`}
                  </div>
                  <button
                    onClick={() => handleClaim(bonus.id)}
                    disabled={claiming}
                    className="w-full sm:w-auto bg-zinc-800 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition-all group"
                  >
                    Claim Now
                    <ArrowRight className="w-4 h-4 inline-block ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
            {availableBonuses.length === 0 && (
              <div className="text-center py-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
                No active bonuses available right now. Check back soon!
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-zinc-400" />
            My Active Bonuses
          </h3>
          <div className="space-y-4">
            {myBonuses.filter(b => b.status === 'active').map((bonus) => (
              <div key={bonus.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-white">{bonus.name}</h4>
                    <p className="text-xs text-zinc-500">Claimed: {new Date(bonus.claimed_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold">
                      {bonus.reward_sc > 0 ? `${bonus.reward_sc} SC` : `${bonus.reward_gc} GC`}
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Active</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400 font-medium">Wagering Progress</span>
                    <span className="text-zinc-300">{Math.round((bonus.wagering_progress / bonus.wagering_target) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(bonus.wagering_progress / bonus.wagering_target) * 100}%` }}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>{bonus.wagering_progress.toLocaleString()} SC</span>
                    <span>Target: {bonus.wagering_target.toLocaleString()} SC</span>
                  </div>
                </div>

                {bonus.expires_at && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Expires in:</span>
                    <span className="text-amber-400 font-medium">
                      {Math.ceil((new Date(bonus.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} Days
                    </span>
                  </div>
                )}
              </div>
            ))}
            {myBonuses.filter(b => b.status === 'active').length === 0 && (
              <div className="text-center py-12 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl text-zinc-500">
                You don't have any active bonuses.
              </div>
            )}
          </div>
          
          {myBonuses.filter(b => b.status !== 'active').length > 0 && (
            <div className="pt-6">
              <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">History</h4>
              <div className="space-y-2">
                {myBonuses.filter(b => b.status !== 'active').slice(0, 5).map((bonus) => (
                  <div key={bonus.id} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-zinc-300">{bonus.name}</div>
                      <div className="text-[10px] text-zinc-500">{new Date(bonus.claimed_at).toLocaleDateString()}</div>
                    </div>
                    <div className={`text-xs font-bold uppercase ${
                      bonus.status === 'completed' ? 'text-emerald-500' : 'text-zinc-500'
                    }`}>
                      {bonus.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
