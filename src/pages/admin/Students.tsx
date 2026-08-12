import { useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, MoreHorizontal, Phone, Mail, Loader2, History, X, CreditCard, FileCheck, MessageCircle, FileDown, Send, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/components/admin/AdminLayout';
import { useStudents, useCreateStudent, useUpdateStudent, useUpdateStudentStatus, useDeleteStudent, useStudentHistory, findDuplicateStudent, type Student } from '@/hooks/useStudents';
import { toast } from 'sonner';
import { useCourses } from '@/hooks/useCourses';
import { useSendWhatsAppMessage, MESSAGE_TEMPLATES, replaceTemplateVariables } from '@/hooks/useEvolutionApi';
import { formatCurrency } from '@/lib/currency';
import { exportStudentsToPDF } from '@/lib/exportPdf';
import { DuplicateStudentsAlert } from '@/components/admin/DuplicateStudentsAlert';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  em_formacao: 'bg-primary/10 text-primary border-primary/20',
  concluido: 'bg-muted text-muted-foreground border-border',
  desistente: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels: Record<string, string> = {
  active: 'Activo',
  em_formacao: 'Em Formação',
  concluido: 'Concluído',
  desistente: 'Desistente',
};

const today = () => new Date().toISOString().split('T')[0];

const Students = () => {
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: courses } = useCourses();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const updateStatus = useUpdateStudentStatus();
  const deleteStudent = useDeleteStudent();
  const sendWhatsApp = useSendWhatsAppMessage();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Edit student state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // WhatsApp quick send state
  const [whatsAppStudent, setWhatsAppStudent] = useState<Student | null>(null);
  const [whatsAppTemplate, setWhatsAppTemplate] = useState<string>('');
  const [whatsAppMessage, setWhatsAppMessage] = useState<string>('');
  
  const { data: studentHistory, isLoading: historyLoading } = useStudentHistory(selectedStudent?.id || null);

  // Form without password - CRM Pure model
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    birth_date: '',
    course_id: '',
    address: '',
    document_number: '',
    enrollment_date: today(),
  });

  // Edit form data
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    phone: '',
    birth_date: '',
    course_id: '',
    address: '',
    document_number: '',
    license_number: '',
    status: '',
    enrollment_date: '',
  });

  const filteredStudents = students?.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      student.profile?.full_name?.toLowerCase().includes(searchLower) ||
      student.profile?.email?.toLowerCase().includes(searchLower) ||
      student.profile?.phone?.includes(searchTerm) ||
      student.document_number?.includes(searchTerm) ||
      student.license_number?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesCourse = courseFilter === 'all' || student.course_id === courseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  }) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicated students before submitting
    const duplicate = await findDuplicateStudent({
      phone: formData.phone || undefined,
      document_number: formData.document_number || undefined,
      full_name: formData.full_name || undefined,
    });
    if (duplicate) {
      toast.error(duplicate, { description: 'Registo cancelado para evitar duplicados.' });
      return;
    }

    await createStudent.mutateAsync({
      full_name: formData.full_name,
      phone: formData.phone || undefined,
      course_id: formData.course_id || undefined,
      birth_date: formData.birth_date || undefined,
      address: formData.address || undefined,
      document_number: formData.document_number || undefined,
      enrollment_date: formData.enrollment_date || undefined,
    });

    setIsDialogOpen(false);
    setFormData({
      full_name: '',
      phone: '',
      birth_date: '',
      course_id: '',
      address: '',
      document_number: '',
      enrollment_date: today(),
    });
  };

  const handleStatusChange = (studentId: string, newStatus: string) => {
    updateStatus.mutate({ id: studentId, status: newStatus });
  };

  const openHistory = (student: Student) => {
    setSelectedStudent(student);
    setIsHistoryOpen(true);
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setEditFormData({
      full_name: student.profile?.full_name || '',
      phone: student.profile?.phone || '',
      birth_date: student.birth_date || '',
      course_id: student.course_id || '',
      address: student.address || '',
      document_number: student.document_number || '',
      license_number: student.license_number || '',
      status: student.status,
      enrollment_date: student.enrollment_date ? student.enrollment_date.split('T')[0] : '',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    await updateStudent.mutateAsync({
      id: editingStudent.id,
      course_id: editFormData.course_id || null,
      birth_date: editFormData.birth_date || null,
      address: editFormData.address || null,
      document_number: editFormData.document_number || null,
      license_number: editFormData.license_number || null,
      status: editFormData.status,
      enrollment_date: editFormData.enrollment_date || undefined,
      profileUpdate: {
        full_name: editFormData.full_name,
        phone: editFormData.phone || undefined,
      },
    });

    setIsEditDialogOpen(false);
    setEditingStudent(null);
  };

  const handleDeleteStudent = (student: Student) => {
    deleteStudent.mutate({ id: student.id, user_id: student.user_id });
  };

  const openWhatsAppDialog = (student: Student) => {
    setWhatsAppStudent(student);
    setWhatsAppTemplate('');
    setWhatsAppMessage('');
  };

  const handleWhatsAppTemplateChange = (templateId: string) => {
    setWhatsAppTemplate(templateId);
    const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (template && template.id !== 'custom') {
      setWhatsAppMessage(replaceTemplateVariables(template.message, {
        nome: whatsAppStudent?.profile?.full_name || 'Aluno',
      }));
    } else {
      setWhatsAppMessage('');
    }
  };

  const handleSendWhatsApp = () => {
    if (!whatsAppStudent?.profile?.phone || !whatsAppMessage) return;
    
    sendWhatsApp.mutate({
      phone: whatsAppStudent.profile.phone,
      message: whatsAppMessage,
    }, {
      onSuccess: () => {
        setWhatsAppStudent(null);
        setWhatsAppMessage('');
        setWhatsAppTemplate('');
      }
    });
  };

  const handleExportPDF = () => {
    if (students && students.length > 0) {
      const exportData = students.map(s => ({
        full_name: s.profile?.full_name || '-',
        email: s.profile?.email || '-',
        phone: s.profile?.phone || undefined,
        course_name: s.course?.name,
        status: s.status,
        enrollment_date: s.enrollment_date,
        document_number: s.document_number || undefined,
      }));
      exportStudentsToPDF(exportData, 'Lista de Alunos');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Alunos</h1>
            <p className="text-muted-foreground">Gerir alunos e informações</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPDF} disabled={!students?.length}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Aluno
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Aluno</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do novo aluno
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      placeholder="Nome do aluno"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="document_number">Número de Documento (BI)</Label>
                      <Input 
                        id="document_number" 
                        placeholder="Ex: 123456789A" 
                        value={formData.document_number}
                        onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="+258 84 XXX XXXX" 
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Data de Nascimento</Label>
                      <Input 
                        id="birth_date" 
                        type="date" 
                        value={formData.birth_date}
                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course">Curso</Label>
                      <Select 
                        value={formData.course_id}
                        onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses?.filter(c => c.is_active).map(course => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Morada (distrito)</Label>
                    <Input
                      id="address"
                      placeholder="Distrito onde o aluno vive"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="enrollment_date">Data de Inscrição *</Label>
                      <Input
                        id="enrollment_date"
                        type="date"
                        value={formData.enrollment_date}
                        onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Data real da inscrição (pode ser diferente da data de hoje).
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createStudent.isPending}>
                      {createStudent.isPending ? 'A guardar...' : 'Guardar Aluno'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome, email, telefone, BI..."
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
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="em_formacao">Em Formação</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="desistente">Desistente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Cursos</SelectItem>
                  {courses?.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        {students && students.length > 0 && <DuplicateStudentsAlert students={students} />}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Alunos</CardTitle>
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
                      <TableHead className="hidden md:table-cell">Contacto</TableHead>
                      <TableHead className="hidden lg:table-cell">Curso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden sm:table-cell">Data Inscrição</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum aluno encontrado
                        </TableCell>
                      </TableRow>
                    ) : filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.profile?.full_name || '-'}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.document_number || student.license_number || student.profile?.email || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            {student.profile?.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {student.profile.phone}
                              </div>
                            )}
                            {student.profile?.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {student.profile.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {student.course ? (
                            <Badge variant="outline">{student.course.category}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[student.status] || statusColors.active}>
                            {statusLabels[student.status] || student.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {new Date(student.enrollment_date).toLocaleDateString('pt-MZ')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openHistory(student)}>
                                <History className="h-4 w-4 mr-2" />
                                Ver Histórico
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>
                                <MessageCircle className="h-4 w-4 mr-2" />
                                QR Code WhatsApp
                              </DropdownMenuItem>
                              {student.profile?.phone && (
                                <DropdownMenuItem onClick={() => openWhatsAppDialog(student)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Enviar WhatsApp
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => openEditDialog(student)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(student.id, 'active')}
                                disabled={student.status === 'active'}
                              >
                                Marcar como Activo
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(student.id, 'em_formacao')}
                                disabled={student.status === 'em_formacao'}
                              >
                                Marcar como Em Formação
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(student.id, 'concluido')}
                                disabled={student.status === 'concluido'}
                              >
                                Marcar como Concluído
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(student.id, 'desistente')}
                                disabled={student.status === 'desistente'}
                                className="text-destructive"
                              >
                                Marcar como Desistente
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar Aluno
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Eliminar aluno?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acção não pode ser revertida. O aluno "{student.profile?.full_name}" será permanentemente removido do sistema.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteStudent(student)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student History Sheet */}
        <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Histórico do Aluno</SheetTitle>
              <SheetDescription>
                {selectedStudent?.profile?.full_name}
              </SheetDescription>
            </SheetHeader>
            
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : studentHistory ? (
              <div className="mt-6 space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-success/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Pago</p>
                    <p className="text-xl font-bold text-success">
                      {formatCurrency(studentHistory.totalPaid)}
                    </p>
                  </div>
                  <div className="p-4 bg-warning/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Dívida</p>
                    <p className="text-xl font-bold text-warning">
                      {formatCurrency(studentHistory.totalDebt)}
                    </p>
                  </div>
                </div>

                <Tabs defaultValue="payments">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="payments" className="gap-2">
                      <CreditCard className="h-4 w-4" />
                      Pagamentos
                    </TabsTrigger>
                    <TabsTrigger value="exams" className="gap-2">
                      <FileCheck className="h-4 w-4" />
                      Exames
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="payments" className="space-y-3 mt-4">
                    {studentHistory.payments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum pagamento registado
                      </p>
                    ) : studentHistory.payments.map(payment => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.description || 'Pagamento'} - {new Date(payment.due_date).toLocaleDateString('pt-MZ')}
                          </p>
                        </div>
                        <Badge variant="outline" className={statusColors[payment.status]}>
                          {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="exams" className="space-y-3 mt-4">
                    {studentHistory.exams.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum exame registado
                      </p>
                    ) : studentHistory.exams.map(exam => (
                      <div key={exam.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {exam.exam_type === 'codigo' ? 'Exame de Código' : 'Exame de Condução'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(exam.exam_date).toLocaleDateString('pt-MZ')}
                            {exam.score !== null && ` - Nota: ${exam.score}`}
                          </p>
                        </div>
                        <Badge variant="outline" className={
                          exam.status === 'passed' ? 'bg-success/10 text-success' :
                          exam.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                          'bg-primary/10 text-primary'
                        }>
                          {exam.status === 'passed' ? 'Aprovado' :
                           exam.status === 'failed' ? 'Reprovado' :
                           exam.status === 'scheduled' ? 'Agendado' : exam.status}
                        </Badge>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            ) : null}
          </SheetContent>
        </Sheet>


        {/* Edit Student Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Aluno</DialogTitle>
              <DialogDescription>
                Actualizar dados de {editingStudent?.profile?.full_name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_full_name">Nome Completo *</Label>
                  <Input 
                    id="edit_full_name" 
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_phone">Telefone</Label>
                  <Input 
                    id="edit_phone" 
                    type="tel" 
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_document_number">Número de Documento (BI)</Label>
                  <Input 
                    id="edit_document_number" 
                    value={editFormData.document_number}
                    onChange={(e) => setEditFormData({ ...editFormData, document_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_license_number">Nº Carta de Condução</Label>
                  <Input 
                    id="edit_license_number" 
                    value={editFormData.license_number}
                    onChange={(e) => setEditFormData({ ...editFormData, license_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_birth_date">Data de Nascimento</Label>
                  <Input 
                    id="edit_birth_date" 
                    type="date" 
                    value={editFormData.birth_date}
                    onChange={(e) => setEditFormData({ ...editFormData, birth_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_enrollment_date">Data de Inscrição</Label>
                  <Input
                    id="edit_enrollment_date"
                    type="date"
                    value={editFormData.enrollment_date}
                    onChange={(e) => setEditFormData({ ...editFormData, enrollment_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_course">Curso</Label>
                  <Select 
                    value={editFormData.course_id}
                    onValueChange={(value) => setEditFormData({ ...editFormData, course_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.filter(c => c.is_active).map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_address">Morada (distrito)</Label>
                <Input
                  id="edit_address"
                  placeholder="Distrito onde o aluno vive"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Estado</Label>
                <Select 
                  value={editFormData.status}
                  onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="em_formacao">Em Formação</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="desistente">Desistente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateStudent.isPending}>
                  {updateStudent.isPending ? 'A guardar...' : 'Guardar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* WhatsApp Quick Send Dialog */}
        <Dialog open={!!whatsAppStudent} onOpenChange={(open) => !open && setWhatsAppStudent(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Enviar WhatsApp</DialogTitle>
              <DialogDescription>
                Enviar mensagem para {whatsAppStudent?.profile?.full_name}
                {whatsAppStudent?.profile?.phone && ` (${whatsAppStudent.profile.phone})`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Template de Mensagem</Label>
                <Select value={whatsAppTemplate} onValueChange={handleWhatsAppTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_TEMPLATES.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Escreva a sua mensagem..."
                  value={whatsAppMessage}
                  onChange={(e) => setWhatsAppMessage(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{nome}'} para inserir o nome do aluno automaticamente
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWhatsAppStudent(null)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSendWhatsApp}
                disabled={!whatsAppMessage || sendWhatsApp.isPending}
                className="gap-2"
              >
                {sendWhatsApp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Students;
