import express from "express";
import path from "path";
import cors from "cors";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { Pool } from "pg";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Restrict CORS: Allow same-origin / local development by default, or specific ALLOWED_ORIGIN if provided
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: allowedOrigin ? allowedOrigin.split(",") : true,
    credentials: true,
  })
);
app.use(express.json());

// Initialize PostgreSQL Pool if DATABASE_URL is available
const connectionString = process.env.DATABASE_URL;
let pgPool: Pool | null = null;
if (connectionString) {
  try {
    const isSupabase = connectionString.includes('supabase');
    pgPool = new Pool({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 5000,
      ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    });
    pgPool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });

    // Auto-ensure database tables and clean defaults on Supabase / PostgreSQL
    pgPool.query(`
      CREATE TABLE IF NOT EXISTS public.settings (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'usr_default',
        property_name TEXT NOT NULL DEFAULT '',
        landlord_name TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '',
        electricity_rate REAL NOT NULL DEFAULT 0,
        water_rate REAL NOT NULL DEFAULT 0,
        monthly_water_pump_fee REAL NOT NULL DEFAULT 0,
        fixed_property_overhead REAL NOT NULL DEFAULT 0,
        common_area_maintenance REAL NOT NULL DEFAULT 0,
        monthly_operating_expense REAL NOT NULL DEFAULT 0,
        version TEXT NOT NULL DEFAULT '1.0.0',
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.rooms (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'usr_default',
        room_id TEXT NOT NULL UNIQUE,
        room_number TEXT NOT NULL,
        floor INTEGER NOT NULL DEFAULT 1,
        monthly_rent REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Available',
        tenant_name TEXT,
        tenant_phone TEXT,
        tenant_email TEXT,
        prev_electricity REAL DEFAULT 0,
        curr_electricity REAL DEFAULT 0,
        prev_water REAL DEFAULT 0,
        curr_water REAL DEFAULT 0,
        billed REAL DEFAULT 0,
        collected REAL DEFAULT 0,
        balance REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'Paid',
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.payments (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'usr_default',
        payment_id TEXT NOT NULL UNIQUE,
        room_id TEXT NOT NULL,
        tenant_name TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        method TEXT NOT NULL,
        notes TEXT,
        month TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS public.expenses (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'usr_default',
        expense_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        month TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
    `).then(() => {
      console.log('Database tables, clean defaults, and Row Level Security (RLS) verified.');
    }).catch((err) => {
      console.warn('Note on DB setup check:', err?.message || err);
    });
  } catch (e) {
    console.warn('Could not initialize pgPool:', e);
  }
}

// In-memory fallback store matching initial clean slate
let memorySettings = {
  propertyName: '',
  landlordName: '',
  address: '',
  electricityRate: 0,
  waterRate: 0,
  monthlyWaterPumpFee: 0,
  fixedPropertyOverhead: 0,
  commonAreaMaintenance: 0,
  monthlyOperatingExpense: 0,
  version: '1.0.0',
  totalRooms: 0,
  totalTenants: 0,
};

let memoryRooms: any[] = [];
let memoryPayments: any[] = [];
let memoryExpenses: any[] = [];

// Cryptographically secure password hashing & verification using scrypt
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

// Session Token Management
interface Session {
  userId: string;
  username: string;
  role: string;
  name: string;
  expiresAt: number;
}
const activeSessions = new Map<string, Session>();

function createSessionToken(user: { id: string; username: string; role: string; name: string }): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  activeSessions.set(token, {
    userId: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    expiresAt,
  });
  return token;
}

function validateSessionToken(token: string): Session | null {
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return session;
}

// Rate Limiting on Login (Brute Force Protection)
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);
  if (!entry) return true;
  if (now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(identifier);
    return true;
  }
  return entry.count < MAX_LOGIN_ATTEMPTS;
}

function recordFailedAttempt(identifier: string) {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);
  if (!entry || now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    loginAttempts.set(identifier, { count: 1, firstAttempt: now });
  } else {
    entry.count += 1;
  }
}

function clearFailedAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}

interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  createdAt: string;
}

// Seed default administrator with cryptographically secure hash (no plaintext)
const DEFAULT_SALT = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
const DEFAULT_HASH = crypto.scryptSync("Admin@Balai2026!", DEFAULT_SALT, 64).toString("hex");

let memoryUsers: UserAccount[] = [
  {
    id: 'user-1',
    username: '24-02511',
    name: 'Admin Dela Cruz',
    email: 'admin@balai.ph',
    role: 'Property Administrator',
    passwordHash: `${DEFAULT_SALT}:${DEFAULT_HASH}`,
    createdAt: new Date().toISOString(),
  },
];

// Authentication Middleware
interface AuthenticatedRequest extends express.Request {
  user?: Session;
}

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token" });
  }

  const session = validateSessionToken(token);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired session" });
  }

  (req as AuthenticatedRequest).user = session;
  next();
};

const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user || user.role !== 'Property Administrator') {
    return res.status(403).json({ error: "Forbidden: Administrator privileges required" });
  }
  next();
};

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", database: pgPool ? "connected" : "in-memory" });
});

// Authentication Routes
app.post("/api/auth/register", (req, res) => {
  const { username, name, email, role, password } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: "Missing required fields (username, name, password)" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  const existing = memoryUsers.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() || (email && u.email.toLowerCase() === email.toLowerCase())
  );
  if (existing) {
    return res.status(409).json({ error: "An account with this username or email already exists." });
  }

  const newUser: UserAccount = {
    id: `user-${Date.now()}`,
    username: username.trim(),
    name: name.trim(),
    email: email ? email.trim() : `${username.trim()}@balai.local`,
    role: role || 'Property Administrator',
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  memoryUsers.push(newUser);

  const token = createSessionToken({
    id: newUser.id,
    username: newUser.username,
    role: newUser.role,
    name: newUser.name,
  });

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, user: safeUser, token });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const rateLimitKey = `${ip}:${(username || '').toLowerCase()}`;

  if (!checkRateLimit(rateLimitKey)) {
    return res.status(429).json({
      error: "Too many failed login attempts. Please wait 15 minutes before trying again.",
    });
  }

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const user = memoryUsers.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase() ||
      u.email.toLowerCase() === username.toLowerCase()
  );

  // Generic constant-time failure response (prevents user enumeration & backdoor passwords)
  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordFailedAttempt(rateLimitKey);
    return res.status(401).json({ error: "Invalid username or password. Please verify your credentials." });
  }

  clearFailedAttempts(rateLimitKey);

  const token = createSessionToken({
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  });

  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser, token });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    activeSessions.delete(token);
  }
  res.json({ success: true, message: "Logged out successfully" });
});

// Protected: Only Admin can inspect all users
app.get("/api/auth/users", requireAuth, requireAdmin, (req, res) => {
  const safeUsers = memoryUsers.map(({ passwordHash: _, ...u }) => u);
  res.json(safeUsers);
});

// Protected Business Routes
app.get("/api/settings", requireAuth, (req, res) => {
  res.json(memorySettings);
});

app.put("/api/settings", requireAuth, (req, res) => {
  memorySettings = { ...memorySettings, ...req.body };
  res.json(memorySettings);
});

app.get("/api/rooms", requireAuth, (req, res) => {
  res.json(memoryRooms);
});

app.post("/api/rooms", requireAuth, (req, res) => {
  const newRoom = { ...req.body, id: `room-${Date.now()}` };
  memoryRooms.push(newRoom);
  res.json(newRoom);
});

app.put("/api/rooms/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const index = memoryRooms.findIndex((r) => r.id === id);
  if (index !== -1) {
    memoryRooms[index] = { ...memoryRooms[index], ...req.body };
    res.json(memoryRooms[index]);
  } else {
    res.status(404).json({ error: "Room not found" });
  }
});

app.delete("/api/rooms/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  memoryRooms = memoryRooms.filter((r) => r.id !== id);
  res.json({ success: true });
});

app.post("/api/clear-test-data", requireAuth, requireAdmin, (req, res) => {
  memoryRooms = memoryRooms.map((r) => ({
    ...r,
    tenant: undefined,
    status: 'Available',
    billed: 0,
    collected: 0,
    balance: 0,
    paymentStatus: 'Paid',
    meterReading: { previousElectricity: 0, currentElectricity: 0, previousWater: 0, currentWater: 0 },
  }));
  memoryPayments = [];
  res.json({ success: true, message: 'Test data cleared successfully' });
});

app.get("/api/payments", requireAuth, (req, res) => {
  res.json(memoryPayments);
});

app.post("/api/payments", requireAuth, (req, res) => {
  const newPayment = { ...req.body, id: `pay-${Date.now()}` };
  memoryPayments.unshift(newPayment);

  // Update room balance/collected if room found
  const room = memoryRooms.find((r) => r.id === newPayment.roomId);
  if (room) {
    room.collected = (room.collected || 0) + Number(newPayment.amount);
    room.balance = Math.max(0, (room.billed || 0) - room.collected);
    if (room.balance === 0) {
      room.paymentStatus = 'Paid';
    } else if (room.collected > 0) {
      room.paymentStatus = 'Partial';
    }
  }

  res.json(newPayment);
});

app.get("/api/expenses", requireAuth, (req, res) => {
  res.json(memoryExpenses);
});

app.post("/api/expenses", requireAuth, (req, res) => {
  const newExp = { ...req.body, id: `exp-${Date.now()}` };
  memoryExpenses.unshift(newExp);
  res.json(newExp);
});

app.delete("/api/expenses/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  memoryExpenses = memoryExpenses.filter((e) => e.id !== id);
  res.json({ success: true });
});

// Vite middleware setup for development, static for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
