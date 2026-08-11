import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertTriangle, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isLoading, signOut } = useAuth();
  // Cached role check: a single fast DB read, reused across every admin page.
  const {
    data: adminAllowed,
    isPending: adminCheckPending,
    error: adminQueryError,
  } = useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: requireAdmin && !!user?.id,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const adminError = adminQueryError
    ? (adminQueryError as Error).message || 'Erro desconhecido ao verificar permissões'
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">A verificar sessão...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  if (requireAdmin) {
    if (adminCheckPending) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">A verificar permissões...</p>
          </div>
        </div>
      );
    }

    if (!adminAllowed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md px-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground">
              {adminError ? `Erro na validação: ${adminError}` : 'A sua conta está autenticada, mas não tem permissões de administrador.'}
            </p>
            <div className="mt-5 grid gap-3">
              <Button
                type="button"
                className="w-full gap-2"
                onClick={async () => {
                  await signOut();
                }}
              >
                <LogOut className="h-4 w-4" />
                Sair e tentar novamente
              </Button>
              <p className="text-xs text-muted-foreground">
                Conta actual: <span className="font-medium">{user.email}</span>
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
