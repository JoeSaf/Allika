import express from 'express';
import { getPool } from '../config/database.js';
import { authenticateToken, requireEventOwnership } from '../middleware/auth.js';
import { validateEventId } from '../middleware/validation.js';
import { calculateResponseRate } from '../utils/helpers.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/analytics/:eventId - Get event analytics
router.get('/:eventId', validateEventId, requireEventOwnership, async (req, res) => {
  try {
    const { eventId } = req.params;
    const pool = getPool();

    // Get guest statistics
    const [guestStats] = await pool.execute(
      `SELECT 
         COUNT(*) as total_guests,
         COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
         COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined_count,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
         COUNT(CASE WHEN checked_in = 1 THEN 1 END) as checked_in_count,
         SUM(guest_count) as total_guest_count
       FROM guests 
       WHERE event_id = ?`,
      [eventId]
    );

    // Get message statistics
    const [messageStats] = await pool.execute(
      `SELECT 
         COUNT(*) as total_messages,
         COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
         COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
         COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
         COUNT(CASE WHEN message_type = 'sms' THEN 1 END) as sms_count,
         COUNT(CASE WHEN message_type = 'whatsapp' THEN 1 END) as whatsapp_count
       FROM message_logs 
       WHERE event_id = ?`,
      [eventId]
    );

    // Get RSVP response timeline
    const [rsvpTimeline] = await pool.execute(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as responses
       FROM rsvp_responses 
       WHERE event_id = ?
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [eventId]
    );

    // Get check-in timeline
    const [checkinTimeline] = await pool.execute(
      `SELECT 
         DATE(check_in_time) as date,
         COUNT(*) as checkins
       FROM checkin_logs 
       WHERE event_id = ?
       GROUP BY DATE(check_in_time)
       ORDER BY date`,
      [eventId]
    );

    // Get recent activity
    const [recentActivity] = await pool.execute(
      `SELECT 
         'rsvp' as type,
         rr.created_at as timestamp,
         g.name as guest_name,
         rr.response as action,
         rr.guest_count
       FROM rsvp_responses rr
       JOIN guests g ON rr.guest_id = g.id
       WHERE rr.event_id = ?
       
       UNION ALL
       
       SELECT 
         'checkin' as type,
         cl.check_in_time as timestamp,
         g.name as guest_name,
         'checked in' as action,
         NULL as guest_count
       FROM checkin_logs cl
       JOIN guests g ON cl.guest_id = g.id
       WHERE cl.event_id = ?
       
       ORDER BY timestamp DESC
       LIMIT 20`,
      [eventId, eventId]
    );

    // Calculate response rate
    const stats = guestStats[0];
    const responseRate = calculateResponseRate(
      stats.confirmed_count,
      stats.declined_count,
      stats.total_guests
    );

    const analytics = {
      guestStatistics: {
        totalGuests: stats.total_guests,
        confirmedCount: stats.confirmed_count,
        declinedCount: stats.declined_count,
        pendingCount: stats.pending_count,
        checkedInCount: stats.checked_in_count,
        totalGuestCount: stats.total_guest_count,
        responseRate
      },
      messageStatistics: {
        totalMessages: messageStats[0].total_messages,
        sentCount: messageStats[0].sent_count,
        deliveredCount: messageStats[0].delivered_count,
        failedCount: messageStats[0].failed_count,
        smsCount: messageStats[0].sms_count,
        whatsappCount: messageStats[0].whatsapp_count,
        deliveryRate: messageStats[0].total_messages > 0 ? 
          Math.round((messageStats[0].delivered_count / messageStats[0].total_messages) * 100) : 0
      },
      timeline: {
        rsvpResponses: rsvpTimeline,
        checkins: checkinTimeline
      },
      recentActivity
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching analytics'
    });
  }
});

// GET /api/analytics/:eventId/guests - Get detailed guest analytics
router.get('/:eventId/guests', validateEventId, requireEventOwnership, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 50 } = req.query;
    const pool = getPool();

    // Build query
    let query = `
      SELECT g.*, 
             rr.response as last_response,
             rr.created_at as response_date,
             cl.check_in_time,
             u.name as checked_in_by
      FROM guests g
      LEFT JOIN rsvp_responses rr ON g.id = rr.guest_id
      LEFT JOIN checkin_logs cl ON g.id = cl.guest_id
      LEFT JOIN users u ON cl.checked_in_by = u.id
      WHERE g.event_id = ?
    `;
    let params = [eventId];

    if (status) {
      query += ' AND g.status = ?';
      params.push(status);
    }

    query += ' ORDER BY g.created_at DESC';

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [guests] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        guests,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get guest analytics error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching guest analytics'
    });
  }
});

// GET /api/analytics/:eventId/messages - Get detailed message analytics
router.get('/:eventId/messages', validateEventId, requireEventOwnership, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, messageType, page = 1, limit = 50 } = req.query;
    const pool = getPool();

    // Build query
    let query = `
      SELECT ml.*, g.name as guest_name, g.email as guest_email, g.phone as guest_phone
      FROM message_logs ml
      LEFT JOIN guests g ON ml.guest_id = g.id
      WHERE ml.event_id = ?
    `;
    let params = [eventId];

    if (status) {
      query += ' AND ml.status = ?';
      params.push(status);
    }

    if (messageType) {
      query += ' AND ml.message_type = ?';
      params.push(messageType);
    }

    query += ' ORDER BY ml.created_at DESC';

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [messages] = await pool.execute(query, params);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get message analytics error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching message analytics'
    });
  }
});

// GET /api/analytics/:eventId/export - Export analytics data
router.get('/:eventId/export', validateEventId, requireEventOwnership, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { format = 'json' } = req.query;
    const pool = getPool();

    // Get comprehensive analytics data
    const [eventData] = await pool.execute(
      'SELECT * FROM events WHERE id = ?',
      [eventId]
    );

    const [guests] = await pool.execute(
      'SELECT * FROM guests WHERE event_id = ? ORDER BY created_at',
      [eventId]
    );

    const [rsvpResponses] = await pool.execute(
      'SELECT * FROM rsvp_responses WHERE event_id = ? ORDER BY created_at',
      [eventId]
    );

    const [checkinLogs] = await pool.execute(
      'SELECT * FROM checkin_logs WHERE event_id = ? ORDER BY check_in_time',
      [eventId]
    );

    const [messageLogs] = await pool.execute(
      'SELECT * FROM message_logs WHERE event_id = ? ORDER BY created_at',
      [eventId]
    );

    const exportData = {
      event: eventData[0],
      guests,
      rsvpResponses,
      checkinLogs,
      messageLogs,
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      // TODO: Implement CSV export
      res.status(501).json({
        error: true,
        message: 'CSV export not yet implemented'
      });
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      error: true,
      message: 'Error exporting analytics data'
    });
  }
});

// GET /api/analytics/dashboard - Get user dashboard analytics
router.get('/dashboard/overview', async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPool();

    // Get user's events summary
    const [eventsSummary] = await pool.execute(
      `SELECT 
         COUNT(*) as total_events,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_events,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_events,
         COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_events
       FROM events 
       WHERE user_id = ?`,
      [userId]
    );

    // Get total guests across all events
    const [guestsSummary] = await pool.execute(
      `SELECT 
         COUNT(*) as total_guests,
         COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_guests,
         COUNT(CASE WHEN checked_in = 1 THEN 1 END) as checked_in_guests
       FROM guests g
       JOIN events e ON g.event_id = e.id
       WHERE e.user_id = ?`,
      [userId]
    );

    // Get recent events
    const [recentEvents] = await pool.execute(
      `SELECT e.*, 
              COUNT(g.id) as guest_count,
              COUNT(CASE WHEN g.checked_in = 1 THEN 1 END) as checked_in_count
       FROM events e
       LEFT JOIN guests g ON e.id = g.event_id
       WHERE e.user_id = ?
       GROUP BY e.id
       ORDER BY e.created_at DESC
       LIMIT 5`,
      [userId]
    );

    // Get upcoming events
    const [upcomingEvents] = await pool.execute(
      `SELECT e.*, 
              COUNT(g.id) as guest_count,
              COUNT(CASE WHEN g.status = 'confirmed' THEN 1 END) as confirmed_count
       FROM events e
       LEFT JOIN guests g ON e.id = g.event_id
       WHERE e.user_id = ? AND e.date >= CURDATE() AND e.status = 'active'
       GROUP BY e.id
       ORDER BY e.date ASC
       LIMIT 5`,
      [userId]
    );

    const dashboardData = {
      summary: {
        events: eventsSummary[0],
        guests: guestsSummary[0]
      },
      recentEvents,
      upcomingEvents
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching dashboard analytics'
    });
  }
});

export default router; 