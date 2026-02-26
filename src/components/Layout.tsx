import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Home, 
  Gamepad2, 
  Trophy, 
  User, 
  Wallet, 
  Settings, 
  MessageSquare, 
  Menu,
  X,
  ChevronRight,
  Coins,
  Medal,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

import { useAuth } from '../contexts/AuthContext';
import AIChatWidget from './AIChatWidget';
import NewsTicker from './NewsTicker';
import UserDropdown from './UserDropdown';

export default function Layout() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Lobby', path: '/' },
    { icon: Gamepad2, label: 'Games', path: '/games' },
    { icon: Coins, label: 'Slots', path: '/games/slots' },
    { icon: Users, label: 'Live Casino', path: '/games/live-casino' },
    { icon: Trophy, label: 'Leaderboards', path: '/leaderboards' },
    { icon: Medal, label: 'Tournaments', path: '/tournaments' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: MessageSquare, label: 'Support', path: '/support' },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-bottom border-white/5 bg-[#020617]/80 backdrop-blur-md z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">CoinKrazy<span className="text-blue-500 italic">AI</span></span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 bg-slate-900/50 border border-white/5 rounded-full px-3 py-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                  <span className="text-sm font-mono font-medium">{user.gc_balance.toLocaleString()} <span className="text-[10px] text-slate-500">GC</span></span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-sm font-mono font-medium">{user.sc_balance.toFixed(2)} <span className="text-[10px] text-slate-500">SC</span></span>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="hidden md:flex">Buy Coins</Button>
              <div className="flex items-center gap-2">
                <UserDropdown />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link to="/register"><Button size="sm">Register</Button></Link>
            </div>
          )}
        </div>
      </header>

      <NewsTicker />

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-24 left-0 bottom-0 w-64 bg-[#020617] border-right border-white/5 z-40 transition-transform lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                location.pathname === item.path 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
              <span className="font-medium">{item.label}</span>
              {location.pathname === item.path && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-top border-white/5">
          <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">AI Manager</p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#020617] rounded-full" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">LuckyAI</p>
                <p className="text-[10px] text-emerald-500 font-medium">Online & Ready</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "pt-16 transition-all",
        isSidebarOpen ? "lg:ml-64" : "lg:ml-0"
      )}>
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
      <AIChatWidget />
    </div>
  );
}
