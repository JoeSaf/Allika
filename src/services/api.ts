// API service for communicating with the backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success?: boolean;
  error?: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
    value: any;
  }>;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get token from localStorage
    const token = localStorage.getItem('alika_token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<ApiResponse<{ user: any; token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: any; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: any }>> {
    return this.request('/auth/me');
  }

  async changePassword(passwords: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords),
    });
  }

  // Events endpoints
  async createEvent(eventData: {
    title: string;
    type: string;
    date: string;
    time?: string;
    venue?: string;
    reception?: string;
    receptionTime?: string;
    theme?: string;
    rsvpContact?: string;
    additionalInfo?: string;
    invitingFamily?: string;
  }): Promise<ApiResponse<{ event: any }>> {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async getEvents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<{ events: any[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/events?${queryString}` : '/events';
    
    return this.request(endpoint);
  }

  async getEvent(eventId: string): Promise<ApiResponse<{ event: any }>> {
    return this.request(`/events/${eventId}`);
  }

  async updateEvent(
    eventId: string,
    eventData: Partial<{
      title: string;
      type: string;
      date: string;
      time: string;
      venue: string;
      reception: string;
      receptionTime: string;
      theme: string;
      rsvpContact: string;
      additionalInfo: string;
      invitingFamily: string;
      status: 'draft' | 'active' | 'completed';
    }>
  ): Promise<ApiResponse<{ event: any }>> {
    return this.request(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(eventId: string): Promise<ApiResponse> {
    return this.request(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async updateInvitationData(
    eventId: string,
    invitationData: {
      coupleName?: string;
      eventDate?: string;
      eventTime?: string;
      venue?: string;
      reception?: string;
      receptionTime?: string;
      theme?: string;
      rsvpContact?: string;
      additionalInfo?: string;
      invitingFamily?: string;
      guestName?: string;
      invitationImage?: string;
    }
  ): Promise<ApiResponse> {
    return this.request(`/events/${eventId}/invitation-data`, {
      method: 'POST',
      body: JSON.stringify(invitationData),
    });
  }

  async updateRsvpSettings(
    eventId: string,
    rsvpSettings: {
      title?: string;
      subtitle?: string;
      location?: string;
      welcomeMessage?: string;
      confirmText?: string;
      declineText?: string;
      guestCountEnabled?: boolean;
      guestCountLabel?: string;
      guestCountOptions?: string[];
      specialRequestsEnabled?: boolean;
      specialRequestsLabel?: string;
      specialRequestsPlaceholder?: string;
      additionalFields?: Array<{
        id: string;
        label: string;
        type: 'text' | 'textarea' | 'select';
        required: boolean;
        options?: string[];
      }>;
      submitButtonText?: string;
      thankYouMessage?: string;
      backgroundColor?: string;
      textColor?: string;
      buttonColor?: string;
      accentColor?: string;
      rsvpContact?: string;
    }
  ): Promise<ApiResponse> {
    return this.request(`/events/${eventId}/rsvp-settings`, {
      method: 'POST',
      body: JSON.stringify(rsvpSettings),
    });
  }

  // Guests endpoints
  async addGuest(
    eventId: string,
    guestData: {
      name: string;
      email?: string;
      phone?: string;
      tableNumber?: string;
      guestCount?: number;
      specialRequests?: string;
    }
  ): Promise<ApiResponse<{ guest: any }>> {
    return this.request(`/guests/${eventId}`, {
      method: 'POST',
      body: JSON.stringify(guestData),
    });
  }

  async addGuestsBulk(
    eventId: string,
    guests: Array<{
      name: string;
      email?: string;
      phone?: string;
      tableNumber?: string;
      guestCount?: number;
      specialRequests?: string;
    }>
  ): Promise<ApiResponse<{ createdGuests: any[]; errors?: any[] }>> {
    return this.request(`/guests/${eventId}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ guests }),
    });
  }

  async uploadGuestsCSV(eventId: string, file: File): Promise<ApiResponse<{ createdGuests: any[]; errors?: any[] }>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('alika_token');
    
    const response = await fetch(`${this.baseURL}/guests/${eventId}/upload-csv`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async getGuests(
    eventId: string,
    params?: {
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<ApiResponse<{ guests: any[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/guests/${eventId}?${queryString}` : `/guests/${eventId}`;
    
    return this.request(endpoint);
  }

  async updateGuest(
    eventId: string,
    guestId: string,
    guestData: Partial<{
      name: string;
      email: string;
      phone: string;
      tableNumber: string;
      guestCount: number;
      specialRequests: string;
    }>
  ): Promise<ApiResponse<{ guest: any }>> {
    return this.request(`/guests/${eventId}/${guestId}`, {
      method: 'PUT',
      body: JSON.stringify(guestData),
    });
  }

  async deleteGuest(eventId: string, guestId: string): Promise<ApiResponse> {
    return this.request(`/guests/${eventId}/${guestId}`, {
      method: 'DELETE',
    });
  }

  async exportGuestsCSV(eventId: string): Promise<Blob> {
    const token = localStorage.getItem('alika_token');
    
    const response = await fetch(`${this.baseURL}/guests/${eventId}/export-csv`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.blob();
  }

  // RSVP endpoints (public)
  async getRsvpInfo(token: string): Promise<ApiResponse<{
    guest: any;
    event: any;
    rsvpSettings: any;
    hasResponded: boolean;
    lastResponse: any;
  }>> {
    return this.request(`/rsvp/${token}`);
  }

  async submitRsvp(
    token: string,
    rsvpData: {
      response: 'confirmed' | 'declined';
      guestCount?: number;
      specialRequests?: string;
      additionalFields?: Record<string, any>;
    }
  ): Promise<ApiResponse<{ guest: any; response: any }>> {
    return this.request(`/rsvp/${token}`, {
      method: 'POST',
      body: JSON.stringify(rsvpData),
    });
  }

  async getRsvpQrCode(token: string): Promise<ApiResponse<{ qrCode: string }>> {
    return this.request(`/rsvp/${token}/qr-code`);
  }

  async getRsvpStatus(token: string): Promise<ApiResponse<{
    guest: any;
    event: any;
    response: any;
  }>> {
    return this.request(`/rsvp/${token}/status`);
  }

  // Check-in endpoints
  async checkInGuest(token: string, notes?: string): Promise<ApiResponse<{ guest: any; checkInLog: any }>> {
    return this.request('/checkin', {
      method: 'POST',
      body: JSON.stringify({ token, notes }),
    });
  }

  async checkInGuestQr(qrData: string): Promise<ApiResponse<{ guest: any; checkInLog: any }>> {
    return this.request('/checkin/qr-scan', {
      method: 'POST',
      body: JSON.stringify({ qrData }),
    });
  }

  async checkInGuestManual(
    eventId: string,
    guestId: string,
    notes?: string
  ): Promise<ApiResponse<{ guest: any; checkInLog: any }>> {
    return this.request(`/checkin/${eventId}/${guestId}`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async getCheckInLogs(
    eventId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiResponse<{ logs: any[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/checkin/${eventId}/logs?${queryString}` : `/checkin/${eventId}/logs`;
    
    return this.request(endpoint);
  }

  async getCheckInSummary(eventId: string): Promise<ApiResponse<{
    statistics: any;
    recentCheckins: any[];
    checkInRate: number;
  }>> {
    return this.request(`/checkin/${eventId}/summary`);
  }

  async undoCheckIn(
    eventId: string,
    guestId: string,
    reason?: string
  ): Promise<ApiResponse<{ guest: any }>> {
    return this.request(`/checkin/${eventId}/${guestId}/undo`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Messaging endpoints
  async sendInvites(
    eventId: string,
    data: {
      messageType: 'sms' | 'whatsapp' | 'email';
      guestIds?: string[];
      customMessage?: string;
    }
  ): Promise<ApiResponse<{
    sentMessages: any[];
    failedMessages: any[];
    totalSent: number;
    totalFailed: number;
  }>> {
    return this.request(`/messaging/${eventId}/send-invites`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMessageLogs(
    eventId: string,
    params?: { page?: number; limit?: number; status?: string; messageType?: string }
  ): Promise<ApiResponse<{ messages: any[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/messaging/${eventId}/logs?${queryString}` : `/messaging/${eventId}/logs`;
    
    return this.request(endpoint);
  }

  async getMessagingSummary(eventId: string): Promise<ApiResponse<{
    statistics: any;
    recentMessages: any[];
    deliveryRate: number;
  }>> {
    return this.request(`/messaging/${eventId}/summary`);
  }

  async retryMessages(eventId: string, messageIds: string[]): Promise<ApiResponse<{ retriedCount: number }>> {
    return this.request(`/messaging/${eventId}/retry`, {
      method: 'POST',
      body: JSON.stringify({ messageIds }),
    });
  }

  // Analytics endpoints
  async getEventAnalytics(eventId: string): Promise<ApiResponse<{
    guestStatistics: any;
    messageStatistics: any;
    timeline: any;
    recentActivity: any[];
  }>> {
    return this.request(`/analytics/${eventId}`);
  }

  async getGuestAnalytics(
    eventId: string,
    params?: { status?: string; page?: number; limit?: number }
  ): Promise<ApiResponse<{ guests: any[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/analytics/${eventId}/guests?${queryString}` : `/analytics/${eventId}/guests`;
    
    return this.request(endpoint);
  }

  async getMessageAnalytics(
    eventId: string,
    params?: { status?: string; messageType?: string; page?: number; limit?: number }
  ): Promise<ApiResponse<{ messages: any[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/analytics/${eventId}/messages?${queryString}` : `/analytics/${eventId}/messages`;
    
    return this.request(endpoint);
  }

  async exportAnalytics(eventId: string, format?: string): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (format) {
      queryParams.append('format', format);
    }
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/analytics/${eventId}/export?${queryString}` : `/analytics/${eventId}/export`;
    
    return this.request(endpoint);
  }

  async getDashboardOverview(): Promise<ApiResponse<{
    summary: any;
    recentEvents: any[];
    upcomingEvents: any[];
  }>> {
    return this.request('/analytics/dashboard/overview');
  }
}

// Create and export the API service instance
export const apiService = new ApiService(API_BASE_URL);

// Export types for use in components
export type { ApiResponse }; 

// Send invitations (single, bulk, or by guestIds)
export async function sendInvites(eventId: string, data: {
  messageType: 'sms' | 'whatsapp' | 'email';
  guestIds?: string[];
  customMessage?: string;
}) {
  return apiService.sendInvites(eventId, data);
} 