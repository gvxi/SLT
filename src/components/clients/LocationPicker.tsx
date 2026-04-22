"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  CircularProgress,
  IconButton,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "action.hover" }}>
      <CircularProgress size={24} />
    </Box>
  ),
});

interface Props {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
}

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const { t } = useTranslation();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLocation = lat != null && lng != null;
  const mapLat = lat ?? 24.7136;
  const mapLng = lng ?? 46.6753; // Default: Riyadh

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError(t("customers.geoNotSupported"));
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setError(t("customers.geoError"));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleClear = () => onChange(null, null);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {/* Controls */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={locating ? <CircularProgress size={13} color="inherit" /> : <MyLocationIcon sx={{ fontSize: 15 }} />}
          onClick={handleUseMyLocation}
          disabled={locating}
          sx={{ fontSize: 12, py: 0.5, borderColor: "divider", color: "text.primary" }}
        >
          {t("customers.useMyLocation")}
        </Button>
        {hasLocation && (
          <Button
            size="small"
            variant="text"
            onClick={handleClear}
            sx={{ fontSize: 12, color: "text.secondary" }}
          >
            {t("customers.clearLocation")}
          </Button>
        )}
        {error && (
          <Typography variant="caption" sx={{ color: "error.main", fontSize: 11 }}>
            {error}
          </Typography>
        )}
      </Box>

      {/* Coordinate inputs */}
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          size="small"
          label={t("customers.lat")}
          type="number"
          value={lat ?? ""}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(isNaN(v) ? null : v, lng);
          }}
          sx={{ flex: 1 }}
          slotProps={{ input: { sx: { fontSize: 12 } }, inputLabel: { sx: { fontSize: 12 } } }}
        />
        <TextField
          size="small"
          label={t("customers.lng")}
          type="number"
          value={lng ?? ""}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(lat, isNaN(v) ? null : v);
          }}
          sx={{ flex: 1 }}
          slotProps={{ input: { sx: { fontSize: 12 } }, inputLabel: { sx: { fontSize: 12 } } }}
        />
      </Box>

      {/* Map */}
      <Box
        sx={{
          height: 220,
          borderRadius: 1,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          position: "relative",
        }}
      >
        <LeafletMap lat={mapLat} lng={mapLng} onChange={onChange} />
        {!hasLocation && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              bgcolor: "rgba(0,0,0,0.03)",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 11, bgcolor: "background.paper", px: 1, py: 0.5, borderRadius: 1 }}>
              {t("customers.mapHint")}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
