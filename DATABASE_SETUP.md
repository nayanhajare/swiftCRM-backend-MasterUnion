# Database Setup Guide

## PostgreSQL Setup

### 1. Install PostgreSQL

If you don't have PostgreSQL installed:

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Or use Chocolatey: `choco install postgresql`

**macOS:**
- Use Homebrew: `brew install postgresql@15`
- Start service: `brew services start postgresql@15`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE swiftcrm;

# Create user (optional, if not using default postgres user)
CREATE USER swiftcrm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE swiftcrm TO swiftcrm_user;

# Exit psql
\q
```

### 3. Configure .env File

1. Copy the example file:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=swiftcrm
DB_USER=postgres
DB_PASSWORD=your_actual_password
```

### 4. Common Issues & Solutions

#### Issue: "client password must be a string"
**Solution**: 
- Make sure `DB_PASSWORD` is set in `.env` file
- Password should not be empty
- If password is empty, set it to an empty string: `DB_PASSWORD=""`
- Or set a password for your PostgreSQL user

#### Issue: "password authentication failed"
**Solution**:
- Verify your PostgreSQL user password
- Update `DB_PASSWORD` in `.env` file
- Reset PostgreSQL password if needed:
  ```sql
  ALTER USER postgres PASSWORD 'new_password';
  ```

#### Issue: "database does not exist"
**Solution**:
- Create the database: `CREATE DATABASE swiftcrm;`
- Or update `DB_NAME` in `.env` to match your database name

#### Issue: "connection refused"
**Solution**:
- Make sure PostgreSQL is running:
  - Windows: Check Services
  - macOS: `brew services start postgresql@15`
  - Linux: `sudo systemctl start postgresql`
- Check if port 5432 is correct
- Verify `DB_HOST` in `.env` file

### 5. Test Connection

```bash
# Test PostgreSQL connection
psql -U postgres -d swiftcrm -h localhost

# If successful, you should see:
# swiftcrm=#
```

### 6. Reset Database (if needed)

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS swiftcrm;"
psql -U postgres -c "CREATE DATABASE swiftcrm;"
```

### 7. Using Docker (Alternative)

If you prefer using Docker for PostgreSQL:

```bash
# Run PostgreSQL in Docker
docker run --name swiftcrm-db \
  -e POSTGRES_DB=swiftcrm \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15

# Then update .env:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=swiftcrm
# DB_USER=postgres
# DB_PASSWORD=postgres
```

### 8. Verify Configuration

After setting up, start the backend server:

```bash
cd backend
npm run dev
```

You should see:
```
✅ Database connected successfully
Server running on port 5000
```

If you see errors, check:
1. PostgreSQL is running
2. Database exists
3. `.env` file has correct credentials
4. User has proper permissions

## Troubleshooting

### Windows Specific

If you get "psql: command not found":
- Add PostgreSQL bin directory to PATH
- Default location: `C:\Program Files\PostgreSQL\15\bin`
- Or use pgAdmin GUI tool

### macOS Specific

If PostgreSQL won't start:
```bash
# Check status
brew services list

# Start manually
pg_ctl -D /usr/local/var/postgresql@15 start
```

### Linux Specific

If connection is refused:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if PostgreSQL is listening
sudo netstat -tlnp | grep 5432

# Modify pg_hba.conf if needed
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: host all all 127.0.0.1/32 md5
```

## Quick Start Checklist

- [ ] PostgreSQL is installed and running
- [ ] Database `swiftcrm` is created
- [ ] User has password set (or using default postgres user)
- [ ] `.env` file exists in backend directory
- [ ] `.env` file has correct `DB_PASSWORD` (not empty)
- [ ] Can connect to database using `psql`
- [ ] Backend server starts without database errors

## Need Help?

If you're still having issues:
1. Check PostgreSQL logs
2. Verify all environment variables in `.env`
3. Test connection manually with `psql`
4. Check firewall settings
5. Verify PostgreSQL version compatibility (v12+)

