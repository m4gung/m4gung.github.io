// utils.js
export function formatRupiah(num) {
  if (!num) num = 0;
  const sign = num < 0 ? '-' : '';
  num = Math.abs(num);
  return sign + 'Rp ' + num.toLocaleString('id-ID');
}

export function formatDateID(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

export function toNumber(val) {
  if (val === null || val === undefined || val === '') return 0;
  return Number(val.toString().replace(',', '.')) || 0;
}

export function normalizeDate(val) {
  if (!val) return '';
  if (!isNaN(val) && val.toString().trim() !== '' && !val.toString().includes('-') && !val.toString().includes('/')) {
    const serial = Number(val);
    if (serial > 30000) {
      const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  let str = val.toString().trim();
  if (str.includes('T') && str.includes('/') && str.includes('Z')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const dPart = parts[0].split('T')[0];
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      const d = dPart.padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${y}-${m}-${d}`;
    }
  }
  if (str.includes('T') && str.includes('-')) {
    return str.split('T')[0];
  }
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  return str;
}
