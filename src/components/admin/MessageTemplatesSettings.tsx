import { useState, useEffect } from 'react';
import { Save, Edit2, Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useMessageTemplates, useUpdateMessageTemplates, type MessageTemplate } from '@/hooks/useSchoolSettings';
import { MESSAGE_TEMPLATES } from '@/hooks/useEvolutionApi';

const MessageTemplatesSettings = () => {
  const { data: customTemplates, isLoading } = useMessageTemplates();
  const updateTemplates = useUpdateMessageTemplates();
  
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Merge default templates with custom ones
  useEffect(() => {
    const defaultTemplates = MESSAGE_TEMPLATES.filter(t => t.id !== 'custom').map(t => ({
      id: t.id,
      name: t.name,
      message: t.message,
    }));

    if (customTemplates && customTemplates.length > 0) {
      // Merge: custom templates override defaults
      const merged = defaultTemplates.map(dt => {
        const custom = customTemplates.find(ct => ct.id === dt.id);
        return custom || dt;
      });
      
      // Add any additional custom templates
      const additionalCustom = customTemplates.filter(
        ct => !defaultTemplates.some(dt => dt.id === ct.id)
      );
      
      setTemplates([...merged, ...additionalCustom]);
    } else {
      setTemplates(defaultTemplates);
    }
  }, [customTemplates]);

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate({ ...template });
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingTemplate({
      id: `custom_${Date.now()}`,
      name: '',
      message: '',
    });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTemplate?.name || !editingTemplate?.message) {
      toast.error('Preencha o nome e a mensagem');
      return;
    }

    let updatedTemplates: MessageTemplate[];
    
    if (isCreating) {
      updatedTemplates = [...templates, editingTemplate];
    } else {
      updatedTemplates = templates.map(t => 
        t.id === editingTemplate.id ? editingTemplate : t
      );
    }

    // Only save templates that differ from defaults
    const defaultTemplates = MESSAGE_TEMPLATES.filter(t => t.id !== 'custom');
    const templatesToSave = updatedTemplates.filter(t => {
      const defaultTemplate = defaultTemplates.find(dt => dt.id === t.id);
      if (!defaultTemplate) return true; // Custom template
      return defaultTemplate.message !== t.message || defaultTemplate.name !== t.name;
    });

    await updateTemplates.mutateAsync(templatesToSave);
    setTemplates(updatedTemplates);
    setIsDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleDelete = async (templateId: string) => {
    const defaultTemplate = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    
    if (defaultTemplate) {
      // Reset to default instead of deleting
      const updatedTemplates = templates.map(t => 
        t.id === templateId ? { ...defaultTemplate } : t
      );
      
      const templatesToSave = (customTemplates || []).filter(t => t.id !== templateId);
      await updateTemplates.mutateAsync(templatesToSave);
      setTemplates(updatedTemplates);
      toast.success('Template restaurado para o padrão');
    } else {
      // Delete custom template
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      const templatesToSave = (customTemplates || []).filter(t => t.id !== templateId);
      await updateTemplates.mutateAsync(templatesToSave);
      setTemplates(updatedTemplates);
      toast.success('Template eliminado');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              📝 Templates de Mensagens
            </CardTitle>
            <CardDescription>
              Personalize as mensagens automáticas enviadas aos alunos
            </CardDescription>
          </div>
          <Button onClick={handleCreate} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.map((template) => {
          const isCustomized = customTemplates?.some(ct => ct.id === template.id);
          const isCustomTemplate = !MESSAGE_TEMPLATES.some(mt => mt.id === template.id);
          
          return (
            <div
              key={template.id}
              className="flex items-start justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{template.name}</span>
                  {isCustomized && !isCustomTemplate && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Personalizado
                    </span>
                  )}
                  {isCustomTemplate && (
                    <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded">
                      Criado por si
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                  {template.message.substring(0, 80)}...
                </p>
              </div>
              <div className="flex gap-1 ml-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                {(isCustomized || isCustomTemplate) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-destructive hover:text-destructive"
                    title={isCustomTemplate ? 'Eliminar' : 'Restaurar padrão'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground pt-2">
          Variáveis disponíveis: <code className="bg-muted px-1 rounded">{'{nome}'}</code>,{' '}
          <code className="bg-muted px-1 rounded">{'{tipo}'}</code>,{' '}
          <code className="bg-muted px-1 rounded">{'{data}'}</code>,{' '}
          <code className="bg-muted px-1 rounded">{'{valor}'}</code>
        </p>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Novo Template' : 'Editar Template'}
            </DialogTitle>
            <DialogDescription>
              {isCreating 
                ? 'Crie um novo template de mensagem personalizado'
                : 'Personalize a mensagem deste template'}
            </DialogDescription>
          </DialogHeader>
          
          {editingTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Nome do Template</Label>
                <Input
                  id="template-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    name: e.target.value,
                  })}
                  placeholder="Ex: Lembrete de Aula"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-message">Mensagem</Label>
                <Textarea
                  id="template-message"
                  value={editingTemplate.message}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    message: e.target.value,
                  })}
                  placeholder="Escreva a mensagem aqui..."
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Use as variáveis: {'{nome}'}, {'{tipo}'}, {'{data}'}, {'{valor}'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateTemplates.isPending}
            >
              {updateTemplates.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MessageTemplatesSettings;
