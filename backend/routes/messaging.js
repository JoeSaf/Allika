import express from 'express';
import { getPool } from '../config/database.js';
import { authenticateToken, requireEventOwnership } from '../middleware/auth.js';
import { validateSendInvites, validateEventId } from '../middleware/validation.js';
import { generateId } from '../utils/helpers.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/messaging/:eventId/send-invites - Send invitations
router.post('/:eventId/send-invites', validateEventId, requireEventOwnership, validateSendInvites, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { messageType, guestIds, customMessage } = req.body;
    const pool = getPool();

    // Get event and invitation data
    const [events] = await pool.execute(
      `SELECT e.*, eid.couple_name, eid.event_date, eid.event_time, eid.venue,
              eid.reception, eid.reception_time, eid.theme, eid.rsvp_contact
       FROM events e
       LEFT JOIN event_invitation_data eid ON e.id = eid.event_id
       WHERE e.id = ?`,
      [eventId]
    );

    if (events.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Event not found'
      });
    }

    const event = events[0];

    // Get guests to send invitations to
    let guestQuery = 'SELECT * FROM guests WHERE event_id = ?';
    let guestParams = [eventId];

    if (guestIds && guestIds.length > 0) {
      guestQuery += ' AND id IN (' + guestIds.map(() => '?').join(',') + ')';
      guestParams.push(...guestIds);
    }

    const [guests] = await pool.execute(guestQuery, guestParams);

    if (guests.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No guests found to send invitations to'
      });
    }

    // Initialize Twilio client if credentials are available
    let twilioClient = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = await import('twilio');
      twilioClient = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }

    const sentMessages = [];
    const failedMessages = [];

    // Send messages to each guest
    for (const guest of guests) {
      try {
        // Generate message content
        const messageContent = generateMessageContent(event, guest, messageType, customMessage);
        
        // Create message log entry
        const messageId = generateId();
        await pool.execute(
          `INSERT INTO message_logs (
            id, event_id, guest_id, message_type, recipient, message_content, status
          ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
          [messageId, eventId, guest.id, messageType, guest.phone || guest.email, messageContent]
        );

        let messageStatus = 'pending';
        let errorMessage = null;

        // Send message based on type
        if (messageType === 'sms' || messageType === 'whatsapp') {
          if (twilioClient && guest.phone) {
            try {
              const message = await twilioClient.messages.create({
                body: messageContent,
                from: messageType === 'whatsapp' ? 
                  `whatsapp:${process.env.TWILIO_PHONE_NUMBER}` : 
                  process.env.TWILIO_PHONE_NUMBER,
                to: messageType === 'whatsapp' ? 
                  `whatsapp:${guest.phone}` : 
                  guest.phone
              });

              messageStatus = 'sent';
              
              // Update message log
              await pool.execute(
                `UPDATE message_logs SET 
                 status = ?, sent_at = CURRENT_TIMESTAMP, error_message = ?
                 WHERE id = ?`,
                [messageStatus, null, messageId]
              );

              sentMessages.push({
                guestId: guest.id,
                guestName: guest.name,
                recipient: guest.phone,
                messageId: message.sid,
                status: messageStatus
              });

            } catch (twilioError) {
              messageStatus = 'failed';
              errorMessage = twilioError.message;
              
              await pool.execute(
                `UPDATE message_logs SET 
                 status = ?, error_message = ?
                 WHERE id = ?`,
                [messageStatus, errorMessage, messageId]
              );

              failedMessages.push({
                guestId: guest.id,
                guestName: guest.name,
                recipient: guest.phone,
                error: errorMessage
              });
            }
          } else {
            messageStatus = 'failed';
            errorMessage = 'Twilio not configured or no phone number';
            
            await pool.execute(
              `UPDATE message_logs SET 
               status = ?, error_message = ?
               WHERE id = ?`,
              [messageStatus, errorMessage, messageId]
            );

            failedMessages.push({
              guestId: guest.id,
              guestName: guest.name,
              recipient: guest.phone,
              error: errorMessage
            });
          }
        } else if (messageType === 'email') {
          // TODO: Implement email sending
          messageStatus = 'pending';
          errorMessage = 'Email sending not yet implemented';
          
          await pool.execute(
            `UPDATE message_logs SET 
             status = ?, error_message = ?
             WHERE id = ?`,
            [messageStatus, errorMessage, messageId]
          );

          failedMessages.push({
            guestId: guest.id,
            guestName: guest.name,
            recipient: guest.email,
            error: errorMessage
          });
        }

      } catch (error) {
        console.error(`Error sending message to ${guest.name}:`, error);
        failedMessages.push({
          guestId: guest.id,
          guestName: guest.name,
          recipient: guest.phone || guest.email,
          error: error.message
        });
      }
    }

    // Update event message count
    await pool.execute(
      'UPDATE events SET messages_sent = messages_sent + ? WHERE id = ?',
      [sentMessages.length, eventId]
    );

    res.json({
      success: true,
      message: `Invitations sent: ${sentMessages.length} successful, ${failedMessages.length} failed`,
      data: {
        sentMessages,
        failedMessages,
        totalSent: sentMessages.length,
        totalFailed: failedMessages.length
      }
    });

  } catch (error) {
    console.error('Send invitations error:', error);
    res.status(500).json({
      error: true,
      message: 'Error sending invitations'
    });
  }
});

// GET /api/messaging/:eventId/logs - Get message logs
router.get('/:eventId/logs', validateEventId, requireEventOwnership, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 50, status } = req.query;
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

    query += ' ORDER BY ml.created_at DESC';

    // Get total count
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [logs] = await pool.execute(query, params);

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
    console.error('Get message logs error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching message logs'
    });
  }
});

// GET /api/messaging/:eventId/summary - Get messaging summary
router.get('/:eventId/summary', validateEventId, requireEventOwnership, async (req, res) => {
  try {
    const { eventId } = req.params;
    const pool = getPool();

    // Get messaging statistics
    const [stats] = await pool.execute(
      `SELECT 
         COUNT(*) as total_messages,
         COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
         COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
         COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
         COUNT(CASE WHEN message_type = 'sms' THEN 1 END) as sms_count,
         COUNT(CASE WHEN message_type = 'whatsapp' THEN 1 END) as whatsapp_count,
         COUNT(CASE WHEN message_type = 'email' THEN 1 END) as email_count
       FROM message_logs 
       WHERE event_id = ?`,
      [eventId]
    );

    // Get recent messages
    const [recentMessages] = await pool.execute(
      `SELECT ml.*, g.name as guest_name
       FROM message_logs ml
       LEFT JOIN guests g ON ml.guest_id = g.id
       WHERE ml.event_id = ?
       ORDER BY ml.created_at DESC
       LIMIT 10`,
      [eventId]
    );

    const summary = {
      statistics: stats[0],
      recentMessages,
      deliveryRate: stats[0].total_messages > 0 ? 
        Math.round((stats[0].delivered_count / stats[0].total_messages) * 100) : 0
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Get messaging summary error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching messaging summary'
    });
  }
});

// POST /api/messaging/:eventId/retry - Retry failed messages
router.post('/:eventId/retry', validateEventId, requireEventOwnership, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { messageIds } = req.body;
    const pool = getPool();

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        error: true,
        message: 'Message IDs array is required'
      });
    }

    // Get failed messages
    const [failedMessages] = await pool.execute(
      `SELECT ml.*, g.name as guest_name, g.phone, g.email
       FROM message_logs ml
       LEFT JOIN guests g ON ml.guest_id = g.id
       WHERE ml.event_id = ? AND ml.id IN (${messageIds.map(() => '?').join(',')}) AND ml.status = 'failed'`,
      [eventId, ...messageIds]
    );

    if (failedMessages.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No failed messages found to retry'
      });
    }

    // TODO: Implement retry logic
    // For now, just update status to pending
    await pool.execute(
      `UPDATE message_logs SET status = 'pending', error_message = NULL WHERE id IN (${messageIds.map(() => '?').join(',')})`,
      messageIds
    );

    res.json({
      success: true,
      message: `${failedMessages.length} messages queued for retry`,
      data: {
        retriedCount: failedMessages.length
      }
    });

  } catch (error) {
    console.error('Retry messages error:', error);
    res.status(500).json({
      error: true,
      message: 'Error retrying messages'
    });
  }
});

// Helper function to generate message content
function generateMessageContent(event, guest, messageType, customMessage) {
  const eventData = event;
  const guestName = guest.name;
  
  // Use custom message if provided, otherwise generate default
  if (customMessage) {
    return customMessage
      .replace(/{guestName}/g, guestName)
      .replace(/{eventTitle}/g, eventData.couple_name || eventData.title)
      .replace(/{eventDate}/g, eventData.event_date || eventData.date)
      .replace(/{eventTime}/g, eventData.event_time || eventData.time)
      .replace(/{venue}/g, eventData.venue)
      .replace(/{rsvpLink}/g, `${process.env.FRONTEND_URL}/rsvp/${guest.rsvp_token}`);
  }

  // Default message templates
  const templates = {
    sms: `🎉 Habari ${guestName}!

Tafadhali pokea mwaliko wa ${eventData.couple_name || eventData.title}, Itakayofanyika ${eventData.event_date || eventData.date}, ${eventData.venue}.

Tafadhali bofya chaguo mojawapo hapo chini kuthibitisha ushiriki

Karibu Sana!

RSVP: ${process.env.FRONTEND_URL}/rsvp/${guest.rsvp_token}
Ujumbe huu, umetumwa kwa kupitia Alika`,

    whatsapp: `🎉 Habari ${guestName}!

Tafadhali pokea mwaliko wa ${eventData.couple_name || eventData.title}, Itakayofanyika ${eventData.event_date || eventData.date}, ${eventData.venue}.

Tafadhali bofya chaguo mojawapo hapo chini kuthibitisha ushiriki

Karibu Sana!

RSVP: ${process.env.FRONTEND_URL}/rsvp/${guest.rsvp_token}
Ujumbe huu, umetumwa kwa kupitia Alika`,

    email: `Dear ${guestName},

You are cordially invited to ${eventData.couple_name || eventData.title} on ${eventData.event_date || eventData.date} at ${eventData.venue}.

Please click the link below to RSVP:

${process.env.FRONTEND_URL}/rsvp/${guest.rsvp_token}

We look forward to celebrating with you!

Best regards,
The Event Organizers`
  };

  return templates[messageType] || templates.sms;
}

export default router; 