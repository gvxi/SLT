"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <Card
      variant="outlined"
      sx={{ width: "100%", maxWidth: 400, borderRadius: 2 }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          {t("auth.login")}
        </Typography>

        {login.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {login.error.message}
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
            helperText={errors.email?.message}
            sx={{ mb: 2 }}
          />
          <TextField
            label={t("auth.password")}
            type="password"
            fullWidth
            size="small"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
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

        <Typography variant="body2" sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
          {t("auth.noAccount")}{" "}
          <Link href="/auth/register" style={{ color: "inherit", fontWeight: 600 }}>
            {t("auth.register")}
          </Link>
        </Typography>
      </CardContent>
    </Card>
  );
}
