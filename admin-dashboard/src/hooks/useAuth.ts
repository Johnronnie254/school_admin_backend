import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

export function useAuth() {
  const router = useRouter();

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Redirect to login page
      router.push('/login');
    }
  };

  return { logout };
} 