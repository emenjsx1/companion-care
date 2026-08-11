import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Users, 
  MessageSquare, 
  Search, 
  Loader2,
  Phone,
  CheckCircle,
  XCircle,
  Megaphone,
  Filter,
  History,
  AlertCircle,
  MessageCircle,
  RefreshCw,
  FileText,
  Inbox,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import AdminLayout from '@/components/admin/AdminLayout';
import { useStudents } from '@/hooks/useStudents';
import { useSendWhatsAppMessage, useSendBulkWhatsApp, MESSAGE_TEMPLATES, replaceTemplateVariables } from '@/hooks/useEvolutionApi';
import { useContactMessages, useMarkMessageRead, useDeleteContactMessage } from '@/hooks/useContactMessages';
import { useWhatsAppLogs, useWhatsAppCampaigns } from '@/hooks/useWhatsAppLogs';
import { useWhatsAppReceivedMessages, useMarkReceivedMessageRead, useMarkAllReceivedMessagesRead, useDeleteReceivedMessage, type WhatsAppReceivedMessage } from '@/hooks/useWhatsAppReceivedMessages';
import { cn } from '@/lib/utils';

const Communication = () => {
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: contactMessages, isLoading: messagesLoading } = useContactMessages();
  
  // WhatsApp logs state
  const [logsStatusFilter, setLogsStatusFilter] = useState<string>('all');
  const [logsCampaignFilter, setLogsCampaignFilter] = useState<string>('all');
  const { data: whatsAppLogs, isLoading: logsLoading } = useWhatsAppLogs({
    status: logsStatusFilter,
    campaign: logsCampaignFilter,
  });
  const { data: campaigns } = useWhatsAppCampaigns();
  
  // WhatsApp received messages
  const { data: receivedMessages, isLoading: receivedLoading, refetch: refetchReceived } = useWhatsAppReceivedMessages();
  const markReceivedRead = useMarkReceivedMessageRead();
  const markAllReceivedRead = useMarkAllReceivedMessagesRead();
  const deleteReceivedMessage = useDeleteReceivedMessage();
  const [selectedReceivedMessage, setSelectedReceivedMessage] = useState<WhatsAppReceivedMessage | null>(null);
  
  const sendWhatsApp = useSendWhatsAppMessage();
  const sendBulkWhatsApp = useSendBulkWhatsApp();
  const markRead = useMarkMessageRead();
  const deleteMessage = useDeleteContactMessage();

  // Single message state
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Campaign state
  const [campaignName, setCampaignName] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);

  // Contact messages state
  const [selectedContactMessage, setSelectedContactMessage] = useState<typeof contactMessages extends (infer T)[] ? T : never | null>(null);

  const studentsWithPhone = students?.filter(s => s.profile?.phone) || [];
  
  const filteredStudents = studentsWithPhone.filter(s => {
    const matchesSearch = s.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.profile?.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (template && template.id !== 'custom') {
      const student = students?.find(s => s.id === selectedStudent);
      setMessageText(replaceTemplateVariables(template.message, {
        nome: student?.profile?.full_name || 'Aluno',
      }));
    } else {
      setMessageText('');
    }
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);
    if (selectedTemplate && selectedTemplate !== 'custom') {
      const template = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate);
      const student = students?.find(s => s.id === studentId);
      if (template) {
        setMessageText(replaceTemplateVariables(template.message, {
          nome: student?.profile?.full_name || 'Aluno',
        }));
      }
    }
  };

  const handleSendSingle = () => {
    const student = students?.find(s => s.id === selectedStudent);
    if (!student?.profile?.phone || !messageText) return;
    
    sendWhatsApp.mutate({
      phone: student.profile.phone,
      message: messageText,
      recipientName: student.profile.full_name || undefined,
    });
  };

  const handleToggleRecipient = (studentId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecipients.length === filteredStudents.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(filteredStudents.map(s => s.id));
    }
  };

  const handleSendCampaign = () => {
    if (selectedRecipients.length === 0 || !campaignMessage) return;

    const recipients = selectedRecipients
      .map(id => {
        const student = students?.find(s => s.id === id);
        return {
          phone: student?.profile?.phone || '',
          name: student?.profile?.full_name || 'Aluno',
        };
      })
      .filter(r => r.phone);
    
    sendBulkWhatsApp.mutate({
      recipients,
      message: campaignMessage,
      campaignName: campaignName || `Campanha ${new Date().toLocaleDateString('pt-MZ')}`,
    });

    setIsCampaignDialogOpen(false);
    setCampaignName('');
    setCampaignMessage('');
    setSelectedRecipients([]);
  };


  const handleSelectContactMessage = (message: typeof selectedContactMessage) => {
    setSelectedContactMessage(message);
    if (message && !message.is_read) {
      markRead.mutate(message.id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comunicação</h1>
          <p className="text-muted-foreground">Envie mensagens via WhatsApp e gerencie contactos</p>
        </div>

        <Tabs defaultValue="whatsapp">
          <TabsList className="flex-wrap">
            <TabsTrigger value="whatsapp" className="gap-2">
              <Phone className="h-4 w-4" />
              Enviar
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Campanhas
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="received" className="gap-2">
              <Inbox className="h-4 w-4" />
              Respostas
              {receivedMessages?.filter(m => !m.is_read).length ? (
                <Badge variant="destructive" className="ml-1">
                  {receivedMessages.filter(m => !m.is_read).length}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="inbox" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Contacto Site
              {contactMessages?.filter(m => !m.is_read).length ? (
                <Badge variant="secondary" className="ml-1">
                  {contactMessages.filter(m => !m.is_read).length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>

          {/* Single WhatsApp Message */}
          <TabsContent value="whatsapp" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enviar Mensagem Individual</CardTitle>
                  <CardDescription>Envie uma mensagem WhatsApp para um aluno</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Selecionar Aluno</Label>
                    <Select value={selectedStudent} onValueChange={handleStudentChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um aluno..." />
                      </SelectTrigger>
                      <SelectContent>
                        {studentsWithPhone.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.profile?.full_name} - {student.profile?.phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Template de Mensagem</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MESSAGE_TEMPLATES.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea
                      placeholder="Escreva a sua mensagem..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{nome}'} para inserir o nome do aluno automaticamente
                    </p>
                  </div>

                  <Button 
                    className="w-full gap-2" 
                    onClick={handleSendSingle}
                    disabled={!selectedStudent || !messageText || sendWhatsApp.isPending}
                  >
                    {sendWhatsApp.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar Mensagem
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Templates Disponíveis</CardTitle>
                  <CardDescription>Mensagens pré-definidas para usar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MESSAGE_TEMPLATES.filter(t => t.id !== 'custom').map(template => (
                    <div 
                      key={template.id} 
                      className="p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleTemplateChange(template.id)}
                    >
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template.message.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campaigns */}
          <TabsContent value="campaigns" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Campanhas de WhatsApp</CardTitle>
                    <CardDescription>Envie mensagens em massa para múltiplos alunos</CardDescription>
                  </div>
                  <Button 
                    className="gap-2"
                    onClick={() => setIsCampaignDialogOpen(true)}
                    disabled={selectedRecipients.length === 0}
                  >
                    <Megaphone className="h-4 w-4" />
                    Criar Campanha ({selectedRecipients.length})
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por nome ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="em_formacao">Em Formação</SelectItem>
                      <SelectItem value="concluido">Concluídos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recipients Table */}
                {studentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedRecipients.length === filteredStudents.length && filteredStudents.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead className="hidden sm:table-cell">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              Nenhum aluno com telefone encontrado
                            </TableCell>
                          </TableRow>
                        ) : filteredStudents.map((student) => (
                          <TableRow 
                            key={student.id}
                            className={cn(selectedRecipients.includes(student.id) && "bg-primary/5")}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedRecipients.includes(student.id)}
                                onCheckedChange={() => handleToggleRecipient(student.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{student.profile?.full_name}</TableCell>
                            <TableCell>{student.profile?.phone}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline">
                                {student.status === 'active' ? 'Ativo' : 
                                 student.status === 'em_formacao' ? 'Em Formação' :
                                 student.status === 'concluido' ? 'Concluído' : student.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Received Messages */}
          <TabsContent value="received" className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Received Messages List */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Respostas WhatsApp</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => refetchReceived()}
                        title="Actualizar"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      {receivedMessages?.some(m => !m.is_read) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => markAllReceivedRead.mutate()}
                          disabled={markAllReceivedRead.isPending}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {receivedLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : receivedMessages && receivedMessages.length > 0 ? receivedMessages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => {
                          setSelectedReceivedMessage(message);
                          if (!message.is_read) {
                            markReceivedRead.mutate(message.id);
                          }
                        }}
                        className={cn(
                          "p-4 cursor-pointer transition-colors hover:bg-muted/50",
                          selectedReceivedMessage?.id === message.id && "bg-muted",
                          !message.is_read && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn("font-medium text-sm", !message.is_read && "font-semibold")}>
                            {message.sender_name || message.sender_phone}
                          </p>
                          {!message.is_read && (
                            <Badge variant="destructive" className="text-xs">Nova</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{message.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {message.message_type === 'text' ? 'Texto' : 
                             message.message_type === 'image' ? 'Imagem' :
                             message.message_type === 'audio' ? 'Áudio' :
                             message.message_type === 'video' ? 'Vídeo' : message.message_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleDateString('pt-MZ', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma resposta recebida</p>
                        <p className="text-xs mt-2">Configure o webhook para receber mensagens</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Received Message Detail */}
              <Card className="lg:col-span-2">
                {selectedReceivedMessage ? (
                  <>
                    <CardHeader className="border-b">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{selectedReceivedMessage.sender_name || 'Sem Nome'}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Phone className="h-4 w-4" />
                            {selectedReceivedMessage.sender_phone}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Pre-fill reply to this contact
                              const studentWithPhone = students?.find(s => 
                                s.profile?.phone?.replace(/\D/g, '').includes(selectedReceivedMessage.sender_phone.slice(-9))
                              );
                              if (studentWithPhone) {
                                setSelectedStudent(studentWithPhone.id);
                              }
                              // Switch to send tab
                              const tabsElement = document.querySelector('[data-value="whatsapp"]') as HTMLButtonElement;
                              tabsElement?.click();
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Responder
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              deleteReceivedMessage.mutate(selectedReceivedMessage.id);
                              setSelectedReceivedMessage(null);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{selectedReceivedMessage.message}</p>
                        {selectedReceivedMessage.media_url && (
                          <div className="mt-4">
                            {selectedReceivedMessage.message_type === 'image' ? (
                              <img 
                                src={selectedReceivedMessage.media_url} 
                                alt="Media" 
                                className="max-w-sm rounded-lg"
                              />
                            ) : (
                              <a 
                                href={selectedReceivedMessage.media_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary underline"
                              >
                                Ver mídia
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                        Recebido em {new Date(selectedReceivedMessage.created_at).toLocaleDateString('pt-MZ', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    <div className="text-center">
                      <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecione uma mensagem para ver</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Histórico de Envios</CardTitle>
                    <CardDescription>Todas as mensagens WhatsApp enviadas</CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={logsStatusFilter} onValueChange={setLogsStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="sent">Enviados</SelectItem>
                        <SelectItem value="failed">Falhados</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={logsCampaignFilter} onValueChange={setLogsCampaignFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Campanha" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Campanhas</SelectItem>
                        {campaigns?.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : whatsAppLogs && whatsAppLogs.length > 0 ? (
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {whatsAppLogs.map(log => (
                        <div
                          key={log.id}
                          className={cn(
                            "p-4 rounded-lg border",
                            log.status === 'sent' ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">
                                  {log.recipient_name || 'Desconhecido'}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {log.recipient_phone}
                                </span>
                                {log.campaign_name && (
                                  <Badge variant="outline" className="text-xs">
                                    {log.campaign_name}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {log.message}
                              </p>
                              {log.error && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                                  <AlertCircle className="h-3 w-3" />
                                  {log.error}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {log.status === 'sent' ? (
                                <CheckCircle className="h-5 w-5 text-success" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(log.created_at).toLocaleDateString('pt-MZ', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <History className="h-12 w-12 mb-4 opacity-50" />
                    <p>Nenhuma mensagem enviada ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inbox */}
          <TabsContent value="inbox" className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Messages List */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Mensagens Recebidas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y max-h-[600px] overflow-y-auto">
                    {messagesLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : contactMessages && contactMessages.length > 0 ? contactMessages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => handleSelectContactMessage(message)}
                        className={cn(
                          "p-4 cursor-pointer transition-colors hover:bg-muted/50",
                          selectedContactMessage?.id === message.id && "bg-muted",
                          !message.is_read && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className={cn("font-medium text-sm", !message.is_read && "font-semibold")}>
                            {message.name}
                          </p>
                          {!message.is_read && (
                            <Badge variant="destructive" className="text-xs">Nova</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{message.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(message.created_at).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-muted-foreground">
                        Nenhuma mensagem
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Message Detail */}
              <Card className="lg:col-span-2">
                {selectedContactMessage ? (
                  <>
                    <CardHeader className="border-b">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{selectedContactMessage.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            {selectedContactMessage.email}
                            {selectedContactMessage.phone && (
                              <span>• {selectedContactMessage.phone}</span>
                            )}
                          </CardDescription>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            deleteMessage.mutate(selectedContactMessage.id);
                            setSelectedContactMessage(null);
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="whitespace-pre-wrap">{selectedContactMessage.message}</p>
                      <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                        Recebido em {new Date(selectedContactMessage.created_at).toLocaleDateString('pt-PT', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-96 text-muted-foreground">
                    Selecione uma mensagem para ver
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Campaign Dialog */}
        <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
              <DialogDescription>
                Enviar mensagem para {selectedRecipients.length} aluno(s)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Campanha</Label>
                <Input
                  placeholder="Ex: Lembrete de Pagamento Janeiro"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <Select onValueChange={(id) => {
                  const template = MESSAGE_TEMPLATES.find(t => t.id === id);
                  if (template) setCampaignMessage(template.message);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_TEMPLATES.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Escreva a mensagem da campanha..."
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{nome}'} para personalizar com o nome de cada aluno
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCampaignDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSendCampaign}
                disabled={!campaignMessage || sendBulkWhatsApp.isPending}
                className="gap-2"
              >
                {sendBulkWhatsApp.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar Campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default Communication;
