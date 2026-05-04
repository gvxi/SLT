import React from "react";
import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";
import type { StorageTransfer } from "@/types";

// ─── Font ─────────────────────────────────────────────────────────────────────
Font.register({
  family: "Cairo",
  fonts: [
    { src: "/fonts/Cairo-Regular.ttf", fontWeight: 400, fontStyle: "normal" },
    { src: "/fonts/Cairo-Bold.ttf",    fontWeight: 700, fontStyle: "normal" },
  ],
});

const CO = {
  nameEn: "AL-SULAIMI NATIONAL ENTERPRISES TRAD",
  nameAr: "مشـاريـع السلـيـمـي الأهـلـيـة للـتـجـارة",
};

function fmtDate(s: string | null | undefined): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return [
    String(d.getDate()).padStart(2, "0"),
    String(d.getMonth() + 1).padStart(2, "0"),
    d.getFullYear(),
  ].join("/");
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
  },
  companyBlock: { flex: 1 },
  companyName: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
  companyNameAr: { fontSize: 11, fontWeight: 700, textAlign: "right", marginBottom: 2 },
  metaBlock: { minWidth: 160, alignItems: "flex-end" },
  metaLabel: { fontSize: 8, color: "#777777" },
  metaValue: { fontSize: 12, fontWeight: 700 },
  metaDate: { fontSize: 9, color: "#555555", marginTop: 4 },
  divider: { borderBottomWidth: 1.5, borderBottomColor: "#dddddd", marginBottom: 14 },
  docTitle: { fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 16 },
  storageRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  storageCard: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#fbfbff",
    borderWidth: 1,
    borderColor: "#efeff5",
  },
  cardLabel: { fontSize: 8, color: "#777777", marginBottom: 4, fontWeight: 700, textTransform: "uppercase" },
  cardValue: { fontSize: 11, fontWeight: 700 },
  cardValueAr: { fontSize: 10, color: "#444444", textAlign: "right", marginTop: 2 },
  arrowBlock: { justifyContent: "center", alignItems: "center", paddingVertical: 10 },
  arrowText: { fontSize: 18, color: "#888888" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eeeeee",
  },
  colIdx:    { width: 24, fontSize: 8, color: "#888888" },
  colSku:    { width: 70, fontSize: 8 },
  colName:   { flex: 1, fontSize: 8 },
  colNameAr: { flex: 1, fontSize: 8, textAlign: "right" },
  colQty:    { width: 50, fontSize: 8, textAlign: "right" },
  thText:    { fontSize: 8, fontWeight: 700, color: "#555555" },
  notes: {
    marginTop: 18,
    padding: 10,
    backgroundColor: "#fffdf0",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#eeeecc",
  },
  notesLabel: { fontSize: 8, fontWeight: 700, color: "#888888", marginBottom: 4 },
  notesText: { fontSize: 9 },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 28,
    right: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#cccccc",
    paddingTop: 6,
  },
  footerText: { fontSize: 7.5, color: "#999999" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 8,
    paddingHorizontal: 6,
    gap: 12,
  },
  totalLabel: { fontSize: 9, fontWeight: 700, color: "#555555" },
  totalValue: { fontSize: 9, fontWeight: 700 },
});

// ─── Document Component ───────────────────────────────────────────────────────
interface Props {
  transfer: StorageTransfer;
  language: "en" | "ar";
}

export function StorageTransferPdfDocument({ transfer, language }: Props) {
  const isAr = language === "ar";
  const items = transfer.storage_transfer_items ?? [];
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  const fromName = transfer.from_storage
    ? (isAr && transfer.from_storage.name_ar) || transfer.from_storage.name_en
    : transfer.from_storage_id;
  const toName = transfer.to_storage
    ? (isAr && transfer.to_storage.name_ar) || transfer.to_storage.name_en
    : transfer.to_storage_id;

  const labels = isAr
    ? {
        title: "تقرير نقل المخزون",
        transfer: "رقم النقل",
        date: "التاريخ",
        from: "من المخزن",
        to: "إلى المخزن",
        no: "#",
        sku: "الرمز",
        product: "المنتج",
        qty: "الكمية",
        notes: "ملاحظات",
        total: "إجمالي الكميات",
        createdBy: "بواسطة",
        page: "صفحة",
      }
    : {
        title: "Storage Transfer Report",
        transfer: "Transfer #",
        date: "Date",
        from: "From Storage",
        to: "To Storage",
        no: "#",
        sku: "SKU",
        product: "Product",
        qty: "Qty",
        notes: "Notes",
        total: "Total Qty",
        createdBy: "Created by",
        page: "Page",
      };

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* ── Header ── */}
        <View style={S.headerRow}>
          <View style={S.companyBlock}>
            <Text style={S.companyName}>{CO.nameEn}</Text>
            <Text style={S.companyNameAr}>{CO.nameAr}</Text>
          </View>
          <View style={S.metaBlock}>
            <Text style={S.metaLabel}>{labels.transfer}</Text>
            <Text style={S.metaValue}>{transfer.transfer_number}</Text>
            <Text style={S.metaDate}>
              {labels.date}: {fmtDate(transfer.created_at)}
            </Text>
          </View>
        </View>

        <View style={S.divider} />

        {/* ── Title ── */}
        <Text style={S.docTitle}>{labels.title}</Text>

        {/* ── From / To ── */}
        <View style={S.storageRow}>
          <View style={S.storageCard}>
            <Text style={S.cardLabel}>{labels.from}</Text>
            <Text style={S.cardValue}>
              {transfer.from_storage?.name_en ?? transfer.from_storage_id}
            </Text>
            {transfer.from_storage?.name_ar && (
              <Text style={S.cardValueAr}>{transfer.from_storage.name_ar}</Text>
            )}
          </View>

          <View style={S.arrowBlock}>
            <Text style={S.arrowText}>→</Text>
          </View>

          <View style={S.storageCard}>
            <Text style={S.cardLabel}>{labels.to}</Text>
            <Text style={S.cardValue}>
              {transfer.to_storage?.name_en ?? transfer.to_storage_id}
            </Text>
            {transfer.to_storage?.name_ar && (
              <Text style={S.cardValueAr}>{transfer.to_storage.name_ar}</Text>
            )}
          </View>
        </View>

        {/* ── Items Table ── */}
        <View style={S.tableHeader}>
          <Text style={[S.colIdx, S.thText]}>{labels.no}</Text>
          <Text style={[S.colSku, S.thText]}>{labels.sku}</Text>
          <Text style={[S.colName, S.thText]}>{labels.product}</Text>
          {isAr && <Text style={[S.colNameAr, S.thText]}>{labels.product}</Text>}
          <Text style={[S.colQty, S.thText]}>{labels.qty}</Text>
        </View>

        {items.map((item, idx) => (
          <View key={item.id} style={S.tableRow} wrap={false}>
            <Text style={S.colIdx}>{idx + 1}</Text>
            <Text style={S.colSku}>{item.product?.sku ?? "—"}</Text>
            <Text style={S.colName}>{item.product?.name_en ?? item.product_id}</Text>
            {isAr && (
              <Text style={S.colNameAr}>{item.product?.name_ar ?? ""}</Text>
            )}
            <Text style={S.colQty}>{item.qty}</Text>
          </View>
        ))}

        {/* ── Total ── */}
        <View style={S.totalRow}>
          <Text style={S.totalLabel}>{labels.total}:</Text>
          <Text style={S.totalValue}>{totalQty}</Text>
        </View>

        {/* ── Notes ── */}
        {transfer.notes && (
          <View style={S.notes}>
            <Text style={S.notesLabel}>{labels.notes}</Text>
            <Text style={S.notesText}>{transfer.notes}</Text>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>
            {labels.createdBy}: {transfer.creator?.full_name ?? transfer.created_by ?? "—"}
          </Text>
          <Text
            style={S.footerText}
            render={({ pageNumber, totalPages }) =>
              `${labels.page} ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
