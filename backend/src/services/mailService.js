/**
 * CredenceOS - Zero-Cost Transactional Email Service
 * Supports:
 * 1. Standard Free SMTP (Gmail App Password, Brevo, SendGrid, Mailtrap, etc.) via env variables.
 * 2. Automatic Ethereal fallback for local dev / testing if no SMTP credentials are provided.
 * 3. Terminal OTP logging for seamless local testing without third-party dependencies.
 */

const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    // Standard Production or Free Gmail/Custom SMTP
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587', 10),
      secure: SMTP_SECURE === 'true' || SMTP_PORT === '465',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    console.log(`📧 MailService: Connected to SMTP server (${SMTP_HOST})`);
  } else {
    // Free local testing mode: Create on-the-fly Ethereal test account or console fallback
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`📧 MailService: Configured free Ethereal test inbox (${testAccount.user})`);
    } catch (err) {
      // Fallback transporter that generates dummy output if network fails
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows'
      });
      console.log('📧 MailService: Fallback stream transporter active');
    }
  }

  return transporter;
}

/**
 * Send 6-digit Email Verification OTP
 */
async function sendVerificationOTP(email, otp, userName = 'Borrower') {
  const mailer = await getTransporter();
  const fromAddress = process.env.EMAIL_FROM || '"CredenceOS Security" <security@credenceos.io>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; margin: 0; padding: 20px; }
        .card { max-width: 500px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .logo { font-size: 20px; font-weight: 800; color: #1E293B; letter-spacing: -0.5px; margin-bottom: 24px; display: inline-block; }
        .logo span { color: #2563EB; }
        .title { font-size: 20px; font-weight: 700; color: #0F172A; margin-bottom: 12px; }
        .text { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: #EFF6FF; border: 2px dashed #3B82F6; border-radius: 8px; text-align: center; padding: 18px; margin-bottom: 24px; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1D4ED8; font-family: 'Courier New', monospace; }
        .footer { font-size: 12px; color: #94A3B8; text-align: center; border-top: 1px solid #F1F5F9; padding-top: 16px; }
        .badge { display: inline-block; background: #DBEAFE; color: #1E40AF; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">Credence<span>OS</span></div>
        <div class="badge">SECURE IDENTITY VERIFICATION</div>
        <div class="title">Verify Your Email Address</div>
        <p class="text">Hello <strong>${userName}</strong>,<br>Thank you for registering with CredenceOS NBFC Portal. To verify your email address and activate your account, please enter the one-time verification code below:</p>
        
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>

        <p class="text" style="font-size: 13px; color: #64748B;">
          ⏱️ This code is valid for <strong>10 minutes</strong>.<br>
          🔒 If you did not create a CredenceOS account, you can safely ignore this email.
        </p>

        <div class="footer">
          CredenceOS Core Banking &amp; Lending Platform &bull; Automated Security Dispatch
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: `Your CredenceOS Verification Code is ${otp}`,
    text: `Hello ${userName},\n\nYour CredenceOS verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nCredenceOS Security`,
    html: htmlContent
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`\n======================================================`);
    console.log(`🔐 [EMAIL VERIFICATION OTP]`);
    console.log(`   Recipient: ${email}`);
    console.log(`   OTP Code:  ${otp}`);
    if (previewUrl) {
      console.log(`   Preview:   ${previewUrl}`);
    }
    console.log(`======================================================\n`);

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error('MailService send error:', error.message);
    // Still log OTP to console as fallback so the user is never stuck
    console.log(`\n======================================================`);
    console.log(`🔐 [EMAIL VERIFICATION OTP (FALLBACK LOG)]`);
    console.log(`   Recipient: ${email}`);
    console.log(`   OTP Code:  ${otp}`);
    console.log(`======================================================\n`);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendVerificationOTP,
  getTransporter
};
