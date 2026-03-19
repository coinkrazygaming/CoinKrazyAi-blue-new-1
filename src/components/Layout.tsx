import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Home, 
  Gamepad2, 
  Trophy, 
  User, 
  Users,
  Wallet, 
  Settings, 
  MessageSquare, 
  Menu,
  X,
  ChevronRight,
  Coins,
  Medal,
  Ticket,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

import { useAuth } from '../contexts/AuthContext';
import AIChatWidget from './AIChatWidget';
import NewsTicker from './NewsTicker';
import UserDropdown from './UserDropdown';
import GlobalChat from './GlobalChat';
import DailyBonusModal from './DailyBonusModal';

export default function Layout() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Lobby', path: '/' },
    { icon: Gamepad2, label: 'Games', path: '/games' },
    { icon: Ticket, label: 'Scratch Tickets', path: '/games/scratch-tickets' },
    { icon: Layers, label: 'Pull Tabs', path: '/games/pull-tabs' },
    { icon: Trophy, label: 'Leaderboards', path: '/leaderboards' },
    { icon: Medal, label: 'Tournaments', path: '/tournaments' },
    { icon: Users, label: 'Community', path: '/community' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: MessageSquare, label: 'Support', path: '/support' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Header - Glassmorphism */}
      <header className="fixed top-0 left-0 right-0 h-20 glass-surface z-50 flex items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden hover:bg-white/5"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-white uppercase italic">
              CoinKrazy<span className="text-blue-500">AI</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-4 glass-surface rounded-2xl px-5 py-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.8)]" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white leading-none">{user.gc_balance.toLocaleString()}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Gold Coins</span>
                  </div>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white leading-none">{user.sc_balance.toFixed(2)}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Sweeps Coins</span>
                  </div>
                </div>
              </div>
              <Link to="/wallet">
                <Button variant="secondary" size="sm" className="hidden md:flex h-10 px-6 font-black uppercase italic tracking-tighter">
                  Buy Coins
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className={cn("relative hover:bg-white/5", isChatOpen && "text-blue-500 bg-blue-500/10")}
                >
                  <MessageSquare className="w-5 h-5" />
                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#020617]" />
                </Button>
                <UserDropdown />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login"><Button variant="ghost" className="font-bold">Login</Button></Link>
              <Link to="/register"><Button className="font-black uppercase italic tracking-tighter px-8">Join Now</Button></Link>
            </div>
          )}
        </div>
      </header>

      <NewsTicker />

      {/* Sidebar - Premium Feel */}
      <aside 
        className={cn(
          "fixed top-24 left-4 bottom-4 w-64 glass-surface rounded-[32px] z-40 transition-all duration-500 lg:translate-x-0",
          !isSidebarOpen && "-translate-x-[calc(100%+2rem)]"
        )}
      >
        <div className="h-full flex flex-col p-4">
          <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group relative",
                    isActive 
                      ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300")} />
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute left-0 w-1 h-6 bg-white rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5 group cursor-pointer hover:border-blue-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">AI Assistant</p>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20 group-hover:rotate-6 transition-transform">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-white">LuckyAI</p>
                  <p className="text-[10px] text-slate-500 font-bold">Ask me anything!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "pt-24 transition-all duration-500",
        isSidebarOpen ? "lg:ml-72" : "lg:ml-0",
        isChatOpen ? "lg:mr-80" : "lg:mr-0"
      )}>
        <div className="max-w-7xl mx-auto p-4 md:p-10">
          <Outlet />
        </div>
      </main>
      <GlobalChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <AIChatWidget />
      <DailyBonusModal />
    </div>
  );
}
