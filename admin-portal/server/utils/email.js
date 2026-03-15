const nodemailer = require('nodemailer');

// Create transporter
let transporter = null;

function initializeTransporter() {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log('Email transporter initialized');
}

/**
 * Send OTP email to admin
 * @param {string} email - Admin email
 * @param {string} otp - OTP code
 */
async function sendOTP(email, otp) {
  if (!transporter) {
    initializeTransporter();
  }

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'WhaSender Admin - Login OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp-box { background: white; padding: 20px; text-align: center; border: 2px solid #10b981; border-radius: 8px; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">WhaSender Admin</h1>
          </div>
          <div class="content">
            <h2 style="color: #1f2937; margin-top: 0;">Login OTP</h2>
            <p>Hello,</p>
            <p>You requested to login to the WhaSender Admin Portal. Use the OTP below to complete your login:</p>

            <div class="otp-box">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Your OTP Code</div>
              <div class="otp-code">${otp}</div>
            </div>

            <p><strong>Important:</strong></p>
            <ul>
              <li>This OTP is valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes</li>
              <li>Never share this OTP with anyone</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>

            <div class="footer">
              <p>This is an automated email from WhaSender Admin Portal.</p>
              <p>&copy; 2026 WhaSender. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
}

module.exports = {
  initializeTransporter,
  sendOTP,
};
