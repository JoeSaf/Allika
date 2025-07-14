import express from 'express';
import multer from 'multer';
import { getPool } from '../config/database.js';
import { authenticateToken, requireEventOwnership } from '../middleware/auth.js';
import { validateCreateGuest, validateBulkGuestUpload, validateUUID, validateEventId } from '../middleware/validation.js';
import { generateId, generateRSVPToken, generateGuestQRCode, parseCSVData, formatPhoneNumber } from '../utils/helpers.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/guests/:eventId - Add single guest
router.post('/:eventId', validateEventId, requireEventOwnership, validateCreateGuest, async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      name,
      email,
      phone,
      tableNumber,
      guestCount,
      specialRequests
    } = req.body;

    const pool = getPool();
    const guestId = generateId();
    const rsvpToken = generateRSVPToken();

    // Format phone number if provided
    const formattedPhone = phone ? formatPhoneNumber(phone) : null;

    // Create guest
    await pool.execute(
      `INSERT INTO guests (
        id, event_id, name, email, phone, table_number, guest_count,
        special_requests, rsvp_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guestId, eventId, name, email, formattedPhone, tableNumber,
        guestCount || 1, specialRequests, rsvpToken
      ]
    );

    // Generate QR code
    const qrCodeData = await generateGuestQRCode(guestId, eventId, rsvpToken);

    // Update guest with QR code data
    await pool.execute(
      'UPDATE guests SET qr_code_data = ? WHERE id = ?',
      [qrCodeData, guestId]
    );

    // Get created guest
    const [guests] = await pool.execute(
      'SELECT * FROM guests WHERE id = ?',
      [guestId]
    );

    res.status(201).json({
      success: true,
      message: 'Guest added successfully',
      data: {
        guest: guests[0]
      }
    });

  } catch (error) {
    console.error('Add guest error:', error);
    res.status(500).json({
      error: true,
      message: 'Error adding guest'
    });
  }
});

// POST /api/guests/:eventId/bulk - Add multiple guests
router.post('/:eventId/bulk', validateEventId, requireEventOwnership, validateBulkGuestUpload, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { guests } = req.body;
    const pool = getPool();

    const createdGuests = [];
    const errors = [];

    for (let i = 0; i < guests.length; i++) {
      try {
        const guest = guests[i];
        const guestId = generateId();
        const rsvpToken = generateRSVPToken();

        // Format phone number if provided
        const formattedPhone = guest.phone ? formatPhoneNumber(guest.phone) : null;

        // Create guest
        await pool.execute(
          `INSERT INTO guests (
            id, event_id, name, email, phone, table_number, guest_count,
            special_requests, rsvp_token
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            guestId, eventId, guest.name, guest.email, formattedPhone,
            guest.tableNumber, guest.guestCount || 1, guest.specialRequests, rsvpToken
          ]
        );

        // Generate QR code
        const qrCodeData = await generateGuestQRCode(guestId, eventId, rsvpToken);

        // Update guest with QR code data
        await pool.execute(
          'UPDATE guests SET qr_code_data = ? WHERE id = ?',
          [qrCodeData, guestId]
        );

        // Get created guest
        const [createdGuest] = await pool.execute(
          'SELECT * FROM guests WHERE id = ?',
          [guestId]
        );

        createdGuests.push(createdGuest[0]);

      } catch (error) {
        errors.push({
          index: i,
          guest: guests[i],
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully added ${createdGuests.length} guests`,
      data: {
        createdGuests,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Bulk add guests error:', error);
    res.status(500).json({
      error: true,
      message: 'Error adding guests'
    });
  }
});

// POST /api/guests/:eventId/upload-csv - Upload CSV file
router.post('/:eventId/upload-csv', validateEventId, requireEventOwnership, upload.single('file'), async (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: 'No file uploaded'
      });
    }

    const csvText = req.file.buffer.toString('utf-8');
    const guests = parseCSVData(csvText);

    if (guests.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No valid guest data found in CSV'
      });
    }

    const pool = getPool();
    const createdGuests = [];
    const errors = [];

    for (let i = 0; i < guests.length; i++) {
      try {
        const guest = guests[i];
        const guestId = generateId();
        const rsvpToken = generateRSVPToken();

        // Format phone number if provided
        const formattedPhone = guest.phone ? formatPhoneNumber(guest.phone) : null;

        // Create guest
        await pool.execute(
          `INSERT INTO guests (
            id, event_id, name, email, phone, table_number, guest_count,
            special_requests, rsvp_token
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            guestId, eventId, guest.name, guest.email, formattedPhone,
            guest.tableNumber, guest.guestCount || 1, guest.specialRequests, rsvpToken
          ]
        );

        // Generate QR code
        const qrCodeData = await generateGuestQRCode(guestId, eventId, rsvpToken);

        // Update guest with QR code data
        await pool.execute(
          'UPDATE guests SET qr_code_data = ? WHERE id = ?',
          [qrCodeData, guestId]
        );

        // Get created guest
        const [createdGuest] = await pool.execute(
          'SELECT * FROM guests WHERE id = ?',
          [guestId]
        );

        createdGuests.push(createdGuest[0]);

      } catch (error) {
        errors.push({
          index: i,
          guest: guests[i],
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${createdGuests.length} guests from CSV`,
      data: {
        createdGuests,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({
      error: true,
      message: 'Error processing CSV file'
    });
  }
});

// GET /api/guests/:eventId - Get guests for event
router.get('/:eventId', validateEventId, requireEventOwnership, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, search, page = 1, limit = 50 } = req.query;
    const pool = getPool();

    // Build query
    let query = 'SELECT * FROM guests WHERE event_id = ?';
    let params = [eventId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
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
    console.error('Get guests error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching guests'
    });
  }
});

// GET /api/guests/:eventId/:guestId - Get specific guest
router.get('/:eventId/:guestId', validateEventId, requireEventOwnership, validateUUID, async (req, res) => {
  try {
    const { eventId, guestId } = req.params;
    const pool = getPool();

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

    res.json({
      success: true,
      data: {
        guest: guests[0]
      }
    });

  } catch (error) {
    console.error('Get guest error:', error);
    res.status(500).json({
      error: true,
      message: 'Error fetching guest'
    });
  }
});

// PUT /api/guests/:eventId/:guestId - Update guest
router.put('/:eventId/:guestId', validateEventId, requireEventOwnership, validateUUID, async (req, res) => {
  try {
    const { eventId, guestId } = req.params;
    const updateData = req.body;
    const pool = getPool();

    // Check if guest exists
    const [existing] = await pool.execute(
      'SELECT id FROM guests WHERE id = ? AND event_id = ?',
      [guestId, eventId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Guest not found'
      });
    }

    // Build update query
    const updateFields = [];
    const updateValues = [];

    const allowedFields = [
      'name', 'email', 'phone', 'table_number', 'guest_count', 'special_requests'
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

    updateValues.push(guestId);

    // Update guest
    await pool.execute(
      `UPDATE guests SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Get updated guest
    const [guests] = await pool.execute(
      'SELECT * FROM guests WHERE id = ?',
      [guestId]
    );

    res.json({
      success: true,
      message: 'Guest updated successfully',
      data: {
        guest: guests[0]
      }
    });

  } catch (error) {
    console.error('Update guest error:', error);
    res.status(500).json({
      error: true,
      message: 'Error updating guest'
    });
  }
});

// DELETE /api/guests/:eventId/:guestId - Delete guest
router.delete('/:eventId/:guestId', validateEventId, requireEventOwnership, validateUUID, async (req, res) => {
  try {
    const { eventId, guestId } = req.params;
    const pool = getPool();

    // Check if guest exists
    const [existing] = await pool.execute(
      'SELECT id FROM guests WHERE id = ? AND event_id = ?',
      [guestId, eventId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Guest not found'
      });
    }

    // Delete guest
    await pool.execute('DELETE FROM guests WHERE id = ?', [guestId]);

    res.json({
      success: true,
      message: 'Guest deleted successfully'
    });

  } catch (error) {
    console.error('Delete guest error:', error);
    res.status(500).json({
      error: true,
      message: 'Error deleting guest'
    });
  }
});

// GET /api/guests/:eventId/export-csv - Export guests as CSV
router.get('/:eventId/export-csv', validateEventId, requireEventOwnership, async (req, res) => {
  try {
    const { eventId } = req.params;
    const pool = getPool();

    const [guests] = await pool.execute(
      'SELECT name, email, phone, table_number, guest_count, special_requests, status, checked_in FROM guests WHERE event_id = ? ORDER BY name',
      [eventId]
    );

    // Generate CSV content
    const csvHeaders = 'Name,Email,Phone,Table Number,Guest Count,Special Requests,Status,Checked In\n';
    const csvRows = guests.map(guest => 
      `"${guest.name || ''}","${guest.email || ''}","${guest.phone || ''}","${guest.table_number || ''}","${guest.guest_count || 1}","${guest.special_requests || ''}","${guest.status || 'pending'}","${guest.checked_in ? 'Yes' : 'No'}"`
    ).join('\n');

    const csvContent = csvHeaders + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="guests-${eventId}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      error: true,
      message: 'Error exporting guests'
    });
  }
});

export default router; 