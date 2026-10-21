/**
 * Pembuatan laporan PDF A4 portrait (jsPDF + jspdf-autotable). Bahasa Indonesia.
 * Dimuat secara dinamis agar tidak membebani bundel awal.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Parcel } from '../parcels/parcel.types';
import type { MapCapture } from './map-capture.service';
import { formatCoord, formatNumberId } from '../measurement/geometry.service';
import { sanitizeFileName, todayStamp } from '../export/export.service';

const METHOD_LABEL: Record<Parcel['measurementMethod'], string> = {
  map_digitization: 'Digitasi peta satelit',
  gps_mobile: 'GPS ponsel',
  combined: 'Kombinasi digitasi peta dan GPS',
};

export const REPORT_DISCLAIMER =
  'Sistem koordinat: WGS 84 (EPSG:4326). Hasil pengukuran digital ini merupakan estimasi dan tidak menggantikan pengukuran atau penetapan batas resmi oleh pihak berwenang.';

export function reportFileName(parcel: Parcel, date = new Date()): string {
  return `Laporan-GeoLahan-${sanitizeFileName(parcel.name)}-${todayStamp(date)}.pdf`;
}

const M = 15; // margin (mm)
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - 2 * M;

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

function drawNorthArrow(doc: jsPDF, x: number, y: number): void {
  doc.setDrawColor(30, 30, 30);
  doc.setFillColor(255, 255, 255);
  doc.circle(x, y + 6, 6.5, 'FD');
  doc.setFillColor(30, 30, 30);
  doc.triangle(x, y, x - 3, y + 9, x + 3, y + 9, 'F');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('U', x, y + 13.5, { align: 'center' });
}

export function buildParcelReport(parcel: Parcel, map: MapCapture | null, printedAt = new Date()): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as DocWithTable;
  doc.setProperties({ title: `Laporan Pengukuran - ${parcel.name}`, creator: 'GeoLahan Pro' });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text('LAPORAN HASIL PENGUKURAN BIDANG TANAH', PAGE_W / 2, M + 4, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('GeoLahan Pro', PAGE_W / 2, M + 10, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text(`ID Lahan: ${parcel.id}`, M, M + 17);
  doc.text(
    `Tanggal cetak: ${printedAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    PAGE_W - M,
    M + 17,
    { align: 'right' },
  );
  doc.setDrawColor(150, 150, 150);
  doc.line(M, M + 19, PAGE_W - M, M + 19);

  // Ringkasan
  const accuracyNote =
    parcel.measurementMethod === 'map_digitization'
      ? 'Hasil digitasi peta; akurasi bergantung resolusi citra dan ketelitian penandaan.'
      : parcel.gpsAccuracyM !== undefined
        ? `GPS ponsel, akurasi sekitar ±${parcel.gpsAccuracyM.toFixed(1)} m; bukan survei profesional.`
        : 'Melibatkan GPS ponsel yang dapat bergalat beberapa meter atau lebih; bukan survei profesional.';
  const rows: [string, string][] = [
    ['Nama lahan', parcel.name],
    ['Pemilik', parcel.owner || '-'],
    ['Keterangan', parcel.description || '-'],
    ['Tanggal pengukuran', parcel.measuredAt],
    ['Luas', `${formatNumberId(parcel.areaM2)} m²  |  ${formatNumberId(parcel.areaAre)} are  |  ${formatNumberId(parcel.areaHa, 4)} ha`],
    ['Keliling', `${formatNumberId(parcel.perimeterM)} m`],
    ['Titik pusat', `${formatCoord(parcel.centroid[0])}, ${formatCoord(parcel.centroid[1])}`],
    ['Metode pengukuran', METHOD_LABEL[parcel.measurementMethod]],
    ['Catatan akurasi', parcel.notes ? `${accuracyNote} ${parcel.notes}` : accuracyNote],
  ];
  autoTable(doc, {
    startY: M + 23,
    body: rows,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 1.8, overflow: 'linebreak', textColor: 30 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42, fillColor: [240, 244, 242] }, 1: { cellWidth: CONTENT_W - 42 } },
    margin: { left: M, right: M },
  });
  let y = (doc.lastAutoTable?.finalY ?? M + 60) + 6;

  // Peta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  if (map) {
    const w = CONTENT_W;
    const h = Math.min((w * map.height) / map.width, 110);
    if (y + h + 12 > PAGE_H - M - 10) {
      doc.addPage();
      y = M;
    }
    doc.text(`Peta Lokasi (${map.layerLabel})`, M, y);
    y += 3;
    doc.addImage(map.dataUrl, 'JPEG', M, y, w, h);
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.4);
    doc.rect(M, y, w, h);
    drawNorthArrow(doc, M + w - 10, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(90, 90, 90);
    doc.text(map.attribution, M, y + h + 4, { maxWidth: w });
    y += h + 9;
  } else {
    doc.text('Peta Lokasi', M, y);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Gambar peta tidak disertakan dalam laporan ini.', M, y + 6);
    y += 12;
  }

  // Tabel koordinat
  if (y + 30 > PAGE_H - M - 10) {
    doc.addPage();
    y = M;
  }
  autoTable(doc, {
    startY: y,
    head: [['No. Patok', 'Latitude', 'Longitude', 'Jarak ke titik berikutnya (m)']],
    body: parcel.controlPoints.map((cp) => [
      cp.label,
      formatCoord(cp.latitude),
      formatCoord(cp.longitude),
      formatNumberId(cp.distanceToNextM),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 1.6 },
    columnStyles: { 3: { halign: 'right' } },
    margin: { left: M, right: M, bottom: 20 },
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 8;

  // Tanda tangan + catatan
  const boxH = 32;
  if (y + boxH + 14 > PAGE_H - M - 6) {
    doc.addPage();
    y = M;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text('Tempat, tanggal: ______________________', PAGE_W - M, y, { align: 'right' });
  y += 5;
  const colW = (CONTENT_W - 6) / 2;
  ['Pengukur / Surveyor', 'Pemilik'].forEach((label, i) => {
    const x = M + i * (colW + 6);
    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.2);
    doc.rect(x, y, colW, boxH);
    doc.text(label, x + colW / 2, y + 5, { align: 'center' });
    doc.line(x + 8, y + boxH - 6, x + colW - 8, y + boxH - 6);
    doc.setFontSize(7);
    doc.text('(nama jelas & tanda tangan)', x + colW / 2, y + boxH - 2.5, { align: 'center' });
    doc.setFontSize(9);
  });
  y += boxH + 5;
  doc.setFontSize(7.5);
  doc.setTextColor(90, 90, 90);
  doc.text(REPORT_DISCLAIMER, M, y, { maxWidth: CONTENT_W });

  // Nomor halaman
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Halaman ${i} dari ${total}`, PAGE_W / 2, PAGE_H - 8, { align: 'center' });
  }
  return doc;
}

export function saveParcelReport(parcel: Parcel, map: MapCapture | null): string {
  const doc = buildParcelReport(parcel, map);
  const name = reportFileName(parcel);
  doc.save(name);
  return name;
}
