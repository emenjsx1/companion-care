import { useState, useRef } from 'react';
import { Plus, Trash2, Edit, Loader2, Image as ImageIcon, GripVertical, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  useGalleryImages, 
  useCreateGalleryImage, 
  useUpdateGalleryImage, 
  useDeleteGalleryImage,
  uploadGalleryImage,
  type GalleryImage 
} from '@/hooks/useGallery';
import { toast } from 'sonner';

const Gallery = () => {
  const { data: images, isLoading, error } = useGalleryImages();
  const createImage = useCreateGalleryImage();
  const updateImage = useUpdateGalleryImage();
  const deleteImage = useDeleteGalleryImage();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    caption: '',
    alt_text: '',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({ caption: '', alt_text: '', is_active: true });
    setEditingImage(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor seleccione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter menos de 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadGalleryImage(file);
      await createImage.mutateAsync({
        image_url: imageUrl,
        caption: formData.caption || undefined,
        alt_text: formData.alt_text || undefined,
        is_active: formData.is_active,
        sort_order: (images?.length || 0) + 1,
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEditSubmit = async () => {
    if (!editingImage) return;

    await updateImage.mutateAsync({
      id: editingImage.id,
      caption: formData.caption || null,
      alt_text: formData.alt_text || null,
      is_active: formData.is_active,
    });
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleToggleActive = async (image: GalleryImage) => {
    await updateImage.mutateAsync({
      id: image.id,
      is_active: !image.is_active,
    });
  };

  const openEditDialog = (image: GalleryImage) => {
    setEditingImage(image);
    setFormData({
      caption: image.caption || '',
      alt_text: image.alt_text || '',
      is_active: image.is_active,
    });
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Galeria</h1>
            <p className="text-muted-foreground">Gerir imagens da galeria na landing page</p>
          </div>
          <Dialog open={isDialogOpen && !editingImage} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Imagem
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Imagem à Galeria</DialogTitle>
                <DialogDescription>
                  Faça upload de uma nova imagem para a galeria
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="caption">Legenda</Label>
                  <Input
                    id="caption"
                    placeholder="Ex: Aula prática de condução"
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alt">Descrição (acessibilidade)</Label>
                  <Input
                    id="alt"
                    placeholder="Ex: Instrutor e aluno dentro do veículo"
                    value={formData.alt_text}
                    onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Visível na galeria</Label>
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Imagem</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        A fazer upload...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4" />
                        Seleccionar Imagem
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceites: JPG, PNG, WebP. Máximo 5MB.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen && !!editingImage} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Imagem</DialogTitle>
              <DialogDescription>
                Actualizar informações da imagem
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingImage && (
                <div className="rounded-lg overflow-hidden bg-muted aspect-video">
                  <img
                    src={editingImage.image_url}
                    alt={editingImage.alt_text || 'Preview'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-caption">Legenda</Label>
                <Input
                  id="edit-caption"
                  placeholder="Ex: Aula prática de condução"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-alt">Descrição (acessibilidade)</Label>
                <Input
                  id="edit-alt"
                  placeholder="Ex: Instrutor e aluno dentro do veículo"
                  value={formData.alt_text}
                  onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-active">Visível na galeria</Label>
                <Switch
                  id="edit-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleEditSubmit} disabled={updateImage.isPending}>
                {updateImage.isPending ? 'A guardar...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Gallery Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-destructive font-medium mb-2">Erro ao carregar imagens</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Recarregar Página
              </Button>
            </CardContent>
          </Card>
        ) : !images || images.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">Nenhuma imagem na galeria</p>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Clique em "Adicionar Imagem" para começar a adicionar imagens à galeria
              </p>
              <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-xs text-muted-foreground text-left">
                  <strong>Nota importante:</strong> As 6 imagens que aparecem na landing page são imagens de exemplo (fallback). 
                  Quando você adicionar imagens aqui e marcá-las como "Visível na galeria", elas substituirão automaticamente 
                  as imagens de exemplo na landing page.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images?.map((image) => (
              <Card key={image.id} className={`overflow-hidden ${!image.is_active ? 'opacity-60' : ''}`}>
                <div className="aspect-[4/3] relative group">
                  <img
                    src={image.image_url}
                    alt={image.alt_text || image.caption || 'Galeria'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => openEditDialog(image)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleToggleActive(image)}
                    >
                      {image.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar imagem?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acção não pode ser revertida. A imagem será permanentemente removida.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteImage.mutate(image.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">
                    {image.caption || 'Sem legenda'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {image.is_active ? 'Visível' : 'Oculta'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Gallery;
