import React from "react";
import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";
import type { Invoice } from "@/types";

// Fonts served from public/fonts — loaded client-side via dynamic import
Font.register({
  family: "Cairo",
  fonts: [
    { src: "/fonts/Cairo-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Cairo-Bold.ttf", fontWeight: 700 },
  ],
});

const INDIGO = "#3F51B5";
const GRAY = "#666666";
const DARK = "#1a1a1a";
const LIGHT_BG = "#F5F6FF";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Cairo",
    fontSize: 10,
    color: DARK,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 700,
    color: INDIGO,
  },
  invoiceLabel: {
    fontSize: 22,
    fontWeight: 700,
    color: INDIGO,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  statusText: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  accentLine: {
    height: 3,
    backgroundColor: INDIGO,
    borderRadius: 2,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  infoBlock: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  infoName: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 9,
    color: GRAY,
    marginBottom: 1,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 9,
    color: GRAY,
    marginRight: 8,
  },
  metaValue: {
    fontSize: 9,
    fontWeight: 700,
  },
  // Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: INDIGO,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowShaded: {
    backgroundColor: LIGHT_BG,
  },
  thText: {
    fontSize: 8,
    fontWeight: 700,
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tdText: {
    fontSize: 9,
    color: DARK,
  },
  tdSub: {
    fontSize: 8,
    color: GRAY,
  },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  // Totals
  totalsWrapper: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalsBox: { width: 230 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: { fontSize: 9, color: GRAY },
  totalsValue: { fontSize: 9 },
  totalsDivider: {
    borderTopWidth: 1,
    borderTopColor: "#DDDDDD",
    marginVertical: 5,
  },
  grandLabel: { fontSize: 11, fontWeight: 700, color: INDIGO },
  grandValue: { fontSize: 11, fontWeight: 700, color: INDIGO },
  // Notes
  notesSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 10,
  },
  notesText: {
    fontSize: 9,
    color: GRAY,
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: GRAY },
});

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:     { bg: "#F5F5F5", color: "#757575" },
  sent:      { bg: "#E3F2FD", color: "#1565C0" },
  paid:      { bg: "#E8F5E9", color: "#2E7D32" },
  overdue:   { bg: "#FFF3E0", color: "#E65100" },
  cancelled: { bg: "#FFEBEE", color: "#C62828" },
};

const LABELS = {
  en: {
    invoice: "INVOICE", billTo: "Bill To", invoiceNo: "Invoice No.",
    issueDate: "Issue Date", dueDate: "Due Date",
    description: "Description", qty: "Qty", unitPrice: "Unit Price", total: "Total",
    subtotal: "Subtotal", discount: "Discount", tax: "Tax",
    upfront: "Upfront Payment", grandTotal: "Grand Total", balance: "Balance Due",
    notes: "Notes", page: "Page",
    status: { draft: "Draft", sent: "Sent", paid: "Paid", overdue: "Overdue", cancelled: "Cancelled" },
  },
  ar: {
    invoice: "فاتورة", billTo: "تقديم إلى", invoiceNo: "رقم الفاتورة",
    issueDate: "تاريخ الإصدار", dueDate: "تاريخ الاستحقاق",
    description: "الوصف", qty: "الكمية", unitPrice: "سعر الوحدة", total: "الإجمالي",
    subtotal: "المجموع الفرعي", discount: "الخصم", tax: "الضريبة",
    upfront: "الدفعة الأولى", grandTotal: "الإجمالي الكلي", balance: "المبلغ المتبقي",
    notes: "ملاحظات", page: "صفحة",
    status: { draft: "مسودة", sent: "مرسلة", paid: "مدفوعة", overdue: "متأخرة", cancelled: "ملغاة" },
  },
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface InvoicePdfProps {
  invoice: Invoice;
  language: "en" | "ar";
}

export function InvoicePdfDocument({ invoice, language }: InvoicePdfProps) {
  const isRtl = language === "ar";
  const t = LABELS[language];
  const sc = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.draft;

  const items = invoice.invoice_items ?? [];
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const discAmt = invoice.discount ?? 0;
  const taxAmt = ((subtotal - discAmt) * (invoice.tax_pct ?? 0)) / 100;
  const grand = subtotal - discAmt + taxAmt;
  const balance = grand - (invoice.upfront_payment ?? 0);

  const clientName = isRtl
    ? (invoice.client?.name_ar || invoice.client?.name_en || "—")
    : (invoice.client?.name_en || invoice.client?.name_ar || "—");
  const notes = isRtl ? invoice.notes_ar : invoice.notes_en;

  // RTL flips row direction
  const rowDir = isRtl ? "row-reverse" : "row";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={[styles.header, { flexDirection: rowDir }]}>
          <Text style={styles.companyName}>SLT</Text>
          <View style={{ alignItems: isRtl ? "flex-start" : "flex-end" }}>
            <Text style={styles.invoiceLabel}>{t.invoice}</Text>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              <Text style={[styles.statusText, { color: sc.color }]}>
                {t.status[invoice.status]}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.accentLine} />

        {/* Info row */}
        <View style={[styles.infoRow, { flexDirection: rowDir }]}>
          <View style={styles.infoBlock}>
            <Text style={styles.sectionLabel}>{t.billTo}</Text>
            <Text style={styles.infoName}>{clientName}</Text>
            {invoice.client?.email ? <Text style={styles.infoText}>{invoice.client.email}</Text> : null}
            {invoice.client?.phone ? <Text style={styles.infoText}>{invoice.client.phone}</Text> : null}
            {invoice.phone_number && !invoice.client?.phone
              ? <Text style={styles.infoText}>{invoice.phone_number}</Text>
              : null}
            {invoice.location ? <Text style={styles.infoText}>{invoice.location}</Text> : null}
          </View>

          <View style={[styles.infoBlock, { alignItems: isRtl ? "flex-start" : "flex-end" }]}>
            <View style={[styles.metaRow, { flexDirection: rowDir }]}>
              <Text style={styles.metaLabel}>{t.invoiceNo}</Text>
              <Text style={styles.metaValue}>{invoice.invoice_number}</Text>
            </View>
            <View style={[styles.metaRow, { flexDirection: rowDir }]}>
              <Text style={styles.metaLabel}>{t.issueDate}</Text>
              <Text style={styles.metaValue}>{invoice.issue_date}</Text>
            </View>
            <View style={[styles.metaRow, { flexDirection: rowDir }]}>
              <Text style={styles.metaLabel}>{t.dueDate}</Text>
              <Text style={styles.metaValue}>{invoice.due_date}</Text>
            </View>
          </View>
        </View>

        {/* Table header */}
        <View style={[styles.tableHeader, { flexDirection: rowDir }]}>
          <Text style={[styles.thText, styles.colDesc, isRtl ? { textAlign: "right" } : {}]}>{t.description}</Text>
          <Text style={[styles.thText, styles.colQty]}>{t.qty}</Text>
          <Text style={[styles.thText, styles.colPrice, isRtl ? { textAlign: "left" } : {}]}>{t.unitPrice}</Text>
          <Text style={[styles.thText, styles.colTotal, isRtl ? { textAlign: "left" } : {}]}>{t.total}</Text>
        </View>

        {/* Table rows */}
        {items.map((item, idx) => {
          const pName = isRtl
            ? (item.product?.name_ar || item.product?.name_en || "")
            : (item.product?.name_en || item.product?.name_ar || "");
          const desc = item.description || pName || "—";
          return (
            <View key={item.id} style={[styles.tableRow, idx % 2 !== 0 ? styles.tableRowShaded : {}, { flexDirection: rowDir }]}>
              <View style={styles.colDesc}>
                <Text style={[styles.tdText, isRtl ? { textAlign: "right" } : {}]}>{desc}</Text>
                {item.product?.sku ? <Text style={styles.tdSub}>{item.product.sku}</Text> : null}
              </View>
              <Text style={[styles.tdText, styles.colQty]}>{item.qty}</Text>
              <Text style={[styles.tdText, styles.colPrice, isRtl ? { textAlign: "left" } : {}]}>{fmt(item.unit_price)}</Text>
              <Text style={[styles.tdText, styles.colTotal, isRtl ? { textAlign: "left" } : {}]}>{fmt(item.qty * item.unit_price)}</Text>
            </View>
          );
        })}

        {/* Totals */}
        <View style={[styles.totalsWrapper, isRtl ? { alignItems: "flex-start" } : {}]}>
          <View style={styles.totalsBox}>
            <View style={[styles.totalsRow, { flexDirection: rowDir }]}>
              <Text style={styles.totalsLabel}>{t.subtotal}</Text>
              <Text style={styles.totalsValue}>{fmt(subtotal)}</Text>
            </View>
            {discAmt > 0 && (
              <View style={[styles.totalsRow, { flexDirection: rowDir }]}>
                <Text style={styles.totalsLabel}>{t.discount}</Text>
                <Text style={styles.totalsValue}>- {fmt(discAmt)}</Text>
              </View>
            )}
            {taxAmt > 0 && (
              <View style={[styles.totalsRow, { flexDirection: rowDir }]}>
                <Text style={styles.totalsLabel}>{t.tax} ({invoice.tax_pct}%)</Text>
                <Text style={styles.totalsValue}>{fmt(taxAmt)}</Text>
              </View>
            )}
            <View style={styles.totalsDivider} />
            <View style={[styles.totalsRow, { flexDirection: rowDir }]}>
              <Text style={styles.grandLabel}>{t.grandTotal}</Text>
              <Text style={styles.grandValue}>{fmt(grand)}</Text>
            </View>
            {(invoice.upfront_payment ?? 0) > 0 && (
              <>
                <View style={[styles.totalsRow, { flexDirection: rowDir }]}>
                  <Text style={styles.totalsLabel}>{t.upfront}</Text>
                  <Text style={styles.totalsValue}>- {fmt(invoice.upfront_payment!)}</Text>
                </View>
                <View style={styles.totalsDivider} />
                <View style={[styles.totalsRow, { flexDirection: rowDir }]}>
                  <Text style={styles.grandLabel}>{t.balance}</Text>
                  <Text style={styles.grandValue}>{fmt(balance)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Notes */}
        {notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>{t.notes}</Text>
            <Text style={[styles.notesText, isRtl ? { textAlign: "right" } : {}]}>{notes}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={[styles.footer, { flexDirection: rowDir }]} fixed>
          <Text style={styles.footerText}>{invoice.invoice_number}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${t.page} ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
