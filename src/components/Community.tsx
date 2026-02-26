import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Users, TrendingUp, Search, Plus, MessageCircle, ThumbsUp, Reply, Pin, Lock, ArrowLeft, Send, AlertCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';

interface Board {
  id: number;
  name: string;
  description: string;
  slug: string;
}

interface Topic {
  id: number;
  title: string;
  content: string;
  username: string;
  avatar_url: string;
  reply_count: number;
  views: number;
  is_pinned: number;
  is_locked: number;
  created_at: string;
  updated_at: string;
}

interface Post {
  id: number;
  content: string;
  username: string;
  avatar_url: string;
  like_count: number;
  is_liked: number;
  parent_id: number | null;
  created_at: string;
}

interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  avatar_url: string;
  message: string;
  created_at: string;
}

export const Community: React.FC<{ user: any }> = ({ user }) => {
  const [view, setView] = useState<'boards' | 'topics' | 'topic'>('boards');
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const [replyContent, setReplyContent] = useState('');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);

  useEffect(() => {
    fetchBoards();
    initSocket();
    return () => {
      socket?.disconnect();
    };
  }, []);

  const initSocket = () => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-global-chat');
    });

    newSocket.on('new-global-message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev.slice(-49), message]);
      setModerationError(null);
    });

    newSocket.on('moderation-action', (data: { error: string }) => {
      setModerationError(data.error);
    });

    fetchChatHistory();
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/community/chat/history');
      const data = await response.json();
      setChatMessages(data.messages);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/community/boards');
      const data = await response.json();
      setBoards(data.boards);
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (slug: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/community/boards/${slug}`);
      const data = await response.json();
      setTopics(data.topics);
      setSelectedBoard(data.board);
      setView('topics');
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicDetails = async (topicId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/community/topics/${topicId}`);
      const data = await response.json();
      setSelectedTopic(data.topic);
      setPosts(data.posts);
      setView('topic');
    } catch (error) {
      console.error('Error fetching topic details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoard) return;
    try {
      const response = await fetch('/api/community/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId: selectedBoard.id, ...newTopic }),
      });
      const data = await response.json();
      if (response.ok) {
        setIsCreatingTopic(false);
        setNewTopic({ title: '', content: '' });
        fetchTopics(selectedBoard.slug);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) return;
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: selectedTopic.id, content: replyContent }),
      });
      const data = await response.json();
      if (response.ok) {
        setReplyContent('');
        fetchTopicDetails(selectedTopic.id);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, { method: 'POST' });
      if (response.ok) {
        fetchTopicDetails(selectedTopic!.id);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    socket.emit('send-global-message', { userId: user.id, message: chatInput });
    setChatInput('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3 space-y-6">
        <AnimatePresence mode="wait">
          {view === 'boards' && (
            <motion.div
              key="boards"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-emerald-400" />
                  Community Boards
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {boards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => fetchTopics(board.slug)}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-left hover:border-zinc-700 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{board.name}</h3>
                        <p className="text-zinc-400 text-sm mt-1">{board.description}</p>
                      </div>
                      <ArrowLeft className="w-5 h-5 text-zinc-600 group-hover:text-emerald-400 rotate-180 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'topics' && selectedBoard && (
            <motion.div
              key="topics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setView('boards')}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-bold text-white">{selectedBoard.name}</h2>
                </div>
                <button
                  onClick={() => setIsCreatingTopic(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Topic
                </button>
              </div>

              {isCreatingTopic && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4"
                >
                  <input
                    type="text"
                    placeholder="Topic Title"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <textarea
                    placeholder="Tell the community what's on your mind..."
                    value={newTopic.content}
                    onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white h-32 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setIsCreatingTopic(false)}
                      className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTopic}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                    >
                      Post Topic
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                {topics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => fetchTopicDetails(topic.id)}
                    className="w-full p-6 text-left border-b border-zinc-800 last:border-0 hover:bg-zinc-800/30 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <img src={topic.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${topic.username}`} className="w-10 h-10 rounded-full border border-zinc-700" alt="" />
                      <div>
                        <div className="flex items-center gap-2">
                          {topic.is_pinned === 1 && <Pin className="w-3 h-3 text-emerald-400" />}
                          {topic.is_locked === 1 && <Lock className="w-3 h-3 text-zinc-500" />}
                          <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{topic.title}</h3>
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          by <span className="text-zinc-300">{topic.username}</span> • {new Date(topic.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-zinc-500 text-sm">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        {topic.reply_count}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        {topic.views}
                      </div>
                    </div>
                  </button>
                ))}
                {topics.length === 0 && !isCreatingTopic && (
                  <div className="p-12 text-center text-zinc-500">
                    No topics yet. Be the first to start a conversation!
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'topic' && selectedTopic && (
            <motion.div
              key="topic"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => fetchTopics(selectedTopic.board_slug)}
                  className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-white">{selectedTopic.title}</h2>
              </div>

              <div className="space-y-4">
                {posts.map((post, index) => (
                  <div key={post.id} className={`bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 ${index === 0 ? 'border-emerald-500/30' : ''}`}>
                    <div className="flex items-start gap-4">
                      <img src={post.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} className="w-12 h-12 rounded-full border border-zinc-700" alt="" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-white">{post.username}</div>
                          <div className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleString()}</div>
                        </div>
                        <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800/50">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                              post.is_liked ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            <ThumbsUp className={`w-4 h-4 ${post.is_liked ? 'fill-emerald-400' : ''}`} />
                            {post.like_count}
                          </button>
                          <button className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors">
                            <Reply className="w-4 h-4" />
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedTopic.is_locked === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white">Post a Reply</h3>
                  <textarea
                    placeholder="Write your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white h-32 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handlePostReply}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2 rounded-lg font-bold transition-colors"
                    >
                      Post Reply
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 flex flex-col items-center gap-2">
                  <Lock className="w-8 h-8 opacity-20" />
                  This topic is locked and cannot receive new replies.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl h-[600px] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-800/30 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              Global Chat
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Live</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {chatMessages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <img src={msg.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`} className="w-8 h-8 rounded-full border border-zinc-700 shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-400 truncate">{msg.username}</span>
                    <span className="text-[10px] text-zinc-600 shrink-0">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-zinc-300 break-words">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-800/30">
            {moderationError && (
              <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-400 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                {moderationError}
              </div>
            )}
            <form onSubmit={sendChatMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-[9px] text-zinc-500 uppercase font-bold tracking-widest">
              <Shield className="w-3 h-3" />
              SecurityAi Moderated
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Community Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Total Boards</span>
              <span className="text-white font-medium">{boards.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Active Players</span>
              <span className="text-white font-medium">1,284</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Daily Posts</span>
              <span className="text-white font-medium">452</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
