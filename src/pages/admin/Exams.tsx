import { useState } from 'react';
import { Plus, Search, Filter, CheckCircle, XCircle, Clock, MoreHorizontal, Edit, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AdminLayout from '@/components/admin/AdminLayout';
import { useExams, useCreateExam, useUpdateExam, useUpdateExamResult } from '@/hooks/useExams';
import { useStudents } from '@/hooks/useStudents';

const statusColors: Record<string, string> = {
  scheduled: 'bg-primary/10 text-primary border-primary/20',
  passed: 'bg-success/10 text-success border-success/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado',
  passed: 'Aprovado',
  failed: 'Reprovado',
  cancelled: 'Cancelado',
};

const typeLabels: Record<string, string> = {
  codigo: 'Código',
  conducao: 'Condução',
};

const Exams = () => {
  const { data: exams, isLoading: examsLoading } = useExams();
  const { data: students } = useStudents();
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const updateResult = useUpdateExamResult();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{ status: 'passed' | 'failed'; score?: number }>({ status: 'passed' });
  
  const [formData, setFormData] = useState({
    student_id: '',
    exam_type: '',
    exam_date: '',
    notes: '',
  });

  const filteredExams = exams?.filter(exam => {
    const matchesSearch = exam.student_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
    const matchesType = typeFilter === 'all' || exam.exam_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createExam.mutateAsync({
      student_id: formData.student_id,
      exam_type: formData.exam_type,
      exam_date: new Date(formData.exam_date).toISOString(),
      notes: formData.notes || undefined,
    });

    setIsDialogOpen(false);
    setFormData({
      student_id: '',
      exam_type: '',
      exam_date: '',
      notes: '',
    });
  };

  const openResultDialog = (examId: string) => {
    setSelectedExam(examId);
    setResultData({ status: 'passed' });
    setIsResultDialogOpen(true);
  };

  const handleResultSubmit = () => {
    if (selectedExam) {
      updateResult.mutate({
        id: selectedExam,
        status: resultData.status,
        score: resultData.score,
      });
      setIsResultDialogOpen(false);
      setSelectedExam(null);
    }
  };

  const handleStatusChange = (examId: string, newStatus: 'scheduled' | 'cancelled') => {
    updateExam.mutate({ id: examId, status: newStatus });
  };

  const renderResult = (status: string, score: number | null) => {
    if (status === 'passed') {
      return (
        <div className="flex items-center gap-1 text-success">
          <CheckCircle className="h-4 w-4" />
          Aprovado {score !== null && `(${score})`}
        </div>
      );
    }
    if (status === 'failed') {
      return (
        <div className="flex items-center gap-1 text-destructive">
          <XCircle className="h-4 w-4" />
          Reprovado {score !== null && `(${score})`}
        </div>
      );
    }
    return '-';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pedidos de Exame</h1>
            <p className="text-muted-foreground">Gerir exames de código e condução</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registar Pedido de Exame</DialogTitle>
                <DialogDescription>
                  Criar novo pedido de exame
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Aluno *</Label>
                  <Select
                    value={formData.student_id}
                    onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.filter(s => s.status === 'active' || s.status === 'em_formacao').map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.profile?.full_name || student.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Exame *</Label>
                    <Select
                      value={formData.exam_type}
                      onValueChange={(value) => setFormData({ ...formData, exam_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="codigo">Código</SelectItem>
                        <SelectItem value="conducao">Condução</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Data e Hora *</Label>
                    <Input 
                      id="date" 
                      type="datetime-local" 
                      value={formData.exam_date}
                      onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Notas adicionais..." 
                    rows={3} 
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createExam.isPending}>
                    {createExam.isPending ? 'A guardar...' : 'Guardar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Agendados</div>
                  <div className="text-2xl font-bold">{exams?.filter(e => e.status === 'scheduled').length || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Aprovados</div>
                  <div className="text-2xl font-bold">{exams?.filter(e => e.status === 'passed').length || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Reprovados</div>
                  <div className="text-2xl font-bold">{exams?.filter(e => e.status === 'failed').length || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Taxa Aprovação</div>
                  <div className="text-2xl font-bold">
                    {exams && exams.filter(e => e.status === 'passed' || e.status === 'failed').length > 0
                      ? Math.round((exams.filter(e => e.status === 'passed').length / exams.filter(e => e.status === 'passed' || e.status === 'failed').length) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="codigo">Código</SelectItem>
                  <SelectItem value="conducao">Condução</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="passed">Aprovado</SelectItem>
                  <SelectItem value="failed">Reprovado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Exams Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Exames</CardTitle>
            <CardDescription>{filteredExams.length} exame(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {examsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden sm:table-cell">Data</TableHead>
                      <TableHead className="hidden md:table-cell">Resultado</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExams.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Nenhum exame encontrado
                        </TableCell>
                      </TableRow>
                    ) : filteredExams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">
                          {exam.student_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {typeLabels[exam.exam_type] || exam.exam_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[exam.status]}>
                            {statusLabels[exam.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {new Date(exam.exam_date).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {renderResult(exam.status, exam.score)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {exam.status === 'scheduled' && (
                                <>
                                  <DropdownMenuItem onClick={() => openResultDialog(exam.id)}>
                                    Registar Resultado
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleStatusChange(exam.id, 'cancelled')}
                                  >
                                    Cancelar Exame
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
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
      </div>

      {/* Result Dialog */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar Resultado do Exame</DialogTitle>
            <DialogDescription>
              Indique o resultado do exame
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resultado *</Label>
              <Select
                value={resultData.status}
                onValueChange={(value) => setResultData({ ...resultData, status: value as 'passed' | 'failed' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">Aprovado</SelectItem>
                  <SelectItem value="failed">Reprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">Pontuação (opcional)</Label>
              <Input 
                id="score" 
                type="number" 
                placeholder="Ex: 85"
                min="0"
                max="100"
                value={resultData.score || ''}
                onChange={(e) => setResultData({ ...resultData, score: e.target.value ? parseInt(e.target.value) : undefined })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResultSubmit} disabled={updateResult.isPending}>
              {updateResult.isPending ? 'A guardar...' : 'Guardar Resultado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Exams;
