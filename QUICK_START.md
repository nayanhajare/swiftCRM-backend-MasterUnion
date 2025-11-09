# Quick Start Guide

## 🚀 Setup in 5 Minutes

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Setup Environment Variables

**Option A: Use Setup Script (Recommended)**
```bash
npm run setup:env
```
This interactive script will guide you through creating the `.env` file.

**Option B: Manual Setup**
1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit `.env` file and update:
```env
DB_PASSWORD=your_postgresql_password
```

### Step 3: Setup PostgreSQL Database

**If PostgreSQL is not installed:**
- Windows: Download from https://www.postgresql.org/download/windows/
- macOS: `brew install postgresql@15`
- Linux: `sudo apt install postgresql`

**Create Database:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE swiftcrm;

# Exit
\q
```

### Step 4: Start the Server
```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
✅ Database models synchronized
🚀 Server running on port 5000
```

## 🔧 Common Issues

### Issue: "client password must be a string"

**Solution:**
1. Make sure `.env` file exists in `backend/` directory
2. Set `DB_PASSWORD` in `.env` file:
   ```env
   DB_PASSWORD=your_actual_password
   ```
3. If your PostgreSQL user has no password, set it:
   ```sql
   ALTER USER postgres PASSWORD 'new_password';
   ```
   Then update `.env` with the new password.

### Issue: "database does not exist"

**Solution:**
```bash
psql -U postgres
CREATE DATABASE swiftcrm;
```

### Issue: "connection refused"

**Solution:**
- Make sure PostgreSQL is running
- Windows: Check Services
- macOS: `brew services start postgresql@15`
- Linux: `sudo systemctl start postgresql`

## 📝 Environment Variables

Required variables in `.env`:
- `DB_NAME` - Database name (default: swiftcrm)
- `DB_USER` - PostgreSQL user (default: postgres)
- `DB_PASSWORD` - PostgreSQL password (**REQUIRED**)
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 5000)

Optional variables:
- `EMAIL_*` - Email configuration (can be left empty)

## 🆘 Need Help?

See `DATABASE_SETUP.md` for detailed database setup instructions.

## ✅ Verification

After setup, test the connection:
```bash
# Test database connection
psql -U postgres -d swiftcrm -h localhost

# Start server
npm run dev
```

If you see the success messages, you're all set! 🎉


