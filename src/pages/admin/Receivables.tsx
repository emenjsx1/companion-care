import { useMemo, useState } from 'react';
import { Wallet, AlertTriangle, Download, FileText, Loader2, Search, Pencil, TrendingUp, Users, CheckCircle2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { downloadCSV, downloadTablePDF } from '@/lib/exportTable';
import { useReceivables, useUpdateStudentFee, useOrphanProfiles, LedgerRow } from '@/hooks/useReceivables';
import { useManagementReport, useDataQuality } from '@/hooks/useManagementReports';

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => `${new Date().toISOString().slice(0, 7)}-01`;

type FilterKind = 'devedores' | 'liquidados' | 'sem-valor' | 'todos';

const Receivables = () => {
  const { toast } = useToast();
  const { data: rows = [], isLoading } = useReceivables();
  const updateFee = useUpdateStudentFee();
  const { data: orphans = [] } = useOrphanProfiles();
  const { data: quality } = useDataQuality();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKind>('devedores');
  const [editing, setEditing] = useState<LedgerRow | null>(null);
  const [feeValue, setFeeValue] = useState('');
  const [discountValue, setDiscountValue] = useState('');

  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const { data: report } = useManagementReport(from, to);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter === 'devedores') return r.balance > 0;
        if (filter === 'liquidados') return r.totalDue > 0 && r.balance <= 0;
        if (filter === 'sem-valor') return r.totalDue <= 0;
        return true;
      })
      .filter((r) => !term || r.name.toLowerCase().includes(term) || (r.phone ?? '').includes(term))
      .sort((a, b) => b.balance - a.balance);
  }, [rows, filter, search]);

  const totals = useMemo(() => ({
    due: rows.reduce((s, r) => s + r.totalDue, 0),
    paid: rows.reduce((s, r) => s + r.totalPaid, 0),
    debt: rows.reduce((s, r) => s + Math.max(0, r.balance), 0),
    debtors: rows.filter((r) => r.balance > 0).length,
    noFee: rows.filter((r) => r.totalDue <= 0).length,
  }), [rows]);

  const ledgerHeaders = ['Aluno', 'Curso', 'Filial', 'Valor devido', 'Pago', 'Saldo', 'Últ. pagamento', 'Telefone'];
  const ledgerRows = () => filtered.map((r) => [
    r.name,
    r.courseName ?? '—',
    r.branch ?? '—',
    r.totalDue,
    r.totalPaid,
    r.balance,
    r.lastPaymentDate ? new Date(r.lastPaymentDate).toLocaleDateString('pt-PT') : '—',
    r.phone ?? '—',
  ]);

  const openEdit = (row: LedgerRow) => {
    setEditing(row);
    setFeeValue(row.agreedFee !== null ? String(row.agreedFee) : '');
    setDiscountValue(String(row.discount || 0));
  };

  const saveFee = async () => {
    if (!editing) return;
    try {
      await updateFee.mutateAsync({
        studentId: editing.studentId,
        agreedFee: feeValue.trim() === '' ? null : Number(feeValue),
        discount: Number(discountValue) || 0,
      });
      toast({ title: 'Valores actualizados', description: `Conta-corrente de ${editing.name} actualizada.` });
      setEditing(null);
    } catch (e) {
      toast({ title: 'Erro ao guardar', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const breakdownCard = (title: string, data: { label: string; count: number; total: number }[] = []) => (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem dados no período.</p>
        ) : (
          <Table>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.label}>
                  <TableCell className="font-medium">{d.label}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{d.count}x</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(d.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Conta-Corrente e Relatórios</h1>
          <p className="text-muted-foreground">Quanto cada aluno deve, quem está em atraso e relatórios de gestão.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4" />Valor total dos cursos</p>
            <p className="text-2xl font-bold">{formatCurrency(totals.due)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Total recebido</p>
            <p className="text-2xl font-bold text-success">{formatCurrency(totals.paid)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Em dívida</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totals.debt)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <p className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" />Alunos com dívida</p>
            <p className="text-2xl font-bold">{totals.debtors}</p>
          </CardContent></Card>
        </div>

        {totals.noFee > 0 && (
          <Card className="border-warning">
            <CardContent className="pt-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium">{totals.noFee} alunos sem valor de curso definido</p>
                <p className="text-sm text-muted-foreground">Sem curso atribuído ou com preço 0, a dívida não pode ser calculada. Defina o valor acordado em cada ficha.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="ledger">
          <TabsList>
            <TabsTrigger value="ledger">Conta-corrente</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="quality">Qualidade dos dados</TabsTrigger>
          </TabsList>

          <TabsContent value="ledger" className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Procurar aluno ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterKind)}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="devedores">Com dívida</SelectItem>
                  <SelectItem value="liquidados">Liquidados</SelectItem>
                  <SelectItem value="sem-valor">Sem valor definido</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => downloadCSV('conta-corrente', ledgerHeaders, ledgerRows())}>
                <Download className="h-4 w-4 mr-2" />Excel/CSV
              </Button>
              <Button variant="outline" onClick={() => downloadTablePDF('conta-corrente', 'Conta-Corrente de Alunos', ledgerHeaders, ledgerRows().map((r) => r.map((c, i) => ([3, 4, 5].includes(i) ? formatCurrency(Number(c)) : c))))}>
                <FileText className="h-4 w-4 mr-2" />PDF
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{filtered.length} registos</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {isLoading ? (
                  <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Curso</TableHead>
                        <TableHead className="text-right">Valor devido</TableHead>
                        <TableHead className="text-right">Pago</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead>Último pagamento</TableHead>
                        <TableHead className="text-right">Acção</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r) => (
                        <TableRow key={r.studentId} className={r.balance > 0 ? 'bg-destructive/5' : undefined}>
                          <TableCell>
                            <p className="font-medium">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.phone ?? 'sem telefone'}{r.branch ? ` · ${r.branch}` : ''}</p>
                          </TableCell>
                          <TableCell className="text-sm">{r.courseName ?? <span className="text-muted-foreground">Sem curso</span>}</TableCell>
                          <TableCell className="text-right">{formatCurrency(r.totalDue)}{r.discount > 0 && <span className="block text-xs text-muted-foreground">desc. {formatCurrency(r.discount)}</span>}</TableCell>
                          <TableCell className="text-right text-success">{formatCurrency(r.totalPaid)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {r.balance > 0
                              ? <span className="text-destructive">{formatCurrency(r.balance)}</span>
                              : <Badge variant="secondary">Liquidado</Badge>}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.lastPaymentDate ? (
                              <>
                                {new Date(r.lastPaymentDate).toLocaleDateString('pt-PT')}
                                {r.balance > 0 && r.daysSinceLastPayment !== null && r.daysSinceLastPayment > 30 && (
                                  <span className="block text-xs text-destructive">há {r.daysSinceLastPayment} dias</span>
                                )}
                              </>
                            ) : <span className="text-destructive">nunca pagou</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filtered.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum registo.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div><Label>De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div><Label>Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              <Button variant="outline" onClick={() => report && downloadCSV(
                `relatorio-${from}-a-${to}`,
                ['Categoria', 'Item', 'Nº', 'Total'],
                [
                  ...report.byMethod.map((d) => ['Método', d.label, d.count, d.total]),
                  ...report.byBranch.map((d) => ['Filial', d.label, d.count, d.total]),
                  ...report.byCourse.map((d) => ['Curso', d.label, d.count, d.total]),
                  ...report.byMonth.map((d) => ['Mês', d.label, d.count, d.total]),
                ] as (string | number)[][],
              )}><Download className="h-4 w-4 mr-2" />Excel/CSV</Button>
              <Button variant="outline" onClick={() => report && downloadTablePDF(
                `relatorio-${from}-a-${to}`,
                'Relatório de Gestão',
                ['Categoria', 'Item', 'Nº', 'Total'],
                [
                  ...report.byMethod.map((d) => ['Método', d.label, d.count, formatCurrency(d.total)]),
                  ...report.byBranch.map((d) => ['Filial', d.label, d.count, formatCurrency(d.total)]),
                  ...report.byCourse.map((d) => ['Curso', d.label, d.count, formatCurrency(d.total)]),
                  ...report.byMonth.map((d) => ['Mês', d.label, d.count, formatCurrency(d.total)]),
                ] as (string | number)[][],
                `Período: ${from} a ${to}`,
              )}><FileText className="h-4 w-4 mr-2" />PDF</Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />Recebido no período</p><p className="text-2xl font-bold text-success">{formatCurrency(report?.totalPaid ?? 0)}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pendente no período</p><p className="text-2xl font-bold text-warning">{formatCurrency(report?.totalPending ?? 0)}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pagamentos</p><p className="text-2xl font-bold">{report?.paymentCount ?? 0}</p></CardContent></Card>
              <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Novos alunos</p><p className="text-2xl font-bold">{report?.newStudents ?? 0}</p></CardContent></Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {breakdownCard('Por método de pagamento', report?.byMethod)}
              {breakdownCard('Por filial', report?.byBranch)}
              {breakdownCard('Por curso', report?.byCourse)}
              {breakdownCard('Por mês', report?.byMonth)}
            </div>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Perfis sem ficha de aluno ({orphans.length})</CardTitle>
                <CardDescription>Contas criadas que nunca foram ligadas a um aluno. Reveja e decida caso a caso.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Telefone</TableHead><TableHead>Criado</TableHead><TableHead>Tipo</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {orphans.map((o) => (
                      <TableRow key={o.userId}>
                        <TableCell className="font-medium">{o.name}</TableCell>
                        <TableCell className="text-sm">{o.email}</TableCell>
                        <TableCell className="text-sm">{o.phone ?? '—'}</TableCell>
                        <TableCell className="text-sm">{new Date(o.createdAt).toLocaleDateString('pt-PT')}</TableCell>
                        <TableCell>{o.isStaff ? <Badge variant="secondary">Equipa</Badge> : <Badge variant="outline">Sem ficha</Badge>}</TableCell>
                      </TableRow>
                    ))}
                    {orphans.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Nada a rever.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              {([
                ['Alunos sem documento (BI)', quality?.noDocument],
                ['Alunos sem curso atribuído', quality?.noCourse],
                ['Alunos sem telefone', quality?.noPhone],
                ['Alunos sem qualquer pagamento', quality?.noPayments],
              ] as const).map(([title, list]) => (
                <Card key={title}>
                  <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">{title} ({list?.length ?? 0})</CardTitle>
                    {!!list?.length && (
                      <Button size="sm" variant="ghost" onClick={() => downloadCSV(title.toLowerCase().replace(/\s+/g, '-'), ['Aluno'], list.map((l) => [l.name]))}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-48 overflow-y-auto text-sm space-y-1">
                      {(list ?? []).slice(0, 200).map((l) => <p key={l.id} className="text-muted-foreground">{l.name}</p>)}
                      {!list?.length && <p className="text-muted-foreground">Tudo em ordem.</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valor do curso — {editing?.name}</DialogTitle>
            <DialogDescription>
              Preço do curso: {formatCurrency(editing?.coursePrice ?? 0)}. Deixe o valor acordado vazio para usar o preço do curso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Valor acordado (MT)</Label><Input type="number" value={feeValue} onChange={(e) => setFeeValue(e.target.value)} placeholder="Usar preço do curso" /></div>
            <div><Label>Desconto (MT)</Label><Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveFee} disabled={updateFee.isPending}>
              {updateFee.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Receivables;
