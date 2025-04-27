import { apiClient } from '@/lib/api';
import { AuthResponse, LoginData, RegisterData, ResetPasswordData, ConfirmResetData, User } from '@/types';

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    console.log('🔐 Attempting login with email:', data.email);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login/', data);
      console.log('✅ Login successful. Response:', response.data);
      console.log('🎫 Setting tokens in localStorage');
      this.setTokens(response.data.tokens);

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
      console.log('👤 Stored user data in localStorage');

      // Convert the response to match our AuthResponse type
      const authResponse: AuthResponse = {
        tokens: response.data.tokens,
        user: {
          id: response.data.user.id,
          email: response.data.user.email,
          first_name: response.data.user.name.split(' ')[0],
          last_name: response.data.user.name.split(' ').slice(1).join(' '),
          role: response.data.user.role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      return authResponse;
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log('📝 Attempting registration for:', data.email);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register/', data);
      console.log('✅ Registration successful. Response:', response.data);
      this.setTokens(response.data.tokens);
      return response.data;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    console.log('🚪 Attempting logout');
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout/', { refresh: refreshToken });
        console.log('✅ Logout API call successful');
      } catch (error) {
        console.error('⚠️ Error during logout API call:', error);
      }
    } else {
      console.log('ℹ️ No refresh token found during logout');
    }
    console.log('🧹 Clearing tokens from localStorage');
    this.clearTokens();
  }

  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post('/auth/password/reset/', { email });
  }

  async resetPassword(data: ResetPasswordData): Promise<void> {
    await apiClient.post('/auth/password/reset/confirm/', data);
  }

  async confirmReset(data: ConfirmResetData): Promise<void> {
    await apiClient.post('/auth/password/reset/complete/', data);
  }

  async getCurrentUser(): Promise<User | null> {
    console.log('👤 Attempting to get current user');
    try {
      if (!this.isAuthenticated()) {
        console.log('❌ Not authenticated - no access token found');
        return null;
      }
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('❌ No access token found');
        return null;
      }
      
      console.log('🔍 Decoding JWT token');
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decodedToken = JSON.parse(jsonPayload);
        console.log('🔍 Decoded token payload:', decodedToken);

        // Get user info from local storage instead of token
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          console.log('❌ No user data in localStorage');
          return null;
        }

        const userData = JSON.parse(userStr);
        console.log('✅ Successfully got user data:', userData);
        return {
          id: userData.id,
          email: userData.email,
          first_name: userData.name.split(' ')[0],
          last_name: userData.name.split(' ').slice(1).join(' '),
          role: userData.role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } catch (error) {
        console.error('❌ Error decoding JWT token:', error);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  async refreshToken(): Promise<AuthResponse | null> {
    console.log('🔄 Attempting to refresh token');
    try {
      const refresh = localStorage.getItem('refresh_token');
      if (!refresh) {
        console.log('❌ No refresh token found in localStorage');
        return null;
      }
      console.log('📤 Sending refresh token request');
      const response = await apiClient.post<{ access: string }>('/auth/token/refresh/', { refresh });
      console.log('📥 Refresh token response:', response.data);
      
      if (response.data.access) {
        console.log('✅ Received new access token');
        localStorage.setItem('access_token', response.data.access);
        console.log('🔍 Getting user info with new token');
        const user = await this.getCurrentUser();
        
        if (!user) {
          console.log('❌ Could not get user info with new token');
          this.clearTokens();
          return null;
        }
        
        console.log('✅ Successfully refreshed token and got user info');
        return {
          tokens: {
            access: response.data.access,
            refresh: refresh
          },
          user
        };
      }
      
      console.log('❌ No access token in refresh response');
      return null;
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      console.log('🧹 Clearing tokens due to refresh error');
      this.clearTokens();
      return null;
    }
  }

  private setTokens(tokens: { access: string; refresh: string }): void {
    console.log('💾 Setting tokens in localStorage');
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    console.log('✅ Tokens set successfully');
  }

  private clearTokens(): void {
    console.log('🧹 Clearing tokens from localStorage');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    console.log('✅ Tokens and user data cleared successfully');
  }

  isAuthenticated(): boolean {
    const hasToken = !!localStorage.getItem('access_token');
    console.log('🔒 Checking authentication status:', hasToken ? 'Authenticated' : 'Not authenticated');
    return hasToken;
  }
}

export const authService = new AuthService(); 