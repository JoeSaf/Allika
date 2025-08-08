import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alika_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

export const connectDB = async () => {
  try {
    // First, connect without database to create it if it doesn't exist
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    const tempPool = mysql.createPool(tempConfig);
    
    // Create database if it doesn't exist
    await tempPool.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempPool.end();
    
    // Now connect with the database
    pool = mysql.createPool(dbConfig);
    
    // Test the connection
    const connection = await pool.getConnection();
    // console.log('✅ Database connected successfully');
    connection.release();
    
    // Create tables if they don't exist
    await createTables();
    
  } catch (error) {
    // console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return pool;
};

const createTables = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);

    // Events table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        date DATE,
        time TIME,
        venue VARCHAR(500),
        reception VARCHAR(500),
        reception_time TIME,
        theme VARCHAR(255),
        rsvp_contact VARCHAR(20),
        rsvp_contact_secondary VARCHAR(20),
        additional_info TEXT,
        inviting_family VARCHAR(255),
        invitation_image VARCHAR(500),
        date_lang VARCHAR(10) DEFAULT 'en',
        status ENUM('draft', 'active', 'completed') DEFAULT 'draft',
        messages_sent INT DEFAULT 0,
        design_method ENUM('template', 'custom') DEFAULT 'template',
        custom_card_image_url VARCHAR(500),
        custom_card_overlay_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_date (date),
        INDEX idx_design_method (design_method)
      )
    `);
    // Ensure date_lang column exists (for legacy DBs)
    const [dateLangCol] = await connection.execute(`SHOW COLUMNS FROM events LIKE 'date_lang'`);
    if (dateLangCol.length === 0) {
      await connection.execute(`ALTER TABLE events ADD COLUMN date_lang VARCHAR(10) DEFAULT 'en'`);
      // console.log('✅ Added date_lang column to events table');
    }

    // Ensure messages_sent column exists (for legacy DBs)
    const [columns] = await connection.execute(`SHOW COLUMNS FROM events LIKE 'messages_sent'`);
    if (columns.length === 0) {
      await connection.execute(`ALTER TABLE events ADD COLUMN messages_sent INT DEFAULT 0`);
      // console.log('✅ Added messages_sent column to events table');
    }

    // Ensure rsvp_contact_secondary column exists (for legacy DBs)
    const [rsvpSecondaryCol] = await connection.execute(`SHOW COLUMNS FROM events LIKE 'rsvp_contact_secondary'`);
    if (rsvpSecondaryCol.length === 0) {
      await connection.execute(`ALTER TABLE events ADD COLUMN rsvp_contact_secondary VARCHAR(20)`);
      // console.log('✅ Added rsvp_contact_secondary column to events table');
    }

    // Update rsvp_contact field size to VARCHAR(20) for phone numbers (for legacy DBs)
    const [rsvpContactCol] = await connection.execute(`SHOW COLUMNS FROM events LIKE 'rsvp_contact'`);
    if (rsvpContactCol.length > 0 && rsvpContactCol[0].Type.toLowerCase() !== 'varchar(20)') {
      await connection.execute(`ALTER TABLE events MODIFY rsvp_contact VARCHAR(20)`);
      // console.log('✅ Updated rsvp_contact column to VARCHAR(20) in events table');
    }

    // Ensure custom card columns exist (for legacy DBs)
    const [designMethodCol] = await connection.execute(`SHOW COLUMNS FROM events LIKE 'design_method'`);
    if (designMethodCol.length === 0) {
      await connection.execute(`ALTER TABLE events ADD COLUMN design_method ENUM('template', 'custom') DEFAULT 'template'`);
      // console.log('✅ Added design_method column to events table');
    }

    const [customCardImageCol] = await connection.execute(`SHOW COLUMNS FROM events LIKE 'custom_card_image_url'`);
    if (customCardImageCol.length === 0) {
      await connection.execute(`ALTER TABLE events ADD COLUMN custom_card_image_url VARCHAR(500)`);
      // console.log('✅ Added custom_card_image_url column to events table');
    }

    const [customCardOverlayCol] = await connection.execute(`SHOW COLUMNS FROM events LIKE 'custom_card_overlay_data'`);
    if (customCardOverlayCol.length === 0) {
      await connection.execute(`ALTER TABLE events ADD COLUMN custom_card_overlay_data JSON`);
      // console.log('✅ Added custom_card_overlay_data column to events table');
    }

    // Ensure design_method index exists (for legacy DBs)
    const [designMethodIndex] = await connection.execute(`SHOW INDEX FROM events WHERE Key_name = 'idx_design_method'`);
    if (designMethodIndex.length === 0) {
      await connection.execute(`CREATE INDEX idx_design_method ON events(design_method)`);
      // console.log('✅ Added idx_design_method index to events table');
    }

    // Update date column to allow NULL for custom cards (for legacy DBs)
    const [dateCol] = await connection.execute(`SHOW COLUMNS FROM events LIKE 'date'`);
    if (dateCol.length > 0 && dateCol[0].Null === 'NO') {
      await connection.execute(`ALTER TABLE events MODIFY date DATE NULL`);
      // console.log('✅ Updated date column to allow NULL in events table');
    }

    // Event invitation data table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS event_invitation_data (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        couple_name VARCHAR(255),
        event_date VARCHAR(255),
        event_date_words VARCHAR(255),
        event_time VARCHAR(50),
        venue VARCHAR(500),
        reception VARCHAR(500),
        reception_time TIME,
        theme VARCHAR(255),
        rsvp_contact VARCHAR(20),
        rsvp_contact_secondary VARCHAR(20),
        additional_info TEXT,
        inviting_family VARCHAR(255),
        guest_name VARCHAR(255),
        invitation_image MEDIUMTEXT,
        selected_template VARCHAR(50) DEFAULT 'template1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        INDEX idx_event_id (event_id)
      )
    `);
    // Ensure event_date_words column exists (for legacy DBs)
    const [dateWordsCol] = await connection.execute(`SHOW COLUMNS FROM event_invitation_data LIKE 'event_date_words'`);
    if (dateWordsCol.length === 0) {
      await connection.execute(`ALTER TABLE event_invitation_data ADD COLUMN event_date_words VARCHAR(255)`);
      // console.log('✅ Added event_date_words column to event_invitation_data table');
    }
    // Ensure invitation_image column is MEDIUMTEXT (for legacy DBs)
    const [imgCol] = await connection.execute(`SHOW COLUMNS FROM event_invitation_data LIKE 'invitation_image'`);
    if (imgCol.length > 0 && imgCol[0].Type.toLowerCase() !== 'mediumtext') {
      await connection.execute(`ALTER TABLE event_invitation_data MODIFY invitation_image MEDIUMTEXT`);
      // console.log('✅ Modified invitation_image column to MEDIUMTEXT in event_invitation_data table');
    }
    // Ensure selected_template column exists (for legacy DBs)
    const [selTemplateCol] = await connection.execute(`SHOW COLUMNS FROM event_invitation_data LIKE 'selected_template'`);
    if (selTemplateCol.length === 0) {
      await connection.execute(`ALTER TABLE event_invitation_data ADD COLUMN selected_template VARCHAR(50) DEFAULT 'template1'`);
      // console.log('✅ Added selected_template column to event_invitation_data table');
    }

    // Ensure rsvp_contact_secondary column exists (for legacy DBs)
    const [invRsvpSecondaryCol] = await connection.execute(`SHOW COLUMNS FROM event_invitation_data LIKE 'rsvp_contact_secondary'`);
    if (invRsvpSecondaryCol.length === 0) {
      await connection.execute(`ALTER TABLE event_invitation_data ADD COLUMN rsvp_contact_secondary VARCHAR(20)`);
      // console.log('✅ Added rsvp_contact_secondary column to event_invitation_data table');
    }

    // Update rsvp_contact field size to VARCHAR(20) for phone numbers (for legacy DBs)
    const [invRsvpContactCol] = await connection.execute(`SHOW COLUMNS FROM event_invitation_data LIKE 'rsvp_contact'`);
    if (invRsvpContactCol.length > 0 && invRsvpContactCol[0].Type.toLowerCase() !== 'varchar(20)') {
      await connection.execute(`ALTER TABLE event_invitation_data MODIFY rsvp_contact VARCHAR(20)`);
      // console.log('✅ Updated rsvp_contact column to VARCHAR(20) in event_invitation_data table');
    }

    // Update reception_time to TIME type (for legacy DBs)
    const [receptionTimeCol] = await connection.execute(`SHOW COLUMNS FROM event_invitation_data LIKE 'reception_time'`);
    if (receptionTimeCol.length > 0 && receptionTimeCol[0].Type.toLowerCase() !== 'time') {
      await connection.execute(`ALTER TABLE event_invitation_data MODIFY reception_time TIME`);
      // console.log('✅ Updated reception_time column to TIME in event_invitation_data table');
    }

    // Ensure date_lang column exists (for legacy DBs)
    const [invDateLangCol] = await connection.execute(`SHOW COLUMNS FROM event_invitation_data LIKE 'date_lang'`);
    if (invDateLangCol.length === 0) {
      await connection.execute(`ALTER TABLE event_invitation_data ADD COLUMN date_lang VARCHAR(10) DEFAULT 'en'`);
      // console.log('✅ Added date_lang column to event_invitation_data table');
    }

    // RSVP settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rsvp_settings (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        title VARCHAR(255),
        subtitle VARCHAR(255),
        location VARCHAR(500),
        welcome_message TEXT,
        confirm_text VARCHAR(255),
        decline_text VARCHAR(255),
        guest_count_enabled BOOLEAN DEFAULT TRUE,
        guest_count_label VARCHAR(255),
        guest_count_options JSON,
        special_requests_enabled BOOLEAN DEFAULT TRUE,
        special_requests_label VARCHAR(255),
        special_requests_placeholder TEXT,
        additional_fields JSON,
        submit_button_text VARCHAR(255),
        thank_you_message TEXT,
        background_color VARCHAR(7),
        text_color VARCHAR(7),
        button_color VARCHAR(7),
        accent_color VARCHAR(7),
        rsvp_contact VARCHAR(20),
        rsvp_contact_secondary VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        INDEX idx_event_id (event_id)
      )
    `);

    // Ensure rsvp_contact_secondary column exists in rsvp_settings (for legacy DBs)
    const [rsvpSettingsSecondaryCol] = await connection.execute(`SHOW COLUMNS FROM rsvp_settings LIKE 'rsvp_contact_secondary'`);
    if (rsvpSettingsSecondaryCol.length === 0) {
      await connection.execute(`ALTER TABLE rsvp_settings ADD COLUMN rsvp_contact_secondary VARCHAR(20)`);
      // console.log('✅ Added rsvp_contact_secondary column to rsvp_settings table');
    }

    // Update rsvp_contact field size to VARCHAR(20) for phone numbers in rsvp_settings (for legacy DBs)
    const [rsvpSettingsContactCol] = await connection.execute(`SHOW COLUMNS FROM rsvp_settings LIKE 'rsvp_contact'`);
    if (rsvpSettingsContactCol.length > 0 && rsvpSettingsContactCol[0].Type.toLowerCase() !== 'varchar(20)') {
      await connection.execute(`ALTER TABLE rsvp_settings MODIFY rsvp_contact VARCHAR(20)`);
      // console.log('✅ Updated rsvp_contact column to VARCHAR(20) in rsvp_settings table');
    }

    // Guests table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS guests (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        table_number VARCHAR(50),
        status ENUM('pending', 'confirmed', 'declined') DEFAULT 'pending',
        checked_in BOOLEAN DEFAULT FALSE,
        check_in_time TIMESTAMP NULL,
        rsvp_date TIMESTAMP NULL,
        guest_count INT DEFAULT 1,
        special_requests TEXT,
        additional_fields JSON,
        rsvp_token VARCHAR(255) UNIQUE NOT NULL,
        qr_code_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        INDEX idx_event_id (event_id),
        INDEX idx_status (status),
        INDEX idx_rsvp_token (rsvp_token),
        INDEX idx_checked_in (checked_in)
      )
    `);

    // Ensure rsvp_alias column exists in guests table (for RSVP alias system)
    const [rsvpAliasCol] = await connection.execute(`SHOW COLUMNS FROM guests LIKE 'rsvp_alias'`);
    if (rsvpAliasCol.length === 0) {
      await connection.execute(`ALTER TABLE guests ADD COLUMN rsvp_alias VARCHAR(255) UNIQUE`);
      // console.log('✅ Added rsvp_alias column to guests table');
    }

    // RSVP responses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS rsvp_responses (
        id VARCHAR(36) PRIMARY KEY,
        guest_id VARCHAR(36) NOT NULL,
        event_id VARCHAR(36) NOT NULL,
        response ENUM('confirmed', 'declined') NOT NULL,
        guest_count INT DEFAULT 1,
        special_requests TEXT,
        additional_fields JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        INDEX idx_guest_id (guest_id),
        INDEX idx_event_id (event_id),
        INDEX idx_response (response)
      )
    `);

    // Check-in logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS checkin_logs (
        id VARCHAR(36) PRIMARY KEY,
        guest_id VARCHAR(36) NOT NULL,
        event_id VARCHAR(36) NOT NULL,
        checked_in_by VARCHAR(36),
        check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_guest_id (guest_id),
        INDEX idx_event_id (event_id),
        INDEX idx_check_in_time (check_in_time)
      )
    `);
  } catch (error) {
    // console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
};