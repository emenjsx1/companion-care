import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Loader2, FileDown, TrendingUp, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AdminLayout from '@/components/admin/AdminLayout';
import { usePayments, useCreatePayment, useDeletePayment, useUpdatePayment, usePaymentReport } from '@/hooks/usePayments';
import { useStudents } from '@/hooks/useStudents';
import { useCourses } from '@/hooks/useCourses';
import { useStudentFinancialSummary } from '@/hooks/useStudentFinancialSummary';
import { formatCurrency, PAYMENT_METHODS, PAYMENT_TYPES } from '@/lib/currency';
import { exportPaymentsToPDF } from '@/lib/exportPdf';

const statusColors: Record<string, string> = {
  paid: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  refunded: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
};

const today = () => new Date().toISOString().split('T')[0];

// A payment record is "incomplete" when the money was not (fully) registered yet
const isIncompletePayment = (p: { status: string; amount: number | string; payment_date: string | null }) =>
  p.status === 'pending' || Number(p.amount) <= 0 || !p.payment_date;

const Payments = () => {
  const [dateFilter, setDateFilter] = useState<{ startDate?: string; endDate?: string }>({});
  const { data: payments, isLoading: paymentsLoading } = usePayments(dateFilter);
  const { data: students } = useStudents();
  const { data: courses } = useCourses();
  const { data: report, isLoading: reportLoading } = usePaymentReport();
  const createPayment = useCreatePayment();
  const deletePayment = useDeletePayment();
  const updatePayment = useUpdatePayment();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_date: today(),
    payment_method: '',
    status: 'pending' as 'pending' | 'paid',
    description: '',
  });

  // Get financial summary for selected student
  const { data: studentSummary } = useStudentFinancialSummary(selectedStudentId || null);

  const filteredPayments = payments?.filter(payment => {
    const matchesSearch = payment.student_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const totalPaid = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  
  // Calculate real pending: sum of all course prices - sum of all paid payments
  const calculateRealPending = () => {
    if (!students || !payments || !courses) return 0;
    
    let totalCourseValue = 0;
    let totalPaidAmount = 0;
    
    students.forEach(student => {
      // Find course price from courses data
      const course = courses.find(c => c.id === student.course_id);
      const coursePrice = course?.price || 0;
      totalCourseValue += Number(coursePrice);
      
      // Sum paid payments for this student
      const studentPayments = payments.filter(p => p.student_id === student.id && p.status === 'paid');
      const paidAmount = studentPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      totalPaidAmount += paidAmount;
    });
    
    return Math.max(0, totalCourseValue - totalPaidAmount);
  };
  
  const totalPending = calculateRealPending();

  // When student is selected, update the form
  useEffect(() => {
    if (selectedStudentId) {
      setFormData(prev => ({ ...prev, student_id: selectedStudentId }));
    }
  }, [selectedStudentId]);

  // Handle student selection in form
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    setFormData(prev => ({ ...prev, student_id: studentId }));
  };

  // Suggest payment amount based on remaining balance
  const suggestNextPaymentAmount = () => {
    if (studentSummary && studentSummary.remainingBalance > 0) {
      // Suggest dividing remaining into installments (max 4)
      const remainingPayments = Math.max(1, 4 - studentSummary.paymentCount);
      const suggested = Math.ceil(studentSummary.remainingBalance / remainingPayments);
      setFormData(prev => ({ ...prev, amount: suggested.toString() }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createPayment.mutateAsync({
      payment: {
        student_id: formData.student_id,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date || undefined,
        payment_method: formData.payment_method || undefined,
        status: formData.status,
        description: formData.description || undefined,
      },
    });

    setIsDialogOpen(false);
    setSelectedStudentId('');
    setFormData({
      student_id: '',
      amount: '',
      payment_date: today(),
      payment_method: '',
      status: 'pending',
      description: '',
    });
  };

  const handleMarkAsPaid = (paymentId: string) => {
    updatePayment.mutate({
      id: paymentId,
      status: 'paid',
      payment_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleExportPDF = () => {
    if (payments && payments.length > 0) {
      exportPaymentsToPDF(payments, 'Lista de Pagamentos');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão Financeira</h1>
            <p className="text-muted-foreground">Controlo de pagamentos e relatórios</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleExportPDF} disabled={!payments?.length}>
              <FileDown className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Registar Pagamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registar Pagamento</DialogTitle>
                  <DialogDescription>
                    Registar um novo pagamento
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="student">Aluno *</Label>
                    <Select
                      value={formData.student_id}
                      onValueChange={handleStudentSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {students?.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.profile?.full_name || student.id}
                            {student.course && ` - ${student.course.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Financial Summary for Selected Student */}
                  {studentSummary && (
                    <Alert className="bg-muted/50">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Curso:</span>{' '}
                            <span className="font-medium">{studentSummary.courseName || 'Não definido'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Preço:</span>{' '}
                            <span className="font-medium">{formatCurrency(studentSummary.coursePrice)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Pago:</span>{' '}
                            <span className="font-medium text-success">{formatCurrency(studentSummary.totalPaid)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Restante:</span>{' '}
                            <span className="font-medium text-warning">{formatCurrency(studentSummary.remainingBalance)}</span>
                          </div>
                        </div>
                        {studentSummary.remainingBalance > 0 && (
                          <Button 
                            type="button" 
                            variant="link" 
                            className="p-0 h-auto mt-2 text-xs"
                            onClick={suggestNextPaymentAmount}
                          >
                            Sugerir valor da próxima prestação
                          </Button>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Valor (MT) *</Label>
                      <Input 
                        id="amount" 
                        type="number" 
                        placeholder="0.00" 
                        min="0" 
                        step="0.01" 
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_date">Data do Pagamento *</Label>
                      <Input 
                        id="payment_date" 
                        type="date" 
                        value={formData.payment_date}
                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Data real do pagamento — altere se o lançamento for feito noutro dia.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="payment_method">Método de Pagamento</Label>
                      <Select
                        value={formData.payment_method}
                        onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map(method => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Estado *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value as 'pending' | 'paid' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Tipo de Pagamento</Label>
                    <Select
                      value={formData.description}
                      onValueChange={(value) => setFormData({ ...formData, description: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.label}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createPayment.isPending}>
                      {createPayment.isPending ? 'A guardar...' : 'Guardar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Pago</div>
                  <div className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Pendente</div>
                  <div className="text-2xl font-bold text-warning">{formatCurrency(totalPending)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list">Lista de Pagamentos</TabsTrigger>
            <TabsTrigger value="report">Relatório Anual</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por aluno..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    type="date" 
                    className="w-full sm:w-40"
                    placeholder="Data início"
                    onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                  />
                  <Input 
                    type="date" 
                    className="w-full sm:w-40"
                    placeholder="Data fim"
                    onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2">
                  <span>{filteredPayments.length} pagamento(s)</span>
                  {filteredPayments.some(isIncompletePayment) && (
                    <span className="inline-flex items-center gap-1 text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {filteredPayments.filter(isIncompletePayment).length} por completar (a vermelho)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead className="hidden sm:table-cell">Data Pagamento</TableHead>
                          <TableHead className="hidden md:table-cell">Método</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              Nenhum pagamento encontrado
                            </TableCell>
                          </TableRow>
                        ) : filteredPayments.map((payment) => {
                          const incomplete = isIncompletePayment(payment);
                          return (
                            <TableRow
                              key={payment.id}
                              className={incomplete ? 'bg-destructive/5 hover:bg-destructive/10 border-l-4 border-l-destructive' : undefined}
                            >
                              <TableCell className={incomplete ? 'font-medium text-destructive' : 'font-medium'}>
                                <span className="inline-flex items-center gap-2">
                                  {incomplete && <AlertCircle className="h-4 w-4 shrink-0" />}
                                  {payment.student_name}
                                </span>
                              </TableCell>
                              <TableCell className={incomplete ? 'font-semibold text-destructive' : 'font-semibold'}>
                                {Number(payment.amount) > 0 ? formatCurrency(Number(payment.amount)) : 'Por preencher'}
                              </TableCell>
                              <TableCell className={`hidden sm:table-cell ${!payment.payment_date ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('pt-MZ') : 'Sem data'}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {PAYMENT_METHODS.find(m => m.value === payment.payment_method)?.label || payment.payment_method || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={incomplete ? 'bg-destructive/10 text-destructive border-destructive/30' : statusColors[payment.status]}
                                >
                                  {incomplete ? 'Por completar' : statusLabels[payment.status]}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-muted-foreground">
                                {payment.description || '-'}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {payment.status === 'pending' && (
                                      <DropdownMenuItem onClick={() => handleMarkAsPaid(payment.id)}>
                                        Marcar como Pago
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={() => deletePayment.mutate(payment.id)}
                                      className="text-destructive"
                                    >
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Relatório Anual {new Date().getFullYear()}</CardTitle>
                <CardDescription>Receitas e valores pendentes por mês</CardDescription>
              </CardHeader>
              <CardContent>
                {reportLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-success/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Receita</p>
                        <p className="text-2xl font-bold text-success">
                          {formatCurrency(report?.totalRevenue || 0)}
                        </p>
                      </div>
                      <div className="p-4 bg-warning/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Pendente</p>
                        <p className="text-2xl font-bold text-warning">
                          {formatCurrency(report?.totalPending || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={report?.byMonth || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                            formatter={(value) => formatCurrency(Number(value))}
                          />
                          <Bar dataKey="revenue" name="Receita" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="pending" name="Pendente" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Payments;
