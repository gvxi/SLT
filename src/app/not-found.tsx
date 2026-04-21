import { Box, Typography } from "@mui/material";
import MuiLink from "@mui/material/Link";

export default function NotFound() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 2,
        px: 3,
        textAlign: "center",
      }}
    >
      <Typography
        variant="h1"
        sx={{ fontSize: 72, fontWeight: 700, color: "text.disabled", lineHeight: 1 }}
      >
        404
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 15, color: "text.primary" }}>
        Page not found
      </Typography>
      <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary", maxWidth: 320 }}>
        The page you are looking for does not exist or has been moved.
      </Typography>
      <MuiLink href="/dashboard" sx={{ mt: 1, fontSize: 13 }}>
        Go to Dashboard
      </MuiLink>
    </Box>
  );
}
