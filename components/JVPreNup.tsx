import React, { useState } from 'react';
import { PRENUP_QUESTIONS } from '../constants';
import { PreNupData } from '../types';
import { Button } from './ui/Button';

interface Props {
  onAnalyze: (data: PreNupData) => void;
  onCancel: () => void;
}

export const JVPreNup: React.FC<Props> = ({ onAnalyze, onCancel }) => {
  const [partnerA, setPartnerA] = useState({ name: 'Partner A', answers: {} as Record<string, string> });
  const [partnerB, setPartnerB] = useState({ name: 'Partner B', answers: {} as Record<string, string> });

  // Helper to update state
  const handleAnswer = (partner: 'A' | 'B', qId: string, val: string) => {
    if (partner === 'A') {
      setPartnerA(prev => ({ ...prev, answers: { ...prev.answers, [qId]: val } }));
    } else {
      setPartnerB(prev => ({ ...prev, answers: { ...prev.answers, [qId]: val } }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze({ partnerA, partnerB });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">JV Pre-Nup</h2>
        <p className="text-slate-600">
          Misalignment Detector. Both partners answer separately (simulated here side-by-side). 
          We flag conflicts before you sign legal docs.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Header Inputs */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Proposed Role: Sponsor / Lead</label>
            <input 
              className="w-full bg-transparent border-b border-blue-300 focus:border-blue-600 outline-none text-lg font-bold text-blue-900"
              value={partnerA.name}
              onChange={(e) => setPartnerA({...partnerA, name: e.target.value})}
            />
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <label className="block text-xs font-bold text-emerald-800 uppercase mb-1">Proposed Role: Capital / Co-GP</label>
            <input 
              className="w-full bg-transparent border-b border-emerald-300 focus:border-emerald-600 outline-none text-lg font-bold text-emerald-900"
              value={partnerB.name}
              onChange={(e) => setPartnerB({...partnerB, name: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-12">
          {PRENUP_QUESTIONS.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800">
                  {idx + 1}. {q.text}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {/* Partner A Input */}
                <div className="p-6">
                  <div className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">{partnerA.name}'s Answer</div>
                  {q.type === 'select' ? (
                     <select 
                      className="w-full p-2 border border-slate-300 rounded"
                      value={partnerA.answers[q.id] || ''}
                      onChange={(e) => handleAnswer('A', q.id, e.target.value)}
                      required
                     >
                       <option value="">Select option...</option>
                       {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     </select>
                  ) : (
                    <textarea 
                      className="w-full p-3 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                      rows={3}
                      placeholder={q.placeholder}
                      value={partnerA.answers[q.id] || ''}
                      onChange={(e) => handleAnswer('A', q.id, e.target.value)}
                      required
                    />
                  )}
                </div>

                {/* Partner B Input */}
                <div className="p-6">
                  <div className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wide">{partnerB.name}'s Answer</div>
                  {q.type === 'select' ? (
                     <select 
                      className="w-full p-2 border border-slate-300 rounded"
                      value={partnerB.answers[q.id] || ''}
                      onChange={(e) => handleAnswer('B', q.id, e.target.value)}
                      required
                     >
                       <option value="">Select option...</option>
                       {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     </select>
                  ) : (
                    <textarea 
                      className="w-full p-3 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                      rows={3}
                      placeholder={q.placeholder}
                      value={partnerB.answers[q.id] || ''}
                      onChange={(e) => handleAnswer('B', q.id, e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white/90 backdrop-blur-md p-4 border-t border-slate-200 mt-8 flex justify-end gap-4 shadow-lg z-10">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Run Alignment Analysis
          </Button>
        </div>
      </form>
    </div>
  );
};