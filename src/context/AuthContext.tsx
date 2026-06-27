// Authentication via Supabase email magic link. In demo mode (no credentials)
// a stand-in user is provided so the submit/vote flow can be exercised locally.

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { isConfigured } from "../lib/config";
import { AuthUser } from "../lib/types";

interface AuthValue {
  user: AuthUser | null;
  loading: boolean;
  demo: boolean;
  signIn(email: string): Promise<{ error: string | null }>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

const DEMO_USER: AuthUser = { id: "demo-user", email: "you@demo.local" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const demo = !isConfigured;
  const [user, setUser] = useState<AuthUser | null>(demo ? DEMO_USER : null);
  const [loading, setLoading] = useState(!demo);

  useEffect(() => {
    if (demo || !supabase) return;
    const client = supabase;

    client.auth.getSession().then(async ({ data, error }) => {
      // A stale/revoked token (e.g. after auth-config changes) can't refresh.
      // Clear it so requests fall back to the anonymous key instead of firing
      // every call with a dead token and failing to load all data.
      if (error) {
        console.warn("Clearing unusable auth session:", error.message);
        await client.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }
      const u = data.session?.user;
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
      setLoading(false);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, [demo]);

  const signIn = async (email: string): Promise<{ error: string | null }> => {
    if (demo || !supabase) return { error: null };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async (): Promise<void> => {
    if (demo || !supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, demo, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within an AuthProvider");
  return value;
}
