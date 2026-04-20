"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api";
import type { User, Session } from "@supabase/supabase-js";

type AuthState = { user: User | null; session: Session | null; loading: boolean };

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true });

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setState({ user: data.session?.user ?? null, session: data.session, loading: false });
    });

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async ({ email, password, full_name }: { email: string; password: string; full_name: string }) => {
      const { data, error } = await supabaseBrowser.auth.signUp({
        email,
        password,
        options: { data: { full_name } },
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabaseBrowser.auth.signOut();
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.clear(),
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const res = await apiFetch("profile");
      return res.json();
    },
    enabled: !!user,
  });
}
