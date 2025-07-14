import express from 'express';
import { getPool } from '../config/database.js';
import { authenticateToken, requireEventOwnership } from '../middleware/auth.js';
import { validateCreateEvent, validateUpdateEvent, validateUUID, validatePagination } from '../middleware/validation.js';
import { generateId, getPaginationInfo } from '../utils/helpers.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/events - Create new event
router.post('/', validateCreateEvent, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      type,
      date,
      time,
      venue,
      reception,
      receptionTime,
      theme,
      rsvpContact,
      additionalInfo,
      invitingFamily
    } = req.body;

    const pool = getPool();
    const eventId = generateId();

    // Create event
    await pool.execute(
      `INSERT INTO events (
        id, user_id, title, type, date, time, venue, reception, 
        reception_time, theme, rsvp_contact, additional_info, inviting_family
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId, userId, title, type, date, time, venue, reception,
        receptionTime, theme, rsvpContact, additionalInfo, invitingFamily
      ]
    );

    // Create default RSVP settings
    const rsvpSettingsId = generateId();
    await pool.execute(
      `INSERT INTO rsvp_settings (
        id, event_id, title, subtitle, location, welcome_message,
        confirm_text, decline_text, guest_count_enabled, guest_count_label,
        guest_count_options, special_requests_enabled, special_requests_label,
        special_requests_placeholder, submit_button_text, thank_you_message,
        background_color, text_color, button_color, accent_color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rsvpSettingsId, eventId, title, 'Join us for this special event',
        venue || '', 'We would be delighted to have you join us',
        'Yes, I\'ll be there', 'Sorry, can\'t make it', true, 'Number of guests',
        JSON.stringify(['1 person', '2 people', '3 people', '4+ people']),
        true, 'Special requests or dietary restrictions',
        'Let us know if you have any special requirements...',
        'Submit RSVP', 'Thank you for your response! We look forward to celebrating with you.',
        '#334155', '#ffffff', '#0d9488', '#14b8a6'
      ]
    );

    // Get created event with RSVP settings
    const [events] = await pool.execute(
      `SELECT e.*, rs.* FROM events e
       LEFT JOIN rsvp_settings rs ON e.id = rs.event_id
       WHERE e.id = ?`,
      [eventId]
    );

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: {
        event: events[0]
      }
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      error: true,
      message: 'Error creating event'
    });
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
    const total = countResult[0].total;

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
    console.error('Get events error:', error);
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
      `SELECT e.*, 
              rs.*,
              eid.*,
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

    res.json({
      success: true,
      data: {
        event
      }
    });

  } catch (error) {
    console.error('Get event error:', error);
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

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    const allowedFields = [
      'title', 'type', 'date', 'time', 'venue', 'reception', 'reception_time',
      'theme', 'rsvp_contact', 'additional_info', 'inviting_family', 'status'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updateData[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No valid fields to update'
      });
    }

    updateValues.push(id);

    // Update event
    await pool.execute(
      `UPDATE events SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Get updated event
    const [events] = await pool.execute(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: {
        event: events[0]
      }
    });

  } catch (error) {
    console.error('Update event error:', error);
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
    console.error('Delete event error:', error);
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
         couple_name = ?, event_date = ?, event_time = ?, venue = ?,
         reception = ?, reception_time = ?, theme = ?, rsvp_contact = ?,
         additional_info = ?, inviting_family = ?, guest_name = ?,
         invitation_image = ?, updated_at = CURRENT_TIMESTAMP
         WHERE event_id = ?`,
        [
          invitationData.coupleName, invitationData.eventDate, invitationData.eventTime,
          invitationData.venue, invitationData.reception, invitationData.receptionTime,
          invitationData.theme, invitationData.rsvpContact, invitationData.additionalInfo,
          invitationData.invitingFamily, invitationData.guestName, invitationData.invitationImage,
          id
        ]
      );
    } else {
      // Create new
      const invitationId = generateId();
      await pool.execute(
        `INSERT INTO event_invitation_data (
          id, event_id, couple_name, event_date, event_time, venue,
          reception, reception_time, theme, rsvp_contact, additional_info,
          inviting_family, guest_name, invitation_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invitationId, id, invitationData.coupleName, invitationData.eventDate,
          invitationData.eventTime, invitationData.venue, invitationData.reception,
          invitationData.receptionTime, invitationData.theme, invitationData.rsvpContact,
          invitationData.additionalInfo, invitationData.invitingFamily,
          invitationData.guestName, invitationData.invitationImage
        ]
      );
    }

    res.json({
      success: true,
      message: 'Invitation data updated successfully'
    });

  } catch (error) {
    console.error('Update invitation data error:', error);
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
         rsvp_contact = ?, updated_at = CURRENT_TIMESTAMP
         WHERE event_id = ?`,
        [
          rsvpSettings.title, rsvpSettings.subtitle, rsvpSettings.location,
          rsvpSettings.welcomeMessage, rsvpSettings.confirmText, rsvpSettings.declineText,
          rsvpSettings.guestCountEnabled, rsvpSettings.guestCountLabel,
          JSON.stringify(rsvpSettings.guestCountOptions), rsvpSettings.specialRequestsEnabled,
          rsvpSettings.specialRequestsLabel, rsvpSettings.specialRequestsPlaceholder,
          JSON.stringify(rsvpSettings.additionalFields || []), rsvpSettings.submitButtonText,
          rsvpSettings.thankYouMessage, rsvpSettings.backgroundColor, rsvpSettings.textColor,
          rsvpSettings.buttonColor, rsvpSettings.accentColor, rsvpSettings.rsvpContact, id
        ]
      );
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
          rsvpId, id, rsvpSettings.title, rsvpSettings.subtitle, rsvpSettings.location,
          rsvpSettings.welcomeMessage, rsvpSettings.confirmText, rsvpSettings.declineText,
          rsvpSettings.guestCountEnabled, rsvpSettings.guestCountLabel,
          JSON.stringify(rsvpSettings.guestCountOptions), rsvpSettings.specialRequestsEnabled,
          rsvpSettings.specialRequestsLabel, rsvpSettings.specialRequestsPlaceholder,
          JSON.stringify(rsvpSettings.additionalFields || []), rsvpSettings.submitButtonText,
          rsvpSettings.thankYouMessage, rsvpSettings.backgroundColor, rsvpSettings.textColor,
          rsvpSettings.buttonColor, rsvpSettings.accentColor, rsvpSettings.rsvpContact
        ]
      );
    }

    res.json({
      success: true,
      message: 'RSVP settings updated successfully'
    });

  } catch (error) {
    console.error('Update RSVP settings error:', error);
    res.status(500).json({
      error: true,
      message: 'Error updating RSVP settings'
    });
  }
});

export default router; 