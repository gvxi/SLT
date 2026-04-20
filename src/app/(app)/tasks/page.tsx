"use client";

import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function TasksPage() {
  const { t } = useTranslation();
  return <Typography variant="h5">{t("nav.tasks")}</Typography>;
}
