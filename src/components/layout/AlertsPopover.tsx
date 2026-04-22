"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Popover,
  Box,
  Typography,
  Divider,
  Button,
  List,
  ListItem,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import {
  useAlerts,
  useDismissAlert,
  useDismissAllAlerts,
} from "@/hooks/useAlerts";
import type { Alert, AlertsResponse } from "@/hooks/useAlerts";

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  error: <ErrorOutlineIcon sx={{ fontSize: 18, color: "error.main" }} />,
  warning: <WarningAmberIcon sx={{ fontSize: 18, color: "warning.main" }} />,
  info: <InfoOutlinedIcon sx={{ fontSize: 18, color: "info.main" }} />,
};

const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface SwipeableAlertItemProps {
  alert: Alert;
  onDismiss: (id: string) => void;
  onClick: (alert: Alert) => void;
}

function SwipeableAlertItem({ alert, onDismiss, onClick }: SwipeableAlertItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    setTranslateX(delta);
  };

  const handleTouchEnd = () => {
    if (Math.abs(translateX) > 80) {
      setDismissed(true);
      setTimeout(() => onDismiss(alert.id), 200);
    } else {
      setTranslateX(0);
    }
    touchStartX.current = null;
  };

  const handleClick = useCallback(() => {
    onClick(alert);
  }, [alert, onClick]);

  if (dismissed) return null;

  return (
    <ListItem
      disablePadding
      sx={{
        transform: `translateX(${translateX}px)`,
        opacity: dismissed ? 0 : Math.abs(translateX) > 40 ? 0.5 : 1,
        transition: dismissed ? "all 0.2s ease" : translateX === 0 ? "transform 0.2s ease" : undefined,
        px: 1.5,
        py: 0.75,
        cursor: "pointer",
        "&:hover": { bgcolor: "action.hover" },
        alignItems: "flex-start",
        gap: 1,
        display: "flex",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <Box sx={{ mt: 0.25, flexShrink: 0 }}>{SEVERITY_ICON[alert.severity]}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontSize: 13,
            fontWeight: alert.is_read ? 400 : 600,
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {alert.title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.25, lineHeight: 1.3 }}
        >
          {alert.body}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25 }}>
          {timeAgo(alert.created_at)}
        </Typography>
      </Box>
      <Tooltip title="Dismiss">
        <IconButton
          size="small"
          sx={{ flexShrink: 0, mt: -0.5, mr: -0.5 }}
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(alert.id);
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </ListItem>
  );
}

interface AlertsPopoverProps {
  anchor: HTMLElement | null;
  onClose: () => void;
}

export default function AlertsPopover({ anchor, onClose }: AlertsPopoverProps) {
  const router = useRouter();
  const { data, isLoading } = useAlerts(true);
  const dismiss = useDismissAlert();
  const dismissAll = useDismissAllAlerts();

  const typedData = data as AlertsResponse | undefined;
  const alerts = [...(typedData?.data ?? [])].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleItemClick = useCallback(
    (alert: Alert) => {
      dismiss.mutate(alert.id);
      onClose();
      if (alert.link) router.push(alert.link);
    },
    [dismiss, onClose, router]
  );

  const handleDismissAll = () => {
    dismissAll.mutate();
  };

  return (
    <Popover
      open={Boolean(anchor)}
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      slotProps={{ paper: { sx: { width: 360, mt: 0.5, maxHeight: 480 } } }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Alerts
          {alerts.length > 0 && (
            <Typography
              component="span"
              variant="caption"
              sx={{ ml: 0.75, color: "text.secondary" }}
            >
              ({alerts.length})
            </Typography>
          )}
        </Typography>
        {alerts.length > 0 && (
          <Tooltip title="Dismiss all">
            <Button
              size="small"
              startIcon={<DoneAllIcon sx={{ fontSize: 14 }} />}
              onClick={handleDismissAll}
              disabled={dismissAll.isPending}
            >
              Clear all
            </Button>
          </Tooltip>
        )}
      </Box>

      <Divider />

      {/* Body */}
      <Box sx={{ overflowY: "auto", maxHeight: 400 }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={20} />
          </Box>
        ) : !alerts.length ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ px: 2, py: 3, textAlign: "center" }}
          >
            No active alerts
          </Typography>
        ) : (
          <List disablePadding dense>
            {alerts.map((alert, i) => (
              <Box key={alert.id}>
                {i > 0 && <Divider component="li" sx={{ mx: 1.5 }} />}
                <SwipeableAlertItem
                  alert={alert}
                  onDismiss={(id) => dismiss.mutate(id)}
                  onClick={handleItemClick}
                />
              </Box>
            ))}
          </List>
        )}
      </Box>
    </Popover>
  );
}
