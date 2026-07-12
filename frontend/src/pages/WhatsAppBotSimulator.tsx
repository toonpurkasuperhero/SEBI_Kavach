import { useState } from 'react';
import { Link2, Mic, Bot, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cn } from '../utils';

const WhatsAppBotSimulator = () => {
  const [messages, setMessages] = useState<{sender: 'user' | 'bot', text: string, type: 'normal' | 'alert' | 'safe', isAudio?: boolean}[]>([
    { sender: 'bot', text: 'Hi! I am the SEBI Kavach Bot. Forward me any suspicious trading tips, URLs, or voice notes, and I will verify them for you instantly.', type: 'normal' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const simulateForward = (contentType: 'audio' | 'link') => {
    let userMsg = '';
    let botResponse = '';
    let responseType: 'alert' | 'safe' = 'safe';

    if (contentType === 'audio') {
      userMsg = 'Voice note forwarded (0:45s)';
      botResponse = 'HIGH RISK: Our audio analysis detects an AI-generated voice clone. This pitch variance is 92% synthetic. Do NOT transfer funds or share OTPs.';
      responseType = 'alert';
    } else {
      userMsg = 'https://nse-official-id-123.com';
      botResponse = 'VERIFIED: This link is signed and authenticated by the Trust Registry. It belongs to NSE Investor Relations.';
      responseType = 'safe';
    }

    setMessages(prev => [...prev, { sender: 'user', text: userMsg, type: 'normal', isAudio: contentType === 'audio' }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse, type: responseType }]);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">"Forward-to-Verify" Bot</h2>
        <p className="text-foreground/60">Simulating the retail investor experience on WhatsApp</p>
      </div>

      <div className="w-full max-w-sm h-[600px] border-[8px] border-foreground rounded-[2.5rem] bg-[#0b141a] overflow-hidden flex flex-col relative shadow-2xl">
        {/* Chat Header */}
        <div className="bg-[#202c33] p-4 flex items-center space-x-3 z-10">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-white">SEBI Kavach ✓</h3>
            <p className="text-xs text-gray-400">Official Bot Account</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-[#0b141a] overflow-y-auto p-4 space-y-4 pb-24" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover', opacity: 0.9 }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={cn("flex", msg.sender === 'user' ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-[85%] rounded-lg p-3 text-sm shadow-sm flex flex-col",
                msg.sender === 'user' ? "bg-[#005c4b] text-white rounded-tr-none" : "bg-[#202c33] text-gray-100 rounded-tl-none",
                msg.type === 'alert' && "border border-red-500 bg-[#3a1c1c]",
                msg.type === 'safe' && "border border-green-500 bg-[#1c3a26]"
              )}>
                {msg.isAudio && <div className="mb-1"><Mic className="inline-block mr-2 text-gray-300" size={16} /></div>}
                
                {msg.type === 'alert' && <div className="flex items-center text-red-400 font-bold mb-1"><AlertTriangle size={16} className="mr-1"/> ALERT</div>}
                {msg.type === 'safe' && <div className="flex items-center text-green-400 font-bold mb-1"><ShieldCheck size={16} className="mr-1"/> VERIFIED</div>}
                
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#202c33] text-gray-400 rounded-lg rounded-tl-none p-3 text-sm italic">
                Analyzing content...
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#202c33] flex justify-between space-x-2">
          <button 
            onClick={() => simulateForward('link')}
            className="flex-1 py-2 bg-[#00a884] text-white rounded-full text-xs font-bold hover:bg-[#008f6f] transition-colors flex items-center justify-center"
          >
            <Link2 size={14} className="mr-1"/> Fwd Link
          </button>
          <button 
            onClick={() => simulateForward('audio')}
            className="flex-1 py-2 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            <Mic size={14} className="mr-1"/> Fwd Audio
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppBotSimulator;
