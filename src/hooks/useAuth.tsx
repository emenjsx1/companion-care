import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let seq = 0;

    const applySession = async (nextSession: Session | null) => {
      const current = ++seq;

      try {
        if (!mounted) return;
        setIsLoading(true);
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      } catch (e) {
        console.error('Error applying auth session:', e);
      } finally {
        if (mounted && current === seq) setIsLoading(false);
      }
    };

    // Subscribe first to avoid missing SIGNED_IN events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    // Hydrate from existing session
    (async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await applySession(existingSession);
      } catch (e) {
        // AbortError can happen in some browsers; we just wait for onAuthStateChange
        if (e instanceof DOMException && e.name === 'AbortError') {
          console.warn('Auth getSession aborted; waiting for auth state change');
          if (mounted) setIsLoading(false);
          return;
        }
        console.error('Error initializing auth:', e);
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error as unknown as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
          },
        },
      });

      if (!error && data.user) {
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          full_name: fullName,
          email,
        });
      }

      return { error: error as unknown as Error | null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
