"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Typography,
  Chip,
} from "@mui/material";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import type { SxProps, Theme } from "@mui/material";

const HISTORY_KEY = "price_history";
const MAX_HISTORY = 5;

function loadHistory(): number[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(value: number, current: number[]): number[] {
  const deduped = [value, ...current.filter((v) => v !== value)].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(deduped));
  } catch {}
  return deduped;
}

interface PriceInputButtonProps {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  sx?: SxProps<Theme>;
}

interface DialogState {
  inputStr: string;
  cursorPos: number;
  history: number[];
}

export default function PriceInputButton({ value, onChange, label, disabled, min = 0, max, sx }: PriceInputButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<DialogState>({ inputStr: "", cursorPos: 0, history: [] });

  const handleOpen = () => {
    const initStr = value === 0 ? "" : String(value);
    setState({ inputStr: initStr, cursorPos: initStr.length, history: loadHistory() });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const confirm = useCallback((str: string) => {
    const parsed = parseFloat(str);
    const num = isNaN(parsed) ? 0 : parsed;
    const clamped = max !== undefined ? Math.min(max, Math.max(min, num)) : Math.max(min, num);
    setState((s) => ({ ...s, history: saveHistory(clamped, s.history) }));
    onChange(clamped);
    setOpen(false);
  }, [min, max, onChange]);

  const insertChar = useCallback((char: string) => {
    setState((s) => {
      if (char === "." && s.inputStr.includes(".")) return s;
      // Prevent leading zeros like "007"
      if (char !== "." && s.inputStr === "0") {
        const next = char;
        return { ...s, inputStr: next, cursorPos: 1 };
      }
      const next = s.inputStr.slice(0, s.cursorPos) + char + s.inputStr.slice(s.cursorPos);
      return { ...s, inputStr: next, cursorPos: s.cursorPos + 1 };
    });
  }, []);

  const backspace = useCallback(() => {
    setState((s) => {
      if (s.cursorPos === 0) return s;
      const next = s.inputStr.slice(0, s.cursorPos - 1) + s.inputStr.slice(s.cursorPos);
      return { ...s, inputStr: next, cursorPos: s.cursorPos - 1 };
    });
  }, []);

  const deleteForward = useCallback(() => {
    setState((s) => {
      if (s.cursorPos >= s.inputStr.length) return s;
      const next = s.inputStr.slice(0, s.cursorPos) + s.inputStr.slice(s.cursorPos + 1);
      return { ...s, inputStr: next };
    });
  }, []);

  const moveCursor = useCallback((dir: -1 | 1) => {
    setState((s) => ({
      ...s,
      cursorPos: Math.max(0, Math.min(s.inputStr.length, s.cursorPos + dir)),
    }));
  }, []);

  const clear = useCallback(() => {
    setState((s) => ({ ...s, inputStr: "", cursorPos: 0 }));
  }, []);

  const setFromHistory = useCallback((val: number) => {
    const str = String(val);
    setState((s) => ({ ...s, inputStr: str, cursorPos: str.length }));
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") { e.preventDefault(); insertChar(e.key); }
      else if (e.key === ".") { e.preventDefault(); insertChar("."); }
      else if (e.key === "Backspace") { e.preventDefault(); backspace(); }
      else if (e.key === "Delete") { e.preventDefault(); deleteForward(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); moveCursor(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); moveCursor(1); }
      else if (e.key === "Enter") { e.preventDefault(); confirm(state.inputStr); }
      else if (e.key === "Escape") { e.preventDefault(); handleClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, state.inputStr, insertChar, backspace, deleteForward, moveCursor, confirm]);

  const displayStr = state.inputStr || "0";
  const beforeCursor = state.inputStr.slice(0, state.cursorPos);
  const afterCursor = state.inputStr.slice(state.cursorPos);

  const padBtn = (content: React.ReactNode, onClick: () => void, color?: "primary" | "error" | "success", variant?: "contained" | "outlined" | "text") => (
    <Button
      variant={variant ?? "outlined"}
      color={color ?? "inherit"}
      onClick={onClick}
      tabIndex={-1}
      sx={{
        minWidth: 0,
        flex: 1,
        py: 1.5,
        fontSize: 16,
        fontWeight: 500,
        color: color === "error" ? "error.main" : color === "success" ? "success.contrastText" : "text.primary",
        borderColor: "divider",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      {content}
    </Button>
  );

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, ...sx as object }}>
        {label && (
          <Typography variant="caption" sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1 }}>
            {label}
          </Typography>
        )}
        <Button
          variant="outlined"
          size="small"
          disabled={disabled}
          onClick={handleOpen}
          sx={{
            fontFamily: "monospace",
            fontSize: 13,
            fontWeight: 500,
            color: "text.primary",
            borderColor: "divider",
            justifyContent: "flex-end",
            px: 1,
            minWidth: 64,
            "&:hover": { borderColor: "primary.main" },
          }}
        >
          {value === 0 ? "0" : value % 1 === 0 ? value.toString() : value.toString()}
        </Button>
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        slotProps={{ paper: { sx: { width: 280, borderRadius: 2 } } }}
      >
        <DialogContent sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
          {/* Display */}
          <Box
            sx={{
              bgcolor: "action.hover",
              borderRadius: 1,
              px: 1.5,
              py: 1,
              textAlign: "right",
              fontFamily: "monospace",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 1,
              minHeight: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              overflow: "hidden",
            }}
          >
            {state.inputStr.length > 0 ? (
              <>
                <span>{beforeCursor}</span>
                <span style={{ borderLeft: "2px solid currentColor", height: "1em", margin: "0 1px" }} />
                <span>{afterCursor}</span>
              </>
            ) : (
              <span style={{ color: "var(--mui-palette-text-disabled, #aaa)", fontWeight: 400 }}>0</span>
            )}
          </Box>

          {/* History chips */}
          {state.history.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {state.history.map((h, i) => (
                <Chip
                  key={i}
                  label={h % 1 === 0 ? h.toString() : h.toString()}
                  size="small"
                  variant="outlined"
                  onClick={() => setFromHistory(h)}
                  sx={{ fontSize: 11, fontFamily: "monospace", cursor: "pointer" }}
                />
              ))}
            </Box>
          )}

          {/* Keypad */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {/* Row 7 8 9 */}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {padBtn("7", () => insertChar("7"))}
              {padBtn("8", () => insertChar("8"))}
              {padBtn("9", () => insertChar("9"))}
            </Box>
            {/* Row 4 5 6 */}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {padBtn("4", () => insertChar("4"))}
              {padBtn("5", () => insertChar("5"))}
              {padBtn("6", () => insertChar("6"))}
            </Box>
            {/* Row 1 2 3 */}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {padBtn("1", () => insertChar("1"))}
              {padBtn("2", () => insertChar("2"))}
              {padBtn("3", () => insertChar("3"))}
            </Box>
            {/* Row ← 0 → */}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {padBtn(<BackspaceOutlinedIcon sx={{ fontSize: 18 }} />, backspace, "error")}
              {padBtn("0", () => insertChar("0"))}
              {padBtn(<ArrowForwardIcon sx={{ fontSize: 18 }} />, () => moveCursor(1))}
            </Box>
            {/* Row C . ✓ */}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Button
                variant="outlined"
                onClick={clear}
                tabIndex={-1}
                sx={{ minWidth: 0, flex: 1, py: 1.5, fontSize: 13, fontWeight: 600, borderColor: "divider", color: "warning.main" }}
              >
                C
              </Button>
              {padBtn(".", () => insertChar("."))}
              <Button
                variant="contained"
                color="primary"
                onClick={() => confirm(state.inputStr)}
                tabIndex={-1}
                sx={{ minWidth: 0, flex: 1, py: 1.5 }}
              >
                <CheckIcon sx={{ fontSize: 18 }} />
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
