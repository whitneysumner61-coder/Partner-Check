import React from 'react';
import { CompanyData } from '../services/exploriumService';

interface VerificationBadgesProps {
  companyData: CompanyData | null;
  verificationScore?: number;
  compact?: boolean;
}

export const VerificationBadges: React.FC<VerificationBadgesProps> = ({
  companyData,
  verificationScore = 0,
  compact = false
}) => {
  if (!companyData) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span>⚠️</span>
          <span>Verification pending - No external data available</span>
        </div>
      </div>
    );
  }

  const getTrustLevel = (score: number) => {
    if (score >= 80) return { level: 'High', color: 'green', emoji: '✅' };
    if (score >= 60) return { level: 'Medium', color: 'yellow', emoji: '⚠️' };
    return { level: 'Low', color: 'red', emoji: '🚨' };
  };

  const trust = getTrustLevel(companyData.reputation?.score || verificationScore);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {companyData.verified && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
            ✅ Verified
          </span>
        )}
        <span className={`inline-flex items-center gap-1 px-2 py-1 bg-${trust.color}-100 text-${trust.color}-800 text-xs font-semibold rounded`}>
          {trust.emoji} {trust.level} Trust
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span>🔍</span>
          <span>Data Verification Report</span>
        </h3>
      </div>

      {/* Trust Score */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-bold text-slate-500 uppercase mb-1">Trust Score</div>
            <div className="flex items-center gap-3">
              <span className={`text-4xl font-black text-${trust.color}-600`}>
                {companyData.reputation?.score || verificationScore}
              </span>
              <span className={`px-3 py-1 bg-${trust.color}-100 text-${trust.color}-800 font-bold rounded text-sm`}>
                {trust.level}
              </span>
            </div>
          </div>
          {companyData.verified && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mb-2">
                ✅
              </div>
              <div className="text-xs font-bold text-green-700">VERIFIED</div>
            </div>
          )}
        </div>

        {/* Reputation Signals */}
        {companyData.reputation?.signals && (
          <div className="space-y-2">
            {companyData.reputation.signals.map((signal, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-green-500 mt-0.5">✓</span>
                <span className="text-slate-700">{signal}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real Estate Data */}
      {companyData.realEstate && (
        <div className="p-6 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Track Record</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400 uppercase mb-1">Deals Completed</div>
              <div className="text-2xl font-bold text-slate-900">
                {companyData.realEstate.dealsCompleted || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase mb-1">Total AUM</div>
              <div className="text-2xl font-bold text-slate-900">
                {companyData.realEstate.totalAUM || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase mb-1">Avg Deal Size</div>
              <div className="text-lg font-bold text-slate-900">
                {companyData.realEstate.avgDealSize || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase mb-1">Active Markets</div>
              <div className="text-sm font-semibold text-slate-900">
                {companyData.realEstate.markets?.length || 0}
              </div>
            </div>
          </div>
          {companyData.realEstate.markets && companyData.realEstate.markets.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-400 uppercase mb-2">Markets</div>
              <div className="flex flex-wrap gap-2">
                {companyData.realEstate.markets.map((market, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded"
                  >
                    {market}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Litigation */}
      {companyData.litigation && companyData.litigation.length > 0 && (
        <div className="p-6 border-b border-slate-200">
          <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Legal History</h4>
          <div className="space-y-3">
            {companyData.litigation.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded">
                <span className={item.status === 'resolved' ? 'text-green-500' : 'text-yellow-500'}>
                  {item.status === 'resolved' ? '✓' : '⚠️'}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">{item.case}</div>
                  <div className="text-xs text-slate-500">
                    {item.status === 'resolved' ? 'Resolved' : 'Active'} • {item.year}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executives */}
      {companyData.executives && companyData.executives.length > 0 && (
        <div className="p-6">
          <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Leadership</h4>
          <div className="space-y-2">
            {companyData.executives.map((exec, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                  {exec.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{exec.name}</div>
                  <div className="text-xs text-slate-500">{exec.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 text-xs text-slate-500 text-center">
        Data sourced from Explorium & public records • Updated {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};
