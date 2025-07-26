import express from 'express';
import { getPool } from '../config/database.js';
import { authenticateToken, requireEventOwnership } from '../middleware/auth.js';
import { validateSendInvites, validateEventId } from '../middleware/validation.js';
import { generateId } from '../utils/helpers.js';
import fetch from 'node-fetch'; // Add at the top
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { formatDateTime, formatTimeInWords, formatDateInWords } from '../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/messaging/:eventId/send-invites - Send invitations
router.post('/:eventId/send-invites', validateEventId, requireEventOwnership, validateSendInvites, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { messageType, guestIds, customMessage } = req.body;
    const pool = getPool();

    console.log('Send invites request:', { eventId, messageType, guestIds, customMessage });

    // Get event and invitation data
    const [events] = await pool.execute(
      `SELECT e.*, eid.couple_name, eid.event_date, eid.event_date_words, eid.event_time, eid.venue,
              eid.reception, eid.reception_time, eid.theme, eid.rsvp_contact, eid.rsvp_contact_secondary,
              e.date_lang, eid.date_lang as invitation_date_lang
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

    console.log('Guest query:', guestQuery);
    console.log('Guest params:', guestParams);

    const [guests] = await pool.execute(guestQuery, guestParams);

    console.log('Found guests:', guests.length, guests.map(g => ({ id: g.id, name: g.name, phone: g.phone })));

    if (guests.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No guests found to send invitations to'
      });
    }

    // Initialize mNotify client if credentials are available
    let mNotifyClient = null;
    if (process.env.MNOTIFY_API_KEY) {
      try {
        mNotifyClient = require('mnotify-node');
        mNotifyClient = new mNotifyClient(process.env.MNOTIFY_API_KEY);
      } catch (e) {
        console.error('Failed to initialize mNotify:', e);
        mNotifyClient = null;
      }
    }

    const sentMessages = [];
    const failedMessages = [];

    if (messageType === 'whatsapp') {
      // WhatsApp send using send_whatsapp.py for each guest individually
      for (const guest of guests) {
        try {
          const message = generateMessageContent(event, guest, messageType, customMessage);
          const messageId = generateId();
          
          // Create temporary message file
          const tempMessageFile = path.join('/tmp', `wa_msg_${eventId}_${guest.id}_${Date.now()}.txt`);
          fs.writeFileSync(tempMessageFile, message, 'utf8');
          
          // Send WhatsApp message using send_whatsapp.py
          await new Promise((resolve, reject) => {
            exec(`python3 send_whatsapp.py "${guest.phone}" "${tempMessageFile}"`, { cwd: path.resolve(__dirname, '../') }, (error, stdout, stderr) => {
              if (error) return reject(stderr || error.message);
              resolve(stdout);
            });
          });
          
          // Mark as sent
          await pool.execute(
            `INSERT INTO message_logs (
              id, event_id, guest_id, message_type, recipient, message_content, status, sent_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'sent', CURRENT_TIMESTAMP)`,
            [messageId, eventId, guest.id, messageType, guest.phone, message]
          );
          
          sentMessages.push({
            guestId: guest.id,
            guestName: guest.name,
            recipient: guest.phone,
            messageId,
            status: 'sent'
          });
          
          // Clean up temporary file
          fs.unlinkSync(tempMessageFile);
          
          // Add delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (waError) {
          const message = generateMessageContent(event, guest, messageType, customMessage);
          const messageId = generateId();
          
          await pool.execute(
            `INSERT INTO message_logs (
              id, event_id, guest_id, message_type, recipient, message_content, status, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, 'failed', ?)`,
            [messageId, eventId, guest.id, messageType, guest.phone, message, waError.toString()]
          );
          
          failedMessages.push({
            guestId: guest.id,
            guestName: guest.name,
            recipient: guest.phone,
            error: waError.toString()
          });
          
          // Clean up temporary file if it exists
          const tempMessageFile = path.join('/tmp', `wa_msg_${eventId}_${guest.id}_${Date.now()}.txt`);
          if (fs.existsSync(tempMessageFile)) {
            fs.unlinkSync(tempMessageFile);
          }
        }
      }
    } else {
      // Per-guest logic for SMS/email
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
        if (messageType === 'sms') {
          if (guest.phone) {
            try {
              const rsvpLink = `${process.env.FRONTEND_URL}/rsvp/${guest.rsvp_token}`;
              const smsMessage = messageContent; // Already personalized
              const notifyRes = await sendNotifyAfricaSMS({
                phone: guest.phone,
                name: guest.name,
                rsvpLink,
                message: smsMessage
              });
              messageStatus = 'sent';
              // Update message log
              await pool.execute(
                `UPDATE message_logs SET 
                 status = ?, sent_at = CURRENT_TIMESTAMP, error_message = ?
                 WHERE id = ?`,
                [messageStatus ?? null, null, messageId ?? null]
              );
              sentMessages.push({
                guestId: guest.id,
                guestName: guest.name,
                recipient: guest.phone,
                messageId: notifyRes.message_id || null,
                status: messageStatus
              });
            } catch (notifyError) {
              messageStatus = 'failed';
              errorMessage = notifyError.message;
              await pool.execute(
                `UPDATE message_logs SET 
                 status = ?, error_message = ?
                 WHERE id = ?`,
                [messageStatus ?? null, errorMessage ?? null, messageId ?? null]
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
            errorMessage = 'No phone number';
            await pool.execute(
              `UPDATE message_logs SET 
               status = ?, error_message = ?
               WHERE id = ?`,
              [messageStatus ?? null, errorMessage ?? null, messageId ?? null]
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
            [messageStatus ?? null, errorMessage ?? null, messageId ?? null]
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

// Utility function to send SMS via Notify Africa
async function sendNotifyAfricaSMS({ phone, name, rsvpLink, message }) {
  const token = '1032|QWOWLGEXr3yZtYq8RHkOWKblDk1IQ8jzCMFdcHj9fabfdb57';
  const baseUrl = 'https://api.notify.africa/v2';
  const url = `${baseUrl}/send-sms`;
  const smsText = message || `Hello ${name}, you are invited! RSVP: ${rsvpLink}`;
  const payload = {
    sender_id: 1,
    schedule: 'none',
    sms: smsText,
    recipients: [{ number: phone }]
  };
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send SMS via Notify Africa');
  }
  return data;
}

// Add this function to call the Python script for WhatsApp
function sendWhatsAppWithPywhatkit(phone, message) {
  return new Promise((resolve, reject) => {
    exec(`python3 send_whatsapp.py "${phone}" "${message.replace(/"/g, '\"')}"`, (error, stdout, stderr) => {
      if (error) return reject(stderr || error.message);
      resolve(stdout);
    });
  });
}

// Helper function to generate message content
function generateMessageContent(event, guest, messageType, customMessage) {
  const eventData = event;
  const guestName = guest.name;
  const language = eventData.invitation_date_lang || eventData.date_lang || eventData.dateLang || 'en';
  
  // Debug logging
  console.log('generateMessageContent debug:', {
    eventData: {
      couple_name: eventData.couple_name,
      event_date: eventData.event_date,
      event_date_words: eventData.event_date_words,
      event_time: eventData.event_time,
      time: eventData.time,
      venue: eventData.venue,
      date_lang: eventData.date_lang,
      invitation_date_lang: eventData.invitation_date_lang,
      dateLang: eventData.dateLang
    },
    language,
    guestName
  });
  
  // Format time in words
  const eventTimeInWords = formatTimeInWords(eventData.event_time || eventData.time, language);
  const receptionTimeInWords = formatTimeInWords(eventData.reception_time || eventData.receptionTime, language);
  
  // Format date in words - prefer event_date_words if available, otherwise format the date
  const eventDateInWords = eventData.event_date_words || formatDateInWords(eventData.event_date || eventData.date, language);
  
  console.log('Formatted values:', {
    eventTimeInWords,
    eventDateInWords,
    language
  });
  
  // Use alias if available, fallback to token
  const rsvpPath = guest.rsvp_alias ? `/rsvp/${guest.rsvp_alias}` : `/rsvp/${guest.rsvp_token}`;
  const rsvpLink = `${process.env.FRONTEND_URL}${rsvpPath}`;

  // Use custom message if provided, otherwise generate default
  if (customMessage) {
    return customMessage
      .replace(/{guestName}/g, guestName)
      .replace(/{eventTitle}/g, eventData.couple_name || eventData.title)
      .replace(/{eventDate}/g, eventDateInWords)
      .replace(/{eventTime}/g, eventTimeInWords)
      .replace(/{receptionTime}/g, receptionTimeInWords)
      .replace(/{venue}/g, eventData.venue)
      .replace(/{rsvpLink}/g, rsvpLink);
  }

  // Default message templates with improved spacing and WhatsApp formatting
  const templates = {
    sms: `🎉 Habari ${guestName}!\n\nTafadhali pokea mwaliko wa ${eventData.couple_name || eventData.title}, Itakayofanyika ${eventDateInWords}${eventTimeInWords ? `, ${eventTimeInWords}` : ''}, ${eventData.venue}.\n\nTafadhali bofya chaguo mojawapo hapo chini kuthibitisha ushiriki.\n\nKaribu Sana!\n\nRSVP: ${rsvpLink}\nUjumbe huu, umetumwa kwa kupitia Alika`,

    whatsapp: `🎉 *Habari ${guestName}!*\n\nTafadhali pokea mwaliko wa *${eventData.couple_name || eventData.title}*, Itakayofanyika *${eventDateInWords}${eventTimeInWords ? `, ${eventTimeInWords}` : ''}*, ${eventData.venue}.\n\nTafadhali bofya chaguo mojawapo hapo chini kuthibitisha ushiriki.\n\n*Karibu Sana!*\n\nRSVP: ${rsvpLink}\n_Ujumbe huu, umetumwa kwa kupitia Alika_`,

    email: `Dear ${guestName},\n\nYou are cordially invited to ${eventData.couple_name || eventData.title} on ${eventDateInWords}${eventTimeInWords ? ` at ${eventTimeInWords}` : ''} at ${eventData.venue}.\n\nPlease click the link below to RSVP:\n\n${rsvpLink}\n\nWe look forward to celebrating with you!\n\nBest regards,\nThe Event Organizers`
  };

  return templates[messageType] || templates.sms;
}

export default router; 