"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Pagination,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { useLogs } from "@/hooks/useLogs";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ACTION_ICON: Record<string, React.ReactNode> = {
  created: <AddCircleOutlinedIcon sx={{ fontSize: 16, color: "success.main" }} />,
  updated: <EditOutlinedIcon sx={{ fontSize: 16, color: "info.main" }} />,
  deleted: <DeleteOutlinedIcon sx={{ fontSize: 16, color: "error.main" }} />,
};

const ACTION_COLOR: Record<string, "success" | "info" | "error"> = {
  created: "success",
  updated: "info",
  deleted: "error",
};

const ENTITY_TYPES = ["", "task", "invoice", "quotation", "product", "client"];
const PAGE_SIZE = 20;

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");

  const { data, isLoading } = useLogs({ page, limit: PAGE_SIZE, entity_type: entityType || undefined });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  const sortedLogs = data?.data
    ? [...data.data].sort((a, b) => {
        const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return sort === "desc" ? diff : -diff;
      })
    : [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Activity Logs
          {data && data.total > 0 && (
            <Typography component="span" variant="body2" sx={{ ml: 1, color: "text.secondary", fontWeight: 400 }}>
              {data.total}
            </Typography>
          )}
        </Typography>
      </Box>

      {/* Filters row */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Entity type</InputLabel>
          <Select
            label="Entity type"
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
          >
            {ENTITY_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type === "" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={sort}
          onChange={(_, v) => v && setSort(v)}
        >
          <ToggleButton value="desc" sx={{ px: 1.25 }}>
            <ArrowDownwardIcon sx={{ fontSize: 15, mr: 0.5 }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, fontSize: 12 }}>Newest</Box>
          </ToggleButton>
          <ToggleButton value="asc" sx={{ px: 1.25 }}>
            <ArrowUpwardIcon sx={{ fontSize: 15, mr: 0.5 }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, fontSize: 12 }}>Oldest</Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Table */}
      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height={40} variant="rectangular" sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      ) : !sortedLogs.length ? (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, px: 3, py: 6, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">No activity yet</Typography>
        </Box>
      ) : (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 600, color: "text.secondary", fontSize: 12, bgcolor: "action.hover", borderBottom: "1px solid", borderColor: "divider" } }}>
                <TableCell sx={{ width: 32 }} />
                <TableCell>Summary</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>By</TableCell>
                <TableCell>When</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedLogs.map((log) => (
                <TableRow key={log.id} sx={{ "& td": { fontSize: 13 } }}>
                  <TableCell sx={{ pl: 1.5, pr: 0 }}>{ACTION_ICON[log.action]}</TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body2" sx={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.summary}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.entity_type}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: 11, height: 20, textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      size="small"
                      color={ACTION_COLOR[log.action] ?? "default"}
                      variant="outlined"
                      sx={{ fontSize: 11, height: 20 }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>
                    {log.profile?.full_name ?? "—"}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                    {timeAgo(log.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2.5 }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} size="small" />
        </Box>
      )}
    </Box>
  );
}