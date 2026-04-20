"use client";

import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import InventoryIcon from "@mui/icons-material/Inventory2";
import ReceiptIcon from "@mui/icons-material/Receipt";

const navItems = [
  { key: "dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { key: "tasks", path: "/tasks", icon: <TaskAltIcon /> },
  { key: "products", path: "/products", icon: <InventoryIcon /> },
  { key: "invoices", path: "/invoices", icon: <ReceiptIcon /> },
];

export default function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  const currentIndex = navItems.findIndex(
    (item) => pathname === item.path || pathname.startsWith(item.path + "/")
  );

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderTop: "1px solid",
        borderColor: "divider",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "body.invoice-drawer-open &": { transform: "translateY(100%)" },
      }}
      elevation={0}
    >
      <BottomNavigation
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={(_, newValue) => {
          router.push(navItems[newValue].path);
        }}
        showLabels
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.key}
            label={t(`nav.${item.key}`)}
            icon={item.icon}
            sx={{
              minWidth: 0,
              maxWidth: 96,
              "& .MuiBottomNavigationAction-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
