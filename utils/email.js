const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;
let emailConfigured = false;

// Check if email is configured
const isEmailConfigured = () => {
  return !!(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  );
};

// Initialize transporter only if email is configured
const initializeTransporter = () => {
  if (!isEmailConfigured()) {
    console.log('📧 Email service not configured - email notifications will be disabled');
    console.log('   To enable: Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS in .env');
    return null;
  }

  try {
    const port = parseInt(process.env.EMAIL_PORT, 10);
    const config = {
      host: process.env.EMAIL_HOST,
      port: port,
      secure: port === 465, // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.trim() // Remove any whitespace from password
      }
    };

    // Gmail specific configuration
    if (process.env.EMAIL_HOST.includes('gmail.com')) {
      // For Gmail, prefer using service instead of host/port
      // This handles both port 465 (SSL) and 587 (TLS) automatically
      if (port === 465 || port === 587) {
        config.service = 'gmail';
        // Remove host/port when using service
        delete config.host;
        delete config.port;
        config.secure = port === 465;
      }
      // Note: For Gmail, you need to use an App Password, not your regular password
      // App passwords should be 16 characters without spaces
    }

    transporter = nodemailer.createTransport(config);
    emailConfigured = true;

    // Verify connection asynchronously (don't block startup)
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service verification failed:', error.message);
        console.error('   Email notifications will not work until this is fixed');
        emailConfigured = false;
      } else {
        console.log('✅ Email service configured and ready');
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Error initializing email service:', error.message);
    emailConfigured = false;
    return null;
  }
};

// Initialize on module load
transporter = initializeTransporter();

// Send email
const sendEmail = async (to, subject, html, text) => {
  // Check if email is configured
  if (!isEmailConfigured() || !transporter) {
    console.log('📧 Email not sent - email service not configured');
    return { success: false, error: 'Email service not configured' };
  }

  // Validate email address
  if (!to || !to.includes('@')) {
    console.error('📧 Invalid email address:', to);
    return { success: false, error: 'Invalid email address' };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"SwiftCRM" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '').trim()
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId, 'to', to);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('   Authentication failed. Check EMAIL_USER and EMAIL_PASS');
    } else if (error.code === 'ECONNECTION') {
      console.error('   Connection failed. Check EMAIL_HOST and EMAIL_PORT');
    }
    
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  leadAssigned: (leadName, assignedToName, leadId = null) => {
    const leadLink = leadId ? `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/leads/${leadId}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Lead</a>` : '';
    
    return {
      subject: `New Lead Assigned: ${leadName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .button { background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Lead Assigned</h2>
            </div>
            <div class="content">
              <p>Hello ${assignedToName},</p>
              <p>You have been assigned a new lead: <strong>${leadName}</strong></p>
              <p>Please review and take necessary actions.</p>
              ${leadLink}
              <p style="margin-top: 20px;">Best regards,<br><strong>SwiftCRM Team</strong></p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },
  
  leadStatusChanged: (leadName, oldStatus, newStatus, leadId = null) => {
    const leadLink = leadId ? `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/leads/${leadId}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Lead</a>` : '';
    
    return {
      subject: `Lead Status Updated: ${leadName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .status-change { background-color: white; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Lead Status Updated</h2>
            </div>
            <div class="content">
              <p>The status of lead <strong>${leadName}</strong> has been updated:</p>
              <div class="status-change">
                <p><strong>Previous Status:</strong> ${oldStatus}</p>
                <p><strong>New Status:</strong> ${newStatus}</p>
              </div>
              ${leadLink}
              <p style="margin-top: 20px;">Best regards,<br><strong>SwiftCRM Team</strong></p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  },
  
  newActivity: (leadName, activityType, userName, leadId = null) => {
    const leadLink = leadId ? `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/leads/${leadId}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Lead</a>` : '';
    
    return {
      subject: `New Activity: ${activityType} - ${leadName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .activity-badge { display: inline-block; background-color: #8b5cf6; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Activity Added</h2>
            </div>
            <div class="content">
              <p>A new <span class="activity-badge">${activityType}</span> has been added to lead <strong>${leadName}</strong> by ${userName}.</p>
              ${leadLink}
              <p style="margin-top: 20px;">Best regards,<br><strong>SwiftCRM Team</strong></p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }
};

module.exports = { sendEmail, emailTemplates, isEmailConfigured };

