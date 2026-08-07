import { useState } from 'react';
import {
  ShieldCheck, Clock, Search, Heart, MessageCircle,
  Repeat2, Share2, ExternalLink,
  Globe, AlertOctagon, CheckCircle2, Info
} from 'lucide-react';
import { cn } from '../utils';

// Known verified official accounts — simulating VerifyNet Trust Registry
const VERIFIED_ACCOUNTS: Record<string, { signer: string; registrationNo: string; verified: boolean }> = {
  'sebi_india': { signer: 'Securities and Exchange Board of India', registrationNo: 'SEBI/GOI/2026', verified: true },
  'nseindia': { signer: 'National Stock Exchange of India', registrationNo: 'INB230939139', verified: true },
  'bseindia': { signer: 'Bombay Stock Exchange Ltd.', registrationNo: 'INE011394531', verified: true },
  'rbi': { signer: 'Reserve Bank of India — Official', registrationNo: 'RBI/GOI/2026', verified: true },
  'zerodhaonline': { signer: 'Zerodha Broking Ltd.', registrationNo: 'NSE/BSE-INZ000031633', verified: true },
};

// Scam pattern signals for text analysis
const SCAM_SIGNALS = [
  'guaranteed returns', 'guaranteed profit', '400%', '500%', 'sure shot',
  'jackpot', 'sebi notice', 'unfreeze demat', 'kyc urgent', 'click here to claim',
  'secret group', 'vip tip', 'operator tips', 'pump', 'sure profit'
];

type VerdictType = 'verified' | 'unverified' | 'scam' | 'review' | null;

interface ScanResult {
  verdict: VerdictType;
  confidence: number;
  accountLabel: string;
  signer?: string;
  registrationNo?: string;
  reason: string;
  signals: string[];
  timestamp: string;
}

// Simulated social feed posts
const SAMPLE_POSTS = [
  {
    id: 1,
    handle: 'sebi_india',
    name: 'SEBI',
    avatar: 'S',
    avatarBg: 'bg-blue-800',
    text: 'SEBI has issued a new circular on investor grievance redressal framework. All intermediaries must comply by 30 Sep 2026. Read the official circular at sebi.gov.in. Do not rely on forwarded WhatsApp messages.',
    time: '2h ago',
    likes: '4.1K',
    retweets: '1.2K',
    comments: '318',
    verdict: 'verified' as VerdictType,
    url: 'x.com/sebi_india',
  },
  {
    id: 2,
    handle: 'sure_shot_tips99',
    name: 'Sure Shot Stock Tips',
    avatar: '$$',
    avatarBg: 'bg-green-700',
    text: '🚀 GUARANTEED 400% RETURNS! 🚀 Join our VIP Operator Tips Group today! Limited 10 seats only. SEBI Registered (Trust us!). Send ₹999 to join WhatsApp group link below. Act NOW before market opens!',
    time: '45 min ago',
    likes: '12',
    retweets: '2',
    comments: '0',
    verdict: 'scam' as VerdictType,
    url: 'x.com/sure_shot_tips99',
  },
  {
    id: 3,
    handle: 'nseindia',
    name: 'NSE India',
    avatar: 'N',
    avatarBg: 'bg-teal-800',
    text: 'Market timing update: Equity markets will observe a trading holiday on August 15, 2026 (Independence Day). Index F&O contracts will expire on August 14, 2026. For details visit nseindia.com.',
    time: '6h ago',
    likes: '2.8K',
    retweets: '890',
    comments: '142',
    verdict: 'verified' as VerdictType,
    url: 'x.com/nseindia',
  },
  {
    id: 4,
    handle: 'sensex_leaks_real',
    name: 'Sensex Leaks — Real Insider',
    avatar: 'L',
    avatarBg: 'bg-red-800',
    text: 'BREAKING: Reliance Industries secret board meeting today. CEO announces surprise 50% dividend. Buy NOW before 10am! This is insider info — forward to 10 friends to get free tips for 1 year.',
    time: '20 min ago',
    likes: '48',
    retweets: '31',
    comments: '7',
    verdict: 'scam' as VerdictType,
    url: 'x.com/sensex_leaks_real',
  },
];

export default function SocialExtensionScanner() {
  const [customUrl, setCustomUrl] = useState('');
  const [customText, setCustomText] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activePost, setActivePost] = useState<number | null>(null);
  const [postVerdicts, setPostVerdicts] = useState<Record<number, ScanResult | null>>({});
  const [activeTab, setActiveTab] = useState<'feed' | 'custom'>('feed');

  const analyzeContent = (handle: string, text: string): ScanResult => {
    const handleLower = handle.toLowerCase().replace(/^@/, '').trim();
    const textLower = text.toLowerCase();
    const detectedSignals = SCAM_SIGNALS.filter(s => textLower.includes(s));
    const accountInfo = VERIFIED_ACCOUNTS[handleLower];

    if (accountInfo && accountInfo.verified) {
      return {
        verdict: 'verified',
        confidence: 0.99,
        accountLabel: 'Official SEBI/Exchange Registered Entity',
        signer: accountInfo.signer,
        registrationNo: accountInfo.registrationNo,
        reason: 'Account matched VerifyNet Trust Registry. C2PA signature valid. This is an official, government-registered financial entity.',
        signals: [],
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    if (detectedSignals.length >= 2) {
      return {
        verdict: 'scam',
        confidence: 0.92 + Math.min(detectedSignals.length * 0.01, 0.07),
        accountLabel: 'Unregistered / Suspicious Account',
        reason: `High-risk financial scam patterns detected. ${detectedSignals.length} known scam signals found in post content.`,
        signals: detectedSignals,
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    if (detectedSignals.length === 1 || textLower.includes('sebi') || textLower.includes('nse') || textLower.includes('bse')) {
      return {
        verdict: 'review',
        confidence: 0.68,
        accountLabel: 'Unregistered Origin — Market Claim',
        reason: 'Content mentions financial regulators or market claims but account is not in VerifyNet Trust Registry. Escalated to SEBI Monitoring Cell.',
        signals: detectedSignals,
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    return {
      verdict: 'unverified',
      confidence: 0.72,
      accountLabel: 'Unregistered Account',
      reason: 'Account not found in VerifyNet Registry. No obvious scam patterns detected. Proceed with normal caution.',
      signals: [],
      timestamp: new Date().toLocaleTimeString(),
    };
  };

  const handleScanPost = (post: typeof SAMPLE_POSTS[0]) => {
    setIsScanning(true);
    setActivePost(post.id);
    setTimeout(() => {
      const result = analyzeContent(post.handle, post.text);
      setPostVerdicts(prev => ({ ...prev, [post.id]: result }));
      setIsScanning(false);
    }, 900);
  };

  const handleCustomScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() && !customText.trim()) return;
    setIsScanning(true);
    setScanResult(null);
    setTimeout(() => {
      const handle = customUrl.replace(/https?:\/\/(www\.)?(x|twitter)\.com\//i, '').split('/')[0] || 'unknown';
      const result = analyzeContent(handle, customUrl + ' ' + customText);
      setScanResult(result);
      setIsScanning(false);
    }, 1000);
  };

  const VerdictBadge = ({ verdict, small }: { verdict: VerdictType; small?: boolean }) => {
    const size = small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1';
    if (!verdict) return null;
    return (
      <span className={cn('font-bold rounded-full border inline-flex items-center gap-1', size,
        verdict === 'verified' && 'bg-green-500/20 text-green-400 border-green-500/30',
        verdict === 'scam' && 'bg-red-500/20 text-red-400 border-red-500/30',
        verdict === 'review' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        verdict === 'unverified' && 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      )}>
        {verdict === 'verified' && <><CheckCircle2 size={11} /> VERIFIED</>}
        {verdict === 'scam' && <><AlertOctagon size={11} /> SCAM ALERT</>}
        {verdict === 'review' && <><Clock size={11} /> UNDER REVIEW</>}
        {verdict === 'unverified' && <><Info size={11} /> UNREGISTERED</>}
      </span>
    );
  };

  const ResultCard = ({ result }: { result: ScanResult }) => (
    <div className={cn('rounded-xl border p-4 mt-3 text-sm animate-in fade-in slide-in-from-top-2',
      result.verdict === 'verified' && 'bg-green-500/5 border-green-500/30',
      result.verdict === 'scam' && 'bg-red-500/5 border-red-500/30',
      result.verdict === 'review' && 'bg-amber-500/5 border-amber-500/30',
      result.verdict === 'unverified' && 'bg-gray-500/5 border-gray-500/30',
    )}>
      <div className="flex items-center justify-between mb-2">
        <VerdictBadge verdict={result.verdict} />
        <span className="text-xs text-foreground/40">{result.timestamp}</span>
      </div>
      <p className="text-xs font-semibold text-foreground/60 mb-1">{result.accountLabel}</p>
      <p className="text-foreground/80 leading-relaxed mb-2">{result.reason}</p>
      {result.signer && (
        <div className="text-xs space-y-0.5 border-t border-border/40 pt-2 mt-2">
          <p><span className="text-foreground/50">Signer:</span> {result.signer}</p>
          {result.registrationNo && <p><span className="text-foreground/50">SEBI Reg No:</span> {result.registrationNo}</p>}
        </div>
      )}
      {result.signals.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {result.signals.map((s, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">
              ⚠ "{s}"
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 text-xs text-foreground/40">AI Confidence: {(result.confidence * 100).toFixed(0)}%</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-4 py-1.5 rounded-full text-xs font-semibold mb-3">
          <Globe size={13} /> <span>VerifyNet Social Media Scanner — Live Prototype</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Social Media Scanner</h2>
        <p className="text-foreground/60 text-sm mt-1">
          Scan any social media post or account for deepfakes, scam signals, and official VerifyNet authentication badges.
        </p>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto">
        <div className="flex bg-card border border-border rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('feed')}
            className={cn('flex-1 py-2 text-sm font-medium rounded-lg transition-colors', activeTab === 'feed' ? 'bg-background shadow text-foreground' : 'text-foreground/60 hover:text-foreground')}
          >
            Live Social Feed Scanner
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={cn('flex-1 py-2 text-sm font-medium rounded-lg transition-colors', activeTab === 'custom' ? 'bg-background shadow text-foreground' : 'text-foreground/60 hover:text-foreground')}
          >
            Scan Custom URL / Post
          </button>
        </div>

        {/* FEED SCANNER TAB */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            <p className="text-sm text-foreground/60 mb-2">
              Click <strong>"Scan This Post"</strong> on any post below. The VerifyNet badge appears inline — exactly like the browser extension would on X / Twitter.
            </p>
            {SAMPLE_POSTS.map((post) => (
              <div key={post.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Post Header */}
                <div className="p-4 pb-0 flex items-start space-x-3">
                  <div className={cn('w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0', post.avatarBg)}>
                    {post.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                      <span className="font-bold text-sm">{post.name}</span>
                      <span className="text-foreground/50 text-xs">@{post.handle} · {post.time}</span>
                      {/* Inline VerifyNet Badge if scanned */}
                      {postVerdicts[post.id] && (
                        <VerdictBadge verdict={postVerdicts[post.id]!.verdict} small />
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">{post.text}</p>
                  </div>
                </div>

                {/* Post Actions */}
                <div className="px-4 py-3 flex items-center justify-between border-t border-border/30 mt-3">
                  <div className="flex items-center space-x-5 text-xs text-foreground/50">
                    <button className="flex items-center space-x-1 hover:text-blue-400 transition-colors"><MessageCircle size={14} /><span>{post.comments}</span></button>
                    <button className="flex items-center space-x-1 hover:text-green-400 transition-colors"><Repeat2 size={14} /><span>{post.retweets}</span></button>
                    <button className="flex items-center space-x-1 hover:text-red-400 transition-colors"><Heart size={14} /><span>{post.likes}</span></button>
                    <button className="flex items-center space-x-1 hover:text-blue-400 transition-colors"><Share2 size={14} /></button>
                    <a href={`https://${post.url}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 hover:text-purple-400 transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  <button
                    onClick={() => handleScanPost(post)}
                    disabled={isScanning && activePost === post.id}
                    className={cn(
                      'flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      postVerdicts[post.id]
                        ? 'bg-foreground/5 text-foreground/50 border border-border/40'
                        : 'bg-foreground text-background hover:bg-foreground/90',
                    )}
                  >
                    {isScanning && activePost === post.id ? (
                      <><span className="animate-spin">⚙️</span><span>Scanning...</span></>
                    ) : postVerdicts[post.id] ? (
                      <><ShieldCheck size={13} /><span>Re-scan</span></>
                    ) : (
                      <><Search size={13} /><span>Scan This Post</span></>
                    )}
                  </button>
                </div>

                {/* Verdict result inline */}
                {postVerdicts[post.id] && (
                  <div className="px-4 pb-4">
                    <ResultCard result={postVerdicts[post.id]!} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CUSTOM URL TAB */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomScan} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Social Media Profile URL or Post URL</label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://x.com/someaccount or https://t.me/suspiciousgroup"
                  className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Post Text / Message Content (optional)</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Paste the post or message text here..."
                className="w-full bg-background border border-border rounded-lg p-3 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-foreground/50">VerifyNet scans account registry + text for scam signals</p>
              <button
                type="submit"
                disabled={isScanning || (!customUrl.trim() && !customText.trim())}
                className="flex items-center space-x-2 px-5 py-2.5 bg-foreground text-background font-semibold rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {isScanning ? <><span className="animate-spin">⚙️</span><span>Scanning...</span></> : <><ShieldCheck size={15} /><span>Scan Now</span></>}
              </button>
            </div>
            {scanResult && <ResultCard result={scanResult} />}

            {/* Quick test links */}
            <div className="border-t border-border/40 pt-4">
              <p className="text-xs font-semibold text-foreground/50 mb-2">Quick Test Links:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '✅ NSE India', url: 'https://x.com/nseindia' },
                  { label: '✅ SEBI Official', url: 'https://x.com/sebi_india' },
                  { label: '🚨 Fake Tip Group', url: 'https://t.me/sure_shot_tips99' },
                  { label: '🟧 Market Claim', url: 'https://x.com/unknown_market_leaks' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setCustomUrl(item.url)}
                    className="text-xs px-3 py-1 bg-background border border-border rounded-full hover:bg-card transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
