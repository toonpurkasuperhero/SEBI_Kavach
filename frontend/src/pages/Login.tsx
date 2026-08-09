import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
  CheckCircle,
  Sparkles,
} from 'lucide-react';

const Login = () => {
  const { sendOtp, signInWithPassword, userRole, isLoading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'magic-link' | 'password'>('magic-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && userRole !== 'guest') {
      navigate(userRole === 'admin' ? '/admin' : '/');
    }
  }, [userRole, isLoading, navigate]);

  // ── Send Email Magic Link ──────────────────────────────────────────────────
  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return;

    setIsBusy(true);
    const { error: sendError } = await sendOtp(email.trim());
    setIsBusy(false);

    if (sendError) {
      setError(sendError);
      return;
    }

    setEmailSent(true);
  };

  // ── Password Login ────────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) return;

    setIsBusy(true);
    const { error: loginError } = await signInWithPassword(email.trim(), password);
    setIsBusy(false);

    if (loginError) {
      setError('Invalid email or password. If you haven\'t set a password yet, use the Magic Link option.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-foreground/50" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-6 animate-in fade-in zoom-in duration-300 px-4">
      {/* Header */}
      <div className="text-center space-y-2 max-w-md">
        <div className="flex items-center justify-center gap-2 mb-1">
          <ShieldCheck size={32} className="text-blue-500" />
          <h1 className="text-3xl font-bold">SEBI Kavach</h1>
        </div>
        <p className="text-foreground/60 text-sm">
          Regulator-Anchored AI Detection & Investor Protection Platform
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-xl">
        {/* Mode Switcher Tabs */}
        <div className="flex p-1 bg-background border border-border rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('magic-link');
              setError('');
              setEmailSent(false);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'magic-link'
                ? 'bg-blue-600 text-white shadow'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <Sparkles size={14} />
            Email Verification Link
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('password');
              setError('');
              setEmailSent(false);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'password'
                ? 'bg-blue-600 text-white shadow'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <Lock size={14} />
            Email & Password
          </button>
        </div>

        {/* ── Mode 1: Magic Link ────────────────────────────────────────────── */}
        {mode === 'magic-link' && (
          <>
            {emailSent ? (
              <div className="text-center space-y-4 py-4 animate-in fade-in">
                <div className="h-16 w-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto text-green-400">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Check your inbox!</h2>
                  <p className="text-sm text-foreground/70 mt-2">
                    We sent a verification link to <strong className="text-blue-400">{email}</strong>.
                  </p>
                </div>

                <div className="p-4 bg-background border border-border rounded-xl text-left space-y-2 text-xs text-foreground/70">
                  <p className="font-semibold text-foreground">Next Steps:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open your email inbox.</li>
                    <li>Click the <strong>"Sign In"</strong> link inside the email.</li>
                    <li>You will be logged into SEBI Kavach automatically!</li>
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="text-xs text-foreground/50 hover:text-foreground underline pt-2"
                >
                  Entered wrong email? Try again
                </button>
              </div>
            ) : (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                <div className="mb-2">
                  <h2 className="text-lg font-bold">Sign In or Register</h2>
                  <p className="text-xs text-foreground/60 mt-1">
                    Enter your email. We'll send you a instant login link — no password needed!
                  </p>
                </div>

                {error && (
                  <p className="text-red-400 text-xs font-medium p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    {error}
                  </p>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-foreground/70" htmlFor="magic-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40"
                      size={18}
                    />
                    <input
                      id="magic-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                      placeholder="investor@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                >
                  {isBusy ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Send Login Link <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* ── Mode 2: Password Login ────────────────────────────────────────── */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="mb-2">
              <h2 className="text-lg font-bold">Sign In with Password</h2>
              <p className="text-xs text-foreground/60 mt-1">
                Enter your registered email and password to log in directly.
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-xs font-medium p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-foreground/70" htmlFor="pw-email">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40"
                  size={18}
                />
                <input
                  id="pw-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  placeholder="investor@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-foreground/70" htmlFor="pw-password">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40"
                  size={18}
                />
                <input
                  id="pw-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
            >
              {isBusy ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
            </button>
          </form>
        )}
      </div>

      <p className="text-xs text-foreground/40 text-center max-w-sm">
        SEBI Kavach — AI-Driven Securities Protection Engine.
      </p>
    </div>
  );
};

export default Login;
