import { db } from '../db';

export class AuditAndSecurityService {
  /**
   * Pembatalan / Void Transaksi Kasir Secara Terkontrol
   * Mengembalikan stok produk dan mencatat alasan pembatalan
   */
  public static async voidTransaction(
    transactionId: string,
    cancellationReason: string,
    authorizedBy: string = 'Owner/Manager'
  ): Promise<{ success: boolean; message: string }> {
    if (!cancellationReason.trim()) {
      return { success: false, message: 'Alasan pembatalan transaksi wajib diisi.' };
    }

    const tx = await db.transactions.get(transactionId);
    if (!tx) {
      return { success: false, message: 'Transaksi tidak ditemukan.' };
    }

    if (tx.status === 'CANCELLED') {
      return { success: false, message: 'Transaksi sudah dibatalkan sebelumnya.' };
    }

    try {
      // 1. Ubah status transaksi menjadi CANCELLED
      await db.transactions.update(transactionId, {
        status: 'CANCELLED',
        cancellationReason: `[${authorizedBy}] ${cancellationReason}`
      });

      // 2. Kembalikan stok produk retail yang dibeli pada transaksi ini
      for (const item of tx.items) {
        if (item.type === 'PRODUCT') {
          const product = await db.products.get(item.referenceId);
          if (product) {
            await db.products.update(product.id, {
              stock: product.stock + item.quantity,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }

      // 3. Kurangi total belanja & kunjungan pelanggan jika terdaftar
      if (tx.customerId) {
        const customer = await db.customers.get(tx.customerId);
        if (customer) {
          await db.customers.update(customer.id, {
            totalVisits: Math.max(0, (customer.totalVisits || 1) - 1),
            totalSpent: Math.max(0, (customer.totalSpent || tx.totalAmount) - tx.totalAmount)
          });
        }
      }

      return {
        success: true,
        message: `Transaksi ${tx.invoiceNumber} berhasil dibatalkan dan stok produk telah dikembalikan.`
      };
    } catch (err: any) {
      return { success: false, message: 'Gagal membatalkan transaksi: ' + err.message };
    }
  }

  /**
   * Ekspor Cadangan Seluruh Database Lokal ke File JSON (Disaster Recovery Backup)
   */
  public static async exportFullDatabaseBackupJSON(): Promise<string> {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: await db.settings.toArray(),
      services: await db.services.toArray(),
      products: await db.products.toArray(),
      barbers: await db.barbers.toArray(),
      customers: await db.customers.toArray(),
      attendances: await db.attendances.toArray(),
      staffAllowances: await db.staffAllowances.toArray(),
      transactions: await db.transactions.toArray(),
      expenses: await db.expenses.toArray(),
      syncOutbox: await db.syncOutbox.toArray()
    };

    return JSON.stringify(backupData, null, 2);
  }

  /**
   * Pulihkan / Import Database dari File JSON Backup
   */
  public static async importFullDatabaseBackupJSON(jsonString: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.version || !data.transactions) {
        return { success: false, message: 'Format file backup tidak valid.' };
      }

      if (data.services) await db.services.bulkPut(data.services);
      if (data.products) await db.products.bulkPut(data.products);
      if (data.barbers) await db.barbers.bulkPut(data.barbers);
      if (data.customers) await db.customers.bulkPut(data.customers);
      if (data.attendances) await db.attendances.bulkPut(data.attendances);
      if (data.staffAllowances) await db.staffAllowances.bulkPut(data.staffAllowances);
      if (data.transactions) await db.transactions.bulkPut(data.transactions);
      if (data.expenses) await db.expenses.bulkPut(data.expenses);
      if (data.settings && data.settings[0]) await db.settings.put(data.settings[0]);

      return { success: true, message: 'Data cadangan berhasil dipulihkan secara penuh!' };
    } catch (err: any) {
      return { success: false, message: 'Gagal memulihkan cadangan: ' + err.message };
    }
  }
}
