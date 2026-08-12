import { useMemo, useState } from 'react';
import { Plus, Trash2, TrendingDown, TrendingUp, Wallet, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { usePayments } from '@/hooks/usePayments';
import { formatCurrency } from '@/lib/currency';

const today = () => new Date().toISOString().split('T')[0];
const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

const Expenses = () => {
  const [range, setRange] = useState({ startDate: firstOfMonth(), endDate: today() });
  const { data: expenses, isLoading } = useExpenses(range);
  const { data: payments } = usePayments(range);
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', reason: '', expense_date: today(), notes: '' });

  const totalOut = useMemo(() => (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0), [expenses]);
  const totalIn = useMemo(
    () => (payments ?? []).filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
    [payments],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses ?? []) map.set(e.expense_date, (map.get(e.expense_date) ?? 0) + Number(e.amount));
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createExpense.mutateAsync({
      amount: parseFloat(form.amount),
      reason: form.reason,
      expense_date: form.expense_date,
      notes: form.notes || null,
    });
    setIsOpen(false);
    setForm({ amount: '', reason: '', expense_date: today(), notes: '' });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Registo de Saídas</h1>
            <p className="text-muted-foreground">Controlo das saídas de dinheiro do dia-a-dia</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Registar Saída
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Registar Saída</DialogTitle>
                <DialogDescription>Valor, motivo e data da saída de dinheiro</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor da saída (MT) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense_date">Data da saída *</Label>
                    <Input
                      id="expense_date"
                      type="date"
                      value={form.expense_date}
                      onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo da saída *</Label>
                  <Input
                    id="reason"
                    placeholder="Ex: Combustível, salários, manutenção"
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createExpense.isPending}>
                    {createExpense.isPending ? 'A guardar...' : 'Guardar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6 flex flex-col sm:flex-row gap-4">
            <div className="space-y-1">
              <Label>De</Label>
              <Input type="date" value={range.startDate} onChange={(e) => setRange({ ...range, startDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Até</Label>
              <Input type="date" value={range.endDate} onChange={(e) => setRange({ ...range, endDate: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Entradas (pagamentos)</div>
                <div className="text-2xl font-bold text-success">{formatCurrency(totalIn)}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Saídas</div>
                <div className="text-2xl font-bold text-destructive">{formatCurrency(totalOut)}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Saldo do período</div>
                <div className="text-2xl font-bold">{formatCurrency(totalIn - totalOut)}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Saídas do período ({expenses?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(expenses ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhuma saída registada neste período.
                      </TableCell>
                    </TableRow>
                  )}
                  {(expenses ?? []).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{new Date(e.expense_date).toLocaleDateString('pt-PT')}</TableCell>
                      <TableCell className="font-medium">{e.reason}</TableCell>
                      <TableCell className="text-muted-foreground">{e.notes || '-'}</TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        -{formatCurrency(Number(e.amount))}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteExpense.mutate(e.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {byDay.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Total por dia</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead className="text-right">Total de saídas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byDay.map(([day, total]) => (
                    <TableRow key={day}>
                      <TableCell>{new Date(day).toLocaleDateString('pt-PT')}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Expenses;
