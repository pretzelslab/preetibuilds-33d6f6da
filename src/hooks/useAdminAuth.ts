import { useEffect, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { govDb } from "@/lib/supabase-governance";

// Real Supabase Auth session for the govDb project — this is what RLS on
// visit_logs actually checks (see supabase/admin-auth-authorization.sql),
// independent of the PageGate access-code UI layer. A signed-in session here
// does not by itself imply admin rights; the database still only returns
// rows to the specific user_id listed in admin_users.
export function useAdminAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    govDb.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = govDb.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await govDb.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    await govDb.auth.signOut();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    loading,
    signIn,
    signOut,
  };
}
