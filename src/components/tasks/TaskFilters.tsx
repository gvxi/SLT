"use client";

import { Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useProfiles } from "@/hooks/useProfiles";

export default function TaskFilters() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: profiles = [] } = useProfiles();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>{t("tasks.priority")}</InputLabel>
        <Select
          value={searchParams.get("priority") ?? ""}
          label={t("tasks.priority")}
          onChange={(e) => setParam("priority", e.target.value)}
        >
          <MenuItem value="">{t("tasks.allPriorities")}</MenuItem>
          {(["low", "medium", "high", "urgent"] as const).map((p) => (
            <MenuItem key={p} value={p}>
              {t(`tasks.${p}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>{t("tasks.assignee")}</InputLabel>
        <Select
          value={searchParams.get("assignee_id") ?? ""}
          label={t("tasks.assignee")}
          onChange={(e) => setParam("assignee_id", e.target.value)}
        >
          <MenuItem value="">{t("tasks.allAssignees")}</MenuItem>
          {profiles.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.full_name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
