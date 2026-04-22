"use client";

import { useState } from "react";
import { Box, Typography, Collapse, IconButton, Badge } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";

interface Props {
  activeCount?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function CollapsibleFilters({ activeCount = 0, children, defaultOpen = false }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        mb: 1.5,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      {/* Toggle header */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.875,
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <Badge badgeContent={activeCount || null} color="primary" sx={{ "& .MuiBadge-badge": { fontSize: 10, minWidth: 16, height: 16 } }}>
          <FilterListIcon sx={{ fontSize: 17, color: activeCount > 0 ? "primary.main" : "text.secondary" }} />
        </Badge>
        <Typography
          variant="body2"
          sx={{
            fontSize: 13,
            flex: 1,
            color: activeCount > 0 ? "primary.main" : "text.secondary",
            fontWeight: activeCount > 0 ? 600 : 400,
          }}
        >
          {t("common.filters", { defaultValue: "Filters" })}
          {activeCount > 0 && (
            <Typography component="span" sx={{ ml: 0.5, fontSize: 12, color: "primary.main" }}>
              ({activeCount})
            </Typography>
          )}
        </Typography>
        <IconButton
          size="small"
          sx={{
            p: 0.25,
            color: "text.secondary",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <ExpandMoreIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Filter content */}
      <Collapse in={open}>
        <Box sx={{ px: 1.5, pb: 1.5, pt: 0.75, display: "flex", flexDirection: "column", gap: 1.25 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
}
