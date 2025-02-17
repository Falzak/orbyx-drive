
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAuthRedirect(redirectTo: string = '/auth', requireAdmin: boolean = false) {
  const { session } = useAuth();
  const navigate = useNavigate();

  const { data: isAdmin } = useQuery({
    queryKey: ['user-role', session?.user.id],
    queryFn: async () => {
      if (!session) return false;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      return !!data;
    },
    enabled: !!session && requireAdmin,
  });

  useEffect(() => {
    if (!session) {
      navigate(redirectTo);
    } else if (requireAdmin && isAdmin === false) {
      navigate('/');
    }
  }, [session, navigate, redirectTo, requireAdmin, isAdmin]);

  return session;
}
