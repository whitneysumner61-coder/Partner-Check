import React, { useState } from 'react';
import { XRAY_QUESTIONS } from '../constants';
import { XRayProfile } from '../types';
import { Button } from './ui/Button';
import { exploriumService } from '../services/exploriumService';

interface Props {
  onComplete: (data: XRayProfile) => void;
  onCancel: () => void;
}

export const SponsorXRay: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Structured Track Record Fields
  const [trackDetails, setTrackDetails] = useState({
    deals: '',
    exits: '',
    distributions: ''
  });

  const handleChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    // Format the track record into a readable string
    const formattedTrackRecord = `Deals: ${trackDetails.deals} | Exits: ${trackDetails.exits} | Distributions: ${trackDetails.distributions}`;

    // Verify company data with Explorium
    const verificationResult = await exploriumService.verifyCompany(name, {
      trackRecord: formattedTrackRecord,
      deals: parseInt(trackDetails.deals) || 0
    });

    // Enrich with company data
    const companyData = await exploriumService.enrichCompanyProfile(name);

    onComplete({
      sponsorName: name,
      trackRecord: formattedTrackRecord,
      answers,
      createdAt: new Date().toISOString(),
      verificationData: {
        verified: verificationResult.verified,
        confidence: verificationResult.confidence,
        companyData: companyData
      }
    });

    setIsVerifying(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Sponsor X-Ray</h2>
        <p className="text-slate-600">
          Build a "No-BS" profile. These questions are designed to reveal how you handle 
          adversity, not how well you market your wins. Honesty here builds trust faster 
          than any pitch deck.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Sponsor / Firm Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="e.g. Acme Capital"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Total Deals (GP/Co-GP)
                </label>
                <input
                  type="text"
                  required
                  value={trackDetails.deals}
                  onChange={(e) => setTrackDetails({...trackDetails, deals: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md outline-none focus:border-primary"
                  placeholder="e.g. 12 deals ($150M AUM)"
                />
             </div>
             <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Full Cycle Exits / Refis
                </label>
                <input
                  type="text"
                  required
                  value={trackDetails.exits}
                  onChange={(e) => setTrackDetails({...trackDetails, exits: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md outline-none focus:border-primary"
                  placeholder="e.g. 4 exits, 2 refis"
                />
             </div>
             <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Distribution Status (Honest)
                </label>
                <input
                  type="text"
                  required
                  value={trackDetails.distributions}
                  onChange={(e) => setTrackDetails({...trackDetails, distributions: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-md outline-none focus:border-primary"
                  placeholder="e.g. All current, except Fund II which is paused."
                />
             </div>
          </div>
        </div>

        {XRAY_QUESTIONS.map((q, idx) => (
          <div key={q.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <label className="text-lg font-medium text-slate-900 block">
                {idx + 1}. {q.text}
              </label>
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded 
                ${q.category === 'behavior' ? 'bg-purple-100 text-purple-800' : 
                  q.category === 'ethics' ? 'bg-red-100 text-red-800' : 
                  'bg-blue-100 text-blue-800'}`}>
                {q.category}
              </span>
            </div>
            <textarea
              required
              rows={4}
              value={answers[q.id] || ''}
              onChange={(e) => handleChange(q.id, e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-700"
              placeholder={q.placeholder}
            />
          </div>
        ))}

        <div className="flex gap-4 pt-4">
          <Button type="button" variant="secondary" onClick={onCancel} className="w-1/3" disabled={isVerifying}>
            Cancel
          </Button>
          <Button type="submit" className="w-2/3" disabled={isVerifying}>
            {isVerifying ? 'Verifying Company Data...' : 'Generate X-Ray Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
};