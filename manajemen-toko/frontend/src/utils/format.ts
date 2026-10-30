export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatTanggal(isoString: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatThousand(val: number | undefined | null): string {
  if (val === undefined || val === null || val === 0) return '';
  return val.toLocaleString('id-ID');
}

export function parseThousand(str: string): number {
  const digits = str.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}
