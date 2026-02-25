import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, Sparkles, Trophy, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import ScratchTicket from '../components/games/ScratchTicket';
import WinPopup from '../components/games/WinPopup';

export default function ScratchTicketsPage() {
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [activePurchase, setActivePurchase] = useState<any>(null);
  const [winData, setWinData] = useState<any>(null);

  const { data: user } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      return res.json();
    }
  });

  const { data: ticketTypes, isLoading } = useQuery({
    queryKey: ['active-scratch-tickets'],
    queryFn: async () => {
      const res = await fetch('/api/tickets/active');
      const data = await res.json();
      return data.types.filter((t: any) => t.type === 'scratch');
    }
  });

  const purchaseMutation = useMutation({
    mutationFn: async (ticketTypeId: number) => {
      const res = await fetch('/api/tickets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketTypeId })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Purchase failed');
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      const type = ticketTypes.find((t: any) => t.id === variables);
      setActivePurchase({
        id: data.purchaseId,
        name: type.name,
        price: type.price_sc
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    }
  });

  const handleComplete = (isWin: boolean, amount: number) => {
    if (isWin) {
      setWinData({
        purchaseId: activePurchase.id,
        name: activePurchase.name,
        amount: amount
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Ticket className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Scratch Tickets</h1>
          </div>
          <p className="text-slate-500 max-w-xl">
            Choose your lucky ticket and scratch to reveal instant SC prizes! 1 in 7 tickets are winners.
          </p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex items-center gap-6">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Your Balance</p>
            <p className="text-xl font-black text-emerald-500">{user?.sc_balance?.toFixed(2) || '0.00'} SC</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ticketTypes?.map((ticket: any) => (
            <motion.div
              key={ticket.id}
              whileHover={{ y: -8 }}
              className="group"
            >
              <Card className="bg-slate-900 border-white/5 overflow-hidden relative">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <img 
                    src={JSON.parse(ticket.theme_images || '[]')[0]} 
                    alt={ticket.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    <span className="text-xs font-black text-emerald-500">{ticket.price_sc} SC</span>
                  </div>
                </div>
                <CardContent className="p-6 relative">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">{ticket.name}</h3>
                  <p className="text-sm text-slate-500 mb-6 line-clamp-2">{ticket.description}</p>
                  
                  <Button 
                    className="w-full h-12 text-sm font-black uppercase tracking-widest"
                    onClick={() => purchaseMutation.mutate(ticket.id)}
                    disabled={purchaseMutation.isPending}
                  >
                    {purchaseMutation.isPending ? 'Processing...' : 'Buy Ticket'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Active Game Overlay */}
      <AnimatePresence>
        {activePurchase && (
          <ScratchTicket
            purchaseId={activePurchase.id}
            ticketName={activePurchase.name}
            price={activePurchase.price}
            onComplete={handleComplete}
            onClose={() => setActivePurchase(null)}
          />
        )}
      </AnimatePresence>

      {/* Win Popup */}
      <AnimatePresence>
        {winData && (
          <WinPopup
            purchaseId={winData.purchaseId}
            ticketName={winData.name}
            amount={winData.amount}
            referralCode={user?.referral_code || ''}
            onClaim={() => queryClient.invalidateQueries({ queryKey: ['user-profile'] })}
            onSave={() => queryClient.invalidateQueries({ queryKey: ['user-profile'] })}
            onClose={() => setWinData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
