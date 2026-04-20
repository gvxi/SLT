"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  TextField,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import {
  useProductCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type ProductCategory,
} from "@/hooks/useProductCategories";

export default function ProductCategories() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useProductCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProductCategory | null>(null);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setAddError(t("categories.duplicateName"));
      return;
    }
    await createCat.mutateAsync({ name });
    setNewName("");
    setAddError("");
  };

  const startEdit = (cat: ProductCategory) => {
    setEditId(cat.id);
    setEditName(cat.name);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  const commitEdit = async () => {
    if (!editId || !editName.trim()) return;
    await updateCat.mutateAsync({ id: editId, name: editName.trim() });
    cancelEdit();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteCat.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <Box>
      {/* Add new category row */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, alignItems: "flex-start" }}>
        <TextField
          size="small"
          placeholder={t("categories.newName")}
          value={newName}
          onChange={(e) => { setNewName(e.target.value); setAddError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          error={!!addError}
          helperText={addError || " "}
          sx={{ width: 260 }}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={createCat.isPending || !newName.trim()}
          sx={{ mt: 0.25 }}
        >
          {t("common.create")}
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={40} variant="rectangular" sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      ) : (
        <Table size="small" sx={{ maxWidth: 480 }}>
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 600, fontSize: 13 } }}>
              <TableCell>{t("categories.name")}</TableCell>
              <TableCell align="right" sx={{ width: 80 }}>
                {t("common.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.id} hover>
                <TableCell>
                  {editId === cat.id ? (
                    <TextField
                      autoFocus
                      size="small"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                      sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
                    />
                  ) : (
                    <Typography variant="body2">{cat.name}</Typography>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  {editId === cat.id ? (
                    <>
                      <Tooltip title={t("common.save")}>
                        <IconButton size="small" onClick={commitEdit} disabled={updateCat.isPending}>
                          <CheckIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t("common.cancel")}>
                        <IconButton size="small" onClick={cancelEdit}>
                          <CloseIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip title={t("common.edit")}>
                        <IconButton size="small" onClick={() => startEdit(cat)}>
                          <EditIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t("common.delete")}>
                        <IconButton size="small" onClick={() => setDeleteTarget(cat)}>
                          <DeleteIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ py: 5, color: "text.disabled" }}>
                  {t("common.noData")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 1.5 } } }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: 15, pb: 1 }}>
          {t("common.confirmDelete")}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("categories.deleteWarning", { name: deleteTarget?.name ?? "" })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" onClick={() => setDeleteTarget(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteCat.isPending}
            onClick={confirmDelete}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
