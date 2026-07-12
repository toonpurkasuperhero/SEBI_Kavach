import { useState } from 'react';
import { Activity, Users, Shield, ArrowUpRight, ShieldAlert, Key, AlertOctagon, Database, X, CheckCircle } from 'lucide-react';

const AdminConsole = () => {
  const [keys, setKeys] = useState<{id: string, date: string}[]>([]);
  const [showRevoked, setShowRevoked] = useState(false);

  const [incidents, setIncidents] = useState([
    { id: 'INC-001', type: 'Deepfake Video Correlation', time: '2 hrs ago', details: 'User U-102 reported a deepfake video of CEO talking about stock splits.' },
    { id: 'INC-002', type: 'Phishing Campaign Detected', time: '5 hrs ago', details: 'Mass SMS blast impersonating SEBI, targeting 500+ investors.' },
    { id: 'INC-003', type: 'Suspicious Demat Activity', time: '1 day ago', details: 'Unusual login location from Russia for user U-449.' }
  ]);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  const [threats, setThreats] = useState([
    {
      id: 'THR-881',
      user: 'U-8819',
      timeline: [
        { time: '10:00:12 AM', title: 'Deepfake Video Clicked', desc: 'User clicked on a flagged Telegram video (Confidence: 0.94)', icon: ShieldAlert, color: 'yellow' },
        { time: '10:02:45 AM', title: 'Broker API Webhook: Login', desc: 'Successful login detected at Zerodha (IP: 103.11.22.4)', icon: Users, color: 'blue' },
        { time: '10:05:10 AM', title: 'Auto-Escalation: Suspicious Transfer Initiated', desc: '₹50,000 transfer requested to unverified payee. System has frozen the transaction pending review.', icon: Database, color: 'red' }
      ]
    },
    {
      id: 'THR-882',
      user: 'U-9921',
      timeline: [
        { time: '02:15:00 PM', title: 'Malicious Link Clicked', desc: 'User clicked phishing link via SMS (Confidence: 0.99)', icon: ShieldAlert, color: 'yellow' },
        { time: '02:18:30 PM', title: 'Broker API Webhook: Password Reset', desc: 'Password reset initiated via OTP.', icon: Key, color: 'red' }
      ]
    }
  ]);

  const generateKey = () => {
    const newKey = {
      id: 'KEY-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      date: new Date().toLocaleDateString()
    };
    setKeys([newKey, ...keys]);
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin & Intermediary Console</h1>
        <p className="text-foreground/70 mt-1">Manage signing keys, monitor correlated alerts, and review ShieldTrain metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-foreground/60 mb-1">Active Alerts</p>
              <h3 className="text-3xl font-bold">24</h3>
            </div>
            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
              <ShieldAlert size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-red-500 font-medium">
            <ArrowUpRight size={16} className="mr-1" />
            <span>+12% from last week</span>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-foreground/60 mb-1">Items Verified</p>
              <h3 className="text-3xl font-bold">14,209</h3>
            </div>
            <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
              <Shield size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-500 font-medium">
            <ArrowUpRight size={16} className="mr-1" />
            <span>Trust Registry Active</span>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-foreground/60 mb-1">ShieldTrain Completion</p>
              <h3 className="text-3xl font-bold">68%</h3>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <Users size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-foreground/60 font-medium">
            <Activity size={16} className="mr-1" />
            <span>Across 1.2M opted-in users</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Recent Escalated Incidents</h3>
          <div className="space-y-4">
             {incidents.length > 0 ? incidents.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-background/50">
                  <div>
                    <p className="font-medium text-sm">{incident.type}</p>
                    <p className="text-xs text-foreground/60">ID: {incident.id} • {incident.time}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedIncident(incident)}
                    className="text-xs font-medium px-3 py-1.5 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
                  >
                    Review
                  </button>
                </div>
             )) : (
                <p className="text-sm text-foreground/50 italic">No pending incidents.</p>
             )}
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Trust Registry Management</h3>
          <div className="flex flex-col space-y-4">
            <p className="text-sm text-foreground/80 mb-2">Manage C2PA signing certificates for intermediaries.</p>
            <button 
              onClick={generateKey}
              className="w-full py-2 bg-foreground text-background font-medium rounded-lg text-sm flex items-center justify-center hover:bg-foreground/90 transition-colors">
               <Shield size={16} className="mr-2"/> Generate New Signing Key
            </button>
            
            {keys.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-foreground/60 uppercase">Active Keys</p>
                {keys.map(key => (
                  <div key={key.id} className="flex items-center justify-between p-2 bg-background/50 border border-border/50 rounded text-sm">
                    <span className="font-mono flex items-center"><Key size={14} className="mr-2 text-green-500"/> {key.id}</span>
                    <span className="text-xs text-foreground/50">{key.date}</span>
                  </div>
                ))}
              </div>
            )}

             <button 
               onClick={() => setShowRevoked(!showRevoked)}
               className="w-full py-2 bg-background border border-border font-medium rounded-lg text-sm flex items-center justify-center text-foreground hover:bg-card transition-colors mt-4">
               {showRevoked ? 'Hide Revoked Keys' : 'View Revoked Keys'}
            </button>

            {showRevoked && (
              <div className="mt-2 space-y-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-red-500 line-through">KEY-98A7B2</span>
                  <span className="text-xs text-red-500/70">Revoked on 2026-07-01</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-red-500 line-through">KEY-44C1X9</span>
                  <span className="text-xs text-red-500/70">Revoked on 2026-06-15</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-xl font-bold">Live Transaction Correlation Alerts</h3>
           {threats.length > 0 && <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">{threats.length} ACTIVE THREATS</span>}
        </div>
        
        {threats.length === 0 ? (
           <div className="bg-card border border-border rounded-xl p-8 text-center text-foreground/60 flex flex-col items-center">
             <CheckCircle size={32} className="text-green-500 mb-3" />
             <p>All clear. No active threats detected.</p>
           </div>
        ) : (
          threats.map(threat => (
            <div key={threat.id} className="bg-card border border-red-500/20 rounded-xl overflow-hidden">
              <div className="p-4 bg-red-500/5 border-b border-red-500/20 flex items-center justify-between">
                <h3 className="font-bold flex items-center text-red-500"><AlertOctagon size={18} className="mr-2" /> Threat Alert for {threat.user}</h3>
                <span className="text-xs text-foreground/50 font-mono">ID: {threat.id}</span>
              </div>
              <div className="p-6">
                <p className="text-sm text-foreground/80 mb-6">DetectNet has auto-escalated this threat due to high-risk sequenced behavior.</p>
                
                <div className="relative border-l-2 border-border ml-4 space-y-8 pb-4">
                  {threat.timeline.map((event, idx) => {
                    const Icon = event.icon;
                    return (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-[25px] bg-background border-2 border-${event.color}-500 rounded-full p-1`}>
                          <Icon size={16} className={`text-${event.color}-500`} />
                        </div>
                        <div className="pl-6">
                          <p className="text-xs text-foreground/50 font-mono mb-1">{event.time}</p>
                          <p className={`text-sm font-bold ${event.color === 'red' ? 'text-red-500' : ''}`}>{event.title}</p>
                          <p className="text-sm text-foreground/70">{event.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-end space-x-3">
                   <button 
                     onClick={() => setThreats(threats.filter(t => t.id !== threat.id))}
                     className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-card transition-colors">
                       Dismiss Alert
                   </button>
                   <button 
                     onClick={() => setThreats(threats.filter(t => t.id !== threat.id))}
                     className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                       Confirm Fraud & Block User
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Incident Review Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl p-6 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setSelectedIncident(null)} className="absolute top-4 right-4 text-foreground/50 hover:text-foreground">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-1">Incident Review</h3>
            <p className="text-xs text-foreground/50 font-mono mb-4">{selectedIncident.id} • {selectedIncident.time}</p>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-foreground/70 uppercase">Incident Type</p>
                <p className="text-lg font-medium">{selectedIncident.type}</p>
              </div>
              <div className="bg-background border border-border p-4 rounded-lg">
                <p className="text-sm text-foreground/80">{selectedIncident.details}</p>
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  onClick={() => setSelectedIncident(null)} 
                  className="px-4 py-2 bg-background border border-border font-medium rounded-lg text-sm hover:bg-card">
                  Close
                </button>
                <button 
                  onClick={() => {
                    setIncidents(incidents.filter(i => i.id !== selectedIncident.id));
                    setSelectedIncident(null);
                  }}
                  className="px-4 py-2 bg-foreground text-background font-medium rounded-lg text-sm hover:bg-foreground/90">
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
