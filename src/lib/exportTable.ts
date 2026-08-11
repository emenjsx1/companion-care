import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escape).join(';')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadTablePDF = (
  filename: string,
  title: string,
  headers: string[],
  rows: (string | number)[][],
  subtitle?: string,
) => {
  const doc = new jsPDF({ orientation: headers.length > 6 ? 'landscape' : 'portrait' });
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(subtitle ?? `Gerado em ${new Date().toLocaleString('pt-PT')}`, 14, 25);
  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((c) => String(c ?? ''))),
    startY: 31,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [190, 30, 45] },
  });
  doc.save(`${filename}.pdf`);
};
