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
  ChevronLeft,
  Shield,
  Star
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import GameChat from '../../components/GameChat';
import EgyptWinPopup from '../../components/games/EgyptWinPopup';

const SYMBOLS = ['🏺', '⚖️', '👁️', '🦂', '🐈', '🔱', '☀️'];

export default function FourEgyptPots() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [betAmount, setBetAmount] = React.useState(0.20);
  const [reels, setReels] = React.useState([0, 0, 0, 0, 0]);
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<any>(null);
  const [showWinPopup, setShowWinPopup] = React.useState(false);

  const { data: gamesData } = useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await fetch('/api/games');
      return res.json();
    }
  });

  const game = gamesData?.games?.find((g: any) => g.slug === '4egypt-pots');

  const spinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/games/4egypt-pots/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betAmount
        })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      setLastResult(data);
      setReels(data.reels);
      refreshUser();
      setTimeout(() => {
        setIsSpinning(false);
        if (data.isWin) {
          setShowWinPopup(true);
        }
      }, 1500);
    },
    onError: (err: any) => {
      setIsSpinning(false);
      alert(err.message || 'Error spinning');
    }
  });

  const handleSpin = () => {
    if (isSpinning || !game) return;
    if (user && user.sc_balance < betAmount) {
      alert('Insufficient SC balance');
      return;
    }
    setIsSpinning(true);
    setLastResult(null);
    spinMutation.mutate();
  };

  const betOptions = [0.01, 0.10, 0.20, 0.50, 1.00, 2.00, 5.00];

  if (!game) return <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/games')} className="gap-2 text-yellow-500 hover:text-yellow-400">
          <ChevronLeft className="w-4 h-4" /> Back to Lobby
        </Button>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-yellow-500/20 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Balance</span>
            <span className="text-yellow-500 font-black tracking-tighter">{user?.sc_balance?.toFixed(2)} SC</span>
          </div>
          <div className="text-xs font-black text-yellow-600/50 uppercase tracking-[0.2em] px-3">
            PlayCoinKrazy.com
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-yellow-500/5 pointer-events-none rounded-[3rem]" />
        
        <Card className="bg-slate-950 border-yellow-500/20 p-8 md:p-12 shadow-[0_0_100px_rgba(234,179,8,0.1)] relative overflow-hidden rounded-[3rem]">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full" />
          
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-700 italic tracking-tighter mb-1">
              4 POTS OF EGYPT
            </h1>
            <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.5em]">
              Powered by CoinKrazy Studios
            </p>
          </div>

          <div className="flex justify-center gap-2 md:gap-4 mb-12">
            {reels.map((symbolIdx, i) => (
              <div key={i} className="relative group">
                <motion.div
                  animate={isSpinning ? {
                    y: [0, -15, 15, 0],
                    transition: { repeat: Infinity, duration: 0.12, delay: i * 0.05 }
                  } : { 
                    scale: [1, 1.02, 1],
                    transition: { duration: 2, repeat: Infinity, delay: i * 0.2 }
                  }}
                  className="w-16 h-24 md:w-32 md:h-48 bg-slate-900 rounded-2xl border-2 border-yellow-500/10 flex items-center justify-center text-3xl md:text-6xl shadow-inner overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={isSpinning ? 'spinning' : symbolIdx}
                      initial={{ y: isSpinning ? 0 : 40, opacity: 0, scale: 0.5 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -40, opacity: 0, scale: 0.5 }}
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
                {/* Reel Frame Accent */}
                <div className="absolute -inset-1 border border-yellow-500/5 rounded-2xl pointer-events-none" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Bet</label>
                <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">Min 0.01 - Max 5.00</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {betOptions.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className={cn(
                      "py-2.5 rounded-xl text-[10px] font-black transition-all border uppercase tracking-tighter",
                      betAmount === amount 
                        ? "bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-500/20" 
                        : "bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800"
                    )}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button 
                className={cn(
                  "w-full h-20 md:h-24 rounded-[2rem] text-3xl font-black uppercase tracking-tighter transition-all relative overflow-hidden group",
                  isSpinning 
                    ? "bg-slate-800 text-slate-600 cursor-not-allowed" 
                    : "bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 text-black shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:shadow-[0_0_60px_rgba(234,179,8,0.5)] active:scale-95"
                )}
                onClick={handleSpin}
                disabled={isSpinning}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-3">
                  {isSpinning ? <Loader2 className="w-8 h-8 animate-spin" /> : 'SPIN'}
                </div>
              </button>
              
              <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                Win up to 10.00 SC
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-6 border border-yellow-500/10 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Win</span>
                <Trophy className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="text-4xl font-black text-white tracking-tighter tabular-nums">
                {lastResult?.winAmount > 0 ? lastResult.winAmount.toFixed(2) : '0.00'}
                <span className="text-sm text-yellow-600 ml-2 uppercase">SC</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Brand Watermark */}
        <div className="mt-8 flex justify-center items-center gap-8 opacity-20 pointer-events-none">
          <span className="text-xs font-black uppercase tracking-[0.5em] text-white">PlayCoinKrazy.com</span>
          <Shield className="w-4 h-4 text-white" />
          <span className="text-xs font-black uppercase tracking-[0.5em] text-white">Fair Play Guaranteed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-white/5 p-6 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Info className="w-5 h-5 text-yellow-500" />
            </div>
            <h3 className="font-black text-white uppercase tracking-tighter text-xl">Ancient Secrets</h3>
          </div>
          <ul className="space-y-3">
            {[
              'Match 3 or more symbols for a win',
              'Highest paying symbol is the Golden Sun Disk',
              'Min bet 0.01 SC / Max bet 5.00 SC',
              'Fairness verified by CoinKrazy Studios'
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="bg-slate-900/50 border-white/5 p-6 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="font-black text-white uppercase tracking-tighter text-xl">Game Statistics</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-sm font-bold text-slate-500 uppercase">RTP</span>
              <span className="text-lg font-black text-emerald-500">{game.rtp}%</span>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-sm font-bold text-slate-500 uppercase">Volatility</span>
              <span className="text-lg font-black text-orange-500 uppercase italic">High</span>
            </div>
          </div>
        </Card>
      </div>

      <GameChat gameSlug="4egypt-pots" />

      {showWinPopup && lastResult && (
        <EgyptWinPopup 
          amount={lastResult.winAmount}
          referralCode={user?.referral_code || ''}
          onClose={() => {
            setShowWinPopup(false);
          }}
        />
      )}
    </div>
  );
}
