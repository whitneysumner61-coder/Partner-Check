import React, { useRef } from 'react';
import { Button } from './ui/Button';

interface ShareCardProps {
  type: 'xray' | 'prenup';
  data: {
    title: string;
    score?: number;
    sponsorName?: string;
    partnerNames?: string[];
    highlights?: string[];
  };
  onClose: () => void;
}

export const ShareCard: React.FC<ShareCardProps> = ({ type, data, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;

    // In production, you'd use html2canvas or similar
    // For now, we'll just copy the content
    alert('Image download feature - integrate with html2canvas in production');
  };

  const handleShareLinkedIn = () => {
    const text = type === 'xray'
      ? `Just completed my Sponsor X-Ray on PartnerCheck - building trust through transparency in JV partnerships! #RealEstate #Syndication #PartnerCheck`
      : `${data.partnerNames?.join(' & ')} achieved ${data.score}% alignment on PartnerCheck! Ready to build a successful partnership. #JV #RealEstate #PartnerCheck`;

    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareTwitter = () => {
    const text = type === 'xray'
      ? `Just created my Sponsor X-Ray on PartnerCheck 🩺\n\nTransparency = Trust in #RealEstate partnerships\n\nCheck it out:`
      : `${data.partnerNames?.join(' & ')} scored ${data.score}% alignment on PartnerCheck! 🤝\n\nBuilding partnerships the right way.\n\n#JV #RealEstate`;

    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-slate-900">Share Your Results</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Preview Card */}
        <div className="p-6">
          <div
            ref={cardRef}
            className={`rounded-xl p-8 text-white relative overflow-hidden ${
              type === 'xray'
                ? 'bg-gradient-to-br from-blue-600 to-blue-800'
                : data.score && data.score > 75
                  ? 'bg-gradient-to-br from-green-600 to-green-800'
                  : data.score && data.score > 50
                    ? 'bg-gradient-to-br from-yellow-600 to-yellow-800'
                    : 'bg-gradient-to-br from-red-600 to-red-800'
            }`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mb-24"></div>
            </div>

            {/* Content */}
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-black text-slate-900">P</span>
                  </div>
                  <div>
                    <div className="font-black text-lg">PartnerCheck</div>
                    <div className="text-xs opacity-90">
                      {type === 'xray' ? 'Sponsor X-Ray' : 'JV Pre-Nup Results'}
                    </div>
                  </div>
                </div>
                {data.score !== undefined && (
                  <div className="text-right">
                    <div className="text-5xl font-black">{data.score}%</div>
                    <div className="text-xs opacity-90">Alignment</div>
                  </div>
                )}
              </div>

              {type === 'xray' ? (
                <div>
                  <h4 className="text-2xl font-bold mb-4">{data.sponsorName}</h4>
                  <div className="space-y-2">
                    {data.highlights?.map((highlight, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-white/80">✓</span>
                        <span className="text-sm opacity-90">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-xl font-bold mb-2">
                    {data.partnerNames?.join(' & ')}
                  </h4>
                  <p className="text-lg opacity-90 mb-4">
                    {data.score && data.score > 80
                      ? '🎉 Highly Aligned Partnership'
                      : data.score && data.score > 60
                        ? '⚠️ Good Foundation, Work Required'
                        : '🚨 Major Alignment Issues'}
                  </p>
                  <div className="text-sm opacity-75">
                    Completed comprehensive JV alignment analysis
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-white/20 text-xs opacity-75">
                Visit PartnerCheck.com to create your own X-Ray or analyze partnership alignment
              </div>
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-6 bg-slate-50 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShareLinkedIn}
              className="bg-[#0077b5] hover:bg-[#006396] text-white"
            >
              <span className="mr-2">📱</span>
              Share on LinkedIn
            </Button>
            <Button
              onClick={handleShareTwitter}
              className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
            >
              <span className="mr-2">🐦</span>
              Share on Twitter
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCopyLink}
              variant="secondary"
            >
              <span className="mr-2">🔗</span>
              Copy Link
            </Button>
            <Button
              onClick={handleDownloadImage}
              variant="secondary"
            >
              <span className="mr-2">📥</span>
              Download Image
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
