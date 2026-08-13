import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isPremium?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  demoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_USER: User = {
  id: 'demo-user',
  name: 'Ayush Ranjan',
  email: 'ayush@deeployment.ai',
  avatar: 'AR',
  isPremium: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('deeployment_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 1000));
    const u: User = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      avatar: email.slice(0, 2).toUpperCase(),
    };
    setUser(u);
    localStorage.setItem('deeployment_user', JSON.stringify(u));
  };

  const signup = async (name: string, email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 1200));
    const u: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      avatar: name.slice(0, 2).toUpperCase(),
    };
    setUser(u);
    localStorage.setItem('deeployment_user', JSON.stringify(u));
  };

  const demoLogin = async () => {
    await new Promise((r) => setTimeout(r, 800));
    setUser(DEMO_USER);
    localStorage.setItem('deeployment_user', JSON.stringify(DEMO_USER));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('deeployment_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
