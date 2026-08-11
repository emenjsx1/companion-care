import { useState } from 'react';
import { Save, Building2, Users, Key, Loader2, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout';
import DailyReportSettingsComponent from '@/components/admin/DailyReportSettings';
import MessageTemplatesSettings from '@/components/admin/MessageTemplatesSettings';
import WhatsAppConnection from '@/components/admin/WhatsAppConnection';
import PaymentMethodsSettings from '@/components/admin/PaymentMethodsSettings';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const Settings = () => {
  
  const [schoolData, setSchoolData] = useState({
    school_name: 'Rodauto - Escola de Condução',
    nif: '500123456',
    address: 'Av. Samora Machel nº 81, Quelimane',
    phone: '+258 24 21 39 97',
    email: 'rodauto@gmail.com',
  });
  
  const [passwordData, setPasswordData] = useState({
    new: '',
    confirm: '',
  });
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch admin users
  const { data: adminUsers, isLoading: adminsLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      return profiles || [];
    },
  });

  const handleSaveSchool = () => {
    toast.success('Dados da escola guardados com sucesso');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new !== passwordData.confirm) {
      toast.error('As palavras-passe não coincidem');
      return;
    }

    if (passwordData.new.length < 6) {
      toast.error('A palavra-passe deve ter pelo menos 6 caracteres');
      return;
    }

    setIsChangingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: passwordData.new,
    });

    setIsChangingPassword(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Palavra-passe alterada com sucesso');
    setPasswordData({ new: '', confirm: '' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerir configurações do sistema e integrações</p>
        </div>

        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="integrations" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Integrações</span>
            </TabsTrigger>
            <TabsTrigger value="school" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Escola</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Utilizadores</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
          </TabsList>

          {/* Integrations - WhatsApp */}
          <TabsContent value="integrations" className="space-y-6">
            {/* WhatsApp Connection - New Component */}
            <WhatsAppConnection />

            {/* Message Templates Settings */}
            <MessageTemplatesSettings />

            {/* Daily Report Settings */}
            <DailyReportSettingsComponent />

            {/* Payment Methods Settings */}
            <PaymentMethodsSettings />
          </TabsContent>

          {/* School Settings */}
          <TabsContent value="school">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Escola</CardTitle>
                <CardDescription>
                  Informações que aparecem nos documentos e comunicações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school_name">Nome da Escola</Label>
                    <Input
                      id="school_name"
                      value={schoolData.school_name}
                      onChange={(e) => setSchoolData({ ...schoolData, school_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nuit">NUIT</Label>
                    <Input
                      id="nuit"
                      value={schoolData.nif}
                      onChange={(e) => setSchoolData({ ...schoolData, nif: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Morada</Label>
                    <Input
                      id="address"
                      value={schoolData.address}
                      onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={schoolData.phone}
                      onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={schoolData.email}
                      onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveSchool} className="gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Settings */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Administradores</CardTitle>
                <CardDescription>
                  Utilizadores com acesso ao painel administrativo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adminsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {adminUsers?.map((admin) => (
                      <div
                        key={admin.user_id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{admin.full_name}</p>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                        <Badge>Admin</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Palavra-passe</CardTitle>
                <CardDescription>
                  Actualize a sua palavra-passe de acesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Palavra-passe</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Palavra-passe</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isChangingPassword} className="gap-2">
                    {isChangingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4" />
                    )}
                    Alterar Palavra-passe
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Settings;
