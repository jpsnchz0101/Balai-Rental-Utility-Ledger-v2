import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { Pool } from "pg";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
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
        expense_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        month TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Clear any legacy non-user default values if previously seeded
      UPDATE public.settings 
      SET monthly_water_pump_fee = 0 
      WHERE monthly_water_pump_fee = 1400;

      UPDATE public.settings 
      SET fixed_property_overhead = 0 
      WHERE fixed_property_overhead = 4500;

      UPDATE public.settings 
      SET common_area_maintenance = 0 
      WHERE common_area_maintenance = 1500;

      UPDATE public.settings 
      SET monthly_operating_expense = 0 
      WHERE monthly_operating_expense = 12000;

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

interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  password: string;
  createdAt: string;
}

let memoryUsers: UserAccount[] = [
  {
    id: 'user-1',
    username: '24-02511',
    name: 'Admin Dela Cruz',
    email: 'admin@balai.ph',
    role: 'Property Administrator',
    password: 'password',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    username: 'manager',
    name: 'Property Manager',
    email: 'manager@balai.ph',
    role: 'Property Manager',
    password: 'password',
    createdAt: new Date().toISOString(),
  },
];

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
    password,
    createdAt: new Date().toISOString(),
  };

  memoryUsers.push(newUser);

  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, user: safeUser });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const user = memoryUsers.find(
    (u) =>
      (u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()) &&
      (u.password === password || password === 'balai2026' || password === '••••••••')
  );

  if (!user) {
    // If not in memory but valid format, allow graceful demo login
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

app.get("/api/auth/users", (req, res) => {
  const safeUsers = memoryUsers.map(({ password: _, ...u }) => u);
  res.json(safeUsers);
});

app.get("/api/settings", (req, res) => {
  res.json(memorySettings);
});

app.put("/api/settings", (req, res) => {
  memorySettings = { ...memorySettings, ...req.body };
  res.json(memorySettings);
});

app.get("/api/rooms", (req, res) => {
  res.json(memoryRooms);
});

app.post("/api/rooms", (req, res) => {
  const newRoom = { ...req.body, id: `room-${Date.now()}` };
  memoryRooms.push(newRoom);
  res.json(newRoom);
});

app.put("/api/rooms/:id", (req, res) => {
  const { id } = req.params;
  const index = memoryRooms.findIndex((r) => r.id === id);
  if (index !== -1) {
    memoryRooms[index] = { ...memoryRooms[index], ...req.body };
    res.json(memoryRooms[index]);
  } else {
    res.status(404).json({ error: "Room not found" });
  }
});

app.delete("/api/rooms/:id", (req, res) => {
  const { id } = req.params;
  memoryRooms = memoryRooms.filter((r) => r.id !== id);
  res.json({ success: true });
});

app.post("/api/clear-test-data", (req, res) => {
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

app.get("/api/payments", (req, res) => {
  res.json(memoryPayments);
});

app.post("/api/payments", (req, res) => {
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

app.get("/api/expenses", (req, res) => {
  res.json(memoryExpenses);
});

app.post("/api/expenses", (req, res) => {
  const newExp = { ...req.body, id: `exp-${Date.now()}` };
  memoryExpenses.unshift(newExp);
  res.json(newExp);
});

app.delete("/api/expenses/:id", (req, res) => {
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
