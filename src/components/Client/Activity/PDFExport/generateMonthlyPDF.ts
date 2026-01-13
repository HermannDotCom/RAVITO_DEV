/**
 * PDF Generator for Monthly Activity Closure
 * Generates a professional PDF summary of the month's activity
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthlyData, DailySheet, EXPENSE_CATEGORIES } from '../../../../types/activity';
import { COLORS, FONTS, PAGE, SPACING } from './pdfStyles';

// Extend jsPDF type to include autoTable properties
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export interface MonthlyPDFData {
  establishment: {
    name: string;
    address?: string;
  };
  month: number;
  year: number;
  monthlyData: MonthlyData;
}

/**
 * Format currency in FCFA
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' F';
};

/**
 * Format date in French format
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Get month name in French
 */
const getMonthName = (month: number): string => {
  const date = new Date(2000, month - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long' });
};

/**
 * Generate the PDF header
 */
const addHeader = (doc: jsPDF, data: MonthlyPDFData, yPos: number): number => {
  // Logo/Title
  doc.setFontSize(FONTS.title);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('🍹 RAVITO - Clôture Mensuelle', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Divider line
  doc.setDrawColor(COLORS.gray);
  doc.setLineWidth(0.5);
  doc.line(PAGE.margin, yPos, PAGE.width - PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Establishment info
  doc.setFontSize(FONTS.subtitle);
  doc.setTextColor(COLORS.darkGray);
  doc.setFont('helvetica', 'normal');
  doc.text(`Établissement : ${data.establishment.name}`, PAGE.margin, yPos);
  
  yPos += SPACING.small + 2;
  
  // Period
  const monthName = getMonthName(data.month);
  doc.text(`Période : ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${data.year}`, PAGE.margin, yPos);
  
  yPos += SPACING.small + 2;
  
  // Generation date
  doc.setFontSize(FONTS.small);
  doc.setTextColor(COLORS.gray);
  doc.text(`Document généré le : ${new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`, PAGE.margin, yPos);
  
  yPos += SPACING.large;
  
  return yPos;
};

/**
 * Add KPIs section
 */
const addKPIsSection = (doc: jsPDF, data: MonthlyPDFData, yPos: number): number => {
  const kpis = data.monthlyData.kpis;
  
  // Section title
  doc.setFontSize(FONTS.sectionTitle);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 INDICATEURS CLÉS', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Prepare KPI table data
  const kpiData = [
    ['Jours Travaillés', kpis.daysWorked.toString(), `Taux de complétude : ${kpis.completionRate.toFixed(1)}%`],
    ['CA Total', formatCurrency(kpis.totalRevenue), `Moy. ${formatCurrency(kpis.avgDailyRevenue)}/jour`],
    ['Dépenses Totales', formatCurrency(kpis.totalExpenses), `Moy. ${formatCurrency(kpis.daysWorked > 0 ? kpis.totalExpenses / kpis.daysWorked : 0)}/jour`],
    ['Marge Brute', formatCurrency(kpis.totalRevenue - kpis.totalExpenses), ''],
    ['Écart de Caisse Total', 
      (kpis.totalCashDifference >= 0 ? '+' : '') + formatCurrency(kpis.totalCashDifference),
      `Moy. ${(kpis.avgCashDifference >= 0 ? '+' : '')}${formatCurrency(kpis.avgCashDifference)}/jour`
    ],
    ['Jours Positifs', kpis.positiveDays.toString(), ''],
    ['Jours Négatifs', kpis.negativeDays.toString(), ''],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Indicateur', 'Valeur', 'Détail']],
    body: kpiData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: FONTS.normal,
    },
    bodyStyles: {
      fontSize: FONTS.normal,
      textColor: COLORS.darkGray,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: PAGE.margin, right: PAGE.margin },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 45, halign: 'right' },
      2: { cellWidth: 'auto', textColor: COLORS.gray },
    },
  });
  
  yPos = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + SPACING.large;
  
  return yPos;
};

/**
 * Add expenses by category section
 */
const addExpensesSection = (doc: jsPDF, data: MonthlyPDFData, yPos: number): number => {
  if (data.monthlyData.expensesByCategory.length === 0) return yPos;
  
  // Check if we need a new page
  if (yPos > PAGE.height - 80) {
    doc.addPage();
    yPos = PAGE.margin;
  }
  
  // Section title
  doc.setFontSize(FONTS.sectionTitle);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('💰 DÉPENSES PAR CATÉGORIE', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Prepare expenses table data
  const expensesData = data.monthlyData.expensesByCategory.map(exp => {
    const categoryLabel = EXPENSE_CATEGORIES[exp.category as keyof typeof EXPENSE_CATEGORIES] || exp.category;
    const percentage = data.monthlyData.kpis.totalExpenses > 0 
      ? ((exp.total / data.monthlyData.kpis.totalExpenses) * 100).toFixed(1)
      : '0.0';
    return [
      categoryLabel,
      formatCurrency(exp.total),
      `${percentage}%`,
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Catégorie', 'Montant', 'Part']],
    body: expensesData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: FONTS.normal,
    },
    bodyStyles: {
      fontSize: FONTS.normal,
      textColor: COLORS.darkGray,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: PAGE.margin, right: PAGE.margin },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 30, halign: 'right' },
    },
  });
  
  yPos = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + SPACING.large;
  
  return yPos;
};

/**
 * Add top products section
 */
const addTopProductsSection = (doc: jsPDF, data: MonthlyPDFData, yPos: number): number => {
  if (data.monthlyData.topProducts.length === 0) return yPos;
  
  // Check if we need a new page
  if (yPos > PAGE.height - 80) {
    doc.addPage();
    yPos = PAGE.margin;
  }
  
  // Section title
  doc.setFontSize(FONTS.sectionTitle);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('🏆 TOP 10 PRODUITS', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Prepare products table data
  const productsData = data.monthlyData.topProducts.map((product, index) => [
    (index + 1).toString(),
    product.name,
    product.qtySold.toString(),
    formatCurrency(product.revenue),
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Produit', 'Quantité', 'CA Généré']],
    body: productsData,
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: FONTS.normal,
    },
    bodyStyles: {
      fontSize: FONTS.normal,
      textColor: COLORS.darkGray,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: PAGE.margin, right: PAGE.margin },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
    },
  });
  
  yPos = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + SPACING.large;
  
  return yPos;
};

/**
 * Add daily summary table
 */
const addDailySummarySection = (doc: jsPDF, data: MonthlyPDFData, yPos: number): number => {
  if (data.monthlyData.dailySheets.length === 0) return yPos;
  
  // Check if we need a new page
  if (yPos > PAGE.height - 80) {
    doc.addPage();
    yPos = PAGE.margin;
  }
  
  // Section title
  doc.setFontSize(FONTS.sectionTitle);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('📅 RÉCAPITULATIF JOURNALIER', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Prepare daily sheets table data
  const dailyData = data.monthlyData.dailySheets.map((sheet: DailySheet) => {
    const cashDiff = sheet.cashDifference || 0;
    return [
      formatDate(sheet.sheetDate),
      formatCurrency(sheet.theoreticalRevenue),
      formatCurrency(sheet.expensesTotal),
      (cashDiff >= 0 ? '+' : '') + formatCurrency(cashDiff),
    ];
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'CA', 'Dépenses', 'Écart Caisse']],
    body: dailyData,
    foot: [[
      'TOTAUX',
      formatCurrency(data.monthlyData.kpis.totalRevenue),
      formatCurrency(data.monthlyData.kpis.totalExpenses),
      (data.monthlyData.kpis.totalCashDifference >= 0 ? '+' : '') + 
        formatCurrency(data.monthlyData.kpis.totalCashDifference),
    ]],
    theme: 'striped',
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: FONTS.small,
    },
    bodyStyles: {
      fontSize: FONTS.small,
      textColor: COLORS.darkGray,
    },
    footStyles: {
      fillColor: COLORS.darkGray,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: FONTS.small,
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: PAGE.margin, right: PAGE.margin },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
  });
  
  yPos = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + SPACING.large;
  
  return yPos;
};

/**
 * Add footer to each page
 */
const addFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(FONTS.small);
    doc.setTextColor(COLORS.gray);
    doc.setFont('helvetica', 'normal');
    
    // Page number
    const pageText = `Page ${i} / ${pageCount}`;
    const textWidth = doc.getTextWidth(pageText);
    doc.text(pageText, PAGE.width - PAGE.margin - textWidth, PAGE.height - 10);
    
    // Watermark
    doc.text('Généré par RAVITO', PAGE.margin, PAGE.height - 10);
  }
};

/**
 * Main function to generate the monthly PDF
 */
export const generateMonthlyPDF = (data: MonthlyPDFData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  let yPos = PAGE.margin;
  
  // Add sections
  yPos = addHeader(doc, data, yPos);
  yPos = addKPIsSection(doc, data, yPos);
  yPos = addExpensesSection(doc, data, yPos);
  yPos = addTopProductsSection(doc, data, yPos);
  yPos = addDailySummarySection(doc, data, yPos);
  
  // Add footer to all pages
  addFooter(doc);
  
  // Generate filename
  const monthName = getMonthName(data.month);
  const filename = `Cloture_${monthName}_${data.year}_${data.establishment.name.replace(/\s+/g, '_')}.pdf`;
  
  // Save the PDF
  doc.save(filename);
};
