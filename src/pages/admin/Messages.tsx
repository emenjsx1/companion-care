import { useState } from 'react';
import { Mail, MailOpen, Trash2, ExternalLink, Search, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/admin/AdminLayout';
import { useContactMessages, useMarkMessageRead, useMarkAllMessagesRead, useDeleteContactMessage } from '@/hooks/useContactMessages';
import { cn } from '@/lib/utils';

const Messages = () => {
  const { data: messages, isLoading } = useContactMessages();
  const markRead = useMarkMessageRead();
  const markAllRead = useMarkAllMessagesRead();
  const deleteMessage = useDeleteContactMessage();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<typeof messages extends (infer T)[] ? T : never | null>(null);

  const unreadCount = messages?.filter(m => !m.is_read).length || 0;

  const filteredMessages = messages?.filter(message =>
    message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.message.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSelectMessage = (message: typeof selectedMessage) => {
    setSelectedMessage(message);
    if (message && !message.is_read) {
      markRead.mutate(message.id);
    }
  };

  const handleDelete = (messageId: string) => {
    deleteMessage.mutate(messageId);
    if (selectedMessage?.id === messageId) {
      setSelectedMessage(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mensagens de Contacto</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} mensagem(ns) por ler` : 'Todas as mensagens lidas'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => markAllRead.mutate()} 
              className="gap-2"
              disabled={markAllRead.isPending}
            >
              <CheckCircle className="h-4 w-4" />
              Marcar Tudo como Lido
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {filteredMessages.length > 0 ? filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => handleSelectMessage(message)}
                      className={cn(
                        "p-4 cursor-pointer transition-colors hover:bg-muted/50",
                        selectedMessage?.id === message.id && "bg-muted",
                        !message.is_read && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          message.is_read ? "bg-muted" : "bg-accent/10"
                        )}>
                          {message.is_read ? (
                            <MailOpen className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Mail className="h-4 w-4 text-accent" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "text-sm truncate",
                              !message.is_read && "font-semibold"
                            )}>
                              {message.name}
                            </p>
                            {!message.is_read && (
                              <Badge variant="default" className="bg-accent text-accent-foreground text-xs">
                                Nova
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{message.email}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {message.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(message.created_at).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-muted-foreground">
                      Nenhuma mensagem encontrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Message Detail */}
            <Card className="lg:col-span-2">
              {selectedMessage ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{selectedMessage.name}</CardTitle>
                        <CardDescription className="mt-1">
                          <a href={`mailto:${selectedMessage.email}`} className="hover:text-accent">
                            {selectedMessage.email}
                          </a>
                          {selectedMessage.phone && (
                            <span className="ml-3">• {selectedMessage.phone}</span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <a href={`mailto:${selectedMessage.email}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Responder
                          </Button>
                        </a>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(selectedMessage.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-foreground whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Recebido em{' '}
                        {new Date(selectedMessage.created_at).toLocaleDateString('pt-PT', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex items-center justify-center h-96 text-muted-foreground">
                  <div className="text-center">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione uma mensagem para ver os detalhes</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Messages;
