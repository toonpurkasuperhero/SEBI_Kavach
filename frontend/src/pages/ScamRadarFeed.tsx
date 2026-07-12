import { useState, Fragment } from 'react';
import { Search, Filter, ShieldAlert, ChevronDown, ChevronUp, FileAudio, FileText } from 'lucide-react';

const ScamRadarFeed = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const mockScams = [
    {
      id: 1,
      type: 'Video Deepfake',
      target: 'NSE CEO Impersonation',
      channel: 'YouTube Shorts',
      date: '2026-07-12',
      status: 'Takedown Requested',
      evidence: {
        type: 'video',
        content: 'AI-generated video of NSE CEO promoting a suspicious penny stock. The lip-sync is slightly delayed and the background contains unusual artifacts. Traced back to a server in Eastern Europe.'
      }
    },
    {
      id: 2,
      type: 'Text/Phishing',
      target: 'Guaranteed Returns Scheme',
      channel: 'WhatsApp Groups',
      date: '2026-07-11',
      status: 'Active Alert',
      evidence: {
        type: 'text',
        content: '"URGENT: SEBI approved 200% guaranteed returns on new NIFTY options. Click here to join VIP group before link expires: sebi-alert-urgent.com/join"'
      }
    },
    {
      id: 3,
      type: 'Voice Clone',
      target: 'Broker Helpdesk Spoof',
      channel: 'Phone Call',
      date: '2026-07-10',
      status: 'Resolved',
      evidence: {
        type: 'audio',
        content: '[Transcript] "Hello, this is Zerodha support. We detected unusual activity. Please share your OTP to block the unauthorized transaction." (Spectral analysis confirmed AI voice generation, pitch variance 92% synthetic)'
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <ShieldAlert className="mr-3 text-red-500" size={32} />
            Public Scam Radar
          </h1>
          <p className="text-foreground/70 mt-1">Live feed of confirmed synthetic media and phishing attacks.</p>
        </div>
        
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
            <input 
              type="text" 
              placeholder="Search ticker, channel..." 
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <button className="p-2 border border-border rounded-lg hover:bg-card transition-colors">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/50 border-b border-border text-sm font-medium text-foreground/70">
                <th className="p-4">Threat Type</th>
                <th className="p-4">Target / Impersonation</th>
                <th className="p-4">Channel</th>
                <th className="p-4">Date Detected</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockScams.map((scam) => (
                <Fragment key={scam.id}>
                  <tr 
                    onClick={() => setExpandedId(expandedId === scam.id ? null : scam.id)}
                    className="hover:bg-background/30 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 font-medium flex items-center">
                      {expandedId === scam.id ? <ChevronUp size={16} className="mr-2 text-foreground/50" /> : <ChevronDown size={16} className="mr-2 text-foreground/50 group-hover:text-foreground" />}
                      {scam.type}
                    </td>
                    <td className="p-4">{scam.target}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-background border border-border rounded-full text-xs">
                        {scam.channel}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-foreground/70">{scam.date}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        scam.status === 'Active Alert' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                        scam.status === 'Resolved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                        'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      }`}>
                        {scam.status}
                      </span>
                    </td>
                  </tr>
                  {expandedId === scam.id && (
                    <tr className="bg-background/20 border-b border-border">
                      <td colSpan={5} className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-card border border-border rounded-lg">
                            {scam.evidence.type === 'audio' || scam.evidence.type === 'video' ? <FileAudio size={24} className="text-red-500" /> : <FileText size={24} className="text-red-500" />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1 uppercase tracking-wider text-foreground/60">Evidence Details</h4>
                            <p className="text-sm leading-relaxed text-foreground/90 font-mono bg-background p-3 rounded border border-border">{scam.evidence.content}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScamRadarFeed;
