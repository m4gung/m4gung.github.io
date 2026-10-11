import type { Transaction, ShopSettings } from '../types';
import { formatRupiah, formatPhoneWA } from './utils';

export function createWhatsAppReceiptMessage(tx: Transaction, settings: ShopSettings): string {
  const line = '------------------------------------------';
  
  const itemsText = tx.items.map(it => {
    const barberInfo = it.barberName ? ` (Barber: ${it.barberName})` : '';
    return `• ${it.name}${barberInfo}\n  ${it.quantity} x ${formatRupiah(it.price)} = ${formatRupiah(it.subtotal)}`;
  }).join('\n');

  const discountText = tx.discountAmount > 0 ? `\nDiskon     : -${formatRupiah(tx.discountAmount)}` : '';
  const changeText = tx.paymentMethod === 'CASH' && tx.changeAmount > 0 
    ? `\nKembalian  : ${formatRupiah(tx.changeAmount)}` 
    : '';

  const message = `✂️ *STRUK PEMBAYARAN - ${settings.shopName.toUpperCase()}* ✂️
${line}
No. Faktur : ${tx.invoiceNumber}
Tanggal    : ${new Date(tx.createdAt).toLocaleString('id-ID')}
Kasir      : ${tx.cashierName || 'Kasir'}
Pelanggan  : ${tx.customerName} (${tx.customerPhone || '-'})

*DETAIL TRANSAKSI:*
${itemsText}
${line}
Subtotal   : ${formatRupiah(tx.subtotal)}${discountText}
*TOTAL*    : *${formatRupiah(tx.totalAmount)}*
Metode     : ${tx.paymentMethod} (Bayar: ${formatRupiah(tx.amountPaid)})${changeText}
${line}
${settings.receiptFooter || 'Terima kasih atas kunjungan Anda!'}
📍 ${settings.address || ''}`;

  return message;
}

export function openWhatsAppReceipt(tx: Transaction, settings: ShopSettings) {
  if (!tx.customerPhone) {
    alert('Nomor WhatsApp pelanggan belum terisi.');
    return;
  }

  const phone = formatPhoneWA(tx.customerPhone);
  const message = createWhatsAppReceiptMessage(tx, settings);
  const encodedText = encodeURIComponent(message);
  const waUrl = `https://wa.me/${phone}?text=${encodedText}`;

  window.open(waUrl, '_blank');
}
