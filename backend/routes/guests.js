import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
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
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV or XLSX files are allowed'), false);
    }
  }
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST /api/guests/:eventId - Add single guest
router.post('/:eventId', validateEventId, requireEventOwnership, validateCreateGuest, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, phone, tableNumber, guestCount, specialRequests } = req.body;
    const pool = getPool();

    // Check for duplicate phone number if phone is provided
    if (phone) {
      const formattedPhone = formatPhoneNumber(phone);
      const [existing] = await pool.execute(
        'SELECT id, name FROM guests WHERE event_id = ? AND phone = ?',
        [eventId, formattedPhone]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({
          error: true,
          message: `Phone number ${formattedPhone} is already registered for guest: ${existing[0].name}`,
          data: {
            existingGuest: existing[0]
          }
        });
      }
    }

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
        guestId,
        eventId,
        name ?? null,
        email ?? null,
        formattedPhone ?? null,
        tableNumber ?? null,
        guestCount ?? 1,
        specialRequests ?? null,
        rsvpToken
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

// POST /api/guests/:eventId/check-duplicates - Check for duplicate phone numbers
router.post('/:eventId/check-duplicates', validateEventId, requireEventOwnership, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { phoneNumbers } = req.body;
    
    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({
        error: true,
        message: 'Phone numbers array is required'
      });
    }

    const duplicates = await checkDuplicatePhones(eventId, phoneNumbers);
    
    res.json({
      success: true,
      data: {
        duplicates: duplicates.map(d => ({
          phone: d.phone,
          existingGuest: d.existingGuest.name
        })),
        hasDuplicates: duplicates.length > 0
      }
    });

  } catch (error) {
    console.error('Check duplicates error:', error);
    res.status(500).json({
      error: true,
      message: 'Error checking for duplicates'
    });
  }
});

// Helper function to check for duplicate phone numbers
async function checkDuplicatePhones(eventId, phoneNumbers) {
  const pool = getPool();
  const duplicates = [];

  for (const phone of phoneNumbers) {
    if (!phone) continue;
    const formattedPhone = formatPhoneNumber(phone);
    // Find guests with this phone
    const [existing] = await pool.execute(
      'SELECT id, name, phone FROM guests WHERE event_id = ? AND phone = ?',
      [eventId, formattedPhone]
    );
    if (existing.length > 0) {
      // Check if there is a successful message_log for this guest/phone
      const [logs] = await pool.execute(
        `SELECT * FROM message_logs WHERE event_id = ? AND guest_id = ? AND recipient = ? AND status IN ('sent', 'delivered') LIMIT 1`,
        [eventId, existing[0].id, formattedPhone]
      );
      if (logs.length > 0) {
        duplicates.push({
          phone: formattedPhone,
          existingGuest: existing[0]
        });
      }
    }
  }
  return duplicates;
}

// POST /api/guests/:eventId/bulk - Add multiple guests
router.post('/:eventId/bulk', validateEventId, requireEventOwnership, validateBulkGuestUpload, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { guests } = req.body;
    const pool = getPool();

    console.log('Bulk guest creation request:', { eventId, guestCount: guests.length, guests });

    // Check for duplicate phone numbers
    const phoneNumbers = guests.map(g => g.phone).filter(Boolean);
    const duplicates = await checkDuplicatePhones(eventId, phoneNumbers);
    
    if (duplicates.length > 0) {
      return res.status(400).json({
        error: true,
        message: 'Duplicate phone numbers found',
        data: {
          duplicates: duplicates.map(d => ({
            phone: d.phone,
            existingGuest: d.existingGuest.name
          }))
        }
      });
    }

    const createdGuests = [];
    const errors = [];

    for (let i = 0; i < guests.length; i++) {
      try {
        const guest = guests[i];
        const guestId = generateId();
        const rsvpToken = generateRSVPToken();

        console.log(`Processing guest ${i + 1}:`, { name: guest.name, phone: guest.phone });

        // Format phone number if provided
        const formattedPhone = guest.phone ? formatPhoneNumber(guest.phone) : null;
        console.log('Formatted phone:', formattedPhone);

        // Create guest
        await pool.execute(
          `INSERT INTO guests (
            id, event_id, name, email, phone, table_number, guest_count,
            special_requests, rsvp_token
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            guestId, 
            eventId, 
            guest.name, 
            guest.email || null, 
            formattedPhone || null,
            guest.tableNumber || null, 
            guest.guestCount || 1, 
            guest.specialRequests || null, 
            rsvpToken
          ]
        );

        console.log(`Guest ${i + 1} created with ID:`, guestId);

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
        console.log(`Guest ${i + 1} successfully added to response`);

      } catch (error) {
        console.error(`Error creating guest ${i + 1}:`, error);
        errors.push({
          index: i,
          guest: guests[i],
          error: error.message
        });
      }
    }

    console.log('Bulk creation completed:', { createdCount: createdGuests.length, errorCount: errors.length });

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

// Helper to parse XLSX buffer to guest objects
function parseXLSXGuests(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  // Expect: first column = name, second column = phone
  const guests = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row[0] || !row[1]) continue; // skip if missing name or phone
    guests.push({ name: String(row[0]).trim(), phone: String(row[1]).trim() });
  }
  return guests;
}

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

    let guests = [];
    if (req.file.mimetype === 'text/csv' || req.file.mimetype === 'application/vnd.ms-excel') {
    const csvText = req.file.buffer.toString('utf-8');
      guests = parseCSVData(csvText);
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      guests = parseXLSXGuests(req.file.buffer);
    }

    if (guests.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No valid guest data found in file'
      });
    }

    // Check for duplicate phone numbers
    const phoneNumbers = guests.map(g => g.phone).filter(Boolean);
    const duplicates = await checkDuplicatePhones(eventId, phoneNumbers);
    
    if (duplicates.length > 0) {
      return res.status(400).json({
        error: true,
        message: 'Duplicate phone numbers found in file',
        data: {
          duplicates: duplicates.map(d => ({
            phone: d.phone,
            existingGuest: d.existingGuest.name
          }))
        }
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
            guestId, 
            eventId, 
            guest.name, 
            guest.email || null, 
            formattedPhone || null,
            guest.tableNumber || null, 
            guest.guestCount || 1, 
            guest.specialRequests || null, 
            rsvpToken
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