import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WhatsAppMessage {
  phone: string;
  message: string;
  recipientName?: string;
}

export interface Campaign {
  id: string;
  name: string;
  message: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  recipients: number;
  sent: number;
  failed: number;
  created_at: string;
}

// Send single WhatsApp message via Evolution API
export const useSendWhatsAppMessage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phone, message, recipientName }: WhatsAppMessage) => {
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { 
          phone, 
          message,
          recipientName,
          logMessage: true,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] });
      toast({ 
        title: 'Mensagem enviada!',
        description: 'A mensagem foi enviada com sucesso via WhatsApp.',
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao enviar mensagem', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

// Send bulk WhatsApp messages (campaign)
export const useSendBulkWhatsApp = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipients, message, campaignName }: { 
      recipients: { phone: string; name: string }[], 
      message: string,
      campaignName?: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-bulk', {
        body: { recipients, message, campaignName },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-logs'] });
      toast({ 
        title: 'Campanha enviada!',
        description: `${data?.sent || 0} mensagens enviadas com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro na campanha', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

// Message templates - Rodauto Quelimane
export const MESSAGE_TEMPLATES = [
  {
    id: 'exam_scheduled',
    name: 'Exame Marcado',
    message: 'Olá {nome}! 📋\n\nO seu exame de {tipo} foi marcado para:\n📅 {data}\n\nPrepare-se bem e chegue com antecedência!\n\nBoa sorte! Estamos a torcer por si!\n\n📍 Av. Samora Machel nº 81, Quelimane\n📞 82 108 100 4\n\n🚗 Rodauto - Escola de Condução',
  },
  {
    id: 'exam_passed',
    name: 'Exame Aprovado',
    message: 'Parabéns {nome}! 🎉🎊\n\nTemos o prazer de informar que foi APROVADO(A) no seu exame de {tipo}!\n\nContinue assim! Estamos muito orgulhosos de si!\n\n📍 Av. Samora Machel nº 81, Quelimane\n📞 82 108 100 4\n\n🚗 Rodauto - Escola de Condução',
  },
  {
    id: 'exam_failed',
    name: 'Exame Reprovado',
    message: 'Olá {nome}! 📋\n\nInfelizmente não foi aprovado(a) no exame de {tipo} desta vez.\n\nMas não desanime! Com mais preparação, certamente conseguirá na próxima tentativa.\n\nContacre-nos para agendar mais aulas de preparação.\n\n📍 Av. Samora Machel nº 81, Quelimane\n📞 82 108 100 4\n\n🚗 Rodauto - Escola de Condução',
  },
  {
    id: 'payment_reminder',
    name: 'Lembrete de Pagamento',
    message: 'Olá {nome}! 👋\n\nEsperamos que esteja bem. Este é um lembrete amigável sobre o seu pagamento pendente de {valor}.\n\nPor favor, regularize até {data} para continuar com as suas aulas.\n\nContacte-nos:\n📍 Av. Samora Machel nº 81, Quelimane\n📞 24 21 39 97 / 82 108 100 4\n\nObrigado!\n🚗 Rodauto - Escola de Condução',
  },
  {
    id: 'exam_reminder',
    name: 'Lembrete de Exame',
    message: 'Olá {nome}! 🎯\n\nLembramos que o seu exame está marcado em breve.\n\nPrepare-se bem e chegue com antecedência!\n\nBoa sorte! Estamos a torcer por si!\n\n📍 Av. Samora Machel nº 81, Quelimane\n📞 82 108 100 4\n\n🚗 Rodauto - Escola de Condução',
  },
  {
    id: 'welcome',
    name: 'Boas-vindas',
    message: 'Bem-vindo(a) à Rodauto, {nome}! 🎉\n\nÉ com grande satisfação que o/a recebemos na nossa escola de condução.\n\nEstamos no mercado há mais de 20 anos, formando condutores responsáveis em Quelimane.\n\n📍 Av. Samora Machel nº 81\n📞 24 21 39 97 / 82 108 100 4\n\nQualquer dúvida, estamos à disposição.\n\n🚗 Rodauto - A sua carta, o nosso compromisso!',
  },
  {
    id: 'course_complete',
    name: 'Curso Concluído',
    message: 'Parabéns {nome}! 🎊\n\nConcluiu com sucesso o seu curso de condução na Rodauto!\n\nDesejamos-lhe muitas viagens seguras!\n\nRecomende-nos aos seus amigos e familiares.\n\n📍 Av. Samora Machel nº 81, Quelimane\n📞 82 108 100 4\n\n🚗 Rodauto - Escola de Condução',
  },
  {
    id: 'class_schedule',
    name: 'Horário de Aula',
    message: 'Olá {nome}! 📅\n\nLembramos da sua aula de condução agendada.\n\nPor favor, chegue com 10 minutos de antecedência.\n\nEm caso de impossibilidade, avise-nos com antecedência.\n\n📞 82 108 100 4\n\n🚗 Rodauto - Escola de Condução',
  },
  {
    id: 'custom',
    name: 'Mensagem Personalizada',
    message: '',
  },
];

// Replace template variables
export const replaceTemplateVariables = (
  template: string, 
  variables: Record<string, string>
): string => {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  return result;
};
