# Alika - Digital Event Invitation Platform

A modern platform to create, send, and track digital event invitations. Built with React, Node.js, and MySQL.

## ✨ Features
- Create and manage events
- Add guests (single or bulk)
- Send invitations via WhatsApp/SMS
- Track RSVPs and check-ins
- Real-time analytics
- Mobile responsive UI

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Python 3.8+ (for WhatsApp/SMS automation)
- Selenium and required Python packages

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Alika
```

### 2. Install Dependencies
```bash
# Node.js dependencies (frontend & backend)
npm install

# Python dependencies (for messaging features)
python3 -m venv venv
source venv/bin/activate
pip install selenium requests
# Or: pip install -r backend/requirements.txt
```

### 3. Configure Environment
- Copy and edit backend/.env with your database and API credentials:
  ```bash
  cp backend/env.example backend/.env
  # Edit backend/.env
  ```

### 4. Start the App
```bash
./start.sh
```
- This will launch both backend and frontend servers.
- Activate your Python environment if using WhatsApp/SMS features.

---

## 🐍 Python & Selenium Notes
- For WhatsApp/SMS, ensure you have the correct WebDriver (e.g., chromedriver) installed and in your PATH.
- If you encounter issues, check backend Python scripts for extra requirements.

---

## 📁 Project Structure

```
Alika/
├── backend/      # Backend API (Node.js, Express, MySQL, Python scripts)
├── src/          # Frontend (React, TypeScript)
├── public/       # Static assets
├── start.sh      # Script to run both servers
```

---

**Built with ❤️ for event organizers everywhere**
