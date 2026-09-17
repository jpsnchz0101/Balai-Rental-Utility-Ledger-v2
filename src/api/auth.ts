export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'Property Administrator' | 'Property Manager' | 'Staff / Meter Reader' | string;
  passwordHash?: string;
  createdAt: string;
}

// Client-side SHA-256 helper so cleartext passwords never touch localStorage
async function hashClientPassword(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(`balai_salt_2026_${password}`);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `hash_${password.length}_safe`;
}

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-admin-1',
    username: '24-02511',
    name: 'Admin Dela Cruz',
    email: 'admin@balai.ph',
    role: 'Property Administrator',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const USERS_STORAGE_KEY = 'balai_users_registry_v1';
const AUTH_TOKEN_KEY = 'balai_auth_token';

export const authService = {
  getAuthToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  setAuthToken(token: string) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  clearAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  getUsers(): UserAccount[] {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingUsernames = new Set(parsed.map((u: UserAccount) => u.username.toLowerCase()));
          const missingDefaults = DEFAULT_USERS.filter((d) => !existingUsernames.has(d.username.toLowerCase()));
          return [...parsed, ...missingDefaults];
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_USERS;
  },

  async registerUser(userData: {
    username: string;
    name: string;
    email: string;
    role: string;
    password: string;
  }): Promise<{ success: boolean; user?: UserAccount; token?: string; error?: string }> {
    const trimmedUsername = userData.username.trim();
    const trimmedName = userData.name.trim();
    const trimmedEmail = userData.email.trim().toLowerCase();

    if (!trimmedUsername || !trimmedName || !userData.password) {
      return { success: false, error: 'All required fields must be completed.' };
    }

    if (userData.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // Try server registration first
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          this.setAuthToken(data.token);
        }
        return { success: true, user: data.user, token: data.token };
      } else if (res.status === 409) {
        return { success: false, error: data.error || 'An account with this username or email already exists.' };
      }
    } catch {
      // Fallback to local storage if offline
    }

    const currentUsers = this.getUsers();
    const exists = currentUsers.some(
      (u) =>
        u.username.toLowerCase() === trimmedUsername.toLowerCase() ||
        (trimmedEmail && u.email.toLowerCase() === trimmedEmail)
    );

    if (exists) {
      return { success: false, error: 'An account with this username or email already exists.' };
    }

    const passwordHash = await hashClientPassword(userData.password);

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      username: trimmedUsername,
      name: trimmedName,
      email: trimmedEmail || `${trimmedUsername}@balai.local`,
      role: userData.role || 'Property Administrator',
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    const updatedList = [newUser, ...currentUsers];
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Could not save user metadata:', e);
    }

    return { success: true, user: newUser };
  },

  async validateLogin(
    identifier: string,
    passwordAttempt: string
  ): Promise<{ success: boolean; user?: UserAccount; token?: string; error?: string }> {
    const trimmedId = identifier.trim();

    if (!trimmedId || !passwordAttempt) {
      return { success: false, error: 'Please enter both username and password.' };
    }

    // Attempt server authentication first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedId, password: passwordAttempt }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.token) {
          this.setAuthToken(data.token);
        }
        return { success: true, user: data.user, token: data.token };
      }
      if (res.status === 429) {
        return { success: false, error: data.error || 'Too many attempts. Please wait 15 minutes.' };
      }
    } catch {
      // Offline fallback
    }

    // Local check with hashed password (no plaintext comparisons)
    const users = this.getUsers();
    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === trimmedId.toLowerCase() || u.email.toLowerCase() === trimmedId.toLowerCase()
    );

    if (!matchedUser) {
      // Generic error response to prevent user account enumeration
      return { success: false, error: 'Invalid username or password. Please check your credentials.' };
    }

    const computedHash = await hashClientPassword(passwordAttempt);
    if (matchedUser.passwordHash && matchedUser.passwordHash !== computedHash) {
      return { success: false, error: 'Invalid username or password. Please check your credentials.' };
    }

    return { success: true, user: matchedUser };
  },

  generateAccountId(): string {
    const yearPrefix = '24';
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${yearPrefix}-${randomDigits}`;
  },
};
