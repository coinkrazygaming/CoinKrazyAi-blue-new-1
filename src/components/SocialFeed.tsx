import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  Send, 
  Trophy, 
  TrendingUp, 
  Clock,
  User,
  MoreHorizontal,
  Plus,
  Loader2,
  Heart,
  MessageCircle,
  Zap,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: number;
  user_id: number;
  username: string;
  avatar_url: string;
  content: string;
  type: 'update' | 'game_result';
  game_result_id: number | null;
  game_name: string | null;
  win_amount_gc: number | null;
  win_amount_sc: number | null;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  created_at: string;
}

interface Comment {
  id: number;
  user_id: number;
  username: string;
  avatar_url: string;
  content: string;
  created_at: string;
}

export const SocialFeed: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState('');
  const [expandedPost, setExpandedPost] = useState<number | null>(null);

  const { data: posts, isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ['social-feed'],
    queryFn: async () => {
      const res = await fetch('/api/social/feed');
      return res.json();
    }
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'update' })
      });
      return res.json();
    },
    onSuccess: () => {
      setNewPostContent('');
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
    }
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await fetch(`/api/social/posts/${postId}/like`, { method: 'POST' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
    }
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    createPostMutation.mutate(newPostContent);
  };

  if (postsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Loading Feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Create Post Card */}
      <Card className="bg-slate-900/40 border-white/5 p-6 rounded-[32px]">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <div className="flex gap-4">
            <img 
              src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
              className="w-12 h-12 rounded-2xl bg-slate-800 shrink-0"
              alt=""
            />
            <textarea
              placeholder="What's on your mind? Share your wins or updates..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="flex-1 bg-slate-950/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-blue-500/50 min-h-[100px] resize-none transition-all"
            />
          </div>
          <div className="flex justify-end items-center gap-4">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              {newPostContent.length} / 500
            </span>
            <Button 
              type="submit" 
              disabled={!newPostContent.trim() || createPostMutation.isPending}
              className="h-12 px-8 font-black uppercase italic tracking-tighter"
            >
              {createPostMutation.isPending ? 'Posting...' : 'Post Update'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Feed Posts */}
      <div className="space-y-4">
        {posts?.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onLike={() => likePostMutation.mutate(post.id)}
            isExpanded={expandedPost === post.id}
            onToggleExpand={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
          />
        ))}
      </div>
    </div>
  );
};

const PostCard: React.FC<{ 
  post: Post; 
  onLike: () => void; 
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ post, onLike, isExpanded, onToggleExpand }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState('');

  const { data: comments, isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ['post-comments', post.id],
    queryFn: async () => {
      const res = await fetch(`/api/social/posts/${post.id}/comments`);
      return res.json();
    },
    enabled: isExpanded
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/social/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      return res.json();
    },
    onSuccess: () => {
      setCommentContent('');
      queryClient.invalidateQueries({ queryKey: ['post-comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
    }
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    addCommentMutation.mutate(commentContent);
  };

  return (
    <Card className="bg-slate-900/40 border-white/5 overflow-hidden rounded-[32px] group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img 
              src={post.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} 
              className="w-10 h-10 rounded-xl bg-slate-800"
              alt=""
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-sm tracking-tight">{post.username}</span>
                {post.type === 'game_result' && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-widest">
                    Big Win
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <button className="p-2 text-slate-600 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
          {post.content}
        </p>

        {post.type === 'game_result' && post.game_name && (
          <div className="mb-4 p-4 glass-surface rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Game Result</div>
                  <div className="text-sm font-black text-white italic uppercase tracking-tighter">{post.game_name}</div>
                </div>
              </div>
              <div className="text-right">
                {post.win_amount_sc ? (
                  <div className="text-lg font-black text-emerald-500 tracking-tighter">+{post.win_amount_sc.toFixed(2)} SC</div>
                ) : (
                  <div className="text-lg font-black text-yellow-500 tracking-tighter">+{post.win_amount_gc?.toLocaleString()} GC</div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 pt-4 border-t border-white/5">
          <button 
            onClick={onLike}
            className={cn(
              "flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all",
              post.is_liked ? "text-blue-500" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <ThumbsUp className={cn("w-4 h-4", post.is_liked && "fill-blue-500")} />
            {post.like_count}
          </button>
          
          <button 
            onClick={onToggleExpand}
            className={cn(
              "flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all",
              isExpanded ? "text-white" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            {post.comment_count}
          </button>

          <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-all ml-auto">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-white/5 space-y-6"
            >
              {/* Comments List */}
              <div className="space-y-4">
                {commentsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  </div>
                ) : comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img 
                      src={comment.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`} 
                      className="w-8 h-8 rounded-lg bg-slate-800 shrink-0"
                      alt=""
                    />
                    <div className="flex-1 bg-slate-950/50 rounded-2xl p-3 border border-white/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white tracking-tight">{comment.username}</span>
                        <span className="text-[8px] text-slate-600 font-bold uppercase">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-3">
                <img 
                  src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
                  className="w-8 h-8 rounded-lg bg-slate-800 shrink-0 opacity-50"
                  alt=""
                />
                <div className="flex-1 relative">
                  <input 
                    type="text"
                    placeholder="Write a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl pl-4 pr-12 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!commentContent.trim() || addCommentMutation.isPending}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
