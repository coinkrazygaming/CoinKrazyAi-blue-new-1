import { useState, useEffect, useRef, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Send, 
  Users, 
  X, 
  Minimize2, 
  Maximize2,
  Share2
} from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client';

interface ChatProps {
  gameSlug: string;
}

export default function GameChat({ gameSlug }: ChatProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Load
  const { data: initialMessages } = useQuery({
    queryKey: ['chat', gameSlug],
    queryFn: async () => {
      const res = await fetch(`/api/chat/${gameSlug}`);
      return res.json();
    }
  });

  useEffect(() => {
    if (initialMessages?.messages) {
      setMessages(initialMessages.messages);
    }
  }, [initialMessages]);

  // Socket Connection
  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit('join-game-room', { gameSlug, user });

    newSocket.on('chat-message', (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      newSocket.emit('leave-game-room', { gameSlug });
      newSocket.disconnect();
    };
  }, [gameSlug]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    try {
      await fetch(`/api/chat/${gameSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        className="fixed bottom-4 right-4 rounded-full shadow-2xl z-50 h-14 w-14"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-[500px] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-slate-950 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Game Chat</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
            <Minimize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/95">
        {messages.map((msg, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">
              {msg.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-slate-300">{msg.username}</span>
                <span className="text-[10px] text-slate-600">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-sm text-slate-400 break-words">{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 bg-slate-950 border-t border-white/5 flex gap-2">
        <input 
          type="text" 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={user ? "Type a message..." : "Login to chat"}
          disabled={!user}
          className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
        />
        <Button type="submit" size="icon" disabled={!user || !message.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
