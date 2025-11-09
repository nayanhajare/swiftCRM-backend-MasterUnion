const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter configuration (only if email is configured)
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((error, success) => {
    if (error) {
      console.log('Email service not configured:', error.message);
      console.log('Email notifications will be disabled');
    } else {
      console.log('Email service ready');
    }
  });
} else {
  console.log('Email service not configured - email notifications will be disabled');
}

// Send email
const sendEmail = async (to, subject, html, text) => {
  // Skip if email is not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not sent - email service not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  leadAssigned: (leadName, assignedToName) => ({
    subject: `New Lead Assigned: ${leadName}`,
    html: `
      <h2>New Lead Assigned</h2>
      <p>Hello ${assignedToName},</p>
      <p>You have been assigned a new lead: <strong>${leadName}</strong></p>
      <p>Please review and take necessary actions.</p>
      <p>Best regards,<br>SwiftCRM Team</p>
    `
  }),
  leadStatusChanged: (leadName, oldStatus, newStatus) => ({
    subject: `Lead Status Updated: ${leadName}`,
    html: `
      <h2>Lead Status Updated</h2>
      <p>The status of lead <strong>${leadName}</strong> has been changed from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.</p>
      <p>Best regards,<br>SwiftCRM Team</p>
    `
  }),
  newActivity: (leadName, activityType, userName) => ({
    subject: `New Activity: ${activityType} - ${leadName}`,
    html: `
      <h2>New Activity Added</h2>
      <p>A new ${activityType.toLowerCase()} has been added to lead <strong>${leadName}</strong> by ${userName}.</p>
      <p>Best regards,<br>SwiftCRM Team</p>
    `
  })
};

module.exports = { sendEmail, emailTemplates };

