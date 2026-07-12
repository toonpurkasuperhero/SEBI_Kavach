import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, KeyRound, Fingerprint } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [tempRole, setTempRole] = useState<'investor' | 'admin' | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email === 'investor@kavach.in' && password === 'investor123') {
      setTempRole('investor');
      setStep(2);
    } else if (email === 'admin@sebi.gov.in' && password === 'admin123') {
      setTempRole('admin');
      setStep(2);
    } else {
      setError('Invalid email or password.');
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length >= 4) {
      if (tempRole) {
        login(tempRole);
        navigate(tempRole === 'admin' ? '/admin' : '/');
      }
    } else {
      setError('Please enter a valid 4-digit OTP.');
    }
  };

  const handleBiometricLogin = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      if (tempRole) {
        login(tempRole);
        navigate(tempRole === 'admin' ? '/admin' : '/');
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Welcome to SEBI Kavach</h1>
        <p className="text-foreground/60">Select a role to continue the demo</p>
      </div>

      <div className="w-full max-w-md bg-card border border-border p-8 rounded-xl shadow-sm">
        {step === 1 ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm font-medium p-3 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</p>}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full py-2.5 mt-2 bg-foreground text-background font-bold rounded-lg hover:bg-foreground/90 transition-colors">
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                <KeyRound size={28} />
              </div>
              <p className="text-sm text-foreground/80">Enter the 4-digit code sent to your registered device.</p>
            </div>

            {error && <p className="text-red-500 text-sm font-medium p-3 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</p>}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Authentication Code</label>
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-center tracking-[0.5em] text-xl font-bold focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="0000"
                required
              />
            </div>

            <button type="submit" className="w-full py-2.5 mt-2 bg-foreground text-background font-bold rounded-lg hover:bg-foreground/90 transition-colors">
              Verify & Login
            </button>
            
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-foreground/50 text-xs uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <button 
              type="button" 
              onClick={handleBiometricLogin}
              disabled={isScanning}
              className="w-full py-2.5 bg-background border border-border text-foreground font-bold rounded-lg hover:bg-card transition-colors flex justify-center items-center group relative overflow-hidden"
            >
              {isScanning ? (
                <>
                  <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                  <Fingerprint size={24} className="text-blue-500 animate-bounce" />
                  <span className="ml-3 text-blue-500">Scanning...</span>
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 animate-[scan_1.5s_ease-in-out_infinite]"></div>
                </>
              ) : (
                <>
                  <Fingerprint size={20} className="mr-2 text-foreground/70 group-hover:text-blue-500 transition-colors" />
                  Use Biometrics / Fingerprint
                </>
              )}
            </button>

            <button type="button" onClick={() => {setStep(1); setError('');}} className="w-full py-2 text-sm text-foreground/60 hover:text-foreground transition-colors mt-2">
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
