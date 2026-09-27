import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger.util';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.EMAIL_SERVICE === 'smtp' && env.SMTP_HOST && env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      logger.info('📧 SMTP Email Transporter initialized');
    } else {
      logger.info('📧 Email service running in MOCK mode (emails will be logged to console)');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, name?: string): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const subject = 'Password Reset Request';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${name || 'there'},</p>
        <p>We received a request to reset your password. Click the button below to reset it. This link is valid for ${env.PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES} minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
        <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 10px;">Token: <code>${resetToken}</code></p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to: email,
          subject,
          html,
        });
        logger.info(`📧 Password reset email sent to: ${email}`);
      } catch (error) {
        logger.error(`❌ Failed to send reset email to ${email}`, error);
        throw error;
      }
    } else {
      // Mock mode: log reset details to console
      logger.info('================= [MOCK EMAIL: PASSWORD RESET] =================');
      logger.info(`To: ${email}`);
      logger.info(`Subject: ${subject}`);
      logger.info(`Reset URL: ${resetUrl}`);
      logger.info(`Raw Token: ${resetToken}`);
      logger.info('================================================================');
    }
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    const subject = 'Welcome to Our Service!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Welcome ${name || 'User'}!</h2>
        <p>Your account has been created successfully.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to: email,
          subject,
          html,
        });
      } catch (error) {
        logger.error(`❌ Failed to send welcome email to ${email}`, error);
      }
    } else {
      logger.info(`📧 [MOCK EMAIL: WELCOME] Sent to: ${email}`);
    }
  }
}

export const emailService = new EmailService();
