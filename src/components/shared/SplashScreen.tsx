"use client";

import { Box, Typography } from "@mui/material";

export default function SplashScreen() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "background.default",
        zIndex: 9999,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          letterSpacing: "-0.5px",
          color: "text.primary",
          opacity: 0.85,
        }}
      >
        SLT
      </Typography>
    </Box>
  );
}
