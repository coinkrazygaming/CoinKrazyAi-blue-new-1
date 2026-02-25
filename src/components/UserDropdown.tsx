import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Wallet, 
  Settings, 
  LogOut, 
  ShieldAlert, 
  Users,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

export default function UserDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-3 rounded-full border border-white/5 bg-slate-900/50 hover:bg-slate-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className="w-full h-full rounded-full object-cover" />
          ) : (
            user.username[0].toUpperCase()
          )}
        </div>
        <span className="text-sm font-medium text-slate-200 hidden md:block">{user.username}</span>
        <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-white/5 mb-2">
            <p className="text-sm font-bold text-white">{user.username}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            {user.role === 'admin' && (
              <span className="inline-block mt-2 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-500 uppercase">
                Admin
              </span>
            )}
          </div>

          <div className="space-y-1 px-2">
            <Link 
              to="/profile" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4 text-blue-500" />
              Profile Settings
            </Link>
            <Link 
              to="/wallet" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Wallet className="w-4 h-4 text-emerald-500" />
              Wallet Settings
            </Link>
            <Link 
              to="/profile" 
              className="flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Users className="w-4 h-4 text-purple-500" />
              Social Settings
            </Link>
            
            {user.role === 'admin' && (
              <>
                <div className="h-px bg-white/5 my-2 mx-2" />
                <Link 
                  to="/admin" 
                  className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin Panel
                </Link>
              </>
            )}
          </div>

          <div className="h-px bg-white/5 my-2" />

          <div className="px-2">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
