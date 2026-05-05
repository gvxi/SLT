import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { Invoice } from "@/types";
import { TERMS_EN, TERMS_AR } from "@/lib/termsAndConditions";
import "@/components/documents/pdfFonts";

// ─── Company constants ────────────────────────────────────────────────────────
const CO = {
  nameEn: "AL-SULAIMI NATIONAL ENTERPRISES TRAD",
  nameAr: "مشـاريـع السلـيـمـي الأهـلـيـة للـتـجـارة",
  regEn: "Registration Num: 1164403",
  regAr: "رقم التسجيل: 1164403",
  instagram: "sulyme_treding",
  by: "AL Sulimi Al-ahliya Ent.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function fmtNum(n: number): string {
  return n.toFixed(3);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Pages
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

  // ── Header row: [logo] [vendor] [meta]
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18, gap: 20 },
  logoImg: { width: 140, height: 42, objectFit: "contain" },
  vendor: { flex: 1, paddingLeft: 6 },
  vendorName: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  vendorSub: { fontSize: 8.5, color: "#666666" },
  vendorReg: { fontSize: 8.5, color: "#666666", marginTop: 2 },
  metaBlock: { minWidth: 160, alignItems: "flex-end" },
  metaLabel: { fontSize: 8, color: "#777777" },
  metaValue: { fontSize: 13, fontWeight: 700 },
  metaDateLabel: { fontSize: 8, color: "#777777", marginTop: 6 },
  metaDateValue: { fontSize: 13, fontWeight: 700 },

  // ── Divider + Bilingual title
  divider: { borderBottomWidth: 1.5, borderBottomColor: "#dddddd", marginBottom: 14 },
  docTitle: { fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 16 },

  // ── Contacts (two cards)
  contactsRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  card: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#fbfbff",
    borderWidth: 1,
    borderColor: "#efeff5",
  },
  cardTitle: { fontSize: 9, fontWeight: 700, marginBottom: 7 },
  cardLine: { fontSize: 8.5, color: "#555555", marginBottom: 3 },
  cardSectionTitle: { fontSize: 9, fontWeight: 700, marginTop: 8, marginBottom: 4 },
  cardRow: { flexDirection: "row", marginBottom: 3 },
  cardLbl: { fontSize: 8.5, color: "#888888", marginRight: 4 },
  cardVal: { fontSize: 8.5, color: "#333333" },

  // ── Table
  tableWrapper: { marginBottom: 6 },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderBottomWidth: 2,
    borderBottomColor: "#eeeeee",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    borderBottomStyle: "dashed",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableLastRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  thText: { fontSize: 8.5, fontWeight: 700, color: "#333333" },
  tdText: { fontSize: 9, color: "#333333" },
  tdBold: { fontSize: 9, fontWeight: 700, color: "#333333" },
  colNum: { width: 28 },
  colDesc: { flex: 1 },
  colQty: { width: 46, textAlign: "right" },
  colUnit: { width: 88, textAlign: "right" },
  colTotal: { width: 88, textAlign: "right" },

  // ── Totals
  totalsOuter: { flexDirection: "row", justifyContent: "flex-end", marginTop: 6 },
  totalsBox: {
    width: 220,
    backgroundColor: "#fafafa",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#efeff5",
    padding: 10,
  },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  totalsLabel: { fontSize: 9.5, color: "#333333" },
  totalsValue: { fontSize: 9.5, color: "#333333" },
  totalsDividerLine: { borderBottomWidth: 1, borderBottomColor: "#dddddd", marginVertical: 5 },
  totalsFinalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalsFinalLabel: { fontSize: 11, fontWeight: 700 },
  totalsFinalValue: { fontSize: 11, fontWeight: 700 },

  // ── Signature / stamp footer
  sigSection: { flexDirection: "row", gap: 16, marginTop: 20, alignItems: "flex-start" },
  sigBox: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderStyle: "dashed",
    minHeight: 80,
    backgroundColor: "#ffffff",
  },
  sigText: { fontSize: 9, color: "#555555", marginBottom: 6 },
  sigLine: { fontSize: 9, color: "#777777", marginBottom: 10 },
  sigNote: { fontSize: 7.5, color: "#999999" },
  stampBlock: { flexDirection: "column", gap: 8, alignItems: "flex-start" },
  stampImg: { width: 130, height: 75, objectFit: "contain" },
  stampRegNum: { fontSize: 8, color: "#666666" },

  // ── Notes
  notes: { marginTop: 12, color: "#666666", fontSize: 9 },

  // ── Footer (absolute at bottom)
  footer: { position: "absolute", bottom: 20, left: 28, right: 28 },
  footerPage: { fontSize: 8, color: "#999999", textAlign: "center" },

  // ── T&C page
  tcPage: {
    fontFamily: "Cairo",
    fontSize: 8.5,
    color: "#222222",
    paddingTop: 24,
    paddingBottom: 52,
    paddingHorizontal: 28,
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },
  tcHeaderRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 6 },
  tcLogoImg: { width: 90, height: 28, objectFit: "contain" },
  tcVendor: { flex: 1 },
  tcVendorName: { fontSize: 9.5, fontWeight: 700 },
  tcVendorSub: { fontSize: 7.5, color: "#666666", marginTop: 1 },
  tcVendorReg: { fontSize: 7.5, color: "#666666", marginTop: 1 },
  tcDivider: { borderBottomWidth: 1.5, borderBottomColor: "#dddddd", marginVertical: 10 },
  tcTitle: { fontSize: 14, fontWeight: 700, textAlign: "center", marginBottom: 14 },
  tcItem: { flexDirection: "row", marginBottom: 7, gap: 6 },
  tcItemNum: { width: 20, fontSize: 8.5, fontWeight: 700 },
  tcItemContent: { flex: 1 },
  tcItemTitle: { fontSize: 8.5, fontWeight: 700, marginBottom: 2 },
  tcItemBody: { fontSize: 8, color: "#444444" },
});

// ─── Props ────────────────────────────────────────────────────────────────────
export interface InvoicePdfDocumentProps {
  invoice: Invoice;
  language: "en" | "ar";
  docType: "invoice" | "quotation";
  showRules: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function InvoicePdfDocument({ invoice, language, docType, showRules }: InvoicePdfDocumentProps) {
  const isAr = language === "ar";
  const isQuotation = docType === "quotation";

  const items = invoice.invoice_items ?? [];
  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const discount = invoice.discount ?? 0;
  const advance = invoice.upfront_payment ?? 0;
  const taxAmt = ((subtotal - discount) * (invoice.tax_pct ?? 0)) / 100;
  const total = subtotal - discount + taxAmt;

  const clientName = isAr
    ? (invoice.client?.name_ar || invoice.client?.name_en || "—")
    : (invoice.client?.name_en || invoice.client?.name_ar || "—");
  const clientPhone = invoice.client?.phone || "";
  const notes = isAr ? (invoice.notes_ar || invoice.notes_en || "") : (invoice.notes_en || invoice.notes_ar || "");
  const docNum = `#${invoice.invoice_number}`;
  const issueDate = fmtDate(invoice.issue_date);

  // Label strings
  const L = isAr ? {
    docTypeLabel: isQuotation ? "عرض أسعار" : "فاتورة",
    docTitle: isQuotation ? "عرض أسعار" : "فاتورة",
    dateLabel: "التاريخ",
    billTo: "العميل",
    customerName: "اسم العميل:",
    contact: "جهة الاتصال:",
    notesCardTitle: isQuotation ? "المهمة / ملاحظات عرض الأسعار" : "المهمة / ملاحظات الفاتورة",
    contactSection: "جهة الاتصال",
    phoneLabel: "الهاتف:",
    instagramLabel: "انستجرام:",
    byLabel: "بواسطة:",
    colNum: "رقم",
    colDesc: "الصنف / الوصف",
    colQty: "الكمية",
    colUnit: "سعر الوحدة",
    colTotal: "السعر الإجمالي",
    subtotal: "المجموع الفرعي",
    discountLabel: "تخفيض",
    advanceLabel: "دفع مقدم",
    totalFinal: isQuotation ? "النهائي:" : "الإجمالي",
    totalLine: isQuotation ? "الإجمالي:" : undefined as string | undefined,
    currency: "ر.ع.",
    goodReceived: "البضاعة مستلمة بحالة جيدة",
    signature: "التوقيع: ____________________",
    signNote: "بالتوقيع فإنك توافق على شروط الخدمة",
    thankYou: "شكراً لتعاملكم معنا",
    tcTitle: "الشروط والأحكام – خدمات التركيب",
    page: "صفحة",
    of: "من",
  } : {
    docTypeLabel: isQuotation ? "Quotation" : "Invoice",
    docTitle: isQuotation ? "Quotation" : "Invoice",
    dateLabel: "Date",
    billTo: "Bill To",
    customerName: "Customer Name:",
    contact: "Contact:",
    notesCardTitle: isQuotation ? "Task / Quotation Notes" : "Task / Invoice Notes",
    contactSection: "Contact",
    phoneLabel: "Phone:",
    instagramLabel: "Instagram:",
    byLabel: "By:",
    colNum: "#",
    colDesc: "Item / Description",
    colQty: "QTY",
    colUnit: "Price Per Piece (RO)",
    colTotal: "Total Price (RO)",
    subtotal: "Subtotal",
    discountLabel: "Discount",
    advanceLabel: "Advance Payment",
    totalFinal: isQuotation ? "Final:" : "Total (RO)",
    totalLine: isQuotation ? "Total:" : undefined as string | undefined,
    currency: "RO",
    goodReceived: "Good Received In Good Condition",
    signature: "Signature: ____________________",
    signNote: "By signing you agree to terms of service",
    thankYou: "Thank you for your business",
    tcTitle: "Terms and Conditions – Installation Services",
    page: "Page",
    of: "of",
  };

  const terms = isAr ? TERMS_AR : TERMS_EN;
  const regLabel = isAr ? CO.regAr : CO.regEn;

  // RTL page direction
  const pageDir = isAr ? ({ direction: "rtl" } as const) : {};

  return (
    <Document>
      {/* ── Page 1: Invoice / Quotation ───────────────────────────────────────── */}
      <Page size="A4" style={[S.page, pageDir]}>

        {/* Header: [Logo] [Company name] [Doc meta] */}
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
            <Text style={S.metaLabel}>{L.docTypeLabel}</Text>
            <Text style={S.metaValue}>{docNum}</Text>
            <Text style={S.metaDateLabel}>{L.dateLabel}</Text>
            <Text style={S.metaDateValue}>{issueDate}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={S.divider} />

        {/* Document title (centered, bilingual) */}
        <Text style={S.docTitle}>{L.docTitle}</Text>

        {/* Contacts row: [Bill To card] [Notes + Contact card] */}
        <View style={S.contactsRow}>
          {/* Left card: Bill To */}
          <View style={S.card}>
            <Text style={S.cardTitle}>{L.billTo}</Text>
            {clientName !== "—" && (
              <View style={S.cardRow}>
                <Text style={S.cardLbl}>{L.customerName}</Text>
                <Text style={S.cardVal}>{clientName}</Text>
              </View>
            )}
            {clientPhone ? (
              <View style={S.cardRow}>
                <Text style={S.cardLbl}>{L.contact}</Text>
                <Text style={S.cardVal}>{clientPhone}</Text>
              </View>
            ) : null}
            {invoice.location ? (
              <Text style={S.cardLine}>{invoice.location}</Text>
            ) : null}
          </View>

          {/* Right card: Notes + Contact */}
          <View style={S.card}>
            <Text style={S.cardTitle}>{L.notesCardTitle}</Text>
            {notes ? <Text style={S.cardLine}>{notes}</Text> : null}

            <Text style={S.cardSectionTitle}>{L.contactSection}</Text>
            {invoice.phone_number ? (
              <View style={S.cardRow}>
                <Text style={S.cardLbl}>{L.phoneLabel}</Text>
                <Text style={S.cardVal}>{invoice.phone_number}</Text>
              </View>
            ) : null}
            <View style={S.cardRow}>
              <Text style={S.cardLbl}>{L.instagramLabel}</Text>
              <Text style={S.cardVal}>{CO.instagram}</Text>
            </View>
            {isQuotation && (
              <View style={S.cardRow}>
                <Text style={S.cardLbl}>{L.byLabel}</Text>
                <Text style={S.cardVal}>{CO.by}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Line items table */}
        <View style={S.tableWrapper}>
          {/* Header row */}
          <View style={S.tableHeaderRow}>
            <Text style={[S.thText, S.colNum]}>{L.colNum}</Text>
            <Text style={[S.thText, S.colDesc]}>{L.colDesc}</Text>
            <Text style={[S.thText, S.colQty]}>{L.colQty}</Text>
            <Text style={[S.thText, S.colUnit]}>{L.colUnit}</Text>
            <Text style={[S.thText, S.colTotal]}>{L.colTotal}</Text>
          </View>

          {/* Data rows */}
          {items.filter(Boolean).map((item, idx) => {
            const desc = item.product
              ? (isAr ? (item.product.name_ar || item.product.name_en) : item.product.name_en) || item.description
              : item.description;
            const isLast = idx === items.length - 1;
            return (
              <View key={item.id} style={isLast ? S.tableLastRow : S.tableRow}>
                <Text style={[S.tdText, S.colNum]}>{idx + 1}</Text>
                <Text style={[S.tdBold, S.colDesc]}>{desc}</Text>
                <Text style={[S.tdText, S.colQty]}>{item.qty}</Text>
                <Text style={[S.tdText, S.colUnit]}>{fmtNum(item.unit_price)}</Text>
                <Text style={[S.tdText, S.colTotal]}>{fmtNum(item.qty * item.unit_price)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={S.totalsOuter}>
          <View style={S.totalsBox}>
            {isQuotation ? (
              <>
                {L.totalLine && (
                  <View style={S.totalsRow}>
                    <Text style={S.totalsLabel}>{L.totalLine}</Text>
                    <Text style={S.totalsValue}>{fmtNum(total)}</Text>
                  </View>
                )}
                <View style={S.totalsDividerLine} />
                <View style={S.totalsFinalRow}>
                  <Text style={S.totalsFinalLabel}>{L.totalFinal}</Text>
                  <Text style={S.totalsFinalValue}>{fmtNum(total)}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={S.totalsRow}>
                  <Text style={S.totalsLabel}>{L.subtotal}</Text>
                  <Text style={S.totalsValue}>{fmtNum(subtotal)}</Text>
                </View>
                <View style={S.totalsRow}>
                  <Text style={S.totalsLabel}>{L.discountLabel}</Text>
                  <Text style={S.totalsValue}>{fmtNum(discount)}</Text>
                </View>
                <View style={S.totalsRow}>
                  <Text style={S.totalsLabel}>{L.advanceLabel}</Text>
                  <Text style={S.totalsValue}>{fmtNum(advance)}</Text>
                </View>
                <View style={S.totalsDividerLine} />
                <View style={S.totalsFinalRow}>
                  <Text style={S.totalsFinalLabel}>{L.totalFinal}</Text>
                  <Text style={S.totalsFinalValue}>{fmtNum(total)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Signature + stamp */}
        <View style={S.sigSection}>
          {/* Signature box */}
          <View style={S.sigBox}>
            <Text style={S.sigText}>{L.goodReceived}</Text>
            <View style={{ height: 14 }} />
            <Text style={S.sigLine}>{L.signature}</Text>
            <Text style={S.sigNote}>{L.signNote}</Text>
          </View>

          {/* Stamp + reg num */}
          <View style={S.stampBlock}>
            <Image style={S.stampImg} src="/images/stamp.png" />
            <Text style={S.stampRegNum}>{regLabel}</Text>
          </View>
        </View>

        {/* Thank you note */}
        <Text style={S.notes}>{L.thankYou}</Text>

        {/* Page number footer */}
        <View style={S.footer}>
          <Text
            style={S.footerPage}
            render={({ pageNumber, totalPages }) =>
              `${L.page} ${pageNumber} ${L.of} ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ── Page 2: Terms & Conditions (optional) ────────────────────────────── */}
      {showRules && (
        <Page size="A4" style={[S.tcPage, pageDir]}>
          {/* Mini header */}
          <View style={S.tcHeaderRow}>
            <Image style={S.tcLogoImg} src="/images/logo.png" />
            <View style={S.tcVendor}>
              {isAr ? (
                <>
                  <Text style={S.tcVendorName}>{CO.nameAr}</Text>
                  <Text style={S.tcVendorSub}>{CO.nameEn}</Text>
                  <Text style={S.tcVendorReg}>{CO.regAr}</Text>
                </>
              ) : (
                <>
                  <Text style={S.tcVendorName}>{CO.nameEn}</Text>
                  <Text style={S.tcVendorSub}>{CO.nameAr}</Text>
                  <Text style={S.tcVendorReg}>{CO.regEn}</Text>
                </>
              )}
            </View>
          </View>

          <View style={S.tcDivider} />
          <Text style={S.tcTitle}>{L.tcTitle}</Text>

          {terms.map((term, i) => (
            <View key={i} style={S.tcItem}>
              <Text style={S.tcItemNum}>{i + 1}.</Text>
              <View style={S.tcItemContent}>
                <Text style={S.tcItemTitle}>{term.title}</Text>
                <Text style={S.tcItemBody}>{term.body}</Text>
              </View>
            </View>
          ))}

          <View style={S.footer}>
            <Text
              style={S.footerPage}
              render={({ pageNumber, totalPages }) =>
                `${L.page} ${pageNumber} ${L.of} ${totalPages}`
              }
            />
          </View>
        </Page>
      )}
    </Document>
  );
}
