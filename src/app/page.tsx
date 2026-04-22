"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";

export default function Home() {
  const router = useRouter();
  const startPage = useUIStore((s) => s.startPage);

  useEffect(() => {
    router.replace(`/${startPage || "dashboard"}`);
  }, [router, startPage]);

  return null;
}
