import { useState } from 'react';
import { Plus, Edit, Trash2, MoreHorizontal, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AdminLayout from '@/components/admin/AdminLayout';
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse, type Course, type CourseInsert, type CourseCategory } from '@/hooks/useCourses';
import { useStudents } from '@/hooks/useStudents';
import { useSchoolSettings } from '@/hooks/useSchoolSettings';
import { formatCurrency } from '@/lib/currency';

const categoryLabels: Record<string, string> = {
  A: 'Mota',
  A1: 'Mota (até 125cc)',
  A2: 'Mota (até 35kW)',
  B: 'Ligeiro',
  C: 'Carga Pesada Profissional',
  C1: 'Pesados até 7.500kg',
  CE: 'C + Reboque',
  D: 'Pesados Passageiros',
  E: 'Reboques',
  ACC: 'Ações de Formação',
};

const Courses = () => {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: students } = useStudents();
  const { data: settings, updateSetting } = useSchoolSettings();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '' as CourseCategory | '',
    price: '',
    duration_hours: '',
    description: '',
    is_active: true,
  });

  // Taxa de inscrição from settings
  const inscriptionFee = settings?.inscription_fee || 300;
  const [inscriptionFeeInput, setInscriptionFeeInput] = useState(String(inscriptionFee));

  const getStudentCount = (courseId: string) => {
    return students?.filter(s => s.course_id === courseId).length || 0;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      duration_hours: '',
      description: '',
      is_active: true,
    });
    setEditingCourse(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      category: course.category,
      price: String(course.price),
      duration_hours: String(course.duration_hours),
      description: course.description || '',
      is_active: course.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) return;

    const courseData = {
      name: formData.name,
      category: formData.category as CourseCategory,
      price: parseFloat(formData.price),
      duration_hours: parseInt(formData.duration_hours),
      description: formData.description || undefined,
      is_active: formData.is_active,
    };

    if (editingCourse) {
      await updateCourse.mutateAsync({
        id: editingCourse.id,
        ...courseData,
      });
    } else {
      await createCourse.mutateAsync(courseData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleSaveInscriptionFee = async () => {
    const fee = parseFloat(inscriptionFeeInput);
    if (!isNaN(fee) && fee >= 0) {
      await updateSetting.mutateAsync({
        key: 'inscription_fee',
        value: fee,
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Cursos</h1>
            <p className="text-muted-foreground">Configurar cursos disponíveis</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                Novo Curso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCourse ? 'Editar Curso' : 'Adicionar Curso'}</DialogTitle>
                <DialogDescription>
                  {editingCourse ? 'Modificar os dados do curso' : 'Criar um novo curso'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Curso *</Label>
                  <Input 
                    id="name" 
                    placeholder="Ex: Carta de Condução - Categoria B" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as CourseCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{key} - {label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (MT) *</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      placeholder="0.00" 
                      min="0" 
                      step="0.01" 
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (horas) *</Label>
                  <Input 
                    id="duration" 
                    type="number"
                    placeholder="Ex: 30" 
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Descrição do curso..." 
                    rows={3} 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Curso Ativo</Label>
                  <Switch 
                    id="active" 
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCourse.isPending || updateCourse.isPending}>
                    {(createCourse.isPending || updateCourse.isPending) ? 'A guardar...' : 'Guardar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Taxa de Inscrição Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Taxa de Inscrição</CardTitle>
            <CardDescription>Valor cobrado na matrícula de todos os cursos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    value={inscriptionFeeInput}
                    onChange={(e) => setInscriptionFeeInput(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-32"
                  />
                  <span className="text-muted-foreground">MT</span>
                </div>
              </div>
              <Button 
                onClick={handleSaveInscriptionFee}
                disabled={updateSetting.isPending}
                size="sm"
              >
                {updateSetting.isPending ? 'A guardar...' : 'Guardar'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Esta taxa será exibida na página inicial junto aos preços dos cursos.
            </p>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {coursesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : courses?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum curso encontrado. Crie o primeiro curso!
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses?.map((course) => {
              const studentCount = getStudentCount(course.id);
              return (
                <Card key={course.id} className={!course.is_active ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="text-primary border-primary">
                        {course.category} - {categoryLabels[course.category] || course.category}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(course)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteCourse.mutate(course.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg mt-2">{course.name}</CardTitle>
                    <CardDescription>{course.description || 'Sem descrição'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Preço</span>
                      <span className="font-semibold text-foreground">{formatCurrency(Number(course.price))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duração</span>
                      <span className="text-foreground">{course.duration_hours}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Alunos Inscritos</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{studentCount}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Estado</span>
                      <Badge variant={course.is_active ? 'default' : 'secondary'}>
                        {course.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Courses;
