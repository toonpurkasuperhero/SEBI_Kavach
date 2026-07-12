import { useState } from 'react';
import { ShieldCheck, Heart, MessageCircle, Repeat, Share, X } from 'lucide-react';

const SocialExtensionMock = () => {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Social Media Extension</h2>
        <p className="text-foreground/60">Simulating the browser extension verifying C2PA signatures on social platforms</p>
      </div>

      <div className="w-full max-w-lg bg-card border border-border rounded-xl shadow-lg overflow-hidden relative">
        {/* Fake Browser header */}
        <div className="bg-background/80 border-b border-border p-3 flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 bg-background border border-border rounded text-xs px-3 py-1.5 text-center font-mono text-foreground/50">
            x.com/sebi_india
          </div>
        </div>

        {/* Fake Post */}
        <div className="p-5">
          <div className="flex space-x-3">
            <div className="w-12 h-12 bg-blue-900 rounded-full flex items-center justify-center font-bold text-white shadow-inner">
              SEBI
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-1 relative">
                <span className="font-bold hover:underline cursor-pointer">SEBI</span>
                <span className="text-foreground/50 text-sm">@sebi_india · 2h</span>
                
                {/* The Extension Badge */}
                <button 
                  onClick={() => setShowPopover(!showPopover)}
                  className="ml-2 relative inline-flex items-center justify-center p-1 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all border border-green-500/30 group shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                >
                  <ShieldCheck size={16} />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    VerifyNet Signature Found
                  </span>
                </button>

                {/* Popover */}
                {showPopover && (
                  <div className="absolute top-8 left-0 w-72 bg-card border border-green-500/50 shadow-2xl rounded-xl p-4 z-20 animate-in fade-in slide-in-from-top-2">
                    <button onClick={() => setShowPopover(false)} className="absolute top-2 right-2 text-foreground/50 hover:text-foreground">
                      <X size={16} />
                    </button>
                    <div className="flex items-center space-x-2 mb-3 border-b border-border/50 pb-2">
                      <ShieldCheck className="text-green-500" size={24} />
                      <h4 className="font-bold text-sm">Authentic Content</h4>
                    </div>
                    <div className="space-y-2 text-xs font-mono text-foreground/80">
                      <p><span className="text-foreground/50">Signer:</span> Securities and Exchange Board of India</p>
                      <p><span className="text-foreground/50">Protocol:</span> C2PA v1.3</p>
                      <p><span className="text-foreground/50">Timestamp:</span> {new Date().toLocaleString()}</p>
                      <p className="pt-2 text-green-500 font-sans font-medium text-[10px] uppercase tracking-wider">Cryptographic Signature Valid</p>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="mt-2 text-[15px] leading-relaxed">
                We have issued a new circular regarding the T+0 settlement cycle. All investors are advised to read the official document on our website. Beware of fake circulars circulating on WhatsApp.
              </p>
              
              <div className="mt-3 bg-background border border-border rounded-xl h-32 flex items-center justify-center text-foreground/30 overflow-hidden relative">
                <img src="/logo.png" alt="SEBI Doc" className="opacity-10 w-24 h-24 object-contain" />
                <span className="absolute inset-0 flex items-center justify-center font-semibold border-2 border-foreground/10 m-4 rounded">Circular Document preview</span>
              </div>
              
              <div className="flex justify-between mt-4 text-foreground/50 max-w-md">
                <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors"><MessageCircle size={18} /> <span>142</span></button>
                <button className="flex items-center space-x-2 hover:text-green-500 transition-colors"><Repeat size={18} /> <span>89</span></button>
                <button className="flex items-center space-x-2 hover:text-red-500 transition-colors"><Heart size={18} /> <span>1.2k</span></button>
                <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors"><Share size={18} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialExtensionMock;
