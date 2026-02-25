import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Wallet as WalletIcon, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard,
  CheckCircle2,
  Loader2,
  Coins,
  Zap,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function Wallet() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cashapp' | 'googlepay'>('cashapp');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionAmount, setRedemptionAmount] = useState('');

  const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await fetch('/api/wallet/transactions');
      return res.json();
    },
    enabled: !!user,
  });

  const { data: packagesData } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await fetch('/api/store/packages');
      return res.json();
    }
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPack) return;
      const res = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: selectedPack, paymentMethod }),
      });
      return res.json();
    },
    onSuccess: () => {
      alert('Purchase successful!');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      refreshUser();
      setSelectedPack(null);
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/wallet/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amountSC: parseFloat(redemptionAmount),
          paymentMethod: 'cashapp',
          paymentDetails: user?.cashapp_tag
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      alert('Redemption request submitted!');
      setIsRedeeming(false);
      setRedemptionAmount('');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      refreshUser();
    },
    onError: (err: any) => alert(err.message)
  });

  const claimBonusMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/daily-bonus', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      alert(data.message);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      refreshUser();
    },
    onError: (error: any) => {
      alert(error.message);
    }
  });

  if (!user) return <div className="text-center py-20 text-slate-400">Please login to view your wallet.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Balance Cards */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-yellow-500" />
                </div>
                <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Gold Coins</span>
              </div>
              <p className="text-3xl font-black text-white">{user.gc_balance.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">Available for free play</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <WalletIcon className="w-6 h-6 text-emerald-500" />
                </div>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Sweeps Coins</span>
              </div>
              <p className="text-3xl font-black text-white">{user.sc_balance.toFixed(2)}</p>
              <p className="text-sm text-slate-500 mt-1">Redeemable for real prizes</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="md:w-80">
          <CardHeader>
            <h3 className="font-bold text-white">Quick Actions</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start gap-3 bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600/20" 
              variant="outline"
              onClick={() => claimBonusMutation.mutate()}
              disabled={claimBonusMutation.isPending}
            >
              <Zap className="w-4 h-4" /> 
              {claimBonusMutation.isPending ? 'Claiming...' : 'Claim Daily Bonus'}
            </Button>
            <Button 
              className="w-full justify-start gap-3" 
              variant="outline"
              onClick={() => setIsRedeeming(!isRedeeming)}
            >
              <ArrowUpRight className="w-4 h-4" /> Redeem Prizes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Redemption Form */}
      {isRedeeming && (
        <Card className="border-emerald-500/20 bg-emerald-900/10">
          <CardHeader>
            <h3 className="font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Redeem Sweeps Coins
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.kyc_status !== 'verified' ? (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-bold">Identity verification required for redemption. Check your Profile.</span>
              </div>
            ) : !user.cashapp_tag ? (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3 text-yellow-500">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-bold">Please add your CashApp tag in your Profile settings.</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Amount (SC)</label>
                    <input 
                      type="number" 
                      value={redemptionAmount}
                      onChange={(e) => setRedemptionAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-white"
                      placeholder="Min 100 SC"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Payout Method</label>
                    <div className="px-4 py-2 bg-slate-900 rounded-lg border border-white/10 text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      CashApp ({user.cashapp_tag})
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  * A $5.00 service fee will be deducted from your payout.
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsRedeeming(false)}>Cancel</Button>
                  <Button 
                    onClick={() => redeemMutation.mutate()}
                    disabled={redeemMutation.isPending || !redemptionAmount || parseFloat(redemptionAmount) < 100}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {redeemMutation.isPending ? 'Submitting...' : 'Request Payout'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Store Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Coin Store</h2>
        </div>

        {/* Payment Method Selector */}
        <div className="flex gap-4 mb-4">
          <button 
            onClick={() => setPaymentMethod('cashapp')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all",
              paymentMethod === 'cashapp' 
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-500" 
                : "bg-slate-900 border-white/5 text-slate-500 hover:border-white/10"
            )}
          >
            <CreditCard className="w-4 h-4" /> CashApp
          </button>
          <button 
            onClick={() => setPaymentMethod('googlepay')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all",
              paymentMethod === 'googlepay' 
                ? "bg-blue-500/10 border-blue-500 text-blue-500" 
                : "bg-slate-900 border-white/5 text-slate-500 hover:border-white/10"
            )}
          >
            <CreditCard className="w-4 h-4" /> Google Pay
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {packagesData?.packages?.map((pack: any) => (
            <Card 
              key={pack.id} 
              className={cn(
                "relative flex flex-col group hover:border-blue-500/30 transition-all cursor-pointer",
                selectedPack === pack.id && "ring-2 ring-blue-500 border-blue-500 bg-blue-500/5",
                pack.is_featured && "border-blue-500/50 bg-blue-500/5"
              )}
              onClick={() => setSelectedPack(pack.id)}
            >
              {pack.is_featured === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-tighter rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              <CardContent className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-white mb-4">{pack.name}</h3>
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-slate-300 font-bold">{pack.gc_amount.toLocaleString()} Gold Coins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-400 font-black">FREE {pack.sc_amount} Sweeps Coins</span>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="text-2xl font-black text-white mb-4">${pack.price}</div>
                  {selectedPack === pack.id ? (
                    <Button 
                      className="w-full" 
                      onClick={(e) => {
                        e.stopPropagation();
                        purchaseMutation.mutate();
                      }}
                      disabled={purchaseMutation.isPending}
                    >
                      {purchaseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay with ${paymentMethod === 'cashapp' ? 'CashApp' : 'Google Pay'}`}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline">Select</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Transaction History */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <History className="w-5 h-5 text-purple-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Transaction History</h2>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isTransactionsLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-600" />
                    </td>
                  </tr>
                ) : transactionsData?.transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">No transactions found.</td>
                  </tr>
                ) : (
                  transactionsData?.transactions?.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter",
                          tx.type === 'purchase' ? "bg-blue-500/10 text-blue-400" : "bg-slate-800 text-slate-400"
                        )}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">{tx.description}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          {tx.gc_amount > 0 && (
                            <span className="text-xs font-bold text-yellow-500">+{tx.gc_amount.toLocaleString()} GC</span>
                          )}
                          {tx.sc_amount > 0 && (
                            <span className="text-xs font-bold text-emerald-500">+{tx.sc_amount.toFixed(2)} SC</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
