import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { ensureUserProfile } from "@/lib/ensure-profile";

export type AppRole = "buyer" | "farmer" | "transport" | "admin";

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  region: string | null;
  slug: string | null;
  username?: string | null;
  public_bookmarks?: boolean;
  profile_view_notifications?: boolean;
};

type Ctx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  addRole: (r: Exclude<AppRole, "admin">) => Promise<void>;
  hasRole: (r: AppRole) => boolean;
};

const AuthCtx = createContext<Ctx>({
  user: null,
  session: null,
  profile: null,
  roles: [],
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
  addRole: async () => {},
  hasRole: () => false,
});

const LOCAL_ROLES_KEY = "agrolink:local-roles:v1";
const DEMO_UID = "agrolink-demo-user";
const DEMO_USER = {
  id: DEMO_UID,
  email: "demo@agrolink.app",
  app_metadata: {},
  user_metadata: { display_name: "AgroLink Demo" },
  aud: "authenticated",
  created_at: new Date(0).toISOString(),
} as unknown as User;
const DEMO_PROFILE: Profile = {
  id: DEMO_UID,
  display_name: "AgroLink Demo",
  avatar_url: null,
  bio: "Demo workspace for buyers, sellers, drivers, and admins.",
  phone: "+233 24 000 0000",
  region: "Greater Accra",
  slug: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  async function loadUserData(uid: string, authUser?: User | null) {
    const localRoles = loadLocalRoles(uid);
    try {
      if (authUser) {
        try {
          await ensureUserProfile(authUser);
        } catch (error) {
          console.warn("[Auth] Could not auto-create profile.", error);
        }
      }
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      setProfile((p.data as Profile | null) ?? null);
      const remoteRoles = ((r.data ?? []) as { role: AppRole }[]).map((x) => x.role);
      setRoles(uniqueRoles([...remoteRoles, ...localRoles]));
    } catch (error) {
      console.warn("[Auth] Could not load remote profile; using local role cache.", error);
      setRoles(uniqueRoles(localRoles.length ? localRoles : ["buyer"]));
    }
  }

  function loadDemoData() {
    setDemoMode(true);
    setSession(null);
    setProfile(DEMO_PROFILE);
    setRoles(uniqueRoles([...routeDemoRoles(), ...loadLocalRoles(DEMO_UID)]));
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setDemoMode(false);
        setTimeout(() => loadUserData(s.user.id, s.user), 0);
      } else if (shouldUseDemoAuth()) {
        loadDemoData();
      } else {
        setDemoMode(false);
        setProfile(null);
        setRoles([]);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        if (data.session?.user) {
          setDemoMode(false);
          loadUserData(data.session.user.id, data.session.user).finally(() => setLoading(false));
        } else {
          if (shouldUseDemoAuth()) loadDemoData();
          setLoading(false);
        }
      })
      .catch((error) => {
        console.warn("[Auth] Session fetch failed.", error);
        if (shouldUseDemoAuth()) loadDemoData();
        else setSession(null);
        setLoading(false);
      });
    return () => sub.subscription.unsubscribe();
  }, []);

  const currentUser = session?.user ?? (demoMode ? DEMO_USER : null);

  return (
    <AuthCtx.Provider
      value={{
        user: currentUser,
        session,
        profile,
        roles,
        loading,
        hasRole: (r) => roles.includes(r),
        refresh: async () => {
          if (session?.user) await loadUserData(session.user.id, session.user);
          else if (demoMode) loadDemoData();
        },
        addRole: async (r) => {
          const uid = session?.user?.id ?? (demoMode || shouldUseDemoAuth() ? DEMO_UID : null);
          if (!uid) throw new Error("Sign in first");
          if (demoMode || uid === DEMO_UID) {
            saveLocalRole(uid, r);
            setRoles((curr) => uniqueRoles([...curr, r]));
            setDemoMode(true);
            setProfile(DEMO_PROFILE);
            return;
          }
          const { error } = await supabase.from("user_roles").insert({ user_id: session!.user.id, role: r });
          if (error && !error.message.toLowerCase().includes("duplicate")) {
            throw new Error(error.message);
          }
          saveLocalRole(uid, r);
          await loadUserData(session!.user.id, session!.user);
        },
        signOut: async () => {
          setDemoMode(false);
          setRoles([]);
          setProfile(null);
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

function uniqueRoles(roles: AppRole[]): AppRole[] {
  return Array.from(new Set<AppRole>(roles.length ? roles : ["buyer"]));
}

function loadLocalRoles(uid: string): AppRole[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ROLES_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, AppRole[]>) : {};
    return all[uid] ?? [];
  } catch {
    return [];
  }
}

function saveLocalRole(uid: string, role: Exclude<AppRole, "admin">) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_ROLES_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, AppRole[]>) : {};
    all[uid] = uniqueRoles([...(all[uid] ?? []), role]);
    localStorage.setItem(LOCAL_ROLES_KEY, JSON.stringify(all));
  } catch {
    // ignore local cache failures
  }
}

function shouldUseDemoAuth() {
  return (
    import.meta.env.VITE_DEMO_MODE === "true" &&
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/app")
  );
}

function routeDemoRoles(): AppRole[] {
  if (typeof window === "undefined") return ["buyer"];
  const path = window.location.pathname;
  if (path.startsWith("/app/admin")) return ["buyer", "admin"];
  if (path.startsWith("/app/farmer") || path.startsWith("/app/create")) return ["buyer", "farmer"];
  if (path.startsWith("/app/transport")) return ["buyer", "transport"];
  return ["buyer"];
}
