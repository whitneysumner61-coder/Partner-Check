/**
 * Email Notification Service
 * Handles sending X-Ray profiles and Pre-Nup results via email
 */

export interface EmailData {
  to: string;
  subject: string;
  type: 'xray' | 'prenup';
  data: {
    sponsorName?: string;
    partnerNames?: string[];
    score?: number;
    reportUrl?: string;
  };
}

class EmailService {
  private apiKey: string | null;
  private apiEndpoint = '/api/send-email'; // Placeholder - would be real API in production

  constructor() {
    this.apiKey = process.env.EMAIL_API_KEY || null;
  }

  /**
   * Send X-Ray profile via email
   */
  async sendXRayProfile(
    recipientEmail: string,
    sponsorName: string,
    profileUrl: string
  ): Promise<{ success: boolean; message: string }> {
    if (!this.apiKey) {
      console.log('[Mock] Sending X-Ray profile email to:', recipientEmail);
      return {
        success: true,
        message: 'Email service not configured. In production, email would be sent.'
      };
    }

    try {
      // In production, this would call a real email API (SendGrid, Mailgun, etc.)
      const emailData = {
        to: recipientEmail,
        subject: `${sponsorName} - Sponsor X-Ray Profile`,
        html: this.generateXRayEmailTemplate(sponsorName, profileUrl),
        from: 'noreply@partnercheck.com'
      };

      // Mock successful send
      return {
        success: true,
        message: `X-Ray profile sent to ${recipientEmail}`
      };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        message: 'Failed to send email'
      };
    }
  }

  /**
   * Send Pre-Nup alignment results via email
   */
  async sendPreNupResults(
    recipients: string[],
    partnerNames: string[],
    alignmentScore: number,
    reportUrl: string
  ): Promise<{ success: boolean; message: string }> {
    if (!this.apiKey) {
      console.log('[Mock] Sending Pre-Nup results to:', recipients);
      return {
        success: true,
        message: 'Email service not configured. In production, emails would be sent.'
      };
    }

    try {
      // Send to both partners
      const emailPromises = recipients.map(email => {
        const emailData = {
          to: email,
          subject: `Partnership Alignment Results: ${partnerNames.join(' & ')}`,
          html: this.generatePreNupEmailTemplate(partnerNames, alignmentScore, reportUrl),
          from: 'noreply@partnercheck.com'
        };

        return Promise.resolve({ success: true });
      });

      await Promise.all(emailPromises);

      return {
        success: true,
        message: `Alignment results sent to ${recipients.length} recipient(s)`
      };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        message: 'Failed to send emails'
      };
    }
  }

  /**
   * Send invitation to complete Pre-Nup
   */
  async sendPreNupInvitation(
    recipientEmail: string,
    inviterName: string,
    preNupUrl: string
  ): Promise<{ success: boolean; message: string }> {
    console.log(`[Mock] Sending Pre-Nup invitation from ${inviterName} to ${recipientEmail}`);

    return {
      success: true,
      message: `Invitation sent to ${recipientEmail}`
    };
  }

  // Email template generators
  private generateXRayEmailTemplate(sponsorName: string, profileUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e293b; color: white; padding: 30px; text-align: center; }
          .content { background: #f8fafc; padding: 30px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PartnerCheck</h1>
            <p>Sponsor X-Ray Profile</p>
          </div>
          <div class="content">
            <h2>New Sponsor X-Ray: ${sponsorName}</h2>
            <p>${sponsorName} has completed their Sponsor X-Ray profile on PartnerCheck.</p>
            <p>This operational profile provides honest answers to hard questions about their track record, communication style, and decision-making under pressure.</p>
            <a href="${profileUrl}" class="button">View Full Profile</a>
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #cbd5e1;">
              <strong>What is a Sponsor X-Ray?</strong><br>
              A brutally honest operational profile that reveals how sponsors handle adversity, communicate during bad quarters, and make tough decisions. It's designed to build trust through transparency.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} PartnerCheck. Built for Syndicators, by Syndicators.</p>
            <p>This email was sent because someone shared a Sponsor X-Ray profile with you.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePreNupEmailTemplate(partnerNames: string[], score: number, reportUrl: string): string {
    const status = score > 75 ? 'Highly Aligned' : score > 60 ? 'Work Required' : 'Critical Issues';
    const statusColor = score > 75 ? '#22c55e' : score > 60 ? '#eab308' : '#ef4444';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e293b; color: white; padding: 30px; text-align: center; }
          .score-card { background: white; padding: 30px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .score { font-size: 64px; font-weight: bold; color: ${statusColor}; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PartnerCheck</h1>
            <p>JV Pre-Nup Alignment Results</p>
          </div>
          <div class="score-card">
            <h2>${partnerNames.join(' & ')}</h2>
            <div class="score">${score}%</div>
            <p style="color: ${statusColor}; font-weight: bold; font-size: 20px;">${status}</p>
          </div>
          <div style="padding: 20px; background: #f8fafc;">
            <p>Your partnership alignment analysis is complete!</p>
            <p>We analyzed your responses across key operational, financial, and ethical questions to identify potential conflicts before you sign legal documents.</p>
            <a href="${reportUrl}" class="button">View Full Report</a>
            ${score > 75 ?
              '<p style="color: #22c55e; font-weight: bold;">✓ You are well aligned. Proceed to legal drafting, but discuss any yellow items before signing.</p>' :
              score > 60 ?
              '<p style="color: #eab308; font-weight: bold;">⚠ Operational differences detected. Schedule a "hard questions" discussion before proceeding.</p>' :
              '<p style="color: #ef4444; font-weight: bold;">🚨 STOP. Fundamental misalignment detected. Do not proceed without a complete reset.</p>'
            }
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} PartnerCheck. Built for Syndicators, by Syndicators.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
