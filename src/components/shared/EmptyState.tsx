"use client";

import { Box, Typography, Button, SvgIconProps } from "@mui/material";
import type { ComponentType } from "react";

interface Props {
  icon?: ComponentType<SvgIconProps>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 10,
        gap: 1,
        color: "text.disabled",
      }}
    >
      {Icon && <Icon sx={{ fontSize: 36, mb: 0.5 }} />}
      <Typography variant="body2" sx={{ fontWeight: 500, color: "text.secondary", fontSize: 14 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 12 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button size="small" variant="outlined" onClick={onAction} sx={{ mt: 1, fontSize: 13 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
