import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, Share2, Save, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import confetti from 'canvas-confetti';

interface ScratchTicketProps {
  purchaseId: number;
  ticketName: string;
  price: number;
  onComplete: (win: boolean, amount: number) => void;
  onClose: () => void;
}

export default function ScratchTicket({ purchaseId, ticketName, price, onComplete, onClose }: ScratchTicketProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [result, setResult] = useState<{ isWin: boolean; winAmount: number } | null>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [revealPercentage, setRevealPercentage] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with scratchable surface
    ctx.fillStyle = '#334155'; // slate-700
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some texture/pattern
    ctx.strokeStyle = '#475569'; // slate-600
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 10) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 10) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Add text
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2 + 10);
  }, []);

  const handleReveal = async () => {
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
    }
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();

    // Check reveal percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentPixels++;
    }
    
    const percentage = (transparentPixels / (pixels.length / 4)) * 100;
    setRevealPercentage(percentage);

    if (percentage > 60 && !isRevealed) {
      setIsRevealed(true);
      handleReveal();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isScratching) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    scratch(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = e.touches[0];
    scratch(touch.clientX - rect.left, touch.clientY - rect.top);
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

          <div className="relative aspect-[4/3] bg-slate-800 rounded-2xl overflow-hidden border border-white/5 group">
            {/* Result Layer */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              {result ? (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  {result.isWin ? (
                    <>
                      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-10 h-10 text-emerald-500" />
                      </div>
                      <h3 className="text-3xl font-black text-white mb-2">WINNER!</h3>
                      <p className="text-5xl font-black text-emerald-500 tracking-tighter">
                        {result.winAmount.toFixed(2)} <span className="text-2xl">SC</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-10 h-10 text-slate-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-400">BETTER LUCK NEXT TIME</h3>
                    </>
                  )}
                </motion.div>
              ) : (
                <div className="text-slate-600 font-bold text-xl">REVEALING...</div>
              )}
            </div>

            {/* Scratch Layer */}
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className={cn(
                "absolute inset-0 w-full h-full cursor-crosshair transition-opacity duration-500",
                isRevealed && "opacity-0 pointer-events-none"
              )}
              onMouseDown={() => setIsScratching(true)}
              onMouseUp={() => setIsScratching(false)}
              onMouseLeave={() => setIsScratching(false)}
              onMouseMove={handleMouseMove}
              onTouchStart={() => setIsScratching(true)}
              onTouchEnd={() => setIsScratching(false)}
              onTouchMove={handleTouchMove}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {!isRevealed ? (
              <p className="text-xs text-slate-500 animate-pulse">
                Scratch off at least 60% to reveal your prize!
              </p>
            ) : (
              <div className="flex gap-2">
                <Button className="flex-1" onClick={onClose}>
                  {result?.isWin ? 'Claim & Continue' : 'Try Again'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
