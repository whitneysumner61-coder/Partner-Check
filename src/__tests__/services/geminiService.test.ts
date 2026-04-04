import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlignmentStatus } from '../../types';

// Mock the Google GenAI module
const mockGenerateContent = vi.fn();

class MockGoogleGenAI {
  models = {
    generateContent: mockGenerateContent,
  };
  constructor(_opts: any) {}
}

vi.mock('@google/genai', () => ({
  GoogleGenAI: MockGoogleGenAI,
  Type: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    INTEGER: 'INTEGER',
  },
}));

// We need to control import.meta.env
// The module reads VITE_GEMINI_API_KEY at call time via createClient()
let analyzeAlignment: typeof import('../../services/geminiService').analyzeAlignment;

describe('geminiService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('analyzeAlignment', () => {
    it('returns mock response when API key is missing', async () => {
      // Mock import.meta.env with no API key
      vi.stubEnv('VITE_GEMINI_API_KEY', '');

      const mod = await import('../../services/geminiService');
      const result = await mod.analyzeAlignment('Question?', 'Answer A', 'Answer B');

      expect(result.status).toBe(AlignmentStatus.PENDING);
      expect(result.score).toBe(50);
      expect(result.summary).toContain('API Key Missing');
    });

    it('returns parsed response on successful API call', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

      mockGenerateContent.mockResolvedValue({
        text: JSON.stringify({
          status: 'HIGH',
          score: 85,
          summary: 'Partners are aligned on capital management',
        }),
      });

      const mod = await import('../../services/geminiService');
      const result = await mod.analyzeAlignment(
        'How do you handle CapEx overruns?',
        'Capital call to LPs',
        'Capital call with GP co-invest'
      );

      expect(result.status).toBe('HIGH');
      expect(result.score).toBe(85);
      expect(result.summary).toBe('Partners are aligned on capital management');
      expect(result.questionId).toBe(''); // Set by caller
    });

    it('returns fallback on API error', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

      mockGenerateContent.mockRejectedValue(new Error('API rate limit'));

      const mod = await import('../../services/geminiService');
      const result = await mod.analyzeAlignment('Q', 'A', 'B');

      expect(result.status).toBe(AlignmentStatus.MEDIUM);
      expect(result.score).toBe(50);
      expect(result.summary).toContain('Error');
    });

    it('handles empty/malformed API response gracefully', async () => {
      vi.stubEnv('VITE_GEMINI_API_KEY', 'test-api-key');

      // Empty text falls back to '{}' via the || operator, resulting in parsed empty object
      mockGenerateContent.mockResolvedValue({
        text: null,
      });

      const mod = await import('../../services/geminiService');
      const result = await mod.analyzeAlignment('Q', 'A', 'B');

      // JSON.parse('{}') succeeds, result has undefined fields from empty object
      expect(result.questionId).toBe('');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('score');
    });
  });
});
