import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  Zap, 
  RotateCcw, 
  Trophy, 
  Info,
  Loader2,
  ChevronLeft
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣'];

import GameChat from '../../components/GameChat';

export default function Slots() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [betAmount, setBetAmount] = React.useState(10);
  const [currency, setCurrency] = React.useState<'gc' | 'sc'>('gc');
  const [reels, setReels] = React.useState([0, 0, 0]);
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<any>(null);

  const { data: gamesData } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await fetch('/api/games');
      return res.json();
    }
  });

  const game = gamesData?.games?.find((g: any) => g.slug === slug);

  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/games/slots/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          betAmount,
          currency
        })
      });
      return res.json();
    },
    onSuccess: (data) => {
      setLastResult(data);
      setReels(data.reels);
      refreshUser();
      setTimeout(() => setIsSpinning(false), 1000);
    },
    onError: () => {
      setIsSpinning(false);
    }
  });

  const handleSpin = () => {
    if (isSpinning || !game) return;
    setIsSpinning(true);
    setLastResult(null);
    spinMutation.mutate();
  };

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

      <div className="relative">
        <Card className="bg-slate-900 border-white/10 p-8 md:p-12 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
          <div className="flex justify-center gap-4 mb-12">
            {reels.map((symbolIdx, i) => (
              <motion.div
                key={i}
                animate={isSpinning ? {
                  y: [0, -10, 10, 0],
                  transition: { repeat: Infinity, duration: 0.1 }
                } : { 
                  y: [0, 5, 0],
                  transition: { duration: 0.2, delay: i * 0.1 }
                }}
                className="w-24 h-32 md:w-32 md:h-44 bg-slate-800 rounded-2xl border-2 border-white/5 flex items-center justify-center text-5xl md:text-7xl shadow-inner overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={isSpinning ? 'spinning' : symbolIdx}
                    initial={{ y: isSpinning ? 0 : 20, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.8 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 400, 
                      damping: 25,
                      delay: isSpinning ? 0 : i * 0.1
                    }}
                  >
                    {SYMBOLS[symbolIdx]}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bet Amount</label>
              <div className="flex items-center gap-2">
                {[10, 50, 100, 500].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-xs font-bold transition-all border",
                      betAmount === amount 
                        ? "bg-blue-600 border-blue-500 text-white" 
                        : "bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700"
                    )}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Button 
                size="lg" 
                className="w-full h-16 text-xl font-black uppercase tracking-tighter shadow-xl shadow-blue-600/20"
                onClick={handleSpin}
                disabled={isSpinning}
              >
                {isSpinning ? <Loader2 className="w-8 h-8 animate-spin" /> : 'Spin'}
              </Button>

              <AnimatePresence>
                {lastResult && !isSpinning && (
                  <motion.div
                    key="spin-again-button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex justify-center"
                  >
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleSpin}
                      className="gap-2 text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider"
                    >
                      <motion.div
                        animate={{ rotate: isSpinning ? 360 : 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </motion.div>
                      Spin Again
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Win</span>
                <Trophy className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="text-2xl font-black text-white">
                {lastResult?.winAmount > 0 ? `+${lastResult.winAmount.toLocaleString()}` : '0'}
                <span className="text-xs text-slate-500 ml-1 uppercase">{currency}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Win Overlay */}
        <AnimatePresence>
          {lastResult?.isWin && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <div className="bg-blue-600 text-white px-8 py-4 rounded-full shadow-2xl shadow-blue-600/50 border-4 border-white/20 animate-bounce">
                <h2 className="text-4xl font-black italic tracking-tighter">BIG WIN!</h2>
                <p className="text-center font-bold">+{lastResult.winAmount} {currency.toUpperCase()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-white">How to Play</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• Select your preferred currency (GC or SC).</li>
            <li>• Choose your bet amount per spin.</li>
            <li>• Click SPIN to start the game.</li>
            <li>• Match 3 symbols to win a multiplier!</li>
            <li>• 7️⃣ is the highest paying symbol.</li>
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-white">Game Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Return to Player (RTP)</span>
              <span className="text-sm font-bold text-emerald-500">{game.rtp}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Volatility</span>
              <span className="text-sm font-bold text-orange-500">Medium</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Max Win</span>
              <span className="text-sm font-bold text-white">500x</span>
            </div>
          </div>
        </Card>
      </div>
      {/* Game Chat */}
      <GameChat gameSlug={slug || 'krazy-slots'} />
    </div>
  );
}
