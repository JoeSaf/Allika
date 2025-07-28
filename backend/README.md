# Alika Backend API

Backend API server for the Alika Event Invitation Platform. Built with Node.js, Express, and MySQL.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0+
- MySQL 8.0+
- Python 3.8+ (for WhatsApp/SMS features)

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp env.example .env
# Edit .env with your configuration
```

### Database Setup
```bash
# Create database
mysql -u root -p
CREATE DATABASE alika_db;
exit;

# Run migrations and seed data
npm run migrate
npm run seed
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📁 Project Structure

```
backend/
├── config/           # Configuration files
│   └── database.js   # Database connection
├── middleware/       # Express middleware
│   ├── auth.js       # Authentication middleware
│   └── validation.js # Request validation
├── routes/           # API routes
│   ├── auth.js       # Authentication routes
│   ├── events.js     # Event management
│   ├── guests.js     # Guest management
│   ├── rsvp.js       # RSVP handling
│   ├── checkin.js    # Check-in system
│   ├── messaging.js  # Message sending
│   └── analytics.js  # Analytics and reporting
├── utils/            # Utility functions
│   └── helpers.js    # Common helper functions
├── uploads/          # File uploads directory
├── logs/             # Application logs
├── server.js         # Main server file
└── package.json      # Dependencies and scripts
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/invitation-data` - Update invitation data
- `POST /api/events/:id/rsvp-settings` - Update RSVP settings

### Guests
- `GET /api/guests/:eventId` - List guests for event
- `POST /api/guests/:eventId` - Add guest
- `POST /api/guests/:eventId/bulk` - Add multiple guests
- `POST /api/guests/:eventId/upload-csv` - Upload guests CSV
- `GET /api/guests/:eventId/export-csv` - Export guests CSV
- `PUT /api/guests/:eventId/:guestId` - Update guest
- `DELETE /api/guests/:eventId/:guestId` - Delete guest
- `POST /api/guests/:eventId/check-duplicates` - Check duplicate phones

### RSVP (Public)
- `GET /api/rsvp/:token` - Get RSVP information
- `POST /api/rsvp/:token` - Submit RSVP response
- `GET /api/rsvp/:token/qr-code` - Get RSVP QR code
- `GET /api/rsvp/:token/status` - Get RSVP status

### Check-in
- `POST /api/checkin` - Check-in guest by token
- `POST /api/checkin/qr-scan` - Check-in guest by QR code
- `POST /api/checkin/:eventId/:guestId` - Manual check-in
- `GET /api/checkin/:eventId/logs` - Get check-in logs
- `GET /api/checkin/:eventId/summary` - Get check-in summary
- `POST /api/checkin/:eventId/:guestId/undo` - Undo check-in

### Messaging
- `POST /api/messaging/:eventId/send-invites` - Send invitations
- `GET /api/messaging/:eventId/logs` - Get message logs
- `GET /api/messaging/:eventId/summary` - Get messaging summary
- `POST /api/messaging/:eventId/retry` - Retry failed messages

### Analytics
- `GET /api/analytics/:eventId` - Get event analytics
- `GET /api/analytics/:eventId/guests` - Get guest analytics
- `GET /api/analytics/:eventId/messages` - Get message analytics
- `GET /api/analytics/:eventId/export` - Export analytics
- `GET /api/analytics/dashboard/overview` - Dashboard overview

## 🔧 Configuration

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alika_db
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# WhatsApp/SMS
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_PHONE_NUMBER=your-whatsapp-number
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=ALIKA

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
CORS_ORIGIN=http://localhost:5173
SESSION_SECRET=your-session-secret-here

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev              # Start development server with nodemon
npm start                # Start production server
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run migrate          # Run database migrations
npm run seed             # Seed database with sample data
npm run clean            # Clean node_modules and package-lock.json
npm run install:clean    # Clean install dependencies
```

### Code Quality

The backend uses several tools to maintain code quality:

- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Jest** - Testing framework

### Database Schema

The application uses MySQL with the following main tables:

- `users` - User accounts
- `events` - Event information
- `guests` - Guest lists
- `rsvp_responses` - RSVP responses
- `checkin_logs` - Check-in records
- `message_logs` - Message delivery logs

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection prevention

## 📊 Monitoring & Logging

- Request logging with Morgan
- Error logging
- Performance monitoring
- Health check endpoint (`/health`)

## 🧪 Testing

### Running Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### Test Structure
```
tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── fixtures/          # Test data
```

## 📦 Deployment

### Production Build
```bash
npm install --production
npm start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure CORS for production domain
5. Set up proper logging

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials in `.env`
   - Ensure MySQL is running
   - Verify database exists

2. **JWT Token Issues**
   - Check JWT_SECRET is set
   - Verify token expiration settings

3. **File Upload Issues**
   - Check upload directory permissions
   - Verify file size limits

4. **CORS Errors**
   - Check CORS_ORIGIN configuration
   - Ensure frontend URL is correct

### Logs
Check application logs in `./logs/app.log` for detailed error information.

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass

## 📄 License

This project is licensed under the MIT License. 