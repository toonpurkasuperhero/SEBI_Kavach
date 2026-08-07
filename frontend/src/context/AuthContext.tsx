import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'guest' | 'investor' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  telegramChatId: string | null;
  telegramUsername: string | null;
}

interface AuthContextType {
  // Legacy compatibility shim — components that read userRole still work
  userRole: UserRole;

  // Full session & profile
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;

  // Auth actions
  sendOtp: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  setPassword: (password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;

  // Legacy shim
  login: (role: UserRole) => void;

  // Profile refresh
  refreshProfile: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derived role — used by ProtectedRoute and legacy components
  const userRole: UserRole = profile?.role ?? 'guest';

  // ── Fetch profile from Supabase ───────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, telegram_chat_id, telegram_username')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AuthContext] Profile fetch error:', error.message);
        // Gracefully default to investor role if profile doesn't exist yet
        setProfile({
          id: userId,
          email,
          role: 'investor',
          telegramChatId: null,
          telegramUsername: null,
        });
        return;
      }

      setProfile({
        id: userId,
        email,
        role: (data?.role as UserRole) ?? 'investor',
        telegramChatId: data?.telegram_chat_id ?? null,
        telegramUsername: data?.telegram_username ?? null,
      });
    } catch (err) {
      console.error('[AuthContext] Unexpected error fetching profile:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.email ?? '');
    }
  }, [user, fetchProfile]);

  // ── Bootstrap session on mount + listen to auth state changes ────────────
  useEffect(() => {
    let mounted = true;

    // Get existing session immediately
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!mounted) return;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        fetchProfile(existingSession.user.id, existingSession.user.email ?? '').finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await fetchProfile(newSession.user.id, newSession.user.email ?? '');
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ── Auth actions ──────────────────────────────────────────────────────────

  const sendOtp = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { error: error?.message ?? null };
  };

  const verifyOtp = async (
    email: string,
    token: string
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error: error?.message ?? null };
  };

  const signInWithPassword = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const setPassword = async (password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  // Legacy shim — no-op in production (session drives role)
  const login = (_role: UserRole) => {};

  // ── Context value ─────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{
        userRole,
        session,
        user,
        profile,
        isLoading,
        sendOtp,
        verifyOtp,
        signInWithPassword,
        setPassword,
        logout,
        login,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
