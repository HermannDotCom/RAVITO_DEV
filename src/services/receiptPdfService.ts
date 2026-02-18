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
    cash: 'Especes'
  };
  return methodMap[method] || method;
};

const generateReceiptNumber = (invoiceId: string): string => {
  const year = new Date().getFullYear();
  const lastSixChars = invoiceId.slice(-6).toUpperCase();
  return `REC-${year}-${lastSixChars}`;
};

// Formate un montant avec espace insecable ASCII-safe pour jsPDF
const formatAmount = (amount: number): string => {
  const parts = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts + ' FCFA';
};

const formatDate = (d: Date | null | undefined): string => {
  if (!d) return 'N/A';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatDateShort = (d: Date | null | undefined): string => {
  if (!d) return 'N/A';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const loadImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load image: ${response.statusText}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generatePaymentReceipt = async (data: ReceiptData): Promise<void> => {
  const { invoice, organizationName, planName, paymentMethod, transactionReference } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = doc.internal.pageSize.getWidth();   // 210
  const H = doc.internal.pageSize.getHeight();  // 297
  const mg = 20;
  const cw = W - mg * 2;

  // Palette
  const C = {
    orange:   [234, 88,  12]  as [number,number,number],
    darkGray: [40,  40,  40]  as [number,number,number],
    midGray:  [90,  90,  90]  as [number,number,number],
    lightGray:[150, 150, 150] as [number,number,number],
    rule:     [220, 220, 220] as [number,number,number],
    pageBg:   [248, 248, 248] as [number,number,number],
    white:    [255, 255, 255] as [number,number,number],
    greenTxt: [21,  128, 61]  as [number,number,number],
    greenBg:  [220, 252, 231] as [number,number,number],
  };

  // ── Fond page gris tres clair ─────────────────────────────────────────────
  doc.setFillColor(...C.pageBg);
  doc.rect(0, 0, W, H, 'F');

  // ── En-tete blanc avec bordure basse orange ───────────────────────────────
  doc.setFillColor(...C.white);
  doc.rect(0, 0, W, 45, 'F');
  doc.setFillColor(...C.orange);
  doc.rect(0, 43, W, 2, 'F');

  // Logo blanc : on charge logo_with_slogan_transparent (fond transparent)
  // Sur fond blanc le logo orange s'affiche parfaitement
  let logoLoaded = false;
  try {
    const logoB64 = await loadImageAsBase64('/Logo_Ravito_avec_slogan.png');
    doc.addImage(logoB64, 'PNG', mg, 8, 42, 28);
    logoLoaded = true;
  } catch {
    // Fallback texte
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.orange);
    doc.text('RAVITO', mg, 28);
    logoLoaded = false;
  }
  void logoLoaded;

  // Titre document a droite
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.darkGray);
  doc.text('RECU DE PAIEMENT', W - mg, 20, { align: 'right' });

  const receiptNumber = generateReceiptNumber(invoice.id);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.lightGray);
  doc.text(`N  ${receiptNumber}`, W - mg, 28, { align: 'right' });

  const emissionDate = formatDate(new Date());
  doc.text(`Emis le ${emissionDate}`, W - mg, 35, { align: 'right' });

  // ── Zone contenu (carte blanche) ─────────────────────────────────────────
  const cardY = 52;
  const cardH = H - cardY - 18;
  doc.setFillColor(...C.white);
  doc.roundedRect(mg, cardY, cw, cardH, 3, 3, 'F');
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.3);
  doc.roundedRect(mg, cardY, cw, cardH, 3, 3, 'S');

  let y = cardY + 10;
  const x = mg + 8;
  const xr = W - mg - 8;

  // ── Statut paiement confirme ─────────────────────────────────────────────
  doc.setFillColor(...C.greenBg);
  doc.roundedRect(x - 2, y - 4, cw - 12, 11, 2, 2, 'F');

  doc.setFillColor(...C.greenTxt);
  doc.circle(x + 3.5, y + 1.2, 3, 'F');
  doc.setDrawColor(...C.white);
  doc.setLineWidth(0.6);
  doc.line(x + 2.1, y + 1.2, x + 3.1, y + 2.3);
  doc.line(x + 3.1, y + 2.3, x + 5.1, y + 0.1);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.greenTxt);
  doc.text('Paiement confirme', x + 9, y + 2.2);

  y += 16;

  // ── Separateur ───────────────────────────────────────────────────────────
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.3);
  doc.line(x - 2, y, xr + 2, y);

  y += 10;

  // ── Section MONTANT mis en avant ─────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.lightGray);
  doc.text('MONTANT REGLE', x, y);

  y += 7;
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.orange);
  const amountText = formatAmount(invoice.paidAmount ?? invoice.amount);
  doc.text(amountText, x, y);

  // Badge mode de paiement a droite
  const pmLabel = formatPaymentMethod(paymentMethod);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.darkGray);
  const pmW = doc.getTextWidth(pmLabel) + 8;
  doc.setFillColor(...C.pageBg);
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.3);
  doc.roundedRect(xr - pmW, y - 7, pmW, 8, 2, 2, 'FD');
  doc.text(pmLabel, xr - pmW / 2, y - 2.2, { align: 'center' });

  // Date de paiement sous le badge
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.lightGray);
  doc.text(formatDate(invoice.paidAt), xr, y + 2, { align: 'right' });

  y += 12;

  // ── Separateur ───────────────────────────────────────────────────────────
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.3);
  doc.line(x - 2, y, xr + 2, y);

  y += 10;

  // ── Bloc 2 colonnes : Client | Abonnement ────────────────────────────────
  const colGap = 6;
  const colW = (cw - 16 - colGap) / 2;

  const drawSubCard = (cx: number, cy: number, w: number, h: number) => {
    doc.setFillColor(...C.pageBg);
    doc.setDrawColor(...C.rule);
    doc.setLineWidth(0.25);
    doc.roundedRect(cx, cy, w, h, 2, 2, 'FD');
  };

  const blockH = 32;
  drawSubCard(x - 2, y, colW, blockH);
  drawSubCard(x - 2 + colW + colGap, y, colW, blockH);

  // Colonne gauche — CLIENT
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.orange);
  doc.text('CLIENT', x + 3, y + 7);
  doc.setDrawColor(...C.orange);
  doc.setLineWidth(0.5);
  doc.line(x + 3, y + 8, x + 14, y + 8);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.darkGray);
  // Tronquer si trop long
  const orgDisplay = organizationName.length > 22 ? organizationName.substring(0, 22) + '...' : organizationName;
  doc.text(orgDisplay, x + 3, y + 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.midGray);
  doc.text('Abonne Ravito Gestion', x + 3, y + 23);

  // Colonne droite — ABONNEMENT
  const rx2 = x - 2 + colW + colGap;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.orange);
  doc.text('ABONNEMENT', rx2 + 3, y + 7);
  doc.setDrawColor(...C.orange);
  doc.setLineWidth(0.5);
  doc.line(rx2 + 3, y + 8, rx2 + 26, y + 8);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.darkGray);
  doc.text(`Plan ${planName}`, rx2 + 3, y + 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.midGray);
  const periodLine = `${formatDateShort(invoice.periodStart)} au ${formatDateShort(invoice.periodEnd)}`;
  doc.text(periodLine, rx2 + 3, y + 23);

  y += blockH + 12;

  // ── Tableau recapitulatif ────────────────────────────────────────────────
  // En-tete tableau
  doc.setFillColor(245, 245, 245);
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.25);
  doc.roundedRect(x - 2, y, cw - 12, 8, 1, 1, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.lightGray);
  doc.text('DESCRIPTION', x + 3, y + 5.3);
  doc.text('MONTANT', xr, y + 5.3, { align: 'right' });

  y += 8;

  const tableRows: Array<{ label: string; value: string; highlight: boolean }> = [
    { label: 'Numero de facture', value: invoice.invoiceNumber, highlight: false },
    { label: 'Periode de service', value: `${formatDateShort(invoice.periodStart)} - ${formatDateShort(invoice.periodEnd)}`, highlight: false },
    { label: 'Plan souscrit', value: `Plan ${planName}`, highlight: false },
    { label: 'Montant facture', value: formatAmount(invoice.amount), highlight: false },
    { label: 'Montant regle', value: formatAmount(invoice.paidAmount ?? invoice.amount), highlight: true },
  ];

  tableRows.forEach((row, i) => {
    const rowH = 9;
    const ry = y + i * rowH;
    doc.setFillColor(i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 250);
    doc.rect(x - 2, ry, cw - 12, rowH, 'F');

    doc.setDrawColor(...C.rule);
    doc.setLineWidth(0.15);
    doc.line(x - 2, ry + rowH, x - 2 + cw - 12, ry + rowH);

    doc.setFontSize(8.5);
    if (row.highlight) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.orange);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.midGray);
    }
    doc.text(row.label, x + 3, ry + 6);

    if (row.highlight) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.orange);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.darkGray);
    }
    doc.text(row.value, xr, ry + 6, { align: 'right' });
  });

  // Bordure tableau
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.25);
  doc.rect(x - 2, y, cw - 12, tableRows.length * 9, 'S');

  y += tableRows.length * 9 + 12;

  // ── Details paiement ─────────────────────────────────────────────────────
  const detailsH = transactionReference ? 34 : 26;
  drawSubCard(x - 2, y, cw - 12, detailsH);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.orange);
  doc.text('DETAILS DU PAIEMENT', x + 3, y + 7);
  doc.setDrawColor(...C.orange);
  doc.setLineWidth(0.5);
  doc.line(x + 3, y + 8, x + 44, y + 8);

  const halfX = x + 3;
  const halfX2 = mg + 8 + cw / 2 - 10;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.lightGray);
  doc.text('Mode de paiement', halfX, y + 16);
  doc.text('Date de paiement', halfX2, y + 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.darkGray);
  doc.text(formatPaymentMethod(paymentMethod), halfX, y + 22);
  doc.text(formatDate(invoice.paidAt), halfX2, y + 22);

  if (transactionReference) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.lightGray);
    doc.text('Reference de transaction', halfX, y + 29);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.darkGray);
    const refDisplay = transactionReference.length > 30 ? transactionReference.substring(0, 30) + '...' : transactionReference;
    doc.text(refDisplay, halfX, y + 35);
  }

  // ── Pied de page ─────────────────────────────────────────────────────────
  const footY = H - 14;

  doc.setFillColor(...C.orange);
  doc.rect(0, H - 3, W, 3, 'F');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.darkGray);
  doc.text('Merci pour votre confiance !', W / 2, footY - 2, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.lightGray);
  doc.text('Ravito  -  Le ravitaillement qui ne dort jamais  -  ravito.app', W / 2, footY + 4, { align: 'center' });

  // ── Telechargement ────────────────────────────────────────────────────────
  doc.save(`Recu_Ravito_${invoice.invoiceNumber}.pdf`);
};
