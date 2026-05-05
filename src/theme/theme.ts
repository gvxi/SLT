import { createTheme, type ThemeOptions, type Direction } from "@mui/material/styles";

const getDesignTokens = (mode: "light" | "dark", direction: Direction): ThemeOptions => ({
  direction,
  palette: {
    mode,
    primary: {
      main: "#c80000",
      light: "#e53935",
      dark: "#8b0000",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#FF6F00",
      light: "#FF8F00",
      dark: "#E65100",
    },
    background: mode === "light"
      ? { default: "#F5F5F5", paper: "#FFFFFF" }
      : { default: "#121212", paper: "#1E1E1E" },
  },
  typography: {
    fontFamily: direction === "rtl" ? "'Cairo', sans-serif" : "'Inter', sans-serif",
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: "8px 16px",
        },
      },
    },
  },
});

export function createAppTheme(mode: "light" | "dark", direction: Direction, _scale = 1) {
  return createTheme(getDesignTokens(mode, direction));
}
