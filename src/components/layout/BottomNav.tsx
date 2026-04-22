"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePathname, useRouter } from "next/navigation";
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Fab,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import InventoryIcon from "@mui/icons-material/Inventory2";
import ReceiptIcon from "@mui/icons-material/Receipt";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import SettingsIcon from "@mui/icons-material/Settings";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import { useProfile } from "@/hooks/useProfiles";

// MUI BottomNavigation clones all children and injects `showLabel`.
// This spacer absorbs that prop so it never reaches the DOM.
function NavSpacer({ showLabel: _, ...props }: { showLabel?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}

const ALL_NAV_ITEMS = {
  dashboard: { icon: <DashboardIcon />, path: "/dashboard" },
  tasks: { icon: <TaskAltIcon />, path: "/tasks" },
  products: { icon: <InventoryIcon />, path: "/products" },
  invoices: { icon: <ReceiptIcon />, path: "/invoices" },
  quotations: { icon: <RequestQuoteIcon />, path: "/quotations" },
  settings: { icon: <SettingsIcon />, path: "/settings" },
} as const;

type NavKey = keyof typeof ALL_NAV_ITEMS;
const DEFAULT_NAV: NavKey[] = ["dashboard", "tasks", "products", "invoices"];

const ADD_ACTIONS = [
  { key: "task", icon: <AddTaskOutlinedIcon />, path: "/tasks?new=1" },
  { key: "product", icon: <AddBoxOutlinedIcon />, path: "/products?new=1" },
  { key: "invoice", icon: <ReceiptLongOutlinedIcon />, path: "/invoices?new=1" },
  { key: "quotation", icon: <RequestQuoteOutlinedIcon />, path: "/quotations?new=1" },
] as const;

export default function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { data: profile } = useProfile();
  const [fabOpen, setFabOpen] = useState(false);

  const navKeys: NavKey[] =
    (profile?.bottom_nav_config?.filter((k): k is NavKey => k in ALL_NAV_ITEMS) as NavKey[]) ??
    DEFAULT_NAV;

  // Split into left half and right half to place FAB in centre
  const mid = Math.ceil(navKeys.length / 2);
  const leftKeys = navKeys.slice(0, mid);
  const rightKeys = navKeys.slice(mid);

  const currentKey = navKeys.find(
    (k) => pathname === ALL_NAV_ITEMS[k].path || pathname.startsWith(ALL_NAV_ITEMS[k].path + "/")
  );
  const keyIndex = currentKey ? navKeys.indexOf(currentKey) : -1;
  // MUI BottomNavigation uses child position as value. NavSpacer occupies slot `mid`,
  // so right-half items are shifted by 1 compared to their index in navKeys.
  const currentNavIndex: number | false =
    keyIndex < 0 ? false : keyIndex >= mid ? keyIndex + 1 : keyIndex;

  const renderAction = (key: NavKey) => (
    <BottomNavigationAction
      key={key}
      label={t(`nav.${key}`)}
      icon={ALL_NAV_ITEMS[key].icon}
      onClick={() => router.push(ALL_NAV_ITEMS[key].path)}
      sx={{
        minWidth: 0,
        maxWidth: 80,
        "& .MuiBottomNavigationAction-label": {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        },
      }}
    />
  );

  return (
    <>
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          borderTop: "1px solid",
          borderColor: "divider",
          overflow: "visible",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "body.invoice-drawer-open &": { transform: "translateY(100%)" },
          "body.quotation-drawer-open &": { transform: "translateY(100%)" },
        }}
        elevation={0}
      >
        {/* FAB lives outside BottomNavigation so MUI never clones showLabel onto it */}
        <Fab
          size="small"
          color="primary"
          onClick={() => setFabOpen(true)}
          sx={{
            position: "absolute",
            top: -20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          }}
        >
          <AddIcon />
        </Fab>

        <BottomNavigation
          value={currentNavIndex}
          showLabels
          sx={{ overflow: "visible" }}
        >
          {leftKeys.map(renderAction)}

          {/* Spacer for FAB */}
          <NavSpacer style={{ width: 72, flexShrink: 0 }} />

          {rightKeys.map(renderAction)}
        </BottomNavigation>
      </Paper>

      {/* Add action sheet */}
      <Drawer
        anchor="bottom"
        open={fabOpen}
        onClose={() => setFabOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: "12px 12px 0 0", pb: 2 } } }}
      >
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 600, color: "text.disabled", letterSpacing: 0.5, textTransform: "uppercase" }}>
            {t("common.addNew", { defaultValue: "Add New" })}
          </Typography>
        </Box>
        <List disablePadding>
          {ADD_ACTIONS.map((action) => (
            <ListItemButton
              key={action.key}
              onClick={() => {
                setFabOpen(false);
                router.push(action.path);
              }}
              sx={{ px: 2, py: 1.25 }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
                {action.icon}
              </ListItemIcon>
              <ListItemText
                primary={t(`common.new${action.key.charAt(0).toUpperCase()}${action.key.slice(1)}`, {
                  defaultValue: t(`${action.key}s.new${action.key.charAt(0).toUpperCase()}${action.key.slice(1)}`, { defaultValue: action.key }),
                })}
                slotProps={{ primary: { sx: { fontSize: 14 } } }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </>
  );
}
