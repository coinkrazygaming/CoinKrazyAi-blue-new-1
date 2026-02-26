import React from 'react';
import { Community } from '../components/Community';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Users, Shield } from 'lucide-react';

const CommunityPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-[#020617] pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-12 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Community Hub</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
              The CoinKrazy <span className="text-emerald-500">Circle</span>
            </h1>
            <p className="text-zinc-400 mt-2 max-w-xl">
              Connect with fellow players, share strategies, and stay updated with the latest platform news.
            </p>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`}
                  className="w-8 h-8 rounded-full border-2 border-zinc-900"
                  alt=""
                />
              ))}
            </div>
            <div className="text-xs">
              <div className="text-white font-bold">1,284 Players</div>
              <div className="text-zinc-500">Currently Online</div>
            </div>
          </div>
        </div>

        <Community user={user} />
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            <Shield className="w-4 h-4 text-emerald-500" />
            SecurityAi Protected
          </div>
          <div className="w-px h-4 bg-zinc-800" />
          <div className="flex items-center gap-4">
            <a href="#" className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-wider transition-colors">Rules</a>
            <a href="#" className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-wider transition-colors">Guidelines</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
