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
    console.log('✅ Database connected successfully');
    connection.release();
    
    // Create tables if they don't exist
    await createTables();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
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
        date DATE NOT NULL,
        time TIME,
        venue VARCHAR(500),
        reception VARCHAR(500),
        reception_time TIME,
        theme VARCHAR(255),
        rsvp_contact VARCHAR(255),
        additional_info TEXT,
        inviting_family VARCHAR(255),
        invitation_image VARCHAR(500),
        status ENUM('draft', 'active', 'completed') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_date (date)
      )
    `);

    // Event invitation data table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS event_invitation_data (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        couple_name VARCHAR(255),
        event_date VARCHAR(255),
        event_time VARCHAR(50),
        venue VARCHAR(500),
        reception VARCHAR(500),
        reception_time VARCHAR(50),
        theme VARCHAR(255),
        rsvp_contact VARCHAR(255),
        additional_info TEXT,
        inviting_family VARCHAR(255),
        guest_name VARCHAR(255),
        invitation_image VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        INDEX idx_event_id (event_id)
      )
    `);

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
        rsvp_contact VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        INDEX idx_event_id (event_id)
      )
    `);

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

    // Analytics table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS analytics (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        total_invitations INT DEFAULT 0,
        messages_sent INT DEFAULT 0,
        delivered INT DEFAULT 0,
        \`read\` INT DEFAULT 0,
        responded INT DEFAULT 0,
        confirmed INT DEFAULT 0,
        declined INT DEFAULT 0,
        pending INT DEFAULT 0,
        response_rate DECIMAL(5,2) DEFAULT 0.00,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        INDEX idx_event_id (event_id)
      )
    `);

    // Message logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS message_logs (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        guest_id VARCHAR(36),
        message_type ENUM('sms', 'whatsapp', 'email') NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        message_content TEXT NOT NULL,
        status ENUM('pending', 'sent', 'delivered', 'failed') DEFAULT 'pending',
        sent_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL,
        INDEX idx_event_id (event_id),
        INDEX idx_guest_id (guest_id),
        INDEX idx_status (status),
        INDEX idx_sent_at (sent_at)
      )
    `);

    connection.release();
    console.log('✅ Database tables created successfully');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
};

export default pool; 