const nodemailer = require('nodemailer');

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];

const getMissingEnvVars = () => requiredEnv.filter((key) => !process.env[key]);
const isProduction = process.env.NODE_ENV === 'production';
const allowDevOtpFallback = String(process.env.ALLOW_DEV_OTP_FALLBACK || 'true') === 'true';

const getTransporter = () => {
  const missing = getMissingEnvVars();
  if (missing.length > 0) {
    if (!isProduction && allowDevOtpFallback) {
      return null;
    }
    throw new Error(`Missing SMTP configuration: ${missing.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendOtpEmail = async ({ to, name, otp, purpose }) => {
  let transporter = null;
  try {
    transporter = getTransporter();
  } catch (err) {
    if (!isProduction && allowDevOtpFallback) {
      console.log(
        `[DEV OTP FALLBACK] ${purpose === 'signup' ? 'account verification' : 'login verification'} for ${to} (${name || 'user'}) => OTP: ${otp}`
      );
      return;
    }
    throw err;
  }
  const purposeLabel = purpose === 'signup' ? 'account verification' : 'login verification';
  const codeLabel = purpose === 'signup' ? 'verification' : 'login';
  const title = purpose === 'signup' ? 'ResuAI Account Verification' : 'ResuAI Login Verification';
  const subject = purpose === 'signup' ? 'Verify your ResuAI email' : 'Your ResuAI login OTP';

  if (!transporter) {
    console.log(
      `[DEV OTP FALLBACK] ${purposeLabel} for ${to} (${name || 'user'}) => OTP: ${otp}`
    );
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text: `Hi ${name || 'there'}, your one-time ${purposeLabel} code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>${title}</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Your one-time ${codeLabel} code is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

const sendLoginOtpEmail = (payload) => sendOtpEmail({ ...payload, purpose: 'login' });
const sendSignupOtpEmail = (payload) => sendOtpEmail({ ...payload, purpose: 'signup' });

module.exports = { sendLoginOtpEmail, sendSignupOtpEmail };
