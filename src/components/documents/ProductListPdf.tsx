import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { Product } from "@/types";
import "@/components/documents/pdfFonts";

// ─── Company constants ────────────────────────────────────────────────────────
const CO = {
  nameEn: "AL-SULAIMI NATIONAL ENTERPRISES TRAD",
  nameAr: "مشـاريـع السلـيـمـي الأهـلـيـة للـتـجـارة",
  regEn: "Registration Num: 1164403",
  regAr: "رقم التسجيل: 1164403",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTimestamp(): string {
  const now = new Date();
  const date = [
    String(now.getDate()).padStart(2, "0"),
    String(now.getMonth() + 1).padStart(2, "0"),
    now.getFullYear(),
  ].join("/");
  const time = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].join(":");
  return `${date}  ${time}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: "Cairo",
    fontSize: 9,
    color: "#222222",
    paddingTop: 28,
    paddingBottom: 52,
    paddingHorizontal: 28,
    lineHeight: 1.4,
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 20,
  },
  logoImg: { width: 140, height: 42, objectFit: "contain" },
  vendor: { flex: 1, paddingLeft: 6 },
  vendorName: { fontSize: 12, fontWeight: 700, marginBottom: 3 },
  vendorSub: { fontSize: 8, color: "#666666" },
  vendorReg: { fontSize: 8, color: "#666666", marginTop: 2 },
  metaBlock: { minWidth: 150, alignItems: "flex-end" },
  metaLabel: { fontSize: 8, color: "#777777" },
  metaValue: { fontSize: 10, fontWeight: 700, marginBottom: 4 },
  metaDateLabel: { fontSize: 8, color: "#777777" },
  metaDateValue: { fontSize: 10, fontWeight: 700 },
  divider: { borderBottomWidth: 1.5, borderBottomColor: "#dddddd", marginBottom: 14 },
  docTitle: { fontSize: 15, fontWeight: 700, textAlign: "center", marginBottom: 14 },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    padding: 8,
    borderRadius: 5,
    backgroundColor: "#fbfbff",
    borderWidth: 1,
    borderColor: "#efeff5",
  },
  summaryLabel: { fontSize: 7.5, color: "#888888", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 },
  summaryValue: { fontSize: 13, fontWeight: 700 },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderBottomWidth: 2,
    borderBottomColor: "#eeeeee",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableLastRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  thText: { fontSize: 8.5, fontWeight: 700, color: "#333333" },
  tdText: { fontSize: 8.5, color: "#333333" },
  tdMuted: { fontSize: 8, color: "#888888" },
  colIdx:    { width: 24 },
  colSku:    { width: 64 },
  colName:   { flex: 1 },
  colCat:    { width: 80 },
  colPrice:  { width: 58, textAlign: "right" },
  colStock:  { width: 44, textAlign: "right" },
  colStatus: { width: 50, textAlign: "center" },
  badgeActive: {
    backgroundColor: "#dcfce7",
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 5,
    alignSelf: "center",
  },
  badgeInactive: {
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 5,
    alignSelf: "center",
  },
  badgeTextActive: { fontSize: 7.5, color: "#15803d", fontWeight: 700 },
  badgeTextInactive: { fontSize: 7.5, color: "#6b7280", fontWeight: 700 },
  footer: { position: "absolute", bottom: 20, left: 28, right: 28 },
  footerLine: { borderTopWidth: 0.5, borderTopColor: "#cccccc", marginBottom: 5 },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7.5, color: "#999999" },
});

// ─── Labels ───────────────────────────────────────────────────────────────────
function getLabels(language: "en" | "ar") {
  if (language === "ar") {
    return {
      title: "قائمة المنتجات",
      generatedAt: "وقت الإنشاء",
      totalProducts: "إجمالي المنتجات",
      activeProducts: "المنتجات النشطة",
      totalStock: "إجمالي المخزون",
      no: "#",
      sku: "SKU",
      name: "الاسم",
      category: "الفئة",
      price: "السعر (ر.ع.)",
      stock: "المخزون",
      status: "الحالة",
      active: "نشط",
      inactive: "غير نشط",
      uncategorized: "غير مصنف",
      page: "صفحة",
      of: "من",
    };
  }
  return {
    title: "Products List",
    generatedAt: "Generated At",
    totalProducts: "Total Products",
    activeProducts: "Active Products",
    totalStock: "Total Stock",
    no: "#",
    sku: "SKU",
    name: "Name",
    category: "Category",
    price: "Price (RO)",
    stock: "Stock",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    uncategorized: "Uncategorized",
    page: "Page",
    of: "of",
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  products: Product[];
  language: "en" | "ar";
}

// ─── Document ─────────────────────────────────────────────────────────────────
export function ProductListPdfDocument({ products, language }: Props) {
  const isAr = language === "ar";
  const L = getLabels(language);

  const activeCount = products.filter((p) => p.status === "active").length;
  const totalStock = products.reduce((s, p) => s + p.stock_qty, 0);
  const timestamp = fmtTimestamp();

  const pageDir = isAr ? ({ direction: "rtl" } as const) : {};

  return (
    <Document>
      <Page size="A4" style={[S.page, pageDir]}>

        {/* ── Header: Logo + Company + Meta ── */}
        <View style={S.headerRow}>
          <Image style={S.logoImg} src="/images/logo.png" />

          <View style={S.vendor}>
            {isAr ? (
              <>
                <Text style={S.vendorName}>{CO.nameAr}</Text>
                <Text style={S.vendorSub}>{CO.nameEn}</Text>
                <Text style={S.vendorReg}>{CO.regAr}</Text>
              </>
            ) : (
              <>
                <Text style={S.vendorName}>{CO.nameEn}</Text>
                <Text style={S.vendorSub}>{CO.nameAr}</Text>
                <Text style={S.vendorReg}>{CO.regEn}</Text>
              </>
            )}
          </View>

          <View style={S.metaBlock}>
            <Text style={S.metaLabel}>{L.generatedAt}</Text>
            <Text style={S.metaValue}>{timestamp}</Text>
            <Text style={S.metaDateLabel}>{L.totalProducts}</Text>
            <Text style={S.metaDateValue}>{String(products.length)}</Text>
          </View>
        </View>

        {/* ── Divider + Title ── */}
        <View style={S.divider} />
        <Text style={S.docTitle}>{L.title}</Text>

        {/* ── Summary cards ── */}
        <View style={S.summaryRow}>
          <View style={S.summaryCard}>
            <Text style={S.summaryLabel}>{L.totalProducts}</Text>
            <Text style={S.summaryValue}>{String(products.length)}</Text>
          </View>
          <View style={S.summaryCard}>
            <Text style={S.summaryLabel}>{L.activeProducts}</Text>
            <Text style={S.summaryValue}>{String(activeCount)}</Text>
          </View>
          <View style={S.summaryCard}>
            <Text style={S.summaryLabel}>{L.totalStock}</Text>
            <Text style={S.summaryValue}>{String(totalStock)}</Text>
          </View>
        </View>

        {/* ── Table header ── */}
        <View style={S.tableHeaderRow}>
          <Text style={[S.thText, S.colIdx]}>{L.no}</Text>
          <Text style={[S.thText, S.colSku]}>{L.sku}</Text>
          <Text style={[S.thText, S.colName]}>{L.name}</Text>
          <Text style={[S.thText, S.colCat]}>{L.category}</Text>
          <Text style={[S.thText, S.colPrice]}>{L.price}</Text>
          <Text style={[S.thText, S.colStock]}>{L.stock}</Text>
          <Text style={[S.thText, S.colStatus]}>{L.status}</Text>
        </View>

        {/* ── Table rows ── */}
        {products.map((p, index) => {
          const rowStyle = index === products.length - 1 ? S.tableLastRow : S.tableRow;
          const isActive = p.status === "active";
          const productName = isAr && p.name_ar ? p.name_ar : p.name_en;
          const category = p.category || L.uncategorized;

          return (
            <View key={p.id} style={rowStyle}>
              <Text style={[S.tdMuted, S.colIdx]}>{String(index + 1)}</Text>
              <Text style={[S.tdText, S.colSku]}>{p.sku}</Text>
              <Text style={[S.tdText, S.colName]}>{productName}</Text>
              <Text style={[S.tdMuted, S.colCat]}>{category}</Text>
              <Text style={[S.tdText, S.colPrice]}>{p.unit_price.toFixed(3)}</Text>
              <Text style={[S.tdText, S.colStock]}>{String(p.stock_qty)}</Text>
              <View style={[S.colStatus, { alignItems: "center" }]}>
                <View style={isActive ? S.badgeActive : S.badgeInactive}>
                  <Text style={isActive ? S.badgeTextActive : S.badgeTextInactive}>
                    {isActive ? L.active : L.inactive}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <View style={S.footerLine} />
          <View style={S.footerRow}>
            <Text style={S.footerText}>{CO.nameEn}</Text>
            <Text
              style={S.footerText}
              render={({ pageNumber, totalPages }) =>
                `${L.page} ${pageNumber} ${L.of} ${totalPages}`
              }
            />
          </View>
        </View>

      </Page>
    </Document>
  );
}
