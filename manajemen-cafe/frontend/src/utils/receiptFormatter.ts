import jsPDF from 'jspdf';
import { EscposBuilder } from '../printing/escposBuilder';
import { bluetoothPrinter } from '../printing/bluetoothPrinter';
import { serialPrinter } from '../printing/serialPrinter';
import type { LocalOrder, LocalOutlet } from '../db/cafeDb';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format plain text receipt for Clipboard copy and WhatsApp sharing
 */
export function formatReceiptText(order: LocalOrder, cafeName: string, outlet?: LocalOutlet): string {
  const line = '--------------------------------';
  const rows: string[] = [];

  rows.push(`*${cafeName.toUpperCase()}*`);
  if (outlet?.name) rows.push(outlet.name);
  if (outlet?.address) rows.push(outlet.address);
  if (outlet?.phone) rows.push(`Telp: ${outlet.phone}`);
  rows.push(line);
  rows.push(`No: ${order.orderNumber}`);
  rows.push(`Waktu: ${new Date(order.createdAt).toLocaleString('id-ID')}`);
  rows.push(`Tipe: ${order.orderType === 'DINE_IN' ? `Dine-In (${order.tableName || 'Meja'})` : 'Takeaway'}`);
  if (order.customerName) rows.push(`Pelanggan: ${order.customerName}`);
  rows.push(line);

  // Items
  order.items.forEach((item) => {
    const itemTitle = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
    rows.push(`${item.quantity}x ${itemTitle}`);
    rows.push(`   @${formatCurrency(item.unitPrice)} = ${formatCurrency(item.subtotal)}`);
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach((m) => {
        rows.push(`   + ${m.name} (${formatCurrency(m.price)})`);
      });
    }
    if (item.notes) {
      rows.push(`   *Catatan: ${item.notes}*`);
    }
  });

  rows.push(line);
  rows.push(`Subtotal: ${formatCurrency(order.subtotal)}`);
  if (order.discountAmount > 0) rows.push(`Diskon: -${formatCurrency(order.discountAmount)}`);
  if (order.taxAmount > 0) rows.push(`Pajak (${outlet?.taxPercentage || 0}%): ${formatCurrency(order.taxAmount)}`);
  if (order.serviceChargeAmount > 0) rows.push(`Service (${outlet?.serviceChargePercentage || 0}%): ${formatCurrency(order.serviceChargeAmount)}`);
  rows.push(`*TOTAL: ${formatCurrency(order.totalAmount)}*`);
  rows.push(line);
  rows.push(`Bayar (${order.paymentMethod}): ${formatCurrency(order.amountPaid)}`);
  rows.push(`Kembalian: ${formatCurrency(order.changeAmount)}`);
  rows.push(line);
  rows.push(outlet?.receiptFooter || 'Terima kasih atas kunjungan Anda!');

  return rows.join('\n');
}

/**
 * Generate PDF receipt
 */
export function generateReceiptPdf(order: LocalOrder, cafeName: string, outlet?: LocalOutlet): void {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 160] // 80mm thermal width
  });

  let y = 10;
  const leftX = 5;
  const rightX = 75;
  const centerX = 40;

  doc.setFont('courier', 'bold');
  doc.setFontSize(12);
  doc.text(cafeName, centerX, y, { align: 'center' });
  y += 5;

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  if (outlet?.name) {
    doc.text(outlet.name, centerX, y, { align: 'center' });
    y += 4;
  }
  if (outlet?.address) {
    doc.text(outlet.address, centerX, y, { align: 'center' });
    y += 4;
  }
  if (outlet?.phone) {
    doc.text(`Telp: ${outlet.phone}`, centerX, y, { align: 'center' });
    y += 4;
  }

  doc.text('-'.repeat(38), centerX, y, { align: 'center' });
  y += 4;
  doc.text(`No: ${order.orderNumber}`, leftX, y);
  y += 4;
  doc.text(`Waktu: ${new Date(order.createdAt).toLocaleString('id-ID')}`, leftX, y);
  y += 4;
  doc.text(`Tipe : ${order.orderType === 'DINE_IN' ? `Dine-In (${order.tableName || 'Meja'})` : 'Takeaway'}`, leftX, y);
  y += 4;
  if (order.customerName) {
    doc.text(`Cust : ${order.customerName}`, leftX, y);
    y += 4;
  }
  doc.text('-'.repeat(38), centerX, y, { align: 'center' });
  y += 4;

  // Items
  order.items.forEach((item) => {
    const itemTitle = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
    doc.text(`${item.quantity}x ${itemTitle.substring(0, 20)}`, leftX, y);
    doc.text(formatCurrency(item.subtotal), rightX, y, { align: 'right' });
    y += 4;
  });

  doc.text('-'.repeat(38), centerX, y, { align: 'center' });
  y += 4;
  doc.text('Subtotal:', leftX, y);
  doc.text(formatCurrency(order.subtotal), rightX, y, { align: 'right' });
  y += 4;

  if (order.taxAmount > 0) {
    doc.text(`Pajak (${outlet?.taxPercentage || 0}%):`, leftX, y);
    doc.text(formatCurrency(order.taxAmount), rightX, y, { align: 'right' });
    y += 4;
  }

  doc.setFont('courier', 'bold');
  doc.text('TOTAL:', leftX, y);
  doc.text(formatCurrency(order.totalAmount), rightX, y, { align: 'right' });
  y += 4;

  doc.setFont('courier', 'normal');
  doc.text(`Bayar (${order.paymentMethod}):`, leftX, y);
  doc.text(formatCurrency(order.amountPaid), rightX, y, { align: 'right' });
  y += 4;
  doc.text('Kembalian:', leftX, y);
  doc.text(formatCurrency(order.changeAmount), rightX, y, { align: 'right' });
  y += 6;

  doc.setFontSize(7);
  doc.text(outlet?.receiptFooter || 'Terima kasih atas kunjungan Anda!', centerX, y, { align: 'center' });

  doc.save(`struk-${order.orderNumber}.pdf`);
}

/**
 * Format WhatsApp link with encoded message
 */
export function getWhatsAppShareUrl(phone: string, text: string): string {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.substring(1);
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Print direct via ESC/POS Web Bluetooth or Web Serial
 */
export async function printDirectThermalReceipt(
  order: LocalOrder,
  cafeName: string,
  outlet: LocalOutlet | undefined,
  printerConfig: { type: 'BLUETOOTH' | 'USB' | 'BROWSER'; paperWidth: 58 | 80; autoCut: boolean }
): Promise<void> {
  const builder = new EscposBuilder(printerConfig.paperWidth);

  builder.align('center')
    .doubleSize(true)
    .line(cafeName)
    .doubleSize(false)
    .line(outlet?.name || '')
    .line(outlet?.address || '')
    .line(outlet?.phone ? `Telp: ${outlet.phone}` : '')
    .divider()
    .align('left')
    .twoColumn('No Transaksi:', order.orderNumber)
    .twoColumn('Waktu:', new Date(order.createdAt).toLocaleTimeString('id-ID'))
    .twoColumn('Tipe:', order.orderType === 'DINE_IN' ? `Dine-In (${order.tableName || '-'})` : 'Takeaway');

  if (order.customerName) {
    builder.twoColumn('Pelanggan:', order.customerName);
  }

  builder.divider();

  // Items
  order.items.forEach((item) => {
    const title = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
    builder.line(`${item.quantity}x ${title}`);
    builder.twoColumn(`  @${formatCurrency(item.unitPrice)}`, formatCurrency(item.subtotal));
  });

  builder.divider()
    .twoColumn('Subtotal:', formatCurrency(order.subtotal));

  if (order.taxAmount > 0) {
    builder.twoColumn(`Pajak (${outlet?.taxPercentage || 0}%):`, formatCurrency(order.taxAmount));
  }

  builder.bold(true)
    .twoColumn('TOTAL:', formatCurrency(order.totalAmount))
    .bold(false)
    .divider()
    .twoColumn(`Bayar (${order.paymentMethod}):`, formatCurrency(order.amountPaid))
    .twoColumn('Kembalian:', formatCurrency(order.changeAmount))
    .feed(1)
    .align('center')
    .line(outlet?.receiptFooter || 'Terima Kasih!')
    .feed(3);

  if (printerConfig.autoCut) {
    builder.cut();
  }

  const rawBytes = builder.build();

  if (printerConfig.type === 'BLUETOOTH') {
    await bluetoothPrinter.print(rawBytes);
  } else if (printerConfig.type === 'USB') {
    await serialPrinter.print(rawBytes);
  } else {
    window.print();
  }
}

/**
 * Export tabular data to CSV file with UTF-8 BOM for Microsoft Excel compatibility
 */
export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Print daily shift / closing summary directly to thermal printer
 */
export async function printSummaryReportThermal(
  printerConfig: { type: 'BLUETOOTH' | 'USB' | 'BROWSER'; paperWidth: 58 | 80; autoCut: boolean },
  cafeName: string,
  outletName: string,
  summary: {
    date: string;
    totalRevenue: number;
    totalOrders: number;
    cashSales: number;
    nonCashSales: number;
    totalExpenses: number;
    netCashEstimate: number;
  }
): Promise<void> {
  const builder = new EscposBuilder(printerConfig.paperWidth);
  builder.init()
    .align('center')
    .doubleSize(true)
    .line(cafeName)
    .doubleSize(false)
    .line(outletName)
    .bold(true)
    .line('RINGKASAN PENJUALAN HARIAN')
    .bold(false)
    .line(summary.date)
    .divider()
    .align('left')
    .twoColumn('Total Pesanan:', `${summary.totalOrders} Transaksi`)
    .twoColumn('Omzet Kotor:', formatCurrency(summary.totalRevenue))
    .divider()
    .twoColumn('Penerimaan Tunai:', formatCurrency(summary.cashSales))
    .twoColumn('Non-Tunai (QRIS/Trf):', formatCurrency(summary.nonCashSales))
    .divider()
    .twoColumn('Beban Pengeluaran:', `-${formatCurrency(summary.totalExpenses)}`)
    .bold(true)
    .twoColumn('SISA KAS BERSIH:', formatCurrency(summary.netCashEstimate))
    .bold(false)
    .feed(1)
    .align('center')
    .line('Dicetak: ' + new Date().toLocaleTimeString('id-ID'))
    .feed(3);

  if (printerConfig.autoCut) builder.cut();

  const rawBytes = builder.build();
  if (printerConfig.type === 'BLUETOOTH') {
    await bluetoothPrinter.print(rawBytes);
  } else if (printerConfig.type === 'USB') {
    await serialPrinter.print(rawBytes);
  } else {
    window.print();
  }
}

