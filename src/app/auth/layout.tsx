import AppProviders from "@/components/providers/AppProviders";
import LangToggle from "@/components/shared/LangToggle";
import { Box } from "@mui/material";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.default",
          position: "relative",
          p: 2,
        }}
      >
        <Box sx={{ position: "absolute", top: 16, right: 16 }}>
          <LangToggle />
        </Box>
        {children}
      </Box>
    </AppProviders>
  );
}
