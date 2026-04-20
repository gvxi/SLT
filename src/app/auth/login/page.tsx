"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
} from "@mui/material";
import { useLogin } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "auth.error.invalidCredentials";
  if (m.includes("email not confirmed")) return "auth.error.emailNotConfirmed";
  if (m.includes("too many") || m.includes("rate limit")) return "auth.error.tooManyRequests";
  if (m.includes("user not found") || m.includes("no user")) return "auth.error.userNotFound";
  if (m.includes("network") || m.includes("fetch")) return "auth.error.networkError";
  return "auth.error.unknown";
}

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login.mutateAsync(data);
      router.push("/dashboard");
    } catch {
      // error shown via login.error
    }
  };

  return (
    <Card variant="outlined" sx={{ width: "100%", maxWidth: 400, borderRadius: 2 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          {t("auth.login")}
        </Typography>

        {login.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t(mapAuthError(login.error.message))}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label={t("auth.email")}
            type="email"
            fullWidth
            size="small"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message && t("auth.error.invalidCredentials")}
            sx={{ mb: 2 }}
          />
          <TextField
            label={t("auth.password")}
            type="password"
            fullWidth
            size="small"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message && t("auth.error.invalidCredentials")}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting || login.isPending}
          >
            {login.isPending ? t("common.loading") : t("auth.login")}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

