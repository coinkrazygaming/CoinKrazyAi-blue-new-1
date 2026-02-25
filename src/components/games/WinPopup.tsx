import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Share2, Save, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import confetti from 'canvas-confetti';

interface WinPopupProps {
  purchaseId: number;
  ticketName: string;
  amount: number;
  referralCode: string;
  onClaim: () => void;
  onSave: () => void;
  onClose: () => void;
}

export default function WinPopup({ purchaseId, ticketName, amount, referralCode, onClaim, onSave, onClose }: WinPopupProps) {
  const [isClaimed, setIsClaimed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleClaim = async () => {
    try {
      const res = await fetch('/api/tickets/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId })
      });
      if (res.ok) {
        setIsClaimed(true);
        onClaim();
        setTimeout(onClose, 1500);
      }
    } catch (error) {
      console.error('Claim error:', error);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/tickets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId })
      });
      if (res.ok) {
        setIsSaved(true);
        onSave();
        setTimeout(onClose, 1500);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook') => {
    const text = `Just won ${amount.toFixed(2)} SC on PlayCoinKrazy.com playing ${ticketName}! 🔥 Come play with me and use my referral code ${referralCode} for 1000 GC + 1 SC bonus when you sign up! → https://playcoinkrazy.com/register?ref=${referralCode}`;
    const url = `https://playcoinkrazy.com/register?ref=${referralCode}`;
    
    let shareUrl = '';
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)] relative"
      >
        <div className="p-8 text-center">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <Trophy className="w-12 h-12 text-emerald-500" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl"
            />
          </div>

          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">BIG WIN!</h2>
          <p className="text-slate-400 mb-8">Congratulations! You won playing <span className="text-white font-bold">{ticketName}</span></p>

          <div className="bg-slate-800/50 rounded-3xl p-8 mb-8 border border-white/5">
            <span className="text-7xl font-black text-emerald-500 tracking-tighter tabular-nums">
              {amount.toFixed(2)}
            </span>
            <span className="text-2xl font-bold text-emerald-600 ml-2">SC</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button 
              size="lg" 
              className="h-16 text-lg bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
              onClick={handleClaim}
              disabled={isClaimed || isSaved}
            >
              {isClaimed ? <><CheckCircle className="w-6 h-6 mr-2" /> Claimed!</> : 'Claim Now'}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="secondary" 
                size="lg" 
                className="h-14"
                onClick={() => handleShare('twitter')}
              >
                <Share2 className="w-5 h-5 mr-2" /> Share
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-14"
                onClick={handleSave}
                disabled={isClaimed || isSaved}
              >
                {isSaved ? <><CheckCircle className="w-5 h-5 mr-2" /> Saved!</> : <><Save className="w-5 h-5 mr-2" /> Save for Later</>}
              </Button>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="mt-6 text-sm text-slate-500 hover:text-white transition-colors"
          >
            Close & Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}
