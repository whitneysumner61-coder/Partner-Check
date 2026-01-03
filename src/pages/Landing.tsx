import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Login } from '../components/auth/Login';
import { Signup } from '../components/auth/Signup';

export const Landing: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  if (showAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          {authMode === 'signup' ? (
            <Signup 
              onToggleLogin={() => setAuthMode('login')} 
              onSuccess={() => window.location.href = '/app'}
            />
          ) : (
            <Login 
              onToggleSignup={() => setAuthMode('signup')}
              onSuccess={() => window.location.href = '/app'}
            />
          )}
          <button
            onClick={() => setShowAuth(false)}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-700 mt-4"
          >
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-2xl font-black">
                P
              </div>
              <h1 className="text-4xl md:text-5xl font-black">
                Partner<span className="text-primary">Check</span>
              </h1>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Stop Partnering Blind.<br />
              <span className="text-primary">Start Partnering Smart.</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              The "No-BS" due diligence tool for real estate syndicators. 
              X-Ray your partners. Pre-Nup your joint ventures. Save yourself from one bad deal per year.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuth(true);
                }}
              >
                Start Free Trial
              </Button>
              <Button 
                variant="secondary" 
                size="lg"
                onClick={() => {
                  setAuthMode('login');
                  setShowAuth(true);
                }}
              >
                Sign In
              </Button>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              Free tier includes 1 X-Ray and 1 Pre-Nup per month • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-5xl mb-4">🩺</div>
              <h4 className="text-2xl font-bold text-slate-900 mb-3">Sponsor X-Ray</h4>
              <p className="text-slate-600 mb-4">
                Create brutally honest operational profiles. Answer the hard questions:
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  What's your worst deal?
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  How do you communicate during bad quarters?
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  When do you cut fees to protect LPs?
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="text-5xl mb-4">🤝</div>
              <h4 className="text-2xl font-bold text-slate-900 mb-3">JV Pre-Nup</h4>
              <p className="text-slate-600 mb-4">
                Detect conflicts before you sign. Both partners answer independently:
              </p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Who controls the money?
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  What happens if we're over budget?
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  AI-powered alignment analysis
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-4">
            Simple, Transparent Pricing
          </h3>
          <p className="text-center text-slate-600 mb-12">
            Choose the plan that fits your deal flow
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="border-2 border-slate-200 rounded-xl p-8">
              <h4 className="text-xl font-bold mb-2">Free</h4>
              <div className="text-3xl font-black mb-4">$0<span className="text-lg text-slate-500">/mo</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">1 X-Ray per month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">1 Pre-Nup per month</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">7-day shareable links</span>
                </li>
                <li className="flex items-start text-slate-400">
                  <span className="mr-2">✗</span>
                  <span className="text-sm">PDF exports</span>
                </li>
              </ul>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuth(true);
                }}
              >
                Get Started
              </Button>
            </div>

            {/* Pro Tier */}
            <div className="border-2 border-primary rounded-xl p-8 relative bg-primary/5">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold">
                Popular
              </div>
              <h4 className="text-xl font-bold mb-2">Pro</h4>
              <div className="text-3xl font-black mb-4">$49<span className="text-lg text-slate-500">/mo</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">Unlimited X-Rays</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">Unlimited Pre-Nups</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">PDF exports</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">30-day shareable links</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">Advanced analytics</span>
                </li>
              </ul>
              <Button 
                className="w-full"
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuth(true);
                }}
              >
                Start Free Trial
              </Button>
            </div>

            {/* Enterprise Tier */}
            <div className="border-2 border-slate-200 rounded-xl p-8">
              <h4 className="text-xl font-bold mb-2">Enterprise</h4>
              <div className="text-3xl font-black mb-4">$199<span className="text-lg text-slate-500">/mo</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">Everything in Pro</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">White-label branding</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">Team collaboration (5 users)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">API access</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-sm">Unlimited share links</span>
                </li>
              </ul>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuth(true);
                }}
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Stop Partnering Blind?
          </h3>
          <p className="text-xl text-slate-300 mb-8">
            Join syndicators who check their partners before they partner.
          </p>
          <Button 
            size="lg"
            onClick={() => {
              setAuthMode('signup');
              setShowAuth(true);
            }}
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center gap-8 mb-6">
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/about" className="hover:text-white">About</a>
            <a href="/contact" className="hover:text-white">Contact</a>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} PartnerCheck. Built for Syndicators, by Syndicators.
          </p>
        </div>
      </footer>
    </div>
  );
};
