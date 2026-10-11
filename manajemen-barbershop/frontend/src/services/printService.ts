import type { Transaction, ShopSettings } from '../types';
import { formatRupiah } from './utils';

export function printThermalReceipt(tx: Transaction, settings: ShopSettings) {
  const printWindow = window.open('', '_blank', 'width=380,height=600');
  if (!printWindow) {
    alert('Pop-up terblokir oleh browser. Izinkan pop-up untuk mencetak struk.');
    return;
  }

  const itemsHtml = tx.items.map(it => `
    <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
      <div>
        <strong>${it.quantity}x ${it.name}</strong>
        ${it.barberName ? `<br><small style="color:#555;">(Barber: ${it.barberName})</small>` : ''}
      </div>
      <div style="text-align:right;">${formatRupiah(it.subtotal)}</div>
    </div>
  `).join('');

  const discountHtml = tx.discountAmount > 0 ? `
    <div style="display:flex; justify-content:space-between; margin-bottom:3px; color:#d9534f;">
      <span>Diskon:</span>
      <span>-${formatRupiah(tx.discountAmount)}</span>
    </div>
  ` : '';

  const changeHtml = tx.paymentMethod === 'CASH' && tx.changeAmount > 0 ? `
    <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
      <span>Kembalian:</span>
      <span>${formatRupiah(tx.changeAmount)}</span>
    </div>
  ` : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Struk - ${tx.invoiceNumber}</title>
      <style>
        @page {
          size: auto;
          margin: 4mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
          font-size: 11px;
          line-height: 1.4;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 8px;
          width: 58mm;
          max-width: 100%;
          box-sizing: border-box;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        .header-title {
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .total-row {
          font-size: 12px;
          font-weight: 900;
          display: flex;
          justify-content: space-between;
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div class="header-title">${settings.shopName || 'BARBERSHOP'}</div>
        <div style="font-size:10px; margin-top:2px;">${settings.address || ''}</div>
        <div style="font-size:10px;">Telp/WA: ${settings.phone || '-'}</div>
      </div>
      
      <div class="divider"></div>

      <div style="font-size:10px;">
        <div>No. Faktur : <strong>${tx.invoiceNumber}</strong></div>
        <div>Waktu      : ${new Date(tx.createdAt).toLocaleString('id-ID')}</div>
        <div>Pelanggan  : ${tx.customerName}</div>
        <div>Kasir      : ${tx.cashierName || 'Kasir'}</div>
      </div>

      <div class="divider"></div>

      <div>
        ${itemsHtml}
      </div>

      <div class="divider"></div>

      <div>
        <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
          <span>Subtotal:</span>
          <span>${formatRupiah(tx.subtotal)}</span>
        </div>
        ${discountHtml}
        <div class="total-row">
          <span>TOTAL:</span>
          <span>${formatRupiah(tx.totalAmount)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:3px;">
          <span>Bayar (${tx.paymentMethod}):</span>
          <span>${formatRupiah(tx.amountPaid)}</span>
        </div>
        ${changeHtml}
      </div>

      <div class="divider"></div>

      <div class="text-center" style="font-size:10px; margin-top:6px;">
        ${settings.receiptFooter || 'Terima kasih atas kunjungan Anda!'}
      </div>

      <script>
        window.onload = function() {
          window.focus();
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
