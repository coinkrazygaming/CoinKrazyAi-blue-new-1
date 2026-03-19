import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, User, Shield, Loader2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { io } from 'socket.io-client';

const socket = io();

interface Message {
  id: number;
  userId: number;
  username: string;
  content: string;
  timestamp: string;
}

export default function GlobalChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch
    fetch('/api/chat/messages')
      .then(res => res.json())
      .then(data => setMessages(data.messages || []));

    // Socket listener
    socket.on('new-chat-message', (msg: Message) => {
      setMessages(prev => [...prev, msg].slice(-50));
    });

    return () => {
      socket.off('new-chat-message');
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage })
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to send message');
      } else {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Chat Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-0 bottom-0 w-80 bg-[#020617] border-l border-white/5 z-40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Global Chat</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="group">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-tighter",
                msg.username === user?.username ? "text-blue-400" : "text-slate-500"
              )}>
                {msg.username}
              </span>
              <span className="text-[8px] text-slate-700">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className={cn(
              "px-3 py-2 rounded-2xl text-xs leading-relaxed",
              msg.username === user?.username 
                ? "bg-blue-600/10 text-blue-100 border border-blue-500/20" 
                : "bg-slate-900 text-slate-300 border border-white/5"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5 bg-slate-900/30">
        {user ? (
          <form onSubmit={handleSendMessage} className="relative">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500/50 pr-12"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !newMessage.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <div className="text-center py-2">
            <p className="text-[10px] text-slate-500 uppercase font-bold">Login to join the chat</p>
          </div>
        )}
      </div>
    </div>
  );
}
