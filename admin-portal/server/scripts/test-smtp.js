require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('Testing SMTP Configuration...\n');

  console.log('SMTP Config:');
  console.log(`  Host: ${process.env.SMTP_HOST}`);
  console.log(`  Port: ${process.env.SMTP_PORT}`);
  console.log(`  Secure: ${process.env.SMTP_SECURE}`);
  console.log(`  User: ${process.env.SMTP_USER}`);
  console.log(`  From: ${process.env.SMTP_FROM}\n`);

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('✓ Transporter created');

    // Verify connection
    console.log('\nVerifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Send test email
    console.log('Sending test email...');
    const testEmail = process.env.SMTP_USER; // Send to self for testing

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: testEmail,
      subject: 'WhaSender Admin - SMTP Test',
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
            .success { background: white; padding: 20px; text-align: center; border: 2px solid #10b981; border-radius: 8px; margin: 20px 0; }
            .success-icon { font-size: 48px; color: #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">WhaSender Admin</h1>
            </div>
            <div class="content">
              <h2 style="color: #1f2937; margin-top: 0;">SMTP Test Successful!</h2>

              <div class="success">
                <div class="success-icon">✓</div>
                <p style="margin: 10px 0; font-size: 18px; font-weight: bold; color: #10b981;">
                  Email Configuration is Working
                </p>
              </div>

              <p>Your SMTP configuration has been tested and is working correctly:</p>

              <ul>
                <li><strong>Host:</strong> ${process.env.SMTP_HOST}</li>
                <li><strong>Port:</strong> ${process.env.SMTP_PORT}</li>
                <li><strong>User:</strong> ${process.env.SMTP_USER}</li>
                <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>

              <p>You can now use this SMTP configuration to send OTP emails for admin login.</p>

              <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280;">
                <p>This is an automated test email from WhaSender Admin Portal.</p>
                <p>&copy; 2026 WhaSender. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Recipient: ${testEmail}\n`);

    console.log('🎉 SMTP is configured correctly and working!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ SMTP Test Failed!\n');
    console.error('Error:', error.message);

    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Authentication failed. Please check:');
      console.error('   - SMTP_USER is correct');
      console.error('   - SMTP_PASS is valid');
      console.error('   - Your Brevo API key has SMTP permissions');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n⚠️  Connection failed. Please check:');
      console.error('   - SMTP_HOST is correct');
      console.error('   - SMTP_PORT is correct');
      console.error('   - Your firewall allows outbound SMTP connections');
    } else {
      console.error('\n⚠️  Please check your SMTP configuration in .env file');
    }

    console.error('\n');
    process.exit(1);
  }
}

testSMTP();
