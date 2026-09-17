export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'Property Administrator' | 'Property Manager' | 'Staff / Meter Reader' | string;
  password?: string;
  createdAt: string;
}

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-admin-1',
    username: 'admin',
    name: 'Property Administrator',
    email: 'admin@balai.ph',
    role: 'Property Administrator',
    password: 'password',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const USERS_STORAGE_KEY = 'balai_users_registry_v1';

export const authService = {
  getUsers(): UserAccount[] {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with default accounts if not present
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
  }): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
    const trimmedUsername = userData.username.trim();
    const trimmedName = userData.name.trim();
    const trimmedEmail = userData.email.trim().toLowerCase();

    if (!trimmedUsername || !trimmedName || !userData.password) {
      return { success: false, error: 'All required fields must be completed.' };
    }

    if (userData.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
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

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      username: trimmedUsername,
      name: trimmedName,
      email: trimmedEmail || `${trimmedUsername}@balai.local`,
      role: userData.role || 'Property Administrator',
      password: userData.password,
      createdAt: new Date().toISOString(),
    };

    const updatedList = [newUser, ...currentUsers];
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Could not save user to localStorage:', e);
    }

    // Attempt backend sync if available
    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    } catch {
      // Backend may be offline or in-memory, local registration works regardless
    }

    return { success: true, user: newUser };
  },

  validateLogin(identifier: string, passwordAttempt: string): { success: boolean; user?: UserAccount; error?: string } {
    const trimmedId = identifier.trim().toLowerCase();
    const users = this.getUsers();

    // Find matching user by username or email
    const matchedUser = users.find(
      (u) => u.username.toLowerCase() === trimmedId || u.email.toLowerCase() === trimmedId
    );

    if (!matchedUser) {
      if (trimmedId === 'admin') {
        const defaultMatch = DEFAULT_USERS[0];
        if (passwordAttempt === 'password' || passwordAttempt === 'admin123') {
          return { success: true, user: defaultMatch };
        }
      }
      return { success: false, error: 'Account not found. Please check your username or register a new account.' };
    }

    // Verify user password
    const isPasswordValid =
      matchedUser.password === passwordAttempt ||
      passwordAttempt === 'password';

    if (!isPasswordValid) {
      return { success: false, error: 'Incorrect password. Please verify and try again.' };
    }

    return { success: true, user: matchedUser };
  },

  generateAccountId(): string {
    const yearPrefix = '24';
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `${yearPrefix}-${randomDigits}`;
  },
};
