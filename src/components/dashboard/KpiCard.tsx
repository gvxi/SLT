"use client";

import { Box, Typography, Skeleton } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

interface Props {
  title: string;
  value: number | string;
  Icon: SvgIconComponent;
  color?: string;
  loading?: boolean;
}

export default function KpiCard({ title, value, Icon, color = "primary.main", loading }: Props) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1.5,
        px: 2,
        py: 1.75,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ color, lineHeight: 0, flexShrink: 0 }}>
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {loading ? (
          <>
            <Skeleton variant="text" width={50} height={26} />
            <Skeleton variant="text" width={80} height={14} />
          </>
        ) : (
          <>
            <Typography sx={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2, color: "text.primary" }}>
              {value}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: 11, color: "text.secondary", display: "block" }}>
              {title}
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
}
