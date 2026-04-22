"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type ProfileOption = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
};

type MyProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  lang_preference: "en" | "ar" | null;
  role: string;
  bottom_nav_config: string[] | null;
  start_page: string | null;
};

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const res = await apiFetch("profiles");
      return res.json() as Promise<ProfileOption[]>;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      const res = await apiFetch("profile");
      return res.json() as Promise<MyProfile>;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { full_name?: string; bottom_nav_config?: string[]; start_page?: string | null }) => {
      const res = await apiFetch("profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json() as Promise<MyProfile>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", "me"] }),
  });
}
