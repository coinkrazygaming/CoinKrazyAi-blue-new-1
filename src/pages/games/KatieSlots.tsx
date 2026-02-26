import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft,
  Loader2,
  Trophy,
  Share2,
  Rocket,
  Info,
  Zap,
  Star
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import GameChat from '../../components/GameChat';

const SPACE_SYMBOLS = ['🚀', '🌌', '🛰️', '👨‍🚀', '👽', '🪐', '🌠'];

export default function KatieSlots() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [betAmount, setBetAmount] = React.useState(0.01);
  const [reels, setReels] = React.useState([0, 0, 0]);
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<any>(null);
  const [showWinPopup, setShowWinPopup] = React.useState(false);

  const betMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch('/api/games/katie-slots/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount: amount })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to place bet');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setLastResult(data);
      // Wait for animation
      setTimeout(() => {
        setIsSpinning(false);
        setReels(data.reels);
        if (data.isWin) {
          setShowWinPopup(true);
        }
      }, 1500);
    },
    onError: (error: any) => {
      setIsSpinning(false);
      alert(error.message);
    }
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/games/katie-slots/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return res.json();
    },
    onSuccess: () => {
      setShowWinPopup(false);
      refreshUser();
    }
  });

  const handleSpin = () => {
    if (isSpinning || showWinPopup) return;
    if (user && user.sc_balance < betAmount) {
      alert('Insufficient SC balance');
      return;
    }
    setIsSpinning(true);
    setLastResult(null);
    betMutation.mutate(betAmount);
  };

  const handleShare = () => {
    const text = `I just won ${lastResult?.winAmount} SC on Katie Slots at PlayCoinKrazy.com! 🚀🌌 #CoinKrazy #Slots #BigWin`;
    const url = 'https://playcoinkrazy.com';
    
    // In a real app, this would open a social share dialog
    // For now, we'll just simulate it and then claim the win
    alert(`Sharing: "${text}"`);
    claimMutation.mutate();
  };

  const betOptions = [0.01, 0.05, 0.10, 0.25, 0.50, 1.00, 2.00, 5.00];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/games')} className="gap-2 text-slate-400 hover:text-white">
          <ChevronLeft className="w-4 h-4" /> Back to Lobby
        </Button>
        <div className="flex items-center gap-2 bg-slate-900/60 px-4 py-2 rounded-full border border-white/5">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-bold text-white">Katie Slots</span>
          <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded-full uppercase">Exclusive</span>
        </div>
      </div>

      <div className="relative">
        {/* Background Decorative Stars */}
        <div className="absolute -inset-20 overflow-hidden pointer-events-none opacity-20">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.1 }}
              animate={{ opacity: [0.1, 0.5, 0.1] }}
              transition={{ duration: Math.random() * 3 + 2, repeat: Infinity }}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <Card className="bg-slate-950/80 border-blue-500/20 p-8 md:p-12 shadow-[0_0_80px_rgba(37,99,235,0.15)] backdrop-blur-sm relative overflow-hidden">
          {/* Animated Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          
          <div className="flex justify-center gap-4 mb-12">
            {reels.map((symbolIdx, i) => (
              <motion.div
                key={i}
                animate={isSpinning ? {
                  y: [0, -20, 20, 0],
                  transition: { repeat: Infinity, duration: 0.15 }
                } : { 
                  y: [0, 5, 0],
                  transition: { duration: 0.3, delay: i * 0.15 }
                }}
                className="w-24 h-32 md:w-32 md:h-44 bg-slate-900/80 rounded-2xl border-2 border-blue-500/10 flex items-center justify-center text-5xl md:text-7xl shadow-[inset_0_0_30px_rgba(37,99,235,0.1)] overflow-hidden relative"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={isSpinning ? `spinning-${i}` : symbolIdx}
                    initial={{ y: 50, opacity: 0, scale: 0.5 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -50, opacity: 0, scale: 0.5 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 20,
                      delay: isSpinning ? 0 : i * 0.1
                    }}
                  >
                    {isSpinning ? SPACE_SYMBOLS[Math.floor(Math.random() * SPACE_SYMBOLS.length)] : SPACE_SYMBOLS[symbolIdx]}
                  </motion.span>
                </AnimatePresence>
                {/* Reel Reflection */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Select Bet (SC)</label>
              <div className="grid grid-cols-4 gap-2">
                {betOptions.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    disabled={isSpinning}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold transition-all border",
                      betAmount === amount 
                        ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" 
                        : "bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800 disabled:opacity-50"
                    )}
                  >
                    {amount.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Button 
                size="lg" 
                className="w-full h-16 text-xl font-black uppercase tracking-tighter shadow-xl shadow-blue-600/30 bg-blue-600 hover:bg-blue-500 border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                onClick={handleSpin}
                disabled={isSpinning || showWinPopup}
              >
                {isSpinning ? <Loader2 className="w-8 h-8 animate-spin" /> : 'Launch'}
              </Button>
            </div>

            <div className="bg-slate-900/50 rounded-2xl p-4 border border-blue-500/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Win</span>
                <Rocket className="w-3 h-3 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-white flex items-baseline gap-1">
                {lastResult?.winAmount > 0 ? `+${lastResult.winAmount.toFixed(2)}` : '0.00'}
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">SC</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Win Popup Overlay */}
        <AnimatePresence>
          {showWinPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-slate-900 border-2 border-blue-500/30 rounded-3xl p-8 text-center shadow-[0_0_100px_rgba(37,99,235,0.3)] relative overflow-hidden"
              >
                {/* Confetti Animation Placeholder Effect */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        y: [-20, 400],
                        x: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                        rotate: [0, 360]
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                      className="absolute w-2 h-2 rounded-sm"
                      style={{ 
                        backgroundColor: ['#3b82f6', '#fbbf24', '#10b981', '#ef4444'][i % 4],
                        top: -20,
                        left: '50%'
                      }}
                    />
                  ))}
                </div>

                <div className="relative z-10 space-y-6">
                  <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto border-2 border-blue-500/20">
                    <Trophy className="w-10 h-10 text-blue-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">CONGRATS!</h2>
                    <p className="text-slate-400 font-medium">You won <span className="text-2xl font-black text-emerald-400">{lastResult?.winAmount.toFixed(2)} SC</span>!!</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      size="lg" 
                      onClick={() => claimMutation.mutate()}
                      disabled={claimMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-tight py-6 rounded-2xl"
                    >
                      {claimMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Claim Now & Continue'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={handleShare}
                      disabled={claimMutation.isPending}
                      className="border-white/10 hover:bg-white/5 text-slate-300 font-bold gap-2 py-6 rounded-2xl"
                    >
                      <Share2 className="w-4 h-4" /> Share your win on social media
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-slate-900/40 border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-white">Space Rules</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              Exclusive SC-only space adventure with higher RTP.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              Bet from 0.01 SC up to 5.00 SC per launch.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              Match 3 space symbols to win orbital multipliers.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              🚀 Rocket is the top-tier symbol for cosmic wins!
            </li>
          </ul>
        </Card>

        <Card className="p-6 bg-slate-900/40 border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-white">System Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-sm text-slate-500 uppercase tracking-widest text-[10px] font-bold">RTP</span>
              <span className="text-sm font-black text-emerald-500">97.0%</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-sm text-slate-500 uppercase tracking-widest text-[10px] font-bold">Volatility</span>
              <span className="text-sm font-black text-blue-400">Interstellar</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500 uppercase tracking-widest text-[10px] font-bold">Max Win</span>
              <span className="text-sm font-black text-white">500x</span>
            </div>
          </div>
        </Card>
      </div>

      <GameChat gameSlug="katie-slots" />
    </div>
  );
}
