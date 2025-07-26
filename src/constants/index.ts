// Application constants
export const APP_NAME = "Allika";
export const APP_VERSION = "1.0.0";

// API constants
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    ME: "/auth/me",
    CHANGE_PASSWORD: "/auth/change-password",
  },
  EVENTS: {
    BASE: "/events",
    INVITATION_DATA: (id: string) => `/events/${id}/invitation-data`,
    RSVP_SETTINGS: (id: string) => `/events/${id}/rsvp-settings`,
  },
  GUESTS: {
    BASE: (eventId: string) => `/guests/${eventId}`,
    BULK: (eventId: string) => `/guests/${eventId}/bulk`,
    UPLOAD_CSV: (eventId: string) => `/guests/${eventId}/upload-csv`,
    EXPORT_CSV: (eventId: string) => `/guests/${eventId}/export-csv`,
    CHECK_DUPLICATES: (eventId: string) => `/guests/${eventId}/check-duplicates`,
  },
  RSVP: {
    INFO: (token: string) => `/rsvp/${token}`,
    SUBMIT: (token: string) => `/rsvp/${token}`,
    QR_CODE: (token: string) => `/rsvp/${token}/qr-code`,
    STATUS: (token: string) => `/rsvp/${token}/status`,
  },
  CHECKIN: {
    BASE: "/checkin",
    QR_SCAN: "/checkin/qr-scan",
    MANUAL: (eventId: string, guestId: string) => `/checkin/${eventId}/${guestId}`,
    LOGS: (eventId: string) => `/checkin/${eventId}/logs`,
    SUMMARY: (eventId: string) => `/checkin/${eventId}/summary`,
    UNDO: (eventId: string, guestId: string) => `/checkin/${eventId}/${guestId}/undo`,
  },
  MESSAGING: {
    SEND_INVITES: (eventId: string) => `/messaging/${eventId}/send-invites`,
    LOGS: (eventId: string) => `/messaging/${eventId}/logs`,
    SUMMARY: (eventId: string) => `/messaging/${eventId}/summary`,
    RETRY: (eventId: string) => `/messaging/${eventId}/retry`,
  },
  ANALYTICS: {
    EVENT: (eventId: string) => `/analytics/${eventId}`,
    GUESTS: (eventId: string) => `/analytics/${eventId}/guests`,
    MESSAGES: (eventId: string) => `/analytics/${eventId}/messages`,
    EXPORT: (eventId: string) => `/analytics/${eventId}/export`,
    DASHBOARD_OVERVIEW: "/analytics/dashboard/overview",
  },
} as const;

// Event types
export const EVENT_TYPES = {
  WEDDING: "wedding",
  BIRTHDAY: "birthday",
  ANNIVERSARY: "anniversary",
  CORPORATE: "corporate",
  OTHER: "other",
} as const;

// Event statuses
export const EVENT_STATUSES = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
} as const;

// Guest statuses
export const GUEST_STATUSES = {
  INVITED: "invited",
  CONFIRMED: "confirmed",
  DECLINED: "declined",
  CHECKED_IN: "checked-in",
} as const;

// Message types
export const MESSAGE_TYPES = {
  SMS: "sms",
  WHATSAPP: "whatsapp",
  EMAIL: "email",
} as const;

// Message statuses
export const MESSAGE_STATUSES = {
  SENT: "sent",
  DELIVERED: "delivered",
  FAILED: "failed",
  PENDING: "pending",
} as const;

// RSVP responses
export const RSVP_RESPONSES = {
  CONFIRMED: "confirmed",
  DECLINED: "declined",
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "alika_token",
  USER_DATA: "alika_user",
  THEME: "alika_theme",
  LANGUAGE: "alika_language",
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_CSV_TYPES: ["text/csv", "application/csv"],
} as const;

// Validation rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 254,
  PHONE_MAX_LENGTH: 20,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MAX_LENGTH: 1000,
} as const;

// UI constants
export const UI = {
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  INPUT: "yyyy-MM-dd",
  TIME: "HH:mm",
  DATETIME: "MMM dd, yyyy HH:mm",
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "Access denied. You don't have permission to access this resource.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "An unexpected error occurred. Please try again later.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  EVENT_CREATED: "Event created successfully!",
  EVENT_UPDATED: "Event updated successfully!",
  EVENT_DELETED: "Event deleted successfully!",
  GUEST_ADDED: "Guest added successfully!",
  GUEST_UPDATED: "Guest updated successfully!",
  GUEST_DELETED: "Guest deleted successfully!",
  INVITATION_SENT: "Invitation sent successfully!",
  RSVP_SUBMITTED: "RSVP submitted successfully!",
  CHECKIN_SUCCESS: "Guest checked in successfully!",
} as const;
