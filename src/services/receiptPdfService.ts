import jsPDF from 'jspdf';
import type { SubscriptionInvoice, PaymentMethod } from '../types/subscription';

export interface ReceiptData {
  invoice: SubscriptionInvoice;
  organizationName: string;
  planName: string;
  paymentMethod: PaymentMethod;
  transactionReference: string | null;
}

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

const generateReceiptNumber = (invoiceId: string): string => {
  const year = new Date().getFullYear();
  const lastSixChars = invoiceId.slice(-6).toUpperCase();
  return `REC-${year}-${lastSixChars}`;
};

const formatAmount = (amount: number): string => {
  return amount.toLocaleString('fr-FR', { useGrouping: true }).replace(/\s/g, '\u202F') + ' FCFA';
};

const loadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load image: ${response.statusText}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading logo image:', error);
    throw error;
  }
};

const drawRoundedRect = (doc: jsPDF, x: number, y: number, w: number, h: number, r: number, style: 'F' | 'S' | 'FD' = 'S') => {
  doc.roundedRect(x, y, w, h, r, r, style);
};

export const generatePaymentReceipt = async (data: ReceiptData): Promise<void> => {
  const { invoice, organizationName, planName, paymentMethod, transactionReference } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // ─── Couleurs ───────────────────────────────────────────────────────────────
  const orange     = [234, 88, 12]  as [number, number, number];
  const orangeLight= [255, 237, 213]as [number, number, number];
  const dark       = [30, 30, 30]   as [number, number, number];
  const mid        = [80, 80, 80]   as [number, number, number];
  const light      = [140, 140, 140]as [number, number, number];
  const divider    = [230, 230, 230]as [number, number, number];
  const greenBg    = [240, 253, 244]as [number, number, number];
  const green      = [22, 163, 74]  as [number, number, number];
  const cardBg     = [250, 250, 250]as [number, number, number];

  // ─── Fond général blanc ─────────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // ─── Barre de titre supérieure ──────────────────────────────────────────────
  doc.setFillColor(...orange);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Accent décoratif (petite bande claire en bas de la barre)
  doc.setFillColor(255, 255, 255, 0.15);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.setGState(doc.GState({ opacity: 0.15 }));
  doc.rect(0, 35, pageWidth, 3, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  // Logo dans la barre
  try {
    const logoBase64 = await loadImageAsBase64('/logo_sans_slogan.png');
    doc.addImage(logoBase64, 'PNG', margin, 7, 28, 22);
  } catch {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('RAVITO', margin, 22);
  }

  // Titre "REÇU DE PAIEMENT" dans la barre
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('REÇU DE PAIEMENT', pageWidth - margin, 19, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 220, 190);
  const receiptNumber = generateReceiptNumber(invoice.id);
  doc.text(`N° ${receiptNumber}`, pageWidth - margin, 27, { align: 'right' });

  // ─── Zone principale ─────────────────────────────────────────────────────────
  let y = 50;

  // Bandeau de statut "Payé" (vert)
  doc.setFillColor(...greenBg);
  drawRoundedRect(doc, margin, y, contentWidth, 13, 3, 'F');
  doc.setDrawColor(...green);
  doc.setLineWidth(0.4);
  drawRoundedRect(doc, margin, y, contentWidth, 13, 3, 'S');

  // Icone check (cercle vert + checkmark)
  doc.setFillColor(...green);
  doc.circle(margin + 8, y + 6.5, 3.5, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.7);
  doc.line(margin + 6.4, y + 6.5, margin + 7.6, y + 7.8);
  doc.line(margin + 7.6, y + 7.8, margin + 9.8, y + 5.2);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...green);
  doc.text('Paiement confirmé', margin + 14, y + 7.3);

  const emissionDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 130, 100);
  doc.text(`Émis le ${emissionDate}`, pageWidth - margin, y + 7.3, { align: 'right' });

  y += 22;

  // ─── Carte Montant payé ──────────────────────────────────────────────────────
  doc.setFillColor(...orangeLight);
  drawRoundedRect(doc, margin, y, contentWidth, 28, 4, 'F');
  doc.setDrawColor(...orange);
  doc.setLineWidth(0.5);
  drawRoundedRect(doc, margin, y, contentWidth, 28, 4, 'S');

  // Accent barre gauche
  doc.setFillColor(...orange);
  doc.roundedRect(margin, y, 3.5, 28, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...light);
  doc.text('MONTANT RÉGLÉ', margin + 9, y + 9);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...orange);
  doc.text(formatAmount(invoice.paidAmount ?? invoice.amount), margin + 9, y + 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...light);
  doc.text(formatPaymentMethod(paymentMethod), pageWidth - margin - 5, y + 13, { align: 'right' });
  const paymentDateStr = invoice.paidAt?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) || '';
  doc.setFontSize(8.5);
  doc.setTextColor(...mid);
  doc.text(paymentDateStr, pageWidth - margin - 5, y + 21, { align: 'right' });

  y += 38;

  // ─── Bloc 2 colonnes : Client + Facture ──────────────────────────────────────
  const colGap = 5;
  const colW = (contentWidth - colGap) / 2;

  const drawCard = (cx: number, cy: number, cw: number, ch: number) => {
    doc.setFillColor(...cardBg);
    drawRoundedRect(doc, cx, cy, cw, ch, 3, 'F');
    doc.setDrawColor(...divider);
    doc.setLineWidth(0.3);
    drawRoundedRect(doc, cx, cy, cw, ch, 3, 'S');
  };

  const cardH = 38;
  drawCard(margin, y, colW, cardH);
  drawCard(margin + colW + colGap, y, colW, cardH);

  // Card gauche — CLIENT
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...orange);
  doc.text('CLIENT', margin + 5, y + 8);

  doc.setDrawColor(...orange);
  doc.setLineWidth(0.4);
  doc.line(margin + 5, y + 9.5, margin + 18, y + 9.5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text(organizationName, margin + 5, y + 17);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mid);
  doc.text('Abonné Ravito Gestion', margin + 5, y + 24);

  // Card droite — ABONNEMENT
  const rx = margin + colW + colGap;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...orange);
  doc.text('ABONNEMENT', rx + 5, y + 8);

  doc.setDrawColor(...orange);
  doc.setLineWidth(0.4);
  doc.line(rx + 5, y + 9.5, rx + 26, y + 9.5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text(`Plan ${planName}`, rx + 5, y + 17);

  const periodStart = invoice.periodStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  const periodEnd = invoice.periodEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mid);
  doc.text(`${periodStart} → ${periodEnd}`, rx + 5, y + 24);

  y += cardH + 8;

  // ─── Tableau récapitulatif ───────────────────────────────────────────────────
  doc.setFillColor(...cardBg);
  drawRoundedRect(doc, margin, y, contentWidth, 8, 2, 'F');
  doc.setDrawColor(...divider);
  doc.setLineWidth(0.3);
  drawRoundedRect(doc, margin, y, contentWidth, 8, 2, 'S');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...light);
  doc.text('DESCRIPTION', margin + 5, y + 5.2);
  doc.text('MONTANT', pageWidth - margin - 5, y + 5.2, { align: 'right' });

  y += 8;

  const rows: [string, string, boolean][] = [
    ['Numéro de facture', invoice.invoiceNumber, false],
    ['Montant facturé', formatAmount(invoice.amount), false],
    ['Montant réglé', formatAmount(invoice.paidAmount ?? invoice.amount), true],
  ];

  if (invoice.amount !== (invoice.paidAmount ?? invoice.amount)) {
    const remaining = invoice.amount - (invoice.paidAmount ?? 0);
    if (remaining > 0) {
      rows.push(['Reste à régler', formatAmount(remaining), false]);
    }
  }

  rows.forEach(([label, value, isHighlight], idx) => {
    const rowH = 10;
    const rowY = y + idx * rowH;

    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 248, 248);
    }
    doc.rect(margin, rowY, contentWidth, rowH, 'F');

    if (isHighlight) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...orange);
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...mid);
    }
    doc.text(label, margin + 5, rowY + 6.5);

    if (isHighlight) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...orange);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...dark);
    }
    doc.text(value, pageWidth - margin - 5, rowY + 6.5, { align: 'right' });

    doc.setDrawColor(...divider);
    doc.setLineWidth(0.2);
    doc.line(margin, rowY + rowH, pageWidth - margin, rowY + rowH);
  });

  // Bordure du tableau
  const tableH = rows.length * 10;
  doc.setDrawColor(...divider);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, tableH, 'S');

  y += tableH + 8;

  // ─── Détails du paiement ─────────────────────────────────────────────────────
  drawCard(margin, y, contentWidth, transactionReference ? 36 : 28);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...orange);
  doc.text('DÉTAILS DU PAIEMENT', margin + 5, y + 8);
  doc.setDrawColor(...orange);
  doc.setLineWidth(0.4);
  doc.line(margin + 5, y + 9.5, margin + 48, y + 9.5);

  const detailCol1 = margin + 5;
  const detailCol2 = pageWidth / 2 + 5;
  let dy = y + 18;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...light);
  doc.text('Mode de paiement', detailCol1, dy - 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text(formatPaymentMethod(paymentMethod), detailCol1, dy + 1);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...light);
  doc.text('Date de paiement', detailCol2, dy - 4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text(invoice.paidAt?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) || 'N/A', detailCol2, dy + 1);

  if (transactionReference) {
    dy += 14;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...light);
    doc.text('Référence de transaction', detailCol1, dy - 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dark);
    doc.text(transactionReference, detailCol1, dy + 1);
  }

  y += (transactionReference ? 36 : 28) + 10;

  // ─── Pied de page ────────────────────────────────────────────────────────────
  const footerY = pageHeight - 28;

  doc.setDrawColor(...divider);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Accents décoratifs
  doc.setFillColor(...orange);
  doc.rect(margin, footerY, 20, 0.8, 'F');
  doc.setFillColor(...divider);
  doc.rect(margin + 22, footerY, contentWidth - 22, 0.8, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...dark);
  doc.text('Merci pour votre confiance !', pageWidth / 2, footerY + 9, { align: 'center' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...light);
  doc.text('Ravito · Le ravitaillement qui ne dort jamais · ravito.app', pageWidth / 2, footerY + 16, { align: 'center' });

  // Numéro de page
  doc.setFontSize(8);
  doc.setTextColor(...divider);
  doc.text('Page 1 / 1', pageWidth - margin, footerY + 9, { align: 'right' });

  // ─── Téléchargement ──────────────────────────────────────────────────────────
  doc.save(`Recu_Ravito_${invoice.invoiceNumber}.pdf`);
};
