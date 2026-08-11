import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Check, X, Wifi, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon';
import { 
  useCreateEvolutionInstance, 
  useGetQRCode, 
  useCheckInstanceStatus,
  useDisconnectInstance,
  useDeleteInstance,
} from '@/hooks/useEvolutionInstance';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

// Nome fixo da instância RodAuto
const RODAUTO_INSTANCE_NAME = 'rodauto';

interface WhatsAppConnectionProps {
  onInstanceConnected?: (instanceName: string) => void;
}

const WhatsAppConnection = ({ onInstanceConnected }: WhatsAppConnectionProps) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isForceReconnecting, setIsForceReconnecting] = useState(false);
  
  const createInstance = useCreateEvolutionInstance();
  const getQRCode = useGetQRCode();
  const disconnectInstance = useDisconnectInstance();
  const deleteInstance = useDeleteInstance();
  
  // Check status of the RodAuto instance with polling
  const { data: instanceStatus, isLoading: statusLoading, refetch: refetchStatus } = useCheckInstanceStatus(
    RODAUTO_INSTANCE_NAME, 
    true // Always poll to check status
  );

  const isConnected = instanceStatus?.connected === true;
  const instanceExists = instanceStatus !== null && instanceStatus !== undefined;

  // When instance becomes connected, update UI
  useEffect(() => {
    if (isConnected) {
      setQrCode(null);
      setShowQRCode(false);
      setIsForceReconnecting(false);
      if (onInstanceConnected) {
        onInstanceConnected(RODAUTO_INSTANCE_NAME);
      }
    }
  }, [isConnected, onInstanceConnected]);

  const handleCreateOrConnect = async () => {
    setIsCreating(true);
    try {
      // If instance exists and is disconnected or connecting - just get QR code
      if (instanceStatus && (instanceStatus.state === 'close' || instanceStatus.state === 'connecting')) {
        console.log('Instance exists, getting QR code...', instanceStatus.state);
        setShowQRCode(true);
        await handleGetQRCode();
        return;
      }

      // Try to create instance (or get existing)
      const result = await createInstance.mutateAsync(RODAUTO_INSTANCE_NAME);
      
      if (result.qrcode) {
        setQrCode(result.qrcode);
        setShowQRCode(true);
      } else if (result.connected) {
        setQrCode(null);
        setShowQRCode(false);
        refetchStatus();
      } else if (result.error && result.error.toLowerCase().includes('already')) {
        // Instance already exists, just get QR code to reconnect
        console.log('Instance already exists, getting QR code...');
        setShowQRCode(true);
        await handleGetQRCode();
      } else {
        // Instance created/exists, get QR code
        setShowQRCode(true);
        await handleGetQRCode();
      }
    } catch (error) {
      console.error('Error creating/connecting instance:', error);
      // If error is about instance existing, try to get QR code
      setShowQRCode(true);
      await handleGetQRCode();
    } finally {
      setIsCreating(false);
    }
  };

  const handleGetQRCode = async () => {
    try {
      const result = await getQRCode.mutateAsync(RODAUTO_INSTANCE_NAME);
      console.log('QR Code result:', result);
      if (result.qrcode) {
        setQrCode(result.qrcode);
        setShowQRCode(true);
      } else if (result.connected) {
        setQrCode(null);
        setShowQRCode(false);
        refetchStatus();
      } else {
        // No QR code returned, retry after delay
        console.log('No QR code, retrying in 2s...');
        setTimeout(() => handleGetQRCode(), 2000);
      }
    } catch (error) {
      console.error('Error getting QR code:', error);
    }
  };

  const handleDisconnect = async () => {
    await disconnectInstance.mutateAsync(RODAUTO_INSTANCE_NAME);
    setQrCode(null);
    setShowQRCode(false);
    refetchStatus();
  };

  const handleForceReconnect = async () => {
    setIsForceReconnecting(true);
    setQrCode(null);
    setShowQRCode(false);
    
    try {
      // Step 1: Delete the existing instance
      toast.info('A eliminar instância existente...');
      await deleteInstance.mutateAsync(RODAUTO_INSTANCE_NAME);
      
      // Wait a moment for the deletion to propagate
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 2: Create a new instance
      toast.info('A criar nova instância...');
      const result = await createInstance.mutateAsync(RODAUTO_INSTANCE_NAME);
      
      if (result.qrcode) {
        setQrCode(result.qrcode);
        setShowQRCode(true);
        toast.success('Nova instância criada! Escaneie o QR code.');
      } else if (result.connected) {
        setQrCode(null);
        setShowQRCode(false);
        refetchStatus();
        toast.success('WhatsApp reconectado!');
      } else {
        // Instance created, get QR code
        setShowQRCode(true);
        await handleGetQRCode();
      }
    } catch (error) {
      console.error('Error during force reconnect:', error);
      toast.error('Erro ao forçar reconexão. Tente novamente.');
    } finally {
      setIsForceReconnecting(false);
      refetchStatus();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center">
            <WhatsAppIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <span>Conectar WhatsApp</span>
            {isConnected && (
              <Badge variant="outline" className="ml-2 bg-success/10 text-success border-success/20">
                <Check className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Conecte o WhatsApp da RodAuto para enviar mensagens automáticas aos alunos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loading state */}
        {statusLoading && !instanceExists && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Connected State */}
        {isConnected && !showQRCode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                  <Wifi className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">RodAuto WhatsApp</p>
                  <p className="text-sm text-muted-foreground">Instância conectada e pronta para enviar mensagens</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isForceReconnecting}
                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                    >
                      {isForceReconnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-1" />
                      )}
                      Forçar Reconexão
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Forçar Reconexão?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acção irá eliminar a instância actual e criar uma nova. 
                        Terá de escanear um novo QR code para reconectar o WhatsApp.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleForceReconnect}>
                        Continuar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnectInstance.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {disconnectInstance.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Display */}
        {showQRCode && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-muted rounded-lg">
                <p className="text-sm font-medium">Instância: <span className="font-bold">RodAuto</span></p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowQRCode(false);
                  setQrCode(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {qrCode ? (
              <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl bg-muted/30">
                <h3 className="font-medium text-center">Escanear QR Code com WhatsApp</h3>
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <img 
                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                    alt="WhatsApp QR Code"
                    className="w-56 h-56 object-contain"
                    onError={(e) => {
                      console.error('QR Code image failed to load');
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Abra o WhatsApp → Menu (⋮) → Dispositivos conectados → Conectar dispositivo
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    A aguardar conexão...
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGetQRCode}
                  disabled={getQRCode.isPending}
                >
                  {getQRCode.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Atualizar QR Code
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">A gerar QR code...</p>
              </div>
            )}
          </div>
        )}

        {/* Connect Button - show when not connected and not showing QR */}
        {!isConnected && !showQRCode && !statusLoading && (
          <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl bg-muted/30">
            <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center">
              <WhatsAppIcon className="h-8 w-8 text-[#25D366]" />
            </div>
            <div className="text-center">
              <h3 className="font-medium">Conectar WhatsApp</h3>
              <p className="text-sm text-muted-foreground max-w-xs mt-1">
                Clique no botão abaixo para gerar o QR code e conectar o WhatsApp da escola
              </p>
            </div>
            <Button
              onClick={handleCreateOrConnect}
              disabled={isCreating || createInstance.isPending}
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white gap-2"
            >
              {(isCreating || createInstance.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <WhatsAppIcon className="h-4 w-4" />
              )}
              Conectar WhatsApp
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppConnection;
