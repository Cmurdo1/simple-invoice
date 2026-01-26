import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { Invoice, InvoiceItem, Client, Profile } from '@/types/database';

interface ExportOptions {
  invoice: Invoice;
  items: InvoiceItem[];
  client?: Client | null;
  profile?: Profile | null;
}

export async function exportInvoiceToPDF({
  invoice,
  items,
  client,
  profile,
}: ExportOptions): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor: [number, number, number] = [34, 139, 34]; // Green
  const textColor: [number, number, number] = [33, 37, 41];
  const mutedColor: [number, number, number] = [108, 117, 125];

  let yPos = 20;

  // Header - Business Info
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text(profile?.business_name || 'HonestInvoice', 20, yPos);
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  
  if (profile?.address) {
    doc.text(profile.address, 20, yPos);
    yPos += 5;
  }
  if (profile?.email) {
    doc.text(profile.email, 20, yPos);
    yPos += 5;
  }
  if (profile?.phone) {
    doc.text(profile.phone, 20, yPos);
    yPos += 5;
  }

  // Invoice Title and Number - Right aligned
  doc.setFontSize(28);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 20, 25, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoice_number || 'DRAFT', pageWidth - 20, 35, { align: 'right' });

  // Invoice Details Box
  yPos = 55;
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(pageWidth - 80, yPos - 5, 60, 30, 2, 2, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text('Invoice Date:', pageWidth - 75, yPos + 3);
  doc.text('Due Date:', pageWidth - 75, yPos + 11);
  doc.text('Status:', pageWidth - 75, yPos + 19);
  
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(format(new Date(invoice.created_at), 'MMM d, yyyy'), pageWidth - 25, yPos + 3, { align: 'right' });
  doc.text(invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : 'On Receipt', pageWidth - 25, yPos + 11, { align: 'right' });
  doc.text(invoice.status.toUpperCase(), pageWidth - 25, yPos + 19, { align: 'right' });

  // Bill To Section
  yPos = 60;
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', 20, yPos);
  
  yPos += 8;
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.text(client?.name || 'No client assigned', 20, yPos);
  
  yPos += 6;
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  
  if (client?.address) {
    doc.text(client.address, 20, yPos);
    yPos += 5;
  }
  if (client?.email) {
    doc.text(client.email, 20, yPos);
    yPos += 5;
  }
  if (client?.phone) {
    doc.text(client.phone, 20, yPos);
    yPos += 5;
  }

  // Job Description
  if (invoice.job_description) {
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('JOB DESCRIPTION', 20, yPos);
    
    yPos += 6;
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    const splitDesc = doc.splitTextToSize(invoice.job_description, pageWidth - 40);
    doc.text(splitDesc, 20, yPos);
    yPos += splitDesc.length * 5;
  }

  // Line Items Table
  yPos += 15;
  
  // Table Header
  doc.setFillColor(34, 139, 34);
  doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 25, yPos + 1);
  doc.text('Qty', pageWidth - 75, yPos + 1, { align: 'right' });
  doc.text('Price', pageWidth - 50, yPos + 1, { align: 'right' });
  doc.text('Total', pageWidth - 25, yPos + 1, { align: 'right' });
  
  yPos += 10;
  
  // Table Rows
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  
  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);
  
  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    const lineTotal = Number(item.quantity) * Number(item.unit_price);
    
    // Alternate row background
    if (i % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(20, yPos - 4, pageWidth - 40, 8, 'F');
    }
    
    // Truncate description if too long
    const maxDescWidth = pageWidth - 120;
    const descText = doc.splitTextToSize(item.description, maxDescWidth)[0];
    
    doc.text(descText, 25, yPos);
    doc.text(Number(item.quantity).toFixed(2), pageWidth - 75, yPos, { align: 'right' });
    doc.text(`$${Number(item.unit_price).toFixed(2)}`, pageWidth - 50, yPos, { align: 'right' });
    doc.text(`$${lineTotal.toFixed(2)}`, pageWidth - 25, yPos, { align: 'right' });
    
    yPos += 8;
    
    // Check for page break
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
  }

  // Totals Section
  yPos += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(pageWidth - 80, yPos, pageWidth - 20, yPos);
  yPos += 8;
  
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
    0
  );
  const taxRate = profile?.tax_rate || 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  
  // Subtotal
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('Subtotal:', pageWidth - 80, yPos);
  doc.setTextColor(...textColor);
  doc.text(`$${subtotal.toFixed(2)}`, pageWidth - 25, yPos, { align: 'right' });
  
  // Tax
  if (taxRate > 0) {
    yPos += 7;
    doc.setTextColor(...mutedColor);
    doc.text(`Tax (${taxRate}%):`, pageWidth - 80, yPos);
    doc.setTextColor(...textColor);
    doc.text(`$${taxAmount.toFixed(2)}`, pageWidth - 25, yPos, { align: 'right' });
  }
  
  // Total
  yPos += 10;
  doc.setFillColor(34, 139, 34);
  doc.rect(pageWidth - 85, yPos - 5, 65, 12, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - 80, yPos + 3);
  doc.text(`$${total.toFixed(2)}`, pageWidth - 25, yPos + 3, { align: 'right' });

  // Notes
  if (invoice.notes) {
    yPos += 25;
    doc.setFontSize(10);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', 20, yPos);
    
    yPos += 6;
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    doc.text(splitNotes, 20, yPos);
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text('Generated by HonestInvoice', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const fileName = `${invoice.invoice_number || 'invoice-draft'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
