"use client";

import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  Skeleton,
  Box,
} from "@mui/material";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import { useTranslation } from "react-i18next";

interface ActivityItem {
  id: string;
  type: "invoice" | "task";
  label: string;
  sub: string;
  date: string;
}

interface Props {
  items: ActivityItem[];
  loading?: boolean;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function RecentActivity({ items, loading }: Props) {
  const { t } = useTranslation();

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: 13 }}>
          {t("dashboard.recentActivity")}
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, py: 1 }}>
            {t("common.noData")}
          </Typography>
        ) : (
          <List dense disablePadding>
            {items.map((item) => (
              <ListItem key={item.id} disableGutters sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {item.type === "invoice" ? (
                    <ReceiptOutlinedIcon sx={{ fontSize: 18 }} color="primary" />
                  ) : (
                    <AssignmentOutlinedIcon sx={{ fontSize: 18 }} color="action" />
                  )}
                </ListItemIcon>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, textTransform: "capitalize" }}>
                    {item.sub.replace("_", " ")}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.disabled" sx={{ ml: 1.5, whiteSpace: "nowrap", fontSize: 11 }}>
                  {relativeTime(item.date)}
                </Typography>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
