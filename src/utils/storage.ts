
// Storage utility for managing all app data
export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  table?: string;
  status: 'pending' | 'confirmed' | 'declined';
  checkedIn: boolean;
  checkInTime?: string;
  rsvpDate?: string;
  guestCount?: number;
  specialRequests?: string;
  additionalFields?: Record<string, any>;
}

export interface Event {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  venue: string;
  reception?: string;
  receptionTime?: string;
  theme?: string;
  rsvpContact: string;
  additionalInfo?: string;
  invitingFamily?: string;
  invitationImage?: string;
  status: 'draft' | 'active' | 'completed';
  guests: Guest[];
  createdAt: string;
  messagesSent: number;
  rsvpSettings: {
    title: string;
    subtitle: string;
    location: string;
    welcomeMessage: string;
    confirmText: string;
    declineText: string;
    guestCountEnabled: boolean;
    guestCountLabel: string;
    guestCountOptions: string[];
    specialRequestsEnabled: boolean;
    specialRequestsLabel: string;
    specialRequestsPlaceholder: string;
    additionalFields: Array<{
      id: string;
      label: string;
      type: 'text' | 'textarea' | 'select';
      required: boolean;
      options?: string[];
    }>;
    submitButtonText: string;
    thankYouMessage: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    accentColor: string;
  };
}

export interface Analytics {
  eventId: string;
  totalInvitations: number;
  messagesSent: number;
  delivered: number;
  read: number;
  responded: number;
  confirmed: number;
  declined: number;
  pending: number;
  responseRate: number;
  lastUpdated: string;
}

// Storage keys
const STORAGE_KEYS = {
  EVENTS: 'alika_events',
  GUESTS: 'alika_guests',
  ANALYTICS: 'alika_analytics',
  CURRENT_EVENT: 'alika_current_event'
};

// Event management
export const saveEvent = (event: Event): void => {
  const events = getEvents();
  const existingIndex = events.findIndex(e => e.id === event.id);
  
  if (existingIndex >= 0) {
    events[existingIndex] = event;
  } else {
    events.push(event);
  }
  
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  updateAnalytics(event);
};

export const getEvents = (): Event[] => {
  const events = localStorage.getItem(STORAGE_KEYS.EVENTS);
  return events ? JSON.parse(events) : [];
};

export const getEvent = (id: string): Event | null => {
  const events = getEvents();
  return events.find(e => e.id === id) || null;
};

export const deleteEvent = (id: string): void => {
  const events = getEvents().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  
  // Clean up related data
  const analytics = getAnalytics().filter(a => a.eventId !== id);
  localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
};

// Guest management
export const saveGuest = (eventId: string, guest: Guest): void => {
  const event = getEvent(eventId);
  if (!event) return;
  
  const existingIndex = event.guests.findIndex(g => g.id === guest.id);
  
  if (existingIndex >= 0) {
    event.guests[existingIndex] = guest;
  } else {
    event.guests.push(guest);
  }
  
  saveEvent(event);
};

export const getGuests = (eventId: string): Guest[] => {
  const event = getEvent(eventId);
  return event ? event.guests : [];
};

export const checkInGuest = (eventId: string, guestId: string): boolean => {
  const event = getEvent(eventId);
  if (!event) return false;
  
  const guest = event.guests.find(g => g.id === guestId);
  if (!guest || guest.checkedIn) return false;
  
  guest.checkedIn = true;
  guest.checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  saveEvent(event);
  return true;
};

// Analytics management
export const updateAnalytics = (event: Event): void => {
  const analytics = getAnalytics();
  const existingIndex = analytics.findIndex(a => a.eventId === event.id);
  
  const confirmed = event.guests.filter(g => g.status === 'confirmed').length;
  const declined = event.guests.filter(g => g.status === 'declined').length;
  const pending = event.guests.filter(g => g.status === 'pending').length;
  const responded = confirmed + declined;
  const responseRate = event.messagesSent > 0 ? (responded / event.messagesSent) * 100 : 0;
  
  const analyticsData: Analytics = {
    eventId: event.id,
    totalInvitations: event.guests.length,
    messagesSent: event.messagesSent,
    delivered: Math.floor(event.messagesSent * 0.92),
    read: Math.floor(event.messagesSent * 0.78),
    responded,
    confirmed,
    declined,
    pending,
    responseRate: Math.round(responseRate * 10) / 10,
    lastUpdated: new Date().toISOString()
  };
  
  if (existingIndex >= 0) {
    analytics[existingIndex] = analyticsData;
  } else {
    analytics.push(analyticsData);
  }
  
  localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
};

export const getAnalytics = (): Analytics[] => {
  const analytics = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
  return analytics ? JSON.parse(analytics) : [];
};

export const getEventAnalytics = (eventId: string): Analytics | null => {
  const analytics = getAnalytics();
  return analytics.find(a => a.eventId === eventId) || null;
};

// Current event context
export const setCurrentEvent = (eventId: string): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_EVENT, eventId);
};

export const getCurrentEvent = (): Event | null => {
  const eventId = localStorage.getItem(STORAGE_KEYS.CURRENT_EVENT);
  return eventId ? getEvent(eventId) : null;
};

// Utility functions
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const createDefaultEvent = (type: string): Event => {
  const id = generateId();
  return {
    id,
    title: '',
    type,
    date: '',
    time: '',
    venue: '',
    rsvpContact: '',
    status: 'draft',
    guests: [],
    createdAt: new Date().toISOString(),
    messagesSent: 0,
    rsvpSettings: {
      title: 'Wedding Invitation',
      subtitle: 'Join us in celebration',
      location: '',
      welcomeMessage: 'We would be honored by your presence',
      confirmText: 'Accept',
      declineText: 'Decline',
      guestCountEnabled: true,
      guestCountLabel: 'Number of guests',
      guestCountOptions: ['1', '2', '3', '4', '5+'],
      specialRequestsEnabled: true,
      specialRequestsLabel: 'Special requests or dietary requirements',
      specialRequestsPlaceholder: 'Any special requests...',
      additionalFields: [],
      submitButtonText: 'Submit RSVP',
      thankYouMessage: 'Thank you for your response!',
      backgroundColor: '#1e293b',
      textColor: '#ffffff',
      buttonColor: '#0d9488',
      accentColor: '#14b8a6'
    }
  };
};

export const simulateQRScan = (eventId: string): Guest | null => {
  const event = getEvent(eventId);
  if (!event) return null;
  
  const pendingGuests = event.guests.filter(g => !g.checkedIn);
  if (pendingGuests.length === 0) return null;
  
  const randomGuest = pendingGuests[Math.floor(Math.random() * pendingGuests.length)];
  checkInGuest(eventId, randomGuest.id);
  
  return randomGuest;
};
