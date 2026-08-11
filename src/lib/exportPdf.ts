import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './currency';
import logoRodauto from '@/assets/logo-rodauto-red.png';

interface PaymentExport {
  student_name?: string;
  amount: number;
  due_date: string;
  payment_date?: string | null;
  payment_method?: string | null;
  status: string;
  description?: string | null;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
  cancelled: 'Cancelado',
};

// Function to load image as base64
const loadImageAsBase64 = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const exportPaymentsToPDF = async (
  payments: PaymentExport[],
  title: string = 'Relatório de Pagamentos'
) => {
  const doc = new jsPDF();
  
  // Load and add logo
  try {
    const logoBase64 = await loadImageAsBase64(logoRodauto);
    doc.addImage(logoBase64, 'PNG', 14, 10, 30, 20);
  } catch (e) {
    // Fallback to text if logo fails
    doc.setFontSize(20);
    doc.setTextColor(220, 53, 69);
    doc.text('RODAUTO', 14, 20);
  }
  
  // Header text next to logo
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RODAUTO', 48, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Escola de Condução', 48, 24);
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 40);
  
  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-MZ')}`, 14, 48);
  
  // Calculate totals
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
  
  // Summary
  doc.text(`Total: ${formatCurrency(totalAmount)} | Pago: ${formatCurrency(paidAmount)} | Pendente: ${formatCurrency(pendingAmount)}`, 14, 56);
  
  // Table
  autoTable(doc, {
    head: [['Aluno', 'Valor', 'Vencimento', 'Pagamento', 'Método', 'Estado', 'Tipo']],
    body: payments.map(p => [
      p.student_name || '-',
      formatCurrency(p.amount),
      new Date(p.due_date).toLocaleDateString('pt-MZ'),
      p.payment_date ? new Date(p.payment_date).toLocaleDateString('pt-MZ') : '-',
      p.payment_method || '-',
      statusLabels[p.status] || p.status,
      p.description || '-',
    ]),
    startY: 62,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [220, 53, 69] }, // Red header
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount} - Rodauto Escola de Condução`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`rodauto_${title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportStudentsToPDF = async (
  students: Array<{
    full_name: string;
    email: string;
    phone?: string;
    course_name?: string;
    status: string;
    enrollment_date: string;
    document_number?: string;
  }>,
  title: string = 'Lista de Alunos'
) => {
  const doc = new jsPDF();
  
  // Load and add logo
  try {
    const logoBase64 = await loadImageAsBase64(logoRodauto);
    doc.addImage(logoBase64, 'PNG', 14, 10, 30, 20);
  } catch (e) {
    // Fallback to text if logo fails
    doc.setFontSize(20);
    doc.setTextColor(220, 53, 69);
    doc.text('RODAUTO', 14, 20);
  }
  
  // Header text next to logo
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RODAUTO', 48, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Escola de Condução', 48, 24);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 40);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-MZ')} | Total: ${students.length} alunos`, 14, 48);
  
  autoTable(doc, {
    head: [['Nome', 'Email', 'Telefone', 'BI', 'Curso', 'Estado', 'Inscrição']],
    body: students.map(s => [
      s.full_name,
      s.email,
      s.phone || '-',
      s.document_number || '-',
      s.course_name || '-',
      s.status === 'active' ? 'Activo' : s.status === 'completed' ? 'Concluído' : s.status,
      new Date(s.enrollment_date).toLocaleDateString('pt-MZ'),
    ]),
    startY: 54,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [220, 53, 69] },
  });
  
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount} - Rodauto Escola de Condução`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`rodauto_${title.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

interface StudentDebtExport {
  studentId: string;
  studentName: string;
  phone: string | null;
  email: string;
  courseName: string | null;
  coursePrice: number;
  totalPaid: number;
  totalDebt: number;
  pendingPayments: number;
  lastPaymentDate: string | null;
}

interface FinancialSummaryExport {
  totalRevenue?: number;
  totalPending?: number;
  studentsWithDebt?: number;
}

export const exportFinancialReportToPDF = async (
  studentsWithDebt: StudentDebtExport[],
  summary?: FinancialSummaryExport,
  periodLabel?: string
) => {
  const doc = new jsPDF();
  
  // Load and add logo
  try {
    const logoBase64 = await loadImageAsBase64(logoRodauto);
    doc.addImage(logoBase64, 'PNG', 14, 10, 30, 20);
  } catch (e) {
    doc.setFontSize(20);
    doc.setTextColor(220, 53, 69);
    doc.text('RODAUTO', 14, 20);
  }
  
  // Header text next to logo
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RODAUTO', 48, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Escola de Condução', 48, 24);
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório Financeiro - Situação dos Alunos', 14, 40);
  
  // Period and Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const periodText = periodLabel ? `Período: ${periodLabel} | ` : '';
  doc.text(`${periodText}Gerado em: ${new Date().toLocaleDateString('pt-MZ')}`, 14, 48);
  
  // Summary Box
  if (summary) {
    const totalCoursePrices = studentsWithDebt.reduce((sum, s) => sum + s.coursePrice, 0);
    const totalPaidAll = studentsWithDebt.reduce((sum, s) => sum + s.totalPaid, 0);
    const totalDebtAll = studentsWithDebt.reduce((sum, s) => sum + s.totalDebt, 0);
    
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 52, 182, 28, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO FINANCEIRO', 20, 60);
    
    doc.setFont('helvetica', 'normal');
    const col1X = 20;
    const col2X = 75;
    const col3X = 130;
    const row1Y = 68;
    const row2Y = 75;
    
    doc.text(`Total Recebido:`, col1X, row1Y);
    doc.setTextColor(22, 163, 74); // green
    doc.text(formatCurrency(summary.totalRevenue || 0), col1X + 35, row1Y);
    
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Pendente:`, col2X, row1Y);
    doc.setTextColor(234, 179, 8); // yellow
    doc.text(formatCurrency(summary.totalPending || 0), col2X + 35, row1Y);
    
    doc.setTextColor(0, 0, 0);
    doc.text(`Preços Cursos:`, col1X, row2Y);
    doc.text(formatCurrency(totalCoursePrices), col1X + 35, row2Y);
    
    doc.text(`Total Pago:`, col2X, row2Y);
    doc.text(formatCurrency(totalPaidAll), col2X + 25, row2Y);
    
    doc.text(`Saldo Restante:`, col3X, row2Y);
    doc.text(formatCurrency(totalDebtAll), col3X + 35, row2Y);
  }
  
  // Students with Debt Table
  const startY = summary ? 86 : 56;
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Situação Financeira dos Alunos (${studentsWithDebt.length})`, 14, startY);
  
  autoTable(doc, {
    head: [['Nome', 'Telefone', 'Curso', 'Preço Curso', 'Total Pago', 'Restante', 'Último Pag.']],
    body: studentsWithDebt.map(s => [
      s.studentName,
      s.phone || '-',
      s.courseName || '-',
      formatCurrency(s.coursePrice),
      formatCurrency(s.totalPaid),
      formatCurrency(s.totalDebt),
      s.lastPaymentDate ? new Date(s.lastPaymentDate).toLocaleDateString('pt-MZ') : 'Nunca',
    ]),
    startY: startY + 4,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [220, 53, 69] },
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Página ${i} de ${pageCount} - Rodauto Escola de Condução`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`rodauto_relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
};
