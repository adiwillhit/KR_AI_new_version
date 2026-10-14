import nodemailer from 'nodemailer';
import { config } from '../config/config.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (config.email.host && config.email.user) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }
  return transporter;
}

export const emailService = {
  /**
   * Send meeting summary and action items to recipients.
   */
  async sendMeetingMinutes({ recipients, meetingTitle, date, summary, actionItems = [], decisions = [] }) {
    const transport = getTransporter();

    const actionListHtml = actionItems.length > 0
      ? actionItems.map((a) => `<li><strong>${a.owner || 'Unassigned'}</strong>: ${a.task} ${a.deadline ? `<em>(Due: ${a.deadline})</em>` : ''} [Priority: ${a.priority || 'medium'}]</li>`).join('')
      : '<li>No action items recorded.</li>';

    const decisionsHtml = decisions.length > 0
      ? decisions.map((d) => `<li>${d.text} ${d.madeBy ? `<em>(By ${d.madeBy})</em>` : ''}</li>`).join('')
      : '<li>No explicit decisions recorded.</li>';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Meeting Minutes: ${meetingTitle}</h2>
        <p><strong>Date:</strong> ${new Date(date).toLocaleString()}</p>
        
        <h3 style="color: #1e293b; margin-top: 20px;">Executive Summary</h3>
        <p style="background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #4f46e5;">
          ${summary || 'No summary available.'}
        </p>

        <h3 style="color: #1e293b; margin-top: 20px;">Decisions Made</h3>
        <ul>${decisionsHtml}</ul>

        <h3 style="color: #1e293b; margin-top: 20px;">Action Items</h3>
        <ul>${actionListHtml}</ul>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;" />
        <p style="font-size: 12px; color: #64748b;">
          Generated automatically by MeetMind AI Meeting Assistant.
        </p>
      </div>
    `;

    if (!transport) {
      console.log(`[EmailService] SMTP not configured. Simulated email dispatch to: ${recipients.join(', ')}`);
      return {
        sent: true,
        simulated: true,
        recipients,
        message: 'SMTP credentials not configured in .env. Email simulated successfully for local development.',
      };
    }

    try {
      const info = await transport.sendMail({
        from: config.email.from,
        to: recipients.join(', '),
        subject: `[Meeting Minutes] ${meetingTitle}`,
        html,
      });

      return { sent: true, simulated: false, messageId: info.messageId, recipients };
    } catch (err) {
      console.error('[EmailService] Failed to send email:', err.message);
      return {
        sent: false,
        simulated: false,
        error: err.message,
      };
    }
  },
};
