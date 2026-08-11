import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
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
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);
  const [adminAllowed, setAdminAllowed] = useState<boolean | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let retryTimer: number | null = null;
    let attempts = 0;

    const isAbort = (e: unknown) => {
      const anyErr = e as any;
      const msg = `${anyErr?.message || ''} ${anyErr?.details || ''}`;
      return msg.includes('AbortError');
    };

    const run = async () => {
      if (!requireAdmin) return;
      if (!user) {
        if (mounted) {
          setAdminAllowed(null);
          setAdminError(null);
        }
        return;
      }

      setAdminCheckLoading(true);
      setAdminError(null);

      try {
        const { data, error } = await supabase.functions.invoke('is-admin');
        if (error) throw error;

        if (!mounted) return;
        setAdminAllowed(!!data?.isAdmin);
      } catch (e) {
        if (!mounted) return;

        // Sometimes requests are aborted during navigation/session refresh; retry a few times.
        if (isAbort(e) && attempts < 4) {
          attempts += 1;
          setAdminAllowed(null);
          retryTimer = window.setTimeout(run, 500 * attempts);
          return;
        }

        const anyErr = e as any;
        const msg = [anyErr?.message, anyErr?.details].filter(Boolean).join(' - ') ||
          'Erro desconhecido ao verificar permissões';
        setAdminError(msg);
        setAdminAllowed(false);
      } finally {
        if (mounted) setAdminCheckLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [requireAdmin, user?.id]);

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
    if (adminCheckLoading || adminAllowed === null) {
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
