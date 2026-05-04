"use client";

import { Box, Tooltip } from "@mui/material";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import StoreIcon from "@mui/icons-material/Store";
import BusinessIcon from "@mui/icons-material/Business";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import StorefrontIcon from "@mui/icons-material/Storefront";
import FactoryIcon from "@mui/icons-material/Factory";
import GarageIcon from "@mui/icons-material/Garage";
import ArchiveIcon from "@mui/icons-material/Archive";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ApartmentIcon from "@mui/icons-material/Apartment";
import DomainIcon from "@mui/icons-material/Domain";
import InboxIcon from "@mui/icons-material/Inbox";
import CategoryIcon from "@mui/icons-material/Category";

export const STORAGE_ICONS: Record<string, React.ReactNode> = {
  Warehouse: <WarehouseIcon />,
  Store: <StoreIcon />,
  Business: <BusinessIcon />,
  HomeWork: <HomeWorkIcon />,
  LocalShipping: <LocalShippingIcon />,
  Inventory: <InventoryIcon />,
  Storefront: <StorefrontIcon />,
  Factory: <FactoryIcon />,
  Garage: <GarageIcon />,
  Archive: <ArchiveIcon />,
  ShoppingCart: <ShoppingCartIcon />,
  Apartment: <ApartmentIcon />,
  Domain: <DomainIcon />,
  Inbox: <InboxIcon />,
  Category: <CategoryIcon />,
};

export function StorageIconDisplay({ icon, size = 24 }: { icon?: string | null; size?: number }) {
  const key = icon && STORAGE_ICONS[icon] ? icon : "Warehouse";
  const node = STORAGE_ICONS[key];
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size,
        "& svg": { fontSize: "inherit" },
      }}
    >
      {node}
    </Box>
  );
}

interface StorageIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export default function StorageIconPicker({ value, onChange }: StorageIconPickerProps) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {Object.entries(STORAGE_ICONS).map(([key, node]) => (
        <Tooltip key={key} title={key} placement="top">
          <Box
            onClick={() => onChange(key)}
            sx={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
              cursor: "pointer",
              border: "1px solid",
              borderColor: value === key ? "primary.main" : "divider",
              bgcolor: value === key ? "primary.main" : "background.paper",
              color: value === key ? "primary.contrastText" : "text.secondary",
              transition: "all 120ms ease",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: value === key ? "primary.main" : "action.hover",
              },
            }}
          >
            {node}
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
}
