import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import confetti from 'canvas-confetti';

interface PullTabProps {
  purchaseId: number;
  ticketName: string;
  price: number;
  onComplete: (win: boolean, amount: number) => void;
  onClose: () => void;
}

export default function PullTab({ purchaseId, ticketName, price, onComplete, onClose }: PullTabProps) {
  const [revealedTabs, setRevealedTabs] = useState<number[]>([]);
  const [result, setResult] = useState<{ isWin: boolean; winAmount: number } | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const handleReveal = async () => {
    if (isRevealing || result) return;
    setIsRevealing(true);
    try {
      const res = await fetch('/api/tickets/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId })
      });
      const data = await res.json();
      setResult(data);
      if (data.isWin) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      onComplete(data.isWin, data.winAmount);
    } catch (error) {
      console.error('Reveal error:', error);
    } finally {
      setIsRevealing(false);
    }
  };

  const toggleTab = (index: number) => {
    if (revealedTabs.includes(index)) return;
    if (revealedTabs.length === 0) {
      handleReveal();
    }
    setRevealedTabs([...revealedTabs, index]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="p-6 text-center">
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-1">{ticketName}</h2>
          <p className="text-sm text-slate-500 mb-6">Price: {price} SC</p>

          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative h-20 bg-slate-800 rounded-xl overflow-hidden border border-white/5">
                {/* Result Layer */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  {result ? (
                    <div className="flex items-center gap-4">
                      {result.isWin ? (
                        <div className="flex items-center gap-2">
                          <Trophy className="w-6 h-6 text-emerald-500" />
                          <span className="text-2xl font-black text-white">{(result.winAmount / 3).toFixed(2)} SC</span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-slate-600">TRY AGAIN</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-700 font-bold">???</div>
                  )}
                </div>

                {/* Tab Layer */}
                <motion.div 
                  initial={false}
                  animate={{ x: revealedTabs.includes(i) ? '100%' : '0%' }}
                  transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                  onClick={() => toggleTab(i)}
                  className="absolute inset-0 bg-slate-700 cursor-pointer flex items-center justify-between px-6 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-400">
                      {i + 1}
                    </div>
                    <span className="font-bold text-slate-300">PULL TO REVEAL</span>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-500 group-hover:translate-x-1 transition-transform" />
                </motion.div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            {revealedTabs.length < 3 ? (
              <p className="text-xs text-slate-500 animate-pulse">
                Pull all 3 tabs to see your total win!
              </p>
            ) : (
              <Button className="w-full" onClick={onClose}>
                {result?.isWin ? 'Claim & Continue' : 'Try Again'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
