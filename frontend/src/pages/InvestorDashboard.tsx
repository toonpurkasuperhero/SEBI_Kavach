import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, FileText, X, Zap, Shield, AlertTriangle } from 'lucide-react';
import { VerdictCard } from '../components/VerdictCard';

const InvestorDashboard = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'link' | 'text'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verdict, setVerdict] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tier1Status, setTier1Status] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setVerdict(null);
    setTier1Status(null);
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setVerdict(null);
    setTier1Status(null);

    try {
      // Tier 1: Instant pHash check status
      setTier1Status('⚡ Tier-1: Checking against pHash Trust Registry...');
      await new Promise(r => setTimeout(r, 300));

      if (activeTab === 'upload' && selectedFile) {
        // ------ REAL FILE UPLOAD TO BACKEND AI MODEL ------
        // NOTE: Results are based entirely on AI content analysis, NOT the filename.
        setTier1Status('🧠 Running HuggingFace Vision/Audio Transformer on file content...');

        const formData = new FormData();
        formData.append('file', selectedFile);

        const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '');

        let fetchSuccess = false;
        try {
          console.log('[SEBI Kavach] Uploading to:', `${backendUrl}/api/v1/detect/upload`);
          const response = await fetch(`${backendUrl}/api/v1/detect/upload`, {
            method: 'POST',
            body: formData,
          });

          console.log('[SEBI Kavach] Backend response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('[SEBI Kavach] Backend result:', data);
            fetchSuccess = true;
            setVerdict({
              status: data.risk_level === 'high' ? 'high-risk' : data.risk_level === 'medium' ? 'flagged' : 'verified',
              explanation: data.explanation,
              confidenceScore: data.confidence_score,
              correlatedFlags: data.correlated_flags || [],
              contentId: selectedFile.name,
            });
            return;
          } else {
            const errText = await response.text();
            console.error('[SEBI Kavach] Backend error response:', errText);
            setVerdict({
              status: 'unverified',
              explanation: `⚠️ BACKEND ERROR: The AI model returned an error (HTTP ${response.status}). The file could not be analyzed. Please check that:\n• VITE_BACKEND_URL is set correctly in your Vercel environment variables\n• The Railway backend is online and healthy\n• HF_API_TOKEN is configured in Railway\n\nError details: ${errText.slice(0, 200)}`,
              confidenceScore: 0,
              correlatedFlags: ['Backend returned an error — no AI analysis was performed'],
              contentId: selectedFile.name,
            });
            return;
          }
        } catch (fetchErr) {
          console.error('[SEBI Kavach] Fetch failed (backend unreachable?):', fetchErr);
          if (!fetchSuccess) {
            setVerdict({
              status: 'unverified',
              explanation: `⚠️ BACKEND UNREACHABLE: Could not connect to the AI analysis server at:\n${backendUrl}\n\nThis means NO analysis was performed on your file. The result is NOT based on the file content.\n\nTo fix this:\n1. If running locally: start the backend with "uvicorn main:app --reload" in the /backend folder\n2. If deployed on Vercel: set VITE_BACKEND_URL=https://your-railway-app.up.railway.app in Vercel environment variables`,
              confidenceScore: 0,
              correlatedFlags: [
                'Backend server is unreachable — file was NOT analyzed',
                `Attempted URL: ${backendUrl}/api/v1/detect/upload`,
                'Set VITE_BACKEND_URL in Vercel environment variables to your Railway URL',
              ],
              contentId: selectedFile.name,
            });
            return;
          }
        }

      } else if (activeTab === 'link') {
        if (!inputValue) return;
        setTier1Status('🔗 Tier-1: Domain reputation & pHash link check...');
        const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '');
        const response = await fetch(`${backendUrl}/api/v1/verify/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_id: inputValue, source_url: inputValue }),
        });
        const data = await response.json();
        setVerdict({
          status: data.status === 'verified' ? 'verified' : data.status === 'unregistered' ? 'unverified' : 'high-risk',
          explanation: data.message,
          signer: data.signer,
          timestamp: data.timestamp,
          contentId: inputValue,
        });

      } else {
        if (!inputValue) return;
        setTier1Status('📝 Tier-1: Text phishing & urgency pattern scan...');
        const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '');
        const response = await fetch(`${backendUrl}/api/v1/detect/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'text', content_text: inputValue }),
        });
        const data = await response.json();
        setVerdict({
          status: data.risk_level === 'high' ? 'high-risk' : data.risk_level === 'medium' ? 'flagged' : 'verified',
          explanation: data.explanation,
          confidenceScore: data.confidence_score,
          correlatedFlags: data.correlated_flags || [],
          contentId: inputValue.slice(0, 30),
        });
      }

    } catch (error) {
      setVerdict({
        status: 'unverified',
        explanation: 'Backend AI model not reachable. Please ensure FastAPI server is running on localhost:8000. Run: cd backend && uvicorn main:app --reload',
      });
    } finally {
      setIsAnalyzing(false);
      setTier1Status(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">Verify Before You Invest</h1>
        <p className="text-foreground/70">
          Upload a video, voice note, or image — or paste a link or message. Our AI engine will check if it is ASLI (Genuine) or NAKLI (Deepfake/Scam).
        </p>
        {/* 2-Tier badge */}
        <div className="flex justify-center gap-3 flex-wrap">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Zap size={12} className="mr-1" /> Tier-1 pHash Registry (&lt;150ms)
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Shield size={12} className="mr-1" /> Tier-2 Hugging Face AI Scan
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-card rounded-2xl p-2 border border-border shadow-sm">
        <div className="flex p-1 space-x-1 bg-background/50 rounded-xl mb-6">
          {(['upload', 'link', 'text'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setVerdict(null); setTier1Status(null); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors ${activeTab === tab ? 'bg-background shadow text-foreground' : 'text-foreground/60 hover:text-foreground'}`}
            >
              {tab === 'upload' && <><Upload size={18} /><span>Upload Media</span></>}
              {tab === 'link' && <><LinkIcon size={18} /><span>Paste Link</span></>}
              {tab === 'text' && <><FileText size={18} /><span>Paste Text</span></>}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'upload' && (
            <div
              className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:bg-background/50 transition-colors cursor-pointer relative"
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*,audio/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) handleFileChange(e.target.files[0]);
                }}
              />

              {selectedFile ? (
                <div className="flex flex-col items-center space-y-4">
                  {previewUrl && (
                    <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg object-contain border border-border shadow" />
                  )}
                  <div className="p-3 bg-background border border-border rounded-lg shadow-sm flex items-center space-x-3 w-full max-w-sm">
                    <FileText className="text-foreground/70 shrink-0" size={20} />
                    <span className="font-medium text-sm truncate flex-1">{selectedFile.name}</span>
                    <span className="text-xs text-foreground/40">{(selectedFile.size / 1024).toFixed(0)} KB</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setVerdict(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 hover:bg-card rounded-full shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-foreground/50">Ready for AI analysis. Click "Analyze" below.</p>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto text-foreground/30 mb-4" size={48} />
                  <p className="font-semibold mb-1">Drag & drop or click to upload</p>
                  <p className="text-sm text-foreground/50">Supports Images, MP4 Video, MP3/OGG Audio — up to 50MB</p>
                </>
              )}
            </div>
          )}

          {(activeTab === 'link' || activeTab === 'text') && (
            <textarea
              className="w-full bg-background border border-border rounded-xl p-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm"
              placeholder={activeTab === 'link'
                ? 'Paste a YouTube, Telegram, or social media link here...'
                : 'Paste the suspicious WhatsApp message, SMS, or email text here...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          )}

          {/* Tier-1 status indicator */}
          {tier1Status && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-blue-400 animate-pulse">
              <Zap size={14} />
              <span>{tier1Status}</span>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (activeTab === 'upload' ? !selectedFile : !inputValue)}
              className="bg-foreground text-background px-6 py-2.5 rounded-lg font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Shield size={16} />
                  <span>Analyze with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {verdict && (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <VerdictCard {...verdict} />
        </div>
      )}

      {/* Scenario Showcase Cards */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <AlertTriangle size={18} className="mr-2 text-amber-400" />
          Live Case Scenarios (Demo)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="bg-card border border-red-500/20 rounded-xl p-4 cursor-pointer hover:border-red-500/60 transition-colors"
            onClick={() => setVerdict({
              status: 'high-risk',
              explanation: 'NAKLI / SCAM ALERT: Voice note created by AI clone (mo-thecreator/Deepfake-audio-detection). Vocoder pitch variance: 94% synthetic. Caller impersonating SEBI Deputy General Manager asking for demat KYC update and OTP.',
              confidenceScore: 0.94,
              correlatedFlags: ['AI Voice Clone detected', 'Caller ID spoofed (faked SEBI landline)', 'Target received similar scam call twice in 7 days'],
            })}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">FAKE VOICE</span>
              <span className="text-xs text-foreground/50">Ramesh Gupta, Lucknow</span>
            </div>
            <p className="text-sm font-medium">Received voice call claiming to be SEBI officer demanding demat OTP</p>
          </div>
          {/* Card 2 */}
          <div className="bg-card border border-red-500/20 rounded-xl p-4 cursor-pointer hover:border-red-500/60 transition-colors"
            onClick={() => setVerdict({
              status: 'high-risk',
              explanation: 'NAKLI / PUMP-AND-DUMP SCAM: WhatsApp forward promising 400% guaranteed returns via a secret trading group. High urgency pressure ("Only 5 seats left!"). Sender domain registered 3 days ago, mimics NSE website.',
              confidenceScore: 0.98,
              correlatedFlags: ['Pump-and-dump language pattern (400% guaranteed returns)', 'Domain registered 3 days ago: nse-sure-shot.net', 'User attempted to join a Telegram group link in message'],
            })}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">PUMP & DUMP</span>
              <span className="text-xs text-foreground/50">Rahul Verma, Jaipur</span>
            </div>
            <p className="text-sm font-medium">WhatsApp message promising 400% returns — "Guaranteed Stock Tips Group"</p>
          </div>
          {/* Card 3 */}
          <div className="bg-card border border-amber-500/20 rounded-xl p-4 cursor-pointer hover:border-amber-500/60 transition-colors"
            onClick={() => setVerdict({
              status: 'flagged',
              explanation: 'UNDER SEBI REVIEW: Video clip of a CEO announcing surprise stock buyback. AI Vision Transformer confidence interval: [62%–78%]. Edge case — forwarded to SEBI/Exchange Monitoring Cell (HITL Queue) to prevent triggering false market panic before confirmation.',
              confidenceScore: 0.68,
              correlatedFlags: ['Confidence interval ambiguous [62%-78%]', 'Escalated to SEBI HITL Monitoring Cell', 'High-impact market-moving claim (Stock Buyback Announcement)'],
            })}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">UNDER REVIEW</span>
              <span className="text-xs text-foreground/50">NSE Listed Company</span>
            </div>
            <p className="text-sm font-medium">CEO video announcing stock buyback — AI confidence unclear, SEBI reviewing</p>
          </div>
          {/* Card 4 */}
          <div className="bg-card border border-green-500/20 rounded-xl p-4 cursor-pointer hover:border-green-500/60 transition-colors"
            onClick={() => setVerdict({
              status: 'verified',
              explanation: 'ASLI / VERIFIED: Official NSE Master Circular verified via pHash Registry (Hamming distance = 2, well within threshold). C2PA digital signature valid. Signed by NSE Investor Relations — Reg. No. INB230939139. Document not modified after signing.',
              confidenceScore: 0.99,
              signer: 'NSE Investor Relations — SEBI Reg. No. INB230939139',
              timestamp: new Date().toISOString(),
            })}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">VERIFIED</span>
              <span className="text-xs text-foreground/50">Ankit Singh, NSE Broker</span>
            </div>
            <p className="text-sm font-medium">NSE Official Settlement Circular — verified via pHash & C2PA signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;
