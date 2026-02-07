import jsPDF from 'jspdf';
import type { SubscriptionInvoice, PaymentMethod, SubscriptionPlan } from '../types/subscription';

/**
 * Interface pour les données nécessaires à la génération du reçu
 */
export interface ReceiptData {
  invoice: SubscriptionInvoice;
  organizationName: string;
  planName: string;
  paymentMethod: PaymentMethod;
  transactionReference: string | null;
}

/**
 * Formatte les méthodes de paiement pour l'affichage
 */
const formatPaymentMethod = (method: PaymentMethod): string => {
  const methodMap: Record<PaymentMethod, string> = {
    wave: 'Wave',
    orange_money: 'Orange Money',
    mtn_money: 'MTN Money',
    bank_transfer: 'Virement bancaire',
    cash: 'Espèces'
  };
  return methodMap[method] || method;
};

/**
 * Génère le numéro de reçu à partir de l'ID de la facture
 */
const generateReceiptNumber = (invoiceId: string): string => {
  const year = new Date().getFullYear();
  const lastSixChars = invoiceId.slice(-6).toUpperCase();
  return `REC-${year}-${lastSixChars}`;
};

/**
 * Convertit une image en base64
 */
const loadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load image: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading logo image:', error);
    throw new Error('Impossible de charger le logo Ravito. Le reçu sera généré sans logo.');
  }
};

/**
 * Génère et télécharge un reçu de paiement PDF
 */
export const generatePaymentReceipt = async (data: ReceiptData): Promise<void> => {
  const { invoice, organizationName, planName, paymentMethod, transactionReference } = data;
  
  // Créer un nouveau document PDF (format A4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  const headerHeight = 25;
  const footerMargin = 35;

  try {
    // Charger et ajouter le logo
    const logoBase64 = await loadImageAsBase64('/Logo_Ravito_avec_slogan.png');
    const logoWidth = 50;
    const logoHeight = 20; // Ajuster selon le ratio de l'image
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(logoBase64, 'PNG', logoX, margin, logoWidth, logoHeight);
  } catch (error) {
    console.warn('Logo non chargé, génération du reçu sans logo:', error);
    // Continue sans logo
  }

  // Titre du document
  let currentY = margin + 30;
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12); // Couleur orange Ravito #EA580C
  doc.text('REÇU DE PAIEMENT', pageWidth / 2, currentY, { align: 'center' });

  // Numéro de reçu
  currentY += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const receiptNumber = generateReceiptNumber(invoice.id);
  doc.text(`N° ${receiptNumber}`, pageWidth / 2, currentY, { align: 'center' });

  // Ligne de séparation
  currentY += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // Date d'émission
  currentY += 15;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const emissionDate = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Date d'émission : ${emissionDate}`, margin, currentY);

  // Section CLIENT
  currentY += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('CLIENT', margin, currentY);

  currentY += 2;
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, margin + 30, currentY);

  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Organisation : ${organizationName}`, margin, currentY);

  // Section DÉTAILS DU PAIEMENT
  currentY += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('DÉTAILS DU PAIEMENT', margin, currentY);

  currentY += 2;
  doc.setDrawColor(234, 88, 12);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, margin + 60, currentY);

  // Détails de la facture
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  doc.text(`Facture N° : ${invoice.invoiceNumber}`, margin, currentY);
  
  currentY += 7;
  const periodStart = invoice.periodStart.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const periodEnd = invoice.periodEnd.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Période : ${periodStart} - ${periodEnd}`, margin, currentY);
  
  currentY += 7;
  doc.text(`Plan : ${planName}`, margin, currentY);

  // Montant payé (mise en évidence)
  currentY += 12;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text(`Montant payé : ${invoice.amount.toLocaleString('fr-FR')} FCFA`, margin, currentY);

  // Détails du paiement
  currentY += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Mode de paiement : ${formatPaymentMethod(paymentMethod)}`, margin, currentY);
  
  if (transactionReference) {
    currentY += 7;
    doc.text(`Référence transaction : ${transactionReference}`, margin, currentY);
  }
  
  currentY += 7;
  const paymentDate = invoice.paidAt?.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) || 'N/A';
  doc.text(`Date du paiement : ${paymentDate}`, margin, currentY);

  // Ligne de séparation
  currentY += 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // Message de remerciement
  currentY += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Merci pour votre confiance !', pageWidth / 2, currentY, { align: 'center' });

  currentY += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Ravito - Votre partenaire de gestion', pageWidth / 2, currentY, { align: 'center' });

  // Pied de page avec bordure
  const footerY = pageHeight - 20;
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, margin + headerHeight, contentWidth, footerY - margin - footerMargin, 'S');

  // Télécharger le PDF
  const filename = `Recu_Ravito_${invoice.invoiceNumber}.pdf`;
  doc.save(filename);
};
