import express from 'express';
import { getPool } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateRSVPResponse } from '../middleware/validation.js';
import { formatDateTime } from '../utils/helpers.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// GET /api/rsvp/:token - Get RSVP info (public)
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const pool = getPool();

    // Get guest and event info
    const [guests] = await pool.execute(
      `SELECT g.*, e.title as event_title, e.date as event_date, e.time as event_time,
              e.venue as event_venue, e.reception as event_reception, e.reception_time as event_reception_time,
              e.theme as event_theme, e.rsvp_contact as event_rsvp_contact,
              rs.title as rsvp_title, rs.subtitle as rsvp_subtitle, rs.location as rsvp_location,
              rs.welcome_message, rs.confirm_text, rs.decline_text, rs.guest_count_enabled,
              rs.guest_count_label, rs.guest_count_options, rs.special_requests_enabled,
              rs.special_requests_label, rs.special_requests_placeholder, rs.additional_fields,
              rs.submit_button_text, rs.thank_you_message, rs.background_color, rs.text_color,
              rs.button_color, rs.accent_color, rs.rsvp_contact
       FROM guests g
       JOIN events e ON g.event_id = e.id
       LEFT JOIN rsvp_settings rs ON e.id = rs.event_id
       WHERE g.rsvp_token = ? AND e.status = 'active'`,
      [token]
    );

    if (guests.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'RSVP link not found or event is not active'
      });
    }

    const guest = guests[0];

    // Check if guest has already responded
    const [responses] = await pool.execute(
      'SELECT * FROM rsvp_responses WHERE guest_id = ? ORDER BY created_at DESC LIMIT 1',
      [guest.id]
    );

    // Fetch invitation data for the event
    const [invitationRows] = await pool.execute(
      'SELECT * FROM event_invitation_data WHERE event_id = ?',
      [guest.event_id]
    );
    const invitationData = invitationRows[0] || {};

    // Ensure camelCase for selectedTemplate
    if (invitationData.selected_template) {
      invitationData.selectedTemplate = invitationData.selected_template;
    }

    const rsvpData = {
      guest: {
        id: guest.id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        status: guest.status,
        guestCount: guest.guest_count,
        specialRequests: guest.special_requests
      },
      event: {
        title: guest.event_title,
        date: guest.event_date,
        time: guest.event_time,
        venue: guest.event_venue,
        reception: guest.event_reception,
        receptionTime: guest.event_reception_time,
        theme: guest.event_theme,
        rsvpContact: guest.event_rsvp_contact
      },
      rsvpSettings: {
        title: guest.rsvp_title,
        subtitle: guest.rsvp_subtitle,
        location: guest.rsvp_location,
        welcomeMessage: guest.welcome_message,
        confirmText: guest.confirm_text,
        declineText: guest.decline_text,
        guestCountEnabled: guest.guest_count_enabled,
        guestCountLabel: guest.guest_count_label,
        guestCountOptions: guest.guest_count_options ? JSON.parse(guest.guest_count_options) : [],
        specialRequestsEnabled: guest.special_requests_enabled,
        specialRequestsLabel: guest.special_requests_label,
        specialRequestsPlaceholder: guest.special_requests_placeholder,
        additionalFields: guest.additional_fields ? JSON.parse(guest.additional_fields) : [],
        submitButtonText: guest.submit_button_text,
        thankYouMessage: guest.thank_you_message,
        backgroundColor: guest.background_color,
        textColor: guest.text_color,
        buttonColor: guest.button_color,
        accentColor: guest.accent_color,
        rsvpContact: guest.rsvp_contact
      },
      invitationData, // <-- include invitation data
      hasResponded: responses.length > 0,
      lastResponse: responses.length > 0 ? responses[0] : null
    };

    res.json({
      success: true,
      data: rsvpData
    });

  } catch (error) {
    console.error('Get RSVP info error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching RSVP information'
    });
  }
});

// POST /api/rsvp/:token - Submit RSVP response
router.post('/:token', validateRSVPResponse, async (req, res) => {
  try {
    const { token } = req.params;
    const { response, guestCount, specialRequests, additionalFields } = req.body;
    const pool = getPool();

    // Get guest info
    const [guests] = await pool.execute(
      `SELECT g.*, e.id as event_id, e.status as event_status
       FROM guests g
       JOIN events e ON g.event_id = e.id
       WHERE g.rsvp_token = ? AND e.status = 'active'`,
      [token]
    );

    if (guests.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'RSVP link not found or event is not active'
      });
    }

    const guest = guests[0];

    // Check if already responded
    const [existingResponses] = await pool.execute(
      'SELECT id FROM rsvp_responses WHERE guest_id = ?',
      [guest.id]
    );

    if (existingResponses.length > 0) {
      return res.status(409).json({
        error: true,
        message: 'RSVP response already submitted'
      });
    }

    // Create RSVP response
    const responseId = uuidv4();
    await pool.execute(
      `INSERT INTO rsvp_responses (
        id, guest_id, event_id, response, guest_count, special_requests,
        additional_fields, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        responseId, guest.id, guest.event_id, response, guestCount || 1,
        specialRequests, JSON.stringify(additionalFields || {}),
        req.ip, req.get('User-Agent')
      ]
    );

    // Update guest status and details
    await pool.execute(
      `UPDATE guests SET 
       status = ?, guest_count = ?, special_requests = ?, 
       additional_fields = ?, rsvp_date = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        response, guestCount || 1, specialRequests,
        JSON.stringify(additionalFields || {}), guest.id
      ]
    );

    // Get updated guest info
    const [updatedGuests] = await pool.execute(
      'SELECT * FROM guests WHERE id = ?',
      [guest.id]
    );

    res.json({
      success: true,
      message: 'RSVP response submitted successfully',
      data: {
        guest: updatedGuests[0],
        response: {
          id: responseId,
          response,
          guestCount: guestCount || 1,
          specialRequests,
          additionalFields,
          submittedAt: formatDateTime(new Date())
        }
      }
    });

  } catch (error) {
    console.error('Submit RSVP error:', error);
    res.status(500).json({
      error: true,
      message: 'Error submitting RSVP response'
    });
  }
});

// GET /api/rsvp/:token/qr-code - Get QR code for guest
router.get('/:token/qr-code', async (req, res) => {
  try {
    const { token } = req.params;
    const pool = getPool();

    // Get guest info
    const [guests] = await pool.execute(
      'SELECT id, event_id, rsvp_token, qr_code_data FROM guests WHERE rsvp_token = ?',
      [token]
    );

    if (guests.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Guest not found'
      });
    }

    const guest = guests[0];

    if (!guest.qr_code_data) {
      return res.status(404).json({
        error: true,
        message: 'QR code not available for this guest'
      });
    }

    res.json({
      success: true,
      data: {
        qrCode: guest.qr_code_data
      }
    });

  } catch (error) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching QR code'
    });
  }
});

// GET /api/rsvp/:token/status - Get RSVP status
router.get('/:token/status', async (req, res) => {
  try {
    const { token } = req.params;
    const pool = getPool();

    // Get guest and response info
    const [guests] = await pool.execute(
      `SELECT g.id, g.name, g.status, g.rsvp_date, g.guest_count, g.special_requests,
              e.title as event_title, e.date as event_date, e.venue as event_venue
       FROM guests g
       JOIN events e ON g.event_id = e.id
       WHERE g.rsvp_token = ?`,
      [token]
    );

    if (guests.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Guest not found'
      });
    }

    const guest = guests[0];

    // Get latest response
    const [responses] = await pool.execute(
      'SELECT * FROM rsvp_responses WHERE guest_id = ? ORDER BY created_at DESC LIMIT 1',
      [guest.id]
    );

    const statusData = {
      guest: {
        name: guest.name,
        status: guest.status,
        rsvpDate: guest.rsvp_date,
        guestCount: guest.guest_count,
        specialRequests: guest.special_requests
      },
      event: {
        title: guest.event_title,
        date: guest.event_date,
        venue: guest.event_venue
      },
      response: responses.length > 0 ? responses[0] : null
    };

    res.json({
      success: true,
      data: statusData
    });

  } catch (error) {
    console.error('Get RSVP status error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching RSVP status'
    });
  }
});

export default router; 