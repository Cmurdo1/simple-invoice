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

function lighten(rgb: [number, number, number], factor = 0.85): [number, number, number] {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * factor),
    Math.round(rgb[1] + (255 - rgb[1]) * factor),
    Math.round(rgb[2] + (255 - rgb[2]) * factor),
  ];
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

// ── Shared helpers ────────────────────────────────────────────────────────────

function drawDivider(doc: jsPDF, x1: number, x2: number, y: number, color: [number, number, number] = [220, 220, 220]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.2);
  doc.line(x1, y, x2, y);
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function computeTotals(items: InvoiceItem[], taxRate: number) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

// ── Shared line items table ───────────────────────────────────────────────────

interface TableOptions {
  startX: number;
  endX: number;
  startY: number;
  primaryColor: [number, number, number];
  textColor: [number, number, number];
  mutedColor: [number, number, number];
  headerBg?: [number, number, number];
  isEstimate?: boolean;
}

function drawItemsTable(doc: jsPDF, items: InvoiceItem[], opts: TableOptions): number {
  const { startX, endX, primaryColor, textColor, mutedColor, isEstimate } = opts;
  const tableW = endX - startX;
  let yPos = opts.startY;
  const hdrBg = opts.headerBg ?? primaryColor;
  const rowH = 9;

  // Header
  doc.setFillColor(...hdrBg);
  doc.rect(startX, yPos - 5, tableW, 10, 'F');

  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', startX + 4, yPos + 1.5);
  doc.text(isEstimate ? 'QTY/HRS' : 'HRS', endX - 72, yPos + 1.5, { align: 'right' });
  doc.text('RATE', endX - 46, yPos + 1.5, { align: 'right' });
  doc.text('AMOUNT', endX - 4, yPos + 1.5, { align: 'right' });
  yPos += 11;

  const sortedItems = [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const accentLight = lighten(primaryColor, 0.93);

  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    const lineTotal = Number(item.quantity) * Number(item.unit_price);

    if (i % 2 === 0) {
      doc.setFillColor(...accentLight);
      doc.rect(startX, yPos - 4.5, tableW, rowH, 'F');
    }

    // Description (may wrap)
    const descLines = doc.splitTextToSize(item.description || '—', tableW - 100);
    const lineH = Math.max(rowH, descLines.length * 5);

    doc.setFontSize(8.5);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    doc.text(descLines[0], startX + 4, yPos);

    // Subtle quantity label
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedColor);
    doc.text(Number(item.quantity).toFixed(2), endX - 72, yPos, { align: 'right' });
    doc.setTextColor(...textColor);
    doc.text(formatCurrency(Number(item.unit_price)), endX - 46, yPos, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(lineTotal), endX - 4, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    yPos += lineH;

    if (yPos > 262) {
      doc.addPage();
      yPos = 20;
    }
  }

  return yPos;
}

// ── Shared totals block ───────────────────────────────────────────────────────

function drawTotalsBlock(
  doc: jsPDF,
  items: InvoiceItem[],
  taxRate: number,
  startY: number,
  primaryColor: [number, number, number],
  textColor: [number, number, number],
  mutedColor: [number, number, number],
  endX: number,
): number {
  const { subtotal, taxAmount, total } = computeTotals(items, taxRate);
  let yPos = startY + 8;
  const labelX = endX - 60;

  drawDivider(doc, labelX, endX, yPos);
  yPos += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text('Subtotal', labelX, yPos);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(subtotal), endX - 4, yPos, { align: 'right' });

  if (taxRate > 0) {
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    doc.text(`Tax (${taxRate}%)`, labelX, yPos);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(taxAmount), endX - 4, yPos, { align: 'right' });
  }

  yPos += 5;
  drawDivider(doc, labelX, endX, yPos);
  yPos += 3;

  // Total highlight box
  doc.setFillColor(...primaryColor);
  doc.roundedRect(labelX, yPos, endX - labelX, 13, 2, 2, 'F');

  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DUE', labelX + 5, yPos + 8.5);
  doc.text(formatCurrency(total), endX - 4, yPos + 8.5, { align: 'right' });

  return yPos + 14;
}

// ── Shared notes + footer ─────────────────────────────────────────────────────

function drawNotes(doc: jsPDF, notes: string, startY: number, startX: number, width: number, textColor: [number, number, number], mutedColor: [number, number, number]): number {
  let yPos = startY + 12;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('NOTES', startX, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  const lines = doc.splitTextToSize(notes, width);
  doc.text(lines, startX, yPos);
  return yPos + lines.length * 4.5;
}

function drawFooter(doc: jsPDF, mutedColor: [number, number, number], primaryColor: [number, number, number]) {
  const pageH = doc.internal.pageSize.getHeight();
  const pageW = doc.internal.pageSize.getWidth();
  // Footer line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.4);
  doc.line(20, pageH - 18, pageW - 20, pageH - 18);
  doc.setLineWidth(0.2);
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  doc.text('Powered by Honest Invoice  ·  honestinvoice.app', pageW / 2, pageH - 12, { align: 'center' });
}

// ── Template: Classic ─────────────────────────────────────────────────────────

async function renderClassic(
  doc: jsPDF, invoice: Invoice, items: InvoiceItem[], client: Client | null | undefined,
  profile: Profile | null | undefined, isPro: boolean, isEstimate: boolean,
  primaryColor: [number, number, number], textColor: [number, number, number],
  mutedColor: [number, number, number], docLabel: string, logoBase64: string | null,
  pageWidth: number, taxRate: number,
) {
  const accentLight = lighten(primaryColor, 0.92);

  // Top accent bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 5, 'F');

  let yPos = 18;
  let logoWidth = 0;

  if (isPro && logoBase64) {
    try { doc.addImage(logoBase64, 'AUTO', 20, yPos - 3, 18, 18); logoWidth = 22; } catch {}
  }

  const bizX = 20 + logoWidth;

  // Business name
  doc.setFontSize(18);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(profile?.business_name || 'Honest Invoice', bizX, yPos + 4);

  // Business info
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  let infoY = yPos + 10;
  const infoParts = [profile?.address, profile?.email, profile?.phone].filter(Boolean) as string[];
  infoParts.forEach((part) => { doc.text(part, bizX, infoY); infoY += 4.5; });

  // Doc label (right side)
  doc.setFontSize(32);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(docLabel, pageWidth - 20, 24, { align: 'right' });

  // Invoice number + status pill
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(invoice.invoice_number || 'DRAFT', pageWidth - 20, 33, { align: 'right' });

  // Details box
  const boxY = Math.max(infoY + 4, 42);
  doc.setFillColor(...accentLight);
  doc.roundedRect(pageWidth - 82, boxY, 62, 32, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');

  const boxRows = [
    [`${isEstimate ? 'Estimate' : 'Invoice'} Date:`, format(new Date(invoice.created_at), 'MMM d, yyyy')],
    [isEstimate ? 'Valid Until:' : 'Due Date:', invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'On Completion'],
    ['Status:', invoice.status.toUpperCase()],
  ];
  boxRows.forEach(([label, value], i) => {
    const rowY = boxY + 7 + i * 9;
    doc.setTextColor(...mutedColor);
    doc.text(label, pageWidth - 78, rowY);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(value, pageWidth - 22, rowY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  });

  yPos = boxY + 40;

  // Bill To
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 20, yPos);
  doc.setFillColor(...primaryColor);
  doc.rect(20, yPos + 2, 18, 0.5, 'F');
  yPos += 8;

  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(client?.name || 'No client assigned', 20, yPos);
  yPos += 5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  if (client?.address) { doc.text(client.address, 20, yPos); yPos += 4.5; }
  if (client?.email)   { doc.text(client.email, 20, yPos);   yPos += 4.5; }
  if (client?.phone)   { doc.text(client.phone, 20, yPos);   yPos += 4.5; }

  // Job description
  if (invoice.job_description) {
    yPos += 6;
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('SCOPE OF WORK', 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(8.5);
    const split = doc.splitTextToSize(invoice.job_description, pageWidth - 40);
    doc.text(split, 20, yPos);
    yPos += split.length * 4.5 + 3;
  }

  yPos += 10;

  yPos = drawItemsTable(doc, items, {
    startX: 20, endX: pageWidth - 20, startY: yPos,
    primaryColor, textColor, mutedColor, isEstimate,
  });

  yPos = drawTotalsBlock(doc, items, taxRate, yPos, primaryColor, textColor, mutedColor, pageWidth - 20);

  if (invoice.notes) {
    yPos = drawNotes(doc, invoice.notes, yPos, 20, pageWidth - 40, textColor, mutedColor);
  }

  drawFooter(doc, mutedColor, primaryColor);
}

// ── Template: Modern ──────────────────────────────────────────────────────────

async function renderModern(
  doc: jsPDF, invoice: Invoice, items: InvoiceItem[], client: Client | null | undefined,
  profile: Profile | null | undefined, isPro: boolean, isEstimate: boolean,
  primaryColor: [number, number, number], textColor: [number, number, number],
  mutedColor: [number, number, number], docLabel: string, logoBase64: string | null,
  pageWidth: number, taxRate: number,
) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const sidebarW = 55;
  const mainX = sidebarW + 8;

  // Sidebar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, sidebarW, pageHeight, 'F');

  // Subtle sidebar pattern (thin lines)
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.1);
  doc.setGState(doc.GState({ opacity: 0.05 }));
  for (let y = 0; y < pageHeight; y += 8) {
    doc.line(0, y, sidebarW, y);
  }
  doc.setGState(doc.GState({ opacity: 1 }));
  doc.setLineWidth(0.2);

  // Logo
  let sideY = 20;
  if (isPro && logoBase64) {
    try { doc.addImage(logoBase64, 'AUTO', 8, sideY - 4, 18, 18); sideY += 22; } catch {}
  }

  // Business name
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  const bizLines = doc.splitTextToSize(profile?.business_name || 'Honest Invoice', sidebarW - 12);
  doc.text(bizLines, 8, sideY);
  sideY += bizLines.length * 5.5 + 3;

  // Business info
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  const bizParts = [profile?.address, profile?.email, profile?.phone].filter(Boolean) as string[];
  bizParts.forEach((part) => {
    const wrapped = doc.splitTextToSize(part, sidebarW - 12);
    doc.text(wrapped, 8, sideY);
    sideY += wrapped.length * 4 + 2;
  });

  // Divider in sidebar
  sideY += 5;
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.line(8, sideY, sidebarW - 8, sideY);
  sideY += 8;

  // BILL TO
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('BILL TO', 8, sideY);
  sideY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(client?.name || '—', 8, sideY); sideY += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  if (client?.address) { doc.text(doc.splitTextToSize(client.address, sidebarW - 12), 8, sideY); sideY += 8; }
  if (client?.email)   { doc.text(doc.splitTextToSize(client.email, sidebarW - 12), 8, sideY); sideY += 6; }
  if (client?.phone)   { doc.text(client.phone, 8, sideY); }

  // ── Main content ──
  let yPos = 18;

  doc.setFontSize(34);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(docLabel, pageWidth - 15, yPos, { align: 'right' });
  yPos += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(invoice.invoice_number || 'DRAFT', pageWidth - 15, yPos, { align: 'right' });
  yPos += 6;

  // Meta strip
  const mainW = pageWidth - mainX - 8;
  const accentLight = lighten(primaryColor, 0.93);
  doc.setFillColor(...accentLight);
  doc.roundedRect(mainX, yPos, mainW, 10, 1, 1, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'bold');
  const dateStr = format(new Date(invoice.created_at), 'MMM d, yyyy');
  const dueStr  = invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'On Completion';
  doc.text(`DATE  ${dateStr}`, mainX + 4, yPos + 6.5);
  doc.text(`${isEstimate ? 'VALID UNTIL' : 'DUE'}  ${dueStr}`, mainX + mainW / 2, yPos + 6.5);
  doc.text(`STATUS  ${invoice.status.toUpperCase()}`, pageWidth - 15, yPos + 6.5, { align: 'right' });
  yPos += 16;

  // Job description
  if (invoice.job_description) {
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('SCOPE OF WORK', mainX, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(8.5);
    const split = doc.splitTextToSize(invoice.job_description, mainW);
    doc.text(split, mainX, yPos);
    yPos += split.length * 4.5 + 5;
  }

  yPos = drawItemsTable(doc, items, {
    startX: mainX, endX: pageWidth - 8, startY: yPos,
    primaryColor, textColor, mutedColor, isEstimate,
  });

  yPos = drawTotalsBlock(doc, items, taxRate, yPos, primaryColor, textColor, mutedColor, pageWidth - 8);

  if (invoice.notes) {
    yPos = drawNotes(doc, invoice.notes, yPos, mainX, mainW, textColor, mutedColor);
  }

  drawFooter(doc, mutedColor, primaryColor);
}

// ── Template: Minimal ─────────────────────────────────────────────────────────

async function renderMinimal(
  doc: jsPDF, invoice: Invoice, items: InvoiceItem[], client: Client | null | undefined,
  profile: Profile | null | undefined, isPro: boolean, isEstimate: boolean,
  primaryColor: [number, number, number], textColor: [number, number, number],
  mutedColor: [number, number, number], docLabel: string, logoBase64: string | null,
  pageWidth: number, taxRate: number,
) {
  let yPos = 20;

  if (isPro && logoBase64) {
    try { doc.addImage(logoBase64, 'AUTO', 20, yPos - 2, 14, 14); } catch {}
  }

  // Business name + doc label on same line
  doc.setFontSize(13);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(profile?.business_name || 'Honest Invoice', 20, yPos + 7);

  doc.setFontSize(26);
  doc.setTextColor(...primaryColor);
  doc.text(docLabel, pageWidth - 20, yPos + 7, { align: 'right' });
  yPos += 14;

  // Business info + invoice number
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  const bizParts = [profile?.address, profile?.email, profile?.phone].filter(Boolean) as string[];
  doc.text(bizParts.join('  ·  '), 20, yPos);
  doc.text(`${invoice.invoice_number || 'DRAFT'}  ·  ${format(new Date(invoice.created_at), 'MMM d, yyyy')}`, pageWidth - 20, yPos, { align: 'right' });
  yPos += 4;

  // Thick divider
  doc.setFillColor(...primaryColor);
  doc.rect(20, yPos, pageWidth - 40, 1.5, 'F');
  yPos += 10;

  // Bill to + dates (two columns)
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 20, yPos);
  doc.text(isEstimate ? 'VALID UNTIL' : 'DUE DATE', pageWidth - 20, yPos, { align: 'right' });
  yPos += 5;

  doc.setFontSize(9.5);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(client?.name || '—', 20, yPos);
  doc.setFontSize(9);
  doc.text(invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'On Completion', pageWidth - 20, yPos, { align: 'right' });
  yPos += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedColor);
  if (client?.address) { doc.text(client.address, 20, yPos); yPos += 4.5; }
  if (client?.email)   { doc.text(client.email,   20, yPos); yPos += 4.5; }
  if (client?.phone)   { doc.text(client.phone,   20, yPos); yPos += 4.5; }

  if (invoice.job_description) {
    yPos += 6;
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('SCOPE OF WORK', 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    const split = doc.splitTextToSize(invoice.job_description, pageWidth - 40);
    doc.text(split, 20, yPos);
    yPos += split.length * 4.5 + 3;
  }

  yPos += 8;
  yPos = drawItemsTable(doc, items, {
    startX: 20, endX: pageWidth - 20, startY: yPos,
    primaryColor, textColor, mutedColor, isEstimate,
    headerBg: textColor as [number, number, number],
  });

  yPos = drawTotalsBlock(doc, items, taxRate, yPos, primaryColor, textColor, mutedColor, pageWidth - 20);

  if (invoice.notes) {
    yPos = drawNotes(doc, invoice.notes, yPos, 20, pageWidth - 40, textColor, mutedColor);
  }

  drawFooter(doc, mutedColor, primaryColor);
}

// ── Template: Bold ────────────────────────────────────────────────────────────

async function renderBold(
  doc: jsPDF, invoice: Invoice, items: InvoiceItem[], client: Client | null | undefined,
  profile: Profile | null | undefined, isPro: boolean, isEstimate: boolean,
  primaryColor: [number, number, number], textColor: [number, number, number],
  mutedColor: [number, number, number], docLabel: string, logoBase64: string | null,
  pageWidth: number, taxRate: number,
) {
  const darkBg: [number, number, number] = [18, 18, 18];
  const offWhite: [number, number, number] = [240, 240, 240];

  // Full dark header
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, pageWidth, 48, 'F');

  // Colored accent stripe at bottom of header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 45, pageWidth, 3, 'F');

  let headerX = 20;
  if (isPro && logoBase64) {
    try { doc.addImage(logoBase64, 'AUTO', 20, 13, 18, 18); headerX = 44; } catch {}
  }

  // Business name
  doc.setFontSize(15);
  doc.setTextColor(...offWhite);
  doc.setFont('helvetica', 'bold');
  doc.text(profile?.business_name || 'Honest Invoice', headerX, 22);

  // Business info
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.setFont('helvetica', 'normal');
  const bizParts = [profile?.address, profile?.email, profile?.phone].filter(Boolean).join('  ·  ');
  doc.text(bizParts, headerX, 30);

  // Doc type (right)
  doc.setFontSize(32);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(docLabel, pageWidth - 20, 27, { align: 'right' });

  doc.setFontSize(9.5);
  doc.setTextColor(190, 190, 190);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number || 'DRAFT', pageWidth - 20, 37, { align: 'right' });

  // Meta strip
  let yPos = 58;
  doc.setFillColor(242, 242, 242);
  doc.rect(20, yPos - 5, pageWidth - 40, 12, 'F');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.setFont('helvetica', 'bold');
  const dateStr = format(new Date(invoice.created_at), 'MMM d, yyyy');
  const dueStr  = invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'On Completion';
  doc.text(`DATE: ${dateStr}`, 25, yPos + 3);
  doc.text(`${isEstimate ? 'VALID UNTIL' : 'DUE'}: ${dueStr}`, pageWidth / 2 - 15, yPos + 3);
  doc.text(`STATUS: ${invoice.status.toUpperCase()}`, pageWidth - 25, yPos + 3, { align: 'right' });
  yPos += 16;

  // Bill to
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 20, yPos);
  yPos += 5;
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text(client?.name || '—', 20, yPos);
  yPos += 5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  if (client?.address) { doc.text(client.address, 20, yPos); yPos += 4.5; }
  if (client?.email)   { doc.text(client.email,   20, yPos); yPos += 4.5; }
  if (client?.phone)   { doc.text(client.phone,   20, yPos); yPos += 4.5; }

  if (invoice.job_description) {
    yPos += 6;
    doc.setFontSize(8);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('SCOPE OF WORK', 20, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    const split = doc.splitTextToSize(invoice.job_description, pageWidth - 40);
    doc.text(split, 20, yPos);
    yPos += split.length * 4.5 + 3;
  }

  yPos += 8;
  yPos = drawItemsTable(doc, items, {
    startX: 20, endX: pageWidth - 20, startY: yPos,
    primaryColor, textColor, mutedColor, isEstimate,
    headerBg: darkBg,
  });

  yPos = drawTotalsBlock(doc, items, taxRate, yPos, primaryColor, textColor, mutedColor, pageWidth - 20);

  if (invoice.notes) {
    yPos = drawNotes(doc, invoice.notes, yPos, 20, pageWidth - 40, textColor, mutedColor);
  }

  drawFooter(doc, mutedColor, primaryColor);
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
  const docLabel   = isEstimate ? 'ESTIMATE' : 'INVOICE';

  const invoiceColorHex  = (isPro && profile?.brand_color)    ? profile.brand_color    : '#228B22';
  const estimateColorHex = (isPro && profile?.estimate_color) ? profile.estimate_color : '#2563eb';
  const brandColorHex    = isEstimate ? estimateColorHex : invoiceColorHex;

  const primaryColor: [number, number, number] = hexToRgb(brandColorHex);
  const textColor:    [number, number, number] = [28, 32, 38];
  const mutedColor:   [number, number, number] = [100, 110, 120];

  const template: InvoiceTemplate =
    (isPro && (templateProp || (profile as any)?.invoice_template as InvoiceTemplate)) || 'classic';

  const taxRate = profile?.tax_rate ?? 0;

  let logoBase64: string | null = null;
  if (isPro && profile?.logo_url) {
    try { logoBase64 = await loadImageAsBase64(profile.logo_url); } catch {}
  }

  const args = [doc, invoice, items, client, profile, isPro, isEstimate,
    primaryColor, textColor, mutedColor, docLabel, logoBase64, pageWidth, taxRate] as const;

  switch (template) {
    case 'modern':  await renderModern(...args);  break;
    case 'minimal': await renderMinimal(...args); break;
    case 'bold':    await renderBold(...args);    break;
    default:        await renderClassic(...args);
  }

  const docPrefix = isEstimate ? 'Estimate' : 'Invoice';
  const fileName = `${invoice.invoice_number || `${docPrefix}-Draft`}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
