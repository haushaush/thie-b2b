import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AppUser {
  id: string;
  email: string;
  companyName: string;
  contactPerson: string;
  contactPhone: string;
  logoUrl: string | null;
  initials: string;
  isAdmin: boolean;
  profileCompleted: boolean;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  email: string;
  password: string;
  companyName: string;
  contactPerson: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const hasAdminRole = roles?.some((r) => r.role === "admin") || false;
      setIsAdmin(hasAdminRole);

      const initials = profile?.contact_person
        ? profile.contact_person
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : email.substring(0, 2).toUpperCase();

      const appUser: AppUser = {
        id: userId,
        email: email,
        companyName: profile?.company_name || "",
        contactPerson: profile?.contact_person || "",
        contactPhone: profile?.contact_phone || "",
        logoUrl: profile?.logo_url || null,
        initials,
        isAdmin: hasAdminRole,
        profileCompleted: profile?.profile_completed || false,
        firstName: profile?.first_name || "",
        lastName: profile?.last_name || "",
      };

      setUser(appUser);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id, session.user.email || "");
          }, 0);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email || "");
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            company_name: data.companyName,
            contact_person: data.contactPerson,
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          return { success: false, error: "Diese E-Mail-Adresse ist bereits registriert" };
        }
        return { success: false, error: error.message };
      }

      if (authData.user) {
        await supabase
          .from("profiles")
          .update({
            company_name: data.companyName,
            contact_person: data.contactPerson,
            first_name: data.firstName,
            last_name: data.lastName,
          })
          .eq("user_id", authData.user.id);

        // Save registration data as first contact person
        await supabase
          .from("contact_persons")
          .insert({
            user_id: authData.user.id,
            name: data.contactPerson,
            email: data.email,
          });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Ein unerwarteter Fehler ist aufgetreten" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!session,
        isAdmin,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
