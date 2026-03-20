import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
});

let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e) {
  console.warn('Failed to initialize GoogleGenAI:', e);
}

const JWT_SECRET = process.env.JWT_SECRET || 'coinkrazy-secret-key-123';
const PORT = 3000;

// Database Setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_QiSKHaT5GIR9@ep-summer-feather-amuu2q6b-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper to mimic better-sqlite3's interface for simpler migration
const db = {
  prepare: (sql: string) => {
    // Replace ? with $1, $2, etc.
    let index = 1;
    const pgSql = sql.replace(/\?/g, () => `$${index++}`);
    return {
      get: async (...params: any[]) => {
        const result = await pool.query(pgSql, params);
        return result.rows[0];
      },
      all: async (...params: any[]) => {
        const result = await pool.query(pgSql, params);
        return result.rows;
      },
      run: async (...params: any[]) => {
        const result = await pool.query(pgSql, params);
        return { lastInsertRowid: result.rows[0]?.id || null, changes: result.rowCount };
      }
    };
  },
  exec: async (sql: string) => {
    await pool.query(sql);
  },
  transaction: (fn: Function) => {
    return async (...args: any[]) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(client, ...args);
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    };
  }
};

// Initialize Schema
async function initSchema() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      gc_balance REAL DEFAULT 1000,
      sc_balance REAL DEFAULT 0,
      total_wagered REAL DEFAULT 0,
      vip_status TEXT DEFAULT 'Bronze',
      kyc_verified INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active',
      role TEXT DEFAULT 'player',
      referred_by INTEGER,
      referral_code TEXT UNIQUE,
      last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      kyc_status TEXT DEFAULT 'unverified',
      last_bonus_claim TIMESTAMP,
      login_streak INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS game_results (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES players(id),
      game_id INTEGER,
      bet_amount REAL NOT NULL,
      win_amount REAL NOT NULL,
      currency TEXT NOT NULL,
      multiplier REAL,
      details TEXT,
      result_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES players(id),
      content TEXT NOT NULL,
      type TEXT DEFAULT 'update',
      game_result_id INTEGER REFERENCES game_results(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id),
      player_id INTEGER NOT NULL REFERENCES players(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, player_id)
    );

    CREATE TABLE IF NOT EXISTS post_comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER NOT NULL REFERENCES posts(id),
      player_id INTEGER NOT NULL REFERENCES players(id),
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS referral_milestones (
      id SERIAL PRIMARY KEY,
      referral_id INTEGER NOT NULL,
      milestone TEXT NOT NULL,
      reward_gc REAL DEFAULT 0,
      reward_sc REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(referral_id, milestone)
    );

    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      thumbnail_url TEXT,
      theme TEXT DEFAULT 'classic',
      enabled INTEGER DEFAULT 1,
      rtp REAL DEFAULT 95.0,
      min_bet REAL DEFAULT 0.1,
      max_bet REAL DEFAULT 100.0,
      is_featured INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS admin_notifications (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      source_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kyc_documents (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES players(id),
      document_type TEXT NOT NULL,
      document_url TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES players(id),
      type TEXT NOT NULL,
      gc_amount REAL DEFAULT 0,
      sc_amount REAL DEFAULT 0,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES players(id),
      friend_id INTEGER NOT NULL REFERENCES players(id),
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, friend_id)
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id SERIAL PRIMARY KEY,
      title TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      requirement_type TEXT NOT NULL,
      requirement_value REAL NOT NULL,
      reward_gc REAL DEFAULT 0,
      reward_sc REAL DEFAULT 0,
      difficulty INTEGER DEFAULT 1,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS player_challenges (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES players(id),
      challenge_id INTEGER NOT NULL REFERENCES challenges(id),
      progress REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, challenge_id)
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      game_slug TEXT NOT NULL,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      entry_fee REAL DEFAULT 0,
      prize_pool REAL NOT NULL,
      currency TEXT DEFAULT 'gc',
      status TEXT DEFAULT 'active',
      scoring_type TEXT DEFAULT 'highest_win_multiplier',
      max_participants INTEGER DEFAULT 100,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tournament_participants (
      tournament_id INTEGER NOT NULL REFERENCES tournaments(id),
      player_id INTEGER NOT NULL REFERENCES players(id),
      score REAL DEFAULT 0,
      rank INTEGER,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(tournament_id, player_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL REFERENCES players(id),
      receiver_id INTEGER NOT NULL REFERENCES players(id),
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS game_chat_messages (
      id SERIAL PRIMARY KEY,
      game_slug TEXT NOT NULL,
      player_id INTEGER NOT NULL REFERENCES players(id),
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS game_builder_sessions (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER NOT NULL REFERENCES players(id),
      game_id INTEGER REFERENCES games(id),
      name TEXT,
      config TEXT,
      history TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS social_campaigns (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      platform TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      scheduled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_employees (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      description TEXT,
      avatar_url TEXT,
      status TEXT DEFAULT 'online',
      current_task TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_logs (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES ai_employees(id),
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_chats (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER NOT NULL REFERENCES ai_employees(id),
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coin_packages (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      gc_amount REAL NOT NULL,
      sc_amount REAL NOT NULL,
      price REAL NOT NULL,
      image_url TEXT,
      is_featured INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ticket_types (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      price_sc REAL NOT NULL,
      top_prize_sc REAL NOT NULL,
      total_tickets INTEGER NOT NULL,
      remaining_tickets INTEGER NOT NULL,
      odds_description TEXT,
      theme_images TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ticket_purchases (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES players(id),
      ticket_type_id INTEGER NOT NULL REFERENCES ticket_types(id),
      status TEXT DEFAULT 'purchased',
      is_win INTEGER DEFAULT 0,
      win_amount REAL DEFAULT 0,
      reveal_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_saved_wins (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES players(id),
      purchase_id INTEGER NOT NULL REFERENCES ticket_purchases(id),
      ticket_name TEXT NOT NULL,
      amount_won REAL NOT NULL,
      image_url TEXT,
      claimed INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS social_links (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES players(id),
      platform TEXT NOT NULL,
      platform_username TEXT,
      access_token TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(player_id, platform)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES players(id),
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS redemptions (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES players(id),
      amount_sc REAL NOT NULL,
      method TEXT NOT NULL,
      details TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      game_slug TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES players(id),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      icon TEXT,
      requirement_type TEXT NOT NULL,
      requirement_value REAL NOT NULL,
      reward_gc REAL DEFAULT 0,
      reward_sc REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS player_achievements (
      player_id INTEGER NOT NULL REFERENCES players(id),
      achievement_id INTEGER NOT NULL REFERENCES achievements(id),
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(player_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS bonuses (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      code TEXT UNIQUE,
      reward_gc REAL DEFAULT 0,
      reward_sc REAL DEFAULT 0,
      min_deposit REAL DEFAULT 0,
      wagering_requirement REAL DEFAULT 0,
      game_eligibility TEXT,
      max_win REAL,
      expiration_days INTEGER,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS player_bonuses (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES players(id),
      bonus_id INTEGER NOT NULL REFERENCES bonuses(id),
      status TEXT DEFAULT 'active',
      wagering_progress REAL DEFAULT 0,
      wagering_target REAL NOT NULL,
      expires_at TIMESTAMP,
      claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forum_boards (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      slug TEXT UNIQUE NOT NULL,
      display_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS forum_topics (
      id SERIAL PRIMARY KEY,
      board_id INTEGER NOT NULL REFERENCES forum_boards(id),
      author_id INTEGER NOT NULL REFERENCES players(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_pinned INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forum_posts (
      id SERIAL PRIMARY KEY,
      topic_id INTEGER NOT NULL REFERENCES forum_topics(id),
      author_id INTEGER NOT NULL REFERENCES players(id),
      content TEXT NOT NULL,
      parent_id INTEGER REFERENCES forum_posts(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS forum_likes (
      post_id INTEGER NOT NULL REFERENCES forum_posts(id),
      user_id INTEGER NOT NULL REFERENCES players(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS global_chat_messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES players(id),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS community_moderation_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES players(id),
      action TEXT NOT NULL,
      reason TEXT,
      duration_minutes INTEGER,
      moderator_id TEXT DEFAULT 'SecurityAi',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS player_community_status (
      player_id INTEGER PRIMARY KEY REFERENCES players(id),
      offense_count INTEGER DEFAULT 0,
      mute_until TIMESTAMP,
      is_banned INTEGER DEFAULT 0
    );
  `);
}

`);

// Initialize Settings
const initSettings = async () => {
  const defaultSettings = {
    'site_name': 'CoinKrazy AI',
    'maintenance_mode': 'false',
    'signup_bonus_gc': '10000',
    'signup_bonus_sc': '5',
    'referral_bonus_gc': '1000',
    'referral_bonus_sc': '1',
    'enable_cashapp': 'true',
    'enable_googlepay': 'true',
    'redemption_fee': '5',
    'min_redemption_sc': '100',
    'social_share_template': 'Just won {amount} SC on PlayCoinKrazy.com playing {ticket}! 🔥 Come play with me and use my referral code {code} for 1000 GC + 1 SC bonus when you sign up! → https://playcoinkrazy.com/register?ref={code}',
    'enable_social_facebook': 'true',
    'enable_social_twitter': 'true',
    'enable_social_instagram': 'true',
    'enable_social_tiktok': 'true',
  };
  
  const insert = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO NOTHING');
  for (const [k, v] of Object.entries(defaultSettings)) {
    await insert.run(k, v);
  }
};

// Seed Coin Packages
const seedPackages = async () => {
  const packages = [
    { name: 'Starter Pack', gc_amount: 10000, sc_amount: 5, price: 4.99, image_url: 'https://picsum.photos/seed/starter/200/200', is_featured: 0 },
    { name: 'Pro Pack', gc_amount: 50000, sc_amount: 25, price: 19.99, image_url: 'https://picsum.photos/seed/pro/200/200', is_featured: 1 },
    { name: 'Whale Pack', gc_amount: 250000, sc_amount: 125, price: 99.99, image_url: 'https://picsum.photos/seed/whale/200/200', is_featured: 0 },
  ];
  
  const insert = db.prepare('INSERT INTO coin_packages (name, gc_amount, sc_amount, price, image_url, is_featured) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING');
  for (const p of packages) {
    await insert.run(p.name, p.gc_amount, p.sc_amount, p.price, p.image_url, p.is_featured);
  }
};

// Seed AI Employees
const seedAiEmployees = async () => {
  const employees = [
    { name: 'DevAi', role: 'Lead Game Developer', description: 'Master of game mechanics, rebranding, and automated game pipelines.', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=DevAi' },
    { name: 'SocialAi', role: 'Social Media & Marketing Manager', description: 'Handles social media, email campaigns, SMS, and player retention.', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SocialAi' },
    { name: 'SecurityAi', role: 'Site Security', description: 'Monitors site safety, detects anomalies, and ensures player protection.', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SecurityAi' },
    { name: 'PlayersAi', role: 'Player Support', description: 'Assists with KYC verification, player inquiries, and support tickets.', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=PlayersAi' },
    { name: 'AdminAi', role: 'Admin Assistant', description: 'Suggests site updates, manages settings, and compiles reports.', avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminAi' },
  ];

  const insert = db.prepare('INSERT INTO ai_employees (name, role, description, avatar_url) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING');
  const check = db.prepare('SELECT id FROM ai_employees WHERE name = ?');
  
  for (const e of employees) {
    if (!(await check.get(e.name))) {
      await insert.run(e.name, e.role, e.description, e.avatar_url);
    }
  }
};

const seedForumBoards = async () => {
  const boards = [
    { name: 'General Discussion', description: 'Talk about anything platform related.', slug: 'general', display_order: 1 },
    { name: 'Game Discussions', description: 'Strategies, tips, and talk about your favorite games.', slug: 'games', display_order: 2 },
    { name: 'Wins & Losses', description: 'Share your big wins and epic losses.', slug: 'wins-losses', display_order: 3 },
    { name: 'Suggestions', description: 'Help us improve PlayCoinKrazy.com.', slug: 'suggestions', display_order: 4 },
    { name: 'Off-Topic', description: 'Anything else on your mind.', slug: 'off-topic', display_order: 5 },
  ];

  const insert = db.prepare('INSERT INTO forum_boards (name, description, slug, display_order) VALUES (?, ?, ?, ?) ON CONFLICT (slug) DO NOTHING');
  for (const b of boards) {
    await insert.run(b.name, b.description, b.slug, b.display_order);
  }
};

const startServer = async () => {
  await initSchema();
  await initSettings();
  await seedPackages();
  await seedAiEmployees();
  await seedForumBoards();
  await seedGames();
  await seedAchievements();
  await seedAdmin();
  await seedTournaments();
  await seedTicketTypes();
  await seedChallenges();
};

startServer();
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin Middleware
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// Admin Endpoints
app.get('/api/admin/stats', authenticate, isAdmin, async (req: any, res) => {
  try {
    const totalUsers = await db.prepare('SELECT COUNT(*) as count FROM players').get() as any;
    const totalWagered = await db.prepare('SELECT SUM(total_wagered) as amount FROM players').get() as any;
    const recentUsers = await db.prepare('SELECT * FROM players ORDER BY created_at DESC LIMIT 5').all();
    
    res.json({
      totalUsers: totalUsers.count,
      totalWagered: totalWagered.amount || 0,
      recentUsers
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/settings', authenticate, isAdmin, async (req: any, res) => {
  try {
    const settings = await db.prepare('SELECT * FROM site_settings').all();
    const settingsMap: any = {};
    settings.forEach((s: any) => settingsMap[s.key] = s.value);
    res.json(settingsMap);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/settings', authenticate, isAdmin, async (req: any, res) => {
  const settings = req.body;
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insert = db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value');
      for (const [k, v] of Object.entries(settings)) {
        await insert.run(k, String(v));
      }
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (error: any) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Notifications
app.get('/api/admin/notifications', authenticate, isAdmin, (req: any, res) => {
  try {
    const notifications = db.prepare('SELECT * FROM admin_notifications ORDER BY created_at DESC').all();
    res.json({ notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/notifications/:id/action', authenticate, isAdmin, (req: any, res) => {
  const { id } = req.params;
  const { status } = req.body; // approved, denied, actioned
  try {
    db.prepare('UPDATE admin_notifications SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manage Games
app.get('/api/admin/games', authenticate, isAdmin, (req: any, res) => {
  try {
    const games = db.prepare('SELECT * FROM games ORDER BY name ASC').all();
    res.json({ games });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/games/:id', authenticate, isAdmin, (req: any, res) => {
  const { id } = req.params;
  const { enabled, name, description, rtp, min_bet, max_bet } = req.body;
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (enabled !== undefined) { updates.push('enabled = ?'); values.push(enabled ? 1 : 0); }
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (rtp !== undefined) { updates.push('rtp = ?'); values.push(rtp); }
    if (min_bet !== undefined) { updates.push('min_bet = ?'); values.push(min_bet); }
    if (max_bet !== undefined) { updates.push('max_bet = ?'); values.push(max_bet); }
    
    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE games SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/games/:id', authenticate, isAdmin, (req: any, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM games WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Game Builder
app.post('/api/admin/ai/game-builder/chat', authenticate, isAdmin, async (req: any, res) => {
  const { message, sessionId, gameId } = req.body;
  
  try {
    let session;
    if (sessionId) {
      session = db.prepare('SELECT * FROM game_builder_sessions WHERE id = ?').get(sessionId) as any;
    } else {
      const result = db.prepare('INSERT INTO game_builder_sessions (admin_id, game_id, history) VALUES (?, ?, ?)')
        .run(req.user.id, gameId || null, JSON.stringify([]));
      session = { id: result.lastInsertRowid, history: '[]' };
    }

    const history = JSON.parse(session.history || '[]');
    history.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

    const prompt = `You are DevAi, the Lead Game Developer for PlayCoinKrazy.com. 
    You are using the AI Game Builder tool to help the admin create or rebrand a game.
    
    CRITICAL RULES:
    1. Every game MUST be branded "PlayCoinKrazy.com" and "Coin Krazy Studios".
    2. Suggest 3-5 creative variations before starting any new build.
    3. If a URL is provided, simulate crawling it and extracting theme, art, mechanics, etc.
    4. Always replace original branding with Coin Krazy Studios.
    5. Provide structured JSON in your response for "preview_data" if you are showing a step (concept, theme, mechanics, art, UI, bonuses, thumbnail, final).
    
    Session History: ${JSON.stringify(history.slice(-5))}
    Admin Message: "${message}"
    
    Respond in character as DevAi. If you are starting a build, suggest variations. If you are in the middle of a build, show the next step's preview data.`;

    if (!ai) {
      return res.status(503).json({ error: 'AI Service is currently unavailable. Please check your GEMINI_API_KEY.' });
    }

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            text: { type: 'STRING' },
            preview_data: { 
              type: 'OBJECT',
              properties: {
                step: { type: 'STRING' }, // concept, theme, mechanics, art, ui, bonuses, thumbnail, final
                title: { type: 'STRING' },
                description: { type: 'STRING' },
                image_url: { type: 'STRING' },
                config: { type: 'OBJECT' }
              }
            },
            variations: {
              type: 'ARRAY',
              items: { type: 'STRING' }
            }
          }
        }
      }
    });

    const responseData = JSON.parse(aiResponse.text || '{}');
    history.push({ role: 'ai', content: responseData.text, preview: responseData.preview_data, timestamp: new Date().toISOString() });

    db.prepare('UPDATE game_builder_sessions SET history = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(history), session.id);

    res.json({ 
      success: true, 
      sessionId: session.id,
      ...responseData
    });
  } catch (error: any) {
    console.error('Game Builder Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Social Campaigns
app.get('/api/admin/social/campaigns', authenticate, isAdmin, (req: any, res) => {
  try {
    const campaigns = db.prepare('SELECT * FROM social_campaigns ORDER BY created_at DESC').all();
    res.json({ campaigns });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/social/generate', authenticate, isAdmin, async (req: any, res) => {
  const { type, prompt: userPrompt } = req.body; // social_media, email, sms, retention
  
  try {
    const prompt = `You are SocialAi, the Marketing Manager for PlayCoinKrazy.com.
    Generate a ${type} campaign based on: "${userPrompt || 'General promotion'}".
    
    Requirements:
    - For social_media: Generate posts for Twitter and Instagram (captions, hashtags, image descriptions).
    - For email: Generate a subject line and HTML body.
    - For sms: Generate a short text message.
    - For retention: Include a personalized incentive (e.g. "Use code BACK25 for 25 free spins").
    
    Respond with JSON.`;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            content: { type: 'OBJECT' }
          }
        }
      }
    });

    const responseData = JSON.parse(aiResponse.text || '{}');
    
    const result = db.prepare('INSERT INTO social_campaigns (type, title, content, status) VALUES (?, ?, ?, ?)')
      .run(type, responseData.title, JSON.stringify(responseData.content), 'pending');

    // Also add to admin notifications
    db.prepare('INSERT INTO admin_notifications (type, source_id, title, content) VALUES (?, ?, ?, ?)')
      .run('social_campaign', result.lastInsertRowid, `New ${type} Campaign: ${responseData.title}`, `SocialAi has generated a new ${type} campaign for review.`);

    res.json({ success: true, campaignId: result.lastInsertRowid, ...responseData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Ticker Endpoint
app.get('/api/ticker', (req, res) => {
  try {
    const newUsers = db.prepare('SELECT username FROM players ORDER BY created_at DESC LIMIT 5').all();
    const recentWins = db.prepare(`
      SELECT p.username, gr.win_amount, gr.currency, g.name as game_name
      FROM game_results gr
      JOIN players p ON gr.player_id = p.id
      JOIN games g ON gr.game_id = g.id
      WHERE gr.win_amount > 0
      ORDER BY gr.created_at DESC
      LIMIT 10
    `).all();
    const topPlayers = db.prepare('SELECT username, total_wagered FROM players ORDER BY total_wagered DESC LIMIT 5').all();
    const latestAchievements = db.prepare(`
      SELECT p.username, a.name as achievement_name
      FROM player_achievements pa
      JOIN players p ON pa.player_id = p.id
      JOIN achievements a ON pa.achievement_id = a.id
      ORDER BY pa.unlocked_at DESC
      LIMIT 5
    `).all();
    
    // Mock data for deals/social since we don't have tables for them yet
    const deals = [
      { title: 'Welcome Bonus', description: 'Get 10,000 GC + 5 SC' },
      { title: 'Referral Bonus', description: 'Invite friends for 1,000 GC' }
    ];

    res.json({
      newUsers,
      recentWins,
      topPlayers,
      latestAchievements,
      deals
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SecurityAi Moderation Logic
const moderateContent = async (userId: number, content: string, type: 'chat' | 'forum') => {
  try {
    const prompt = `You are SecurityAi, the site moderator for PlayCoinKrazy.com. 
    Analyze the following ${type} content for swearing, slurs, advertisement links, spam, or off-topic promotions.
    Content: "${content}"
    
    If the content is safe, respond with "SAFE".
    If the content violates rules, respond with "VIOLATION: [Reason]".
    Be strict. Zero tolerance.`;

    if (!ai) return { safe: true };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });

    const result = response.text?.trim() || "SAFE";
    
    if (result.startsWith("VIOLATION")) {
      const reason = result.replace("VIOLATION:", "").trim();
      
      // Get current status
      let status = db.prepare('SELECT * FROM player_community_status WHERE player_id = ?').get(userId) as any;
      if (!status) {
        db.prepare('INSERT INTO player_community_status (player_id) VALUES (?)').run(userId);
        status = { player_id: userId, offense_count: 0, is_banned: 0 };
      }

      const newOffenseCount = status.offense_count + 1;
      let action = 'warning';
      let duration = 0;
      let muteUntil = null;
      let isBanned = 0;

      if (newOffenseCount === 1) {
        action = 'mute';
        duration = 5;
        muteUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      } else if (newOffenseCount === 2) {
        action = 'kick';
        duration = 60;
        muteUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      } else if (newOffenseCount >= 3) {
        action = 'ban';
        isBanned = 1;
      }

      // Update status
      db.prepare('UPDATE player_community_status SET offense_count = ?, mute_until = ?, is_banned = ? WHERE player_id = ?')
        .run(newOffenseCount, muteUntil, isBanned, userId);

      // Log action
      db.prepare('INSERT INTO community_moderation_logs (user_id, action, reason, duration_minutes) VALUES (?, ?, ?, ?)')
        .run(userId, action, reason, duration);

      // Add notification for admin
      db.prepare('INSERT INTO admin_notifications (type, title, content) VALUES (?, ?, ?)')
        .run('ai_task', `SecurityAi: ${action.toUpperCase()} issued to user #${userId}`, `Reason: ${reason}. Offense #${newOffenseCount}`);

      return { safe: false, action, reason, muteUntil, isBanned };
    }

    return { safe: true };
  } catch (error) {
    console.error('Moderation Error:', error);
    return { safe: true }; // Fail safe
  }
};

// Update Challenge Progress
const updateChallengeProgress = (userId: number, gameId: number, betAmount: number, winAmount: number, currency: string, multiplier: number) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const activeChallenges = db.prepare(`
      SELECT pc.id as player_challenge_id, c.*, pc.progress 
      FROM player_challenges pc
      JOIN challenges c ON pc.challenge_id = c.id
      WHERE pc.player_id = ? AND pc.status = 'active' AND date(pc.started_at) = date(?)
    `).all(userId, today) as any[];

    for (const challenge of activeChallenges) {
      let newProgress = challenge.progress;
      let completed = false;

      if (challenge.requirement_type === 'total_wager') {
        newProgress += betAmount;
        if (newProgress >= challenge.requirement_value) completed = true;
      } else if (challenge.requirement_type === 'specific_game_win' && winAmount > 0) {
        newProgress += 1;
        if (newProgress >= challenge.requirement_value) completed = true;
      } else if (challenge.requirement_type === 'play_count') {
        newProgress += 1;
        if (newProgress >= challenge.requirement_value) completed = true;
      } else if (challenge.requirement_type === 'multiplier' && multiplier >= challenge.requirement_value) {
        completed = true;
      }

      if (completed) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await db.prepare('UPDATE player_challenges SET progress = ?, status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(challenge.requirement_value, 'completed', challenge.player_challenge_id);
          
          // Award rewards
          if (challenge.reward_gc > 0 || challenge.reward_sc > 0) {
            await db.prepare('UPDATE players SET gc_balance = gc_balance + ?, sc_balance = sc_balance + ? WHERE id = ?')
              .run(challenge.reward_gc, challenge.reward_sc, userId);
            
            await db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
              .run(userId, 'bonus', challenge.reward_gc, challenge.reward_sc, `Challenge Completed: ${challenge.title}`);
            
            // Notify via socket
            const user = await db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(userId) as any;
            io.to(`user-${userId}`).emit('balance-update', {
              gc_balance: user.gc_balance,
              sc_balance: user.sc_balance
            });
            io.to(`user-${userId}`).emit('notification', {
              title: 'Challenge Completed!',
              message: `You've completed "${challenge.title}" and earned ${challenge.reward_gc} GC and ${challenge.reward_sc} SC!`,
              type: 'success'
            });
          }
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } else if (newProgress !== challenge.progress) {
        db.prepare('UPDATE player_challenges SET progress = ? WHERE id = ?').run(newProgress, challenge.player_challenge_id);
      }
    }
  } catch (error) {
    console.error('Challenge Progress Update Error:', error);
  }
};

// Seed Challenges
const seedChallenges = async () => {
  const challenges = [
    { title: 'Slot Enthusiast', description: 'Play 10 slot spins', requirement_type: 'play_count', requirement_value: 10, reward_gc: 500, reward_sc: 0, difficulty: 1 },
    { title: 'High Roller', description: 'Wager 5000 GC in any game', requirement_type: 'total_wager', requirement_value: 5000, reward_gc: 2000, reward_sc: 0, difficulty: 2 },
    { title: 'Lucky Strike', description: 'Win a game with at least a 5x multiplier', requirement_type: 'multiplier', requirement_value: 5, reward_gc: 0, reward_sc: 0.5, difficulty: 3 },
    { title: 'Dice Master', description: 'Play 20 dice rolls', requirement_type: 'play_count', requirement_value: 20, reward_gc: 1000, reward_sc: 0, difficulty: 2 },
    { title: 'Big Winner', description: 'Win 5 games with any multiplier', requirement_type: 'specific_game_win', requirement_value: 5, reward_gc: 0, reward_sc: 1, difficulty: 4 },
  ];

  const insert = db.prepare('INSERT INTO challenges (title, description, requirement_type, requirement_value, reward_gc, reward_sc, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (title) DO NOTHING');
  const check = db.prepare('SELECT id FROM challenges WHERE title = ?');
  
  for (const c of challenges) {
    if (!(await check.get(c.title))) {
      await insert.run(c.title, c.description, c.requirement_type, c.requirement_value, c.reward_gc, c.reward_sc, c.difficulty);
    }
  }
};

seedChallenges();

// API Routes
app.get('/api/challenges', authenticate, (req: any, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Check if user has challenges for today
    const userChallenges = db.prepare(`
      SELECT pc.*, c.title, c.description, c.requirement_type, c.requirement_value, c.reward_gc, c.reward_sc, c.difficulty
      FROM player_challenges pc
      JOIN challenges c ON pc.challenge_id = c.id
      WHERE pc.player_id = ? AND date(pc.started_at) = date(?)
    `).all(userId, today) as any[];

    if (userChallenges.length === 0) {
      // Assign 3 random challenges for today
      const allChallenges = db.prepare('SELECT id FROM challenges').all() as any[];
      const randomChallenges = allChallenges.sort(() => 0.5 - Math.random()).slice(0, 3);
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const insert = db.prepare('INSERT INTO player_challenges (player_id, challenge_id, status) VALUES (?, ?, ?)');
        for (const c of randomChallenges) {
          await insert.run(userId, c.id, 'active');
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      // Fetch again
      const newChallenges = db.prepare(`
        SELECT pc.*, c.title, c.description, c.requirement_type, c.requirement_value, c.reward_gc, c.reward_sc, c.difficulty
        FROM player_challenges pc
        JOIN challenges c ON pc.challenge_id = c.id
        WHERE pc.player_id = ? AND date(pc.started_at) = date(?)
      `).all(userId, today);
      
      return res.json({ challenges: newChallenges });
    }

    res.json({ challenges: userChallenges });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Endpoints
app.post('/api/auth/register', async (req, res) => {
  const { email, username, password, referralCode } = req.body;
  
  try {
    const password_hash = await bcrypt.hash(password, 12);
    const newReferralCode = username.toLowerCase() + Math.random().toString(36).substring(2, 6);
    
    // Check for referrer
    let referrerId = null;
    if (referralCode) {
      const referrer = db.prepare('SELECT id FROM players WHERE referral_code = ?').get(referralCode) as any;
      if (referrer) referrerId = referrer.id;
    }

    const settings = db.prepare('SELECT * FROM site_settings').all() as any[];
    const settingsMap: any = {};
    settings.forEach(s => settingsMap[s.key] = s.value);

    const signupBonusGC = parseInt(settingsMap.signup_bonus_gc || '10000');
    const signupBonusSC = parseFloat(settingsMap.signup_bonus_sc || '5');
    const referralBonusGC = parseInt(settingsMap.referral_bonus_gc || '1000');
    const referralBonusSC = parseFloat(settingsMap.referral_bonus_sc || '1');

    let newUserId: any;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Create User
      const stmt = db.prepare('INSERT INTO players (email, username, password_hash, referral_code, referred_by, gc_balance, sc_balance) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const result = await stmt.run(email, username, password_hash, newReferralCode, referrerId, signupBonusGC, signupBonusSC);
      newUserId = result.lastInsertRowid;

      // Handle Referral Logic
      if (referrerId) {
        // Bonus for Referrer
        await db.prepare('UPDATE players SET gc_balance = gc_balance + ?, sc_balance = sc_balance + ? WHERE id = ?')
          .run(referralBonusGC, referralBonusSC, referrerId);
        
        // Bonus for New User (on top of signup bonus)
        await db.prepare('UPDATE players SET gc_balance = gc_balance + ?, sc_balance = sc_balance + ? WHERE id = ?')
          .run(referralBonusGC, referralBonusSC, newUserId);

        // Record Milestone
        await db.prepare('INSERT INTO referral_milestones (referral_id, milestone, reward_gc, reward_sc) VALUES (?, ?, ?, ?)')
          .run(newUserId, 'signup', referralBonusGC, referralBonusSC);

        // Create Friendship
        await db.prepare('INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)')
          .run(referrerId, newUserId, 'accepted');

        // Log Transactions
        await db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
          .run(referrerId, 'Referral', referralBonusGC, referralBonusSC, `Referral bonus for inviting ${username}`);
        
        await db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
          .run(newUserId, 'Referral', referralBonusGC, referralBonusSC, 'Referral bonus for accepting invite');
          
        // Notify Referrer via socket
        const referrer = await db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(referrerId) as any;
        io.to(`user-${referrerId}`).emit('balance-update', {
          gc_balance: referrer.gc_balance,
          sc_balance: referrer.sc_balance
        });
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    const token = jwt.sign({ id: newUserId, email, username, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
    
    res.json({ 
      user: { id: newUserId, email, username, role: 'user', gc_balance: signupBonusGC, sc_balance: signupBonusSC } 
    });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email or username already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = db.prepare('SELECT * FROM players WHERE email = ?').get(email) as any;
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
    
    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username, 
        role: user.role,
        gc_balance: user.gc_balance, 
        sc_balance: user.sc_balance,
        avatar_url: user.avatar_url,
        vip_status: user.vip_status
      } 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT id, email, username, role, gc_balance, sc_balance, avatar_url, vip_status, referral_code, kyc_status, cashapp_tag, last_bonus_claim, login_streak FROM players WHERE id = ?').get(decoded.id) as any;
    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Wallet Endpoints
app.post('/api/auth/daily-bonus', authenticate, (req: any, res) => {
  try {
    const user = db.prepare('SELECT last_bonus_claim, login_streak, gc_balance, sc_balance FROM players WHERE id = ?').get(req.user.id) as any;
    const now = new Date();
    const lastClaim = user.last_bonus_claim ? new Date(user.last_bonus_claim) : null;
    
    // Check if already claimed today (within 24h)
    if (lastClaim && (now.getTime() - lastClaim.getTime()) < 24 * 60 * 60 * 1000) {
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      return res.status(400).json({ 
        error: 'Bonus already claimed', 
        nextClaim: nextClaim.toISOString() 
      });
    }
    
    let newStreak = 1;
    if (lastClaim) {
      const diffHours = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
      if (diffHours < 48) {
        newStreak = (user.login_streak || 0) + 1;
      } else {
        newStreak = 1;
      }
    }

    let rewardGc = 10 + (Math.min(newStreak, 7) - 1) * 10;
    let rewardSc = 1 + (Math.min(newStreak, 7) - 1) * 0.5;
    
    if (newStreak >= 7) {
      rewardGc = 100;
      rewardSc = 5;
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await db.prepare('UPDATE players SET gc_balance = gc_balance + ?, sc_balance = sc_balance + ?, last_bonus_claim = ?, login_streak = ? WHERE id = ?')
        .run(rewardGc, rewardSc, now.toISOString(), newStreak, req.user.id);
      
      await db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
        .run(req.user.id, 'Bonus', rewardGc, rewardSc, `Daily Login Bonus (Day ${newStreak} Streak)`);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    const updatedUser = db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(req.user.id) as any;
    
    // Notify via socket
    io.to(`user-${req.user.id}`).emit('balance-update', {
      gc_balance: updatedUser.gc_balance,
      sc_balance: updatedUser.sc_balance
    });

    io.to(`user-${req.user.id}`).emit('notification', {
      title: 'Daily Bonus Claimed!',
      message: `You received ${rewardGc} GC and ${rewardSc} SC! Streak: ${newStreak} days.`,
      type: 'success'
    });

    res.json({ 
      message: 'Bonus claimed successfully!', 
      rewardGc,
      rewardSc,
      streak: newStreak,
      newGcBalance: updatedUser.gc_balance,
      newScBalance: updatedUser.sc_balance
    });

    // Notify via socket
    io.to(`user-${req.user.id}`).emit('balance-update', {
      gc_balance: updatedUser.gc_balance,
      sc_balance: updatedUser.sc_balance
    });

    io.to(`user-${req.user.id}`).emit('notification', {
      title: 'Daily Bonus Claimed!',
      message: `You received ${rewardGc} GC and ${rewardSc} SC. Streak: ${newStreak} days!`,
      type: 'success'
    });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/wallet/transactions', authenticate, (req: any, res) => {
  try {
    const transactions = db.prepare('SELECT * FROM wallet_transactions WHERE player_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
    res.json({ transactions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Store Endpoints
app.get('/api/store/packages', authenticate, (req: any, res) => {
  try {
    const packages = db.prepare('SELECT * FROM coin_packages ORDER BY price ASC').all();
    res.json({ packages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/store/purchase', authenticate, (req: any, res) => {
  const { packId, paymentMethod } = req.body; // paymentMethod: 'cashapp' or 'googlepay'
  
  try {
    const pack = db.prepare('SELECT * FROM coin_packages WHERE id = ?').get(packId) as any;
    if (!pack) return res.status(400).json({ error: 'Invalid pack' });
    
    // In a real app, we would verify payment here
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Update player balance
      await db.prepare('UPDATE players SET gc_balance = gc_balance + ?, sc_balance = sc_balance + ? WHERE id = ?')
        .run(pack.gc_amount, pack.sc_amount, req.user.id);
      
      // Log transaction
      await db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
        .run(req.user.id, 'purchase', pack.gc_amount, pack.sc_amount, `Purchased ${pack.name} via ${paymentMethod}`);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    // Check for first_deposit milestone
    const userProfile = db.prepare('SELECT referred_by, username FROM players WHERE id = ?').get(req.user.id) as any;
    if (userProfile && userProfile.referred_by) {
      const existing = db.prepare('SELECT id FROM referral_milestones WHERE referral_id = ? AND milestone = ?').get(req.user.id, 'first_deposit');
      if (!existing) {
        const rewardGC = 10000;
        const rewardSC = 10;
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await db.prepare('INSERT INTO referral_milestones (referral_id, milestone, reward_gc, reward_sc) VALUES (?, ?, ?, ?)')
            .run(req.user.id, 'first_deposit', rewardGC, rewardSC);
          
          await db.prepare('UPDATE players SET gc_balance = gc_balance + ?, sc_balance = sc_balance + ? WHERE id = ?')
            .run(rewardGC, rewardSC, userProfile.referred_by);
          
          await db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
            .run(userProfile.referred_by, 'Referral', rewardGC, rewardSC, `First deposit bonus from referral ${userProfile.username}`);
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }

        // Notify Referrer
        const referrer = db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(userProfile.referred_by) as any;
        io.to(`user-${userProfile.referred_by}`).emit('balance-update', {
          gc_balance: referrer.gc_balance,
          sc_balance: referrer.sc_balance
        });
        io.to(`user-${userProfile.referred_by}`).emit('notification', {
          title: 'Referral Bonus!',
          message: `Your referral made their first deposit! You earned ${rewardGC} GC and ${rewardSC} SC.`,
          type: 'success'
        });
      }
    }

    const user = db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(req.user.id) as any;
    
    // Notify via socket
    io.to(`user-${req.user.id}`).emit('balance-update', {
      gc_balance: user.gc_balance,
      sc_balance: user.sc_balance
    });

    res.json({ success: true, balances: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Redemption Endpoints
app.post('/api/wallet/redeem', authenticate, (req: any, res) => {
  const { amountSC, paymentMethod, paymentDetails } = req.body;
  
  try {
    const user = db.prepare('SELECT * FROM players WHERE id = ?').get(req.user.id) as any;
    const settings = db.prepare('SELECT * FROM site_settings').all() as any[];
    const settingsMap: any = {};
    settings.forEach(s => settingsMap[s.key] = s.value);
    
    // Checks
    if (user.kyc_status !== 'verified') return res.status(400).json({ error: 'KYC verification required' });
    if (amountSC < parseFloat(settingsMap.min_redemption_sc || '100')) return res.status(400).json({ error: `Minimum redemption is ${settingsMap.min_redemption_sc} SC` });
    if (user.sc_balance < amountSC) return res.status(400).json({ error: 'Insufficient SC balance' });
    
    const fee = parseFloat(settingsMap.redemption_fee || '5');
    const payoutAmount = amountSC - fee; // Or amountSC? Prompt says "$5 service fee". Usually deducted from payout.
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Deduct SC immediately
      await db.prepare('UPDATE players SET sc_balance = sc_balance - ? WHERE id = ?')
        .run(amountSC, req.user.id);
        
      // Create Request
      await db.prepare('INSERT INTO redemption_requests (player_id, amount_sc, payout_amount, payment_method, payment_details, status) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.id, amountSC, payoutAmount, paymentMethod, paymentDetails, 'pending');
        
      // Log Transaction
      await db.prepare('INSERT INTO wallet_transactions (player_id, type, sc_amount, description) VALUES (?, ?, ?, ?)')
        .run(req.user.id, 'redemption_request', -amountSC, `Redemption request for ${amountSC} SC`);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    const updatedUser = db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(req.user.id) as any;
    io.to(`user-${req.user.id}`).emit('balance-update', {
      gc_balance: updatedUser.gc_balance,
      sc_balance: updatedUser.sc_balance
    });
    
    res.json({ success: true, message: 'Redemption request submitted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// KYC Endpoints
app.post('/api/user/kyc/request', authenticate, (req: any, res) => {
  try {
    db.prepare("UPDATE players SET kyc_status = 'pending' WHERE id = ?").run(req.user.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/profile/update', authenticate, (req: any, res) => {
  const { cashappTag } = req.body;
  try {
    db.prepare('UPDATE players SET cashapp_tag = ? WHERE id = ?').run(cashappTag, req.user.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/avatar/update', authenticate, (req: any, res) => {
  const { avatar_url } = req.body;
  try {
    db.prepare('UPDATE players SET avatar_url = ? WHERE id = ?').run(avatar_url, req.user.id);
    res.json({ success: true, avatar_url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Seed Games
const seedGames = async () => {
  const games = [
    { name: 'Krazy Slots', type: 'slots', slug: 'krazy-slots', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/slots/400/300', theme: 'classic' },
    { name: 'Krazy Sweets', type: 'slots', slug: 'krazy-sweets', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/sweets/400/300', theme: 'sweets' },
    { name: 'Dog House Krazy', type: 'slots', slug: 'dog-house-krazy', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/dog/400/300', theme: 'dog' },
    { name: 'Gates of Krazy', type: 'slots', slug: 'gates-of-krazy', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/gates/400/300', theme: 'gates' },
    { name: 'Krazy Rush', type: 'slots', slug: 'krazy-rush', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/rush/400/300', theme: 'rush' },
    { name: 'Big Bass Krazy', type: 'slots', slug: 'big-bass-krazy', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/bass/400/300', theme: 'bass' },
    { name: 'Krazy Wolf', type: 'slots', slug: 'krazy-wolf', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/wolf/400/300', theme: 'wolf' },
    { name: 'Krazy Buffalo', type: 'slots', slug: 'krazy-buffalo', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/buffalo/400/300', theme: 'buffalo' },
    { name: 'Krazy Rhino', type: 'slots', slug: 'krazy-rhino', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/rhino/400/300', theme: 'rhino' },
    { name: 'Krazy Gems', type: 'slots', slug: 'krazy-gems', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/gems/400/300', theme: 'gems' },
    { name: 'Krazy Joker', type: 'slots', slug: 'krazy-joker', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/joker/400/300', theme: 'joker' },
    { name: 'Krazy Fruits', type: 'slots', slug: 'krazy-fruits', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/fruits/400/300', theme: 'fruits' },
    { name: 'Krazy Gold', type: 'slots', slug: 'krazy-gold', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/gold/400/300', theme: 'gold' },
    { name: 'Krazy Knights', type: 'slots', slug: 'krazy-knights', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/knights/400/300', theme: 'knights' },
    { name: 'Krazy Leprechaun', type: 'slots', slug: 'krazy-leprechaun', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/leprechaun/400/300', theme: 'leprechaun' },
    { name: 'Krazy Madame', type: 'slots', slug: 'krazy-madame', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/madame/400/300', theme: 'madame' },
    { name: 'Krazy Mustang', type: 'slots', slug: 'krazy-mustang', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/mustang/400/300', theme: 'mustang' },
    { name: 'Krazy Panda', type: 'slots', slug: 'krazy-panda', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/panda/400/300', theme: 'panda' },
    { name: 'Krazy Princess', type: 'slots', slug: 'krazy-princess', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/princess/400/300', theme: 'princess' },
    { name: 'Krazy Safari', type: 'slots', slug: 'krazy-safari', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/safari/400/300', theme: 'safari' },
    { name: 'Krazy Shark', type: 'slots', slug: 'krazy-shark', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/shark/400/300', theme: 'shark' },
    { name: 'Krazy Spartan', type: 'slots', slug: 'krazy-spartan', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/spartan/400/300', theme: 'spartan' },
    { name: 'Krazy Tiki', type: 'slots', slug: 'krazy-tiki', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/tiki/400/300', theme: 'tiki' },
    { name: 'Krazy Vampire', type: 'slots', slug: 'krazy-vampire', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/vampire/400/300', theme: 'vampire' },
    { name: 'Krazy Viking', type: 'slots', slug: 'krazy-viking', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/viking/400/300', theme: 'viking' },
    { name: 'Krazy Zeus', type: 'slots', slug: 'krazy-zeus', rtp: 96.5, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/zeus/400/300', theme: 'zeus' },
    { name: 'Neon Dice', type: 'dice', slug: 'neon-dice', rtp: 98.0, min_bet: 1, max_bet: 5000, thumbnail_url: 'https://picsum.photos/seed/dice/400/300', theme: 'classic' },
    { name: 'Scratch Tickets', type: 'scratch', slug: 'scratch-tickets', rtp: 94.0, min_bet: 0.5, max_bet: 5, thumbnail_url: 'https://picsum.photos/seed/scratch/400/300', theme: 'classic' },
    { name: 'Pull Tabs', type: 'pulltab', slug: 'pull-tabs', rtp: 94.0, min_bet: 0.5, max_bet: 5, thumbnail_url: 'https://picsum.photos/seed/pulltab/400/300', theme: 'classic' },
    { name: 'Krazy Crash', type: 'crash', slug: 'krazy-crash', rtp: 97.0, min_bet: 1, max_bet: 1000, thumbnail_url: 'https://picsum.photos/seed/crash/400/300', theme: 'classic' },
  ];
  
  const insert = db.prepare('INSERT INTO games (name, type, slug, rtp, min_bet, max_bet, thumbnail_url, theme) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (slug) DO NOTHING');
  for (const g of games) {
    await insert.run(g.name, g.type, g.slug, g.rtp, g.min_bet, g.max_bet, g.thumbnail_url, g.theme);
  }
};

const seedAchievements = async () => {
  const achievements = [
    { name: 'First Win', description: 'Win your first game', icon: '🏆', requirement_type: 'win_count', requirement_value: 1 },
    { name: 'High Roller', description: 'Wager a total of 10,000 GC', icon: '💎', requirement_type: 'total_wagered', requirement_value: 10000 },
    { name: 'Lucky Strike', description: 'Win a multiplier of 50x or more', icon: '⚡', requirement_type: 'max_multiplier', requirement_value: 50 },
  ];
  
  const insert = db.prepare('INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES (?, ?, ?, ?, ?) ON CONFLICT (name) DO NOTHING');
  for (const a of achievements) {
    await insert.run(a.name, a.description, a.icon, a.requirement_type, a.requirement_value);
  }
};

const seedAdmin = async () => {
  const adminEmail = 'coinkrazy26@gmail.com';
  const adminUsername = 'admin';
  const adminPassword = 'admin123';
  
  const existingAdmin = await db.prepare('SELECT id FROM players WHERE email = ?').get(adminEmail);
  
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.prepare("INSERT INTO players (email, username, password_hash, gc_balance, sc_balance, role) VALUES (?, ?, ?, ?, ?, 'admin')")
      .run(adminEmail, adminUsername, passwordHash, 1000000, 1000);
    console.log('Admin user created successfully');
  } else {
    // Ensure admin role is set for existing admin
    await db.prepare("UPDATE players SET role = 'admin' WHERE email = ?").run(adminEmail);
  }
};

const seedTournaments = async () => {
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  
  const tournaments = [
    {
      name: 'Daily Slots Sprint',
      game_slug: 'krazy-slots',
      start_time: new Date(now.getTime() - oneDay).toISOString(), // Started yesterday
      end_time: new Date(now.getTime() + oneDay).toISOString(), // Ends tomorrow
      entry_fee: 1000,
      prize_pool: 100000,
      currency: 'gc',
      status: 'active',
      scoring_type: 'highest_win_multiplier'
    },
    {
      name: 'High Roller Dice',
      game_slug: 'neon-dice',
      start_time: new Date(now.getTime() + oneDay).toISOString(), // Starts tomorrow
      end_time: new Date(now.getTime() + oneDay * 2).toISOString(),
      entry_fee: 5000,
      prize_pool: 500000,
      currency: 'gc',
      status: 'upcoming',
      scoring_type: 'total_wagered'
    }
  ];
  
  const insert = db.prepare('INSERT INTO tournaments (name, game_slug, start_time, end_time, entry_fee, prize_pool, currency, status, scoring_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (name) DO NOTHING');
  
  // Check if tournaments exist to avoid duplicates on restart
  const count = await db.prepare('SELECT COUNT(*) as count FROM tournaments').get() as any;
  if (count.count === 0) {
    for (const t of tournaments) {
      await insert.run(t.name, t.game_slug, t.start_time, t.end_time, t.entry_fee, t.prize_pool, t.currency, t.status, t.scoring_type);
    }
    console.log('Tournaments seeded');
  }
};

const seedTicketTypes = async () => {
  const types = [
    { type: 'scratch', name: 'Neon Nights', description: 'Scratch to reveal neon prizes!', price_sc: 1.00, theme_images: JSON.stringify(['https://picsum.photos/seed/neon/800/600']) },
    { type: 'scratch', name: 'Golden Galaxy', description: 'The universe is full of gold!', price_sc: 5.00, theme_images: JSON.stringify(['https://picsum.photos/seed/galaxy/800/600']) },
    { type: 'pulltab', name: 'Lucky Leprechaun', description: 'Pull the tabs for the pot of gold!', price_sc: 1.00, theme_images: JSON.stringify(['https://picsum.photos/seed/leprechaun/800/600']) },
    { type: 'pulltab', name: 'Cherry Blast', description: 'Classic fruit machine pull tabs.', price_sc: 2.00, theme_images: JSON.stringify(['https://picsum.photos/seed/cherry/800/600']) },
  ];

  const insert = db.prepare('INSERT INTO ticket_types (type, name, description, price_sc, theme_images, top_prize_sc, total_tickets, remaining_tickets) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (name) DO NOTHING');
  const count = await db.prepare('SELECT COUNT(*) as count FROM ticket_types').get() as any;
  if (count.count === 0) {
    for (const t of types) {
      await insert.run(t.type, t.name, t.description, t.price_sc, t.theme_images, 100, 1000, 1000);
    }
    console.log('Ticket types seeded');
  }
};

// Seeding is handled in startServer()
// seedGames();
// seedAchievements();
// seedAdmin();
// seedTournaments();
// seedTicketTypes();

// Tournaments Endpoints
app.get('/api/tournaments', (req: any, res) => {
  try {
    const tournaments = db.prepare(`
      SELECT t.*, COUNT(tp.player_id) as participant_count,
      CASE 
        WHEN ? IS NOT NULL THEN (SELECT 1 FROM tournament_participants WHERE tournament_id = t.id AND player_id = ?)
        ELSE 0
      END as is_joined
      FROM tournaments t
      LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id
      WHERE t.status != 'completed' OR t.end_time > NOW() - INTERVAL '1 day'
      GROUP BY t.id
      ORDER BY t.status = 'active' DESC, t.start_time ASC
    `).all(req.user?.id || null, req.user?.id || null);
    res.json({ tournaments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tournaments/:id', (req, res) => {
  const { id } = req.params;
  try {
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id) as any;
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    
    const participants = db.prepare(`
      SELECT tp.*, p.username, p.avatar_url
      FROM tournament_participants tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.tournament_id = ?
      ORDER BY tp.score DESC
      LIMIT 50
    `).all(id);
    
    res.json({ tournament, participants });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tournaments/:id/join', authenticate, (req: any, res) => {
  const { id } = req.params;
  try {
    const tournament = db.prepare('SELECT * FROM tournaments WHERE id = ?').get(id) as any;
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    
    if (tournament.status === 'completed') return res.status(400).json({ error: 'Tournament ended' });
    
    const existing = db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? AND player_id = ?')
      .get(id, req.user.id);
      
    if (existing) return res.status(400).json({ error: 'Already joined' });
    
    const user = db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(req.user.id) as any;
    const balance = tournament.currency === 'gc' ? user.gc_balance : user.sc_balance;
    
    if (balance < tournament.entry_fee) return res.status(400).json({ error: 'Insufficient balance' });
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (tournament.entry_fee > 0) {
        if (tournament.currency === 'gc') {
          await db.prepare('UPDATE players SET gc_balance = gc_balance - ? WHERE id = ?').run(tournament.entry_fee, req.user.id);
        } else {
          await db.prepare('UPDATE players SET sc_balance = sc_balance - ? WHERE id = ?').run(tournament.entry_fee, req.user.id);
        }
        
        await db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
          .run(req.user.id, 'tournament_entry', 
            tournament.currency === 'gc' ? -tournament.entry_fee : 0,
            tournament.currency === 'sc' ? -tournament.entry_fee : 0,
            `Entry fee for ${tournament.name}`
          );
      }
      
      await db.prepare('INSERT INTO tournament_participants (tournament_id, player_id) VALUES (?, ?)')
        .run(id, req.user.id);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    // Notify via socket
    const updatedUser = db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(req.user.id) as any;
    io.to(`user-${req.user.id}`).emit('balance-update', {
      gc_balance: updatedUser.gc_balance,
      sc_balance: updatedUser.sc_balance
    });
    
    res.json({ success: true, message: 'Joined tournament successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper to update tournament scores
const updateTournamentScore = (userId: number, gameSlug: string, betAmount: number, winAmount: number, multiplier: number, currency: string) => {
  try {
    // Find active tournaments for this game and currency
    const tournaments = db.prepare(`
      SELECT t.id, t.scoring_type 
      FROM tournaments t
      JOIN tournament_participants tp ON t.id = tp.tournament_id
      WHERE t.game_slug = ? 
      AND t.currency = ?
      AND t.status = 'active'
      AND tp.player_id = ?
    `).all(gameSlug, currency, userId);
    
    for (const t of tournaments as any[]) {
      let scoreDelta = 0;
      
      if (t.scoring_type === 'highest_win_multiplier') {
        // Only update if current multiplier is higher than existing score
        const currentScore = db.prepare('SELECT score FROM tournament_participants WHERE tournament_id = ? AND player_id = ?').get(t.id, userId) as any;
        if (multiplier > currentScore.score) {
          db.prepare('UPDATE tournament_participants SET score = ? WHERE tournament_id = ? AND player_id = ?')
            .run(multiplier, t.id, userId);
        }
      } else if (t.scoring_type === 'total_wagered') {
        scoreDelta = betAmount;
        db.prepare('UPDATE tournament_participants SET score = score + ? WHERE tournament_id = ? AND player_id = ?')
          .run(scoreDelta, t.id, userId);
      } else if (t.scoring_type === 'total_wins') {
        scoreDelta = winAmount;
        db.prepare('UPDATE tournament_participants SET score = score + ? WHERE tournament_id = ? AND player_id = ?')
          .run(scoreDelta, t.id, userId);
      }
    }
  } catch (error) {
    console.error('Error updating tournament score:', error);
  }
};

const checkReferralWageringMilestones = (playerId: number) => {
  try {
    const player = db.prepare('SELECT id, username, referred_by, total_wagered FROM players WHERE id = ?').get(playerId) as any;
    if (!player || !player.referred_by) return;

    const milestones = [
      { id: 'wagering_100', threshold: 100, rewardGC: 5000, rewardSC: 5 },
      { id: 'wagering_1000', threshold: 1000, rewardGC: 25000, rewardSC: 25 }
    ];

    milestones.forEach(m => {
      const existing = db.prepare('SELECT id FROM referral_milestones WHERE referral_id = ? AND milestone = ?').get(playerId, m.id);
      if (!existing && player.total_wagered >= m.threshold) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await db.prepare('INSERT INTO referral_milestones (referral_id, milestone, reward_gc, reward_sc) VALUES (?, ?, ?, ?)')
            .run(playerId, m.id, m.rewardGC, m.rewardSC);
          
          await db.prepare('UPDATE players SET gc_balance = gc_balance + ?, sc_balance = sc_balance + ? WHERE id = ?')
            .run(m.rewardGC, m.rewardSC, player.referred_by);
          
          await db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
            .run(player.referred_by, 'Referral', m.rewardGC, m.rewardSC, `Referral wagering milestone (${m.threshold} SC) reached by ${player.username}`);
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }

        // Notify Referrer
        const referrer = db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(player.referred_by) as any;
        io.to(`user-${player.referred_by}`).emit('balance-update', {
          gc_balance: referrer.gc_balance,
          sc_balance: referrer.sc_balance
        });
        io.to(`user-${player.referred_by}`).emit('notification', {
          title: 'Referral Milestone!',
          message: `Your referral ${player.username} reached the ${m.threshold} SC wagering milestone! You earned ${m.rewardGC} GC and ${m.rewardSC} SC.`,
          type: 'success'
        });
      }
    });
  } catch (error) {
    console.error('Error checking referral milestones:', error);
  }
};

// Leaderboards Endpoints
app.get('/api/leaderboards', async (req, res) => {
  try {
    const topWagered = db.prepare(`
      SELECT username, total_wagered as score 
      FROM players 
      ORDER BY total_wagered DESC 
      LIMIT 10
    `).all();
    
    const topWinners = db.prepare(`
      SELECT p.username, SUM(gr.win_amount) as score
      FROM players p
      JOIN game_results gr ON p.id = gr.player_id
      GROUP BY p.id
      ORDER BY score DESC
      LIMIT 10
    `).all();
    
    res.json({ topWagered, topWinners });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Achievements Endpoints
app.get('/api/achievements', async (req, res) => {
  try {
    const achievements = db.prepare('SELECT * FROM achievements').all();
    res.json({ achievements });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/achievements/my', authenticate, (req: any, res) => {
  try {
    const myAchievements = db.prepare(`
      SELECT a.*, pa.unlocked_at
      FROM achievements a
      JOIN player_achievements pa ON a.id = pa.achievement_id
      WHERE pa.player_id = ?
    `).all(req.user.id);
    res.json({ achievements: myAchievements });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Game Endpoints
app.get('/api/games', async (req, res) => {
  try {
    const games = db.prepare('SELECT * FROM games WHERE enabled = 1').all();
    res.json({ games });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/games/slots/spin', authenticate, (req: any, res) => {
  const { gameId, betAmount, currency } = req.body; // currency: 'gc' or 'sc'
  
  try {
    const user = db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(req.user.id) as any;
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as any;
    
    if (!game) return res.status(404).json({ error: 'Game not found' });
    
    const balance = currency === 'gc' ? user.gc_balance : user.sc_balance;
    if (balance < betAmount) return res.status(400).json({ error: 'Insufficient balance' });
    
    // RNG Logic
    const random = Math.random();
    const isWin = random < (game.rtp / 100);
    let winAmount = 0;
    let multiplier = 0;
    let reels = [
      Math.floor(Math.random() * 7),
      Math.floor(Math.random() * 7),
      Math.floor(Math.random() * 7)
    ];
    
    if (isWin) {
      // Simple multiplier logic
      const winRandom = Math.random();
      let winSymbol = 0;
      if (winRandom < 0.01) {
        multiplier = 50; // Big win
        winSymbol = 6; // Highest paying symbol (e.g., 7️⃣)
      } else if (winRandom < 0.1) {
        multiplier = 10; // Medium win
        winSymbol = Math.floor(Math.random() * 3) + 3; // Symbols 3, 4, 5
      } else {
        multiplier = 2; // Small win
        winSymbol = Math.floor(Math.random() * 3); // Symbols 0, 1, 2
      }
      
      winAmount = betAmount * multiplier;
      reels = [winSymbol, winSymbol, winSymbol];
    } else {
      // For a loss, ensure they are not all the same
      while (reels[0] === reels[1] && reels[1] === reels[2]) {
        reels = [
          Math.floor(Math.random() * 7),
          Math.floor(Math.random() * 7),
          Math.floor(Math.random() * 7)
        ];
      }
    }
    
    const newBalance = balance - betAmount + winAmount;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Update balance
      if (currency === 'gc') {
        await db.prepare('UPDATE players SET gc_balance = ?, total_wagered = total_wagered + ? WHERE id = ?')
          .run(newBalance, betAmount, req.user.id);
      } else {
        await db.prepare('UPDATE players SET sc_balance = ?, total_wagered = total_wagered + ? WHERE id = ?')
          .run(newBalance, betAmount, req.user.id);
      }
      
      // Log result
      await db.prepare('INSERT INTO game_results (player_id, game_id, bet_amount, win_amount, currency, multiplier, result_data) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(req.user.id, gameId, betAmount, winAmount, currency, multiplier, JSON.stringify({ random, isWin, reels }));
        
      // Update Tournament Scores
      updateTournamentScore(req.user.id, 'krazy-slots', betAmount, winAmount, multiplier, currency);
      
      // Update Challenge Progress
      updateChallengeProgress(req.user.id, gameId, betAmount, winAmount, currency, multiplier);

      // Update Referral Milestones (only for SC wagering)
      if (currency === 'sc') {
        checkReferralWageringMilestones(req.user.id);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    res.json({
      isWin,
      winAmount,
      multiplier,
      newBalance,
      reels
    });
    
    // Notify via socket for real-time balance update
    io.to(`user-${req.user.id}`).emit('balance-update', {
      gc_balance: currency === 'gc' ? newBalance : user.gc_balance,
      sc_balance: currency === 'sc' ? newBalance : user.sc_balance
    });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/games/crash/play', authenticate, (req: any, res) => {
  const { gameId, betAmount, currency, autoCashout } = req.body;
  
  try {
    const user = db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(req.user.id) as any;
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as any;
    
    if (!game) return res.status(404).json({ error: 'Game not found' });
    
    const balance = currency === 'gc' ? user.gc_balance : user.sc_balance;
    if (balance < betAmount) return res.status(400).json({ error: 'Insufficient balance' });
    
    // Crash Logic: 1 / (1 - X) where X is 0 to 0.99
    // House edge: if X < 0.03, crash at 1.00
    const random = Math.random();
    let crashPoint = 1.0;
    
    if (random > 0.03) {
      crashPoint = 0.99 / (1 - Math.random());
    }
    
    const multiplier = Math.min(crashPoint, autoCashout || 1000);
    const isWin = multiplier < crashPoint;
    const winAmount = isWin ? betAmount * multiplier : 0;
    
    const newBalance = balance - betAmount + winAmount;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (currency === 'gc') {
        await db.prepare('UPDATE players SET gc_balance = ?, total_wagered = total_wagered + ? WHERE id = ?')
          .run(newBalance, betAmount, req.user.id);
      } else {
        await db.prepare('UPDATE players SET sc_balance = ?, total_wagered = total_wagered + ? WHERE id = ?')
          .run(newBalance, betAmount, req.user.id);
      }
      
      await db.prepare('INSERT INTO game_results (player_id, game_id, bet_amount, win_amount, currency, multiplier, result_data) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(req.user.id, gameId, betAmount, winAmount, currency, isWin ? multiplier : 0, JSON.stringify({ crashPoint, autoCashout, isWin }));
      
      updateChallengeProgress(req.user.id, gameId, betAmount, winAmount, currency, isWin ? multiplier : 0);

      // Update Referral Milestones (only for SC wagering)
      if (currency === 'sc') {
        checkReferralWageringMilestones(req.user.id);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    res.json({
      isWin,
      winAmount,
      multiplier: isWin ? multiplier : 0,
      crashPoint,
      newBalance
    });
    
    io.to(`user-${req.user.id}`).emit('balance-update', {
      gc_balance: currency === 'gc' ? newBalance : user.gc_balance,
      sc_balance: currency === 'sc' ? newBalance : user.sc_balance
    });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/games/dice/roll', authenticate, (req: any, res) => {
  const { gameId, betAmount, currency, target, type } = req.body; // type: 'over' or 'under'
  
  try {
    const user = db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(req.user.id) as any;
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId) as any;
    
    if (!game) return res.status(404).json({ error: 'Game not found' });
    
    const balance = currency === 'gc' ? user.gc_balance : user.sc_balance;
    if (balance < betAmount) return res.status(400).json({ error: 'Insufficient balance' });
    
    // Dice Logic (0-100)
    const roll = Math.random() * 100;
    let isWin = false;
    
    if (type === 'over') {
      isWin = roll > target;
    } else {
      isWin = roll < target;
    }
    
    let multiplier = 0;
    let winAmount = 0;
    
    if (isWin) {
      // Simple multiplier calculation: (99 / win_chance)
      const winChance = type === 'over' ? (100 - target) : target;
      multiplier = 99 / winChance;
      winAmount = betAmount * multiplier;
    }
    
    const newBalance = balance - betAmount + winAmount;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (currency === 'gc') {
        await db.prepare('UPDATE players SET gc_balance = ?, total_wagered = total_wagered + ? WHERE id = ?')
          .run(newBalance, betAmount, req.user.id);
      } else {
        await db.prepare('UPDATE players SET sc_balance = ?, total_wagered = total_wagered + ? WHERE id = ?')
          .run(newBalance, betAmount, req.user.id);
      }
      
      await db.prepare('INSERT INTO game_results (player_id, game_id, bet_amount, win_amount, currency, multiplier, result_data) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(req.user.id, gameId, betAmount, winAmount, currency, multiplier, JSON.stringify({ roll, target, type, isWin }));
        
      // Update Tournament Scores
      updateTournamentScore(req.user.id, 'neon-dice', betAmount, winAmount, multiplier, currency);
      
      // Update Challenge Progress
      updateChallengeProgress(req.user.id, gameId, betAmount, winAmount, currency, multiplier);

      // Update Referral Milestones (only for SC wagering)
      if (currency === 'sc') {
        checkReferralWageringMilestones(req.user.id);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    res.json({
      isWin,
      winAmount,
      multiplier,
      newBalance,
      roll: parseFloat(roll.toFixed(2))
    });
    
    io.to(`user-${req.user.id}`).emit('balance-update', {
      gc_balance: currency === 'gc' ? newBalance : user.gc_balance,
      sc_balance: currency === 'sc' ? newBalance : user.sc_balance
    });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Challenges Endpoint
app.get('/api/ai/challenges', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Check for active challenges for today
    const today = new Date().toISOString().split('T')[0];
    const activeChallenges = db.prepare(`
      SELECT c.*, pc.progress, pc.status 
      FROM player_challenges pc
      JOIN challenges c ON pc.challenge_id = c.id
      WHERE pc.player_id = ? AND pc.status = 'active' AND date(pc.started_at) = date(?)
    `).all(userId, today);

    if (activeChallenges.length > 0) {
      return res.json({ challenges: activeChallenges });
    }

    // Generate new challenges if none active
    const user = db.prepare('SELECT * FROM players WHERE id = ?').get(userId) as any;
    const recentWins = db.prepare('SELECT * FROM game_results WHERE player_id = ? ORDER BY created_at DESC LIMIT 10').all(userId);

    const prompt = `You are LuckyAI, the personal gaming assistant for PlayCoinKrazy.com.
    User Profile: ${JSON.stringify({ username: user.username, vip_status: user.vip_status, total_wagered: user.total_wagered })}
    Recent Wins: ${JSON.stringify(recentWins)}
    
    Create 3-5 unique, personalized daily game challenges for this user. 
    Challenges should adapt to their skill level (total wagered).
    
    Requirement Types:
    - 'win_streak': Win X games in a row
    - 'total_wager': Wager a total of X GC/SC
    - 'specific_game_win': Win X times on a specific game
    - 'multiplier': Get a win multiplier of at least X
    - 'play_count': Play X games total
    
    Examples:
    - 'Play 5 slot spins' rewarding 50 GC
    - 'Win a game with a 2x multiplier' rewarding 25 SC
    
    Difficulty: 1 (Easy) to 5 (Hard).
    Rewards: 
    - GC: 50 to 50000
    - SC: 0.1 to 25.0 (only for higher difficulty)
    
    Return a JSON array of objects with:
    - title: Catchy title
    - description: Clear explanation
    - requirement_type: One of the types above
    - requirement_value: The X value
    - reward_gc: GC reward
    - reward_sc: SC reward
    - difficulty: 1-5
    - expires_in_hours: 24
    `;

    if (!ai) {
      // Fallback
      const fallbackChallenges = [
        { title: 'Slot Starter', description: 'Play 5 slot spins', requirement_type: 'play_count', requirement_value: 5, reward_gc: 50, reward_sc: 0, difficulty: 1, expires_in_hours: 24 },
        { title: 'Multiplier Master', description: 'Win a game with a 2x multiplier', requirement_type: 'multiplier', requirement_value: 2, reward_gc: 0, reward_sc: 25, difficulty: 3, expires_in_hours: 24 },
        { title: 'High Roller Lite', description: 'Wager 5000 GC total', requirement_type: 'total_wager', requirement_value: 5000, reward_gc: 2500, reward_sc: 0, difficulty: 2, expires_in_hours: 24 }
      ];
      
      const transaction = db.transaction(() => {
        fallbackChallenges.forEach(c => {
          const expiresAt = new Date(Date.now() + c.expires_in_hours * 60 * 60 * 1000).toISOString();
          const result = db.prepare('INSERT INTO challenges (title, description, requirement_type, requirement_value, reward_gc, reward_sc, difficulty, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .run(c.title, c.description, c.requirement_type, c.requirement_value, c.reward_gc, c.reward_sc, c.difficulty, expiresAt);
          db.prepare('INSERT INTO player_challenges (player_id, challenge_id) VALUES (?, ?)').run(userId, result.lastInsertRowid);
        });
      });
      transaction();
      
      const newChallenges = db.prepare(`
        SELECT c.*, pc.progress, pc.status 
        FROM player_challenges pc
        JOIN challenges c ON pc.challenge_id = c.id
        WHERE pc.player_id = ? AND pc.status = 'active' AND date(pc.started_at) = date(?)
      `).all(userId, today);
      
      return res.json({ challenges: newChallenges });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const challenges = JSON.parse(response.text || '[]');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const c of challenges) {
        const expiresAt = new Date(Date.now() + (c.expires_in_hours || 24) * 60 * 60 * 1000).toISOString();
        const result = await db.prepare('INSERT INTO challenges (title, description, requirement_type, requirement_value, reward_gc, reward_sc, difficulty, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id')
          .get(c.title, c.description, c.requirement_type, c.requirement_value, c.reward_gc, c.reward_sc, c.difficulty, expiresAt) as any;
        await db.prepare('INSERT INTO player_challenges (player_id, challenge_id) VALUES (?, ?)').run(userId, result.id);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const newChallenges = db.prepare(`
      SELECT c.*, pc.progress, pc.status 
      FROM player_challenges pc
      JOIN challenges c ON pc.challenge_id = c.id
      WHERE pc.player_id = ? AND pc.status = 'active' AND date(pc.started_at) = date(?)
    `).all(userId, today);

    res.json({ challenges: newChallenges });
  } catch (error: any) {
    console.error('AI Challenges Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/wagered-history', authenticate, (req: any, res) => {
  try {
    const history = db.prepare(`
      SELECT date(created_at) as date, SUM(bet_amount) as amount
      FROM game_results
      WHERE player_id = ?
      GROUP BY date(created_at)
      ORDER BY date ASC
      LIMIT 30
    `).all(req.user.id);
    res.json({ history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Social Feed Endpoints
app.get('/api/social/feed', authenticate, (req: any, res) => {
  try {
    const posts = db.prepare(`
      SELECT 
        p.*, 
        u.username, 
        u.avatar_url,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND player_id = ?) as is_liked,
        gr.game_id,
        gr.win_amount,
        gr.currency as win_currency,
        g.name as game_name
      FROM posts p
      JOIN players u ON p.player_id = u.id
      LEFT JOIN game_results gr ON p.game_result_id = gr.id
      LEFT JOIN games g ON gr.game_id = g.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all(req.user.id);

    res.json({ posts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/social/posts', authenticate, (req: any, res) => {
  const { content, type, game_result_id } = req.body;
  try {
    const result = db.prepare('INSERT INTO posts (player_id, content, type, game_result_id) VALUES (?, ?, ?, ?)')
      .run(req.user.id, content, type || 'update', game_result_id || null);
    
    const newPost = db.prepare(`
      SELECT p.*, u.username, u.avatar_url 
      FROM posts p 
      JOIN players u ON p.player_id = u.id 
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    res.json({ post: newPost });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/social/posts/:id/like', authenticate, (req: any, res) => {
  const postId = req.params.id;
  try {
    const existing = db.prepare('SELECT id FROM post_likes WHERE post_id = ? AND player_id = ?').get(postId, req.user.id);
    if (existing) {
      db.prepare('DELETE FROM post_likes WHERE post_id = ? AND player_id = ?').run(postId, req.user.id);
      res.json({ liked: false });
    } else {
      db.prepare('INSERT INTO post_likes (post_id, player_id) VALUES (?, ?)').run(postId, req.user.id);
      res.json({ liked: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/social/posts/:id/comments', authenticate, (req: any, res) => {
  try {
    const comments = db.prepare(`
      SELECT c.*, u.username, u.avatar_url 
      FROM post_comments c 
      JOIN players u ON c.player_id = u.id 
      WHERE c.post_id = ? 
      ORDER BY c.created_at ASC
    `).all(req.params.id);
    res.json({ comments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/social/posts/:id/comments', authenticate, (req: any, res) => {
  const { content } = req.body;
  try {
    const result = db.prepare('INSERT INTO post_comments (post_id, player_id, content) VALUES (?, ?, ?)')
      .run(req.params.id, req.user.id, content);
    
    const newComment = db.prepare(`
      SELECT c.*, u.username, u.avatar_url 
      FROM post_comments c 
      JOIN players u ON c.player_id = u.id 
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.json({ comment: newComment });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Referral Endpoints
app.get('/api/referrals/stats', authenticate, (req: any, res) => {
  try {
    const referrals = db.prepare(`
      SELECT 
        p.username, 
        p.created_at as joined_at,
        p.total_wagered,
        (SELECT COUNT(*) FROM referral_milestones WHERE referral_id = p.id) as milestones_reached
      FROM players p
      WHERE p.referred_by = ?
    `).all(req.user.id);

    const totalEarned = db.prepare(`
      SELECT SUM(reward_gc) as gc, SUM(reward_sc) as sc 
      FROM referral_milestones rm
      JOIN players p ON rm.referral_id = p.id
      WHERE p.referred_by = ?
    `).get(req.user.id);

    res.json({ 
      referrals, 
      totalEarned: {
        gc: totalEarned.gc || 0,
        sc: totalEarned.sc || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Social Activity Feed Endpoint
app.get('/api/social/activity', (req, res) => {
  try {
    const activity = db.prepare(`
      SELECT p.username, p.avatar_url, gr.game_id, gr.win_amount, gr.currency_type, gr.created_at
      FROM game_results gr
      JOIN players p ON gr.player_id = p.id
      WHERE gr.win_amount > 0
      ORDER BY gr.created_at DESC
      LIMIT 20
    `).all();
    res.json({ activity });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Global Chat Endpoints
const chatMessages: any[] = [];
app.get('/api/chat/messages', (req, res) => {
  res.json({ messages: chatMessages.slice(-50) });
});

app.post('/api/chat/messages', authenticate, async (req: any, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    // Moderate content
    const moderation = await moderateContent(req.user.id, message, 'chat');
    if (!moderation.safe) {
      return res.status(400).json({ error: 'Message blocked by SecurityAi: ' + moderation.reason });
    }

    const newMessage = {
      id: Date.now(),
      userId: req.user.id,
      username: req.user.username,
      content: message,
      timestamp: new Date().toISOString()
    };
    
    chatMessages.push(newMessage);
    if (chatMessages.length > 100) chatMessages.shift();

    io.emit('new-chat-message', newMessage);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/auth/social/url/:platform', authenticate, (req: any, res) => {
  const { platform } = req.params;
  const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/auth/social/callback/${platform}`;
  
  let authUrl = '';
  let clientId = '';
  
  switch(platform) {
    case 'facebook':
      clientId = process.env.FACEBOOK_CLIENT_ID || '';
      authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=email,user_friends`;
      break;
    case 'twitter':
      clientId = process.env.TWITTER_CLIENT_ID || '';
      authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=tweet.read%20users.read%20follows.read&state=state&code_challenge=challenge&code_challenge_method=plain`;
      break;
    case 'instagram':
      clientId = process.env.INSTAGRAM_CLIENT_ID || '';
      authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code`;
      break;
    case 'tiktok':
      clientId = process.env.TIKTOK_CLIENT_ID || '';
      authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientId}&scope=user.info.basic&response_type=code&redirect_uri=${redirectUri}`;
      break;
    default:
      return res.status(400).json({ error: 'Unsupported platform' });
  }
  
  res.json({ url: authUrl });
});

app.get('/auth/social/callback/:platform', async (req, res) => {
  const { platform } = req.params;
  const { code } = req.query;
  
  // In a real app, we would exchange the code for a token here
  // For this demo, we'll just simulate success and close the popup
  
  res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_AUTH_SUCCESS', 
              platform: '${platform}',
              username: 'SocialUser_${Math.floor(Math.random() * 1000)}'
            }, '*');
            window.close();
          } else {
            window.location.href = '/profile';
          }
        </script>
        <p>Authentication successful for ${platform}. This window should close automatically.</p>
      </body>
    </html>
  `);
});

// Friend Management Endpoints

// Search Users
app.get('/api/users/search', authenticate, (req: any, res) => {
  const { query } = req.query;
  if (!query || query.length < 3) return res.json({ users: [] });
  
  try {
    const users = db.prepare(`
      SELECT id, username, avatar_url 
      FROM players 
      WHERE username LIKE ? AND id != ?
      LIMIT 5
    `).all(`%${query}%`, req.user.id);
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send Friend Request
app.post('/api/friends/request', authenticate, (req: any, res) => {
  const { friendId } = req.body;
  
  try {
    // Check if request already exists
    const existing = db.prepare(`
      SELECT * FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `).get(req.user.id, friendId, friendId, req.user.id);
    
    if (existing) {
      return res.status(400).json({ error: 'Friend request already sent or exists' });
    }
    
    db.prepare('INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)')
      .run(req.user.id, friendId, 'pending');
      
    // Notify recipient if online
    io.to(`user-${friendId}`).emit('friend-request', { 
      from: req.user.username, 
      id: req.user.id 
    });
    
    res.json({ message: 'Friend request sent' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Accept Friend Request
app.post('/api/friends/accept', authenticate, (req: any, res) => {
  const { requestId } = req.body;
  
  try {
    const request = db.prepare('SELECT * FROM friendships WHERE id = ?').get(requestId) as any;
    
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.friend_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    
    db.prepare('UPDATE friendships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('accepted', requestId);
      
    // Referral Bonus Logic
    const settings = db.prepare('SELECT * FROM site_settings').all() as any[];
    const settingsMap: any = {};
    settings.forEach(s => settingsMap[s.key] = s.value);

    const referralBonusGC = parseInt(settingsMap.referral_bonus_gc || '1000');
    const referralBonusSC = parseFloat(settingsMap.referral_bonus_sc || '1');

    // Check if they already got a bonus for this friendship (shouldn't happen with 'pending' check but good to be safe)
    const bonusGiven = db.prepare('SELECT COUNT(*) as count FROM wallet_transactions WHERE player_id = ? AND type = "Referral" AND description LIKE ?')
      .get(req.user.id, `%friendship with user #${request.user_id}%`) as any;

    if (bonusGiven.count === 0) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Bonus for both
        await db.prepare('UPDATE players SET gc_balance = gc_balance + ?, sc_balance = sc_balance + ? WHERE id = ?')
          .run(referralBonusGC, referralBonusSC, request.user_id);
        await db.prepare('UPDATE players SET gc_balance = gc_balance + ?, sc_balance = sc_balance + ? WHERE id = ?')
          .run(referralBonusGC, referralBonusSC, request.friend_id);

        // Log Transactions
        await db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
          .run(request.user_id, 'Referral', referralBonusGC, referralBonusSC, `Friendship bonus for adding user #${request.friend_id}`);
        await db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
          .run(request.friend_id, 'Referral', referralBonusGC, referralBonusSC, `Friendship bonus for adding user #${request.user_id}`);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      // Notify both via socket
      [request.user_id, request.friend_id].forEach(uid => {
        const u = db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(uid) as any;
        io.to(`user-${uid}`).emit('balance-update', u);
      });
    }

    // Notify sender if online
    io.to(`user-${request.user_id}`).emit('friend-accepted', { 
      by: req.user.username, 
      id: req.user.id 
    });
    
    res.json({ message: 'Friend request accepted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reject/Cancel Friend Request
app.post('/api/friends/reject', authenticate, (req: any, res) => {
  const { requestId } = req.body;
  
  try {
    const request = db.prepare('SELECT * FROM friendships WHERE id = ?').get(requestId) as any;
    
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.friend_id !== req.user.id && request.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    db.prepare('DELETE FROM friendships WHERE id = ?').run(requestId);
    
    res.json({ message: 'Friend request rejected/cancelled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List Friends
app.get('/api/friends', authenticate, (req: any, res) => {
  try {
    const friends = db.prepare(`
      SELECT 
        u.id, u.username, u.avatar_url, u.last_login,
        f.id as friendship_id, f.status,
        CASE 
          WHEN f.user_id = ? THEN 'sent'
          ELSE 'received'
        END as direction
      FROM friendships f
      JOIN players u ON (f.user_id = u.id OR f.friend_id = u.id)
      WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ?
    `).all(req.user.id, req.user.id, req.user.id, req.user.id);
    
    // Add online status (using socket rooms)
    const friendsWithStatus = friends.map((f: any) => {
      const room = io.sockets.adapter.rooms.get(`user-${f.id}`);
      return {
        ...f,
        isOnline: room ? room.size > 0 : false
      };
    });
    
    res.json({ friends: friendsWithStatus });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Online Users Tracking
const onlineUsers = new Set<number>();

// Admin: Make it Rain
app.post('/api/admin/rain', authenticate, isAdmin, (req: any, res) => {
  const { amountGC, amountSC } = req.body;
  
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await db.prepare('UPDATE players SET gc_balance = gc_balance + ?, sc_balance = sc_balance + ?').run(amountGC, amountSC);
      
      // We can't easily log individual transactions for everyone in one go without a loop, 
      // but for "rain" maybe a system log is enough or we loop if user count is small.
      // For now, let's just update balances.
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    io.emit('notification', {
      type: 'success',
      message: `It's Raining! Everyone received ${amountGC} GC and ${amountSC} SC!`
    });
    
    // Force refresh for everyone connected? Or let them fetch on next action.
    // Ideally we emit balance updates to all connected sockets.
    const users = db.prepare('SELECT id, gc_balance, sc_balance FROM players').all();
    users.forEach((u: any) => {
      io.to(`user-${u.id}`).emit('balance-update', {
        gc_balance: u.gc_balance,
        sc_balance: u.sc_balance
      });
    });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Adjust Balance
app.post('/api/admin/adjust-balance', authenticate, isAdmin, (req: any, res) => {
  const { userId, amountGC, amountSC } = req.body;
  
  try {
    db.prepare('UPDATE players SET gc_balance = gc_balance + ?, sc_balance = sc_balance + ? WHERE id = ?')
      .run(amountGC, amountSC, userId);
      
    db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
      .run(userId, 'admin_adjustment', amountGC, amountSC, 'Admin Balance Adjustment');
      
    const user = db.prepare('SELECT gc_balance, sc_balance FROM players WHERE id = ?').get(userId) as any;
    io.to(`user-${userId}`).emit('balance-update', {
      gc_balance: user.gc_balance,
      sc_balance: user.sc_balance
    });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Manage KYC
app.post('/api/admin/kyc/verify', authenticate, isAdmin, (req: any, res) => {
  const { userId, status } = req.body; // status: 'verified', 'unverified', 'rejected'
  try {
    db.prepare('UPDATE players SET kyc_status = ? WHERE id = ?').run(status, userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get Users (Enhanced)
app.get('/api/admin/users', authenticate, isAdmin, (req: any, res) => {
  try {
    const users = db.prepare('SELECT id, username, email, gc_balance, sc_balance, kyc_status, role, created_at FROM players ORDER BY created_at DESC').all();
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get Redemptions
app.get('/api/admin/redemptions', authenticate, isAdmin, (req: any, res) => {
  try {
    const requests = db.prepare(`
      SELECT r.*, p.username, p.email 
      FROM redemption_requests r
      JOIN players p ON r.player_id = p.id
      ORDER BY r.created_at DESC
    `).all();
    res.json({ requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Process Redemption
app.post('/api/admin/redemptions/process', authenticate, isAdmin, (req: any, res) => {
  const { requestId, status } = req.body; // status: 'paid', 'rejected'
  
  try {
    const request = db.prepare('SELECT * FROM redemption_requests WHERE id = ?').get(requestId) as any;
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    if (status === 'rejected') {
      // Refund SC
      db.prepare('UPDATE players SET sc_balance = sc_balance + ? WHERE id = ?').run(request.amount_sc, request.player_id);
      db.prepare("UPDATE redemption_requests SET status = 'rejected', processed_at = CURRENT_TIMESTAMP WHERE id = ?").run(requestId);
    } else if (status === 'paid') {
      db.prepare("UPDATE redemption_requests SET status = 'paid', processed_at = CURRENT_TIMESTAMP WHERE id = ?").run(requestId);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Manage Packages
app.post('/api/admin/packages', authenticate, isAdmin, (req: any, res) => {
  const { id, name, gc_amount, sc_amount, price, image_url } = req.body;
  try {
    await db.prepare(`
      INSERT INTO coin_packages (id, name, gc_amount, sc_amount, price, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        gc_amount = EXCLUDED.gc_amount,
        sc_amount = EXCLUDED.sc_amount,
        price = EXCLUDED.price,
        image_url = EXCLUDED.image_url
    `).run(id, name, gc_amount, sc_amount, price, image_url);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Tournament Scheduler (Run every minute)
setInterval(() => {
  try {
    const now = new Date().toISOString();
    
    // Start upcoming tournaments
    db.prepare("UPDATE tournaments SET status = 'active' WHERE status = 'upcoming' AND start_time <= ?")
      .run(now);
      
    // End active tournaments
    const endedTournaments = db.prepare("SELECT * FROM tournaments WHERE status = 'active' AND end_time <= ?").all(now);
    
    for (const t of endedTournaments as any[]) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Mark as completed
        await db.prepare("UPDATE tournaments SET status = 'completed' WHERE id = ?").run(t.id);
        
        // Distribute Prizes (Top 3 for simplicity)
        const winners = await db.prepare(`
          SELECT * FROM tournament_participants 
          WHERE tournament_id = ? 
          ORDER BY score DESC 
          LIMIT 3
        `).all(t.id) as any[];
        
        const prizeDistribution = [0.5, 0.3, 0.2]; // 50%, 30%, 20%
        
        for (let index = 0; index < winners.length; index++) {
          const w = winners[index];
          const prize = t.prize_pool * prizeDistribution[index];
          if (prize > 0) {
            if (t.currency === 'gc') {
              await db.prepare('UPDATE players SET gc_balance = gc_balance + ? WHERE id = ?').run(prize, w.player_id);
            } else {
              await db.prepare('UPDATE players SET sc_balance = sc_balance + ? WHERE id = ?').run(prize, w.player_id);
            }
            
            await db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
              .run(w.player_id, 'tournament_win', 
                t.currency === 'gc' ? prize : 0,
                t.currency === 'sc' ? prize : 0,
                `Won ${index + 1} place in ${t.name}`
              );
              
            // Notify winner
            io.to(`user-${w.player_id}`).emit('notification', {
              type: 'success',
              message: `You won ${prize} ${t.currency.toUpperCase()} in ${t.name}!`
            });
          }
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  } catch (error) {
    console.error('Tournament Scheduler Error:', error);
  }
}, 60000); // Check every minute

// Ticket Management Endpoints
app.post('/api/admin/tickets/types', authenticate, isAdmin, async (req: any, res) => {
  const { type, price_sc, custom_name, custom_description } = req.body;
  
  try {
    let name = custom_name;
    let description = custom_description;
    let theme_images = [];

    // Use DevAi to generate theme if not provided
    if (!name) {
      const prompt = `Generate a fun, catchy theme name and a short description for a ${type === 'scratch' ? 'Scratch-off' : 'Pull Tab'} ticket. 
      The theme should be exciting and gambling-related (e.g., space, pirates, gems, luck). 
      Return JSON format: { "name": "...", "description": "..." }`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const theme = JSON.parse(response.text || '{}');
      name = theme.name || 'Lucky Ticket';
      description = theme.description || 'Try your luck today!';
    }

    // Generate theme images using Gemini (simulated with picsum for now but structure is there)
    // In a real scenario, we'd use gemini-2.5-flash-image
    theme_images = [
      `https://picsum.photos/seed/${name}-1/800/600`,
      `https://picsum.photos/seed/${name}-2/800/600`,
      `https://picsum.photos/seed/${name}-3/800/600`
    ];

    const result = db.prepare(`
      INSERT INTO ticket_types (type, name, description, price_sc, theme_images)
      VALUES (?, ?, ?, ?, ?)
    `).run(type, name, description, price_sc, JSON.stringify(theme_images));

    res.json({ success: true, id: result.lastInsertRowid, name, description, theme_images });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/tickets/types', authenticate, isAdmin, (req: any, res) => {
  try {
    const types = db.prepare('SELECT * FROM ticket_types ORDER BY created_at DESC').all();
    res.json({ types });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/tickets/types/:id', authenticate, isAdmin, (req: any, res) => {
  const { id } = req.params;
  const { is_active, price_sc, win_probability } = req.body;
  
  try {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (price_sc !== undefined) { updates.push('price_sc = ?'); params.push(price_sc); }
    if (win_probability !== undefined) { updates.push('win_probability = ?'); params.push(win_probability); }
    
    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE ticket_types SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/tickets/stats', authenticate, isAdmin, (req: any, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_sold,
        SUM(cost_sc) as total_revenue,
        SUM(win_amount) as total_payout,
        (SUM(cost_sc) - SUM(win_amount)) as net_profit
      FROM ticket_purchases
    `).get() as any;

    const topWinners = db.prepare(`
      SELECT p.username, SUM(tp.win_amount) as total_won
      FROM ticket_purchases tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.is_win = 1
      GROUP BY p.id
      ORDER BY total_won DESC
      LIMIT 10
    `).all();

    const salesHistory = db.prepare(`
      SELECT date(created_at) as date, SUM(cost_sc) as revenue, SUM(win_amount) as payout
      FROM ticket_purchases
      GROUP BY date(created_at)
      ORDER BY date ASC
      LIMIT 30
    `).all();

    res.json({ stats, topWinners, salesHistory });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// User Ticket Endpoints
app.get('/api/tickets/active', (req, res) => {
  try {
    const types = db.prepare('SELECT * FROM ticket_types WHERE is_active = 1').all();
    res.json({ types });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tickets/purchase', authenticate, (req: any, res) => {
  const { ticketTypeId } = req.body;
  
  try {
    const user = db.prepare('SELECT sc_balance FROM players WHERE id = ?').get(req.user.id) as any;
    const ticketType = db.prepare('SELECT * FROM ticket_types WHERE id = ? AND is_active = 1').get(ticketTypeId) as any;
    
    if (!ticketType) return res.status(404).json({ error: 'Ticket type not found or inactive' });
    if (user.sc_balance < ticketType.price_sc) return res.status(400).json({ error: 'Insufficient SC balance' });

    // Rate limiting check (simple version)
    const recentPurchases = db.prepare(`
      SELECT COUNT(*) as count FROM ticket_purchases 
      WHERE player_id = ? AND created_at > NOW() - INTERVAL '1 minute'
    `).get(req.user.id) as any;
    
    if (recentPurchases.count >= 50) return res.status(429).json({ error: 'Rate limit exceeded. Max 50 tickets per minute.' });

    // Determine win/loss
    const winRoll = Math.random();
    const isWin = winRoll < ticketType.win_probability;
    let winAmount = 0;
    
    if (isWin) {
      // Uniform distribution between min and max prize
      winAmount = Math.random() * (ticketType.max_prize - ticketType.min_prize) + ticketType.min_prize;
      winAmount = parseFloat(winAmount.toFixed(2));
    }

    const client = await pool.connect();
    let purchaseId;
    try {
      await client.query('BEGIN');
      // Deduct balance
      await db.prepare('UPDATE players SET sc_balance = sc_balance - ? WHERE id = ?')
        .run(ticketType.price_sc, req.user.id);
      
      // Create purchase record
      const result = await db.prepare(`
        INSERT INTO ticket_purchases (player_id, ticket_type_id, cost_sc, win_amount, is_win, result_data, status)
        VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id
      `).get(req.user.id, ticketTypeId, ticketType.price_sc, winAmount, isWin ? 1 : 0, JSON.stringify({ winAmount, isWin }), 'purchased') as any;
      
      purchaseId = result.id;
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
    // Notify balance update
    const updatedUser = db.prepare('SELECT sc_balance, gc_balance FROM players WHERE id = ?').get(req.user.id) as any;
    io.to(`user-${req.user.id}`).emit('balance-update', updatedUser);

    res.json({ success: true, purchaseId, price: ticketType.price_sc });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tickets/reveal', authenticate, (req: any, res) => {
  const { purchaseId } = req.body;
  
  try {
    const purchase = db.prepare(`
      SELECT tp.*, tt.name as ticket_name, tt.type as ticket_type
      FROM ticket_purchases tp
      JOIN ticket_types tt ON tp.ticket_type_id = tt.id
      WHERE tp.id = ? AND tp.player_id = ? AND tp.status = 'purchased'
    `).get(purchaseId, req.user.id) as any;
    
    if (!purchase) return res.status(404).json({ error: 'Purchase not found or already revealed' });

    db.prepare("UPDATE ticket_purchases SET status = 'revealed' WHERE id = ?").run(purchaseId);

    res.json({ 
      isWin: purchase.is_win === 1, 
      winAmount: purchase.win_amount,
      ticketName: purchase.ticket_name,
      ticketType: purchase.ticket_type
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tickets/claim', authenticate, (req: any, res) => {
  const { purchaseId } = req.body;
  
  try {
    const purchase = db.prepare("SELECT * FROM ticket_purchases WHERE id = ? AND player_id = ? AND status = 'revealed'").get(purchaseId, req.user.id) as any;
    
    if (!purchase) return res.status(404).json({ error: 'Purchase not found or not in revealed state' });
    
    if (purchase.is_win === 1) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await db.prepare('UPDATE players SET sc_balance = sc_balance + ? WHERE id = ?')
          .run(purchase.win_amount, req.user.id);
        await db.prepare("UPDATE ticket_purchases SET status = 'claimed' WHERE id = ?").run(purchaseId);
        
        await db.prepare('INSERT INTO wallet_transactions (player_id, type, sc_amount, description) VALUES (?, ?, ?, ?)')
          .run(req.user.id, 'ticket_win', purchase.win_amount, `Won ${purchase.win_amount} SC on ticket #${purchaseId}`);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
      const updatedUser = db.prepare('SELECT sc_balance, gc_balance FROM players WHERE id = ?').get(req.user.id) as any;
      io.to(`user-${req.user.id}`).emit('balance-update', updatedUser);
    } else {
      db.prepare("UPDATE ticket_purchases SET status = 'claimed' WHERE id = ?").run(purchaseId);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tickets/save', authenticate, (req: any, res) => {
  const { purchaseId } = req.body;
  
  try {
    const purchase = db.prepare(`
      SELECT tp.*, tt.name as ticket_name, tt.theme_images
      FROM ticket_purchases tp
      JOIN ticket_types tt ON tp.ticket_type_id = tt.id
      WHERE tp.id = ? AND tp.player_id = ? AND tp.status = 'revealed' AND tp.is_win = 1
    `).get(purchaseId, req.user.id) as any;
    
    if (!purchase) return res.status(404).json({ error: 'Winning purchase not found or not in revealed state' });
    
    const images = JSON.parse(purchase.theme_images || '[]');
    const imageUrl = images[0] || '';

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await db.prepare("UPDATE ticket_purchases SET status = 'saved' WHERE id = ?").run(purchaseId);
      await db.prepare(`
        INSERT INTO user_saved_wins (player_id, purchase_id, ticket_name, amount_won, image_url)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.user.id, purchaseId, purchase.ticket_name, purchase.win_amount, imageUrl);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/saved-wins', authenticate, (req: any, res) => {
  try {
    const wins = db.prepare('SELECT * FROM user_saved_wins WHERE player_id = ? AND claimed = 0 ORDER BY created_at DESC').all(req.user.id);
    res.json({ wins });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Social & Referral Endpoints
app.post('/api/user/social/connect', authenticate, (req: any, res) => {
  const { platform, platform_username } = req.body;
  
  try {
    await db.prepare(`
      INSERT INTO social_links (player_id, platform, platform_username)
      VALUES (?, ?, ?)
      ON CONFLICT (player_id, platform) DO UPDATE SET
        platform_username = EXCLUDED.platform_username
    `).run(req.user.id, platform, platform_username);
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bonus Endpoints
app.get('/api/admin/bonuses', authenticate, isAdmin, (req, res) => {
  try {
    const bonuses = db.prepare('SELECT * FROM bonuses WHERE status != "deleted" ORDER BY created_at DESC').all();
    res.json({ bonuses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/bonuses', authenticate, isAdmin, (req, res) => {
  const { name, type, description, code, reward_gc, reward_sc, min_deposit, wagering_requirement, game_eligibility, max_win, expiration_days } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO bonuses (name, type, description, code, reward_gc, reward_sc, min_deposit, wagering_requirement, game_eligibility, max_win, expiration_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, type, description, code, reward_gc, reward_sc, min_deposit, wagering_requirement, JSON.stringify(game_eligibility), max_win, expiration_days);
    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/bonuses/:id', authenticate, isAdmin, (req, res) => {
  const { id } = req.params;
  const { name, type, description, code, reward_gc, reward_sc, min_deposit, wagering_requirement, game_eligibility, max_win, expiration_days, status } = req.body;
  try {
    db.prepare(`
      UPDATE bonuses SET name = ?, type = ?, description = ?, code = ?, reward_gc = ?, reward_sc = ?, min_deposit = ?, wagering_requirement = ?, game_eligibility = ?, max_win = ?, expiration_days = ?, status = ?
      WHERE id = ?
    `).run(name, type, description, code, reward_gc, reward_sc, min_deposit, wagering_requirement, JSON.stringify(game_eligibility), max_win, expiration_days, status, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/bonuses/:id', authenticate, isAdmin, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE bonuses SET status = "deleted" WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bonuses/available', authenticate, (req, res) => {
  try {
    const bonuses = db.prepare('SELECT * FROM bonuses WHERE status = "active"').all();
    res.json({ bonuses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bonuses/my', authenticate, (req: any, res) => {
  try {
    const bonuses = db.prepare(`
      SELECT pb.*, b.name, b.description, b.type, b.reward_gc, b.reward_sc
      FROM player_bonuses pb
      JOIN bonuses b ON pb.bonus_id = b.id
      WHERE pb.player_id = ?
      ORDER BY pb.claimed_at DESC
    `).all(req.user.id);
    res.json({ bonuses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bonuses/claim', authenticate, (req: any, res) => {
  const { bonusId, code } = req.body;
  try {
    let bonus;
    if (code) {
      bonus = db.prepare('SELECT * FROM bonuses WHERE code = ? AND status = "active"').get(code) as any;
    } else {
      bonus = db.prepare('SELECT * FROM bonuses WHERE id = ? AND status = "active"').get(bonusId) as any;
    }

    if (!bonus) return res.status(404).json({ error: 'Bonus not found or inactive' });

    // Check if already claimed
    const existing = db.prepare('SELECT id FROM player_bonuses WHERE player_id = ? AND bonus_id = ? AND status = "active"').get(req.user.id, bonus.id);
    if (existing) return res.status(400).json({ error: 'Bonus already active' });

    const expiresAt = bonus.expiration_days ? new Date(Date.now() + bonus.expiration_days * 24 * 60 * 60 * 1000).toISOString() : null;
    const wageringTarget = (bonus.reward_sc || 0) * (bonus.wagering_requirement || 0);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await db.prepare(`
        INSERT INTO player_bonuses (player_id, bonus_id, wagering_target, expires_at)
        VALUES (?, ?, ?, ?)
      `).run(req.user.id, bonus.id, wageringTarget, expiresAt);

      // If it's a direct reward (no deposit needed), add it now
      if (bonus.type === 'loyalty' || bonus.type === 'free_spins') {
        await db.prepare('UPDATE players SET gc_balance = gc_balance + ?, sc_balance = sc_balance + ? WHERE id = ?')
          .run(bonus.reward_gc, bonus.reward_sc, req.user.id);
        
        await db.prepare('INSERT INTO wallet_transactions (player_id, type, gc_amount, sc_amount, description) VALUES (?, ?, ?, ?, ?)')
          .run(req.user.id, 'Bonus', bonus.reward_gc, bonus.reward_sc, `Claimed bonus: ${bonus.name}`);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Recommendations Endpoint
app.get('/api/ai/recommendations', authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile for context
    const user = db.prepare('SELECT username, vip_status, total_wagered, gc_balance, sc_balance FROM players WHERE id = ?').get(userId) as any;

    // Get user's detailed play history including wager amounts and win/loss
    const history = db.prepare(`
      SELECT 
        g.name, 
        g.type, 
        COUNT(*) as play_count,
        SUM(gr.bet_amount) as total_wagered,
        SUM(gr.win_amount) as total_won,
        (SUM(gr.win_amount) - SUM(gr.bet_amount)) as net_profit
      FROM game_results gr
      JOIN games g ON gr.game_id = g.id
      WHERE gr.player_id = ?
      GROUP BY g.id
      ORDER BY play_count DESC
      LIMIT 10
    `).all(userId);

    // Get all available games
    const allGames = db.prepare('SELECT * FROM games WHERE enabled = 1').all();

    if (!ai) {
      // Fallback if no AI key
      return res.json({
        games: allGames.slice(0, 3).map(g => ({
          ...g,
          match_score: 85 + Math.floor(Math.random() * 10),
          reason: "Popular among players like you"
        }))
      });
    }

    const model = "gemini-3-flash-preview";

    const prompt = `
      You are LuckyAI, the personal gaming assistant for PlayCoinKrazy.com.
      Analyze the following user data to provide 3 personalized game recommendations.
      
      User Profile: ${JSON.stringify(user)}
      Detailed Play History (Last 10 unique games): ${JSON.stringify(history)}
      Available Games Catalog: ${JSON.stringify(allGames.map((g: any) => ({ id: g.id, name: g.name, type: g.type, rtp: g.rtp })))}
      
      Instructions:
      1. Consider their favorite game types (based on play_count).
      2. Consider their wagering style (average bet size derived from total_wagered / play_count).
      3. Consider their recent luck (net_profit). If they are on a losing streak, maybe suggest a higher RTP game.
      4. Suggest games they HAVEN'T played much or at all if they fit their profile.
      
      Return a JSON array of objects with:
      - id: game id
      - match_score: percentage (80-99)
      - reason: short catchy reason why (e.g., "Since you enjoy high-stakes slots, this new neon theme is perfect for you!")
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const recommendations = JSON.parse(response.text || '[]');
    
    const enrichedRecommendations = recommendations.map((rec: any) => {
      const game = allGames.find((g: any) => g.id === rec.id);
      if (!game) return null;
      return {
        ...game,
        match_score: rec.match_score,
        reason: rec.reason
      };
    }).filter(Boolean);

    res.json({ games: enrichedRecommendations });
  } catch (error) {
    console.error('AI Recommendations Error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Community Endpoints
app.get('/api/community/boards', authenticate, (req, res) => {
  try {
    const boards = db.prepare('SELECT * FROM forum_boards ORDER BY display_order ASC').all();
    res.json({ boards });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/community/boards/:slug', authenticate, (req, res) => {
  const { slug } = req.params;
  try {
    const board = db.prepare('SELECT * FROM forum_boards WHERE slug = ?').get(slug) as any;
    if (!board) return res.status(404).json({ error: 'Board not found' });

    const topics = db.prepare(`
      SELECT t.*, p.username, p.avatar_url,
      (SELECT COUNT(*) FROM forum_posts WHERE topic_id = t.id) as reply_count
      FROM forum_topics t
      JOIN players p ON t.author_id = p.id
      WHERE t.board_id = ?
      ORDER BY t.is_pinned DESC, t.updated_at DESC
    `).all(board.id);

    res.json({ board, topics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/community/topics/:id', authenticate, (req: any, res) => {
  const { id } = req.params;
  try {
    const topic = db.prepare(`
      SELECT t.*, p.username, p.avatar_url, b.name as board_name, b.slug as board_slug
      FROM forum_topics t
      JOIN players p ON t.author_id = p.id
      JOIN forum_boards b ON t.board_id = b.id
      WHERE t.id = ?
    `).get(id) as any;

    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    // Increment views
    db.prepare('UPDATE forum_topics SET views = views + 1 WHERE id = ?').run(id);

    const posts = db.prepare(`
      SELECT fp.*, p.username, p.avatar_url,
      (SELECT COUNT(*) FROM forum_likes WHERE post_id = fp.id) as like_count,
      (SELECT 1 FROM forum_likes WHERE post_id = fp.id AND user_id = ?) as is_liked
      FROM forum_posts fp
      JOIN players p ON fp.author_id = p.id
      WHERE fp.topic_id = ?
      ORDER BY fp.created_at ASC
    `).all(req.user.id, id);

    res.json({ topic, posts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/community/topics', authenticate, async (req: any, res) => {
  const { boardId, title, content } = req.body;
  try {
    // Check community status
    const status = db.prepare('SELECT * FROM player_community_status WHERE player_id = ?').get(req.user.id) as any;
    if (status) {
      if (status.is_banned) return res.status(403).json({ error: 'You are permanently banned from the community.' });
      if (status.mute_until && new Date(status.mute_until) > new Date()) {
        return res.status(403).json({ error: `You are muted until ${new Date(status.mute_until).toLocaleString()}` });
      }
    }

    // Moderate content
    const moderation = await moderateContent(req.user.id, `${title} ${content}`, 'forum');
    if (!moderation.safe) {
      return res.status(403).json({ 
        error: `Content violation: ${moderation.reason}`,
        action: moderation.action,
        muteUntil: moderation.muteUntil
      });
    }

    const result = db.prepare('INSERT INTO forum_topics (board_id, author_id, title, content) VALUES (?, ?, ?, ?)')
      .run(boardId, req.user.id, title, content);
    
    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/community/posts', authenticate, async (req: any, res) => {
  const { topicId, content, parentId } = req.body;
  try {
    // Check community status
    const status = db.prepare('SELECT * FROM player_community_status WHERE player_id = ?').get(req.user.id) as any;
    if (status) {
      if (status.is_banned) return res.status(403).json({ error: 'You are permanently banned from the community.' });
      if (status.mute_until && new Date(status.mute_until) > new Date()) {
        return res.status(403).json({ error: `You are muted until ${new Date(status.mute_until).toLocaleString()}` });
      }
    }

    // Moderate content
    const moderation = await moderateContent(req.user.id, content, 'forum');
    if (!moderation.safe) {
      return res.status(403).json({ 
        error: `Content violation: ${moderation.reason}`,
        action: moderation.action,
        muteUntil: moderation.muteUntil
      });
    }

    const result = db.prepare('INSERT INTO forum_posts (topic_id, author_id, content, parent_id) VALUES (?, ?, ?, ?)')
      .run(topicId, req.user.id, content, parentId);
    
    // Update topic updated_at
    db.prepare('UPDATE forum_topics SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(topicId);

    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/community/posts/:id/like', authenticate, (req: any, res) => {
  const { id } = req.params;
  try {
    const existing = db.prepare('SELECT * FROM forum_likes WHERE post_id = ? AND user_id = ?').get(id, req.user.id);
    if (existing) {
      db.prepare('DELETE FROM forum_likes WHERE post_id = ? AND user_id = ?').run(id, req.user.id);
      res.json({ liked: false });
    } else {
      db.prepare('INSERT INTO forum_likes (post_id, user_id) VALUES (?, ?)').run(id, req.user.id);
      res.json({ liked: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/community/moderation-logs', authenticate, isAdmin, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT ml.*, p.username
      FROM community_moderation_logs ml
      JOIN players p ON ml.user_id = p.id
      ORDER BY ml.created_at DESC
    `).all();
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/community/override', authenticate, isAdmin, (req, res) => {
  const { userId, action } = req.body; // action: 'unban', 'unmute', 'reset_offenses'
  try {
    if (action === 'unban') {
      db.prepare('UPDATE player_community_status SET is_banned = 0 WHERE player_id = ?').run(userId);
    } else if (action === 'unmute') {
      db.prepare('UPDATE player_community_status SET mute_until = NULL WHERE player_id = ?').run(userId);
    } else if (action === 'reset_offenses') {
      db.prepare('UPDATE player_community_status SET offense_count = 0 WHERE player_id = ?').run(userId);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/community/chat/history', authenticate, (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT gm.*, p.username, p.avatar_url
      FROM global_chat_messages gm
      JOIN players p ON gm.user_id = p.id
      ORDER BY gm.created_at DESC
      LIMIT 50
    `).all();
    res.json({ messages: messages.reverse() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/referrals', authenticate, (req: any, res) => {
  try {
    const friends = db.prepare(`
      SELECT id, username, avatar_url, created_at, kyc_status,
      (SELECT SUM(bet_amount) FROM game_results WHERE player_id = players.id AND currency = 'sc') as total_wagered_sc,
      CASE 
        WHEN last_login > NOW() - INTERVAL '7 days' THEN 'active'
        ELSE 'inactive'
      END as status
      FROM players
      WHERE referred_by = ?
    `).all(req.user.id);
    
    res.json({ friends });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Manager Endpoints
app.get('/api/admin/ai/employees', authenticate, isAdmin, (req: any, res) => {
  try {
    const employees = db.prepare('SELECT * FROM ai_employees').all();
    res.json({ employees });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/ai/employees', authenticate, isAdmin, (req: any, res) => {
  const { name, role, description } = req.body;
  try {
    const result = db.prepare('INSERT INTO ai_employees (name, role, description, avatar_url) VALUES (?, ?, ?, ?)')
      .run(name, role, description, `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/ai/employees/:id', authenticate, isAdmin, (req: any, res) => {
  const { id } = req.params;
  const { current_task, status } = req.body;
  try {
    if (current_task !== undefined) {
      db.prepare('UPDATE ai_employees SET current_task = ? WHERE id = ?').run(current_task, id);
    }
    if (status !== undefined) {
      db.prepare('UPDATE ai_employees SET status = ? WHERE id = ?').run(status, id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/ai/logs', authenticate, isAdmin, (req: any, res) => {
  try {
    const logs = db.prepare(`
      SELECT l.*, e.name as employee_name, e.avatar_url 
      FROM ai_logs l
      JOIN ai_employees e ON l.employee_id = e.id
      ORDER BY l.created_at DESC
      LIMIT 50
    `).all();
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/ai/logs/:id/action', authenticate, isAdmin, (req: any, res) => {
  const { id } = req.params;
  const { status } = req.body; // approved, denied
  try {
    db.prepare('UPDATE ai_logs SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/ai/chat/:employeeId', authenticate, isAdmin, (req: any, res) => {
  const { employeeId } = req.params;
  try {
    const messages = db.prepare('SELECT * FROM ai_chats WHERE employee_id = ? ORDER BY created_at ASC').all(employeeId);
    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/ai/chat', authenticate, isAdmin, async (req: any, res) => {
  const { employeeId, message } = req.body;
  
  try {
    // Save user message
    db.prepare('INSERT INTO ai_chats (employee_id, sender, message) VALUES (?, ?, ?)').run(employeeId, 'admin', message);
    
    // Get AI context
    const employee = db.prepare('SELECT * FROM ai_employees WHERE id = ?').get(employeeId) as any;
    
    // Generate AI response using Gemini
    // Note: In a real app, we would inject system stats/context here
    const prompt = `You are ${employee.name}, a ${employee.role} for an online casino platform. 
    Your description: ${employee.description}.
    Current task: ${employee.current_task || 'Idle'}.
    
    The admin just said: "${message}"
    
    Respond in character. Keep it professional but fitting for your persona.`;
    
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    
    const responseText = aiResponse.text || "I'm processing that request.";
    
    // Save AI response
    db.prepare('INSERT INTO ai_chats (employee_id, sender, message) VALUES (?, ?, ?)').run(employeeId, 'ai', responseText);
    
    res.json({ success: true, message: responseText });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Daily AI Tasks & Reports (Simulated every 24 hours)
const runDailyAiTasks = async () => {
  if (!ai) {
    console.warn('Skipping daily AI tasks: AI Service unavailable.');
    return;
  }
  try {
    const employees = db.prepare('SELECT * FROM ai_employees').all() as any[];
    const devAi = employees.find(e => e.name === 'DevAi');
    const socialAi = employees.find(e => e.name === 'SocialAi');

    // 1. Standard Daily Reports for all employees
    for (const emp of employees) {
      const prompt = `You are ${emp.name}, a ${emp.role}. Generate a short daily review/report for the admin.
      Include 1 specific suggestion for improvement and 1 status update on your current duties.
      Keep it concise (under 50 words).`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      
      const content = response.text || "Daily report generation failed.";
      const logResult = db.prepare('INSERT INTO ai_logs (employee_id, type, content, status) VALUES (?, ?, ?, ?)')
        .run(emp.id, 'review', content, 'pending');

      // Add to central notifications
      db.prepare('INSERT INTO admin_notifications (type, source_id, title, content) VALUES (?, ?, ?, ?)')
        .run('ai_task', logResult.lastInsertRowid, `${emp.name} Daily Report`, content);
    }

    // 2. Daily New Games Pipeline (DevAi)
    if (devAi) {
      const gamePrompt = `You are DevAi. Crawl major game providers and select 10 best new games. 
      Recreate them fully branded as PlayCoinKrazy.com and Coin Krazy Studios.
      Provide a summary of these 10 games.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: gamePrompt
      });

      const content = response.text || "Failed to generate new games pipeline.";
      db.prepare('INSERT INTO admin_notifications (type, title, content) VALUES (?, ?, ?)')
        .run('game_ready', '10 New Branded Games Ready for Review', content);
    }

    // 3. Automated Player Retention (SocialAi)
    if (socialAi) {
      const retentionPrompt = `You are SocialAi. Run a daily retention campaign.
      Create personalized emails, in-platform messages, social posts, and SMS texts for inactive players.
      Include custom incentives (free spins, bonus cash, etc.).
      Respond with a summary of the campaign.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: retentionPrompt
      });

      const content = response.text || "Failed to generate retention campaign.";
      const campaignResult = db.prepare('INSERT INTO social_campaigns (type, title, content, status) VALUES (?, ?, ?, ?)')
        .run('retention', 'Daily Player Retention Campaign', JSON.stringify({ summary: content }), 'pending');

      db.prepare('INSERT INTO admin_notifications (type, source_id, title, content) VALUES (?, ?, ?, ?)')
        .run('social_campaign', campaignResult.lastInsertRowid, 'Daily Retention Campaign Ready', content);
    }

    console.log('Daily AI Tasks Completed');
  } catch (error) {
    console.error('Daily AI Tasks Error:', error);
  }
};

app.post('/api/admin/ai/generate-reports', authenticate, isAdmin, async (req: any, res) => {
  await runDailyAiTasks();
  res.json({ success: true });
});

// Run daily
setInterval(runDailyAiTasks, 24 * 60 * 60 * 1000);
// Run once on startup after a short delay
setTimeout(runDailyAiTasks, 5000);

// Package Management
app.post('/api/admin/packages', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { name, price, gc_amount, sc_amount, is_featured } = req.body;
  try {
    const result = db.prepare('INSERT INTO coin_packages (name, price, gc_amount, sc_amount, is_featured) VALUES (?, ?, ?, ?, ?)')
      .run(name, price, gc_amount, sc_amount, is_featured ? 1 : 0);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/packages/:id', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const { name, price, gc_amount, sc_amount, is_featured } = req.body;
  try {
    db.prepare('UPDATE coin_packages SET name = ?, price = ?, gc_amount = ?, sc_amount = ?, is_featured = ? WHERE id = ?')
      .run(name, price, gc_amount, sc_amount, is_featured ? 1 : 0, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/packages/:id', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM coin_packages WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Chat Endpoints
app.get('/api/chat/:gameSlug', (req, res) => {
  const { gameSlug } = req.params;
  try {
    const messages = db.prepare(`
      SELECT cm.id, cm.message, cm.created_at, p.username, p.avatar_url
      FROM chat_messages cm
      JOIN players p ON cm.user_id = p.id
      WHERE cm.game_slug = ?
      ORDER BY cm.created_at DESC
      LIMIT 50
    `).all(gameSlug);
    res.json({ messages: messages.reverse() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat/:gameSlug', authenticate, (req: any, res) => {
  const { gameSlug } = req.params;
  const { message } = req.body;
  
  try {
    const result = db.prepare('INSERT INTO chat_messages (game_slug, user_id, message) VALUES (?, ?, ?)')
      .run(gameSlug, req.user.id, message);
      
    const newMessage = {
      id: result.lastInsertRowid,
      message,
      created_at: new Date().toISOString(),
      username: req.user.username,
      avatar_url: req.user.avatar_url
    };
    
    io.to(`game-${gameSlug}`).emit('chat-message', newMessage);
    
    res.json(newMessage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    onlineUsers.add(userId);
  });
  
  socket.on('join-game-room', ({ gameSlug, user }) => {
    socket.join(`game-${gameSlug}`);
    if (user) {
      // Notify others in room
      socket.to(`game-${gameSlug}`).emit('user-joined-game', { username: user.username });
    }
  });
  
  socket.on('leave-game-room', ({ gameSlug }) => {
    socket.leave(`game-${gameSlug}`);
  });

  socket.on('join-global-chat', () => {
    socket.join('global-chat');
  });

  socket.on('send-global-message', async ({ userId, message }) => {
    try {
      // Check community status
      const status = db.prepare('SELECT * FROM player_community_status WHERE player_id = ?').get(userId) as any;
      if (status) {
        if (status.is_banned) {
          socket.emit('moderation-action', { error: 'You are permanently banned from the community.' });
          return;
        }
        if (status.mute_until && new Date(status.mute_until) > new Date()) {
          socket.emit('moderation-action', { error: `You are muted until ${new Date(status.mute_until).toLocaleString()}` });
          return;
        }
      }

      // Moderate content
      const moderation = await moderateContent(userId, message, 'chat');
      if (!moderation.safe) {
        socket.emit('moderation-action', { 
          error: `Content violation: ${moderation.reason}`,
          action: moderation.action,
          muteUntil: moderation.muteUntil
        });
        return;
      }

      const user = db.prepare('SELECT username, avatar_url FROM players WHERE id = ?').get(userId) as any;
      const result = db.prepare('INSERT INTO global_chat_messages (user_id, message) VALUES (?, ?)').run(userId, message);
      
      const newMessage = {
        id: result.lastInsertRowid,
        userId,
        username: user.username,
        avatar_url: user.avatar_url,
        message,
        created_at: new Date().toISOString()
      };

      io.to('global-chat').emit('new-global-message', newMessage);
    } catch (error) {
      console.error('Global chat error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


// Run daily
setInterval(runDailyAiTasks, 24 * 60 * 60 * 1000);
// Run once on startup after a short delay
setTimeout(runDailyAiTasks, 5000);

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`CoinKrazy AI running at http://localhost:${PORT}`);
  });
}

startServer();
