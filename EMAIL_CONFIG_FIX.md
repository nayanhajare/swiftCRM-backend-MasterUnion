# Email Configuration Fix for Lines 17-21

## Current Configuration (Lines 17-21)

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=nayanhajare46@gmail.com
EMAIL_PASS=gexk erod poxu lmfm
EMAIL_FROM=SwiftCRM <no-reply@swiftcrm.com>
```

## Issues Found

### 1. EMAIL_PASS has spaces
**Problem**: Gmail App Passwords are 16 characters without spaces. The spaces in your password will cause authentication failures.

**Fix**: Remove spaces from the password:
```env
EMAIL_PASS=gexkerodpoxulmfm
```

### 2. EMAIL_PORT=465 vs 587
**Current**: Port 465 (SSL)
**Alternative**: Port 587 (TLS) - More commonly used for Gmail

**Recommendation**: 
- Port 465 works but requires SSL
- Port 587 is more standard for Gmail with TLS
- Both work, but 587 is recommended

### 3. EMAIL_FROM format
**Current**: `SwiftCRM <no-reply@swiftcrm.com>`
**Note**: This format is correct, but make sure the email domain matches your Gmail or use just the email.

## Recommended Configuration

### Option 1: Port 465 (SSL) - Current
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=nayanhajare46@gmail.com
EMAIL_PASS=gexkerodpoxulmfm
EMAIL_FROM=nayanhajare46@gmail.com
```

### Option 2: Port 587 (TLS) - Recommended
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=nayanhajare46@gmail.com
EMAIL_PASS=gexkerodpoxulmfm
EMAIL_FROM=nayanhajare46@gmail.com
```

## Quick Fix

Update your `.env` file lines 17-21 to:

```env
# Email Configuration (Optional - leave empty to disable)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=nayanhajare46@gmail.com
EMAIL_PASS=gexkerodpoxulmfm
EMAIL_FROM=nayanhajare46@gmail.com
```

**Key Changes:**
1. ✅ Removed spaces from EMAIL_PASS
2. ✅ Changed EMAIL_PORT to 587 (recommended)
3. ✅ Updated EMAIL_FROM to use your Gmail address

## Testing

After updating, restart your server:

```bash
npm run dev
```

You should see:
```
✅ Email service configured and ready
```

If you see errors, check:
1. App Password is correct (no spaces, 16 characters)
2. 2FA is enabled on your Google account
3. App Password was generated for "Mail"

## Gmail App Password Format

Gmail App Passwords are displayed as: `xxxx xxxx xxxx xxxx` (with spaces)
But should be used as: `xxxxxxxxxxxxxxxx` (without spaces)

Your password `gexk erod poxu lmfm` should be: `gexkerodpoxulmfm`

