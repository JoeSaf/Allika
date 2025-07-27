// Updated storage.ts with proper event details saving
export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  table?: string;
  status: "pending" | "confirmed" | "declined";
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
  rsvpContactSecondary?: string;
  additionalInfo?: string;
  invitingFamily?: string;
  invitationImage?: string;
  image?: string;
  status: "draft" | "active" | "completed";
  guests: Guest[];
  createdAt: string;
  messagesSent: number;
  // Add invitation template data
  invitationData?: {
    coupleName: string;
    eventDate: string;
    eventTime: string;
    venue: string;
    reception?: string;
    receptionTime?: string;
    theme?: string;
    rsvpContact: string;
    rsvpContactSecondary?: string;
    additionalInfo?: string;
    invitingFamily?: string;
    guestName?: string;
    invitationImage?: string;
  };
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
      type: "text" | "textarea" | "select";
      required: boolean;
      options?: string[];
    }>;
    submitButtonText: string;
    thankYouMessage: string;
    backgroundColor: string;
    textColor: string;
    buttonColor: string;
    accentColor: string;
    rsvpContact?: string;
    rsvpContactSecondary?: string;
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
  EVENTS: "alika_events",
  GUESTS: "alika_guests",
  ANALYTICS: "alika_analytics",
  CURRENT_EVENT: "alika_current_event",
} as const;

// Helper function to safely parse JSON
const safeJSONParse = <T>(jsonString: string | null, defaultValue: T): T => {
  if (!jsonString) {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parsed || defaultValue;
  } catch (error) {
    console.warn("Error parsing JSON from localStorage:", error);
    return defaultValue;
  }
};

// Helper function to safely stringify and store JSON
const safeJSONStringify = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`Saved ${key} data:`, data);
  } catch (error) {
    console.error("Error storing data to localStorage:", error);
    throw new Error(`Failed to save ${key} data`);
  }
};

// Event management with detailed saving
export const saveEvent = (event: Event): void => {
  try {
    const events = getEvents();
    const existingIndex = events.findIndex(e => e.id === event.id);

    if (existingIndex >= 0) {
      events[existingIndex] = { ...events[existingIndex], ...event };
      console.log(`Updated existing event: ${event.title}`, event);
    } else {
      events.push(event);
      console.log(`Added new event: ${event.title}`, event);
    }

    safeJSONStringify(STORAGE_KEYS.EVENTS, events);

    // Update analytics after saving
    updateAnalytics(event);
  } catch (error) {
    console.error("Error saving event:", error);
    throw error;
  }
};

// New function to save event details from event editor
export const saveEventDetails = (eventId: string, details: Partial<Event>): void => {
  try {
    const events = getEvents();
    const existingIndex = events.findIndex(e => e.id === eventId);

    if (existingIndex >= 0) {
      // Merge the new details with existing event
      events[existingIndex] = {
        ...events[existingIndex],
        ...details,
      };

      console.log(`Updated event details for: ${eventId}`, events[existingIndex]);
      safeJSONStringify(STORAGE_KEYS.EVENTS, events);

      // Update analytics
      updateAnalytics(events[existingIndex]);
    } else {
      console.error(`Event not found for update: ${eventId}`);
      throw new Error(`Event not found: ${eventId}`);
    }
  } catch (error) {
    console.error("Error saving event details:", error);
    throw error;
  }
};

// New function to save invitation template data
export const saveInvitationData = (eventId: string, invitationData: any): void => {
  try {
    const event = getEvent(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    // Update the event with invitation data
    const updatedEvent = {
      ...event,
      invitationData: invitationData,
      // Also update main event fields from invitation data
      title: invitationData.coupleName || event.title,
      date: invitationData.eventDate || event.date,
      time: invitationData.eventTime || event.time,
      venue: invitationData.venue || event.venue,
      reception: invitationData.reception || event.reception,
      receptionTime: invitationData.receptionTime || event.receptionTime,
      theme: invitationData.theme || event.theme,
      rsvpContact: invitationData.rsvpContact || event.rsvpContact,
      rsvpContactSecondary: invitationData.rsvpContactSecondary || event.rsvpContactSecondary,
      additionalInfo: invitationData.additionalInfo || event.additionalInfo,
      invitingFamily: invitationData.invitingFamily || event.invitingFamily,
      invitationImage: invitationData.invitationImage || event.invitationImage,
    };

    saveEvent(updatedEvent);
    console.log("Saved invitation data:", invitationData);
  } catch (error) {
    console.error("Error saving invitation data:", error);
    throw error;
  }
};

// New function to save RSVP settings
export const saveRsvpSettings = (eventId: string, rsvpSettings: any): void => {
  try {
    const event = getEvent(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const updatedEvent = {
      ...event,
      rsvpSettings: {
        ...event.rsvpSettings,
        ...rsvpSettings,
      },
    };

    saveEvent(updatedEvent);
    console.log("Saved RSVP settings:", rsvpSettings);
  } catch (error) {
    console.error("Error saving RSVP settings:", error);
    throw error;
  }
};

export const getEvents = (): Event[] => {
  try {
    const events = safeJSONParse(localStorage.getItem(STORAGE_KEYS.EVENTS), []);
    console.log(`Retrieved ${events.length} events from storage`);
    return events;
  } catch (error) {
    console.error("Error getting events:", error);
    return [];
  }
};

export const getEvent = (id: string): Event | null => {
  try {
    const events = getEvents();
    const event = events.find(e => e.id === id) || null;
    if (event) {
      console.log(`Found event: ${event.title}`, event);
    } else {
      console.warn(`Event not found with id: ${id}`);
    }
    return event;
  } catch (error) {
    console.error("Error getting event:", error);
    return null;
  }
};

export const deleteEvent = (id: string): void => {
  try {
    const events = getEvents().filter(e => e.id !== id);
    safeJSONStringify(STORAGE_KEYS.EVENTS, events);

    // Clean up related data
    const analytics = getAnalytics().filter(a => a.eventId !== id);
    safeJSONStringify(STORAGE_KEYS.ANALYTICS, analytics);

    // Clear current event if it's the one being deleted
    const currentEventId = localStorage.getItem(STORAGE_KEYS.CURRENT_EVENT);
    if (currentEventId === id) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_EVENT);
    }

    console.log(`Deleted event with id: ${id}`);
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

// Guest management
export const saveGuest = (eventId: string, guest: Guest): void => {
  try {
    const event = getEvent(eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const existingIndex = event.guests.findIndex(g => g.id === guest.id);

    if (existingIndex >= 0) {
      event.guests[existingIndex] = guest;
    } else {
      event.guests.push(guest);
    }

    saveEvent(event);
  } catch (error) {
    console.error("Error saving guest:", error);
    throw error;
  }
};

export const getGuests = (eventId: string): Guest[] => {
  try {
    const event = getEvent(eventId);
    return event ? event.guests : [];
  } catch (error) {
    console.error("Error getting guests:", error);
    return [];
  }
};

export const checkInGuest = (eventId: string, guestId: string): boolean => {
  try {
    const event = getEvent(eventId);
    if (!event) {
      return false;
    }

    const guest = event.guests.find(g => g.id === guestId);
    if (!guest || guest.checkedIn) {
      return false;
    }

    guest.checkedIn = true;
    guest.checkInTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    saveEvent(event);
    return true;
  } catch (error) {
    console.error("Error checking in guest:", error);
    return false;
  }
};

// Analytics management
export const updateAnalytics = (event: Event): void => {
  try {
    const analytics = getAnalytics();
    const existingIndex = analytics.findIndex(a => a.eventId === event.id);

    const confirmed = event.guests.filter(g => g.status === "confirmed").length;
    const declined = event.guests.filter(g => g.status === "declined").length;
    const pending = event.guests.filter(g => g.status === "pending").length;
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
      lastUpdated: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      analytics[existingIndex] = analyticsData;
    } else {
      analytics.push(analyticsData);
    }

    safeJSONStringify(STORAGE_KEYS.ANALYTICS, analytics);
  } catch (error) {
    console.error("Error updating analytics:", error);
  }
};

export const getAnalytics = (): Analytics[] => {
  try {
    return safeJSONParse(localStorage.getItem(STORAGE_KEYS.ANALYTICS), []);
  } catch (error) {
    console.error("Error getting analytics:", error);
    return [];
  }
};

export const getEventAnalytics = (eventId: string): Analytics | null => {
  try {
    const analytics = getAnalytics();
    return analytics.find(a => a.eventId === eventId) || null;
  } catch (error) {
    console.error("Error getting event analytics:", error);
    return null;
  }
};

// Current event context
export const setCurrentEvent = (eventId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_EVENT, eventId);
    console.log(`Set current event: ${eventId}`);
  } catch (error) {
    console.error("Error setting current event:", error);
  }
};

export const getCurrentEvent = (): Event | null => {
  try {
    const eventId = localStorage.getItem(STORAGE_KEYS.CURRENT_EVENT);
    if (!eventId) {
      console.log("No current event set");
      return null;
    }

    const event = getEvent(eventId);
    if (!event) {
      // Clean up invalid current event
      localStorage.removeItem(STORAGE_KEYS.CURRENT_EVENT);
      console.warn("Current event not found, cleared from storage");
    }
    return event;
  } catch (error) {
    console.error("Error getting current event:", error);
    return null;
  }
};

// New function to clear stale event data
export const clearStaleEventData = (): void => {
  try {
    console.log("[Storage] Clearing stale event data");

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.CURRENT_EVENT);
    localStorage.removeItem("alika_event_creation_lock");
    localStorage.removeItem("alika_event_timestamp");
    localStorage.removeItem("alika_event_session");

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

    console.log("[Storage] Stale event data cleared successfully");
  } catch (error) {
    console.error("Error clearing stale event data:", error);
  }
};

// Utility functions
export const simulateQRScan = (eventId: string): Guest | null => {
  try {
    const event = getEvent(eventId);
    if (!event) {
      return null;
    }

    const pendingGuests = event.guests.filter(g => !g.checkedIn);
    if (pendingGuests.length === 0) {
      return null;
    }

    const randomGuest = pendingGuests[Math.floor(Math.random() * pendingGuests.length)];
    const success = checkInGuest(eventId, randomGuest.id);

    return success ? randomGuest : null;
  } catch (error) {
    console.error("Error simulating QR scan:", error);
    return null;
  }
};

export const generateGuestQRCode = async (eventId: string, guestId: string): Promise<string | null> => {
  try {
    const event = getEvent(eventId);
    if (!event) {
      return null;
    }

    const guest = event.guests.find(g => g.id === guestId);
    if (!guest) {
      return null;
    }

    const { generateQRCodeData, generateQRCodeString } = await import("./qrCodeGenerator");
    const qrData = generateQRCodeData(guest, event);
    return await generateQRCodeString(qrData);
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    return null;
  }
};

export const generateEventQRCodes = async (eventId: string): Promise<Array<{guest: Guest, qrCode: string}> | null> => {
  try {
    const event = getEvent(eventId);
    if (!event) {
      return null;
    }

    const { generateBulkQRCodes } = await import("./qrCodeGenerator");
    return await generateBulkQRCodes(event.guests, event);
  } catch (error) {
    console.error("Failed to generate bulk QR codes:", error);
    return null;
  }
};

// Debug functions (for development)
export const clearAllData = (): void => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log("Cleared all app data from localStorage");
  } catch (error) {
    console.error("Error clearing data:", error);
  }
};

export const getStorageInfo = (): Record<string, any> => {
  return {
    events: getEvents().length,
    analytics: getAnalytics().length,
    currentEvent: localStorage.getItem(STORAGE_KEYS.CURRENT_EVENT),
    storageKeys: STORAGE_KEYS,
  };
};
