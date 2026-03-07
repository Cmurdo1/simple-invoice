import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { Invoice, InvoiceItem, Client, Profile } from '@/types/database';

export type InvoiceTemplate = 'classic' | 'modern' | 'minimal' | 'bold';

interface ExportOptions {
  invoice: Invoice;
  items: InvoiceItem[];
  client?: Client | null;
  profile?: Profile | null;
  isPro?: boolean;
  documentType?: 'invoice' | 'estimate';
  template?: InvoiceTemplate;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [34, 139, 34];
}

function darken(rgb: [number, number, number], factor = 0.7): [number, number, number] {
  return [Math.round(rgb[0] * factor), Math.round(rgb[1] * factor), Math.round(rgb[2] * factor)];
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── Line items table (shared) ─────────────────────────────────────────────────

function drawLineItems(
  doc: jsPDF,
  items: InvoiceItem[],
  startY: number,
  primaryColor: [number, number, number],
  textColor: [number, number, number],
  mutedColor: [number, number, number],
  pageWidth: number,
  template: InvoiceTemplate,
): number {
  let yPos = startY;

  // Table header
  if (template === 'bold') {
    doc.setFillColor(30, 30, 30);
  } else {
    doc.setFillColor(...primaryColor);
  }
  doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F');

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 25, yPos + 1);
  doc.text('Qty', pageWidth - 75, yPos + 1, { align: 'right' });
  doc.text('Price', pageWidth - 50, yPos + 1, { align: 'right' });
  doc.text('Total', pageWidth - 25, yPos + 1, { align: 'right' });
  yPos += 10;

  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');

  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);

  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    const lineTotal = Number(item.quantity) * Number(item.unit_price);

    if (i % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(20, yPos - 4, pageWidth - 40, 8, 'F');
    }

    const descText = doc.splitTextToSize(item.description, pageWidth - 120)[0];
    doc.setFontSize(9);
    doc.text(descText, 25, yPos);
    doc.text(Number(item.quantity).toFixed(2), pageWidth - 75, yPos, { align: 'right' });
    doc.text(`$${Number(item.unit_price).toFixed(2)}`, pageWidth - 50, yPos, { align: 'right' });
    doc.text(`$${lineTotal.toFixed(2)}`, pageWidth - 25, yPos, { align: 'right' });
    yPos += 8;

    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
  }

  return yPos;
}

// ── Totals section (shared) ───────────────────────────────────────────────────

function drawTotals(
  doc: jsPDF,
  items: InvoiceItem[],
  taxRate: number,
  startY: number,
  primaryColor: [number, number, number],
  textColor: [number, number, number],
  mutedColor: [number, number, number],
  pageWidth: number,
  template: InvoiceTemplate,
): number {
  let yPos = startY + 10;

  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - 80, yPos, pageWidth - 20, yPos);
  yPos += 8;

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0
  );
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - 80, yPos);
  doc.setTextColor(...textColor);
  doc.text(`$${subtotal.toFixed(2)}`, pageWidth - 25, yPos, { align: 'right' });

  if (taxRate > 0) {
    yPos += 7;
    doc.setTextColor(...mutedColor);
    doc.text(`Tax (${taxRate}%):`, pageWidth - 80, yPos);
    doc.setTextColor(...textColor);
    doc.text(`$${taxAmount.toFixed(2)}`, pageWidth - 25, yPos, { align: 'right' });
  }

  yPos += 10;

  const totalBg: [number, number, number] = template === 'bold' ? [20, 20, 20] : primaryColor;
  doc.setFillColor(...totalBg);
  doc.rect(pageWidth - 85, yPos - 5, 65, 12, 'F');

  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - 80, yPos + 3);
  doc.text(`$${total.toFixed(2)}`, pageWidth - 25, yPos + 3, { align: 'right' });

  return yPos;
}

// ── Footer (shared) ───────────────────────────────────────────────────────────

function drawFooter(doc: jsPDF, mutedColor: [number, number, number]) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Powered by Honest Invoice', pageWidth / 2, pageHeight - 10, { align: 'center' });
}

// ── Template: Classic ─────────────────────────────────────────────────────────

async function renderClassic(
  doc: jsPDF, invoice: Invoice, items: InvoiceItem[], client: Client | null | undefined,
  profile: Profile | null | undefined, isPro: boolean, isEstimate: boolean,
  primaryColor: [number, number, number], textColor: [number, number, number],
  mutedColor: [number, number, number], docLabel: string, logoBase64: string | null,
  pageWidth: number,
) {
  let yPos = 20;
  let logoWidth = 0;

  if (isPro && logoBase64) {
    try {
      doc.addImage(logoBase64, 'AUTO', 20, yPos - 5, 16, 16);
      logoWidth = 16;
      yPos += 2;
    } catch {}
  }

  const textStartX = logoWidth > 0 ? 20 + logoWidth + 5 : 20;

  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(profile?.business_name || 'HonestInvoice', textStartX, yPos);
  yPos += 9;
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  if (profile?.address) { doc.text(profile.address, textStartX, yPos); yPos += 5; }
  if (profile?.email)   { doc.text(profile.email,   textStartX, yPos); yPos += 5; }
  if (profile?.phone)   { doc.text(profile.phone,   textStartX, yPos); yPos += 5; }

  doc.setFontSize(28);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(docLabel, pageWidth - 20, 25, { align: 'right' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number || 'DRAFT', pageWidth - 20, 35, { align: 'right' });

  // Details box
  yPos = 55;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(pageWidth - 80, yPos - 5, 60, 30, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text(`${isEstimate ? 'Estimate' : 'Invoice'} Date:`, pageWidth - 75, yPos + 3);
  doc.text(isEstimate ? 'Valid Until:' : 'Due Date:', pageWidth - 75, yPos + 11);
  doc.text('Status:', pageWidth - 75, yPos + 19);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(format(new Date(invoice.created_at), 'MMM d, yyyy'), pageWidth - 25, yPos + 3, { align: 'right' });
  doc.text(invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : isEstimate ? '30 Days' : 'On Completion', pageWidth - 25, yPos + 11, { align: 'right' });
  doc.text(invoice.status.toUpperCase(), pageWidth - 25, yPos + 19, { align: 'right' });

  return renderBillToAndItems(doc, invoice, items, client, profile, isEstimate, primaryColor, textColor, mutedColor, pageWidth, 'classic');
}

// ── Template: Modern ─────────────────────────────────────────────────────────

async function renderModern(
  doc: jsPDF, invoice: Invoice, items: InvoiceItem[], client: Client | null | undefined,
  profile: Profile | null | undefined, isPro: boolean, isEstimate: boolean,
  primaryColor: [number, number, number], textColor: [number, number, number],
  mutedColor: [number, number, number], docLabel: string, logoBase64: string | null,
  pageWidth: number,
) {
  const pageHeight = doc.internal.pageSize.getHeight();

  // Left sidebar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 52, pageHeight, 'F');

  // Sidebar content
  let sideY = 25;
  if (isPro && logoBase64) {
    try { doc.addImage(logoBase64, 'AUTO', 8, sideY - 5, 16, 16); sideY += 20; } catch {}
  }
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  const bizName = profile?.business_name || 'HonestInvoice';
  const wrappedBiz = doc.splitTextToSize(bizName, 38);
  doc.text(wrappedBiz, 8, sideY);
  sideY += wrappedBiz.length * 6 + 4;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255, 0.8 as any);
  if (profile?.address) { const w = doc.splitTextToSize(profile.address, 38); doc.text(w, 8, sideY); sideY += w.length * 4 + 3; }
  if (profile?.email)   { doc.text(doc.splitTextToSize(profile.email, 38), 8, sideY); sideY += 7; }
  if (profile?.phone)   { doc.text(profile.phone, 8, sideY); sideY += 6; }

  // Sidebar: client info
  sideY += 8;
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 8, sideY);
  sideY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(client?.name || '—', 8, sideY);  sideY += 5;
  if (client?.address) { doc.text(doc.splitTextToSize(client.address, 38), 8, sideY); sideY += 8; }
  if (client?.email)   { doc.text(doc.splitTextToSize(client.email, 38), 8, sideY);   sideY += 6; }
  if (client?.phone)   { doc.text(client.phone, 8, sideY); }

  // Main content area (starts at x=60)
  const mainX = 60;
  const mainW = pageWidth - mainX - 10;
  let yPos = 22;

  doc.setFontSize(30);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(docLabel, pageWidth - 15, yPos, { align: 'right' });
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(invoice.invoice_number || 'DRAFT', pageWidth - 15, yPos, { align: 'right' });
  yPos += 10;

  // Meta row
  doc.setFontSize(8);
  doc.text(`Date: ${format(new Date(invoice.created_at), 'MMM d, yyyy')}`, mainX, yPos);
  doc.text(`${isEstimate ? 'Valid Until' : 'Due'}: ${invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '—'}`, mainX + 55, yPos);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, mainX + 110, yPos);
  yPos += 10;

  if (invoice.job_description) {
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('JOB DESCRIPTION', mainX, yPos);
    yPos += 5;
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    const split = doc.splitTextToSize(invoice.job_description, mainW);
    doc.text(split, mainX, yPos);
    yPos += split.length * 5 + 5;
  }

  // Table — override x positions to work with sidebar
  yPos = drawLineItemsModern(doc, items, yPos, primaryColor, textColor, mutedColor, pageWidth, mainX);

  yPos = drawTotals(doc, items, profile?.tax_rate || 0, yPos, primaryColor, textColor, mutedColor, pageWidth, 'modern');

  if (invoice.notes) {
    yPos += 20;
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', mainX, yPos);
    yPos += 6;
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(invoice.notes, mainW), mainX, yPos);
  }

  drawFooter(doc, mutedColor);
}

function drawLineItemsModern(
  doc: jsPDF, items: InvoiceItem[], startY: number,
  primaryColor: [number, number, number], textColor: [number, number, number],
  mutedColor: [number, number, number], pageWidth: number, mainX: number,
): number {
  let yPos = startY + 5;
  const tableW = pageWidth - mainX - 10;

  doc.setFillColor(...primaryColor);
  doc.rect(mainX, yPos - 5, tableW, 10, 'F');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', mainX + 5, yPos + 1);
  doc.text('Qty', pageWidth - 75, yPos + 1, { align: 'right' });
  doc.text('Price', pageWidth - 50, yPos + 1, { align: 'right' });
  doc.text('Total', pageWidth - 15, yPos + 1, { align: 'right' });
  yPos += 10;

  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);
  doc.setFont('helvetica', 'normal');
  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    const lineTotal = Number(item.quantity) * Number(item.unit_price);
    if (i % 2 === 0) { doc.setFillColor(248, 249, 250); doc.rect(mainX, yPos - 4, tableW, 8, 'F'); }
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(item.description, tableW - 80)[0], mainX + 5, yPos);
    doc.text(Number(item.quantity).toFixed(2), pageWidth - 75, yPos, { align: 'right' });
    doc.text(`$${Number(item.unit_price).toFixed(2)}`, pageWidth - 50, yPos, { align: 'right' });
    doc.text(`$${lineTotal.toFixed(2)}`, pageWidth - 15, yPos, { align: 'right' });
    yPos += 8;
    if (yPos > 260) { doc.addPage(); yPos = 20; }
  }
  return yPos;
}

// ── Template: Minimal ─────────────────────────────────────────────────────────

async function renderMinimal(
  doc: jsPDF, invoice: Invoice, items: InvoiceItem[], client: Client | null | undefined,
  profile: Profile | null | undefined, isPro: boolean, isEstimate: boolean,
  primaryColor: [number, number, number], textColor: [number, number, number],
  mutedColor: [number, number, number], docLabel: string, logoBase64: string | null,
  pageWidth: number,
) {
  // Thin top accent line
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 3, 'F');

  let yPos = 18;
  const logoWidth = 0;

  if (isPro && logoBase64) {
    try { doc.addImage(logoBase64, 'AUTO', 20, yPos, 14, 14); yPos += 2; } catch {}
  }

  // Business + Invoice on same row
  doc.setFontSize(14);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(profile?.business_name || 'HonestInvoice', 20, yPos + 8);

  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text(docLabel, pageWidth - 20, yPos + 8, { align: 'right' });

  yPos += 14;
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  const bizParts = [profile?.address, profile?.email, profile?.phone].filter(Boolean) as string[];
  doc.text(bizParts.join('  ·  '), 20, yPos);

  doc.setTextColor(...mutedColor);
  doc.text(`${invoice.invoice_number || 'DRAFT'}  ·  ${format(new Date(invoice.created_at), 'MMM d, yyyy')}  ·  ${invoice.status.toUpperCase()}`, pageWidth - 20, yPos, { align: 'right' });

  yPos += 6;
  // Thin divider
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  doc.setLineWidth(0.2);
  yPos += 10;

  return renderBillToAndItems(doc, invoice, items, client, profile, isEstimate, primaryColor, textColor, mutedColor, pageWidth, 'minimal');
}

// ── Template: Bold ────────────────────────────────────────────────────────────

async function renderBold(
  doc: jsPDF, invoice: Invoice, items: InvoiceItem[], client: Client | null | undefined,
  profile: Profile | null | undefined, isPro: boolean, isEstimate: boolean,
  primaryColor: [number, number, number], textColor: [number, number, number],
  mutedColor: [number, number, number], docLabel: string, logoBase64: string | null,
  pageWidth: number,
) {
  // Full-width dark header
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, pageWidth, 40, 'F');

  let headerX = 20;
  if (isPro && logoBase64) {
    try { doc.addImage(logoBase64, 'AUTO', 20, 10, 16, 16); headerX = 42; } catch {}
  }

  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(profile?.business_name || 'HonestInvoice', headerX, 22);

  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.setFont('helvetica', 'normal');
  const bizInfo = [profile?.address, profile?.email, profile?.phone].filter(Boolean).join('  ');
  doc.text(bizInfo, headerX, 32);

  // Right side of header — doc type in brand color
  doc.setFontSize(30);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(docLabel, pageWidth - 20, 24, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number || 'DRAFT', pageWidth - 20, 34, { align: 'right' });

  // Meta strip
  let yPos = 48;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 4, pageWidth - 40, 12, 'F');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(`Date: ${format(new Date(invoice.created_at), 'MMM d, yyyy')}`, 25, yPos + 3);
  doc.text(`${isEstimate ? 'Valid Until' : 'Due'}: ${invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '—'}`, pageWidth / 2 - 10, yPos + 3);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, pageWidth - 25, yPos + 3, { align: 'right' });
  yPos += 16;

  return renderBillToAndItems(doc, invoice, items, client, profile, isEstimate, primaryColor, textColor, mutedColor, pageWidth, 'bold', yPos);
}

// ── Shared: bill-to + items + totals + notes ──────────────────────────────────

async function renderBillToAndItems(
  doc: jsPDF, invoice: Invoice, items: InvoiceItem[], client: Client | null | undefined,
  profile: Profile | null | undefined, isEstimate: boolean,
  primaryColor: [number, number, number], textColor: [number, number, number],
  mutedColor: [number, number, number], pageWidth: number, template: InvoiceTemplate,
  startY?: number,
) {
  // For classic/minimal, default startY calculation
  let yPos = startY ?? 60;

  if (template !== 'modern') {
    // Bill To
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 20, yPos);
    yPos += 7;
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.text(client?.name || 'No client assigned', 20, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'normal');
    if (client?.address) { doc.text(client.address, 20, yPos); yPos += 5; }
    if (client?.email)   { doc.text(client.email, 20, yPos);   yPos += 5; }
    if (client?.phone)   { doc.text(client.phone, 20, yPos);   yPos += 5; }
  }

  if (invoice.job_description && template !== 'modern') {
    yPos += 8;
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('JOB DESCRIPTION', 20, yPos);
    yPos += 5;
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    const split = doc.splitTextToSize(invoice.job_description, pageWidth - 40);
    doc.text(split, 20, yPos);
    yPos += split.length * 5;
  }

  yPos += 12;
  yPos = drawLineItems(doc, items, yPos, primaryColor, textColor, mutedColor, pageWidth, template);
  yPos = drawTotals(doc, items, profile?.tax_rate || 0, yPos, primaryColor, textColor, mutedColor, pageWidth, template);

  if (invoice.notes) {
    yPos += 20;
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', 20, yPos);
    yPos += 6;
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(invoice.notes, pageWidth - 40), 20, yPos);
  }

  drawFooter(doc, mutedColor);
}

// ── Main export function ──────────────────────────────────────────────────────

export async function exportInvoiceToPDF({
  invoice,
  items,
  client,
  profile,
  isPro = false,
  documentType = 'invoice',
  template: templateProp,
}: ExportOptions): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const isEstimate = documentType === 'estimate';
  const docLabel = isEstimate ? 'ESTIMATE' : 'INVOICE';

  const invoiceColorHex = (isPro && profile?.brand_color) ? profile.brand_color : '#228B22';
  const estimateColorHex = (isPro && (profile as any)?.estimate_color) ? (profile as any).estimate_color : '#2563eb';
  const brandColorHex = isEstimate ? estimateColorHex : invoiceColorHex;
  const primaryColor: [number, number, number] = hexToRgb(brandColorHex);
  const textColor: [number, number, number] = [33, 37, 41];
  const mutedColor: [number, number, number] = [108, 117, 125];

  const template: InvoiceTemplate = (isPro && (templateProp || (profile as any)?.invoice_template)) || 'classic';

  let logoBase64: string | null = null;
  if (isPro && profile?.logo_url) {
    try { logoBase64 = await loadImageAsBase64(profile.logo_url); } catch {}
  }

  switch (template) {
    case 'modern':
      await renderModern(doc, invoice, items, client, profile, isPro, isEstimate, primaryColor, textColor, mutedColor, docLabel, logoBase64, pageWidth);
      break;
    case 'minimal':
      await renderMinimal(doc, invoice, items, client, profile, isPro, isEstimate, primaryColor, textColor, mutedColor, docLabel, logoBase64, pageWidth);
      break;
    case 'bold':
      await renderBold(doc, invoice, items, client, profile, isPro, isEstimate, primaryColor, textColor, mutedColor, docLabel, logoBase64, pageWidth);
      break;
    case 'classic':
    default:
      await renderClassic(doc, invoice, items, client, profile, isPro, isEstimate, primaryColor, textColor, mutedColor, docLabel, logoBase64, pageWidth);
  }

  const docPrefix = isEstimate ? 'Estimate' : 'Invoice';
  const fileName = `${invoice.invoice_number || `${docPrefix}-Draft`}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
