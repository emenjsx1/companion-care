import { useState, useEffect } from 'react';
import { Clock, Phone, Power, Save, Loader2, Calendar, Wifi, Check, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useDailyReportSettings, useUpdateDailyReportSettings, DailyReportSettings } from '@/hooks/useSchoolSettings';
import { useCheckInstanceStatus } from '@/hooks/useEvolutionInstance';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Nome fixo da instância RodAuto
const RODAUTO_INSTANCE_NAME = 'rodauto';

const DailyReportSettingsComponent = () => {
  const { data: settings, isLoading } = useDailyReportSettings();
  const updateSettings = useUpdateDailyReportSettings();
  
  // Check status of the RodAuto instance
  const { data: instanceStatus, isLoading: instanceLoading } = useCheckInstanceStatus(RODAUTO_INSTANCE_NAME, true);
  const isInstanceConnected = instanceStatus?.connected === true;

  const [localSettings, setLocalSettings] = useState<DailyReportSettings>({
    enabled: false,
    time: '18:00',
    timezone: 'Africa/Maputo',
    phone: '',
    instance_name: RODAUTO_INSTANCE_NAME, // Always use the fixed instance
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        ...settings,
        instance_name: RODAUTO_INSTANCE_NAME, // Always override with fixed instance
      });
    }
  }, [settings]);

  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSave = () => {
    updateSettings.mutate({
      ...localSettings,
      instance_name: RODAUTO_INSTANCE_NAME, // Always save with fixed instance
    });
  };

  const handleTestReport = async () => {
    if (!localSettings.phone) {
      toast.error('Configure o número de destino primeiro');
      return;
    }
    
    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-report', {
        body: {
          phone: localSettings.phone,
          instanceName: RODAUTO_INSTANCE_NAME,
        },
      });
      
      if (error) throw error;
      toast.success('Relatório de teste enviado com sucesso!');
    } catch (error) {
      console.error('Error sending test report:', error);
      toast.error('Erro ao enviar relatório de teste');
    } finally {
      setIsSendingTest(false);
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

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
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Relatório Diário Automático
        </CardTitle>
        <CardDescription>
          Configure o envio automático de relatório diário via WhatsApp com estatísticas da escola
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Switch */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Power className={`h-5 w-5 ${localSettings.enabled ? 'text-success' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-medium">Relatório Automático</p>
              <p className="text-sm text-muted-foreground">
                {localSettings.enabled ? 'Activo - Relatório será enviado diariamente' : 'Desactivado'}
              </p>
            </div>
          </div>
          <Switch
            checked={localSettings.enabled}
            onCheckedChange={(checked) => setLocalSettings({ ...localSettings, enabled: checked })}
          />
        </div>

        {/* Time Configuration */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hora do Envio
            </Label>
            <div className="flex gap-2">
              <Select
                value={localSettings.time.split(':')[0]}
                onValueChange={(hour) => setLocalSettings({ ...localSettings, time: `${hour}:${localSettings.time.split(':')[1] || '00'}` })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map(h => (
                    <SelectItem key={h} value={h}>{h}h</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="flex items-center">:</span>
              <Select
                value={localSettings.time.split(':')[1] || '00'}
                onValueChange={(minute) => setLocalSettings({ ...localSettings, time: `${localSettings.time.split(':')[0]}:${minute}` })}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Fuso horário: Africa/Maputo (GMT+2)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Número de Destino
            </Label>
            <Input
              placeholder="+258 84 123 4567"
              value={localSettings.phone}
              onChange={(e) => setLocalSettings({ ...localSettings, phone: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Número que receberá o relatório diário
            </p>
          </div>
        </div>

        {/* Instance Status - Read-only display */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Instância WhatsApp
          </Label>
          {instanceLoading ? (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">A verificar instância...</span>
            </div>
          ) : isInstanceConnected ? (
            <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">RodAuto</p>
                <p className="text-xs text-muted-foreground">Instância conectada e pronta</p>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                Conectado
              </Badge>
            </div>
          ) : (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning">
                Instância WhatsApp não conectada. Conecte a instância na secção "Conectar WhatsApp" acima.
              </p>
            </div>
          )}
        </div>

        {/* Report Preview */}
        <div className="p-4 bg-muted/30 rounded-lg border">
          <h4 className="font-medium mb-2">O relatório inclui:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Novos alunos inscritos hoje</li>
            <li>• Total de alunos activos</li>
            <li>• Exames realizados vs. pendentes</li>
            <li>• Receita do dia e total pendente</li>
            <li>• Pagamentos em atraso</li>
          </ul>
        </div>

        {/* Scheduling Info */}
        {localSettings.enabled && localSettings.phone && isInstanceConnected && (
          <div className="p-4 bg-success/10 rounded-lg border border-success/20">
            <h4 className="font-medium text-success mb-1 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Agendamento Activo
            </h4>
            <p className="text-sm text-muted-foreground">
              O relatório será enviado automaticamente todos os dias às {localSettings.time} (hora de Maputo) 
              para o número {localSettings.phone}.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending || (!isInstanceConnected && localSettings.enabled)}
            className="gap-2"
          >
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar Configurações
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleTestReport} 
            disabled={isSendingTest || !isInstanceConnected || !localSettings.phone}
            className="gap-2"
          >
            {isSendingTest ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Testar Envio
          </Button>
        </div>

        {!localSettings.phone && localSettings.enabled && (
          <p className="text-xs text-amber-600">
            Configure o número de destino para activar o relatório.
          </p>
        )}

        {!isInstanceConnected && localSettings.enabled && (
          <p className="text-xs text-amber-600">
            Conecte a instância WhatsApp para activar o relatório.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyReportSettingsComponent;
