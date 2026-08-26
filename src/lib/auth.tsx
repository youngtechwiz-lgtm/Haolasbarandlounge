import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { signInWithPassword, supabase, supabaseFetch } from './supabase';

type Profile = { id: string; role: string };
type AuthState = { session: Session | null; profile: Profile | null; loading: boolean; isAdmin: boolean; signIn: (email: string, password: string) => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

async function getProfile(userId: string) {
  const rows = await supabaseFetch<Profile[]>('profiles', { query: `?select=id,role&id=eq.${encodeURIComponent(userId)}&limit=1` });
  return rows[0] ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let active = true;
    const sync = async (next: Session | null) => {
      setSession(next);
      if (!next) { if (active) { setProfile(null); setLoading(false); } return; }
      try { const value = await getProfile(next.user.id); if (active) setProfile(value); }
      catch { if (active) setProfile(null); }
      finally { if (active) setLoading(false); }
    };
    void supabase.auth.getSession().then(({ data }) => sync(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { void sync(next); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  const value = useMemo<AuthState>(() => ({ session, profile, loading, isAdmin: profile?.role === 'owner' || profile?.role === 'admin', signIn: async (email, password) => { setLoading(true); await signInWithPassword(email, password); }, signOut: async () => { await supabase?.auth.signOut(); } }), [session, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used inside AuthProvider'); return value; }
