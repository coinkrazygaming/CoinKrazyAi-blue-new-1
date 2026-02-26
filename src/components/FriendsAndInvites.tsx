import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  Copy, 
  Check, 
  Facebook, 
  Twitter, 
  Instagram,
  ExternalLink,
  Gift,
  Search,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Share2,
  MessageCircle,
  Plus,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function FriendsAndInvites() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await fetch('/api/user/profile');
      const data = await res.json();
      return data.user;
    }
  });

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['my-friends'],
    queryFn: async () => {
      const res = await fetch('/api/friends');
      return res.json();
    }
  });

  const { data: globalSearchResults, isLoading: globalSearchLoading } = useQuery({
    queryKey: ['user-search', globalSearchQuery],
    queryFn: async () => {
      if (globalSearchQuery.length < 3) return { users: [] };
      const res = await fetch(`/api/users/search?query=${globalSearchQuery}`);
      return res.json();
    },
    enabled: globalSearchQuery.length >= 3
  });

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const res = await fetch('/api/admin/settings');
      return res.json();
    }
  });

  const sendFriendRequest = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      });
      if (!res.ok) throw new Error('Failed to send request');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-friends'] });
    }
  });

  const acceptFriendRequest = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-friends'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    }
  });

  const referralLink = `${window.location.origin}/register?ref=${user?.referral_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const connectSocial = async (platform: string) => {
    try {
      const res = await fetch(`/api/auth/social/url/${platform}`);
      const { url } = await res.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('Social connect error:', error);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
        // In a real app, we would show a success toast here
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient]);

  const filteredFriends = friendsData?.friends?.filter((f: any) => 
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingRequests = friendsData?.friends?.filter((f: any) => f.status === 'pending' && f.direction === 'received');
  const activeFriends = friendsData?.friends?.filter((f: any) => f.status === 'accepted');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Referral Section */}
      <Card className="bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 border-blue-500/30 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Gift className="w-48 h-48 text-blue-500" />
        </div>
        <CardContent className="p-10 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/20">
                <UserPlus className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">Invite & Earn</h2>
                <p className="text-blue-400/60 text-xs font-bold uppercase tracking-[0.2em] mt-1">The CoinKrazy Referral Program</p>
              </div>
            </div>
            
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              Bring your squad to the ultimate social casino! You'll both receive <span className="text-yellow-500 font-black">{settings?.referral_bonus_gc || 1000} GC</span> and <span className="text-emerald-500 font-black">{settings?.referral_bonus_sc || 1.00} SC</span> instantly when they join or you become friends!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Unique Referral Link</label>
                <div className="bg-slate-950/80 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between group/link hover:border-blue-500/50 transition-colors">
                  <span className="text-sm font-mono text-slate-400 truncate mr-4">{referralLink}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCopy}
                    className="shrink-0 h-10 px-4 gap-2 hover:bg-blue-500/10 hover:text-blue-400 rounded-xl"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span className="font-bold">{copied ? 'Copied!' : 'Copy'}</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Connect & Import Friends</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-14 bg-[#1877F2]/10 border-[#1877F2]/20 text-[#1877F2] hover:bg-[#1877F2]/20 rounded-2xl"
                    onClick={() => connectSocial('facebook')}
                  >
                    <Facebook className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 h-14 bg-black/40 border-white/10 text-white hover:bg-white/5 rounded-2xl"
                    onClick={() => connectSocial('twitter')}
                  >
                    <Twitter className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 h-14 bg-gradient-to-tr from-[#f9ce34]/10 via-[#ee2a7b]/10 to-[#6228d7]/10 border-white/10 text-pink-500 hover:bg-white/5 rounded-2xl"
                    onClick={() => connectSocial('instagram')}
                  >
                    <Instagram className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 h-14 bg-[#000000]/10 border-white/10 text-white hover:bg-white/5 rounded-2xl"
                    onClick={() => connectSocial('tiktok')}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Friends List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Invites */}
          <AnimatePresence>
            {pendingRequests?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="bg-emerald-500/5 border-emerald-500/20 overflow-hidden">
                  <CardHeader className="py-3 px-4 border-b border-emerald-500/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Pending Friend Requests</h4>
                    </div>
                    <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                  </CardHeader>
                  <CardContent className="p-0 divide-y divide-emerald-500/10">
                    {pendingRequests.map((request: any) => (
                      <div key={request.friendship_id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={request.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.username}`} 
                            className="w-10 h-10 rounded-xl bg-slate-800"
                            alt=""
                          />
                          <div>
                            <p className="text-sm font-bold text-white">{request.username}</p>
                            <p className="text-[10px] text-emerald-500/60 font-bold uppercase">Wants to be your friend</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-600 h-8 px-4 text-[10px] font-black uppercase"
                            onClick={() => acceptFriendRequest.mutate(request.friendship_id)}
                            disabled={acceptFriendRequest.isPending}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-slate-500 hover:text-white h-8 px-4 text-[10px] font-black uppercase"
                          >
                            Ignore
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Friends List */}
          <Card className="bg-slate-900/40 border-white/5 backdrop-blur-sm">
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between py-5 px-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-white">My Friends</h3>
                <span className="text-[10px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{activeFriends?.length || 0}</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Filter friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 w-48 md:w-64 transition-all"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {friendsLoading ? (
                <div className="p-20 text-center">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Syncing with the squad...</p>
                </div>
              ) : activeFriends?.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {activeFriends.filter((f: any) => f.username.toLowerCase().includes(searchQuery.toLowerCase())).map((friend: any) => (
                    <div key={friend.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} 
                            alt={friend.username} 
                            className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 group-hover:border-blue-500/50 transition-colors"
                          />
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#020617] flex items-center justify-center",
                            friend.isOnline ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-slate-600"
                          )}>
                            {friend.isOnline && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-lg tracking-tight">{friend.username}</span>
                            {friend.kyc_status === 'verified' && (
                              <div className="p-0.5 bg-blue-500/20 rounded-md">
                                <Check className="w-3 h-3 text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                              friend.isOnline ? "text-emerald-500 bg-emerald-500/10" : "text-slate-500 bg-slate-500/10"
                            )}>
                              {friend.isOnline ? 'Online Now' : `Last seen ${new Date(friend.last_login).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden md:block text-right">
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Status</p>
                          <p className="text-xs font-bold text-white bg-white/5 px-3 py-1 rounded-lg">Level 42 Player</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-white/5 rounded-xl">
                          <MessageCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-800/30 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-white/5">
                    <Users className="w-10 h-10 text-slate-700" />
                  </div>
                  <h4 className="text-xl font-black text-white mb-2">Squad Goals: Zero</h4>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Your friends list is currently empty. Use your referral link or search for players to start building your community!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Find Friends */}
        <div className="space-y-6">
          <Card className="bg-slate-900/40 border-white/5 backdrop-blur-sm sticky top-24">
            <CardHeader className="py-5 px-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-white">Find Players</h3>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search by username..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="space-y-4">
                {globalSearchLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
                  </div>
                ) : globalSearchResults?.users?.length > 0 ? (
                  globalSearchResults.users.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <img 
                          src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} 
                          className="w-10 h-10 rounded-xl bg-slate-800"
                          alt=""
                        />
                        <span className="text-sm font-bold text-white">{u.username}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-8 h-8 p-0 rounded-lg hover:bg-blue-500 hover:text-white"
                        onClick={() => sendFriendRequest.mutate(u.id)}
                        disabled={sendFriendRequest.isPending}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : globalSearchQuery.length >= 3 ? (
                  <div className="py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                    No players found
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
                      Enter at least 3 characters to search the global player base.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Safe Community</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      All interactions are monitored by SecurityAi. Be respectful to fellow players.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
