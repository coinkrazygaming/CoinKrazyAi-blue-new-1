import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  MessageSquare, 
  Loader2,
  User
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader } from './ui/Card';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function FriendsList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Fetch Friends
  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await fetch('/api/friends');
      return res.json();
    }
  });

  // Search Users
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['users-search', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 3) return { users: [] };
      const res = await fetch(`/api/users/search?query=${searchQuery}`);
      return res.json();
    },
    enabled: searchQuery.length >= 3
  });

  // Mutations
  const sendRequestMutation = useMutation({
    mutationFn: async (friendId: number) => {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      alert('Friend request sent!');
      setSearchQuery('');
      setIsSearching(false);
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
    onError: (err) => alert('Failed to send request')
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] })
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await fetch('/api/friends/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] })
  });

  const friends = friendsData?.friends?.filter((f: any) => f.status === 'accepted') || [];
  const pendingRequests = friendsData?.friends?.filter((f: any) => f.status === 'pending' && f.direction === 'received') || [];
  const sentRequests = friendsData?.friends?.filter((f: any) => f.status === 'pending' && f.direction === 'sent') || [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Friends ({friends.length})
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsSearching(!isSearching)}
          className={cn("text-slate-400 hover:text-white", isSearching && "bg-blue-500/10 text-blue-400")}
        >
          <UserPlus className="w-5 h-5" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {/* Search Mode */}
        {isSearching && (
          <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search username..." 
                className="w-full bg-slate-950 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              {searchLoading ? (
                <div className="text-center py-2"><Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-500" /></div>
              ) : searchResults?.users?.length > 0 ? (
                searchResults.users.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-sm font-bold text-white">{u.username}</span>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => sendRequestMutation.mutate(u.id)}
                      disabled={sendRequestMutation.isPending}
                    >
                      Add
                    </Button>
                  </div>
                ))
              ) : searchQuery.length >= 3 ? (
                <div className="text-center text-xs text-slate-500 py-2">No users found</div>
              ) : null}
            </div>
          </div>
        )}

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Requests</h4>
            {pendingRequests.map((req: any) => (
              <div key={req.friendship_id} className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{req.username}</div>
                    <div className="text-[10px] text-blue-400">Wants to be friends</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    className="h-8 w-8 bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30"
                    onClick={() => acceptRequestMutation.mutate(req.friendship_id)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    className="h-8 w-8 bg-rose-500/20 text-rose-500 hover:bg-rose-500/30"
                    onClick={() => rejectRequestMutation.mutate(req.friendship_id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friends List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Online & Offline</h4>
          {friendsLoading ? (
            <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-600" /></div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No friends yet. Search to add some!
            </div>
          ) : (
            friends.map((friend: any) => (
              <div key={friend.id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl group transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className={cn(
                      "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#020617]",
                      friend.isOnline ? "bg-emerald-500" : "bg-slate-600"
                    )} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{friend.username}</div>
                    <div className="text-[10px] text-slate-500">
                      {friend.isOnline ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-rose-400"
                    onClick={() => {
                      if(confirm('Remove friend?')) rejectRequestMutation.mutate(friend.friendship_id);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
