"use client";

import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import InventoryIcon from "@mui/icons-material/Inventory2";
import ReceiptIcon from "@mui/icons-material/Receipt";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useUIStore } from "@/store/uiStore";

const DRAWER_WIDTH = 240;
const DRAWER_COLLAPSED = 64;

const navItems = [
  { key: "dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { key: "tasks", path: "/tasks", icon: <TaskAltIcon /> },
  { key: "products", path: "/products", icon: <InventoryIcon /> },
  { key: "invoices", path: "/invoices", icon: <ReceiptIcon /> },
  { key: "quotations", path: "/quotations", icon: <RequestQuoteIcon /> },
  { key: "customers", path: "/customers", icon: <PeopleAltOutlinedIcon /> },
  { key: "settings", path: "/settings", icon: <SettingsIcon /> },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const width = sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED;

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarOpen ? "flex-end" : "center",
          p: 1,
          minHeight: 56,
        }}
      >
        {!isMobile && (
          <IconButton onClick={toggleSidebar} size="small">
            {sidebarOpen ? (
              theme.direction === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />
            ) : (
              theme.direction === "rtl" ? <ChevronLeftIcon /> : <ChevronRightIcon />
            )}
          </IconButton>
        )}
      </Box>
      <List sx={{ flex: 1, px: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
          return (
            <ListItemButton
              key={item.key}
              component={Link}
              href={item.path}
              onClick={isMobile ? onMobileClose : undefined}
              selected={isActive}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                minHeight: 44,
                justifyContent: sidebarOpen ? "initial" : "center",
                px: sidebarOpen ? 2 : 1.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarOpen ? 2 : 0,
                  justifyContent: "center",
                  color: isActive ? "primary.main" : "text.secondary",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {sidebarOpen && (
                <ListItemText
                  primary={t(`nav.${item.key}`)}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 400,
                      },
                    },
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
          borderRight: "1px solid",
          borderColor: "divider",
          transition: "width 200ms ease",
          overflowX: "hidden",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
