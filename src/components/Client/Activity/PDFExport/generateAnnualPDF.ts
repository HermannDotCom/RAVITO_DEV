/**
 * PDF Generator for Annual Activity Closure
 * Generates a professional PDF summary of the year's activity
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnnualData, MonthlyAnnualData, EXPENSE_CATEGORIES } from '../../../../types/activity';
import { COLORS, FONTS, PAGE, SPACING } from './pdfStyles';
import { formatCurrency as formatCurrencyUtil, getCategoryLabel } from '../../../../utils/activityUtils';

// Extend jsPDF type to include autoTable properties
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export interface AnnualPDFData {
  establishment: {
    name: string;
    address?: string;
  };
  year: number;
  annualData: AnnualData;
}

/**
 * Format currency in FCFA
 */
const formatCurrency = (amount: number): string => {
  return formatCurrencyUtil(amount) + ' F';
};

/**
 * Generate the PDF header
 */
const addHeader = (doc: jsPDF, data: AnnualPDFData, yPos: number): number => {
  // Logo/Title
  doc.setFontSize(FONTS.title);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('🍹 RAVITO - Bilan Annuel', PAGE.margin, yPos);
  
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
  
  // Year
  doc.text(`Année : ${data.year}`, PAGE.margin, yPos);
  
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
const addKPIsSection = (doc: jsPDF, data: AnnualPDFData, yPos: number): number => {
  const kpis = data.annualData.kpis;
  
  // Section title
  doc.setFontSize(FONTS.sectionTitle);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 INDICATEURS CLÉS DE L\'ANNÉE', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Revenue section
  doc.setFontSize(FONTS.normal);
  doc.setTextColor(COLORS.darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text('CHIFFRE D\'AFFAIRES', PAGE.margin, yPos);
  yPos += SPACING.small;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`• CA Total : ${formatCurrency(kpis.totalRevenue)}`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  doc.text(`• CA Moyen/mois : ${formatCurrency(kpis.avgMonthlyRevenue)}`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  
  if (kpis.bestMonth) {
    doc.text(`• Meilleur mois : ${kpis.bestMonth.monthName} (${formatCurrency(kpis.bestMonth.revenue)})`, PAGE.margin + 5, yPos);
    yPos += SPACING.small;
  }
  
  if (kpis.worstMonth) {
    doc.text(`• Mois le plus faible : ${kpis.worstMonth.monthName} (${formatCurrency(kpis.worstMonth.revenue)})`, PAGE.margin + 5, yPos);
    yPos += SPACING.small;
  }
  
  yPos += SPACING.small;
  
  // Expenses section
  doc.setFont('helvetica', 'bold');
  doc.text('DÉPENSES', PAGE.margin, yPos);
  yPos += SPACING.small;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`• Total : ${formatCurrency(kpis.totalExpenses)}`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  doc.text(`• Ratio CA : ${kpis.expensesRatio.toFixed(1)}%`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  doc.text(`• Moyenne mensuelle : ${formatCurrency(kpis.avgMonthlyExpenses)}`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  
  yPos += SPACING.small;
  
  // Profitability section
  doc.setFont('helvetica', 'bold');
  doc.text('RENTABILITÉ', PAGE.margin, yPos);
  yPos += SPACING.small;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`• Marge brute : ${formatCurrency(kpis.grossMargin)}`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  doc.text(`• Taux de marge : ${kpis.marginRate.toFixed(1)}%`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  doc.text(`• Marge moyenne mensuelle : ${formatCurrency(kpis.monthsWithData > 0 ? kpis.grossMargin / kpis.monthsWithData : 0)}`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  
  yPos += SPACING.small;
  
  // Cash section
  doc.setFont('helvetica', 'bold');
  doc.text('CAISSE', PAGE.margin, yPos);
  yPos += SPACING.small;
  
  doc.setFont('helvetica', 'normal');
  const cashPrefix = kpis.totalCashDifference >= 0 ? '+' : '';
  doc.text(`• Écart total : ${cashPrefix}${formatCurrency(kpis.totalCashDifference)}`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  doc.text(`• Mois avec écart positif : ${kpis.positiveMonths}`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  doc.text(`• Mois avec écart négatif : ${kpis.negativeMonths}`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  
  yPos += SPACING.small;
  
  // Activity section
  doc.setFont('helvetica', 'bold');
  doc.text('ACTIVITÉ', PAGE.margin, yPos);
  yPos += SPACING.small;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`• Jours travaillés : ${kpis.totalDaysWorked}`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  doc.text(`• Taux de complétude : ${kpis.completionRate.toFixed(1)}%`, PAGE.margin + 5, yPos);
  yPos += SPACING.small;
  doc.text(`• Mois avec données : ${kpis.monthsWithData}`, PAGE.margin + 5, yPos);
  
  yPos += SPACING.large;
  
  return yPos;
};

/**
 * Add monthly summary table
 */
const addMonthlyTable = (doc: jsPDF, data: AnnualPDFData, yPos: number): number => {
  // Check if we need a new page
  if (yPos > PAGE.height - 80) {
    doc.addPage();
    yPos = PAGE.margin;
  }
  
  // Section title
  doc.setFontSize(FONTS.sectionTitle);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('📅 RÉCAPITULATIF MENSUEL', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Filter months with data
  const monthlyData = data.annualData.monthlyData.filter(m => m.daysWorked > 0);
  
  if (monthlyData.length === 0) {
    doc.setFontSize(FONTS.normal);
    doc.setTextColor(COLORS.gray);
    doc.setFont('helvetica', 'normal');
    doc.text('Aucune donnée mensuelle disponible', PAGE.margin, yPos);
    return yPos + SPACING.medium;
  }
  
  // Prepare table data
  const tableData = monthlyData.map((month: MonthlyAnnualData) => {
    const cashDiff = month.cashDifference || 0;
    return [
      month.monthName.charAt(0).toUpperCase() + month.monthName.slice(1),
      formatCurrency(month.revenue),
      formatCurrency(month.expenses),
      formatCurrency(month.margin),
      (cashDiff >= 0 ? '+' : '') + formatCurrency(cashDiff),
      month.daysWorked.toString(),
    ];
  });
  
  // Calculate totals
  const totals = data.annualData.monthlyData.reduce(
    (acc, m) => ({
      revenue: acc.revenue + m.revenue,
      expenses: acc.expenses + m.expenses,
      margin: acc.margin + m.margin,
      cashDifference: acc.cashDifference + m.cashDifference,
      daysWorked: acc.daysWorked + m.daysWorked,
    }),
    { revenue: 0, expenses: 0, margin: 0, cashDifference: 0, daysWorked: 0 }
  );
  
  autoTable(doc, {
    startY: yPos,
    head: [['Mois', 'CA', 'Dépenses', 'Marge', 'Écart Caisse', 'Jours']],
    body: tableData,
    foot: [[
      'TOTAUX',
      formatCurrency(totals.revenue),
      formatCurrency(totals.expenses),
      formatCurrency(totals.margin),
      (totals.cashDifference >= 0 ? '+' : '') + formatCurrency(totals.cashDifference),
      totals.daysWorked.toString(),
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
      0: { cellWidth: 30 },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 20, halign: 'right' },
    },
  });
  
  yPos = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + SPACING.large;
  
  return yPos;
};

/**
 * Add top products section
 */
const addTopProductsSection = (doc: jsPDF, data: AnnualPDFData, yPos: number): number => {
  if (data.annualData.topProducts.length === 0) return yPos;
  
  // Check if we need a new page
  if (yPos > PAGE.height - 80) {
    doc.addPage();
    yPos = PAGE.margin;
  }
  
  // Section title
  doc.setFontSize(FONTS.sectionTitle);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('🏆 TOP 15 PRODUITS', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Prepare products table data
  const productsData = data.annualData.topProducts.map((product, index) => [
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
 * Add expenses by category section
 */
const addExpensesSection = (doc: jsPDF, data: AnnualPDFData, yPos: number): number => {
  if (data.annualData.expensesByCategory.length === 0) return yPos;
  
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
  const expensesData = data.annualData.expensesByCategory.map(exp => {
    const categoryLabel = getCategoryLabel(exp.category, EXPENSE_CATEGORIES);
    const percentage = data.annualData.kpis.totalExpenses > 0 
      ? ((exp.total / data.annualData.kpis.totalExpenses) * 100).toFixed(1)
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
 * Main function to generate the annual PDF
 */
export const generateAnnualPDF = (data: AnnualPDFData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  let yPos = PAGE.margin;
  
  // Add sections
  yPos = addHeader(doc, data, yPos);
  yPos = addKPIsSection(doc, data, yPos);
  yPos = addMonthlyTable(doc, data, yPos);
  yPos = addTopProductsSection(doc, data, yPos);
  yPos = addExpensesSection(doc, data, yPos);
  
  // Add footer to all pages
  addFooter(doc);
  
  // Generate filename
  const filename = `Bilan_Annuel_${data.year}_${data.establishment.name.replace(/\s+/g, '_')}.pdf`;
  
  // Save the PDF
  doc.save(filename);
};
