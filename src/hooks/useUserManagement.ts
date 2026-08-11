import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  user_id: string;
  role: 'admin' | 'instructor';
  full_name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export interface CreateAdminUserData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: 'admin' | 'instructor';
}

// Fetch all admin and instructor users
export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get all user_roles with admin or instructor role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'instructor']);

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) return [];

      // Get profiles for these users
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Get emails from auth.users via edge function
      let authEmails: Record<string, string> = {};
      try {
        const { data: emailsData, error: emailsError } = await supabase.functions.invoke('get-user-emails', {
          body: { user_ids: userIds },
        });
        if (!emailsError && emailsData?.emails) {
          authEmails = emailsData.emails;
        }
      } catch (error) {
        console.warn('Failed to fetch emails from auth.users:', error);
      }

      // Combine data
      const users: AdminUser[] = roles.map((role) => {
        const profile = profiles?.find((p) => p.user_id === role.user_id);
        // Use email from profile first, fallback to auth.users email
        const email = profile?.email || authEmails[role.user_id] || '';
        return {
          id: role.id,
          user_id: role.user_id,
          role: role.role as 'admin' | 'instructor',
          full_name: profile?.full_name || 'Sem nome',
          email: email,
          phone: profile?.phone || undefined,
          created_at: role.id, // Using role id as we don't have created_at on user_roles
        };
      });

      return users;
    },
  });
};

// Create new admin/instructor user
export const useCreateAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAdminUserData) => {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar utilizador');

      const userId = authData.user.id;

      // 2. Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: userId,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
      });

      if (profileError) {
        console.error('Profile error:', profileError);
        // Don't throw, profile might be created by trigger
      }

      // 3. Assign role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: data.role,
      });

      if (roleError) throw roleError;

      return { userId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Utilizador criado com sucesso');
    },
    onError: (error: Error) => {
      console.error('Error creating admin user:', error);
      toast.error(`Erro ao criar utilizador: ${error.message}`);
    },
  });
};

// Update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'admin' | 'instructor' }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Permissão actualizada');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao actualizar permissão: ${error.message}`);
    },
  });
};

// Delete user role (removes access but keeps auth account)
export const useDeleteUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Acesso removido com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover acesso: ${error.message}`);
    },
  });
};
