import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { RestockReport } from "@/types";
import "@/components/documents/pdfFonts";

const CO = {
  nameEn: "AL-SULAIMI NATIONAL ENTERPRISES TRAD",
  nameAr: "مشـاريـع السلـيـمـي الأهـلـيـة للـتـجـارة",
  regEn: "Registration Num: 1164403",
  regAr: "رقم التسجيل: 1164403",
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
  metaBlock: { minWidth: 160, alignItems: "flex-end" },
  metaLabel: { fontSize: 8, color: "#777777" },
  metaValue: { fontSize: 13, fontWeight: 700 },
  metaDateLabel: { fontSize: 8, color: "#777777", marginTop: 6 },
  metaDateValue: { fontSize: 10, fontWeight: 700 },
  divider: { borderBottomWidth: 1.5, borderBottomColor: "#dddddd", marginBottom: 14 },
  docTitle: { fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 16 },
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
  colQty:    { width: 46, fontSize: 8, textAlign: "right" },
  colDelta:  { width: 52, fontSize: 8, textAlign: "right" },
  thText:    { fontSize: 8, fontWeight: 700, color: "#555555" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 8,
    paddingHorizontal: 6,
    gap: 12,
  },
  totalLabel: { fontSize: 9, fontWeight: 700, color: "#555555" },
  totalValue: { fontSize: 9, fontWeight: 700 },
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
});

interface Props {
  report: RestockReport;
  language: "en" | "ar";
}

export function RestockPdfDocument({ report, language }: Props) {
  const isAr = language === "ar";
  const items = (report.restock_report_items ?? []).filter(Boolean);
  const totalAdded = items.reduce((s, i) => s + (i.qty_after - i.qty_before), 0);

  const labels = isAr
    ? {
        title: "تقرير إعادة التخزين",
        reportNum: "رقم التقرير",
        date: "التاريخ",
        no: "#",
        sku: "الرمز",
        product: "المنتج",
        before: "قبل",
        after: "بعد",
        delta: "الفرق",
        notes: "ملاحظات",
        totalAdded: "إجمالي الإضافة",
        createdBy: "بواسطة",
        page: "صفحة",
        of: "من",
      }
    : {
        title: "Restock Report",
        reportNum: "Report #",
        date: "Date",
        no: "#",
        sku: "SKU",
        product: "Product",
        before: "Before",
        after: "After",
        delta: "Delta",
        notes: "Notes",
        totalAdded: "Total Added",
        createdBy: "Created by",
        page: "Page",
        of: "of",
      };

  const pageDir = isAr ? ({ direction: "rtl" } as const) : {};

  return (
    <Document>
      <Page size="A4" style={[S.page, pageDir]}>
        {/* ── Header ── */}
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
            <Text style={S.metaLabel}>{labels.reportNum}</Text>
            <Text style={S.metaValue}>{report.report_number}</Text>
            <Text style={S.metaDateLabel}>{labels.date}</Text>
            <Text style={S.metaDateValue}>{fmtDate(report.created_at)}</Text>
          </View>
        </View>

        <View style={S.divider} />

        {/* ── Title ── */}
        <Text style={S.docTitle}>{labels.title}</Text>

        {/* ── Items Table ── */}
        <View style={S.tableHeader}>
          <Text style={[S.colIdx, S.thText]}>{labels.no}</Text>
          <Text style={[S.colSku, S.thText]}>{labels.sku}</Text>
          <Text style={[S.colName, S.thText]}>{labels.product}</Text>
          {isAr ? <Text style={[S.colNameAr, S.thText]}>{labels.product}</Text> : null}
          <Text style={[S.colQty, S.thText]}>{labels.before}</Text>
          <Text style={[S.colQty, S.thText]}>{labels.after}</Text>
          <Text style={[S.colDelta, S.thText]}>{labels.delta}</Text>
        </View>

        {items.map((item, idx) => {
          const delta = item.qty_after - item.qty_before;
          return (
            <View key={item.id} style={S.tableRow} wrap={false}>
              <Text style={S.colIdx}>{String(idx + 1)}</Text>
              <Text style={S.colSku}>{item.product?.sku ?? "—"}</Text>
              <Text style={S.colName}>{item.product?.name_en ?? item.product_id}</Text>
              {isAr ? <Text style={S.colNameAr}>{item.product?.name_ar ?? ""}</Text> : null}
              <Text style={S.colQty}>{String(item.qty_before)}</Text>
              <Text style={S.colQty}>{String(item.qty_after)}</Text>
              <Text style={S.colDelta}>{delta >= 0 ? `+${delta}` : String(delta)}</Text>
            </View>
          );
        })}

        {/* ── Total ── */}
        <View style={S.totalRow}>
          <Text style={S.totalLabel}>{labels.totalAdded}:</Text>
          <Text style={S.totalValue}>{`+${totalAdded}`}</Text>
        </View>

        {/* ── Notes ── */}
        {report.notes ? (
          <View style={S.notes}>
            <Text style={S.notesLabel}>{labels.notes}</Text>
            <Text style={S.notesText}>{report.notes}</Text>
          </View>
        ) : null}

        {/* ── Footer ── */}
        <View style={S.footer}>
          <Text style={S.footerText}>
            {labels.createdBy}: {report.creator?.full_name ?? ""}
          </Text>
          <Text
            style={S.footerText}
            render={({ pageNumber, totalPages }) =>
              `${labels.page} ${pageNumber} ${labels.of} ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
