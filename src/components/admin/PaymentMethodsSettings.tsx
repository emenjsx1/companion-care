import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, GripVertical, Power } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  useTogglePaymentMethod,
  PaymentMethod,
} from '@/hooks/usePaymentMethods';

const PaymentMethodsSettings = () => {
  const { data: methods, isLoading } = usePaymentMethods();
  const createMethod = useCreatePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const toggleMethod = useTogglePaymentMethod();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      setFormData({ name: method.name, code: method.code });
    } else {
      setEditingMethod(null);
      setFormData({ name: '', code: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMethod) {
      await updateMethod.mutateAsync({
        id: editingMethod.id,
        name: formData.name,
        code: formData.code,
      });
    } else {
      await createMethod.mutateAsync({
        name: formData.name,
        code: formData.code.toLowerCase().replace(/\s+/g, '_'),
        sort_order: (methods?.length || 0) + 1,
      });
    }
    
    setIsDialogOpen(false);
    setFormData({ name: '', code: '' });
    setEditingMethod(null);
  };

  const handleDelete = async (id: string) => {
    await deleteMethod.mutateAsync(id);
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    await toggleMethod.mutateAsync({ id, is_active: !currentState });
  };

  const generateCode = (name: string) => {
    return name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Métodos de Pagamento</CardTitle>
            <CardDescription>
              Configure os métodos de pagamento disponíveis no sistema
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMethod ? 'Editar Método' : 'Novo Método de Pagamento'}
                </DialogTitle>
                <DialogDescription>
                  {editingMethod 
                    ? 'Atualize as informações do método de pagamento'
                    : 'Adicione um novo método de pagamento ao sistema'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Ex: M-Pesa"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        name: e.target.value,
                        code: editingMethod ? formData.code : generateCode(e.target.value),
                      });
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    placeholder="Ex: mpesa"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    disabled={!!editingMethod}
                  />
                  <p className="text-xs text-muted-foreground">
                    Código único para identificação interna
                  </p>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMethod.isPending || updateMethod.isPending}
                  >
                    {(createMethod.isPending || updateMethod.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingMethod ? 'Guardar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {methods && methods.length > 0 ? (
          <div className="space-y-2">
            {methods.map((method) => (
              <div
                key={method.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  method.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div>
                    <p className="font-medium text-sm">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={method.is_active ? 'default' : 'secondary'}>
                    {method.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggle(method.id, method.is_active)}
                    disabled={toggleMethod.isPending}
                  >
                    <Power className={`h-4 w-4 ${method.is_active ? 'text-success' : 'text-muted-foreground'}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(method)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Método?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem a certeza que deseja eliminar "{method.name}"? Esta acção não pode ser revertida.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(method.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum método de pagamento configurado</p>
            <p className="text-sm">Clique em "Adicionar" para criar o primeiro</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodsSettings;
