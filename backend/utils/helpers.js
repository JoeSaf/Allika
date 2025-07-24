import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import crypto from 'crypto';
import pkg from 'qrcode-with-logos';
const { createQRWithLogo } = pkg;
import path from 'path';
import fs from 'fs';

// Generate unique ID
export const generateId = () => uuidv4();

// Hash password
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate RSVP token
export const generateRSVPToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate QR code data URL
export const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Generate QR code for guest with logo overlay
export const generateGuestQRCode = async (guestId, eventId, rsvpToken) => {
  const qrData = {
    type: 'guest_checkin',
    guestId,
    eventId,
    token: rsvpToken,
    timestamp: Date.now()
  };
  const content = JSON.stringify(qrData);
  const logoPath = path.resolve(process.cwd(), 'public', 'placeholder.svg');
  const qrBuffer = await createQRWithLogo({
    content,
    logo: {
      src: logoPath,
      logoSize: 0.2
    },
    width: 400,
    height: 400
  });
  return qrBuffer.toString('base64');
};

// Parse CSV data
export const parseCSVData = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  
  const guests = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim());
    const guest = {};
    
    headers.forEach((header, index) => {
      if (values[index]) {
        guest[header] = values[index];
      }
    });
    
    // Map common CSV headers to our guest fields
    const mappedGuest = {
      name: guest.name || guest.fullname || guest.guest_name || '',
      email: guest.email || guest.email_address || '',
      phone: guest.phone || guest.phone_number || guest.mobile || '',
      tableNumber: guest.table || guest.table_number || guest.table_no || '',
      guestCount: guest.guests || guest.guest_count || guest.number_of_guests || 1,
      specialRequests: guest.requests || guest.special_requests || guest.dietary || ''
    };
    
    if (mappedGuest.name) {
      guests.push(mappedGuest);
    }
  }
  
  return guests;
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone format (basic)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present (assuming +255 for Tanzania)
  if (cleaned.length === 9 && cleaned.startsWith('7')) {
    return `+255${cleaned}`;
  }
  
  if (cleaned.length === 10 && cleaned.startsWith('07')) {
    return `+255${cleaned.substring(1)}`;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('255')) {
    return `+${cleaned}`;
  }
  
  return phone; // Return original if can't format
};

// Sanitize text input
export const sanitizeText = (text) => {
  if (!text) return '';
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
};

// Generate pagination info
export const getPaginationInfo = (page = 1, limit = 10, total) => {
  const currentPage = parseInt(page);
  const itemsPerPage = parseInt(limit);
  const totalPages = Math.ceil(total / itemsPerPage);
  const offset = (currentPage - 1) * itemsPerPage;
  
  return {
    currentPage,
    itemsPerPage,
    totalPages,
    total,
    offset,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

// Format date for display
export const formatDate = (date) => {
  if (!date) return null;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  return d.toISOString().split('T')[0];
};

// Format datetime for display
export const formatDateTime = (date) => {
  if (!date) return null;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  return d.toISOString();
};

// Calculate response rate
export const calculateResponseRate = (confirmed, declined, total) => {
  if (total === 0) return 0;
  const responded = confirmed + declined;
  return Math.round((responded / total) * 100);
};

// Generate event slug
export const generateEventSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// Validate file upload
export const validateFileUpload = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    throw new Error('No file uploaded');
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
  }
  
  return true;
};

// Generate random string
export const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

// Sleep function for async operations
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff
export const retry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay * Math.pow(2, i));
    }
  }
}; 

// Helper function to format time in words based on language
export const formatTimeInWords = (timeString, language = 'en') => {
  if (!timeString) return '';
  
  try {
    // Parse time string (HH:MM format)
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) return timeString;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    if (language === 'sw') {
      // Swahili time format
      const hour = date.getHours();
      const minute = date.getMinutes();
      
      // Swahili time words
      const swahiliHours = [
        'saa sita', 'saa moja', 'saa mbili', 'saa tatu', 'saa nne', 'saa tano',
        'saa sita', 'saa saba', 'saa nane', 'saa tisa', 'saa kumi', 'saa kumi na moja',
        'saa sita', 'saa moja', 'saa mbili', 'saa tatu', 'saa nne', 'saa tano',
        'saa sita', 'saa saba', 'saa nane', 'saa tisa', 'saa kumi', 'saa kumi na moja'
      ];
      
      const swahiliMinutes = [
        'saa kamili', 'dakika tano', 'dakika kumi', 'dakika kumi na tano', 'dakika ishirini',
        'dakika ishirini na tano', 'dakika thelathini', 'dakika thelathini na tano',
        'dakika arobaini', 'dakika arobaini na tano', 'dakika hamsini', 'dakika hamsini na tano'
      ];
      
      let timeInWords = swahiliHours[hour];
      
      if (minute > 0) {
        if (minute <= 30) {
          timeInWords += ` na ${swahiliMinutes[Math.floor(minute / 5)]}`;
        } else {
          const remainingMinutes = 60 - minute;
          const nextHour = (hour + 1) % 24;
          timeInWords = swahiliHours[nextHour] + ` kasoro ${swahiliMinutes[Math.floor(remainingMinutes / 5)]}`;
        }
      }
      
      return timeInWords;
    } else {
      // English time format
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch (error) {
    console.error('Error formatting time in words:', error);
    return timeString; // Return original if formatting fails
  }
};

// Helper function to format date in words based on language
export const formatDateInWords = (dateString, language = 'en') => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    if (language === 'sw') {
      // Swahili date format
      const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return date.toLocaleDateString('sw-TZ', options);
    } else {
      // English date format
      const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return date.toLocaleDateString('en-US', options);
    }
  } catch (error) {
    console.error('Error formatting date in words:', error);
    return dateString; // Return original if formatting fails
  }
}; 

// Generate a human-friendly RSVP alias
export const generateRSVPAlias = (guestName, eventTitle) => {
  // Lowercase, remove non-alphanum, replace spaces with hyphens
  let base = `${guestName}-${eventTitle}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  // Truncate to 40 chars for safety
  return base.slice(0, 40);
}; 