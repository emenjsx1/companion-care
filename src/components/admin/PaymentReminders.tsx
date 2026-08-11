import { useState } from 'react';
import { Bell, Phone, Send, Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/currency';
import { useStudentsWithDebt } from '@/hooks/useFinancials';
import { useSendBulkWhatsApp, MESSAGE_TEMPLATES, replaceTemplateVariables } from '@/hooks/useEvolutionApi';
import { toast } from 'sonner';

const PaymentReminders = () => {
  const { data: studentsWithDebt, isLoading } = useStudentsWithDebt();
  const sendBulk = useSendBulkWhatsApp();
  
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Filter students with phone numbers
  const studentsWithPhone = studentsWithDebt?.filter(s => s.phone) || [];

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(studentsWithPhone.map(s => s.studentId));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    } else {
      setSelectedStudents(prev => [...prev, studentId]);
    }
  };

  const handleSendReminders = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Seleccione pelo menos um aluno');
      return;
    }


    const template = MESSAGE_TEMPLATES.find(t => t.id === 'payment_reminder');
    if (!template) {
      toast.error('Modelo de mensagem não encontrado');
      return;
    }

    const recipients = selectedStudents
      .map(id => {
        const student = studentsWithDebt?.find(s => s.studentId === id);
        if (student?.phone) {
          return {
            phone: student.phone,
            name: student.studentName,
            message: replaceTemplateVariables(template.message, {
              nome: student.studentName,
              valor: formatCurrency(student.totalDebt),
              data: 'o mais breve possível',
            }),
          };
        }
        return null;
      })
      .filter(Boolean) as { phone: string; name: string; message?: string }[];

    if (recipients.length === 0) {
      toast.error('Nenhum aluno selecionado tem telefone válido');
      return;
    }

    await sendBulk.mutateAsync({
      recipients,
      message: template.message,
    });

    setSelectedStudents([]);
    setSelectAll(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-warning" />
          Lembretes de Pagamento
        </CardTitle>
        <CardDescription>
          Envie lembretes automáticos via WhatsApp para alunos com pagamentos pendentes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="select-all" 
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  disabled={studentsWithPhone.length === 0}
                />
                <Label htmlFor="select-all" className="text-sm">
                  Seleccionar todos ({studentsWithPhone.length} com telefone)
                </Label>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {selectedStudents.length} seleccionado(s)
                </span>
                <Button
                  onClick={handleSendReminders}
                  disabled={selectedStudents.length === 0 || sendBulk.isPending}
                  className="gap-2"
                >
                  {sendBulk.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Enviar Lembretes
                </Button>
              </div>
            </div>

            {/* Students Table */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : studentsWithPhone.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum aluno com saldo devedor e telefone registado</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="text-right">Saldo Devedor</TableHead>
                      <TableHead>Último Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsWithPhone.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.studentId)}
                            onCheckedChange={() => handleSelectStudent(student.studentId)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.studentName}</p>
                            <p className="text-xs text-muted-foreground">{student.courseName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatCurrency(student.totalDebt)}
                        </TableCell>
                        <TableCell>
                          {student.lastPaymentDate ? (
                            <span className="text-sm text-muted-foreground">
                              {new Date(student.lastPaymentDate).toLocaleDateString('pt-PT')}
                            </span>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Nunca pagou</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Message Preview */}
            <div className="p-4 bg-muted/30 rounded-lg border">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Mensagem que será enviada:
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {MESSAGE_TEMPLATES.find(t => t.id === 'payment_reminder')?.message
                  .replace('{nome}', '[Nome do Aluno]')
                  .replace('{valor}', '[Valor Pendente]')
                  .replace('{data}', 'o mais breve possível')}
              </p>
            </div>
      </CardContent>
    </Card>
  );
};

export default PaymentReminders;