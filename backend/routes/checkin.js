import express from 'express';
import { getPool } from '../config/database.js';
import { authenticateToken, requireEventOwnership } from '../middleware/auth.js';
import { validateCheckIn, validateUUID, validateEventId } from '../middleware/validation.js';
import { generateId } from '../utils/helpers.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/checkin - Check in guest by token
router.post('/', validateCheckIn, async (req, res) => {
  try {
    const { token, notes } = req.body;
    const checkedInBy = req.user.id;
    const pool = getPool();

    // Get guest info
    const [guests] = await pool.execute(
      `SELECT g.*, e.id as event_id, e.title as event_title, e.user_id as event_owner
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

    // Check if user has permission to check in this guest
    if (guest.event_owner !== checkedInBy) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to check in guests for this event'
      });
    }

    // Check if already checked in
    if (guest.checked_in) {
      return res.status(409).json({
        error: true,
        message: 'Guest has already been checked in',
        data: {
          guest: {
            id: guest.id,
            name: guest.name,
            checkInTime: guest.check_in_time
          }
        }
      });
    }

    // Check in guest
    await pool.execute(
      'UPDATE guests SET checked_in = 1, check_in_time = CURRENT_TIMESTAMP WHERE id = ?',
      [guest.id]
    );

    // Create check-in log
    const logId = generateId();
    await pool.execute(
      `INSERT INTO checkin_logs (
        id, guest_id, event_id, checked_in_by, notes
      ) VALUES (?, ?, ?, ?, ?)`,
      [logId, guest.id, guest.event_id, checkedInBy, notes || null]
    );

    // Get updated guest info
    const [updatedGuests] = await pool.execute(
      'SELECT * FROM guests WHERE id = ?',
      [guest.id]
    );

    res.json({
      success: true,
      message: `${guest.name} has been successfully checked in`,
      data: {
        guest: updatedGuests[0],
        checkInLog: {
          id: logId,
          checkedInBy: req.user.name,
          checkInTime: new Date().toISOString(),
          notes
        }
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      error: true,
      message: 'Error checking in guest'
    });
  }
});

// POST /api/checkin/qr-scan - Check in guest by QR code scan
router.post('/qr-scan', async (req, res) => {
  try {
    const { qrData } = req.body;
    const checkedInBy = req.user.id;
    const pool = getPool();

    if (!qrData) {
      return res.status(400).json({
        error: true,
        message: 'QR code data is required'
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: 'Invalid QR code data format'
      });
    }

    const { guestId, eventId, token } = parsedData;

    // Get guest info
    const [guests] = await pool.execute(
      `SELECT g.*, e.id as event_id, e.title as event_title, e.user_id as event_owner
       FROM guests g
       JOIN events e ON g.event_id = e.id
       WHERE g.id = ? AND g.event_id = ? AND g.rsvp_token = ?`,
      [guestId, eventId, token]
    );

    if (guests.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Guest not found or QR code is invalid'
      });
    }

    const guest = guests[0];

    // Check if user has permission to check in this guest
    if (guest.event_owner !== checkedInBy) {
      return res.status(403).json({
        error: true,
        message: 'You do not have permission to check in guests for this event'
      });
    }

    // Check if already checked in
    if (guest.checked_in) {
      return res.status(409).json({
        error: true,
        message: 'Guest has already been checked in',
        data: {
          guest: {
            id: guest.id,
            name: guest.name,
            checkInTime: guest.check_in_time
          }
        }
      });
    }

    // Check in guest
    await pool.execute(
      'UPDATE guests SET checked_in = 1, check_in_time = CURRENT_TIMESTAMP WHERE id = ?',
      [guest.id]
    );

    // Create check-in log
    const logId = generateId();
    await pool.execute(
      `INSERT INTO checkin_logs (
        id, guest_id, event_id, checked_in_by
      ) VALUES (?, ?, ?, ?)`,
      [logId, guest.id, guest.event_id, checkedInBy]
    );

    // Get updated guest info
    const [updatedGuests] = await pool.execute(
      'SELECT * FROM guests WHERE id = ?',
      [guest.id]
    );

    res.json({
      success: true,
      message: `${guest.name} has been successfully checked in via QR code`,
      data: {
        guest: updatedGuests[0],
        checkInLog: {
          id: logId,
          checkedInBy: req.user.name,
          checkInTime: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('QR scan check-in error:', error);
    res.status(500).json({
      error: true,
      message: 'Error processing QR code check-in'
    });
  }
});

// POST /api/checkin/:eventId/:guestId - Manual check-in by guest ID
router.post('/:eventId/:guestId', validateEventId, requireEventOwnership, validateUUID, async (req, res) => {
  try {
    const { eventId, guestId } = req.params;
    const { notes } = req.body;
    const checkedInBy = req.user.id;
    const pool = getPool();

    // Get guest info
    const [guests] = await pool.execute(
      'SELECT * FROM guests WHERE id = ? AND event_id = ?',
      [guestId, eventId]
    );

    if (guests.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Guest not found'
      });
    }

    const guest = guests[0];

    // Check if already checked in
    if (guest.checked_in) {
      return res.status(409).json({
        error: true,
        message: 'Guest has already been checked in',
        data: {
          guest: {
            id: guest.id,
            name: guest.name,
            checkInTime: guest.check_in_time
          }
        }
      });
    }

    // Check in guest
    await pool.execute(
      'UPDATE guests SET checked_in = 1, check_in_time = CURRENT_TIMESTAMP WHERE id = ?',
      [guest.id]
    );

    // Create check-in log
    const logId = generateId();
    await pool.execute(
      `INSERT INTO checkin_logs (
        id, guest_id, event_id, checked_in_by, notes
      ) VALUES (?, ?, ?, ?, ?)`,
      [logId, guest.id, eventId, checkedInBy, notes || null]
    );

    // Get updated guest info
    const [updatedGuests] = await pool.execute(
      'SELECT * FROM guests WHERE id = ?',
      [guest.id]
    );

    res.json({
      success: true,
      message: `${guest.name} has been successfully checked in`,
      data: {
        guest: updatedGuests[0],
        checkInLog: {
          id: logId,
          checkedInBy: req.user.name,
          checkInTime: new Date().toISOString(),
          notes
        }
      }
    });

  } catch (error) {
    console.error('Manual check-in error:', error);
    res.status(500).json({
      error: true,
      message: 'Error checking in guest'
    });
  }
});

// GET /api/checkin/:eventId/logs - Get check-in logs for event
router.get('/:eventId/logs', validateEventId, requireEventOwnership, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const pool = getPool();

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM checkin_logs WHERE event_id = ?',
      [eventId]
    );
    const total = countResult[0].total;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get check-in logs with guest and user info
    const [logs] = await pool.execute(
      `SELECT cl.*, g.name as guest_name, g.email as guest_email,
              u.name as checked_in_by_name
       FROM checkin_logs cl
       JOIN guests g ON cl.guest_id = g.id
       LEFT JOIN users u ON cl.checked_in_by = u.id
       WHERE cl.event_id = ?
       ORDER BY cl.check_in_time DESC
       LIMIT ? OFFSET ?`,
      [eventId, parseInt(limit), offset]
    );

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get check-in logs error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching check-in logs'
    });
  }
});

// GET /api/checkin/:eventId/summary - Get check-in summary for event
router.get('/:eventId/summary', validateEventId, requireEventOwnership, async (req, res) => {
  try {
    const { eventId } = req.params;
    const pool = getPool();

    // Get check-in statistics
    const [stats] = await pool.execute(
      `SELECT 
         COUNT(*) as total_guests,
         COUNT(CASE WHEN checked_in = 1 THEN 1 END) as checked_in_count,
         COUNT(CASE WHEN checked_in = 0 THEN 1 END) as not_checked_in_count,
         COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
         COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined_count,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
       FROM guests 
       WHERE event_id = ?`,
      [eventId]
    );

    // Get recent check-ins
    const [recentCheckins] = await pool.execute(
      `SELECT cl.*, g.name as guest_name, g.email as guest_email,
              u.name as checked_in_by_name
       FROM checkin_logs cl
       JOIN guests g ON cl.guest_id = g.id
       LEFT JOIN users u ON cl.checked_in_by = u.id
       WHERE cl.event_id = ?
       ORDER BY cl.check_in_time DESC
       LIMIT 10`,
      [eventId]
    );

    const summary = {
      statistics: stats[0],
      recentCheckins,
      checkInRate: stats[0].total_guests > 0 ? 
        Math.round((stats[0].checked_in_count / stats[0].total_guests) * 100) : 0
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Get check-in summary error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching check-in summary'
    });
  }
});

// POST /api/checkin/:eventId/:guestId/undo - Undo check-in
router.post('/:eventId/:guestId/undo', validateEventId, requireEventOwnership, validateUUID, async (req, res) => {
  try {
    const { eventId, guestId } = req.params;
    const { reason } = req.body;
    const pool = getPool();

    // Get guest info
    const [guests] = await pool.execute(
      'SELECT * FROM guests WHERE id = ? AND event_id = ?',
      [guestId, eventId]
    );

    if (guests.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Guest not found'
      });
    }

    const guest = guests[0];

    // Check if guest is checked in
    if (!guest.checked_in) {
      return res.status(409).json({
        error: true,
        message: 'Guest is not checked in'
      });
    }

    // Undo check-in
    await pool.execute(
      'UPDATE guests SET checked_in = 0, check_in_time = NULL WHERE id = ?',
      [guest.id]
    );

    // Create undo log entry
    const logId = generateId();
    await pool.execute(
      `INSERT INTO checkin_logs (
        id, guest_id, event_id, checked_in_by, notes
      ) VALUES (?, ?, ?, ?, ?)`,
      [logId, guest.id, eventId, req.user.id, `Check-in undone: ${reason || 'No reason provided'}`]
    );

    // Get updated guest info
    const [updatedGuests] = await pool.execute(
      'SELECT * FROM guests WHERE id = ?',
      [guest.id]
    );

    res.json({
      success: true,
      message: `Check-in for ${guest.name} has been undone`,
      data: {
        guest: updatedGuests[0]
      }
    });

  } catch (error) {
    console.error('Undo check-in error:', error);
    res.status(500).json({
      error: true,
      message: 'Error undoing check-in'
    });
  }
});

export default router; 