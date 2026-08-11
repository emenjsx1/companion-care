import { useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Student } from '@/hooks/useStudents';

interface DuplicateGroup {
  key: string;
  reason: string;
  students: Student[];
}

const norm = (v?: string | null) => (v || '').trim().toLowerCase().replace(/\s+/g, ' ');

export const findDuplicateGroups = (students: Student[]): DuplicateGroup[] => {
  const groups: DuplicateGroup[] = [];
  const used = new Set<string>();

  const build = (getKey: (s: Student) => string, reason: string) => {
    const map = new Map<string, Student[]>();
    for (const s of students) {
      const k = getKey(s);
      if (!k) continue;
      map.set(k, [...(map.get(k) || []), s]);
    }
    for (const [k, list] of map) {
      const fresh = list.filter(s => !used.has(s.id));
      if (fresh.length < 2) continue;
      fresh.forEach(s => used.add(s.id));
      // keep the oldest record first
      fresh.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      groups.push({ key: `${reason}-${k}`, reason, students: fresh });
    }
  };

  build(s => norm(s.document_number), 'Mesmo nº de documento (BI)');
  build(s => norm(s.profile?.full_name), 'Mesmo nome');

  return groups;
};

const useMergeDuplicates = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keep, remove }: { keep: Student; remove: Student[] }) => {
      for (const dup of remove) {
        // move financial/exam history to the kept record so nothing is lost
        await supabase.from('payments').update({ student_id: keep.id }).eq('student_id', dup.id);
        await supabase.from('exams').update({ student_id: keep.id }).eq('student_id', dup.id);

        const { error } = await supabase.from('students').delete().eq('id', dup.id);
        if (error) throw error;

        if (dup.user_id && dup.user_id !== keep.user_id) {
          await supabase.from('profiles').delete().eq('user_id', dup.user_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Duplicados removidos — ficou apenas 1 registo');
    },
    onError: (e: Error) => toast.error(`Erro ao remover duplicados: ${e.message}`),
  });
};

export const DuplicateStudentsAlert = ({ students }: { students: Student[] }) => {
  const groups = useMemo(() => findDuplicateGroups(students), [students]);
  const merge = useMergeDuplicates();
  const [keepMap, setKeepMap] = useState<Record<string, string>>({});

  if (groups.length === 0) return null;

  const totalExtras = groups.reduce((sum, g) => sum + g.students.length - 1, 0);

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {groups.length} possível(is) duplicado(s) detectado(s)
        </CardTitle>
        <CardDescription>
          Escolha o registo a manter em cada grupo e remova os restantes ({totalExtras} registo(s) a mais).
          Os pagamentos e exames dos removidos são transferidos para o registo mantido.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.map(group => {
          const keepId = keepMap[group.key] || group.students[0].id;
          const keep = group.students.find(s => s.id === keepId)!;
          const remove = group.students.filter(s => s.id !== keepId);

          return (
            <div key={group.key} className="rounded-lg border bg-background p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{group.students[0].profile?.full_name || 'Sem nome'}</span>
                  <Badge variant="outline">{group.reason}</Badge>
                  <Badge variant="destructive">{group.students.length} registos</Badge>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" disabled={merge.isPending}>
                      {merge.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Manter 1 e remover {remove.length}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover duplicados?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Vai manter o registo de <strong>{keep.profile?.full_name}</strong> criado em{' '}
                        {new Date(keep.created_at).toLocaleDateString('pt-MZ')} e eliminar {remove.length} registo(s).
                        Pagamentos e exames dos duplicados passam para o registo mantido. Esta acção não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => merge.mutate({ keep, remove })}
                      >
                        Remover duplicados
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="grid gap-2">
                {group.students.map(s => (
                  <label
                    key={s.id}
                    className="flex flex-wrap items-center gap-3 rounded-md border p-2 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={group.key}
                      checked={s.id === keepId}
                      onChange={() => setKeepMap(prev => ({ ...prev, [group.key]: s.id }))}
                    />
                    <span className="font-medium">{s.profile?.full_name || 'Sem nome'}</span>
                    <span className="text-muted-foreground">{s.profile?.phone || 'sem telefone'}</span>
                    <span className="text-muted-foreground">{s.document_number || 'sem BI'}</span>
                    <span className="text-muted-foreground">
                      criado em {new Date(s.created_at).toLocaleDateString('pt-MZ')}
                    </span>
                    {s.id === keepId && <Badge variant="secondary">Manter</Badge>}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
