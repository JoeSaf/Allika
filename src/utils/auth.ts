import { apiService } from "@/services/api";
import { STORAGE_KEYS } from "@/constants";
import { setLocalStorage, getLocalStorage, removeLocalStorage } from "@/utils/helpers";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const isUserLoggedIn = (): boolean => {
  const token = getLocalStorage<string>(STORAGE_KEYS.AUTH_TOKEN);
  return !!token;
};

export const getCurrentUser = (): User | null => {
  return getLocalStorage<User>(STORAGE_KEYS.USER_DATA);
};

export const getAuthToken = (): string | null => {
  return getLocalStorage<string>(STORAGE_KEYS.AUTH_TOKEN);
};

export const logoutUser = (): void => {
  removeLocalStorage(STORAGE_KEYS.USER_DATA);
  removeLocalStorage(STORAGE_KEYS.AUTH_TOKEN);

  // Clear any event-related data
  removeLocalStorage("alika_current_event");
  removeLocalStorage("alika_event_creation_lock");
  removeLocalStorage("alika_event_timestamp");
  removeLocalStorage("alika_event_session");

  // Clear sessionStorage
  sessionStorage.removeItem("alika_current_event");
  sessionStorage.removeItem("alika_event_session");

  // Clear window properties
  if ((window as any).alikaCurrentEventId) {
    delete (window as any).alikaCurrentEventId;
  }
  if ((window as any).alikaEventSession) {
    delete (window as any).alikaEventSession;
  }
};

export const requireLogin = (returnUrl?: string): string => {
  const params = new URLSearchParams();
  if (returnUrl) {
    params.set("returnUrl", returnUrl);
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
        message: response.message || "Registration successful",
      };
    } else {
      throw new Error(response.message || "Registration failed");
    }
  } catch (error) {
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
      setLocalStorage(STORAGE_KEYS.USER_DATA, user);
      setLocalStorage(STORAGE_KEYS.AUTH_TOKEN, token);

      // Clear any stale event IDs that might cause access issues
      const currentEventId = getLocalStorage<string>("alika_current_event");
      if (currentEventId) {
        removeLocalStorage("alika_current_event");
      }

      // Clear event creation locks
      removeLocalStorage("alika_event_creation_lock");
      removeLocalStorage("alika_event_timestamp");
      removeLocalStorage("alika_event_session");

      // Clear sessionStorage as well
      sessionStorage.removeItem("alika_current_event");
      sessionStorage.removeItem("alika_event_session");

      // Clear window properties
      if ((window as any).alikaCurrentEventId) {
        delete (window as any).alikaCurrentEventId;
      }
      if ((window as any).alikaEventSession) {
        delete (window as any).alikaEventSession;
      }

      return { user, token };
    } else {
      throw new Error(response.message || "Login failed");
    }
  } catch (error) {
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
      setLocalStorage(STORAGE_KEYS.USER_DATA, user);

      return user;
    } else {
      // Token might be invalid, clear storage
      logoutUser();
      return null;
    }
  } catch (error) {
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
      throw new Error(response.message || "Password change failed");
    }
  } catch (error) {
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
    return user; // Return cached user data if refresh fails
  }
};
