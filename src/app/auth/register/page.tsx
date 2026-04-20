"use client";

import { useState } from "react";
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
import { useRegister } from "@/hooks/useAuth";

const schema = z
  .object({
    full_name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    confirm_password: z.string().min(6),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const register_ = useRegister();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await register_.mutateAsync({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      });
      setSuccess(true);
    } catch {
      // error shown via register_.error
    }
  };

  if (success) {
    return (
      <Card variant="outlined" sx={{ width: "100%", maxWidth: 400, borderRadius: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            {t("auth.checkEmail")}
          </Alert>
          <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary" }}>
            <Link href="/auth/login" style={{ color: "inherit", fontWeight: 600 }}>
              {t("auth.login")}
            </Link>
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{ width: "100%", maxWidth: 400, borderRadius: 2 }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          {t("auth.register")}
        </Typography>

        {register_.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {register_.error.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            label={t("auth.fullName")}
            fullWidth
            size="small"
            {...register("full_name")}
            error={!!errors.full_name}
            helperText={errors.full_name?.message}
            sx={{ mb: 2 }}
          />
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
            sx={{ mb: 2 }}
          />
          <TextField
            label={t("auth.confirmPassword")}
            type="password"
            fullWidth
            size="small"
            {...register("confirm_password")}
            error={!!errors.confirm_password}
            helperText={errors.confirm_password?.message}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting || register_.isPending}
          >
            {register_.isPending ? t("common.loading") : t("auth.register")}
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 2, textAlign: "center", color: "text.secondary" }}>
          {t("auth.hasAccount")}{" "}
          <Link href="/auth/login" style={{ color: "inherit", fontWeight: 600 }}>
            {t("auth.login")}
          </Link>
        </Typography>
      </CardContent>
    </Card>
  );
}
