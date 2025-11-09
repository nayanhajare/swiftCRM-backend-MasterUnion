# Email Service Setup Guide

## Overview

The email service in SwiftCRM uses Nodemailer to send automated notifications. It's designed to work gracefully even when email is not configured.

## Configuration

### Required Environment Variables

Add these to your `backend/.env` file:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@swiftcrm.com
```

### Gmail Setup

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password (not your regular Gmail password) in `EMAIL_PASS`

3. **Configuration**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_16_character_app_password
   EMAIL_FROM=noreply@swiftcrm.com
   ```

### Other Email Providers

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

#### Outlook/Office 365
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
EMAIL_FROM=your_email@outlook.com
```

#### Custom SMTP
```env
EMAIL_HOST=your.smtp.server.com
EMAIL_PORT=587
EMAIL_USER=your_username
EMAIL_PASS=your_password
EMAIL_FROM=noreply@yourdomain.com
```

## How It Works

### Email Service Initialization

1. **On Server Start**: The email service checks if all required environment variables are set
2. **If Configured**: Creates a Nodemailer transporter and verifies the connection
3. **If Not Configured**: Logs a message and continues (emails won't be sent)

### Email Triggers

Emails are automatically sent when:

1. **Lead Assigned**: When a lead is assigned to a user
   - Sent to: Assigned user
   - Template: `leadAssigned`

2. **Status Changed**: When a lead's status is updated
   - Sent to: Assigned user
   - Template: `leadStatusChanged`

3. **New Activity**: When a new activity is added to a lead
   - Sent to: Assigned user (if different from creator)
   - Template: `newActivity`

### Email Templates

All emails include:
- Professional HTML styling
- Lead information
- Direct link to view the lead in the CRM
- Responsive design

## Testing Email Service

### Test Connection

The email service automatically verifies the connection on startup. Check your server logs:

```
✅ Email service configured and ready
```

If you see errors, check:
1. Environment variables are set correctly
2. Email credentials are valid
3. Port is not blocked by firewall
4. For Gmail: App password is used (not regular password)

### Test Sending Email

You can test by:
1. Creating a lead and assigning it to another user
2. Changing a lead's status
3. Adding an activity to a lead

Check server logs for:
```
✅ Email sent successfully: <messageId> to user@example.com
```

## Troubleshooting

### "Email service not configured"
**Solution**: Set all required environment variables in `.env` file

### "Authentication failed"
**Solution**: 
- For Gmail: Use App Password, not regular password
- Check EMAIL_USER and EMAIL_PASS are correct
- Verify 2FA is enabled (for Gmail)

### "Connection failed"
**Solution**:
- Check EMAIL_HOST and EMAIL_PORT are correct
- Verify firewall allows SMTP connections
- Check if your network blocks port 587

### "Invalid email address"
**Solution**: Ensure user email addresses in database are valid

### Emails not being sent
**Check**:
1. Email service is configured (check server startup logs)
2. User has a valid email address
3. Email is assigned to a different user (not the creator)
4. Check server logs for error messages

## Disabling Email Service

To disable email notifications:
1. Remove or leave empty EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS
2. The system will continue to work normally
3. No emails will be sent, but no errors will occur

## Production Recommendations

1. **Use a Professional Email Service**:
   - SendGrid (recommended)
   - AWS SES
   - Mailgun
   - Postmark

2. **Set EMAIL_FROM** to a verified domain:
   ```env
   EMAIL_FROM=noreply@yourdomain.com
   ```

3. **Use Environment-Specific Configuration**:
   - Development: Gmail or test SMTP
   - Production: Professional email service

4. **Monitor Email Delivery**:
   - Set up bounce handling
   - Monitor delivery rates
   - Set up email logs

5. **Rate Limiting**:
   - Be aware of email provider rate limits
   - Implement queuing for high-volume sends

## Security Notes

1. **Never commit `.env` file** with email credentials
2. **Use App Passwords** for Gmail (not regular passwords)
3. **Rotate credentials** regularly
4. **Use environment variables** in production (not hardcoded)
5. **Enable SPF/DKIM** for your sending domain

## Code Usage

### Sending Email

```javascript
const { sendEmail, emailTemplates } = require('./utils/email');

// Get template
const emailData = emailTemplates.leadAssigned('Acme Corp', 'John Doe', leadId);

// Send email
const result = await sendEmail(
  'user@example.com',
  emailData.subject,
  emailData.html
);

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

### Checking Configuration

```javascript
const { isEmailConfigured } = require('./utils/email');

if (isEmailConfigured()) {
  // Email service is ready
} else {
  // Email service not configured
}
```

