/**
 * Analytics Service
 * Tracks user engagement, conversions, and feature usage
 */

export enum AnalyticsEvent {
  // User Journey
  PAGE_VIEW = 'page_view',
  XRAY_STARTED = 'xray_started',
  XRAY_COMPLETED = 'xray_completed',
  XRAY_SHARED = 'xray_shared',
  PRENUP_STARTED = 'prenup_started',
  PRENUP_COMPLETED = 'prenup_completed',
  PRENUP_SHARED = 'prenup_shared',

  // Verification
  VERIFICATION_SUCCESS = 'verification_success',
  VERIFICATION_FAILED = 'verification_failed',

  // Social
  SOCIAL_SHARE_LINKEDIN = 'social_share_linkedin',
  SOCIAL_SHARE_TWITTER = 'social_share_twitter',
  LINK_COPIED = 'link_copied',

  // Conversions
  PDF_DOWNLOADED = 'pdf_downloaded',
  EMAIL_SENT = 'email_sent',

  // Engagement
  ALIGNMENT_SCORE = 'alignment_score'
}

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  properties?: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

class AnalyticsService {
  private sessionId: string;
  private eventsQueue: AnalyticsEventData[] = [];
  private apiEndpoint = '/api/analytics'; // Placeholder

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  /**
   * Track a generic event
   */
  track(event: AnalyticsEvent, properties?: Record<string, any>): void {
    const eventData: AnalyticsEventData = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    };

    this.eventsQueue.push(eventData);

    // In development, just log
    console.log('[Analytics]', event, properties);

    // In production, send to analytics service (Mixpanel, Amplitude, etc.)
    this.sendToAnalytics(eventData);
  }

  /**
   * Track page view
   */
  trackPageView(page: string): void {
    this.track(AnalyticsEvent.PAGE_VIEW, { page });
  }

  /**
   * Track X-Ray creation
   */
  trackXRayCreated(data: {
    sponsorName: string;
    verified: boolean;
    confidence?: number;
  }): void {
    this.track(AnalyticsEvent.XRAY_COMPLETED, {
      sponsor: data.sponsorName,
      verified: data.verified,
      verificationConfidence: data.confidence
    });
  }

  /**
   * Track Pre-Nup completion
   */
  trackPreNupCompleted(data: {
    partners: string[];
    alignmentScore: number;
    lowAlignmentCount: number;
    mediumAlignmentCount: number;
  }): void {
    this.track(AnalyticsEvent.PRENUP_COMPLETED, {
      partnerCount: data.partners.length,
      alignmentScore: data.alignmentScore,
      lowAlignmentIssues: data.lowAlignmentCount,
      mediumAlignmentIssues: data.mediumAlignmentCount,
      recommendedAction: this.getRecommendation(data.alignmentScore)
    });

    // Also track alignment score separately for analytics
    this.track(AnalyticsEvent.ALIGNMENT_SCORE, {
      score: data.alignmentScore,
      category: this.getScoreCategory(data.alignmentScore)
    });
  }

  /**
   * Track social sharing
   */
  trackShare(platform: 'linkedin' | 'twitter' | 'link', type: 'xray' | 'prenup'): void {
    const event = platform === 'linkedin'
      ? AnalyticsEvent.SOCIAL_SHARE_LINKEDIN
      : platform === 'twitter'
      ? AnalyticsEvent.SOCIAL_SHARE_TWITTER
      : AnalyticsEvent.LINK_COPIED;

    this.track(event, { type });
  }

  /**
   * Track verification results
   */
  trackVerification(data: {
    success: boolean;
    confidence: number;
    companyName: string;
  }): void {
    this.track(
      data.success ? AnalyticsEvent.VERIFICATION_SUCCESS : AnalyticsEvent.VERIFICATION_FAILED,
      {
        company: data.companyName,
        confidence: data.confidence
      }
    );
  }

  /**
   * Track PDF download
   */
  trackPDFDownload(type: 'xray' | 'prenup'): void {
    this.track(AnalyticsEvent.PDF_DOWNLOADED, { type });
  }

  /**
   * Track email sent
   */
  trackEmailSent(type: 'xray' | 'prenup', recipientCount: number): void {
    this.track(AnalyticsEvent.EMAIL_SENT, {
      type,
      recipientCount
    });
  }

  /**
   * Get current session metrics
   */
  getSessionMetrics(): {
    sessionId: string;
    eventCount: number;
    events: AnalyticsEventData[];
  } {
    return {
      sessionId: this.sessionId,
      eventCount: this.eventsQueue.length,
      events: [...this.eventsQueue]
    };
  }

  /**
   * Export analytics data (for admin dashboard)
   */
  exportData(): string {
    return JSON.stringify(this.eventsQueue, null, 2);
  }

  // Private helper methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking(): void {
    // Track initial page load
    this.trackPageView('home');

    // In production, initialize third-party analytics (Google Analytics, Mixpanel, etc.)
    if (typeof window !== 'undefined') {
      // window.gtag?.('config', 'GA_MEASUREMENT_ID');
      // mixpanel.init('YOUR_TOKEN');
    }
  }

  private sendToAnalytics(eventData: AnalyticsEventData): void {
    // In production, send to analytics API
    // For now, we'll just store locally

    // Example production implementation:
    // fetch(this.apiEndpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(eventData)
    // });

    // Store in localStorage for development
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('partnercheck_analytics') || '[]';
        const events = JSON.parse(stored);
        events.push(eventData);
        localStorage.setItem('partnercheck_analytics', JSON.stringify(events));
      } catch (e) {
        console.error('Failed to store analytics:', e);
      }
    }
  }

  private getRecommendation(score: number): string {
    if (score > 80) return 'proceed';
    if (score > 60) return 'discuss_conflicts';
    return 'stop';
  }

  private getScoreCategory(score: number): string {
    if (score > 80) return 'high';
    if (score > 60) return 'medium';
    return 'low';
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

// Helper hook for React components
export const useAnalytics = () => {
  return {
    track: analyticsService.track.bind(analyticsService),
    trackPageView: analyticsService.trackPageView.bind(analyticsService),
    trackXRayCreated: analyticsService.trackXRayCreated.bind(analyticsService),
    trackPreNupCompleted: analyticsService.trackPreNupCompleted.bind(analyticsService),
    trackShare: analyticsService.trackShare.bind(analyticsService),
    trackVerification: analyticsService.trackVerification.bind(analyticsService),
    trackPDFDownload: analyticsService.trackPDFDownload.bind(analyticsService),
    trackEmailSent: analyticsService.trackEmailSent.bind(analyticsService)
  };
};
