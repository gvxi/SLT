"use client";

import { useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: 2,
        color: "text.secondary",
        px: 3,
        textAlign: "center",
      }}
    >

      <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 15, color: "text.primary" }}>
        Something went wrong
      </Typography>
      <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary", maxWidth: 360 }}>
        {error.message || "An unexpected error occurred. Please try again."}
      </Typography>
      <Button size="small" variant="outlined" onClick={reset}>
        Try again
      </Button>
    </Box>
  );
}
