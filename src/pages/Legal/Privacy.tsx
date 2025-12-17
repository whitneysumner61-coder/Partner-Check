import React from 'react';

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-black text-slate-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-slate-700 mb-4">
            We collect information you provide directly to us, including:
          </p>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Account information (name, email, company name)</li>
            <li>X-Ray profiles and Pre-Nup analyses you create</li>
            <li>Usage data and analytics</li>
            <li>Payment information (processed securely by Stripe)</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p className="text-slate-700 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Provide, maintain, and improve the Service</li>
            <li>Process your transactions</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Analyze usage patterns to improve user experience</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Information Sharing</h2>
          <p className="text-slate-700 mb-4">
            We do not sell, trade, or rent your personal information to third parties. We may share your information only:
          </p>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>With service providers who assist in operating the Service (e.g., hosting, payment processing)</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Data Security</h2>
          <p className="text-slate-700 mb-4">
            We implement appropriate technical and organizational measures to protect your personal information. 
            However, no method of transmission over the Internet is 100% secure.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Data Retention</h2>
          <p className="text-slate-700 mb-4">
            We retain your information for as long as your account is active or as needed to provide the Service. 
            You can request deletion of your account and data at any time.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">6. Your Rights</h2>
          <p className="text-slate-700 mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 text-slate-700 mb-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data</li>
            <li>Opt out of marketing communications</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">7. Cookies</h2>
          <p className="text-slate-700 mb-4">
            We use cookies and similar technologies to provide and improve the Service. You can control cookies 
            through your browser settings.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">8. Changes to Privacy Policy</h2>
          <p className="text-slate-700 mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
            new Privacy Policy on this page and updating the "Last updated" date.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">9. Contact Us</h2>
          <p className="text-slate-700 mb-4">
            If you have questions about this Privacy Policy, please contact us at privacy@partnercheck.com
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <a href="/" className="text-primary hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  );
};
