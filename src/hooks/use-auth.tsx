
"use client";

import type { User, UserRole } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { mockUsers as initialMockUsers } from '@/lib/types'; 

const ALL_USERS_STORAGE_KEY = 'allMockUsersList'; 

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  forceContextRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadAuthDataFromStorage = () => {
    const storedUser = localStorage.getItem('authUser');
    const storedRole = localStorage.getItem('authRole') as UserRole | null;
    if (storedUser && storedRole) {
      try {
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
      } catch (error) {
        console.error("Failed to parse auth user from localStorage", error);
        localStorage.removeItem('authUser');
        localStorage.removeItem('authRole');
        setUser(null);
        setRole(null);
      }
    } else {
      setUser(null);
      setRole(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAuthDataFromStorage();
  }, []);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login';
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        if (role === 'administrator' || role === 'ti') {
          // Redirect TI users to IT settings by default, or admin dashboard if preferred
          router.push(role === 'ti' ? '/admin/it-settings' : '/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    }
  }, [user, role, loading, pathname, router]);


  const login = async (email: string) => {
    setLoading(true);
    let foundUser: User | undefined;
    let allUsers: User[] = [];

    // 1. Try to get users from localStorage (the "source of truth")
    const storedAllUsers = localStorage.getItem(ALL_USERS_STORAGE_KEY);
    if (storedAllUsers) {
        try {
            allUsers = JSON.parse(storedAllUsers);
            // Find active user by email
            foundUser = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase() && u.isActive);
        } catch (e) {
            console.error("Failed to parse allMockUsersList from localStorage during login", e);
            // Fallback to initialMockUsers if localStorage is corrupt or empty
            allUsers = [...initialMockUsers];
            localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(allUsers));
            foundUser = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase() && u.isActive);
        }
    } else {
        // 2. If localStorage is empty, seed from initialMockUsers
        //    This also handles the very first login scenario for the app.
        console.log("Seeding allMockUsersList from initialMockUsers as it was not found in localStorage.");
        allUsers = [...initialMockUsers]; // Make a mutable copy
        localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(allUsers));
        foundUser = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase() && u.isActive);
    }

    let currentUserToSet: User;

    if (foundUser) {
        currentUserToSet = { ...foundUser }; // Use a copy
    } else {
        // 3. If still not found (even in seeded list), default to 'attendant' for mock login
        console.warn(`Email ${email} not found in user lists. Logging in as default 'attendant'.`);
        currentUserToSet = {
            id: 'mock-id-dynamic-' + Date.now(),
            email,
            role: 'attendant',
            displayName: email.split('@')[0],
            isActive: true,
        };
        // Note: We are NOT adding this dynamically created user to `allMockUsersList` here
        // to avoid polluting the "managed" user list unless explicitly added via User Management.
    }

    setUser(currentUserToSet);
    setRole(currentUserToSet.role);
    localStorage.setItem('authUser', JSON.stringify(currentUserToSet));
    localStorage.setItem('authRole', currentUserToSet.role);
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    setUser(null);
    setRole(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authRole');
    setLoading(false);
    router.push('/login');
  };

  const forceContextRefresh = () => {
    setLoading(true); 
    loadAuthDataFromStorage(); 
  };


  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, forceContextRefresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

