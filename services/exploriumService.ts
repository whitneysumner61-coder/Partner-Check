/**
 * Explorium Integration Service
 * Provides company data enrichment and verification
 */

export interface CompanyData {
  name: string;
  verified: boolean;
  financials?: {
    revenue?: string;
    aum?: string;
    fundingRounds?: number;
  };
  executives?: Array<{
    name: string;
    title: string;
  }>;
  litigation?: Array<{
    case: string;
    status: 'active' | 'resolved';
    year: number;
  }>;
  reputation?: {
    score: number; // 0-100
    signals: string[];
  };
  realEstate?: {
    dealsCompleted?: number;
    totalAUM?: string;
    markets?: string[];
    avgDealSize?: string;
  };
}

export interface VerificationResult {
  verified: boolean;
  confidence: number; // 0-100
  flags: Array<{
    type: 'warning' | 'error' | 'success';
    message: string;
  }>;
  enrichedData: Partial<CompanyData>;
}

class ExploriumService {
  private apiKey: string | null;
  private baseUrl = 'https://api.explorium.ai/v1'; // Placeholder URL

  constructor() {
    this.apiKey = process.env.EXPLORIUM_API_KEY || null;
  }

  /**
   * Verify a company's track record against public data
   */
  async verifyCompany(
    companyName: string,
    claimedData: {
      trackRecord?: string;
      aum?: string;
      deals?: number;
    }
  ): Promise<VerificationResult> {
    // Mock implementation - In production, this would call Explorium API
    if (!this.apiKey) {
      return this.mockVerification(companyName, claimedData);
    }

    try {
      // Production implementation would be:
      // const response = await fetch(`${this.baseUrl}/company/verify`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ companyName, claimedData })
      // });
      // return await response.json();

      return this.mockVerification(companyName, claimedData);
    } catch (error) {
      console.error('Explorium verification error:', error);
      return {
        verified: false,
        confidence: 0,
        flags: [{ type: 'error', message: 'Verification service unavailable' }],
        enrichedData: {}
      };
    }
  }

  /**
   * Enrich company profile with external data
   */
  async enrichCompanyProfile(companyName: string): Promise<CompanyData | null> {
    if (!this.apiKey) {
      return this.mockEnrichment(companyName);
    }

    try {
      // Production implementation
      return this.mockEnrichment(companyName);
    } catch (error) {
      console.error('Explorium enrichment error:', error);
      return null;
    }
  }

  /**
   * Find similar companies for partner matching
   */
  async findSimilarCompanies(criteria: {
    industry?: string;
    aumRange?: [number, number];
    markets?: string[];
    dealSize?: string;
  }): Promise<CompanyData[]> {
    // Mock implementation
    return this.mockSimilarCompanies(criteria);
  }

  /**
   * Get market intelligence for syndication trends
   */
  async getMarketIntelligence(sector: string = 'real-estate-syndication'): Promise<{
    trends: string[];
    avgAlignmentScore: number;
    commonConflicts: string[];
    successRate: number;
  }> {
    // Mock data for development
    return {
      trends: [
        'Increased focus on cash reserves over distributions',
        'More GP/LP partnerships requiring mutual consent on exits',
        'Rising demand for monthly reporting transparency'
      ],
      avgAlignmentScore: 72,
      commonConflicts: [
        'Capital call vs GP loan preferences',
        'Distribution timing disagreements',
        'Decision rights on unbudgeted expenses'
      ],
      successRate: 68
    };
  }

  // Mock implementations for development
  private mockVerification(
    companyName: string,
    claimedData: any
  ): VerificationResult {
    const hasData = Math.random() > 0.3;
    const confidence = hasData ? Math.floor(Math.random() * 30) + 70 : 50;

    const flags: Array<{ type: 'warning' | 'error' | 'success'; message: string }> = [];

    if (hasData) {
      flags.push({
        type: 'success',
        message: `${companyName} verified in public records`
      });

      if (Math.random() > 0.7) {
        flags.push({
          type: 'warning',
          message: 'Claimed AUM differs from public records by 15%'
        });
      }
    } else {
      flags.push({
        type: 'warning',
        message: 'Limited public data available for verification'
      });
    }

    return {
      verified: hasData && confidence > 60,
      confidence,
      flags,
      enrichedData: hasData ? {
        name: companyName,
        verified: true,
        financials: {
          aum: claimedData.aum || '$25M - $50M',
          fundingRounds: 2
        },
        realEstate: {
          dealsCompleted: claimedData.deals || 12,
          totalAUM: claimedData.aum,
          markets: ['Austin, TX', 'Phoenix, AZ'],
          avgDealSize: '$2M - $5M'
        },
        reputation: {
          score: confidence,
          signals: ['Active SEC filings', 'No recent litigation', 'Positive LP reviews']
        }
      } : {}
    };
  }

  private mockEnrichment(companyName: string): CompanyData {
    return {
      name: companyName,
      verified: true,
      financials: {
        revenue: '$5M - $10M',
        aum: '$45M',
        fundingRounds: 1
      },
      executives: [
        { name: 'John Smith', title: 'Managing Partner' },
        { name: 'Jane Doe', title: 'Head of Operations' }
      ],
      litigation: [
        { case: 'Contract dispute (resolved)', status: 'resolved', year: 2022 }
      ],
      reputation: {
        score: 82,
        signals: [
          'Active SEC Form D filings',
          'No material adverse events',
          '8 successful exits in past 5 years',
          'Average LP retention: 85%'
        ]
      },
      realEstate: {
        dealsCompleted: 15,
        totalAUM: '$45M',
        markets: ['Austin, TX', 'Phoenix, AZ', 'Tampa, FL'],
        avgDealSize: '$3M'
      }
    };
  }

  private mockSimilarCompanies(criteria: any): CompanyData[] {
    return [
      {
        name: 'Meridian Capital Partners',
        verified: true,
        realEstate: {
          dealsCompleted: 18,
          totalAUM: '$52M',
          markets: ['Austin, TX', 'Dallas, TX'],
          avgDealSize: '$3.5M'
        },
        reputation: {
          score: 78,
          signals: ['Strong operational track record']
        }
      },
      {
        name: 'Horizon Real Estate Ventures',
        verified: true,
        realEstate: {
          dealsCompleted: 12,
          totalAUM: '$38M',
          markets: ['Phoenix, AZ', 'Las Vegas, NV'],
          avgDealSize: '$2.8M'
        },
        reputation: {
          score: 85,
          signals: ['Excellent LP communication']
        }
      }
    ];
  }
}

export const exploriumService = new ExploriumService();
