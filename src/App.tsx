import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import Games from './pages/Games';
import Slots from './pages/games/Slots';
import Dice from './pages/games/Dice';
import Leaderboards from './pages/Leaderboards';
import Tournaments from './pages/Tournaments';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import CommunityPage from './pages/CommunityPage';
import ScratchTicketsPage from './pages/ScratchTicketsPage';
import PullTabsPage from './pages/PullTabsPage';

import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="games" element={<Games />} />
              <Route path="games/krazy-slots" element={<Slots />} />
              <Route path="games/neon-dice" element={<Dice />} />
              <Route path="leaderboards" element={<Leaderboards />} />
              <Route path="tournaments" element={<Tournaments />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="profile" element={<Profile />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="games/scratch-tickets" element={<ScratchTicketsPage />} />
              <Route path="games/pull-tabs" element={<PullTabsPage />} />
              <Route path="admin" element={<AdminPanel />} />
              <Route path="support" element={<div className="text-white">Support Page (Coming Soon)</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
