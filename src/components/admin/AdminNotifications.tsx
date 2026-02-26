import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserCheck, 
  DollarSign, 
  Gamepad2, 
  Megaphone,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const res = await fetch('/api/admin/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    }
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await fetch(`/api/admin/notifications/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Action failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    }
  });

  if (isLoading) return <div className="text-white">Loading notifications...</div>;

  const notifications = data?.notifications || [];

  const getIcon = (type: string) => {
    switch (type) {
      case 'kyc_submission': return <UserCheck className="w-5 h-5 text-blue-400" />;
      case 'redemption_request': return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'game_ready': return <Gamepad2 className="w-5 h-5 text-purple-400" />;
      case 'social_campaign': return <Megaphone className="w-5 h-5 text-orange-400" />;
      case 'ai_task': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Bell className="w-8 h-8 text-blue-500" />
          Admin Notifications Center
        </h2>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold border border-blue-500/30">
            {notifications.filter((n: any) => n.status === 'pending').length} Pending
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {notifications.length === 0 ? (
          <Card className="bg-slate-900/50 border-white/5">
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">No notifications at this time.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification: any) => (
            <Card 
              key={notification.id} 
              className={`border-white/5 transition-all duration-300 ${
                notification.status === 'pending' ? 'bg-slate-900 border-l-4 border-l-blue-500' : 'bg-slate-900/40 opacity-75'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 bg-slate-950 rounded-lg border border-white/10">
                      {getIcon(notification.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-white">{notification.title}</h3>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4">
                        {notification.content}
                      </p>
                      
                      {notification.status === 'pending' && (
                        <div className="flex gap-3">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                            onClick={() => actionMutation.mutate({ id: notification.id, status: 'approved' })}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10 gap-2"
                            onClick={() => actionMutation.mutate({ id: notification.id, status: 'denied' })}
                          >
                            <XCircle className="w-4 h-4" />
                            Deny
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-slate-400 hover:text-white"
                            onClick={() => actionMutation.mutate({ id: notification.id, status: 'actioned' })}
                          >
                            Mark as Read
                          </Button>
                        </div>
                      )}
                      
                      {notification.status !== 'pending' && (
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                          notification.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                          notification.status === 'denied' ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {notification.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
