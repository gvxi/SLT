"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  Typography,
  Skeleton,
} from "@mui/material";
import TableRowsIcon from "@mui/icons-material/TableRows";
import GridViewIcon from "@mui/icons-material/GridView";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/useProducts";
import ProductTable from "@/components/products/ProductTable";
import ProductGrid from "@/components/products/ProductGrid";
import ProductForm from "@/components/products/ProductForm";
import type { Product } from "@/types";

type ViewMode = "table" | "grid";

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const router = useRouter();

  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useProducts();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q) ||
        (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, search]);

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditProduct(null);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t("nav.products")}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => { setEditProduct(null); setFormOpen(true); }}
        >
          {t("products.newProduct")}
        </Button>
      </Box>

      {/* Toolbar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <ToggleButtonGroup
          value={view}
          exclusive
          size="small"
          onChange={(_, v) => { if (v) setView(v); }}
        >
          <ToggleButton value="table" sx={{ px: 1.5 }}>
            <TableRowsIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
          <ToggleButton value="grid" sx={{ px: 1.5 }}>
            <GridViewIcon sx={{ fontSize: 18 }} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={40} variant="rectangular" sx={{ borderRadius: 1 }} />)}
        </Box>
      ) : view === "table" ? (
        <ProductTable products={filtered} onEdit={handleEdit} />
      ) : (
        <ProductGrid products={filtered} onEdit={handleEdit} />
      )}

      {/* Form dialog */}
      <ProductForm
        open={formOpen}
        product={editProduct}
        onClose={handleCloseForm}
      />
    </Box>
  );
}

