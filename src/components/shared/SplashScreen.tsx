"use client";

import { Box } from "@mui/material";
import { useUIStore } from "@/store/uiStore";

export default function SplashScreen() {
  // Read themeMode directly from the Zustand store — same source as AppProviders —
  // so this is always in sync regardless of ThemeProvider hydration timing.
  const themeMode = useUIStore((s) => s.themeMode);
  const isDark = themeMode === "dark";
  const bgColor = isDark ? "#121212" : "#F5F5F5";

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bgColor,
        zIndex: 9999,
      }}
    >
      {/* Logo container: always white so the PNG blends cleanly in both themes */}
      <Box
        sx={{
          width: 112,
          height: 112,
          borderRadius: "28px",
          backgroundColor: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.5)"
            : "0 4px 20px rgba(0,0,0,0.12)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo.png"
          alt="SLT"
          style={{ height: 80, width: 80, objectFit: "contain" }}
        />
      </Box>
    </Box>
  );
}
