import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Megaphone, 
  Send, 
  Mail, 
  MessageSquare, 
  Share2, 
  Users, 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

export default function SocialManager() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState('social_media');

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['social-campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/admin/social/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      return res.json();
    }
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, prompt })
      });
      if (!res.ok) throw new Error('Generation failed');
      return res.json();
    },
    onSuccess: () => {
      setPrompt('');
      queryClient.invalidateQueries({ queryKey: ['social-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-orange-500" />
          Social & Marketing Manager
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-white/5">
            <CardHeader>
              <h3 className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                Generate New Campaign
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Campaign Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'social_media', label: 'Social Media', icon: Share2 },
                    { id: 'email', label: 'Email Blast', icon: Mail },
                    { id: 'sms', label: 'SMS Text', icon: MessageSquare },
                    { id: 'retention', label: 'Retention', icon: Users },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                        type === t.id 
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' 
                          : 'bg-slate-950 border-white/5 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      <t.icon className="w-4 h-4" />
                      <span className="text-xs font-bold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Campaign Goal / Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Promote the new Pull Tabs game with a 20% bonus code..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50 min-h-[120px]"
                />
              </div>

              <Button 
                className="w-full bg-orange-600 hover:bg-orange-500 text-white gap-2"
                disabled={generateMutation.isPending || !prompt}
                onClick={() => generateMutation.mutate()}
              >
                {generateMutation.isPending ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate with SocialAi
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-white/5">
            <CardHeader>
              <h3 className="font-bold text-white">Marketing Stats</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-sm text-slate-400">Total Campaigns</span>
                <span className="text-lg font-bold text-white">{campaigns?.campaigns?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-sm text-slate-400">Pending Approval</span>
                <span className="text-lg font-bold text-orange-400">
                  {campaigns?.campaigns?.filter((c: any) => c.status === 'pending').length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2 px-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Recent Campaigns
          </h3>
          
          {isLoading ? (
            <div className="text-slate-500 p-8 text-center">Loading campaigns...</div>
          ) : campaigns?.campaigns?.length === 0 ? (
            <div className="text-slate-500 p-12 text-center bg-slate-900/50 rounded-2xl border border-dashed border-white/5">
              No campaigns generated yet.
            </div>
          ) : (
            campaigns?.campaigns?.map((campaign: any) => (
              <Card key={campaign.id} className="bg-slate-900 border-white/5 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 bg-slate-950 rounded-lg border border-white/10">
                        {campaign.type === 'social_media' && <Share2 className="w-5 h-5 text-blue-400" />}
                        {campaign.type === 'email' && <Mail className="w-5 h-5 text-emerald-400" />}
                        {campaign.type === 'sms' && <MessageSquare className="w-5 h-5 text-orange-400" />}
                        {campaign.type === 'retention' && <Users className="w-5 h-5 text-purple-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-white">{campaign.title}</h4>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                            {format(new Date(campaign.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5 mb-4">
                          <p className="text-xs text-slate-400 font-mono line-clamp-3">
                            {JSON.stringify(JSON.parse(campaign.content), null, 2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            campaign.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                            campaign.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {campaign.status}
                          </span>
                          {campaign.status === 'pending' && (
                            <div className="flex gap-2">
                              <button className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Approve & Send
                              </button>
                              <button className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
