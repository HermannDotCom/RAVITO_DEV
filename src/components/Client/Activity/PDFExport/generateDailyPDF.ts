/**
 * PDF Generator for Daily Activity Sheet
 * Generates a professional PDF summary of the day's activity
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailySheet, DailyStockLine, DailyExpense, DailyPackaging } from '../../../../types/activity';
import { COLORS, FONTS, PAGE, SPACING } from './pdfStyles';

// Extend jsPDF type to include autoTable properties
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export interface DailyPDFData {
  establishment: {
    name: string;
    address?: string;
  };
  sheet: DailySheet;
  stockLines: DailyStockLine[];
  expenses: DailyExpense[];
  packaging: DailyPackaging[];
  calculations: {
    totalRevenue: number;
    totalExpenses: number;
    expectedCash: number;
    cashDifference: number;
    totalSales: number;
  };
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
 * Format datetime in French format
 */
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Generate the PDF header
 */
const addHeader = (doc: jsPDF, data: DailyPDFData, yPos: number): number => {
  // Logo/Title
  doc.setFontSize(FONTS.title);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('🍹 RAVITO', PAGE.margin, yPos);
  
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
  
  // Date
  doc.text(`Date : ${formatDate(data.sheet.sheetDate)}`, PAGE.margin, yPos);
  
  yPos += SPACING.small + 2;
  
  // Closed date
  if (data.sheet.closedAt) {
    doc.setFontSize(FONTS.small);
    doc.setTextColor(COLORS.success);
    doc.text(`Clôturé le : ${formatDateTime(data.sheet.closedAt)}`, PAGE.margin, yPos);
    yPos += SPACING.small;
  }
  
  yPos += SPACING.large;
  
  return yPos;
};

/**
 * Add sales section
 */
const addSalesSection = (doc: jsPDF, data: DailyPDFData, yPos: number): number => {
  // Section title
  doc.setFontSize(FONTS.sectionTitle);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 VENTES DU JOUR', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Prepare table data
  const tableData = data.stockLines
    .filter(line => {
      const salesQty = line.salesQty || 0;
      return salesQty > 0; // Only show products with sales
    })
    .map(line => {
      const sellingPrice = typeof line.establishmentProduct === 'object' 
        ? line.establishmentProduct.sellingPrice 
        : 0;
      const salesQty = line.salesQty || 0;
      const revenue = line.revenue || 0;
      
      return [
        line.product?.name || 'Produit inconnu',
        formatCurrency(sellingPrice),
        line.initialStock?.toString() || '0',
        (line.totalSupply || 0).toString(),
        line.finalStock?.toString() || '0',
        salesQty.toString(),
        formatCurrency(revenue),
      ];
    });
  
  // Add table
  autoTable(doc, {
    startY: yPos,
    head: [['Produit', 'P. Vente', 'Stock Init.', 'Entrées', 'Stock Final', 'Ventes', 'CA']],
    body: tableData,
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
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: PAGE.margin, right: PAGE.margin },
    columnStyles: {
      0: { cellWidth: 'auto' }, // Product name
      1: { halign: 'right', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 25 },
    },
  });
  
  yPos = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + SPACING.small;
  
  // Total revenue
  doc.setFontSize(FONTS.normal);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.success);
  const totalText = `Total CA Théorique : ${formatCurrency(data.calculations.totalRevenue)}`;
  const textWidth = doc.getTextWidth(totalText);
  doc.text(totalText, PAGE.width - PAGE.margin - textWidth, yPos);
  
  yPos += SPACING.large;
  
  return yPos;
};

/**
 * Add expenses section
 */
const addExpensesSection = (doc: jsPDF, data: DailyPDFData, yPos: number): number => {
  // Check if there are expenses
  if (data.expenses.length === 0) {
    return yPos;
  }
  
  // Section title
  doc.setFontSize(FONTS.sectionTitle);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('💰 DÉPENSES', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Category labels mapping
  const categoryLabels: Record<string, string> = {
    food: 'Alimentation',
    transport: 'Transport',
    utilities: 'Services publics',
    other: 'Autre',
  };
  
  // Prepare table data
  const tableData = data.expenses.map(expense => [
    expense.label,
    categoryLabels[expense.category] || expense.category,
    formatCurrency(expense.amount),
  ]);
  
  // Add table
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Catégorie', 'Montant']],
    body: tableData,
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
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: PAGE.margin, right: PAGE.margin },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 40 },
      2: { halign: 'right', cellWidth: 30 },
    },
  });
  
  yPos = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + SPACING.small;
  
  // Total expenses
  doc.setFontSize(FONTS.normal);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.danger);
  const totalText = `Total Dépenses : ${formatCurrency(data.calculations.totalExpenses)}`;
  const textWidth = doc.getTextWidth(totalText);
  doc.text(totalText, PAGE.width - PAGE.margin - textWidth, yPos);
  
  yPos += SPACING.large;
  
  return yPos;
};

/**
 * Add cash section
 */
const addCashSection = (doc: jsPDF, data: DailyPDFData, yPos: number): number => {
  // Section title
  doc.setFontSize(FONTS.sectionTitle);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('💵 CAISSE', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  doc.setFontSize(FONTS.normal);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.darkGray);
  
  // Opening cash
  doc.text('Fond de caisse :', PAGE.margin + 5, yPos);
  doc.text(formatCurrency(data.sheet.openingCash), PAGE.margin + 80, yPos);
  yPos += SPACING.small + 2;
  
  // Revenue
  doc.setTextColor(COLORS.success);
  doc.text('+ CA Théorique :', PAGE.margin + 5, yPos);
  doc.text(formatCurrency(data.calculations.totalRevenue), PAGE.margin + 80, yPos);
  yPos += SPACING.small + 2;
  
  // Expenses
  doc.setTextColor(COLORS.danger);
  doc.text('- Dépenses :', PAGE.margin + 5, yPos);
  doc.text(formatCurrency(data.calculations.totalExpenses), PAGE.margin + 80, yPos);
  yPos += SPACING.small + 2;
  
  // Divider
  doc.setDrawColor(COLORS.gray);
  doc.setLineWidth(0.3);
  doc.line(PAGE.margin + 5, yPos, PAGE.margin + 110, yPos);
  yPos += SPACING.small;
  
  // Expected cash
  doc.setTextColor(COLORS.darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text('= Caisse attendue :', PAGE.margin + 5, yPos);
  doc.text(formatCurrency(data.calculations.expectedCash), PAGE.margin + 80, yPos);
  yPos += SPACING.small + 2;
  
  // Actual cash (closing)
  if (data.sheet.closingCash !== null && data.sheet.closingCash !== undefined) {
    doc.setFont('helvetica', 'normal');
    doc.text('Caisse comptée :', PAGE.margin + 5, yPos);
    doc.text(formatCurrency(data.sheet.closingCash), PAGE.margin + 80, yPos);
    yPos += SPACING.small + 2;
    
    // Divider
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin + 5, yPos, PAGE.margin + 110, yPos);
    yPos += SPACING.small;
    
    // Cash difference
    const difference = data.calculations.cashDifference;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONTS.subtitle);
    
    if (difference < 0) {
      doc.setTextColor(COLORS.danger);
      doc.text('ÉCART :', PAGE.margin + 5, yPos);
      doc.text(`${formatCurrency(difference)} ❌`, PAGE.margin + 80, yPos);
    } else if (difference > 0) {
      doc.setTextColor(COLORS.success);
      doc.text('ÉCART :', PAGE.margin + 5, yPos);
      doc.text(`+${formatCurrency(difference)} ✓`, PAGE.margin + 80, yPos);
    } else {
      doc.setTextColor(COLORS.darkGray);
      doc.text('ÉCART :', PAGE.margin + 5, yPos);
      doc.text(`${formatCurrency(difference)} ✓`, PAGE.margin + 80, yPos);
    }
  }
  
  yPos += SPACING.large;
  
  return yPos;
};

/**
 * Add packaging section
 */
const addPackagingSection = (doc: jsPDF, data: DailyPDFData, yPos: number): number => {
  // Only add if there's packaging data
  if (data.packaging.length === 0) {
    return yPos;
  }
  
  // Check if we need a new page
  if (yPos > PAGE.height - 80) {
    doc.addPage();
    yPos = PAGE.margin + 10;
  }
  
  // Section title
  doc.setFontSize(FONTS.sectionTitle);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('📦 EMBALLAGES', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Prepare table data
  const tableData = data.packaging.map(pkg => {
    const totalStart = (pkg.qtyFullStart || 0) + (pkg.qtyEmptyStart || 0);
    const totalEnd = (pkg.qtyFullEnd || 0) + (pkg.qtyEmptyEnd || 0);
    const difference = totalEnd - totalStart;
    
    return [
      pkg.crateType,
      totalStart.toString(),
      (pkg.qtyReceived || 0).toString(),
      (pkg.qtyReturned || 0).toString(),
      totalEnd.toString(),
      difference.toString(),
    ];
  });
  
  // Add table
  autoTable(doc, {
    startY: yPos,
    head: [['Type', 'Début', 'Reçus', 'Rendus', 'Fin', 'Écart']],
    body: tableData,
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
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    margin: { left: PAGE.margin, right: PAGE.margin },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 20 },
    },
  });
  
  yPos = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + SPACING.large;
  
  return yPos;
};

/**
 * Add notes section
 */
const addNotesSection = (doc: jsPDF, data: DailyPDFData, yPos: number): number => {
  // Only add if there are notes
  if (!data.sheet.notes || data.sheet.notes.trim() === '') {
    return yPos;
  }
  
  // Check if we need a new page
  if (yPos > PAGE.height - 60) {
    doc.addPage();
    yPos = PAGE.margin + 10;
  }
  
  // Section title
  doc.setFontSize(FONTS.sectionTitle);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('📝 NOTES', PAGE.margin, yPos);
  
  yPos += SPACING.medium;
  
  // Notes content
  doc.setFontSize(FONTS.normal);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.darkGray);
  
  // Split text to fit width
  const maxWidth = PAGE.width - 2 * PAGE.margin;
  const lines = doc.splitTextToSize(data.sheet.notes, maxWidth);
  doc.text(lines, PAGE.margin, yPos);
  
  yPos += lines.length * 5 + SPACING.large;
  
  return yPos;
};

/**
 * Add footer to all pages
 */
const addFooter = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  const generatedAt = formatDateTime(new Date().toISOString());
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(COLORS.gray);
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin, PAGE.height - 15, PAGE.width - PAGE.margin, PAGE.height - 15);
    
    // Footer text
    doc.setFontSize(FONTS.small);
    doc.setTextColor(COLORS.gray);
    doc.setFont('helvetica', 'normal');
    
    const footerText = `Généré par RAVITO - ${generatedAt}`;
    doc.text(footerText, PAGE.margin, PAGE.height - 10);
    
    // Page number
    const pageText = `Page ${i}/${pageCount}`;
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, PAGE.width - PAGE.margin - pageTextWidth, PAGE.height - 10);
  }
};

/**
 * Main function to generate and download the PDF
 */
export const generateDailyPDF = async (data: DailyPDFData): Promise<void> => {
  try {
    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    let yPos = PAGE.margin + 10;
    
    // Add sections
    yPos = addHeader(doc, data, yPos);
    yPos = addSalesSection(doc, data, yPos);
    
    // Check if we need a new page before expenses
    if (yPos > PAGE.height - 80) {
      doc.addPage();
      yPos = PAGE.margin + 10;
    }
    
    yPos = addExpensesSection(doc, data, yPos);
    yPos = addCashSection(doc, data, yPos);
    yPos = addPackagingSection(doc, data, yPos);
    yPos = addNotesSection(doc, data, yPos);
    
    // Add footer to all pages
    addFooter(doc);
    
    // Generate filename: "RAVITO_[Etablissement]_[Date].pdf"
    const dateStr = data.sheet.sheetDate.replace(/-/g, '');
    // Preserve accented characters common in French names
    const establishmentName = data.establishment.name.replace(/[^\w\u00C0-\u017F]/g, '_');
    const filename = `RAVITO_${establishmentName}_${dateStr}.pdf`;
    
    // Download PDF
    doc.save(filename);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    throw new Error(`Erreur lors de la génération du PDF: ${errorMessage}`);
  }
};
