import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getPool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { authenticateToken, requireEventOwnership } from '../middleware/auth.js';
import { validateCreateEvent, validateUpdateEvent, validateUUID, validateEventId, validatePagination } from '../middleware/validation.js';
import { generateId, validateImageUpload, checkUploadRateLimit, generateSecureFilename, buildSecureUpdateQuery, clearUploadRateLimit, getUploadRateLimitStatus } from '../utils/helpers.js';
import { getPaginationInfo } from '../utils/helpers.js';

const router = express.Router();

// Configure multer for image uploads with enhanced security
const storage = multer.memoryStorage();
const imageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    // Basic MIME type check (will be validated further in the route)
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF) are allowed'), false);
    }
  }
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Debug route to check and clear rate limits (development only)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/rate-limit/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const status = getUploadRateLimitStatus(userId);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });

  router.delete('/debug/rate-limit/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      clearUploadRateLimit(userId);
      
      res.json({
        success: true,
        message: `Rate limit cleared for user ${userId}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });
}

// POST /api/events/upload-custom-card - Upload custom card image
// This route must be defined before the general POST route to avoid JSON parsing conflicts
router.post('/upload-custom-card', imageUpload.single('customCard'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Validate file
    const validationResult = validateImageUpload(req.file);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        message: validationResult.error
      });
    }

    // Check upload rate limit
    console.log(`Checking rate limit for user: ${req.user.id}`);
    try {
      const rateLimitResult = checkUploadRateLimit(req.user.id);
      console.log(`Rate limit check passed for user: ${req.user.id}`);
    } catch (error) {
      console.log(`Rate limit exceeded for user: ${req.user.id}`);
      return res.status(429).json({
        success: false,
        message: 'Upload rate limit exceeded. Please try again later.'
      });
    }

    // Generate secure filename
    const filename = generateSecureFilename(req.file.originalname);
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads/custom-cards');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save file to local storage
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);
    
    // Return the URL to the uploaded file
    const imageUrl = `/uploads/custom-cards/${filename}`;
    
    res.json({
      success: true,
      data: {
        imageUrl: imageUrl
      }
    });
  } catch (error) {
    console.error('Error uploading custom card:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload custom card'
    });
  }
});

// POST /api/events - Create new event
router.post('/', validateCreateEvent, async (req, res) => {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    // Start transaction
    await connection.beginTransaction();
    
    const userId = req.user.id;
    const {
      title,
      type,
      date,
      time,
      venue,
      additionalInfo,
      invitingFamily,
      reception,
      receptionTime,
      theme,
      rsvpContact,
      rsvpContactSecondary,
      dateLang,
      designMethod,
      customCardImageUrl,
      customCardOverlayData
    } = req.body;

    const eventId = generateId();

    // Create event
    try {
      console.log('Creating event with data:', {
        eventId,
        userId,
        title,
        type,
        designMethod,
        customCardImageUrl,
        customCardOverlayData
      });
      
      await connection.execute(
        `INSERT INTO events (
          id, user_id, title, type, date, time, venue, additional_info, inviting_family, reception, reception_time, theme, rsvp_contact, rsvp_contact_secondary, date_lang, design_method, custom_card_image_url, custom_card_overlay_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId, userId,
          title ?? null, type ?? null, 
          // For custom cards, use minimal data since details are on the card
          designMethod === 'custom' ? null : (date ?? null), 
          designMethod === 'custom' ? null : (time ?? null), 
          designMethod === 'custom' ? null : (venue ?? null), 
          designMethod === 'custom' ? null : (additionalInfo ?? null),
          designMethod === 'custom' ? null : (invitingFamily ?? null), 
          designMethod === 'custom' ? null : (reception ?? null), 
          designMethod === 'custom' ? null : (receptionTime ?? null), 
          designMethod === 'custom' ? null : (theme ?? null), 
          designMethod === 'custom' ? null : (rsvpContact ?? null), 
          designMethod === 'custom' ? null : (rsvpContactSecondary ?? null), 
          dateLang ?? 'en',
          designMethod ?? 'template', customCardImageUrl ?? null, customCardOverlayData ? JSON.stringify(customCardOverlayData) : null
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    // Verify event was created
    const [events] = await connection.execute(
      `SELECT * FROM events WHERE id = ?`,
      [eventId]
    );

    if (!events.length) {
      // console.error('Event insert failed, event not found:', eventId);
      return res.status(500).json({
        error: true,
        message: 'Event creation failed (not found after insert)'
      });
    }

    // console.log('Event created successfully:', { eventId, userId, title });

    // Create default RSVP settings based on event type
    const rsvpSettingsId = generateId();
    let rsvpTitle = title;
    let rsvpSubtitle = 'Join us for this special event';
    let rsvpWelcomeMessage = 'We would be delighted to have you join us';
    let guestCountEnabled = true;
    let specialRequestsEnabled = true;
    
    // Customize RSVP settings based on event type
    switch (type) {
      case 'wedding':
        rsvpTitle = `${title} - Wedding Invitation`;
        rsvpSubtitle = 'Join us in celebration of our special day';
        rsvpWelcomeMessage = 'We would be honored by your presence at our wedding';
        break;
      case 'birthday':
        rsvpTitle = `${title} - Birthday Party`;
        rsvpSubtitle = 'Come celebrate with us!';
        rsvpWelcomeMessage = 'Join us for an amazing birthday celebration';
        break;
      case 'anniversary':
        rsvpTitle = `${title} - Anniversary Celebration`;
        rsvpSubtitle = 'Celebrating years of love and happiness';
        rsvpWelcomeMessage = 'Join us as we celebrate this special milestone';
        break;
      case 'graduation':
        rsvpTitle = `${title} - Graduation Ceremony`;
        rsvpSubtitle = 'Celebrating academic achievement';
        rsvpWelcomeMessage = 'Join us in celebrating this academic milestone';
        break;
      case 'corporate':
      case 'conference':
      case 'meeting':
      case 'seminar':
        rsvpTitle = title;
        rsvpSubtitle = 'Professional gathering';
        rsvpWelcomeMessage = `You are invited to ${title}`;
        guestCountEnabled = false;
        break;
      case 'awards':
        rsvpTitle = `${title} - Awards Ceremony`;
        rsvpSubtitle = 'An evening of recognition and celebration';
        rsvpWelcomeMessage = 'You are cordially invited to our awards ceremony';
        guestCountEnabled = false;
        specialRequestsEnabled = false;
        break;
      case 'festival':
        rsvpTitle = `${title} - Festival`;
        rsvpSubtitle = 'Join us for a celebration';
        rsvpWelcomeMessage = 'Come and enjoy the festivities with us';
        break;
    }
    
    await connection.execute(
      `INSERT INTO rsvp_settings (
        id, event_id, title, subtitle, location, welcome_message,
        confirm_text, decline_text, guest_count_enabled, guest_count_label,
        guest_count_options, special_requests_enabled, special_requests_label,
        special_requests_placeholder, submit_button_text, thank_you_message,
        background_color, text_color, button_color, accent_color,
        rsvp_contact, rsvp_contact_secondary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rsvpSettingsId, eventId, rsvpTitle, rsvpSubtitle,
        venue || '', rsvpWelcomeMessage,
        'Yes, I\'ll be there', 'Sorry, can\'t make it', guestCountEnabled, 'Number of guests',
        JSON.stringify(['1 person', '2 people', '3 people', '4+ people']),
        specialRequestsEnabled, 'Special requests or dietary restrictions',
        'Let us know if you have any special requirements...',
        'Submit RSVP', 'Thank you for your response! We look forward to celebrating with you.',
        '#334155', '#ffffff', '#0d9488', '#14b8a6',
        rsvpContact || null, rsvpContactSecondary || null
      ]
    );

    // Get created event with RSVP settings
    const [finalEvents] = await connection.execute(
      `SELECT e.*, rs.* FROM events e
       LEFT JOIN rsvp_settings rs ON e.id = rs.event_id
       WHERE e.id = ?`,
      [eventId]
    );

    // Commit the transaction
    await connection.commit();
    
    // console.log('Event transaction committed successfully:', { eventId, userId, title });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        event: finalEvents[0]
      }
    });

  } catch (error) {
    // console.error('Create event error:', error);
    
    // Rollback transaction on error
    try {
      await connection.rollback();
      // console.log('Event creation transaction rolled back');
    } catch (rollbackError) {
      // console.error('Error rolling back transaction:', rollbackError);
    }
    
    res.status(500).json({
      error: true,
      message: 'Error creating event'
    });
  } finally {
    // Release the connection
    connection.release();
  }
});

// GET /api/events - Get user's events
router.get('/', validatePagination, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const pool = getPool();

    // Build query
    let query = `
      SELECT e.*, 
             COUNT(g.id) as guest_count,
             COUNT(CASE WHEN g.checked_in = 1 THEN 1 END) as checked_in_count
      FROM events e
      LEFT JOIN guests g ON e.id = g.event_id
      WHERE e.user_id = ?
    `;
    let params = [userId];

    if (search) {
      query += ' AND (e.title LIKE ? OR e.venue LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    query += ' GROUP BY e.id ORDER BY e.created_at DESC';

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(DISTINCT e.id) as total FROM');
    const [countResult] = await pool.execute(countQuery, params);
    const total = (countResult && countResult[0] && typeof countResult[0].total !== 'undefined') ? countResult[0].total : 0;

    // Get pagination info
    const pagination = getPaginationInfo(page, limit, total);

    // Add pagination to main query
    query += ' LIMIT ? OFFSET ?';
    params.push(pagination.itemsPerPage, pagination.offset);

    const [events] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        events,
        pagination
      }
    });

  } catch (error) {
    // console.error('Get events error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching events'
    });
  }
});

// GET /api/events/:id - Get specific event
router.get('/:id', validateUUID, requireEventOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Get event with all related data
    const [events] = await pool.execute(
      `SELECT e.id, e.user_id, e.title, e.type, e.date, e.time, e.venue, e.reception, e.reception_time, e.theme, e.rsvp_contact, e.additional_info, e.inviting_family, e.status, e.created_at, e.updated_at, e.date_lang, e.design_method, e.custom_card_image_url, e.custom_card_overlay_data,
              rs.id as rsvp_id, rs.title as rsvp_title, rs.subtitle as rsvp_subtitle, rs.location as rsvp_location, rs.welcome_message, rs.confirm_text, rs.decline_text, rs.guest_count_enabled, rs.guest_count_label, rs.guest_count_options, rs.special_requests_enabled, rs.special_requests_label, rs.special_requests_placeholder, rs.additional_fields, rs.submit_button_text, rs.thank_you_message, rs.background_color, rs.text_color, rs.button_color, rs.accent_color, rs.rsvp_contact as rsvp_contact_info,
              eid.id as invitation_id, eid.couple_name, eid.event_date, eid.event_date_words, eid.event_time as invitation_time, eid.venue as invitation_venue, eid.reception as invitation_reception, eid.reception_time as invitation_reception_time, eid.theme as invitation_theme, eid.rsvp_contact as invitation_rsvp_contact, eid.additional_info as invitation_additional_info, eid.inviting_family as invitation_inviting_family, eid.guest_name, eid.invitation_image, eid.selected_template,
              COUNT(g.id) as guest_count,
              COUNT(CASE WHEN g.checked_in = 1 THEN 1 END) as checked_in_count,
              COUNT(CASE WHEN g.status = 'confirmed' THEN 1 END) as confirmed_count,
              COUNT(CASE WHEN g.status = 'declined' THEN 1 END) as declined_count,
              COUNT(CASE WHEN g.status = 'pending' THEN 1 END) as pending_count
       FROM events e
       LEFT JOIN rsvp_settings rs ON e.id = rs.event_id
       LEFT JOIN event_invitation_data eid ON e.id = eid.event_id
       LEFT JOIN guests g ON e.id = g.event_id
       WHERE e.id = ?
       GROUP BY e.id`,
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Event not found'
      });
    }

    // Get guests for this event
    const [guests] = await pool.execute(
      'SELECT * FROM guests WHERE event_id = ? ORDER BY created_at DESC',
      [id]
    );

    const event = events[0];
    event.guests = guests;

    // Set headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({
      success: true,
      data: {
        event
      }
    });

  } catch (error) {
    // console.error('Get event error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching event'
    });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', validateUUID, requireEventOwnership, validateUpdateEvent, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const pool = getPool();

    // Define allowed fields for event updates
    const allowedFields = [
      'title', 'type', 'date', 'time', 'venue', 'reception', 'reception_time',
      'theme', 'rsvp_contact', 'rsvp_contact_secondary', 'additional_info', 'inviting_family', 'status',
      'custom_card_overlay_data'
    ];

    try {
      // Handle custom card overlay data separately if present
      let processedUpdateData = { ...updateData };
      if (updateData.custom_card_overlay_data !== undefined) {
        processedUpdateData.custom_card_overlay_data = JSON.stringify(updateData.custom_card_overlay_data);
      }

      // Build secure update query
      const updateQuery = buildSecureUpdateQuery(
        'events',
        allowedFields,
        processedUpdateData,
        'id = ?',
        [id]
      );

      // Execute the update
      await pool.execute(updateQuery.query, updateQuery.params);

      // Get updated event
      const [events] = await pool.execute(
        'SELECT * FROM events WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: {
          event: events[0],
          updatedFields: updateQuery.updateFields
        }
      });

    } catch (updateError) {
      if (updateError.message === 'No valid fields to update') {
        return res.status(400).json({
          error: true,
          message: updateError.message
        });
      }
      throw updateError;
    }

  } catch (error) {
    // console.error('Update event error:', error);
    res.status(500).json({
      error: true,
      message: 'Error updating event'
    });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', validateUUID, requireEventOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Check if event exists
    const [events] = await pool.execute(
      'SELECT id FROM events WHERE id = ?',
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Event not found'
      });
    }

    // Delete event (cascade will handle related records)
    await pool.execute('DELETE FROM events WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    // console.error('Delete event error:', error);
    res.status(500).json({
      error: true,
      message: 'Error deleting event'
    });
  }
});

// POST /api/events/:id/invitation-data - Update invitation data
router.post('/:id/invitation-data', validateUUID, requireEventOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const invitationData = req.body;
    const pool = getPool();

    // Check if invitation data already exists
    const [existing] = await pool.execute(
      'SELECT id FROM event_invitation_data WHERE event_id = ?',
      [id]
    );

    if (existing.length > 0) {
      // Update existing
      await pool.execute(
        `UPDATE event_invitation_data SET
         couple_name = ?, event_date = ?, event_date_words = ?, event_time = ?, venue = ?,
         reception = ?, reception_time = ?, theme = ?, rsvp_contact = ?, rsvp_contact_secondary = ?,
         additional_info = ?, inviting_family = ?, guest_name = ?,
         invitation_image = ?, selected_template = ?, date_lang = ?, updated_at = CURRENT_TIMESTAMP
         WHERE event_id = ?`,
        [
          invitationData.coupleName || null, invitationData.eventDate || null, invitationData.eventDateWords || null, invitationData.eventTime || null,
          invitationData.venue || null, invitationData.reception || null, invitationData.receptionTime || null,
          invitationData.theme || null, invitationData.rsvpContact || null, invitationData.rsvpContactSecondary || null, invitationData.additionalInfo || null,
          invitationData.invitingFamily || null, invitationData.guestName || null, invitationData.invitationImage || null,
          invitationData.selectedTemplate || 'template1', invitationData.dateLang || 'en',
          id
        ]
      );
    } else {
      // Create new
      const invitationId = generateId();
      await pool.execute(
        `INSERT INTO event_invitation_data (
          id, event_id, couple_name, event_date, event_date_words, event_time, venue,
          reception, reception_time, theme, rsvp_contact, rsvp_contact_secondary, additional_info,
          inviting_family, guest_name, invitation_image, selected_template, date_lang
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invitationId, id, invitationData.coupleName || null, invitationData.eventDate || null, invitationData.eventDateWords || null,
          invitationData.eventTime || null, invitationData.venue || null, invitationData.reception || null,
          invitationData.receptionTime || null, invitationData.theme || null, invitationData.rsvpContact || null, invitationData.rsvpContactSecondary || null,
          invitationData.additionalInfo || null, invitationData.invitingFamily || null,
          invitationData.guestName || null, invitationData.invitationImage || null,
          invitationData.selectedTemplate || 'template1', invitationData.dateLang || 'en'
        ]
      );
    }

    res.json({
      success: true,
      message: 'Invitation data updated successfully'
    });

  } catch (error) {
    // console.error('Update invitation data error:', error);
    res.status(500).json({
      error: true,
      message: 'Error updating invitation data'
    });
  }
});

// POST /api/events/:id/rsvp-settings - Update RSVP settings
router.post('/:id/rsvp-settings', validateUUID, requireEventOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const rsvpSettings = req.body;
    const pool = getPool();

    // console.log('RSVP update for eventId:', id, 'userId:', req.user.id);

    // Check if RSVP settings already exist
    const [existing] = await pool.execute(
      'SELECT id FROM rsvp_settings WHERE event_id = ?',
      [id]
    );

    if (existing.length > 0) {
      // Update existing
      await pool.execute(
        `UPDATE rsvp_settings SET
         title = ?, subtitle = ?, location = ?, welcome_message = ?,
         confirm_text = ?, decline_text = ?, guest_count_enabled = ?,
         guest_count_label = ?, guest_count_options = ?, special_requests_enabled = ?,
         special_requests_label = ?, special_requests_placeholder = ?,
         additional_fields = ?, submit_button_text = ?, thank_you_message = ?,
         background_color = ?, text_color = ?, button_color = ?, accent_color = ?,
         rsvp_contact = ?, rsvp_contact_secondary = ?, updated_at = CURRENT_TIMESTAMP
         WHERE event_id = ?`,
        [
          rsvpSettings.title || null, rsvpSettings.subtitle || null, rsvpSettings.location || null,
          rsvpSettings.welcomeMessage || null, rsvpSettings.confirmText || null, rsvpSettings.declineText || null,
          rsvpSettings.guestCountEnabled !== undefined ? rsvpSettings.guestCountEnabled : null, rsvpSettings.guestCountLabel || null,
          rsvpSettings.guestCountOptions ? JSON.stringify(rsvpSettings.guestCountOptions) : null, rsvpSettings.specialRequestsEnabled !== undefined ? rsvpSettings.specialRequestsEnabled : null,
          rsvpSettings.specialRequestsLabel || null, rsvpSettings.specialRequestsPlaceholder || null,
          rsvpSettings.additionalFields ? JSON.stringify(rsvpSettings.additionalFields) : null, rsvpSettings.submitButtonText || null,
          rsvpSettings.thankYouMessage || null, rsvpSettings.backgroundColor || null, rsvpSettings.textColor || null,
          rsvpSettings.buttonColor || null, rsvpSettings.accentColor || null, rsvpSettings.rsvpContact || null, rsvpSettings.rsvpContactSecondary || null, id
        ]
      );
      // console.log('RSVP settings updated for eventId:', id);
    } else {
      // Create new
      const rsvpId = generateId();
      await pool.execute(
        `INSERT INTO rsvp_settings (
          id, event_id, title, subtitle, location, welcome_message,
          confirm_text, decline_text, guest_count_enabled, guest_count_label,
          guest_count_options, special_requests_enabled, special_requests_label,
          special_requests_placeholder, additional_fields, submit_button_text,
          thank_you_message, background_color, text_color, button_color,
          accent_color, rsvp_contact
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rsvpId, id, rsvpSettings.title || null, rsvpSettings.subtitle || null, rsvpSettings.location || null,
          rsvpSettings.welcomeMessage || null, rsvpSettings.confirmText || null, rsvpSettings.declineText || null,
          rsvpSettings.guestCountEnabled !== undefined ? rsvpSettings.guestCountEnabled : null, rsvpSettings.guestCountLabel || null,
          rsvpSettings.guestCountOptions ? JSON.stringify(rsvpSettings.guestCountOptions) : null, rsvpSettings.specialRequestsEnabled !== undefined ? rsvpSettings.specialRequestsEnabled : null,
          rsvpSettings.specialRequestsLabel || null, rsvpSettings.specialRequestsPlaceholder || null,
          rsvpSettings.additionalFields ? JSON.stringify(rsvpSettings.additionalFields) : null, rsvpSettings.submitButtonText || null,
          rsvpSettings.thankYouMessage || null, rsvpSettings.backgroundColor || null, rsvpSettings.textColor || null,
          rsvpSettings.buttonColor || null, rsvpSettings.accentColor || null, rsvpSettings.rsvpContact || null
        ]
      );
      // console.log('RSVP settings created for eventId:', id);
    }

    res.json({
      success: true,
      message: 'RSVP settings updated successfully'
    });

  } catch (error) {
    // console.error('Update RSVP settings error:', error);
    res.status(500).json({
      error: true,
      message: 'Error updating RSVP settings'
    });
  }
});

// POST /api/events/:id/upload-image - Upload invitation image with enhanced security
router.post('/:id/upload-image', validateUUID, requireEventOwnership, imageUpload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Rate limiting check
    try {
      checkUploadRateLimit(userId);
    } catch (rateLimitError) {
      return res.status(429).json({
        error: true,
        message: rateLimitError.message
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No image file uploaded'
      });
    }

    // Enhanced security validation
    let validationResult;
    try {
      validationResult = validateImageUpload(req.file);
    } catch (validationError) {
      return res.status(400).json({
        error: true,
        message: validationError.message
      });
    }

    // Log upload attempt for security monitoring
    // console.log(`Image upload attempt: User ${userId}, Event ${id}, File: ${validationResult.secureFilename}, Size: ${validationResult.fileSize} bytes`);

    const pool = getPool();
    
    // Convert image to base64 for storage
    const base64Image = `data:${validationResult.detectedType};base64,${req.file.buffer.toString('base64')}`;
    
    // Update event invitation data with the new image
    const [existingInvitation] = await pool.execute(
      'SELECT id FROM event_invitation_data WHERE event_id = ?',
      [id]
    );

    if (existingInvitation.length > 0) {
      // Update existing invitation data
      await pool.execute(
        `UPDATE event_invitation_data SET 
         invitation_image = ?, 
         updated_at = CURRENT_TIMESTAMP 
         WHERE event_id = ?`,
        [base64Image, id]
      );
    } else {
      // Create new invitation data
      const invitationId = generateId();
      await pool.execute(
        `INSERT INTO event_invitation_data (
          id, event_id, invitation_image, selected_template
        ) VALUES (?, ?, ?, ?)`,
        [invitationId, id, base64Image, 'template1']
      );
    }

    // Log successful upload
    // console.log(`Image upload completed: User ${userId}, Event ${id}, File: ${validationResult.secureFilename}`);

    res.json({
      success: true,
      message: 'Invitation image uploaded successfully',
      data: {
        filename: validationResult.secureFilename,
        size: validationResult.fileSize,
        type: validationResult.detectedType
      }
    });

  } catch (error) {
    // console.error('Image upload error:', error);
    res.status(500).json({
      error: true,
      message: 'Error uploading image'
    });
  }
});

// GET /api/events/security-status - Get security monitoring data
router.get('/security-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // This would typically connect to a security monitoring service
    // For now, we'll return basic security status
    const securityStatus = {
      userId,
      timestamp: new Date().toISOString(),
      uploadRateLimit: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxAttempts: 10
      },
      fileValidation: {
        enabled: true,
        signatureValidation: true,
        malwareScanning: true,
        sizeLimits: {
          images: '5MB',
          documents: '10MB'
        }
      },
      allowedFileTypes: {
        images: ['image/jpeg', 'image/png', 'image/gif'],
        documents: [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
      }
    };

    res.json({
      success: true,
      data: securityStatus
    });

  } catch (error) {
    res.status(500).json({
      error: true,
      message: 'Error fetching security status'
    });
  }
});

export default router; 