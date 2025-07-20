# Alika - Digital Event Invitation Platform

A modern, full-stack event invitation platform built with React, Node.js, and MySQL. Create beautiful invitations, manage guest lists, handle RSVPs, and track event analytics with ease.

![Alika Platform](https://img.shields.io/badge/Alika-Event%20Platform-teal?style=for-the-badge&logo=calendar)

## ✨ Features

### 🎨 Frontend (React + TypeScript)
- **Modern UI**: Beautiful, responsive design with Tailwind CSS and shadcn/ui
- **Event Management**: Create, edit, and manage events with rich templates
- **Guest Management**: Add guests individually or via CSV upload
- **QR Code Generation**: Automatic QR code generation for each guest
- **Real-time Analytics**: Live event statistics and reporting
- **Mobile Responsive**: Works perfectly on all devices
- **Send Invitations**: Send invitations to single or multiple guests (Excel/CSV import) directly from the event editor
- **Preview Messages**: Instantly preview invitation messages before sending
- **Idle Session Timeout**: Automatic logout after 15 minutes of inactivity for security

### 🔧 Backend (Node.js + Express + MySQL)
- **Secure Authentication**: JWT-based auth with password hashing
- **RESTful API**: Comprehensive API for all platform features
- **File Upload**: CSV import and image upload support
- **Messaging Integration**: SMS/WhatsApp via Twilio, supports single and bulk send
- **QR Code Processing**: QR scan and check-in functionality
- **Analytics Engine**: Detailed event statistics and reporting
- **Webhook Support**: Receive delivery status and guest responses from Twilio/Africa’s Talking

### 🗄️ Database (MySQL)
- **Relational Design**: Optimized schema for event management
- **Data Integrity**: Foreign keys and constraints
- **Scalable**: Designed for high-performance event management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Alika
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Or use the installation script
./install.sh

# Set up environment variables
cp env.example .env
# Edit .env with your database and API credentials

# Start the development server
npm run dev
```

### 3. Frontend Setup
```bash
cd ..  # Back to project root

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 4. Database Setup
1. Create a MySQL database
2. Update the database credentials in `backend/.env`
3. The API will automatically create tables on first run

## 📁 Project Structure

```
Alika/
├── backend/                 # Backend API
│   ├── config/             # Database and app configuration
│   ├── middleware/         # Authentication and validation
│   ├── routes/             # API route handlers
│   ├── utils/              # Helper functions
│   ├── uploads/            # File upload directory
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── src/                    # Frontend React app
│   ├── components/         # Reusable UI components
│   ├── components/SendInvitationModal.tsx # Modal for sending invitations (single/bulk)
│   ├── pages/              # Page components
│   ├── services/           # API service layer (now includes sendInvites)
│   ├── utils/              # Frontend utilities
│   └── main.tsx            # App entry point
├── public/                 # Static assets
└── package.json            # Frontend dependencies
```

## 🔧 Configuration

### Backend Environment Variables
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

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:5000/api
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Events
- `POST /api/events` - Create new event
- `GET /api/events` - Get user's events
- `GET /api/events/:id` - Get specific event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Guests
- `POST /api/guests/:eventId` - Add single guest
- `POST /api/guests/:eventId/bulk` - Add multiple guests
- `POST /api/guests/:eventId/upload-csv` - Upload CSV file
- `GET /api/guests/:eventId` - Get guests for event

### RSVP (Public)
- `GET /api/rsvp/:token` - Get RSVP info
- `POST /api/rsvp/:token` - Submit RSVP response

### Check-in
- `POST /api/checkin` - Check in guest by token
- `POST /api/checkin/qr-scan` - Check in guest by QR code

### Messaging
- `POST /api/messaging/:eventId/send-invites` - Send invitations (single, bulk, or by guest IDs)
- `POST /api/messaging/webhook` - Webhook endpoint for SMS/WhatsApp delivery status and replies
- `GET /api/messaging/:eventId/logs` - Get all message logs for an event

### Analytics
- `GET /api/analytics/:eventId` - Get event analytics
- `GET /api/analytics/dashboard/overview` - Get dashboard overview

## 🎯 Key Features

### Event Creation
- Multiple event types (wedding, birthday, corporate, etc.)
- Custom invitation templates
- Rich text editing
- Image upload support

### Guest Management
- Individual guest addition
- Bulk CSV/Excel import
- Guest categorization
- Table assignments

### RSVP System
- Public RSVP links
- Customizable RSVP forms
- Guest count tracking
- Special requests handling

### QR Code Integration
- Automatic QR generation
- QR code scanning
- Check-in tracking
- Attendance analytics

### Messaging
- SMS integration via Twilio
- WhatsApp messaging
- Message templates
- Delivery tracking
- **Bulk & Single Messaging:** Send invitations to individual or multiple guests via API or UI (Excel/CSV import supported)
- **Preview Messages:** Instantly preview invitation messages before sending
- **Webhook Support:** Receive delivery status and guest responses from Twilio/Africa’s Talking

### Analytics
- Real-time event statistics
- Guest response tracking
- Check-in analytics
- Message delivery reports

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configured for frontend domain
- **SQL Injection Prevention**: Parameterized queries

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm test             # Run tests
npm run migrate      # Run database migrations
```

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Database Management
The API automatically creates database tables on first run. For production, consider using a proper migration system.

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure proper database credentials
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx)
6. Set up monitoring and logging

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure environment variables
4. Set up domain and SSL

## 📊 Database Schema

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the documentation
2. Review the API documentation
3. Check existing issues
4. Create a new issue with details

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [QRCode](https://github.com/soldair/node-qrcode) for QR code generation

---

**Built with ❤️ for event organizers everywhere**
