"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type ProfileOption = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
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
