import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Step types
// ─────────────────────────────────────────────────────────────────────────────
type LoginStep = 'email' | 'choose' | 'otp' | 'set-password' | 'password';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const OTP_RESEND_COOLDOWN = 60; // seconds

function StepIndicator({ step }: { step: LoginStep }) {
  const steps: { key: LoginStep; label: string }[] = [
    { key: 'email', label: 'Email' },
    { key: 'otp', label: 'Verify' },
    { key: 'set-password', label: 'Secure' },
  ];
  const activeIndex = step === 'password' ? 2 : steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border transition-all duration-300 ${
              i <= activeIndex
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-transparent border-border text-foreground/40'
            }`}
          >
            {i < activeIndex ? '✓' : i + 1}
          </div>
          <span
            className={`text-xs font-medium transition-colors ${
              i <= activeIndex ? 'text-foreground' : 'text-foreground/40'
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div
              className={`w-8 h-px transition-colors ${
                i < activeIndex ? 'bg-blue-600' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const Login = () => {
  const { sendOtp, verifyOtp, signInWithPassword, setPassword: updateUserPassword, userRole, profile, isLoading } =
    useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && userRole !== 'guest') {
      navigate(userRole === 'admin' ? '/admin' : '/');
    }
  }, [userRole, isLoading, navigate]);

  // OTP resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Step 1: Email ──────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return;

    setIsBusy(true);
    // First try sign-in with a temporary check — offer OTP or password
    // We always send OTP for simplicity; the user can choose to use password if they have one
    const { error: otpError } = await sendOtp(email.trim());
    setIsBusy(false);

    if (otpError) {
      setError(otpError);
      return;
    }

    setInfo(`A 6-digit verification code was sent to ${email}`);
    setResendCooldown(OTP_RESEND_COOLDOWN);
    setStep('otp');
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setIsBusy(true);
    const { error: otpError } = await sendOtp(email.trim());
    setIsBusy(false);
    if (otpError) {
      setError(otpError);
    } else {
      setInfo('A new code was sent to your email.');
      setResendCooldown(OTP_RESEND_COOLDOWN);
    }
  };

  // ── Step 2: OTP ────────────────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setIsBusy(true);
    const { error: verifyError } = await verifyOtp(email.trim(), otp.trim());
    setIsBusy(false);

    if (verifyError) {
      setError('Invalid or expired code. Please try again.');
      return;
    }

    // OTP verified → check if user has a password set yet
    // (Supabase marks no-password users with identities having no password)
    // Safest: always offer set-password on first OTP verify, skip if they came from email+pw flow
    setStep('set-password');
  };

  // ── Step 3a: Set Password (first login) ────────────────────────────────────
  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsBusy(true);
    const { error: pwError } = await updateUserPassword(password);
    setIsBusy(false);

    if (pwError) {
      setError(pwError);
      return;
    }

    // Password set → auth state change fires → useEffect redirects automatically
  };

  // ── Skip set-password (continue without setting one) ──────────────────────
  const handleSkipPassword = () => {
    // Auth state change already fired on OTP verify → redirects
    navigate(profile?.role === 'admin' ? '/admin' : '/');
  };

  // ── Password login (returning user who knows their password) ───────────────
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsBusy(true);
    const { error: loginError } = await signInWithPassword(email.trim(), password);
    setIsBusy(false);

    if (loginError) {
      setError('Incorrect password. Use "Send me a code" to sign in without a password.');
      return;
    }
    // Session fires → useEffect redirects
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-foreground/50" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in zoom-in duration-300 px-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-1">
          <ShieldCheck size={28} className="text-blue-500" />
          <h1 className="text-3xl font-bold">SEBI Kavach</h1>
        </div>
        <p className="text-foreground/60">AI-Powered Trust & Deepfake Detection Platform</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-lg">
        {(step === 'otp' || step === 'set-password') && (
          <StepIndicator step={step} />
        )}

        {/* ── STEP: email ─────────────────────────────────────────────────── */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="mb-5">
              <h2 className="text-lg font-bold">Sign in or create account</h2>
              <p className="text-sm text-foreground/60 mt-1">
                Enter your email — we'll send a verification code.
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-sm font-medium p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="login-email">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50"
                  size={18}
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-2.5 mt-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isBusy ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Send Verification Code <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border" />
              <span className="flex-shrink-0 mx-4 text-foreground/40 text-xs uppercase tracking-wider">
                or
              </span>
              <div className="flex-grow border-t border-border" />
            </div>

            <button
              type="button"
              onClick={() => setStep('password')}
              className="w-full py-2.5 bg-background border border-border text-foreground font-semibold rounded-lg hover:bg-background/80 transition-colors flex items-center justify-center gap-2"
            >
              <Lock size={16} className="text-foreground/60" />
              Sign in with Password
            </button>
          </form>
        )}

        {/* ── STEP: password (returning user) ─────────────────────────────── */}
        {step === 'password' && (
          <form onSubmit={handlePasswordLoginSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="mb-5">
              <h2 className="text-lg font-bold">Welcome back</h2>
              <p className="text-sm text-foreground/60 mt-1">Sign in with your email & password.</p>
            </div>

            {error && (
              <p className="text-red-400 text-sm font-medium p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="pw-email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
                <input
                  id="pw-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="pw-password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
                <input
                  id="pw-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isBusy ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); setPassword(''); }}
              className="w-full py-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              ← Use email code instead
            </button>
          </form>
        )}

        {/* ── STEP: otp ───────────────────────────────────────────────────── */}
        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-4">
              <div className="h-14 w-14 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <KeyRound size={24} className="text-blue-400" />
              </div>
              <h2 className="font-bold text-lg">Check your email</h2>
              {info && (
                <p className="text-sm text-foreground/60 mt-1">{info}</p>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-sm font-medium p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="otp-input">
                6-digit verification code
              </label>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setError('');
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-center tracking-[0.5em] text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
                placeholder="000000"
                autoComplete="one-time-code"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isBusy || otp.length < 6}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isBusy ? <Loader2 size={18} className="animate-spin" /> : 'Verify Code'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                className="text-foreground/60 hover:text-foreground transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isBusy}
                className="flex items-center gap-1.5 text-foreground/60 hover:text-foreground disabled:opacity-40 transition-colors"
              >
                <RefreshCw size={13} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}

        {/* ── STEP: set-password ──────────────────────────────────────────── */}
        {step === 'set-password' && (
          <form onSubmit={handleSetPasswordSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-4">
              <div className="h-14 w-14 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldCheck size={24} className="text-green-400" />
              </div>
              <h2 className="font-bold text-lg">Secure your account</h2>
              <p className="text-sm text-foreground/60 mt-1">
                Set a password so you can sign in faster next time.
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-sm font-medium p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="new-password">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirm-password">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" size={18} />
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-shadow"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= level * 3
                          ? level <= 1
                            ? 'bg-red-500'
                            : level === 2
                            ? 'bg-yellow-500'
                            : level === 3
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                          : 'bg-border'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-foreground/50">
                  {password.length < 4
                    ? 'Too short'
                    : password.length < 7
                    ? 'Weak'
                    : password.length < 10
                    ? 'Good'
                    : 'Strong'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isBusy}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isBusy ? <Loader2 size={18} className="animate-spin" /> : 'Set Password & Continue'}
            </button>

            <button
              type="button"
              onClick={handleSkipPassword}
              className="w-full py-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </form>
        )}
      </div>

      <p className="text-xs text-foreground/40 text-center max-w-sm">
        By signing in you agree to use this platform for investor protection purposes only.
        SEBI Kavach is an AI-assisted fraud detection tool.
      </p>
    </div>
  );
};

export default Login;
