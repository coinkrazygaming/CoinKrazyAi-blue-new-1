import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Share2, CheckCircle, X, Facebook } from 'lucide-react';
import { Button } from '../ui/Button';
import confetti from 'canvas-confetti';

interface EgyptWinPopupProps {
  amount: number;
  referralCode: string;
  onClose: () => void;
}

export default function EgyptWinPopup({ amount, referralCode, onClose }: EgyptWinPopupProps) {
  const [isClaimed, setIsClaimed] = useState(false);

  React.useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#DAA520', '#B8860B', '#F0E68C']
    });
  }, []);

  const handleShare = () => {
    const text = `I just won ${amount.toFixed(2)} SC! playing on PlayCoinKrazy.com ! and display the players custom referral link https://playcoinkrazy.com/register?ref=${referralCode}`;
    const url = `https://playcoinkrazy.com/register?ref=${referralCode}`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-slate-900 border border-yellow-500/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.2)] relative"
      >
        <div className="p-8 text-center">
          <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <Trophy className="w-12 h-12 text-yellow-500" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl"
            />
          </div>

          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">CONGRATS!</h2>
          <p className="text-slate-400 mb-8">You won <span className="text-yellow-500 font-bold">{amount.toFixed(2)} SC</span>! Share with your friends!</p>

          <div className="bg-slate-800/50 rounded-3xl p-8 mb-8 border border-white/5">
            <span className="text-7xl font-black text-yellow-500 tracking-tighter tabular-nums">
              {amount.toFixed(2)}
            </span>
            <span className="text-2xl font-bold text-yellow-600 ml-2">SC</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button 
              size="lg" 
              className="h-16 text-lg bg-yellow-600 hover:bg-yellow-500 shadow-lg shadow-yellow-500/20 text-black font-black uppercase"
              onClick={onClose}
            >
              Claim & Continue
            </Button>

            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 border-white/10 hover:bg-white/5"
              onClick={handleShare}
            >
              <Facebook className="w-5 h-5 mr-2 text-blue-500 fill-blue-500" /> Share on Social!
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
