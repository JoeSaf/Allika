# Allika - Digital Event Invitation Platform

A modern, comprehensive platform for creating, sending, and tracking digital event invitations. Built with React, TypeScript, Node.js, and MySQL.

## ✨ Features

### 🎉 Event Management
- Create and manage events with rich details
- Multiple event types (weddings, birthdays, corporate events, etc.)
- Custom invitation templates and themes
- Event status tracking (draft, active, completed)

### 👥 Guest Management
- Add guests individually or in bulk
- CSV import/export functionality
- Guest categorization and table assignments
- Special requests and dietary preferences
- Duplicate phone number detection

### 📱 Invitation & Communication
- Send invitations via WhatsApp, SMS, or Email
- Customizable invitation messages
- QR code generation for each guest
- Real-time delivery status tracking
- Message retry functionality

### ✅ RSVP & Check-in System
- Digital RSVP forms with custom fields
- Guest count management
- QR code-based check-in system
- Manual check-in options
- Check-in analytics and reporting

### 📊 Analytics & Reporting
- Real-time event analytics
- Guest response tracking
- Message delivery statistics
- Check-in rate monitoring
- Exportable reports

### 🎨 User Experience
- Modern, responsive design
- Mobile-first approach
- Dark/light theme support
- Intuitive navigation
- Real-time notifications

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0.0 or higher
- **MySQL** 8.0 or higher
- **Python** 3.8+ (for WhatsApp/SMS automation)
- **Git**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Allika
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd backend
npm install
cd ..
```

#### Python Dependencies (for messaging features)
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install selenium requests
```

### 3. Environment Configuration

#### Frontend Environment
```bash
cp env.example .env.local
# Edit .env.local with your configuration
```

#### Backend Environment
```bash
cd backend
cp env.example .env
# Edit .env with your database and API credentials
cd ..
```

### 4. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE allika_db;
exit;

# Run migrations (if available)
cd backend
npm run migrate
npm run seed
cd ..
```

### 5. Start the Application

#### Development Mode
```bash
# Start both frontend and backend
./start.sh

# Or start individually:
# Frontend (in one terminal)
npm run dev

# Backend (in another terminal)
cd backend
npm run dev
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start backend
cd backend
npm start
```

## 🛠️ Development

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript type checking
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

#### Backend
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
```

### Code Quality

The project uses several tools to maintain code quality:

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety
- **Jest** - Testing framework

### Project Structure

```
Allika/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   └── ...            # Feature-specific components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   ├── hooks/             # Custom React hooks
│   ├── constants/         # Application constants
│   └── config/            # Configuration files
├── backend/               # Backend API
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── config/            # Configuration files
│   ├── utils/             # Utility functions
│   └── scripts/           # Database scripts
├── public/                # Static assets
├── env.example            # Environment variables template
├── package.json           # Frontend dependencies
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
```

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=allika_db
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Email (for invitations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# WhatsApp/SMS (optional)
WHATSAPP_API_KEY=your-whatsapp-api-key
SMS_API_KEY=your-sms-api-key

# Security
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing

### Frontend Testing
```bash
npm test                 # Run tests
npm run test:coverage    # Run tests with coverage
```

### Backend Testing
```bash
cd backend
npm test                 # Run tests
npm run test:coverage    # Run tests with coverage
```

## 📦 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy the 'dist' folder to your hosting service
```

### Backend Deployment
```bash
cd backend
npm install --production
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/allika/issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- Built with ❤️ for event organizers everywhere
- Special thanks to the open-source community
- Icons provided by [Lucide React](https://lucide.dev/)
- UI components built with [Radix UI](https://www.radix-ui.com/)

---

**Made with ❤️ by the Nejo Team**
