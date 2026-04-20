"use client";

import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function InvoicesPage() {
  const { t } = useTranslation();
  return <Typography variant="h5">{t("nav.invoices")}</Typography>;
}
