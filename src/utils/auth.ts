
export interface User {
  name: string;
  email: string;
  phone?: string;
  loginTime: string;
}

export const isUserLoggedIn = (): boolean => {
  const userData = localStorage.getItem('alika_user');
  return !!userData;
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

export const logoutUser = (): void => {
  localStorage.removeItem('alika_user');
};

export const requireLogin = (returnUrl?: string): string => {
  const params = new URLSearchParams();
  if (returnUrl) {
    params.set('returnUrl', returnUrl);
  }
  return `/login?${params.toString()}`;
};
