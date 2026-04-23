"use client";

import { useEffect, useMemo, useState } from "react";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { useUIStore } from "@/store/uiStore";
import { createAppTheme } from "@/theme/theme";
import { createEmotionCache } from "@/theme/rtlCache";
import i18n from "@/lib/i18n";
import ToastContainer from "./ToastContainer";
import OneSignalProvider from "./OneSignalProvider";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const { language, themeMode } = useUIStore();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  const direction = language === "ar" ? "rtl" : "ltr";

  const emotionCache = useMemo(() => createEmotionCache(direction), [direction]);
  const theme = useMemo(() => createAppTheme(themeMode, direction), [themeMode, direction]);

  useEffect(() => {
    document.dir = direction;
    document.documentElement.lang = language;
    i18n.changeLanguage(language);
  }, [language, direction]);

  return (
    <I18nextProvider i18n={i18n}>
      <CacheProvider value={emotionCache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <QueryClientProvider client={queryClient}>
            {children}
            <ToastContainer />
            <OneSignalProvider />
          </QueryClientProvider>
        </ThemeProvider>
      </CacheProvider>
    </I18nextProvider>
  );
}
