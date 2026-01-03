import React from 'react';

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-black text-slate-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-700 mb-4">
            By accessing and using PartnerCheck ("the Service"), you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use the Service.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Description of Service</h2>
          <p className="text-slate-700 mb-4">
            PartnerCheck provides tools for real estate syndicators to assess potential partners and joint ventures, 
            including Sponsor X-Ray profiles and JV Pre-Nup alignment analyses.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. User Accounts</h2>
          <p className="text-slate-700 mb-4">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities 
            that occur under your account. You must notify us immediately of any unauthorized use of your account.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Subscription Plans</h2>
          <p className="text-slate-700 mb-4">
            PartnerCheck offers Free, Pro, and Enterprise subscription tiers. Subscription fees are billed monthly or 
            annually as selected. You may cancel your subscription at any time.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. User Content</h2>
          <p className="text-slate-700 mb-4">
            You retain ownership of all content you submit to the Service. By submitting content, you grant us a 
            license to store, process, and display your content solely for the purpose of providing the Service.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. Prohibited Uses</h2>
          <p className="text-slate-700 mb-4">
            You agree not to use the Service for any unlawful purpose or in any way that could damage, disable, 
            overburden, or impair the Service. You may not attempt to gain unauthorized access to any part of the Service.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">7. Disclaimer</h2>
          <p className="text-slate-700 mb-4">
            The Service is provided "as is" without warranties of any kind. PartnerCheck does not guarantee the 
            accuracy, completeness, or reliability of any content or analysis provided through the Service.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">8. Limitation of Liability</h2>
          <p className="text-slate-700 mb-4">
            PartnerCheck shall not be liable for any indirect, incidental, special, consequential, or punitive damages 
            resulting from your use or inability to use the Service.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">9. Changes to Terms</h2>
          <p className="text-slate-700 mb-4">
            We reserve the right to modify these Terms at any time. We will notify users of any material changes 
            via email or through the Service.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">10. Contact Information</h2>
          <p className="text-slate-700 mb-4">
            If you have questions about these Terms, please contact us at legal@partnercheck.com
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <a href="/" className="text-primary hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  );
};
