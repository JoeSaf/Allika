# Alika Backend API

A secure, scalable backend API for the Alika Event Invitation Platform built with Node.js, Express, and MySQL.

## Features

- 🔐 **Authentication & Authorization**: JWT-based authentication with secure password hashing
- 📅 **Event Management**: Create, update, and manage events with detailed settings
- 👥 **Guest Management**: Add guests individually or via CSV upload with QR code generation
- 📱 **RSVP System**: Public RSVP links with customizable forms
- 📊 **QR Check-in**: QR code scanning for guest check-in
- 💬 **Messaging**: SMS/WhatsApp integration via Twilio, supports single and bulk send (Excel/CSV import)
- 📈 **Analytics**: Comprehensive event analytics and reporting
- 🔒 **Security**: Rate limiting, input validation, and CORS protection
- 🌐 **Webhook Support**: Receive delivery status and guest responses from Twilio/Africa’s Talking

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: multer
- **QR Codes**: qrcode
- **Messaging**: Twilio
- **Validation**: express-validator
- **Security**: helmet, express-rate-limit

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd alika/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=alika_db
   DB_PORT=3306

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   # Twilio Configuration (for SMS/WhatsApp)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number

   # CORS Configuration
   FRONTEND_URL=http://localhost:5173
   ```

4. **Set up MySQL database**
   - Create a MySQL database
   - The API will automatically create tables on first run

5. **Start the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset

### Events
- `POST /api/events` - Create new event
- `GET /api/events` - Get user's events
- `GET /api/events/:id` - Get specific event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/invitation-data` - Update invitation data
- `POST /api/events/:id/rsvp-settings` - Update RSVP settings

### Guests
- `POST /api/guests/:eventId` - Add single guest
- `POST /api/guests/:eventId/bulk` - Add multiple guests
- `POST /api/guests/:eventId/upload-csv` - Upload CSV file
- `GET /api/guests/:eventId` - Get guests for event
- `GET /api/guests/:eventId/:guestId` - Get specific guest
- `PUT /api/guests/:eventId/:guestId` - Update guest
- `DELETE /api/guests/:eventId/:guestId` - Delete guest
- `GET /api/guests/:eventId/export-csv` - Export guests as CSV

### RSVP (Public)
- `GET /api/rsvp/:token` - Get RSVP info
- `POST /api/rsvp/:token` - Submit RSVP response
- `GET /api/rsvp/:token/qr-code` - Get QR code for guest
- `GET /api/rsvp/:token/status` - Get RSVP status

### Check-in
- `POST /api/checkin` - Check in guest by token
- `POST /api/checkin/qr-scan` - Check in guest by QR code
- `POST /api/checkin/:eventId/:guestId` - Manual check-in
- `GET /api/checkin/:eventId/logs` - Get check-in logs
- `GET /api/checkin/:eventId/summary` - Get check-in summary
- `POST /api/checkin/:eventId/:guestId/undo` - Undo check-in

### Messaging
- `POST /api/messaging/:eventId/send-invites` - Send invitations (accepts singleGuest, bulkGuests, or guestIds; supports Excel/CSV import)
- `POST /api/messaging/webhook` - Webhook endpoint for SMS/WhatsApp delivery status and replies (set this in your Twilio/Africa’s Talking dashboard)
- `GET /api/messaging/:eventId/logs` - Get message logs
- `GET /api/messaging/:eventId/summary` - Get messaging summary
- `POST /api/messaging/:eventId/retry` - Retry failed messages

### Analytics
- `GET /api/analytics/:eventId` - Get event analytics
- `GET /api/analytics/:eventId/guests` - Get guest analytics
- `GET /api/analytics/:eventId/messages` - Get message analytics
- `GET /api/analytics/:eventId/export` - Export analytics data
- `GET /api/analytics/dashboard/overview` - Get dashboard overview

## Database Schema

### Core Tables
- **users** - User accounts and authentication
- **events** - Event information and settings
- **event_invitation_data** - Custom invitation templates
- **rsvp_settings** - RSVP form configuration
- **guests** - Guest list with RSVP tokens and QR codes
- **rsvp_responses** - Guest RSVP submissions
- **checkin_logs** - Guest check-in records
- **analytics** - Event statistics
- **message_logs** - Message delivery tracking (now supports single/bulk send, delivery status, and responses)

## Messaging Integration

- **Bulk & Single Messaging:** Send invitations to individual or multiple guests via API or UI (Excel/CSV import supported)
- **Webhook Support:** Receive delivery status and guest responses from Twilio/Africa’s Talking
- **Message Logs:** Track delivery and responses for every invitation
- **Usage:**
  - To send invitations, POST to `/api/messaging/:eventId/send-invites` with `{ singleGuest, bulkGuests, guestIds, messageType, customMessage }`.
  - For bulk send, upload an Excel/CSV file with columns: `Name, Phone`.
  - Set your webhook URL in Twilio/Africa’s Talking to `/api/messaging/webhook` to receive delivery status and replies.

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configured for frontend domain
- **Helmet**: Security headers
- **SQL Injection Prevention**: Parameterized queries

## File Upload

- **CSV Upload**: Guest list import with validation
- **Image Upload**: Event invitation images
- **File Size Limits**: Configurable upload limits
- **File Type Validation**: Restricted to allowed formats

## QR Code Generation

- **Guest QR Codes**: Unique QR codes for each guest
- **Check-in Integration**: QR codes contain guest and event data
- **High Quality**: Optimized for scanning reliability

## Development

### Scripts
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm test            # Run tests
npm run migrate     # Run database migrations
npm run seed        # Seed database with sample data
```

### Environment Variables
See `env.example` for all available configuration options.

### Database Migrations
The API automatically creates database tables on first run. For production, consider using a proper migration system.

## Production Deployment

1. **Set NODE_ENV=production**
2. **Use strong JWT_SECRET**
3. **Configure proper database credentials**
4. **Set up SSL/TLS certificates**
5. **Configure reverse proxy (nginx)**
6. **Set up monitoring and logging**
7. **Configure backup strategy**

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "error": true,
  "message": "Error description",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error message",
      "value": "invalid_value"
    }
  ]
}
```

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Configurable**: Via environment variables
- **Headers**: Rate limit info included in response headers

## CORS Configuration

- **Origin**: Configured for frontend URL
- **Credentials**: Enabled for authentication
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization, X-Requested-With

## Support

For issues and questions:
1. Check the API documentation
2. Review error logs
3. Verify environment configuration
4. Test with Postman or similar tool

## License

MIT License - see LICENSE file for details. 