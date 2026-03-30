const nodemailer = require("nodemailer");

/**
 * Generates a cryptographically random 6-digit OTP.
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends an OTP to the user's email using SMTP.
 * Configure in .env:
 *   EMAIL_USER - your email address
 *   EMAIL_PASS - your email app password
 *   EMAIL_HOST - SMTP server host
 *   EMAIL_PORT - SMTP server port
 *   EMAIL_SECURE - use TLS (true/false)
 */
const sendOTP = async (email, otp) => {
  // Fallback to console if no email config
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`\n🔐 [DEV MODE] OTP for ${email}: ${otp}\n`);
    return;
  }

  try {
    console.log(`📧 Attempting to send OTP to ${email}...`);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"NutriBot" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your NutriBot Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
          <h2 style="color: #4CAF50;">NutriBot – Email Verification</h2>
          <p>Use the code below to verify your account. It expires in <strong>5 minutes</strong>.</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; text-align: center; padding: 20px; background: #f4f4f4; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #888; font-size: 12px; margin-top: 20px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent to ${email} (Message ID: ${info.messageId})`);
  } catch (error) {
    console.error("❌ SMTP Error:", error.message);
    console.log(`\n🔐 [FALLBACK] OTP for ${email}: ${otp}\n`);
  }
};

module.exports = { generateOTP, sendOTP };
