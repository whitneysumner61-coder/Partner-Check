import React, { useState } from 'react';
import { ViewState, AppState, XRayProfile, PreNupData, AlignmentAnalysis } from './types';
import { PRENUP_QUESTIONS } from './constants';
import { analyzeAlignment } from './services/geminiService';
import { SponsorXRay } from './components/SponsorXRay';
import { XRayView } from './components/XRayView';
import { JVPreNup } from './components/JVPreNup';
import { PreNupResults } from './components/PreNupResults';
import { Button } from './components/ui/Button';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentView: ViewState.HOME,
    xRayData: null,
    preNupData: null,
    analysisResults: null,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleXRayComplete = (data: XRayProfile) => {
    setState(prev => ({ ...prev, xRayData: data, currentView: ViewState.XRAY_VIEW }));
  };

  const handlePreNupAnalyze = async (data: PreNupData) => {
    setIsAnalyzing(true);
    
    // Process all questions through Gemini
    const analysisPromises = PRENUP_QUESTIONS.map(async (q) => {
      const result = await analyzeAlignment(
        q.text,
        data.partnerA.answers[q.id],
        data.partnerB.answers[q.id]
      );
      result.questionId = q.id;
      return result;
    });

    const results = await Promise.all(analysisPromises);

    setState(prev => ({
      ...prev,
      preNupData: data,
      analysisResults: results,
      currentView: ViewState.PRENUP_RESULTS
    }));
    setIsAnalyzing(false);
  };

  const renderContent = () => {
    if (isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
          <h2 className="text-2xl font-bold text-slate-800">Analyzing Compatibility...</h2>
          <p className="text-slate-500">Checking for red flags and alignment gaps.</p>
        </div>
      );
    }

    switch (state.currentView) {
      case ViewState.HOME:
        return (
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">
              Partner<span className="text-primary">Check</span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Before you partner, align on reality. The "No-BS" tool to filter bad partners, 
              expose hidden conflicts, and save you from one bad JV per year.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 hover:border-primary transition-colors cursor-pointer"
                   onClick={() => setState(prev => ({ ...prev, currentView: ViewState.XRAY_FORM }))}>
                <div className="text-4xl mb-4">🩺</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Sponsor X-Ray</h3>
                <p className="text-slate-500 mb-6 text-sm">
                  Create a brutally honest operational profile. Reveal how you behave under stress.
                </p>
                <Button className="w-full">Create X-Ray</Button>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 hover:border-primary transition-colors cursor-pointer"
                   onClick={() => setState(prev => ({ ...prev, currentView: ViewState.PRENUP_FORM }))}>
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">JV Pre-Nup</h3>
                <p className="text-slate-500 mb-6 text-sm">
                  Compare answers with a partner. Detect conflicts in ethics, money, and control.
                </p>
                <Button variant="secondary" className="w-full">Start Alignment</Button>
              </div>
            </div>
          </div>
        );
      
      case ViewState.XRAY_FORM:
        return (
          <SponsorXRay 
            onComplete={handleXRayComplete} 
            onCancel={() => setState(prev => ({ ...prev, currentView: ViewState.HOME }))} 
          />
        );

      case ViewState.XRAY_VIEW:
        return state.xRayData ? (
          <XRayView 
            data={state.xRayData} 
            onBack={() => setState(prev => ({ ...prev, currentView: ViewState.HOME }))} 
          />
        ) : null;

      case ViewState.PRENUP_FORM:
        return (
          <JVPreNup 
            onAnalyze={handlePreNupAnalyze}
            onCancel={() => setState(prev => ({ ...prev, currentView: ViewState.HOME }))}
          />
        );

      case ViewState.PRENUP_RESULTS:
        return state.analysisResults && state.preNupData ? (
          <PreNupResults 
            results={state.analysisResults}
            data={state.preNupData}
            onReset={() => setState(prev => ({ ...prev, currentView: ViewState.HOME }))}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div 
            className="text-2xl font-black tracking-tighter cursor-pointer flex items-center gap-2"
            onClick={() => setState(prev => ({ ...prev, currentView: ViewState.HOME }))}
          >
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white text-lg">P</div>
            <span>PartnerCheck</span>
          </div>
          {state.currentView !== ViewState.HOME && (
             <button 
               onClick={() => setState(prev => ({ ...prev, currentView: ViewState.HOME }))}
               className="text-slate-500 hover:text-primary text-sm font-semibold"
             >
               Exit to Home
             </button>
          )}
        </div>
      </nav>

      <main className="flex-grow bg-slate-50">
        {renderContent()}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 text-center text-slate-400 text-sm">
        <p>© {new Date().getFullYear()} PartnerCheck. Built for Syndicators, by Syndicators.</p>
      </footer>
    </div>
  );
};

export default App;