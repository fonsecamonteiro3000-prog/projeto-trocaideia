import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export interface UserProfile {
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  gender?: "male" | "female" | "other";
  country?: string;
  city?: string;
  state?: string;
  isAnonymous: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAnonymous: boolean;
  anonymousId: string | null;
  profile: UserProfile;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAnonymously: () => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  getUserId: () => string;
}

function generateAnonymousName(): string {
  const num = Math.floor(Math.random() * 9000000) + 1000000;
  return `Anonimo${num}`;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    isAnonymous: false,
  });

  useEffect(() => {
    // First, check Supabase auth (takes priority over anonymous)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Authenticated user — clear any anonymous session
        setIsAnonymous(false);
        localStorage.removeItem("trocaideia_anonymous");
        setProfile({
          displayName:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "Usuário",
          avatarUrl: session.user.user_metadata?.avatar_url,
          isAnonymous: false,
        });
      } else {
        // No Supabase session — check for anonymous session
        const savedAnon = localStorage.getItem("trocaideia_anonymous");
        if (savedAnon) {
          try {
            const parsed = JSON.parse(savedAnon);
            setIsAnonymous(true);
            setAnonymousId(parsed.id);
            setProfile({
              displayName: parsed.displayName,
              gender: parsed.gender,
              country: parsed.country || "BR",
              isAnonymous: true,
            });
          } catch {
            localStorage.removeItem("trocaideia_anonymous");
          }
        }
      }
      setLoading(false);
    });

    // Escuta mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsAnonymous(false);
        localStorage.removeItem("trocaideia_anonymous");
        setProfile((prev) => ({
          ...prev,
          displayName:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "Usuário",
          avatarUrl: session.user.user_metadata?.avatar_url,
          isAnonymous: false,
        }));
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setIsAnonymous(false);
    localStorage.removeItem("trocaideia_anonymous");
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/chat`,
      },
    });
    if (error) throw error;
  };

  const signInAnonymously = () => {
    const anonName = generateAnonymousName();
    const anonId = crypto.randomUUID();
    setIsAnonymous(true);
    setAnonymousId(anonId);
    setProfile({
      displayName: anonName,
      isAnonymous: true,
      country: "BR",
    });
    localStorage.setItem(
      "trocaideia_anonymous",
      JSON.stringify({ id: anonId, displayName: anonName, country: "BR" })
    );
  };

  const signOut = async () => {
    if (isAnonymous) {
      setIsAnonymous(false);
      setAnonymousId(null);
      setProfile({ displayName: "", isAnonymous: false });
      localStorage.removeItem("trocaideia_anonymous");
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      if (isAnonymous) {
        const saved = JSON.parse(
          localStorage.getItem("trocaideia_anonymous") || "{}"
        );
        localStorage.setItem(
          "trocaideia_anonymous",
          JSON.stringify({
            ...saved,
            displayName: updated.displayName,
            gender: updated.gender,
            country: updated.country,
          })
        );
      }
      return updated;
    });
  };

  const getUserId = (): string => {
    if (user) return user.id;
    if (anonymousId) return anonymousId;
    return crypto.randomUUID();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAnonymous,
        anonymousId,
        profile,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAnonymously,
        signOut,
        updateProfile,
        getUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
