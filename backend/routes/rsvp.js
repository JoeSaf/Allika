import express from 'express';
import { getPool } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateRSVPResponse, validateUUID, validateEventId } from '../middleware/validation.js';
import { formatDateTime } from '../utils/helpers.js';
import { v4 as uuidv4 } from 'uuid';
import puppeteer from 'puppeteer';
import { generateId, generateRSVPToken, generateGuestQRCode, parseCSVData, formatPhoneNumber, generateRSVPAlias, cacheInvitationImage, getCachedInvitationImage, generateInvitationCacheKey, cleanupImageCache, trackImageGeneration, getImageGenerationMetrics } from '../utils/helpers.js';

const router = express.Router();

// GET /api/rsvp/:token - Get RSVP info (public)
router.get('/:tokenOrAlias', async (req, res) => {
  try {
    const { tokenOrAlias } = req.params;
    const pool = getPool();

    // Try to find guest by alias first, then fallback to token
    let [guests] = await pool.execute(
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
       WHERE g.rsvp_alias = ? AND e.status = 'active'`,
      [tokenOrAlias]
    );
    if (guests.length === 0) {
      // Fallback to token
      [guests] = await pool.execute(
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
        [tokenOrAlias]
      );
    }

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
router.post('/:tokenOrAlias', validateRSVPResponse, async (req, res) => {
  try {
    const { tokenOrAlias } = req.params;
    const { response, guestCount, specialRequests, additionalFields } = req.body;
    const pool = getPool();

    // Try to find guest by alias first, then fallback to token
    let [guests] = await pool.execute(
      `SELECT g.*, e.id as event_id, e.status as event_status
       FROM guests g
       JOIN events e ON g.event_id = e.id
       WHERE g.rsvp_alias = ? AND e.status = 'active'`,
      [tokenOrAlias]
    );
    if (guests.length === 0) {
      [guests] = await pool.execute(
        `SELECT g.*, e.id as event_id, e.status as event_status
         FROM guests g
         JOIN events e ON g.event_id = e.id
         WHERE g.rsvp_token = ? AND e.status = 'active'`,
        [tokenOrAlias]
      );
    }

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

router.get('/invitation/:tokenOrAlias/image', async (req, res) => {
  const startTime = Date.now();
  let wasCached = false;
  
  try {
    const { tokenOrAlias } = req.params;
    const pool = getPool();

    // Check cache first
    const cacheKey = generateInvitationCacheKey(tokenOrAlias);
    const cachedImage = getCachedInvitationImage(cacheKey);
    if (cachedImage) {
      wasCached = true;
      trackImageGeneration(startTime, true);
      res.set('Content-Type', 'image/png');
      res.set('X-Cache', 'HIT');
      return res.send(cachedImage);
    }

    // Try to find guest by alias first, then fallback to token
    let [guests] = await pool.execute(
      `SELECT g.*, e.title as event_title, e.date as event_date, e.venue as event_venue
       FROM guests g
       JOIN events e ON g.event_id = e.id
       WHERE g.rsvp_alias = ? AND e.status = 'active'`,
      [tokenOrAlias]
    );
    if (guests.length === 0) {
      [guests] = await pool.execute(
        `SELECT g.*, e.title as event_title, e.date as event_date, e.venue as event_venue
         FROM guests g
         JOIN events e ON g.event_id = e.id
         WHERE g.rsvp_token = ? AND e.status = 'active'`,
        [tokenOrAlias]
      );
    }
    if (guests.length === 0) {
      return res.status(404).json({ error: true, message: 'RSVP link not found or event is not active' });
    }
    const guest = guests[0];

    // Optimized HTML template with better styling
    const html = `
      <html>
      <head>
        <meta charset='utf-8'>
        <style>
          body { 
            background: #1e293b; 
            color: #fff; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          .card { 
            background: linear-gradient(135deg, #232f3e 0%, #1e293b 100%);
            border-radius: 20px; 
            width: 400px; 
            padding: 40px; 
            box-shadow: 0 8px 32px rgba(0,0,0,0.3); 
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .title { 
            font-size: 2.2rem; 
            font-weight: 700; 
            margin-bottom: 12px;
            background: linear-gradient(45deg, #14b8a6, #0d9488);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .subtitle { 
            color: #cbd5e1; 
            font-size: 1.2rem; 
            margin-bottom: 12px;
            font-weight: 500;
          }
          .venue { 
            color: #94a3b8; 
            font-size: 1.1rem; 
            margin-bottom: 24px;
            font-style: italic;
          }
          .dear { 
            font-size: 1.3rem; 
            font-weight: 600; 
            margin-bottom: 12px;
            color: #e2e8f0;
          }
          .admit { 
            color: #14b8a6; 
            font-size: 1.2rem; 
            font-weight: 600; 
            margin-bottom: 24px;
            padding: 8px 16px;
            background: rgba(20, 184, 166, 0.1);
            border-radius: 8px;
            display: inline-block;
          }
          .qr { 
            margin: 32px 0;
            padding: 16px;
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
          }
          .qr img {
            width: 160px; 
            height: 160px; 
            background: #fff; 
            border-radius: 12px;
            padding: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          }
          .footer { 
            color: #94a3b8; 
            font-size: 0.95rem; 
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid rgba(255,255,255,0.1);
          }
        </style>
      </head>
      <body>
        <div class='card'>
          <div class='title'>${guest.event_title}</div>
          <div class='subtitle'>${new Date(guest.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div class='venue'>${guest.event_venue || ''}</div>
          <div class='dear'>Dear ${guest.name},</div>
          <div>You are cordially invited to our event!</div>
          <div class='admit'>Admit: ${guest.guest_count === 1 ? 'Single' : guest.guest_count === 2 ? 'Double' : guest.guest_count === 3 ? 'Triple' : `${guest.guest_count} Guests`}</div>
          <div class='qr'>
            <img src='data:image/png;base64,${guest.qr_code_data}' alt='QR Code' />
          </div>
          <div class='footer'>RSVP: ${guest.rsvp_contact || ''}</div>
        </div>
      </body>
      </html>
    `;

    // Optimized Puppeteer configuration
    const browser = await puppeteer.launch({ 
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      headless: true
    });
    
    const page = await browser.newPage();
    
    // Set viewport for optimal rendering
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });
    
    // Set content and wait for rendering
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Wait for the card to be fully rendered
    await page.waitForFunction(() => {
      const card = document.querySelector('.card');
      return card && card.offsetHeight > 0;
    }, { timeout: 10000 });
    
    // Screenshot the card
    const cardElement = await page.$('.card');
    const imageBuffer = await cardElement.screenshot({ 
      type: 'png',
      omitBackground: false
    });
    
    await browser.close();

    // Cache the generated image
    cacheInvitationImage(cacheKey, imageBuffer);

    trackImageGeneration(startTime, false);
    res.set('Content-Type', 'image/png');
    res.set('X-Cache', 'MISS');
    res.send(imageBuffer);
    
  } catch (error) {
    trackImageGeneration(startTime, false);
    // console.error('Error generating invitation image:', error);
    res.status(500).json({ error: true, message: 'Error generating invitation image' });
  }
});

// GET /api/rsvp/metrics - Get image generation metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = getImageGenerationMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: 'Error fetching metrics'
    });
  }
});

export default router; 