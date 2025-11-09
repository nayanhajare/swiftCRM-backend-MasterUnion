# SwiftCRM Backend API

A robust Node.js/Express backend API for the SwiftCRM system, built with PostgreSQL, Sequelize ORM, Socket.io, and JWT authentication.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Socket.io Events](#socketio-events)
- [Authentication](#authentication)
- [Role-Based Access Control](#role-based-access-control)
- [Testing](#testing)
- [Deployment](#deployment)

## 🚀 Features

- **RESTful API** - Clean, well-structured REST endpoints
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Admin, Manager, and Sales Executive roles
- **Real-time Updates** - Socket.io for live notifications
- **Email Notifications** - Automated email triggers for lead events
- **Data Validation** - Express-validator for request validation
- **Error Handling** - Comprehensive error handling middleware
- **Database Migrations** - Sequelize CLI for database management
- **Security** - Helmet.js and CORS protection

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL (v15+)
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken) + Bcrypt
- **Real-time**: Socket.io
- **Email**: Nodemailer
- **Validation**: Express-validator
- **Security**: Helmet, CORS
- **Logging**: Morgan

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   └── auth.js              # Authentication & authorization middleware
├── models/
│   ├── User.js              # User model
│   ├── Lead.js              # Lead model
│   ├── Activity.js          # Activity model
│   └── index.js             # Model associations
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── leads.js             # Lead management routes
│   ├── activities.js        # Activity routes
│   └── dashboard.js         # Dashboard analytics routes
├── socket/
│   └── socket.js            # Socket.io configuration
├── utils/
│   ├── jwt.js               # JWT token utilities
│   └── email.js             # Email service
├── server.js                # Main server file
├── package.json
├── .env                     # Environment variables (not in git)
└── .env.example             # Environment variables template
```

## 🔧 Installation

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v15 or higher)
- npm or yarn

### Steps

1. **Clone the repository** (if not already done)
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy the example file
cp .env.example .env

# Or use the setup script
npm run setup:env
```

4. **Create PostgreSQL database**
```bash
# Using psql
psql -U postgres
CREATE DATABASE swiftcrm;
\q

# Or using createdb command
createdb swiftcrm
```

5. **Run database migrations** (optional, auto-sync in development)
```bash
npm run migrate
```

6. **Start the development server**
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 🔐 Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=swiftcrm
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@swiftcrm.com

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Environment Variable Descriptions

- **PORT**: Server port (default: 5000)
- **NODE_ENV**: Environment mode (development/production)
- **DB_HOST**: PostgreSQL host
- **DB_PORT**: PostgreSQL port (default: 5432)
- **DB_NAME**: Database name
- **DB_USER**: PostgreSQL username
- **DB_PASSWORD**: PostgreSQL password
- **JWT_SECRET**: Secret key for JWT tokens (use a strong random string in production)
- **JWT_EXPIRE**: Token expiration time (e.g., "7d", "24h")
- **EMAIL_HOST**: SMTP server host
- **EMAIL_PORT**: SMTP server port (587 for TLS, 465 for SSL)
- **EMAIL_USER**: SMTP username
- **EMAIL_PASS**: SMTP password (use App Password for Gmail)
- **EMAIL_FROM**: Sender email address
- **FRONTEND_URL**: Frontend application URL for CORS

## 📊 Database Schema

### ER Diagram

```
┌─────────────────────────────────────────────────────────┐
│                         User                            │
├─────────────────────────────────────────────────────────┤
│ id (PK, SERIAL)                                         │
│ name (VARCHAR, NOT NULL)                                │
│ email (VARCHAR, UNIQUE, NOT NULL)                       │
│ password (VARCHAR, NOT NULL)                            │
│ role (ENUM: 'Admin', 'Manager', 'Sales Executive')      │
│ isActive (BOOLEAN, DEFAULT true)                        │
│ createdAt (TIMESTAMP)                                    │
│ updatedAt (TIMESTAMP)                                    │
└─────────────────────────────────────────────────────────┘
         │                              │
         │ 1:N                          │ 1:N
         │                              │
         │                              │
┌─────────────────────────┐   ┌─────────────────────────┐
│         Lead           │   │       Activity          │
├─────────────────────────┤   ├─────────────────────────┤
│ id (PK, SERIAL)         │   │ id (PK, SERIAL)         │
│ name (VARCHAR)          │   │ type (ENUM)             │
│ email (VARCHAR)         │   │ title (VARCHAR)         │
│ phone (VARCHAR)         │   │ description (TEXT)      │
│ company (VARCHAR)         │   │ leadId (FK → Lead.id)  │
│ status (ENUM)           │   │ userId (FK → User.id)    │
│ source (VARCHAR)        │   │ metadata (JSONB)         │
│ estimatedValue (DECIMAL)│   │ createdAt (TIMESTAMP)    │
│ assignedToId (FK → User)│   │ updatedAt (TIMESTAMP)    │
│ createdById (FK → User) │   └─────────────────────────┘
│ notes (TEXT)            │
│ createdAt (TIMESTAMP)   │
│ updatedAt (TIMESTAMP)   │
└─────────────────────────┘
```

### Relationships

- **User → Lead** (1:N): A user can create multiple leads and be assigned to multiple leads
  - `User.id` → `Lead.createdById`
  - `User.id` → `Lead.assignedToId`
  
- **User → Activity** (1:N): A user can create multiple activities
  - `User.id` → `Activity.userId`
  
- **Lead → Activity** (1:N): A lead can have multiple activities
  - `Lead.id` → `Activity.leadId`

### Enums

**User Role:**
- `Admin` - Full system access
- `Manager` - Team management access
- `Sales Executive` - Limited access

**Lead Status:**
- `New`
- `Contacted`
- `Qualified`
- `Proposal`
- `Negotiation`
- `Won`
- `Lost`

**Activity Type:**
- `Note`
- `Call`
- `Meeting`
- `Email`
- `Status Change`

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ] // Optional validation errors
}
```

---

## 🔑 Authentication Endpoints

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Sales Executive"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Sales Executive",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST /api/auth/login

Login user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### GET /api/auth/me

Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Sales Executive"
    }
  }
}
```

---

### GET /api/auth/users

Get all active users (for assigning leads).

**Access:** Admin, Manager

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "Sales Executive"
      }
    ]
  }
}
```

---

## 📋 Lead Endpoints

### GET /api/leads

Get all leads with filtering, pagination, and search.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (New, Contacted, Qualified, etc.)
- `assignedToId` (optional): Filter by assigned user ID
- `search` (optional): Search in name, email, company
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): ASC or DESC (default: DESC)

**Example:**
```
GET /api/leads?page=1&limit=10&status=New&search=acme
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": 1,
        "name": "Acme Corp",
        "email": "contact@acme.com",
        "phone": "1234567890",
        "company": "Acme Corporation",
        "status": "New",
        "source": "Website",
        "estimatedValue": 50000,
        "assignedTo": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com"
        },
        "createdBy": { ... },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

---

### GET /api/leads/:id

Get a single lead by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "lead": {
      "id": 1,
      "name": "Acme Corp",
      "email": "contact@acme.com",
      ...
    }
  }
}
```

---

### POST /api/leads

Create a new lead.

**Request Body:**
```json
{
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "1234567890",
  "company": "Acme Corporation",
  "status": "New",
  "source": "Website",
  "estimatedValue": 50000,
  "assignedToId": 1,
  "notes": "Potential client"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "lead": { ... }
  }
}
```

---

### PUT /api/leads/:id

Update an existing lead.

**Request Body:** (same as POST, all fields optional)

**Response (200):**
```json
{
  "success": true,
  "message": "Lead updated successfully",
  "data": {
    "lead": { ... }
  }
}
```

---

### DELETE /api/leads/:id

Delete a lead.

**Access:** Admin, Manager

**Response (200):**
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

---

## 📝 Activity Endpoints

### GET /api/activities

Get all activities with filtering.

**Query Parameters:**
- `leadId` (optional): Filter by lead ID
- `type` (optional): Filter by activity type
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": 1,
        "type": "Note",
        "title": "Client Meeting",
        "description": "Discussed project requirements",
        "lead": { ... },
        "user": { ... },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### POST /api/activities

Create a new activity.

**Request Body:**
```json
{
  "type": "Note",
  "title": "Client Meeting",
  "description": "Discussed project requirements",
  "leadId": 1,
  "metadata": {}
}
```

**Activity Types:** `Note`, `Call`, `Meeting`, `Email`, `Status Change`

**Response (201):**
```json
{
  "success": true,
  "message": "Activity created successfully",
  "data": {
    "activity": { ... }
  }
}
```

---

### PUT /api/activities/:id

Update an activity.

**Response (200):**
```json
{
  "success": true,
  "message": "Activity updated successfully",
  "data": {
    "activity": { ... }
  }
}
```

---

### DELETE /api/activities/:id

Delete an activity.

**Response (200):**
```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

---

## 📊 Dashboard Endpoints

### GET /api/dashboard/stats

Get dashboard statistics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalLeads": 100,
    "totalValue": 5000000,
    "conversionRate": 25.5,
    "leadsByStatus": {
      "New": 20,
      "Contacted": 15,
      "Qualified": 10,
      "Won": 25,
      "Lost": 5
    },
    "leadsBySource": [
      {
        "source": "Website",
        "count": 50
      },
      {
        "source": "Referral",
        "count": 30
      }
    ],
    "monthlyTrend": [
      {
        "month": "2024-01-01",
        "count": 20
      }
    ],
    "recentActivities": [ ... ]
  }
}
```

---

### GET /api/dashboard/performance

Get team performance metrics.

**Access:** Admin, Manager

**Response (200):**
```json
{
  "success": true,
  "data": {
    "performance": [
      {
        "userId": 1,
        "userName": "John Doe",
        "totalLeads": 50,
        "wonLeads": 15,
        "totalValue": 500000,
        "conversionRate": 30.0
      }
    ]
  }
}
```

---

### GET /api/health

Health check endpoint.

**Response (200):**
```json
{
  "status": "OK",
  "message": "SwiftCRM API is running"
}
```

---

## 🔌 Socket.io Events

### Client → Server Events

#### `lead:subscribe`
Subscribe to updates for a specific lead.
```javascript
socket.emit('lead:subscribe', leadId)
```

#### `lead:unsubscribe`
Unsubscribe from lead updates.
```javascript
socket.emit('lead:unsubscribe', leadId)
```

### Server → Client Events

#### `lead:created`
Emitted when a new lead is created.
```javascript
socket.on('lead:created', (data) => {
  console.log('New lead:', data.lead)
})
```

#### `lead:updated`
Emitted when a lead is updated.
```javascript
socket.on('lead:updated', (data) => {
  console.log('Updated lead:', data.lead)
})
```

#### `lead:deleted`
Emitted when a lead is deleted.
```javascript
socket.on('lead:deleted', (data) => {
  console.log('Deleted lead ID:', data.leadId)
})
```

#### `activity:created`
Emitted when a new activity is created.
```javascript
socket.on('activity:created', (data) => {
  console.log('New activity:', data.activity)
})
```

#### `activity:updated`
Emitted when an activity is updated.
```javascript
socket.on('activity:updated', (data) => {
  console.log('Updated activity:', data.activity)
})
```

#### `activity:deleted`
Emitted when an activity is deleted.
```javascript
socket.on('activity:deleted', (data) => {
  console.log('Deleted activity ID:', data.activityId)
})
```

---

## 🔐 Authentication Flow

1. **Register/Login** → Get JWT token
2. **Include token** in Authorization header for protected routes
3. **Token expires** after 7 days (configurable via JWT_EXPIRE)
4. **Refresh token** by logging in again

### Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 👥 Role-Based Access Control

### Admin
- ✅ Full access to all features
- ✅ Can delete leads
- ✅ Can view team performance metrics
- ✅ Can manage users
- ✅ Can view all leads

### Manager
- ✅ Can view all leads
- ✅ Can delete leads
- ✅ Can view team performance metrics
- ✅ Can assign leads to team members
- ❌ Cannot manage users

### Sales Executive
- ✅ Can view only assigned leads and own created leads
- ✅ Can create and update leads
- ❌ Cannot delete leads
- ❌ Cannot view team performance metrics
- ❌ Cannot view all leads

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
- Authentication (register, login)
- Lead management (CRUD operations)
- Activity management
- Authorization checks

---

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET`
   - Configure production database
   - Set up email service

2. **Database**
   - Use managed PostgreSQL (AWS RDS, Heroku Postgres, etc.)
   - Run migrations: `npm run migrate`
   - Disable auto-sync in production

3. **Security**
   - Enable HTTPS
   - Update CORS to allow only your domain
   - Use environment variables for all secrets
   - Enable rate limiting

4. **Monitoring**
   - Set up logging (Winston, Morgan)
   - Monitor API performance
   - Set up error tracking (Sentry)

### Deployment Platforms

- **Heroku**: Easy deployment with PostgreSQL addon
- **AWS**: EC2 + RDS + Elastic Beanstalk
- **DigitalOcean**: App Platform or Droplets
- **Railway**: Simple deployment with PostgreSQL
- **Render**: Free tier available

### Example: Heroku Deployment

```bash
# Install Heroku CLI
heroku login
heroku create swiftcrm-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate
```

---

## 📦 Dependencies

### Production Dependencies
- `express` - Web framework
- `pg` - PostgreSQL client
- `sequelize` - ORM
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `socket.io` - Real-time communication
- `nodemailer` - Email service
- `express-validator` - Request validation
- `morgan` - HTTP logger
- `helmet` - Security headers
- `cors` - CORS middleware
- `dotenv` - Environment variables

### Development Dependencies
- `nodemon` - Auto-restart server
- `jest` - Testing framework
- `supertest` - HTTP testing
- `sequelize-cli` - Database migrations

---

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the [main README](../README.md)
- Review [CHANGELOG.md](./CHANGELOG.md) for recent fixes

---

**Built with ❤️ using Node.js and Express**

