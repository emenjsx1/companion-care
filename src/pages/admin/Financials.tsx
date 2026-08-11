import { useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Download, 
  Loader2,
  Eye,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Search,
  FileSpreadsheet,
  FileText,
  Bell,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, Area, AreaChart } from 'recharts';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import AdminLayout from '@/components/admin/AdminLayout';
import { useFinancialSummary, useAllStudentsFinancial, useMonthlyFinancials, useStudentFinancialDetails, usePaymentEvolution } from '@/hooks/useFinancials';
import { formatCurrency } from '@/lib/currency';
import { useSendWhatsAppMessage, MESSAGE_TEMPLATES, replaceTemplateVariables } from '@/hooks/useEvolutionApi';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PaymentReminders from '@/components/admin/PaymentReminders';
import { useDeletePayment } from '@/hooks/usePayments';

type DateFilter = 'today' | 'week' | 'month' | 'custom' | 'all';

const Financials = () => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Calculate date range based on filter
  const getDateRange = () => {
    const today = new Date();
    switch (dateFilter) {
      case 'today':
        return { startDate: format(startOfDay(today), 'yyyy-MM-dd'), endDate: format(endOfDay(today), 'yyyy-MM-dd') };
      case 'week':
        return { startDate: format(startOfWeek(today, { locale: pt }), 'yyyy-MM-dd'), endDate: format(endOfWeek(today, { locale: pt }), 'yyyy-MM-dd') };
      case 'month':
        return { startDate: format(startOfMonth(today), 'yyyy-MM-dd'), endDate: format(endOfMonth(today), 'yyyy-MM-dd') };
      case 'custom':
        return {
          startDate: customStartDate ? format(customStartDate, 'yyyy-MM-dd') : undefined,
          endDate: customEndDate ? format(customEndDate, 'yyyy-MM-dd') : undefined,
        };
      default:
        return {};
    }
  };

  const dateRange = getDateRange();
  
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary(dateRange);
  const { data: allStudents, isLoading: studentsLoading } = useAllStudentsFinancial();
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyFinancials();
  const { data: evolutionData, isLoading: evolutionLoading } = usePaymentEvolution();
  const { data: studentDetails, isLoading: detailsLoading } = useStudentFinancialDetails(selectedStudentId);
  const sendWhatsApp = useSendWhatsAppMessage();
  const deletePayment = useDeletePayment();

  const filteredStudents = allStudents?.filter(s => 
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const openStudentDetails = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsDetailOpen(true);
  };

  const sendPaymentReminder = (student: { phone: string | null; studentName: string; totalDebt: number }) => {
    if (!student.phone) return;
    
    const paymentTemplate = MESSAGE_TEMPLATES.find(t => t.id === 'payment_reminder');
    if (!paymentTemplate) return;
    
    const message = replaceTemplateVariables(paymentTemplate.message, {
      nome: student.studentName,
      valor: formatCurrency(student.totalDebt),
      data: 'o mais breve possível',
    });
    
    sendWhatsApp.mutate({ phone: student.phone, message });
  };

  const exportToCSV = () => {
    if (!allStudents) return;
    
    const headers = ['Nome', 'Telefone', 'Email', 'Curso', 'Preço Curso', 'Total Pago', 'Saldo Devedor', 'Último Pagamento'];
    const rows = allStudents.map(s => [
      s.studentName,
      s.phone || '',
      s.email,
      s.courseName || '',
      s.coursePrice.toString(),
      s.totalPaid.toString(),
      s.totalDebt.toString(),
      s.lastPaymentDate || '',
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financeiro_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    if (!allStudents) return;
    
    const { exportFinancialReportToPDF } = await import('@/lib/exportPdf');
    exportFinancialReportToPDF(allStudents, summary || undefined, getFilterLabel());
  };

  const chartData = monthlyData?.map(d => ({
    month: d.month,
    Receita: d.revenue,
    Pendente: d.pending,
  })) || [];

  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
      case 'custom': 
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, 'dd/MM')} - ${format(customEndDate, 'dd/MM')}`;
        }
        return 'Período Personalizado';
      default: return 'Todo o Período';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão Financeira</h1>
            <p className="text-muted-foreground">Visão completa das finanças da escola</p>
          </div>
          <div className="flex gap-2">
            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue>{getFilterLabel()}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o Período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'Início'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      locale={pt}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'Fim'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      locale={pt}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToCSV} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary Cards */}
        {summaryLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Recebido</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(summary?.totalRevenue || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Em dívida (saldo)</p>
                    <p className="text-2xl font-bold text-warning">{formatCurrency(summary?.totalPending || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor total dos cursos</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency((summary?.totalRevenue || 0) + (summary?.totalPending || 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Alunos c/ Dívida</p>
                    <p className="text-2xl font-bold text-destructive">{summary?.studentsWithDebt || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {/* Tabs */}
<Tabs defaultValue="debtors">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="debtors">Situação Financeira</TabsTrigger>
            <TabsTrigger value="reminders" className="gap-1">
              <Bell className="h-3 w-3" />
              Lembretes
            </TabsTrigger>
            <TabsTrigger value="evolution">Evolução</TabsTrigger>
            <TabsTrigger value="report">Relatório</TabsTrigger>
          </TabsList>

          <TabsContent value="debtors" className="space-y-4">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por nome, telefone, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Debtors Table */}
            <Card>
              <CardHeader>
                <CardTitle>Situação Financeira dos Alunos</CardTitle>
                <CardDescription>{filteredStudents.length} aluno(s) encontrado(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {studentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aluno</TableHead>
                          <TableHead className="hidden md:table-cell">Curso</TableHead>
                          <TableHead className="text-right">Preço Curso</TableHead>
                          <TableHead className="text-right">Total Pago</TableHead>
                          <TableHead className="text-right">% Pago</TableHead>
                          <TableHead className="text-right">Restante</TableHead>
                          <TableHead className="hidden sm:table-cell">Último Pagamento</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                              Nenhum aluno encontrado
                            </TableCell>
                          </TableRow>
                        ) : filteredStudents.map((student) => {
                          const paymentPercentage = student.coursePrice > 0 
                            ? Math.round((student.totalPaid / student.coursePrice) * 100) 
                            : 0;
                          return (
                          <TableRow key={student.studentId}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{student.studentName}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {student.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {student.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {student.courseName || '-'}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(student.coursePrice)}
                            </TableCell>
                            <TableCell className="text-right text-success font-medium">
                              {formatCurrency(student.totalPaid)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge 
                                variant="outline" 
                                className={paymentPercentage >= 100 
                                  ? "bg-success/10 text-success" 
                                  : paymentPercentage >= 75 
                                    ? "bg-success/10 text-success" 
                                    : paymentPercentage >= 50 
                                      ? "bg-warning/10 text-warning" 
                                      : "bg-destructive/10 text-destructive"
                                }
                              >
                                {paymentPercentage}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {student.totalDebt > 0 ? (
                                <Badge variant="outline" className="bg-destructive/10 text-destructive">
                                  {formatCurrency(student.totalDebt)}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-success/10 text-success">
                                  Pago
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">
                              {student.lastPaymentDate 
                                ? new Date(student.lastPaymentDate).toLocaleDateString('pt-PT')
                                : 'Nunca'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openStudentDetails(student.studentId)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {student.phone && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => sendPaymentReminder(student)}
                                    disabled={sendWhatsApp.isPending}
                                    title="Enviar lembrete via WhatsApp"
                                  >
                                    <Phone className="h-4 w-4 text-success" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )})}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Reminders Tab */}
          <TabsContent value="reminders">
            <PaymentReminders />
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Evolução de Pagamentos - {new Date().getFullYear()}
                </CardTitle>
                <CardDescription>Acompanhe os pagamentos recebidos ao longo do ano (acumulado)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {evolutionLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={evolutionData}>
                        <defs>
                          <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value, name) => [
                            formatCurrency(Number(value)), 
                            name === 'cumulativeReceived' ? 'Total Acumulado' : 'Recebido no Mês'
                          ]}
                        />
                        <Legend 
                          formatter={(value) => value === 'cumulativeReceived' ? 'Total Acumulado' : 'Recebido no Mês'}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cumulativeReceived" 
                          stroke="hsl(var(--success))" 
                          fillOpacity={1} 
                          fill="url(#colorReceived)" 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="received" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Payments Table */}
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos Mensais</CardTitle>
                <CardDescription>Detalhe dos pagamentos recebidos por mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead className="text-right">Recebido no Mês</TableHead>
                        <TableHead className="text-right">Total Acumulado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evolutionData?.map((month) => (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium">{month.month}</TableCell>
                          <TableCell className="text-right">
                            {month.received > 0 ? (
                              <span className="text-success font-medium">{formatCurrency(month.received)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {formatCurrency(month.cumulativeReceived)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receitas vs Pendente - {new Date().getFullYear()}</CardTitle>
                <CardDescription>Evolução mensal das finanças</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {monthlyLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value) => [`${formatCurrency(Number(value))}`, '']}
                        />
                        <Legend />
                        <Bar dataKey="Receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Pendente" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right">Pendente</TableHead>
                        <TableHead className="text-right">Taxa Cobrança</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData?.map((month) => {
                        const total = month.revenue + month.pending;
                        const rate = total > 0 ? ((month.revenue / total) * 100).toFixed(1) : '0';
                        return (
                          <TableRow key={month.month}>
                            <TableCell className="font-medium">{month.month}</TableCell>
                            <TableCell className="text-right text-success">{formatCurrency(month.revenue)}</TableCell>
                            <TableCell className="text-right text-warning">{formatCurrency(month.pending)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={Number(rate) >= 80 ? 'default' : 'secondary'}>
                                {rate}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Student Details Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes Financeiros do Aluno</DialogTitle>
              <DialogDescription>
                Histórico completo de pagamentos
              </DialogDescription>
            </DialogHeader>
            
            {detailsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : studentDetails ? (
              <div className="space-y-6">
                {/* Student Info */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-lg">{studentDetails.profile?.full_name}</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    {studentDetails.profile?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {studentDetails.profile.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {studentDetails.profile?.email}
                    </span>
                  </div>
                  {studentDetails.course && (
                    <p className="mt-2 text-sm">
                      Curso: <strong>{studentDetails.course.name}</strong> - {formatCurrency(studentDetails.coursePrice)}
                    </p>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-success/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Total Pago</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(studentDetails.totalPaid)}</p>
                  </div>
                  <div className="p-4 bg-warning/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Pendente</p>
                    <p className="text-xl font-bold text-warning">{formatCurrency(studentDetails.totalPending)}</p>
                  </div>
                  <div className="p-4 bg-destructive/10 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Restante</p>
                    <p className="text-xl font-bold text-destructive">{formatCurrency(studentDetails.remaining)}</p>
                  </div>
                </div>

                {/* Payment History */}
                <div>
                  <h4 className="font-medium mb-3">Histórico de Pagamentos</h4>
                  {studentDetails.payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento registado</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentDetails.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.description || '-'}</TableCell>
                            <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                            <TableCell>{new Date(payment.due_date).toLocaleDateString('pt-PT')}</TableCell>
                            <TableCell>
                              <Badge variant={payment.status === 'paid' ? 'default' : 'secondary'}>
                                {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Eliminar pagamento?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acção não pode ser revertida. O pagamento de {formatCurrency(Number(payment.amount))} será permanentemente removido do sistema.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deletePayment.mutate(payment.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Aluno não encontrado</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Financials;
