import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Product, Category, Tag } from "../types";
import { formatIDR, formatDateTime } from "./formatters";

export function exportToPDF(products: Product[], categories: Category[]): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const catMap = new Map<string, string>();
  categories.forEach((c) => catMap.set(c.id, c.name));

  const totalBudget = products.reduce((sum, p) => sum + (p.price || 0), 0);

  // Ultra-minimalist Header (Monochrome: Black and Gray)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27); // Zinc 900
  doc.text("DREBOXS — DAFTAR BARANG IMPIAN", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122); // Zinc 500
  doc.text(
    `Waktu Cetak: ${formatDateTime(Date.now())} | Total Item: ${products.length} | Total Nilai: ${formatIDR(totalBudget)}`,
    14,
    25,
  );

  // Thin line divider
  doc.setDrawColor(228, 228, 231); // Zinc 200
  doc.setLineWidth(0.3);
  doc.line(14, 28, 196, 28);

  const tableRows = products.map((item, index) => [
    (index + 1).toString(),
    item.name,
    item.categoryId ? catMap.get(item.categoryId) || "Lainnya" : "Umum",
    formatIDR(item.price),
    item.priority.toUpperCase(),
    item.status === "dream"
      ? "Impian"
      : item.status === "planned"
        ? "Direncanakan"
        : item.status === "purchased"
          ? "Tercapai"
          : "Arsip",
    item.targetMonth || "-",
  ]);

  autoTable(doc, {
    startY: 32,
    head: [
      [
        "No",
        "Nama Produk Impian",
        "Kategori",
        "Estimasi Harga",
        "Prioritas",
        "Status",
        "Target",
      ],
    ],
    body: tableRows,
    theme: "plain",
    headStyles: {
      fillColor: [244, 244, 245], // Zinc 100
      textColor: [24, 24, 27],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [39, 39, 42],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 60 },
      2: { cellWidth: 32 },
      3: { cellWidth: 35, font: "courier" }, // JetBrains/Courier mono for price
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 22, halign: "center" },
      6: { cellWidth: 18, halign: "center" },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page number
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170);
      doc.text(
        `DreBoXs Personal Vault — Halaman ${data.pageNumber}`,
        14,
        doc.internal.pageSize.height - 10,
      );
    },
  });

  const filename = `DreBoXs_Dokumen_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export function generatePDFBlob(
  products: Product[],
  categories: Category[],
): { blob: Blob; filename: string } {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const catMap = new Map<string, string>();
  categories.forEach((c) => catMap.set(c.id, c.name));

  const totalBudget = products.reduce((sum, p) => sum + (p.price || 0), 0);

  // Ultra-minimalist Header (Monochrome)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27);
  doc.text("DREBOXS — DAFTAR BARANG IMPIAN", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(113, 113, 122);
  doc.text(
    `Waktu Cetak: ${formatDateTime(Date.now())} | Total Item: ${products.length} | Total Nilai: ${formatIDR(totalBudget)}`,
    14,
    25,
  );

  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.3);
  doc.line(14, 28, 196, 28);

  const tableRows = products.map((item, index) => [
    (index + 1).toString(),
    item.name,
    item.categoryId ? catMap.get(item.categoryId) || "Lainnya" : "Umum",
    formatIDR(item.price),
    item.priority.toUpperCase(),
    item.status === "dream"
      ? "Impian"
      : item.status === "planned"
        ? "Direncanakan"
        : item.status === "purchased"
          ? "Tercapai"
          : "Arsip",
    item.targetMonth || "-",
  ]);

  autoTable(doc, {
    startY: 32,
    head: [
      [
        "No",
        "Nama Produk Impian",
        "Kategori",
        "Estimasi Harga",
        "Prioritas",
        "Status",
        "Target",
      ],
    ],
    body: tableRows,
    theme: "plain",
    headStyles: {
      fillColor: [244, 244, 245],
      textColor: [24, 24, 27],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [39, 39, 42],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 60 },
      2: { cellWidth: 32 },
      3: { cellWidth: 35, font: "courier" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 22, halign: "center" },
      6: { cellWidth: 18, halign: "center" },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170);
      doc.text(
        `DreBoXs Cloud Backup — Halaman ${data.pageNumber}`,
        14,
        doc.internal.pageSize.height - 10,
      );
    },
  });

  const filename = `DreBoXs_Dokumen_${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output("blob");
  return { blob, filename };
}

export function exportToExcel(
  products: Product[],
  categories: Category[],
  tags: Tag[],
): void {
  const catMap = new Map<string, string>();
  categories.forEach((c) => catMap.set(c.id, c.name));

  const totalBudget = products.reduce((acc, p) => acc + p.price, 0);

  // 1. Data Sheet: Products
  const productRows = products.map((p, idx) => ({
    No: idx + 1,
    "Nama Barang": p.name,
    "Estimasi Harga (IDR)": p.price,
    Kategori: p.categoryId ? catMap.get(p.categoryId) || "" : "",
    Tags: p.tags.join(", "),
    Prioritas: p.priority,
    Status: p.status,
    "Target Bulan": p.targetMonth || "-",
    Favorit: p.isFavorite ? "Ya" : "Tidak",
    "Tautan Produk": p.links.join(" ; "),
    Deskripsi: p.description,
    "Tanggal Input": formatDateTime(p.createdAt),
  }));

  const wb = XLSX.utils.book_new();
  const wsProducts = XLSX.utils.json_to_sheet(productRows);
  XLSX.utils.book_append_sheet(wb, wsProducts, "Barang Impian");

  // 2. Data Sheet: Categories
  const categoryRows = categories.map((c) => {
    const itemsInCat = products.filter((p) => p.categoryId === c.id);
    const catTotal = itemsInCat.reduce((acc, cur) => acc + cur.price, 0);
    return {
      "Nama Kategori": c.name,
      Keterangan: c.description || "-",
      "Jumlah Barang": itemsInCat.length,
      "Total Nilai (IDR)": catTotal,
    };
  });
  const wsCategories = XLSX.utils.json_to_sheet(categoryRows);
  XLSX.utils.book_append_sheet(wb, wsCategories, "Kategori");

  // 3. Summary Sheet
  const summaryData = [
    { Metrik: "Nama Vault", Nilai: "DreBoXs (Dream Boxs)" },
    { Metrik: "Tanggal Ekspor", Nilai: new Date().toISOString() },
    { Metrik: "Total Barang Impian", Nilai: products.length },
    { Metrik: "Total Estimasi Anggaran (IDR)", Nilai: totalBudget },
    {
      Metrik: "Barang Prioritas Tinggi",
      Nilai: products.filter((p) => p.priority === "high").length,
    },
    {
      Metrik: "Barang Favorit",
      Nilai: products.filter((p) => p.isFavorite).length,
    },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  const filename = `DreBoXs_Data_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function generateExcelBlob(
  products: Product[],
  categories: Category[],
  tags: Tag[],
): { blob: Blob; filename: string } {
  const catMap = new Map<string, string>();
  categories.forEach((c) => catMap.set(c.id, c.name));

  const totalBudget = products.reduce((acc, p) => acc + p.price, 0);

  // 1. Data Sheet: Products
  const productRows = products.map((p, idx) => ({
    No: idx + 1,
    "Nama Barang": p.name,
    "Estimasi Harga (IDR)": p.price,
    Kategori: p.categoryId ? catMap.get(p.categoryId) || "" : "",
    Tags: p.tags.join(", "),
    Prioritas: p.priority,
    Status: p.status,
    "Target Bulan": p.targetMonth || "-",
    Favorit: p.isFavorite ? "Ya" : "Tidak",
    "Tautan Produk": p.links.join(" ; "),
    Deskripsi: p.description,
    "Tanggal Input": formatDateTime(p.createdAt),
  }));

  const wb = XLSX.utils.book_new();
  const wsProducts = XLSX.utils.json_to_sheet(productRows);
  XLSX.utils.book_append_sheet(wb, wsProducts, "Barang Impian");

  // 2. Data Sheet: Categories
  const categoryRows = categories.map((c) => {
    const itemsInCat = products.filter((p) => p.categoryId === c.id);
    const catTotal = itemsInCat.reduce((acc, cur) => acc + cur.price, 0);
    return {
      "Nama Kategori": c.name,
      Keterangan: c.description || "-",
      "Jumlah Barang": itemsInCat.length,
      "Total Nilai (IDR)": catTotal,
    };
  });
  const wsCategories = XLSX.utils.json_to_sheet(categoryRows);
  XLSX.utils.book_append_sheet(wb, wsCategories, "Kategori");

  // 3. Summary Sheet
  const summaryData = [
    { Metrik: "Nama Vault", Nilai: "DreBoXs (Dream Boxs)" },
    { Metrik: "Tanggal Ekspor", Nilai: new Date().toISOString() },
    { Metrik: "Total Barang Impian", Nilai: products.length },
    { Metrik: "Total Estimasi Anggaran (IDR)", Nilai: totalBudget },
    {
      Metrik: "Barang Prioritas Tinggi",
      Nilai: products.filter((p) => p.priority === "high").length,
    },
    {
      Metrik: "Barang Favorit",
      Nilai: products.filter((p) => p.isFavorite).length,
    },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  const filename = `DreBoXs_Data_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  return { blob, filename };
}

export function exportToJSON(
  products: Product[],
  categories: Category[],
  tags: Tag[],
): void {
  const exportPayload = {
    app: "DreBoXs",
    version: "1.0.0",
    exportDate: new Date().toISOString(),
    timestamp: Date.now(),
    data: {
      products,
      categories,
      tags,
    },
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `DreBoXs_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportValidationResult {
  valid: boolean;
  message: string;
  data?: {
    products: Product[];
    categories: Category[];
    tags: Tag[];
  };
}

export function parseAndValidateImportJSON(
  jsonText: string,
): ImportValidationResult {
  try {
    const parsed = JSON.parse(jsonText);
    const data = parsed.data || parsed;

    if (!Array.isArray(data.products)) {
      return {
        valid: false,
        message: "Format file tidak valid: array produk tidak ditemukan.",
      };
    }

    return {
      valid: true,
      message: `File valid: ${data.products.length} produk siap diimpor.`,
      data: {
        products: data.products,
        categories: Array.isArray(data.categories) ? data.categories : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error parsing";
    return { valid: false, message: `Gagal membaca JSON: ${errorMsg}` };
  }
}
