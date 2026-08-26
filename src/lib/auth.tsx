import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { signInWithPassword, supabase, supabaseFetch } from './supabase';

type Profile = {
  id: string;
  role: string;
};

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function getProfile(userId: string) {
  console.log('AUTH: Getting profile for:', userId);

  const rows = await supabaseFetch<Profile[]>('profiles', {
    query: `?select=id,role&id=eq.${encodeURIComponent(userId)}&limit=1`,
  });

  console.log('AUTH: Profile returned:', rows);

  return rows[0] ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      console.error('AUTH: Supabase client is not configured.');
      setLoading(false);
      return;
    }

    let active = true;

    const sync = async (next: Session | null) => {
      console.log('AUTH: Session changed:', next);

      if (!active) return;

      setSession(next);

      if (!next) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const value = await getProfile(next.user.id);

        console.log('AUTH: Final profile:', value);

        if (!active) return;

        setProfile(value);
      } catch (error) {
        console.error('AUTH: Profile error:', error);

        if (active) {
          setProfile(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('AUTH: getSession error:', error);
          return;
        }

        console.log('AUTH: Existing session:', data.session);

        void sync(data.session);
      })
      .catch((error) => {
        console.error('AUTH: Session initialization error:', error);
        if (active) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      console.log('AUTH EVENT:', event);
      void sync(next);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      loading,
      isAdmin:
        profile?.role === 'owner' ||
        profile?.role === 'admin',

      signIn: async (email, password) => {
        console.log('AUTH: Signing in:', email);

        setLoading(true);

        try {
          const result = await signInWithPassword(email, password);

          console.log('AUTH: Sign-in successful:', result.user?.id);
        } catch (error) {
          console.error('AUTH: Sign-in error:', error);
          setLoading(false);
          throw error;
        }
      },

      signOut: async () => {
        console.log('AUTH: Signing out...');

        await supabase?.auth.signOut();

        setSession(null);
        setProfile(null);
        setLoading(false);
      },
    }),
    [session, profile, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return value;
}