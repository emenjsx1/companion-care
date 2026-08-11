import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppLog {
  id: string;
  recipient_phone: string;
  recipient_name: string | null;
  message: string;
  status: string;
  error: string | null;
  campaign_name: string | null;
  created_at: string;
  sender_user_id: string;
}

export const useWhatsAppLogs = (filters?: {
  status?: string;
  campaign?: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  return useQuery({
    queryKey: ['whatsapp-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('whatsapp_message_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.campaign && filters.campaign !== 'all') {
        query = query.eq('campaign_name', filters.campaign);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as WhatsAppLog[];
    },
  });
};

export const useWhatsAppCampaigns = () => {
  return useQuery({
    queryKey: ['whatsapp-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_message_logs')
        .select('campaign_name')
        .not('campaign_name', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique campaign names
      const uniqueCampaigns = [...new Set(data?.map(d => d.campaign_name).filter(Boolean))];
      return uniqueCampaigns as string[];
    },
  });
};
