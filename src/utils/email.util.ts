/* =========================================================
   EMAIL UTILITY — Gmail SMTP (nodemailer)

   OTP email bhejne ke liye. Agar .env me GMAIL_USER
   aur GMAIL_APP_PASSWORD set nahi hain, to yeh
   function false return karta hai — caller (auth
   service) tab OTP ko dev-mode fallback me dikha
   deta hai, taaki bina email setup ke bhi testing
   chal sake.

   Real email bhejne ke liye .env me:
     GMAIL_USER=youraddress@gmail.com
     GMAIL_APP_PASSWORD=16-character-app-password

   (App Password kaise banayein, README ya .env.example
   me instructions hain.)
========================================================= */

// @ts-ignore — nodemailer ke types "npm install" karte hi resolve ho jayenge
import nodemailer from 'nodemailer';

let cachedTransporter: any = null;

function getTransporter(): any | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter =
      nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass,
        },
      });
  }

  return cachedTransporter;
}

/**
 * OTP email bhejta hai. Agar Gmail configure nahi
 * hai to `false` return karta hai (email nahi bheja
 * gaya) — throw nahi karta, taaki forgot-password
 * flow bina email setup ke bhi kaam kare (dev OTP
 * fallback ke through).
 */
export async function sendOtpEmail(
  to: string,
  otp: string
): Promise<boolean> {

  const transporter =
    getTransporter();

  if (!transporter) {
    return false;
  }

  const fromAddress =
    process.env.GMAIL_USER;

  await transporter.sendMail({
    from: `"2Star Staffing" <${fromAddress}>`,
    to,
    subject:
      'Your Password Reset OTP — 2Star Staffing',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color:#1E2761; margin-bottom: 4px;">2Star Staffing</h2>
        <p style="color:#4b5563; margin-top: 0;">Payroll Dashboard — Password Reset</p>
        <p style="color:#111827;">You requested to reset your password. Use the OTP below to continue:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color:#1E2761; text-align: center; margin: 24px 0;">${otp}</p>
        <p style="color:#6b7280; font-size: 13px;">This OTP is valid for 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return true;
}
