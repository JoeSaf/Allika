import { apiService } from '@/services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const isUserLoggedIn = (): boolean => {
  const token = localStorage.getItem('alika_token');
  return !!token;
};

export const getCurrentUser = (): User | null => {
  const userData = localStorage.getItem('alika_user');
  if (!userData) return null;
  
  try {
    return JSON.parse(userData) as User;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('alika_token');
};

export const logoutUser = (): void => {
  localStorage.removeItem('alika_user');
  localStorage.removeItem('alika_token');
};

export const requireLogin = (returnUrl?: string): string => {
  const params = new URLSearchParams();
  if (returnUrl) {
    params.set('returnUrl', returnUrl);
  }
  return `/login?${params.toString()}`;
};

// Backend authentication functions
export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiService.register(userData);
    
    if (response.success) {
      return { 
        success: true, 
        message: response.message || 'Registration successful' 
      };
    } else {
      throw new Error(response.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const loginUser = async (credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  try {
    const response = await apiService.login(credentials);
    
    if (response.success && response.data) {
      const { user, token } = response.data;
      
      // Store user data and token
      localStorage.setItem('alika_user', JSON.stringify(user));
      localStorage.setItem('alika_token', token);
      
      return { user, token };
    } else {
      throw new Error(response.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    const response = await apiService.getCurrentUser();
    
    if (response.success && response.data) {
      const user = response.data.user;
      
      // Update stored user data
      localStorage.setItem('alika_user', JSON.stringify(user));
      
      return user;
    } else {
      // Token might be invalid, clear storage
      logoutUser();
      return null;
    }
  } catch (error) {
    console.error('Fetch current user error:', error);
    // Token might be invalid, clear storage
    logoutUser();
    return null;
  }
};

export const changePassword = async (passwords: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  try {
    const response = await apiService.changePassword(passwords);
    
    if (!response.success) {
      throw new Error(response.message || 'Password change failed');
    }
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

// Check if token is valid and refresh user data if needed
export const validateAndRefreshUser = async (): Promise<User | null> => {
  const user = getCurrentUser();
  const token = getAuthToken();
  
  if (!user || !token) {
    return null;
  }
  
  // Try to fetch fresh user data
  try {
    const freshUser = await fetchCurrentUser();
    return freshUser;
  } catch (error) {
    console.error('Failed to refresh user data:', error);
    return user; // Return cached user data if refresh fails
  }
};
