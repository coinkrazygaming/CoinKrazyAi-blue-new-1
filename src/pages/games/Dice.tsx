import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  RotateCcw, 
  Trophy, 
  Info,
  Loader2,
  ChevronLeft,
  Dices,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

import GameChat from '../../components/GameChat';

export default function Dice() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [betAmount, setBetAmount] = React.useState(10);
  const [currency, setCurrency] = React.useState<'gc' | 'sc'>('gc');
  const [target, setTarget] = React.useState(50);
  const [type, setType] = React.useState<'over' | 'under'>('over');
  const [lastRoll, setLastRoll] = React.useState<number | null>(null);
  const [isRolling, setIsRolling] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<any>(null);

  const { data: gamesData } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await fetch('/api/games');
      return res.json();
    }
  });

  const game = gamesData?.games?.find((g: any) => g.slug === slug);

  const rollMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/games/dice/roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          betAmount,
          currency,
          target,
          type
        })
      });
      return res.json();
    },
    onSuccess: (data) => {
      setLastResult(data);
      setLastRoll(data.roll);
      refreshUser();
      setTimeout(() => setIsRolling(false), 600);
    },
    onError: () => {
      setIsRolling(false);
    }
  });

  const handleRoll = () => {
    if (isRolling || !game) return;
    setIsRolling(true);
    setLastResult(null);
    rollMutation.mutate();
  };

  const winChance = type === 'over' ? (100 - target) : target;
  const multiplier = (99 / winChance).toFixed(4);

  if (!game) return <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/games')} className="gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to Lobby
        </Button>
        <div className="flex items-center gap-2">
          <Button 
            variant={currency === 'gc' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setCurrency('gc')}
            className={cn(currency === 'gc' && "bg-yellow-600 hover:bg-yellow-700")}
          >
            GC
          </Button>
          <Button 
            variant={currency === 'sc' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setCurrency('sc')}
            className={cn(currency === 'sc' && "bg-emerald-600 hover:bg-emerald-700")}
          >
            SC
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <Card className="lg:col-span-1 p-6 space-y-6 bg-slate-900 border-white/10">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bet Amount</label>
            <div className="grid grid-cols-2 gap-2">
              {[10, 50, 100, 500].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className={cn(
                    "py-2 rounded-lg text-xs font-bold transition-all border",
                    betAmount === amount 
                      ? "bg-blue-600 border-blue-500 text-white" 
                      : "bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700"
                  )}
                >
                  {amount}
                </button>
              ))}
            </div>
            <input 
              type="number" 
              value={betAmount} 
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-white/5 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Roll Type</label>
            <div className="flex p-1 bg-slate-950 rounded-xl border border-white/5">
              <button 
                onClick={() => setType('over')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                  type === 'over' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                Roll Over
              </button>
              <button 
                onClick={() => setType('under')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                  type === 'under' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >
                Roll Under
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target: {target}</label>
              <span className="text-xs font-bold text-blue-500">{winChance.toFixed(2)}% Chance</span>
            </div>
            <input 
              type="range" 
              min="2" 
              max="98" 
              value={target} 
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="pt-4">
            <Button 
              size="lg" 
              className="w-full h-14 text-lg font-black uppercase tracking-tighter"
              onClick={handleRoll}
              disabled={isRolling}
            >
              {isRolling ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Roll Dice'}
            </Button>
          </div>
        </Card>

        {/* Game Area */}
        <Card className="lg:col-span-2 p-8 md:p-12 bg-slate-900 border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <Dices className="w-full h-full text-white" />
          </div>

          <div className="relative z-10 w-full max-w-md space-y-12">
            {/* Slider Visual */}
            <div className="relative h-12 bg-slate-800 rounded-full border-4 border-slate-950 overflow-hidden">
              {/* Target Zone */}
              <div 
                className={cn(
                  "absolute h-full transition-all duration-300",
                  type === 'over' ? "bg-emerald-500/20 right-0" : "bg-emerald-500/20 left-0"
                )}
                style={{ width: `${winChance}%` }}
              />
              
              {/* Target Marker */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] z-20"
                style={{ left: `${target}%` }}
              />

              {/* Result Indicator */}
              <AnimatePresence>
                {lastRoll !== null && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-white shadow-xl z-30",
                      lastResult?.isWin ? "bg-emerald-500" : "bg-rose-500"
                    )}
                    style={{ left: `calc(${lastRoll}% - 16px)` }}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Roll Display */}
            <div className="text-center space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Result</div>
              <motion.div 
                key={lastRoll}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  "text-8xl font-black tracking-tighter italic",
                  lastResult?.isWin ? "text-emerald-500" : "text-white"
                )}
              >
                {isRolling ? '??' : (lastRoll !== null ? lastRoll.toFixed(2) : '00.00')}
              </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Multiplier</div>
                <div className="text-xl font-black text-white">{multiplier}x</div>
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5 text-center">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Win Amount</div>
                <div className="text-xl font-black text-emerald-500">
                  {lastResult?.winAmount > 0 ? `+${lastResult.winAmount.toFixed(2)}` : '0.00'}
                </div>
              </div>
            </div>
          </div>

          {/* Win Overlay */}
          <AnimatePresence>
            {lastResult?.isWin && !isRolling && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
              >
                <div className="bg-emerald-600 text-white px-8 py-4 rounded-full shadow-2xl shadow-emerald-600/50 border-4 border-white/20 animate-bounce">
                  <h2 className="text-4xl font-black italic tracking-tighter">WINNER!</h2>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-white">How to Play</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• Set your bet amount and preferred currency.</li>
            <li>• Adjust the target slider to change your win chance.</li>
            <li>• Choose "Roll Over" or "Roll Under" the target.</li>
            <li>• Click ROLL to see if you win!</li>
            <li>• Lower win chance means higher multipliers.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-white">Game Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Return to Player (RTP)</span>
              <span className="text-sm font-bold text-emerald-500">{game.rtp}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">House Edge</span>
              <span className="text-sm font-bold text-rose-500">{(100 - game.rtp).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Max Multiplier</span>
              <span className="text-sm font-bold text-white">49.5x</span>
            </div>
          </div>
        </Card>
      </div>
      {/* Game Chat */}
      <GameChat gameSlug={slug || 'neon-dice'} />
    </div>
  );
}
