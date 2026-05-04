import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Product } from "@/types";

interface Props {
  products: Product[];
  language: "en" | "ar";
}

const S = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    color: "#111827",
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#6B7280",
  },
  table: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderStyle: "solid",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderBottomStyle: "solid",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  headRow: {
    backgroundColor: "#F3F4F6",
  },
  cell: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    borderRightStyle: "solid",
    justifyContent: "center",
  },
  sku: { width: "14%" },
  name: { width: "28%" },
  category: { width: "18%" },
  price: { width: "14%" },
  stock: { width: "12%" },
  status: { width: "14%", borderRightWidth: 0 },
  headText: {
    fontSize: 9,
    fontWeight: 700,
  },
  bodyText: {
    fontSize: 9,
  },
});

function labels(language: "en" | "ar") {
  if (language === "ar") {
    return {
      title: "قائمة المنتجات",
      generatedAt: "تاريخ الإنشاء",
      sku: "SKU",
      name: "الاسم",
      category: "الفئة",
      price: "السعر",
      stock: "المخزون",
      status: "الحالة",
      active: "نشط",
      inactive: "غير نشط",
    };
  }

  return {
    title: "Products List",
    generatedAt: "Generated At",
    sku: "SKU",
    name: "Name",
    category: "Category",
    price: "Price",
    stock: "Stock",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
  };
}

export function ProductListPdfDocument({ products, language }: Props) {
  const L = labels(language);

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.header}>
          <Text style={S.title}>{L.title}</Text>
          <Text style={S.meta}>{L.generatedAt}: {new Date().toLocaleString()}</Text>
        </View>

        <View style={S.table}>
          <View style={[S.row, S.headRow]}>
            <View style={[S.cell, S.sku]}><Text style={S.headText}>{L.sku}</Text></View>
            <View style={[S.cell, S.name]}><Text style={S.headText}>{L.name}</Text></View>
            <View style={[S.cell, S.category]}><Text style={S.headText}>{L.category}</Text></View>
            <View style={[S.cell, S.price]}><Text style={S.headText}>{L.price}</Text></View>
            <View style={[S.cell, S.stock]}><Text style={S.headText}>{L.stock}</Text></View>
            <View style={[S.cell, S.status]}><Text style={S.headText}>{L.status}</Text></View>
          </View>

          {products.map((p, index) => (
            <View
              key={p.id}
              style={index === products.length - 1 ? [S.row, S.lastRow] : S.row}
            >
              <View style={[S.cell, S.sku]}><Text style={S.bodyText}>{p.sku}</Text></View>
              <View style={[S.cell, S.name]}>
                <Text style={S.bodyText}>{language === "ar" && p.name_ar ? p.name_ar : p.name_en}</Text>
              </View>
              <View style={[S.cell, S.category]}><Text style={S.bodyText}>{p.category || "-"}</Text></View>
              <View style={[S.cell, S.price]}><Text style={S.bodyText}>{p.unit_price.toFixed(2)}</Text></View>
              <View style={[S.cell, S.stock]}><Text style={S.bodyText}>{String(p.stock_qty)}</Text></View>
              <View style={[S.cell, S.status]}>
                <Text style={S.bodyText}>{p.status === "active" ? L.active : L.inactive}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
