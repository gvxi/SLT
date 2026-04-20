"use client";

import { useState, useEffect } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import Sidebar from "@/components/layout/Sidebar";
import TopAppBar from "@/components/layout/TopAppBar";
import BottomNav from "@/components/layout/BottomNav";
import SplashScreen from "@/components/shared/SplashScreen";
import { useUIStore } from "@/store/uiStore";

const DRAWER_WIDTH = 240;
const DRAWER_COLLAPSED = 64;

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { sidebarOpen } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <SplashScreen />;

  const sidebarWidth = isMobile ? 0 : sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          width: `calc(100% - ${sidebarWidth}px)`,
          minHeight: "100vh",
        }}
      >
        <TopAppBar
          onMenuClick={() => {
            if (isMobile) {
              setMobileOpen(true);
            } else {
              useUIStore.getState().toggleSidebar();
            }
          }}
        />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            pb: isMobile ? 10 : 3,
          }}
        >
          {children}
        </Box>
        {isMobile && <BottomNav />}
      </Box>
    </Box>
  );
}
