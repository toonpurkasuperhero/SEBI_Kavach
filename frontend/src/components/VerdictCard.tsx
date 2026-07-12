import { useState } from 'react';
import { CheckCircle, AlertTriangle, AlertOctagon, Info, Flag } from 'lucide-react';
import { cn } from '../utils';

export type VerdictStatus = 'verified' | 'high-risk' | 'unverified' | 'flagged';

interface VerdictCardProps {
  status: VerdictStatus;
  confidenceScore?: number;
  explanation: string;
  signer?: string;
  timestamp?: string;
  correlatedFlags?: string[];
  contentId?: string;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  status,
  confidenceScore,
  explanation,
  signer,
  timestamp,
  correlatedFlags,
  contentId
}) => {
  const [isReporting, setIsReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleReport = async () => {
    if (!reportReason) return;
    setIsReporting(true);
    try {
      await fetch('http://localhost:8000/api/v1/report/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_id: contentId || 'unknown', reason: reportReason })
      });
      setReported(true);
      setShowReportForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsReporting(false);
    }
  };
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: <CheckCircle className="text-green-500" size={24} />,
          title: 'Verified Authentic',
          borderColor: 'border-green-500/50',
          bgColor: 'bg-green-500/10'
        };
      case 'high-risk':
        return {
          icon: <AlertOctagon className="text-red-500" size={24} />,
          title: 'High-Risk Synthetic Content',
          borderColor: 'border-red-500/50',
          bgColor: 'bg-red-500/10'
        };
      case 'unverified':
        return {
          icon: <AlertTriangle className="text-yellow-500" size={24} />,
          title: 'Unverified / Proceed with Caution',
          borderColor: 'border-yellow-500/50',
          bgColor: 'bg-yellow-500/10'
        };
      case 'flagged':
        return {
          icon: <AlertOctagon className="text-orange-500" size={24} />,
          title: 'Flagged Content + Suspicious Activity',
          borderColor: 'border-orange-500/50',
          bgColor: 'bg-orange-500/10'
        };
      default:
        return {
          icon: <Info size={24} />,
          title: 'Analysis Complete',
          borderColor: 'border-border',
          bgColor: 'bg-card'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={cn("border rounded-xl p-6 shadow-sm transition-all", config.borderColor, config.bgColor)}>
      <div className="flex items-start space-x-4">
        <div className="mt-1">{config.icon}</div>
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg">{config.title}</h3>
          <p className="text-foreground/80 text-sm leading-relaxed">{explanation}</p>
          
          {signer && (
            <div className="pt-2 border-t border-border/50 text-sm">
              <span className="font-medium">Signer: </span> {signer}
              {timestamp && <span className="ml-4 text-foreground/60">{new Date(timestamp).toLocaleString()}</span>}
            </div>
          )}

          {confidenceScore !== undefined && (
            <div className="pt-2 text-sm flex items-center">
              <span className="font-medium mr-2">AI Confidence:</span>
              <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden max-w-[200px]">
                <div 
                  className={cn("h-full", status === 'verified' ? "bg-green-500" : status === 'high-risk' ? "bg-red-500" : "bg-orange-500")}
                  style={{ width: `${(confidenceScore * 100).toFixed(0)}%` }}
                />
              </div>
              <span className="ml-2">{(confidenceScore * 100).toFixed(0)}%</span>
            </div>
          )}

          {correlatedFlags && correlatedFlags.length > 0 && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-sm font-bold text-red-500 mb-1">Correlated Activity Detected:</p>
              <ul className="list-disc list-inside text-sm text-foreground/90">
                {correlatedFlags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-4 mt-2 border-t border-border/30 flex flex-col items-end">
            {!showReportForm && !reported && (
              <button 
                onClick={() => setShowReportForm(true)}
                className="text-sm font-medium px-4 py-2 rounded-lg flex items-center transition-colors bg-background border border-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
              >
                <Flag size={16} className="mr-2" />
                Report for ML Review
              </button>
            )}

            {reported && (
              <div className="text-sm font-medium px-4 py-2 rounded-lg flex items-center bg-green-500/20 text-green-600 border border-green-500/30">
                <Flag size={16} className="mr-2" />
                Report Submitted
              </div>
            )}

            {showReportForm && !reported && (
              <div className="w-full mt-2 animate-in fade-in slide-in-from-top-2">
                <textarea 
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Why do you think this verdict is incorrect?"
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-foreground/20 mb-2"
                />
                <div className="flex justify-end space-x-2">
                  <button 
                    onClick={() => setShowReportForm(false)}
                    className="px-4 py-1.5 text-sm font-medium border border-border rounded-lg hover:bg-card transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleReport}
                    disabled={isReporting || !reportReason}
                    className="px-4 py-1.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
                  >
                    {isReporting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
