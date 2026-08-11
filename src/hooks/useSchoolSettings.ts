import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DailyReportSettings {
  enabled: boolean;
  time: string;
  timezone: string;
  phone: string;
  instance_name: string;
}

export interface SchoolInfo {
  name: string;
  nuit: string;
  address: string;
  phone: string;
  email: string;
}

export const useDailyReportSettings = () => {
  return useQuery({
    queryKey: ['school-settings', 'daily_report'],
    queryFn: async (): Promise<DailyReportSettings> => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('value')
        .eq('key', 'daily_report')
        .single();

      if (error) {
        console.error('Error fetching daily report settings:', error);
        return {
          enabled: false,
          time: '18:00',
          timezone: 'Africa/Maputo',
          phone: '',
          instance_name: '',
        };
      }

      return data.value as unknown as DailyReportSettings;
    },
  });
};

export const useUpdateDailyReportSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: DailyReportSettings) => {
      const { error } = await supabase
        .from('school_settings')
        .update({ value: settings as any })
        .eq('key', 'daily_report');

      if (error) throw error;
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-settings', 'daily_report'] });
      toast.success('Configurações do relatório guardadas!');
    },
    onError: (error) => {
      toast.error('Erro ao guardar configurações: ' + error.message);
    },
  });
};

export const useSchoolInfo = () => {
  return useQuery({
    queryKey: ['school-settings', 'school_info'],
    queryFn: async (): Promise<SchoolInfo> => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('value')
        .eq('key', 'school_info')
        .single();

      if (error) {
        console.error('Error fetching school info:', error);
        return {
          name: 'Rodauto - Escola de Condução',
          nuit: '500123456',
          address: 'Av. Samora Machel nº 81, Quelimane',
          phone: '+258 24 21 39 97',
          email: 'rodauto@gmail.com',
        };
      }

      return data.value as unknown as SchoolInfo;
    },
  });
};

export const useUpdateSchoolInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (info: SchoolInfo) => {
      const { error } = await supabase
        .from('school_settings')
        .update({ value: info as any })
        .eq('key', 'school_info');

      if (error) throw error;
      return info;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-settings', 'school_info'] });
      toast.success('Dados da escola guardados!');
    },
    onError: (error) => {
      toast.error('Erro ao guardar: ' + error.message);
    },
  });
};

export interface MessageTemplate {
  id: string;
  name: string;
  message: string;
}

export const useMessageTemplates = () => {
  return useQuery({
    queryKey: ['school-settings', 'message_templates'],
    queryFn: async (): Promise<MessageTemplate[]> => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('value')
        .eq('key', 'message_templates')
        .maybeSingle();

      if (error) {
        console.log('No custom templates found, using defaults');
        return [];
      }

      return (data.value as unknown as MessageTemplate[]) || [];
    },
  });
};

export const useUpdateMessageTemplates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templates: MessageTemplate[]) => {
      // First try to update
      const { data: existing } = await supabase
        .from('school_settings')
        .select('id')
        .eq('key', 'message_templates')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('school_settings')
          .update({ value: templates as any })
          .eq('key', 'message_templates');
        if (error) throw error;
      } else {
        // Insert if doesn't exist
        const { error } = await supabase
          .from('school_settings')
          .insert({ key: 'message_templates', value: templates as any });
        if (error) throw error;
      }
      
      return templates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-settings', 'message_templates'] });
      toast.success('Templates de mensagens guardados!');
    },
    onError: (error) => {
      toast.error('Erro ao guardar templates: ' + error.message);
    },
  });
};

// Generic settings hook for simple key-value settings
export interface GeneralSettings {
  inscription_fee?: number;
  [key: string]: unknown;
}

export const useSchoolSettings = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['school-settings', 'general'],
    queryFn: async (): Promise<GeneralSettings> => {
      const { data, error } = await supabase
        .from('school_settings')
        .select('key, value');

      if (error) {
        console.error('Error fetching school settings:', error);
        return { inscription_fee: 300 };
      }

      // Build settings object from all keys
      const settings: GeneralSettings = { inscription_fee: 300 };
      data?.forEach(row => {
        if (row.key === 'inscription_fee') {
          settings.inscription_fee = row.value as number;
        }
      });

      return settings;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      // First try to update
      const { data: existing } = await supabase
        .from('school_settings')
        .select('id')
        .eq('key', key)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('school_settings')
          .update({ value: value as any })
          .eq('key', key);
        if (error) throw error;
      } else {
        // Insert if doesn't exist
        const { error } = await supabase
          .from('school_settings')
          .insert({ key, value: value as any });
        if (error) throw error;
      }
      
      return { key, value };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
      toast.success('Configuração guardada!');
    },
    onError: (error) => {
      toast.error('Erro ao guardar: ' + error.message);
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    updateSetting,
  };
};
