import nodemailer from 'nodemailer';
import { config } from '../config';

// Email template types
type EmailTemplate = 'received' | 'in-progress' | 'completed' | 'failed' | 'payment-failed';

// Email data interface
interface EmailData {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

/**
 * Get email transport configuration based on environment settings
 */
function getTransport() {
  // Use SMTP configuration from settings/environment
  return nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465, // true for port 465, false for other ports
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASSWORD,
    },
  });
}

/**
 * Generate HTML email content based on template and data
 */
function getEmailContent(template: EmailTemplate, data: Record<string, any>): string {
  // Common header and footer for all emails
  const header = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>ContentCraft</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #6366f1; padding: 20px; text-align: center; color: white; border-radius: 5px 5px 0 0; }
        .content { background-color: #ffffff; padding: 20px; border-radius: 0 0 5px 5px; border: 1px solid #e2e8f0; border-top: none; }
        .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #64748b; }
        .button { display: inline-block; background-color: #6366f1; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 15px; }
        h1 { margin-top: 0; }
        p { margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ContentCraft</h1>
        </div>
        <div class="content">
  `;

  const footer = `
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ContentCraft. All rights reserved.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Template-specific content
  let content = '';

  switch (template) {
    case 'received':
      content = `
        <h2>Thank You for Your Order</h2>
        <p>We've received your order for content on "${data.topic}".</p>
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Order ID: #${data.orderId}</li>
          <li>Topic: ${data.topic}</li>
          <li>Word Count: ${data.wordCount}</li>
          <li>Amount: $${data.amount}</li>
        </ul>
        <p>We'll begin generating your content right away. You'll receive another email when processing begins.</p>
      `;
      break;

    case 'in-progress':
      content = `
        <h2>Your Content is Being Generated</h2>
        <p>We're currently generating your content on "${data.topic}".</p>
        <p><strong>Order ID:</strong> #${data.orderId}</p>
        <p>This process typically takes 5-10 minutes to complete. We'll send you another email once your content is ready.</p>
      `;
      break;

    case 'completed':
      content = `
        <h2>Your Content is Ready!</h2>
        <p>We're pleased to inform you that your content on "${data.topic}" is now ready.</p>
        <p><strong>Order ID:</strong> #${data.orderId}</p>
        <p>Here's a preview of your content:</p>
        <p><em>${data.contentPreview}</em></p>
        <p>To view the full content, please click the button below:</p>
        <p><a href="${data.viewUrl}" class="button">View Your Content</a></p>
        <p>If the button doesn't work, copy and paste this URL into your browser: ${data.viewUrl}</p>
      `;
      break;

    case 'failed':
      content = `
        <h2>We're Sorry</h2>
        <p>We encountered an issue while generating your content on "${data.topic}".</p>
        <p><strong>Order ID:</strong> #${data.orderId}</p>
        <p><strong>Error:</strong> ${data.errorMessage}</p>
        <p>Our team has been notified and will investigate this issue. We'll contact you soon with more information.</p>
        <p>If you have any questions, please contact our support team and reference your order ID.</p>
      `;
      break;

    case 'payment-failed':
      content = `
        <h2>Payment Failed</h2>
        <p>We were unable to process your payment for the content on "${data.topic}".</p>
        <p><strong>Order ID:</strong> #${data.orderId}</p>
        <p><strong>Issue:</strong> ${data.errorMessage}</p>
        <p>Please check your payment details and try again, or contact your bank for more information.</p>
        <p>If you continue to experience issues, please contact our support team for assistance.</p>
      `;
      break;

    default:
      content = `<p>No content available for this template.</p>`;
  }

  return header + content + footer;
}

/**
 * Send an email using the configured transport
 */
export async function sendEmail(emailData: EmailData): Promise<void> {
  // Skip sending in development mode if SMTP is not configured
  if (process.env.NODE_ENV !== 'production' && 
      (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASSWORD)) {
    console.log('Email sending skipped in development mode (SMTP not configured)');
    console.log('Would have sent:', emailData);
    return;
  }

  try {
    const transport = getTransport();
    const mailOptions = {
      from: config.SMTP_SENDER,
      to: emailData.to,
      subject: emailData.subject,
      html: getEmailContent(emailData.template, emailData.data),
    };

    await transport.sendMail(mailOptions);
    console.log(`Email sent to ${emailData.to} - Template: ${emailData.template}`);
  } catch (error) {
    console.error('Error sending email:', error);
    // We don't want to throw here as email failures shouldn't break the application flow
    // But we log the error for debugging purposes
  }
}

/**
 * Test the email configuration by sending a test email
 */
export async function testEmailConfig(): Promise<{ success: boolean; message: string }> {
  try {
    const transport = getTransport();
    
    // Test the connection
    await transport.verify();
    
    return { success: true, message: 'Email configuration is valid' };
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error testing email configuration' 
    };
  }
}
