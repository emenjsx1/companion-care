import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppReceivedMessage {
  id: string;
  sender_phone: string;
  sender_name: string | null;
  message: string;
  message_type: string;
  media_url: string | null;
  instance_name: string;
  remote_jid: string | null;
  message_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const useWhatsAppReceivedMessages = () => {
  return useQuery({
    queryKey: ['whatsapp-received-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_received_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as WhatsAppReceivedMessage[];
    },
    refetchInterval: 10000, // Refresh every 10 seconds for real-time feel
  });
};

export const useMarkReceivedMessageRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('whatsapp_received_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-received-messages'] });
    },
  });
};

export const useMarkAllReceivedMessagesRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('whatsapp_received_messages')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-received-messages'] });
    },
  });
};

export const useDeleteReceivedMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('whatsapp_received_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-received-messages'] });
    },
  });
};

export const useUnreadReceivedMessagesCount = () => {
  return useQuery({
    queryKey: ['whatsapp-received-messages-unread-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('whatsapp_received_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 10000,
  });
};
