import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreateInstanceResponse {
  created: boolean;
  instanceName?: string;
  qrcode?: string;
  pairingCode?: string;
  connected?: boolean;
  error?: string;
  message?: string;
  needsQRCode?: boolean;
}

export interface QRCodeResponse {
  qrcode?: string;
  connected?: boolean;
  state?: string;
  instance?: string;
  error?: string;
  message?: string;
}

export interface InstanceStatus {
  instanceName: string;
  state: string;
  connected: boolean;
  profileName?: string;
  profilePicUrl?: string;
  error?: string;
}

export interface InstanceInfo {
  instanceName: string;
  state: string;
  profileName?: string;
  profilePicUrl?: string;
}

// Create Evolution API instance and get QR code
export const useCreateEvolutionInstance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceName: string): Promise<CreateInstanceResponse> => {
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: { action: 'create-instance', instanceName },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Erro ao chamar função do Supabase');
      }

      if (!data) {
        throw new Error('Resposta vazia da função');
      }

      // Se a função retornou um erro explícito
      if (data.error) {
        console.error('Evolution API error:', data);
        const errorMsg = typeof data.error === 'string' 
          ? data.error 
          : data.error.message || JSON.stringify(data.error);
        throw new Error(errorMsg);
      }

      // Se created é false, ainda retornamos os dados para o frontend tratar
      if (data.created === false) {
        if (data.needsQRCode) {
          return data;
        }
        
        const errorMsg = data.error || data.message || 'Não foi possível criar instância';
        console.error('Create instance failed:', data);
        throw new Error(errorMsg);
      }

      return data as CreateInstanceResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['evolution-instances'] });
      if (data.created) {
        toast.success(`Instância "${data.instanceName}" criada com sucesso!`);
        if (data.qrcode) {
          toast.info('Escaneie o QR code para conectar o WhatsApp');
        }
      }
    },
    onError: (error: Error) => {
      console.error('Create instance error details:', error);
      const errorMessage = error.message || 'Erro desconhecido ao criar instância';
      toast.error(`Erro ao criar instância: ${errorMessage}`);
    },
  });
};

// Get QR code for existing instance
export const useGetQRCode = () => {
  return useMutation({
    mutationFn: async (instanceName: string): Promise<QRCodeResponse> => {
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: { action: 'get-qrcode', instanceName },
      });

      if (error) {
        throw error;
      }

      return data as QRCodeResponse;
    },
    onSuccess: (data) => {
      if (data.connected) {
        toast.success('WhatsApp já está conectado!');
      } else if (data.qrcode) {
        toast.info('QR code gerado. Escaneie para conectar');
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao obter QR Code: ${error.message}`);
    },
  });
};

// Check instance connection status
export const useCheckInstanceStatus = (instanceName: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['instance-status', instanceName],
    queryFn: async (): Promise<InstanceStatus> => {
      if (!instanceName) {
        throw new Error('instanceName é obrigatório');
      }

      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: { action: 'check-status', instanceName },
      });

      if (error) {
        throw error;
      }

      return data as InstanceStatus;
    },
    enabled: !!instanceName && enabled,
    refetchInterval: (query) => {
      // Poll every 3 seconds while not connected, stop when connected
      const data = query.state.data;
      if (data?.connected) {
        return false; // Stop polling when connected
      }
      return 3000; // Poll every 3 seconds
    },
    staleTime: 1000,
  });
};

// List all instances
export const useListInstances = () => {
  return useQuery({
    queryKey: ['evolution-instances'],
    queryFn: async (): Promise<InstanceInfo[]> => {
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: { action: 'list-instances' },
      });

      if (error) {
        throw error;
      }

      return data?.instances || [];
    },
    staleTime: 10000, // Cache for 10 seconds
  });
};

// Get connected instances only
export const useConnectedInstances = () => {
  const { data: instances, ...rest } = useListInstances();
  
  const connectedInstances = instances?.filter(
    inst => inst.state === 'open' || inst.state === 'connected'
  ) || [];

  return {
    data: connectedInstances,
    ...rest,
  };
};

// Disconnect instance
export const useDisconnectInstance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceName: string) => {
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: { action: 'disconnect', instanceName },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_, instanceName) => {
      queryClient.invalidateQueries({ queryKey: ['evolution-instances'] });
      queryClient.invalidateQueries({ queryKey: ['instance-status', instanceName] });
      toast.success('Instância desconectada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao desconectar: ${error.message}`);
    },
  });
};

// Delete instance completely
export const useDeleteInstance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (instanceName: string) => {
      const { data, error } = await supabase.functions.invoke('evolution-instance', {
        body: { action: 'delete-instance', instanceName },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_, instanceName) => {
      queryClient.invalidateQueries({ queryKey: ['evolution-instances'] });
      queryClient.invalidateQueries({ queryKey: ['instance-status', instanceName] });
      toast.success('Instância eliminada!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao eliminar instância: ${error.message}`);
    },
  });
};
