import { body, param, query, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Auth validation rules
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Event validation rules
export const validateCreateEvent = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Event title is required and must be less than 255 characters'),
  body('type')
    .isIn(['wedding', 'birthday', 'anniversary', 'graduation', 'corporate', 'conference', 'awards', 'festival', 'meeting', 'seminar', 'other'])
    .withMessage('Please select a valid event type'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time format (HH:MM)'),
  body('venue')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Venue must be less than 500 characters'),
  body('reception')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reception venue must be less than 500 characters'),
  body('receptionTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid reception time format (HH:MM)'),
  body('theme')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Theme must be less than 255 characters'),
  body('rsvpContact')
    .optional()
    .matches(/^\+?\d{10,15}$/)
    .withMessage('RSVP contact must be a valid phone number with country code, 10-15 digits, with or without + (e.g., +255692308579 or 255692308579)'),
  body('rsvpContactSecondary')
    .optional()
    .matches(/^\+?\d{10,15}$/)
    .withMessage('Secondary RSVP contact must be a valid phone number with country code, 10-15 digits, with or without + (e.g., +255692308579 or 255692308579)'),
  body('additionalInfo')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Additional info must be less than 1000 characters'),
  body('invitingFamily')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Inviting family must be less than 255 characters'),
  body('dateLang')
    .optional()
    .isString()
    .isLength({ max: 10 })
    .withMessage('Date language must be a string up to 10 characters'),
  handleValidationErrors
];

export const validateUpdateEvent = [
  param('id')
    .isUUID()
    .withMessage('Invalid event ID format'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Event title must be between 1 and 255 characters'),
  body('type')
    .optional()
    .isIn(['wedding', 'birthday', 'anniversary', 'graduation', 'corporate', 'conference', 'awards', 'festival', 'meeting', 'seminar', 'other'])
    .withMessage('Please select a valid event type'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time format (HH:MM)'),
  body('venue')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Venue must be less than 500 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'completed'])
    .withMessage('Status must be draft, active, or completed'),
  handleValidationErrors
];

// Guest validation rules
export const validateCreateGuest = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Guest name is required and must be less than 255 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .matches(/^\+\d{1,3}\d{9}$/)
    .withMessage('Phone must be a valid phone number with country code and 9 digits (e.g., +255692308579)'),
  body('tableNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Table number must be less than 50 characters'),
  body('guestCount')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Guest count must be between 1 and 10'),
  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Special requests must be less than 1000 characters'),
  handleValidationErrors
];

export const validateBulkGuestUpload = [
  body('guests')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Guests must be an array with 1-1000 items'),
  body('guests.*.name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Each guest must have a name between 1 and 255 characters'),
  body('guests.*.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Each guest must have a valid email address'),
  body('guests.*.phone')
    .optional()
    .matches(/^\+\d{1,3}\d{9}$/)
    .withMessage('Each guest phone must be a valid phone number with country code and 9 digits (e.g., +255692308579)'),
  handleValidationErrors
];

// RSVP validation rules
export const validateRSVPResponse = [
  body('response')
    .isIn(['confirmed', 'declined'])
    .withMessage('Response must be either confirmed or declined'),
  body('guestCount')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Guest count must be between 1 and 10'),
  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Special requests must be less than 1000 characters'),
  body('additionalFields')
    .optional()
    .isObject()
    .withMessage('Additional fields must be an object'),
  handleValidationErrors
];

// Check-in validation rules
export const validateCheckIn = [
  body('token')
    .isLength({ min: 32, max: 255 })
    .withMessage('Invalid check-in token'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  handleValidationErrors
];

// Messaging validation rules
export const validateSendInvites = [
  body('messageType')
    .isIn(['sms', 'whatsapp', 'email'])
    .withMessage('Message type must be sms, whatsapp, or email'),
  body('guestIds')
    .optional()
    .isArray()
    .withMessage('Guest IDs must be an array'),
  body('guestIds.*')
    .optional()
    .isUUID()
    .withMessage('Each guest ID must be a valid UUID'),
  body('customMessage')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Custom message must be less than 1000 characters'),
  handleValidationErrors
];

// Query parameter validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search term must be less than 255 characters'),
  handleValidationErrors
];

// UUID parameter validation
export const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

export const validateEventId = [
  param('eventId')
    .isUUID()
    .withMessage('Invalid event ID format'),
  handleValidationErrors
]; 