import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import crypto from 'crypto';
import createQRWithLogo from 'qrcode-with-logos';
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
    // console.error('Error generating QR code:', error);
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
  // Use the existing QRCode library (no logo)
  return await generateQRCode(qrData);
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

// File type signatures (magic numbers)
const FILE_SIGNATURES = {
  // Images
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  
  // Documents
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [0x50, 0x4B, 0x03, 0x04], // XLSX
  'application/vnd.ms-excel': [0xD0, 0xCF, 0x11, 0xE0], // XLS
  'text/csv': null, // CSV doesn't have a specific signature
};

// Allowed file types with their extensions
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
};

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  'image': 5 * 1024 * 1024, // 5MB for images
  'document': 10 * 1024 * 1024, // 10MB for documents
};

// Check if buffer matches file signature
export const validateFileSignature = (buffer, expectedMimeType) => {
  const signature = FILE_SIGNATURES[expectedMimeType];
  if (!signature) return true; // No signature to check (e.g., CSV)
  
  if (buffer.length < signature.length) return false;
  
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
};

// Check if buffer matches a specific signature array
export const bufferMatchesSignature = (buffer, signature) => {
  if (buffer.length < signature.length) return false;
  
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
};

// Detect file type from buffer
export const detectFileType = (buffer) => {
  for (const [mimeType, signature] of Object.entries(FILE_SIGNATURES)) {
    if (signature && validateFileSignature(buffer, mimeType)) {
      return mimeType;
    }
  }
  return null;
};

// Validate file extension
export const validateFileExtension = (filename, allowedMimeTypes) => {
  const ext = path.extname(filename).toLowerCase();
  const allowedExtensions = allowedMimeTypes.flatMap(mimeType => 
    ALLOWED_FILE_TYPES[mimeType] || []
  );
  return allowedExtensions.includes(ext);
};

// Enhanced file upload validation
export const validateSecureFileUpload = (file, options = {}) => {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    maxSize = 5 * 1024 * 1024,
    requireSignature = true,
    scanForMalware = true
  } = options;

  // Basic checks
  if (!file || !file.buffer) {
    throw new Error('No file uploaded or invalid file data');
  }

  // Check file size
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
  }

  // Validate file extension
  if (!validateFileExtension(file.originalname, allowedTypes)) {
    throw new Error(`Invalid file extension. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Validate file signature (prevent MIME spoofing)
  if (requireSignature && !validateFileSignature(file.buffer, file.mimetype)) {
    throw new Error('File signature validation failed. File may be corrupted or malicious.');
  }

  // Detect actual file type from buffer
  const detectedType = detectFileType(file.buffer);
  if (detectedType && detectedType !== file.mimetype) {
    throw new Error('File type mismatch. File extension does not match actual content.');
  }

  // Basic malware detection (check for executable signatures)
  if (scanForMalware) {
    const executableSignatures = [
      [0x4D, 0x5A], // MZ (Windows executable)
      [0x7F, 0x45, 0x4C, 0x46], // ELF (Linux executable)
      [0xFE, 0xED, 0xFA, 0xCE], // Mach-O (macOS executable)
    ];

    for (const signature of executableSignatures) {
      if (bufferMatchesSignature(file.buffer, signature)) {
        throw new Error('Executable files are not allowed.');
      }
    }
  }

  // Generate secure filename
  const secureFilename = generateSecureFilename(file.originalname);

  return {
    isValid: true,
    secureFilename,
    detectedType: detectedType || file.mimetype,
    fileSize: file.size
  };
};

// Generate secure filename
export const generateSecureFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName).toLowerCase();
  const sanitizedName = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  
  return `${sanitizedName}_${timestamp}_${randomString}${ext}`;
};

// Enhanced file upload for images
export const validateImageUpload = (file) => {
  return validateSecureFileUpload(file, {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    maxSize: MAX_FILE_SIZES.image,
    requireSignature: true,
    scanForMalware: true
  });
};

// Enhanced file upload for documents
export const validateDocumentUpload = (file) => {
  return validateSecureFileUpload(file, {
    allowedTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ],
    maxSize: MAX_FILE_SIZES.document,
    requireSignature: true,
    scanForMalware: true
  });
};

// Rate limiting for file uploads
const uploadAttempts = new Map();
const UPLOAD_RATE_LIMIT = {
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced from 15)
  maxAttempts: 50 // 50 uploads per 5 minutes (increased from 10)
};

export const checkUploadRateLimit = (userId) => {
  const now = Date.now();
  const userAttempts = uploadAttempts.get(userId) || [];
  
  // Remove old attempts
  const recentAttempts = userAttempts.filter(time => now - time < UPLOAD_RATE_LIMIT.windowMs);
  
  // Debug logging with more details
  console.log(`Rate limit check for user ${userId}:`);
  console.log(`- Recent attempts: ${recentAttempts.length}/${UPLOAD_RATE_LIMIT.maxAttempts}`);
  console.log(`- Time window: ${UPLOAD_RATE_LIMIT.windowMs}ms (${UPLOAD_RATE_LIMIT.windowMs / 60000} minutes)`);
  console.log(`- Current time: ${now}`);
  console.log(`- Recent attempt times:`, recentAttempts.map(t => new Date(t).toISOString()));
  
  if (recentAttempts.length >= UPLOAD_RATE_LIMIT.maxAttempts) {
    console.log(`Rate limit exceeded for user ${userId}`);
    throw new Error('Upload rate limit exceeded. Please try again later.');
  }
  
  // Add current attempt
  recentAttempts.push(now);
  uploadAttempts.set(userId, recentAttempts);
  
  console.log(`Rate limit check passed for user ${userId}`);
  return true;
};

// Clean up old rate limit entries
export const cleanupUploadRateLimits = () => {
  const now = Date.now();
  for (const [userId, attempts] of uploadAttempts.entries()) {
    const recentAttempts = attempts.filter(time => now - time < UPLOAD_RATE_LIMIT.windowMs);
    if (recentAttempts.length === 0) {
      uploadAttempts.delete(userId);
    } else {
      uploadAttempts.set(userId, recentAttempts);
    }
  }
};

// Clear rate limit for a specific user (for testing)
export const clearUploadRateLimit = (userId) => {
  uploadAttempts.delete(userId);
  console.log(`Rate limit cleared for user ${userId}`);
};

// Get current rate limit status for a user (for debugging)
export const getUploadRateLimitStatus = (userId) => {
  const now = Date.now();
  const userAttempts = uploadAttempts.get(userId) || [];
  const recentAttempts = userAttempts.filter(time => now - time < UPLOAD_RATE_LIMIT.windowMs);
  
  return {
    userId,
    recentAttempts: recentAttempts.length,
    maxAttempts: UPLOAD_RATE_LIMIT.maxAttempts,
    windowMs: UPLOAD_RATE_LIMIT.windowMs,
    isLimited: recentAttempts.length >= UPLOAD_RATE_LIMIT.maxAttempts,
    attemptTimes: recentAttempts.map(t => new Date(t).toISOString())
  };
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
    // console.error('Error formatting time in words:', error);
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
    // console.error('Error formatting date in words:', error);
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

// Image caching for generated invitations
const imageCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Cache generated invitation images
export const cacheInvitationImage = (key, imageBuffer) => {
  imageCache.set(key, {
    buffer: imageBuffer,
    timestamp: Date.now()
  });
};

// Get cached invitation image
export const getCachedInvitationImage = (key) => {
  const cached = imageCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.buffer;
  }
  if (cached) {
    imageCache.delete(key); // Remove expired cache
  }
  return null;
};

// Clear expired cache entries (run periodically)
export const cleanupImageCache = () => {
  const now = Date.now();
  for (const [key, value] of imageCache.entries()) {
    if ((now - value.timestamp) >= CACHE_TTL) {
      imageCache.delete(key);
    }
  }
};

// Generate cache key for invitation
export const generateInvitationCacheKey = (tokenOrAlias, template = 'default') => {
  return `invitation_${tokenOrAlias}_${template}`;
}; 

// Performance monitoring for image generation
const performanceMetrics = {
  totalGenerations: 0,
  cacheHits: 0,
  cacheMisses: 0,
  averageGenerationTime: 0,
  lastGenerationTime: 0
};

// Track image generation performance
export const trackImageGeneration = (startTime, wasCached = false) => {
  const generationTime = Date.now() - startTime;
  
  performanceMetrics.totalGenerations++;
  performanceMetrics.lastGenerationTime = generationTime;
  
  if (wasCached) {
    performanceMetrics.cacheHits++;
  } else {
    performanceMetrics.cacheMisses++;
    // Update average generation time (excluding cached hits)
    const totalMisses = performanceMetrics.cacheMisses;
    performanceMetrics.averageGenerationTime = 
      ((performanceMetrics.averageGenerationTime * (totalMisses - 1)) + generationTime) / totalMisses;
  }
};

// Get performance metrics
export const getImageGenerationMetrics = () => {
  const hitRate = performanceMetrics.totalGenerations > 0 
    ? (performanceMetrics.cacheHits / performanceMetrics.totalGenerations * 100).toFixed(2)
    : 0;
    
  return {
    totalGenerations: performanceMetrics.totalGenerations,
    cacheHits: performanceMetrics.cacheHits,
    cacheMisses: performanceMetrics.cacheMisses,
    cacheHitRate: `${hitRate}%`,
    averageGenerationTime: `${performanceMetrics.averageGenerationTime.toFixed(0)}ms`,
    lastGenerationTime: `${performanceMetrics.lastGenerationTime}ms`,
    cacheSize: imageCache.size
  };
}; 

// Secure parameterized field mapping for UPDATE queries
export const buildSecureUpdateQuery = (tableName, allowedFields, updateData, whereClause = 'id = ?', whereParams = []) => {
  const updateFields = [];
  const updateValues = [];
  
  // Validate and sanitize field names
  const sanitizedAllowedFields = allowedFields.filter(field => 
    typeof field === 'string' && 
    /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field) && // Only alphanumeric and underscore
    field.length <= 50 // Reasonable length limit
  );
  
  // Build update fields and values
  sanitizedAllowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      updateValues.push(updateData[field]);
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  // Build the complete query
  const query = `UPDATE ${tableName} SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE ${whereClause}`;
  const params = [...updateValues, ...whereParams];
  
  return {
    query,
    params,
    updateFields: updateFields.length,
    allowedFields: sanitizedAllowedFields
  };
};

// Validate field names for security
export const validateFieldName = (fieldName) => {
  if (typeof fieldName !== 'string') {
    return false;
  }
  
  // Only allow alphanumeric characters and underscores
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(fieldName)) {
    return false;
  }
  
  // Prevent SQL injection attempts
  const blacklistedKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE',
    'UNION', 'EXEC', 'EXECUTE', 'SCRIPT', 'DECLARE', 'CAST', 'CONVERT'
  ];
  
  const upperFieldName = fieldName.toUpperCase();
  if (blacklistedKeywords.some(keyword => upperFieldName.includes(keyword))) {
    return false;
  }
  
  return true;
}; 

// Secure IN clause builder for parameterized queries
export const buildSecureInClause = (values, fieldName = 'id') => {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Values array must be provided and non-empty');
  }
  
  // Validate field name
  if (!validateFieldName(fieldName)) {
    throw new Error('Invalid field name');
  }
  
  // Create placeholders for each value
  const placeholders = values.map(() => '?').join(',');
  const query = `${fieldName} IN (${placeholders})`;
  
  return {
    query,
    params: values
  };
}; 

// Security test functions (for development/testing only)
export const testSecureUpdateQuery = () => {
  const testCases = [
    {
      name: 'Normal update',
      input: {
        tableName: 'users',
        allowedFields: ['name', 'email'],
        updateData: { name: 'John', email: 'john@example.com' },
        whereClause: 'id = ?',
        whereParams: ['123']
      },
      expected: {
        query: 'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        params: ['John', 'john@example.com', '123'],
        updateFields: 2
      }
    },
    {
      name: 'SQL injection attempt',
      input: {
        tableName: 'users',
        allowedFields: ['name', 'email; DROP TABLE users; --'],
        updateData: { name: 'John', 'email; DROP TABLE users; --': 'malicious' },
        whereClause: 'id = ?',
        whereParams: ['123']
      },
      expected: {
        query: 'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        params: ['John', '123'],
        updateFields: 1
      }
    },
    {
      name: 'Invalid field names filtered out',
      input: {
        tableName: 'users',
        allowedFields: ['name', '123invalid', 'SELECT * FROM users'],
        updateData: { name: 'John', '123invalid': 'test', 'SELECT * FROM users': 'malicious' },
        whereClause: 'id = ?',
        whereParams: ['123']
      },
      expected: {
        query: 'UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        params: ['John', '123'],
        updateFields: 1
      }
    }
  ];

  console.log('🧪 Testing secure update query...');
  
  testCases.forEach((testCase, index) => {
    try {
      const result = buildSecureUpdateQuery(
        testCase.input.tableName,
        testCase.input.allowedFields,
        testCase.input.updateData,
        testCase.input.whereClause,
        testCase.input.whereParams
      );
      
      const passed = 
        result.query === testCase.expected.query &&
        JSON.stringify(result.params) === JSON.stringify(testCase.expected.params) &&
        result.updateFields === testCase.expected.updateFields;
      
      console.log(`  ${passed ? '✅' : '❌'} Test ${index + 1}: ${testCase.name}`);
      if (!passed) {
        console.log(`    Expected: ${JSON.stringify(testCase.expected)}`);
        console.log(`    Got: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.log(`  ❌ Test ${index + 1}: ${testCase.name} - Error: ${error.message}`);
    }
  });
}; 