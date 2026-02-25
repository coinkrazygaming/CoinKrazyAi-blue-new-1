import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io } from 'socket.io-client';

interface User {
  id: number;
  email: string;
  username: string;
  gc_balance: number;
  sc_balance: number;
  vip_status?: string;
  avatar_url?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: any) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Socket Connection for Real-time Balance
  useEffect(() => {
    if (!user) return;

    const socket = io();
    
    socket.on('connect', () => {
      socket.emit('join-user-room', user.id);
    });

    socket.on('balance-update', (data: { gc_balance: number, sc_balance: number }) => {
      setUser(prev => prev ? { ...prev, ...data } : null);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]); // Only reconnect if user ID changes

  const login = (userData: any) => {
    setUser(userData.user);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
