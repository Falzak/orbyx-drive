
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';

export function useAuthRedirect(redirectTo: string = '/auth') {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate(redirectTo);
    }
  }, [session, navigate, redirectTo]);

  return session;
}
