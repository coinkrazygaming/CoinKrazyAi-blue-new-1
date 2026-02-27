import React, { useState, useRef, useEffect } from 'react';
import { 
  Wand2, 
  Send, 
  Bot, 
  User, 
  X, 
  Sparkles, 
  Gamepad2, 
  Image as ImageIcon, 
  Code, 
  Palette, 
  Layout, 
  Trophy,
  ArrowRight,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AiGameBuilderProps {
  gameId?: number | null;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  preview?: any;
  timestamp: string;
}

export default function AiGameBuilder({ gameId, onClose }: AiGameBuilderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [variations, setVariations] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/ai/game-builder/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText, 
          sessionId, 
          gameId 
        })
      });

      if (!res.ok) throw new Error('Chat failed');
      const data = await res.json();

      setSessionId(data.sessionId);
      setVariations(data.variations || []);
      
      const aiMsg: Message = {
        role: 'ai',
        content: data.text,
        preview: data.preview_data,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Builder Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPreview = [...messages].reverse().find(m => m.preview)?.preview;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-6xl h-[85vh] flex overflow-hidden shadow-2xl"
      >
        {/* Chat Section */}
        <div className="w-full md:w-1/2 flex flex-col border-r border-white/5">
          <div className="p-6 border-bottom border-white/5 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30">
                <Wand2 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="font-bold text-white">AI Game Builder</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Powered by DevAi</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {messages.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto border border-purple-500/20">
                  <Bot className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Welcome to the Game Builder</h3>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                  Describe the game you want to build or provide a URL to rebrand.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-4">
                  {[
                    "Build a new crash game",
                    "Rebrand a slot game URL",
                    "Create a new pull tab theme",
                    "Rework mechanics for current game"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="px-4 py-2 bg-slate-950 border border-white/5 rounded-full text-xs text-slate-400 hover:text-white hover:border-purple-500/30 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex gap-4",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                  msg.role === 'user' ? "bg-blue-500/20 border-blue-500/30" : "bg-purple-500/20 border-purple-500/30"
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-blue-400" /> : <Bot className="w-4 h-4 text-purple-400" />}
                </div>
                <div className={cn(
                  "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-950 border border-white/5 text-slate-300 rounded-tl-none"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center animate-pulse">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="bg-slate-950 border border-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            )}

            {variations.length > 0 && (
              <div className="space-y-3 pt-4">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Creative Variations</p>
                <div className="grid gap-2">
                  {variations.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(`I like variation: ${v}`)}
                      className="p-3 bg-slate-950 border border-purple-500/20 rounded-xl text-left text-xs text-slate-300 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex items-center justify-between group"
                    >
                      {v}
                      <ArrowRight className="w-3 h-3 text-purple-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-900/50 border-t border-white/5">
            <div className="relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message DevAi..."
                className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-4 pr-12 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all shadow-inner"
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-xl transition-all shadow-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="hidden md:flex md:w-1/2 flex-col bg-slate-950/50">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Live Build Preview
            </h3>
            {currentPreview && (
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-[10px] font-bold uppercase border border-purple-500/30">
                Step: {currentPreview.step}
              </span>
            )}
          </div>

          <div className="flex-1 p-8 overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="wait">
              {!currentPreview ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="relative">
                    <div className="w-32 h-32 bg-slate-900 rounded-3xl border border-white/5 flex items-center justify-center">
                      <Gamepad2 className="w-12 h-12 text-slate-800" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-2">No Active Build</h4>
                    <p className="text-slate-500 text-sm max-w-xs">
                      Start a conversation with DevAi to see live game concepts and assets here.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key={currentPreview.step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  {/* Visual Preview */}
                  <div className="aspect-video bg-slate-900 rounded-3xl border border-white/10 overflow-hidden relative group shadow-2xl">
                    <img 
                      src={currentPreview.image_url || `https://picsum.photos/seed/${currentPreview.step}/800/450`} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Coin Krazy Studios Branded</span>
                      </div>
                      <h4 className="text-2xl font-bold text-white">{currentPreview.title}</h4>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-900 border-white/5">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Palette className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Theme</p>
                          <p className="text-sm text-white font-medium capitalize">{currentPreview.step}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-white/5">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <Layout className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Status</p>
                          <p className="text-sm text-white font-medium">Drafting</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Description */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Build Notes</h5>
                    <p className="text-slate-300 text-sm leading-relaxed bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                      {currentPreview.description}
                    </p>
                  </div>

                  {/* Progress Steps */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Build Progress</h5>
                    <div className="flex justify-between relative">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/5 -translate-y-1/2" />
                      {['concept', 'art', 'ui', 'final'].map((s, i) => {
                        const steps = ['concept', 'theme', 'mechanics', 'art', 'ui', 'bonuses', 'thumbnail', 'final'];
                        const currentIndex = steps.indexOf(currentPreview.step);
                        const stepIndex = steps.indexOf(s);
                        const isCompleted = stepIndex < currentIndex;
                        const isCurrent = s === currentPreview.step;

                        return (
                          <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                              isCompleted ? "bg-emerald-500 border-emerald-500" : 
                              isCurrent ? "bg-purple-600 border-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.5)]" : 
                              "bg-slate-900 border-white/10"
                            )}>
                              {isCompleted ? <CheckCircle2 className="w-3 h-3 text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              isCurrent ? "text-purple-400" : "text-slate-600"
                            )}>{s}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {currentPreview?.step === 'final' && (
            <div className="p-6 bg-slate-900/50 border-t border-white/5">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-12 rounded-2xl shadow-lg shadow-emerald-900/20">
                <CheckCircle2 className="w-5 h-5" />
                Deploy Game to Production
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
