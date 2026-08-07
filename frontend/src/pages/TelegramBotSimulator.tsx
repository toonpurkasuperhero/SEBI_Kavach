import { useState } from 'react';
import { Send, Mic, ShieldCheck, AlertTriangle, Clock, ExternalLink, CheckCheck, MessageSquare } from 'lucide-react';
import { cn } from '../utils';

interface ChatMessage {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  type: 'normal' | 'alert' | 'safe' | 'review' | 'tier1';
  isAudio?: boolean;
  timestamp: string;
}

const TelegramBotSimulator = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'bot',
      text: '🛡️ Namaste! Welcome to SEBI Kavach Verification Bot.\n\nForward any stock tip, voice call, circular screenshot, or video URL here. I will check if it is ASLI (Genuine) or NAKLI (Fake Deepfake).',
      type: 'normal',
      timestamp: '09:00 AM'
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const getCurrentTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const simulateForward = (contentType: 'audio' | 'link' | 'fake_video' | 'custom', customText?: string) => {
    const userMsgText = customText || (
      contentType === 'audio' ? '🎤 Forwarded Voice Note (0:32s)' :
      contentType === 'fake_video' ? '📹 Forwarded CEO Video: "Exclusive Earnings Leak"' :
      'https://nse-official-id-123.com'
    );

    const userMsgId = Date.now();
    const botTier1Id = userMsgId + 1;
    const botTier2Id = userMsgId + 2;

    setMessages(prev => [...prev, {
      id: userMsgId,
      sender: 'user',
      text: userMsgText,
      type: 'normal',
      isAudio: contentType === 'audio',
      timestamp: getCurrentTime()
    }]);

    setIsProcessing(true);

    // Tier 1 (<200ms)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: botTier1Id,
        sender: 'bot',
        text: '⚡ [Instant Check <150ms]\nChecking pHash media fingerprint & checking SEBI Trust Registry...\n\nRunning Deep AI Vision & Voice Scan...',
        type: 'tier1',
        timestamp: getCurrentTime()
      }]);
    }, 200);

    // Tier 2 (<1500ms)
    setTimeout(() => {
      setIsProcessing(false);
      let finalResponseText = '';
      let finalType: 'alert' | 'safe' | 'review' = 'safe';

      if (contentType === 'audio') {
        finalResponseText = '🚨 NAKLI AAWAZ / FAKE VOICE CLONE ALERT!\n\n• Warning: This voice note was created by an AI computer model (Cloned Voice).\n• Danger: Scammers clone CEO/SEBI voices to ask for money or OTPs.\n• Action: Do NOT transfer money or share OTP!';
        finalType = 'alert';
      } else if (contentType === 'fake_video') {
        finalResponseText = '🟧 DHYAN DEIN: UNDER SEBI REVIEW\n\n• Notice: This video claims urgent CEO earnings news. Our team is double checking with SEBI officers.\n• Action: Wait for official news on NSE/BSE website before trading.';
        finalType = 'review';
      } else {
        finalResponseText = '✅ ASLI (100% VERIFIED OFFICIAL MEDIA)\n\n• Signed By: NSE Investor Relations\n• Status: Verified genuine by SEBI Kavach Registry.\n• Safe to trust and share.';
        finalType = 'safe';
      }

      setMessages(prev => prev.map(msg => 
        msg.id === botTier1Id 
          ? {
              id: botTier2Id,
              sender: 'bot',
              text: finalResponseText,
              type: finalType,
              timestamp: getCurrentTime(),
            }
          : msg
      ));
    }, 1500);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    const text = inputUrl.trim();
    setInputUrl('');
    
    if (text.toLowerCase().includes('fake') || text.toLowerCase().includes('audio')) {
      simulateForward('audio', text);
    } else if (text.toLowerCase().includes('sebi') || text.toLowerCase().includes('ceo')) {
      simulateForward('fake_video', text);
    } else {
      simulateForward('link', text);
    }
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-6 max-w-2xl">
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-semibold mb-3">
          <MessageSquare size={14} className="text-blue-400" />
          <span>Real Bot Active on Telegram</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight">Telegram Verification Channel</h2>
        <p className="text-foreground/60 text-sm mt-1">
          Simple, zero-install verification built for investors across Tier-1 to Tier-3 cities.
        </p>

        {/* PROMINENT LIVE TELEGRAM BOT LINK BUTTON */}
        <div className="mt-4 flex justify-center">
          <a
            href="https://t.me/sebi_kavach_verification_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 border border-blue-400/30 group"
          >
            <Send size={16} className="group-hover:translate-x-0.5 transition-transform" />
            <span>Open Live Bot in Telegram (@sebi_kavach_verification_bot)</span>
            <ExternalLink size={14} className="ml-1 opacity-70" />
          </a>
        </div>
      </div>

      <div className="w-full max-w-md h-[650px] border-[10px] border-[#1c2733] rounded-[2.5rem] bg-[#0e1621] overflow-hidden flex flex-col relative shadow-2xl">
        {/* Telegram Header */}
        <div className="bg-[#17212b] p-4 flex items-center justify-between border-b border-[#242f3d] z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <h3 className="font-semibold text-white text-sm">SEBI Kavach Bot</h3>
                <span className="bg-blue-500 text-white rounded-full p-[2px] text-[10px]">✓</span>
              </div>
              <p className="text-[11px] text-blue-400 font-medium">@sebi_kavach_verification_bot</p>
            </div>
          </div>
          <a 
            href="https://t.me/sebi_kavach_verification_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs bg-[#2b5278] hover:bg-[#34608c] text-white px-2.5 py-1 rounded-md transition-colors"
          >
            Open Telegram
          </a>
        </div>

        {/* Telegram Messages Container */}
        <div className="flex-1 bg-[#0e1621] overflow-y-auto p-4 space-y-3 pb-24 text-sm font-sans" style={{ backgroundImage: 'radial-gradient(#17212b 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sender === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[88%] rounded-2xl p-3 shadow-md transition-all duration-300 relative",
                msg.sender === 'user' ? "bg-[#2b5278] text-white rounded-br-none" : "bg-[#182533] text-gray-100 rounded-bl-none border border-[#2b394a]",
                msg.type === 'alert' && "border-l-4 border-l-red-500 bg-[#25151a]",
                msg.type === 'safe' && "border-l-4 border-l-emerald-500 bg-[#12251e]",
                msg.type === 'review' && "border-l-4 border-l-amber-500 bg-[#262014]",
                msg.type === 'tier1' && "border-l-4 border-l-blue-400 bg-[#17212b] animate-pulse"
              )}>
                {msg.type === 'alert' && (
                  <div className="flex items-center text-red-400 text-xs font-bold mb-2">
                    <AlertTriangle size={14} className="mr-1" /> 🚨 NAKLI / SCAM ALERT
                  </div>
                )}
                {msg.type === 'safe' && (
                  <div className="flex items-center text-emerald-400 text-xs font-bold mb-2">
                    <ShieldCheck size={14} className="mr-1" /> ✅ ASLI / 100% VERIFIED
                  </div>
                )}
                {msg.type === 'review' && (
                  <div className="flex items-center text-amber-400 text-xs font-bold mb-2">
                    <Clock size={14} className="mr-1" /> 🟧 DHYAN DEIN / UNDER SEBI REVIEW
                  </div>
                )}

                <p className="whitespace-pre-line leading-relaxed text-[13px]">{msg.text}</p>

                <div className="flex items-center justify-end space-x-1 mt-2 text-[10px] text-gray-400">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'user' && <CheckCheck size={14} className="text-blue-400" />}
                </div>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-[#182533] text-blue-400 rounded-2xl rounded-bl-none p-3 text-xs flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                <span>Checking AI Model...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Presets */}
        <div className="absolute bottom-16 left-0 right-0 p-2 bg-[#17212b]/95 border-t border-[#242f3d] flex justify-around space-x-1 backdrop-blur-sm z-10">
          <button 
            onClick={() => simulateForward('link')}
            className="flex-1 py-1.5 bg-[#2b5278] hover:bg-[#34608c] text-white rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <ExternalLink size={12} /> <span>Official Circular</span>
          </button>
          <button 
            onClick={() => simulateForward('audio')}
            className="flex-1 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <Mic size={12} /> <span>Fake Voice Note</span>
          </button>
          <button 
            onClick={() => simulateForward('fake_video')}
            className="flex-1 py-1.5 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <AlertTriangle size={12} /> <span>Market CEO News</span>
          </button>
        </div>

        {/* Text Input Footer */}
        <form onSubmit={handleCustomSubmit} className="absolute bottom-0 left-0 right-0 p-3 bg-[#17212b] border-t border-[#242f3d] flex items-center space-x-2 z-10">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Forward text or paste link here..."
            className="flex-1 bg-[#0e1621] text-white placeholder-gray-500 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button 
            type="submit"
            className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TelegramBotSimulator;
