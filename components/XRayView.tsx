import React, { useState } from 'react';
import { XRayProfile } from '../types';
import { XRAY_QUESTIONS } from '../constants';
import { Button } from './ui/Button';
import { VerificationBadges } from './VerificationBadges';
import { ShareCard } from './ShareCard';

interface Props {
  data: XRayProfile;
  onBack: () => void;
}

export const XRayView: React.FC<Props> = ({ data, onBack }) => {
  const [showShareCard, setShowShareCard] = useState(false);

  // Parse the formatted track record string for better display
  // Format: "Deals: X | Exits: Y | Distributions: Z"
  const trackParts = data.trackRecord.split('|').map(s => s.trim());

  // Extract highlights for sharing
  const highlights = [
    `${trackParts[0]?.split(':')[1]?.trim() || 'Multiple'} completed`,
    `${trackParts[1]?.split(':')[1]?.trim() || 'Full cycle'} experience`,
    data.verificationData?.verified ? 'Verified by Explorium' : 'Profile created'
  ];

  return (
    <>
      {showShareCard && (
        <ShareCard
          type="xray"
          data={{
            title: 'Sponsor X-Ray',
            sponsorName: data.sponsorName,
            highlights
          }}
          onClose={() => setShowShareCard(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main X-Ray Profile */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-2xl rounded-xl overflow-hidden border border-slate-200 print:shadow-none">
              {/* Header */}
              <div className="bg-slate-900 text-white p-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-4xl font-bold mb-2">SPONSOR X-RAY</h1>
                    <p className="text-slate-400 uppercase tracking-widest text-sm font-semibold">
                      Operational Reality Check
                    </p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-bold">{data.sponsorName}</h2>
                    <p className="text-slate-400 text-sm">Generated: {new Date(data.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Track Record High Level */}
              <div className="bg-slate-50 p-8 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Track Record Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {trackParts.map((part, i) => {
                    const [label, val] = part.includes(':') ? part.split(':') : ['Info', part];
                    return (
                      <div key={i} className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-1">{label}</div>
                        <div className="text-lg font-bold text-slate-800">{val}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 grid gap-8">
                {XRAY_QUESTIONS.map((q) => (
                  <div key={q.id} className="border-b border-slate-100 pb-6 last:border-0">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">
                      {q.category}
                    </h3>
                    <p className="text-xl font-semibold text-slate-900 mb-3">
                      {q.text}
                    </p>
                    <div className="bg-slate-50 p-6 rounded-lg border-l-4 border-slate-300 italic text-slate-700 whitespace-pre-wrap">
                      "{data.answers[q.id]}"
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-8 border-t border-slate-200 text-center">
                <p className="text-slate-500 text-sm mb-4">
                  This document represents a self-declared operational profile.
                  Use this to facilitate a "hard questions" conversation before partnering.
                </p>
                <div className="print:hidden flex gap-3 justify-center">
                  <Button onClick={() => window.print()} variant="secondary">
                    📄 Print / Save PDF
                  </Button>
                  <Button onClick={() => setShowShareCard(true)} variant="secondary">
                    🔗 Share
                  </Button>
                  <Button onClick={onBack}>
                    Create Another
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <VerificationBadges
              companyData={data.verificationData?.companyData}
              verificationScore={data.verificationData?.confidence}
            />
          </div>
        </div>
      </div>
    </>
  );
};