"use client";

import React from "react";
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Typography,
  Skeleton,
  Paper,
  Tooltip,
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { useTranslation } from "react-i18next";
import { useRestockReports } from "@/hooks/useRestock";
import type { RestockReport } from "@/types";

interface Props {
  onViewPdf: (report: RestockReport) => void;
}

function fmtDate(s: string): string {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString();
}

export default function RestockReportsSection({ onViewPdf }: Props) {
  const { t } = useTranslation();
  const { data: reports = [], isLoading } = useRestockReports();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} height={44} variant="rectangular" sx={{ borderRadius: 1 }} />
        ))}
      </Box>
    );
  }

  if (reports.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 6 }}>
        {t("products.noRestockReports")}
      </Typography>
    );
  }

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{t("restock.reportNumber")}</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{t("common.date")}</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: 13, textAlign: "right" }}>
              {t("restock.itemsCount")}
            </TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{t("common.createdBy")}</TableCell>
            <TableCell sx={{ width: 48 }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id} hover>
              <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{report.report_number}</TableCell>
              <TableCell sx={{ fontSize: 13 }}>{fmtDate(report.created_at)}</TableCell>
              <TableCell sx={{ fontSize: 13, textAlign: "right" }}>
                {report.restock_report_items?.length ?? 0}
              </TableCell>
              <TableCell sx={{ fontSize: 13 }}>{report.creator?.full_name ?? "—"}</TableCell>
              <TableCell>
                <Tooltip title={t("common.exportPdf")}>
                  <IconButton size="small" onClick={() => onViewPdf(report)}>
                    <PictureAsPdfIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </Box>
    </Paper>
  );
}
