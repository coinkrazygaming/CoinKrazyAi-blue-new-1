import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Loader2, User, Bot, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function AIChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const handleSend = async () => {
    if (!message.trim() || isTyping) return;

    const userMessage = message.trim();
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are LuckyAI, the friendly and helpful AI General Manager of CoinKrazy AI. 
          Your goal is to assist players with game recommendations, platform navigation, and general support.
          Be enthusiastic, use gambling/gaming metaphors occasionally, and always be professional.
          Player info: ${user ? `Username: ${user.username}, GC: ${user.gc_balance}, SC: ${user.sc_balance}` : 'Guest player'}.
          If they ask about games, recommend Krazy Slots or Neon Dice.
          If they ask about rewards, explain the dual currency system (GC for fun, SC for redemptions).`,
        }
      });

      const response = await chat.sendMessage({ message: userMessage });
      setChatHistory(prev => [...prev, { role: 'model', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      console.error('AI Error:', error);
      setChatHistory(prev => [...prev, { role: 'model', text: "Oops! My circuits are a bit fuzzy right now. Try again in a moment!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[350px] sm:w-[400px]"
          >
            <Card className="flex flex-col h-[500px] shadow-2xl border-blue-500/20">
              {/* Header */}
              <div className="p-4 bg-blue-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-none">LuckyAI</h3>
                    <p className="text-[10px] text-blue-200 mt-1 font-medium">Platform Manager</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Chat Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
                {chatHistory.length === 0 && (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                      <Bot className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-white font-bold">Welcome to CoinKrazy AI!</p>
                      <p className="text-xs text-slate-500 max-w-[200px] mx-auto mt-1">I'm LuckyAI. How can I help you win big today?</p>
                    </div>
                  </div>
                )}

                {chatHistory.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      msg.role === 'user' ? "bg-slate-800" : "bg-blue-600"
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-slate-400" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={cn(
                      "max-w-[80%] p-3 rounded-2xl text-sm",
                      msg.role === 'user' 
                        ? "bg-slate-800 text-slate-200 rounded-tr-none" 
                        : "bg-blue-600/10 border border-blue-500/20 text-slate-200 rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-2xl rounded-tl-none">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/5 bg-slate-900/50">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask LuckyAI anything..."
                    className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <Button type="submit" size="icon" disabled={!message.trim() || isTyping}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-2xl transition-all duration-300",
          isOpen ? "rotate-90 bg-slate-800" : "bg-blue-600 hover:scale-110"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </Button>
    </div>
  );
}
