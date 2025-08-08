import { env } from "@/config/environment";
import { getAuthToken } from "@/utils/auth";

// Types
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

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: string;
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
  status: "draft" | "active" | "completed";
  design_method?: "template" | "custom";
  custom_card_image_url?: string;
  custom_card_overlay_data?: any;
  createdAt: string;
  updatedAt: string;
}

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  tableNumber?: string;
  guestCount?: number;
  specialRequests?: string;
  status: "invited" | "confirmed" | "declined" | "checked-in";
  createdAt: string;
  updatedAt: string;
}

interface RsvpResponse {
  id: string;
  response: "confirmed" | "declined";
  guestCount?: number;
  specialRequests?: string;
  additionalFields?: Record<string, any>;
  createdAt: string;
}

interface CheckInLog {
  id: string;
  guestId: string;
  eventId: string;
  notes?: string;
  checkedInAt: string;
  checkedInBy: string;
}

interface MessageLog {
  id: string;
  guestId: string;
  eventId: string;
  messageType: "sms" | "whatsapp" | "email";
  status: "sent" | "delivered" | "failed" | "pending";
  message: string;
  sentAt: string;
}

// API Service Class
class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = getAuthToken();

    // Don't set Content-Type for FormData - let the browser set it automatically
    const headers: Record<string, string> = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    // Only set Content-Type to application/json if body is not FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const config: RequestInit = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', data);
        const error = new Error(data.message || data.details || `HTTP error! status: ${response.status}`);
        (error as any).status = response.status;
        (error as any).details = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (env.isDevelopment) {
        console.error("API request failed:", error);
      }
      throw error;
    }
  }

  // Authentication endpoints
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request("/auth/me");
  }

  async changePassword(passwords: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse> {
    return this.request("/auth/change-password", {
      method: "POST",
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
    designMethod?: "template" | "custom";
    customCardImageUrl?: string;
    customCardOverlayData?: any;
  }): Promise<ApiResponse<{ event: Event }>> {
    return this.request("/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  }

  async uploadCustomCard(formData: FormData): Promise<ApiResponse<{ imageUrl: string }>> {
    return this.request("/events/upload-custom-card", {
      method: "POST",
      body: formData,
    });
  }

  async getEvents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<{ events: Event[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/events?${queryString}` : "/events";

    return this.request(endpoint);
  }

  async getEvent(eventId: string): Promise<ApiResponse<{ event: Event }>> {
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
      status: "draft" | "active" | "completed";
      custom_card_overlay_data?: any;
    }>,
  ): Promise<ApiResponse<{ event: Event }>> {
    return this.request(`/events/${eventId}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(eventId: string): Promise<ApiResponse> {
    return this.request(`/events/${eventId}`, {
      method: "DELETE",
    });
  }

  async updateInvitationData(
    eventId: string,
    invitationData: {
      coupleName?: string;
      eventDate?: string;
      eventDateWords?: string;
      eventTime?: string;
      venue?: string;
      reception?: string;
      receptionTime?: string;
      theme?: string;
      rsvpContact?: string;
      rsvpContactSecondary?: string;
      additionalInfo?: string;
      invitingFamily?: string;
      guestName?: string;
      invitationImage?: string;
      dateLang?: string;
      selectedTemplate?: string;
    },
  ): Promise<ApiResponse> {
    return this.request(`/events/${eventId}/invitation-data`, {
      method: "POST",
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
        type: "text" | "textarea" | "select";
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
      rsvpContactSecondary?: string;
    },
  ): Promise<ApiResponse> {
    return this.request(`/events/${eventId}/rsvp-settings`, {
      method: "POST",
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
    },
  ): Promise<ApiResponse<{ guest: Guest }>> {
    return this.request(`/guests/${eventId}`, {
      method: "POST",
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
    }>,
  ): Promise<ApiResponse<{ createdGuests: Guest[]; errors?: any[] }>> {
    return this.request(`/guests/${eventId}/bulk`, {
      method: "POST",
      body: JSON.stringify({ guests }),
    });
  }

  async uploadGuestsCSV(eventId: string, file: File): Promise<ApiResponse<{ createdGuests: Guest[]; errors?: any[] }>> {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("alika_token");

    const response = await fetch(`${this.baseURL}/guests/${eventId}/upload-csv`, {
      method: "POST",
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
    },
  ): Promise<ApiResponse<{ guests: Guest[]; pagination: any }>> {
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
    }>,
  ): Promise<ApiResponse<{ guest: Guest }>> {
    return this.request(`/guests/${eventId}/${guestId}`, {
      method: "PUT",
      body: JSON.stringify(guestData),
    });
  }

  async deleteGuest(eventId: string, guestId: string): Promise<ApiResponse> {
    return this.request(`/guests/${eventId}/${guestId}`, {
      method: "DELETE",
    });
  }

  async exportGuestsCSV(eventId: string): Promise<Blob> {
    const token = localStorage.getItem("alika_token");

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

  async checkDuplicatePhones(
    eventId: string,
    phoneNumbers: string[],
  ): Promise<ApiResponse<{
    duplicates: Array<{
      phone: string;
      existingGuest: string;
    }>;
    hasDuplicates: boolean;
  }>> {
    return this.request(`/guests/${eventId}/check-duplicates`, {
      method: "POST",
      body: JSON.stringify({ phoneNumbers }),
    });
  }

  // RSVP endpoints (public)
  async getRsvpInfo(token: string): Promise<ApiResponse<{
    guest: Guest;
    event: Event;
    rsvpSettings: any;
    hasResponded: boolean;
    lastResponse: RsvpResponse;
  }>> {
    return this.request(`/rsvp/${token}`);
  }

  async submitRsvp(
    token: string,
    rsvpData: {
      response: "confirmed" | "declined";
      guestCount?: number;
      specialRequests?: string;
      additionalFields?: Record<string, any>;
    },
  ): Promise<ApiResponse<{ guest: Guest; response: RsvpResponse }>> {
    return this.request(`/rsvp/${token}`, {
      method: "POST",
      body: JSON.stringify(rsvpData),
    });
  }

  async getRsvpQrCode(token: string): Promise<ApiResponse<{ qrCode: string }>> {
    return this.request(`/rsvp/${token}/qr-code`);
  }

  async getRsvpStatus(token: string): Promise<ApiResponse<{
    guest: Guest;
    event: Event;
    response: RsvpResponse;
  }>> {
    return this.request(`/rsvp/${token}/status`);
  }

  // Check-in endpoints
  async checkInGuest(token: string, notes?: string): Promise<ApiResponse<{ guest: Guest; checkInLog: CheckInLog }>> {
    return this.request("/checkin", {
      method: "POST",
      body: JSON.stringify({ token, notes }),
    });
  }

  async checkInGuestQr(qrData: string): Promise<ApiResponse<{ guest: Guest; checkInLog: CheckInLog }>> {
    return this.request("/checkin/qr-scan", {
      method: "POST",
      body: JSON.stringify({ qrData }),
    });
  }

  async checkInGuestManual(
    eventId: string,
    guestId: string,
    notes?: string,
  ): Promise<ApiResponse<{ guest: Guest; checkInLog: CheckInLog }>> {
    return this.request(`/checkin/${eventId}/${guestId}`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  async getCheckInLogs(
    eventId: string,
    params?: { page?: number; limit?: number },
  ): Promise<ApiResponse<{ logs: CheckInLog[]; pagination: any }>> {
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
    recentCheckins: CheckInLog[];
    checkInRate: number;
  }>> {
    return this.request(`/checkin/${eventId}/summary`);
  }

  async undoCheckIn(
    eventId: string,
    guestId: string,
    reason?: string,
  ): Promise<ApiResponse<{ guest: Guest }>> {
    return this.request(`/checkin/${eventId}/${guestId}/undo`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // Messaging endpoints
  async sendInvites(
    eventId: string,
    data: {
      messageType: "sms" | "whatsapp" | "email";
      guestIds?: string[];
      customMessage?: string;
    },
  ): Promise<ApiResponse<{
    sentMessages: MessageLog[];
    failedMessages: MessageLog[];
    totalSent: number;
    totalFailed: number;
  }>> {
    return this.request(`/messaging/${eventId}/send-invites`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMessageLogs(
    eventId: string,
    params?: { page?: number; limit?: number; status?: string; messageType?: string },
  ): Promise<ApiResponse<{ messages: MessageLog[]; pagination: any }>> {
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
    recentMessages: MessageLog[];
    deliveryRate: number;
  }>> {
    return this.request(`/messaging/${eventId}/summary`);
  }

  async retryMessages(eventId: string, messageIds: string[]): Promise<ApiResponse<{ retriedCount: number }>> {
    return this.request(`/messaging/${eventId}/retry`, {
      method: "POST",
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
    params?: { status?: string; page?: number; limit?: number },
  ): Promise<ApiResponse<{ guests: Guest[]; pagination: any }>> {
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
    params?: { status?: string; messageType?: string; page?: number; limit?: number },
  ): Promise<ApiResponse<{ messages: MessageLog[]; pagination: any }>> {
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
      queryParams.append("format", format);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/analytics/${eventId}/export?${queryString}` : `/analytics/${eventId}/export`;

    return this.request(endpoint);
  }

  async getDashboardOverview(): Promise<ApiResponse<{
    summary: any;
    recentEvents: Event[];
    upcomingEvents: Event[];
  }>> {
    return this.request("/analytics/dashboard/overview");
  }
}

// Create and export the API service instance
export const apiService = new ApiService(`${env.apiUrl}/api`);

// Export types for use in components
export type {
  ApiResponse,
  User,
  Event,
  Guest,
  RsvpResponse,
  CheckInLog,
  MessageLog,
};


