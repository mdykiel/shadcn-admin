import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

export const useAuth = () => {
  const authStore = useAuthStore();

  useEffect(() => {
    if (!authStore.user && !authStore.isLoading) {
      authStore.initializeAuth();
    }
  }, []);

  return authStore;
};