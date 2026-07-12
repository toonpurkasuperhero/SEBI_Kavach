import { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, FileText, X } from 'lucide-react';
import { VerdictCard } from '../components/VerdictCard';

const InvestorDashboard = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'link' | 'text'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verdict, setVerdict] = useState<any>(null);
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setVerdict(null);
    
    try {
      let endpoint = '';
      let payload = {};

      if (activeTab === 'upload') {
        if (!selectedFile) return;
        endpoint = 'http://localhost:8000/api/v1/detect/';
        payload = { channel: 'video', media_url: selectedFile.name };
      } else if (activeTab === 'link') {
        if (!inputValue) return;
        endpoint = 'http://localhost:8000/api/v1/verify/';
        payload = { content_id: inputValue, source_url: inputValue };
      } else {
        if (!inputValue) return;
        endpoint = 'http://localhost:8000/api/v1/detect/';
        payload = { channel: 'text', content_text: inputValue };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (endpoint.includes('verify')) {
        setVerdict({
          status: data.status,
          explanation: data.message,
          signer: data.signer,
          timestamp: data.timestamp,
          contentId: inputValue // Pass this for reporting
        });
      } else {
        setVerdict({
          status: data.risk_level === 'high' ? 'high-risk' : data.risk_level === 'medium' ? 'unverified' : 'verified',
          explanation: data.explanation,
          confidenceScore: data.confidence_score,
          correlatedFlags: data.correlated_flags,
          contentId: inputValue || 'uploaded_media' // Pass this for reporting
        });
      }
    } catch (error) {
      console.error("API Error:", error);
      setVerdict({
        status: 'unverified',
        explanation: 'Failed to connect to SEBI Kavach Backend. Please ensure the API is running.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">Verify Before You Invest</h1>
        <p className="text-foreground/70">
          Upload a video, voice note, or paste a link to check if it's genuinely from SEBI, an exchange, or a registered intermediary.
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-card rounded-2xl p-2 border border-border shadow-sm">
        <div className="flex p-1 space-x-1 bg-background/50 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors ${activeTab === 'upload' ? 'bg-background shadow text-foreground' : 'text-foreground/60 hover:text-foreground'}`}
          >
            <Upload size={18} />
            <span>Upload Media</span>
          </button>
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors ${activeTab === 'link' ? 'bg-background shadow text-foreground' : 'text-foreground/60 hover:text-foreground'}`}
          >
            <LinkIcon size={18} />
            <span>Paste Link</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors ${activeTab === 'text' ? 'bg-background shadow text-foreground' : 'text-foreground/60 hover:text-foreground'}`}
          >
            <FileText size={18} />
            <span>Paste Text</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'upload' && (
            <div 
              className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:bg-background/50 transition-colors cursor-pointer relative"
              onClick={() => !selectedFile && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              
              {selectedFile ? (
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-background border border-border rounded-lg shadow-sm flex items-center space-x-3">
                    <FileText className="text-foreground/70" size={24} />
                    <span className="font-medium">{selectedFile.name}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 hover:bg-card rounded-full ml-4"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-foreground/50">Ready for analysis</p>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto text-foreground/40 mb-4" size={48} />
                  <p className="font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-sm text-foreground/50">Images, MP4, MP3 up to 50MB</p>
                </>
              )}
            </div>
          )}
          
          {(activeTab === 'link' || activeTab === 'text') && (
            <textarea
              className="w-full bg-background border border-border rounded-xl p-4 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder={activeTab === 'link' ? "Paste YouTube, WhatsApp or Telegram link here..." : "Paste the message or email text here..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (activeTab === 'upload' ? !selectedFile : !inputValue)}
              className="bg-foreground text-background px-6 py-2.5 rounded-lg font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center"
            >
              {isAnalyzing ? (
                <>
                  <span className="animate-spin mr-2">⚪</span> Analyzing...
                </>
              ) : (
                'Analyze Content'
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
    </div>
  );
};

export default InvestorDashboard;
