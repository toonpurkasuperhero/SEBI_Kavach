import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  User,
  Shield,
  Send,
  Link as LinkIcon,
  Unlink,
  Copy,
  Check,
  Clock,
  History,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface ScanHistoryItem {
  id: number;
  scan_type: string;
  risk_level: string;
  confidence_score: number;
  trust_category: string | null;
  is_synthetic: boolean;
  input_summary: string | null;
  explanation: string | null;
  created_at: string;
}

const AccountSettings = () => {
  const { user, profile, session, refreshProfile } = useAuth();

  // Telegram link state
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [copied, setCopied] = useState(false);

  // Scan history state
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Countdown timer for link code
  useEffect(() => {
    if (expiresIn <= 0) return;
    const interval = setInterval(() => {
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresIn]);

  // Fetch user's scan history from Supabase
  const fetchScanHistory = useCallback(async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Scan history fetch error:', error);
      } else if (data) {
        setHistory(data as ScanHistoryItem[]);
      }
    } catch (err) {
      console.error('Unexpected history error:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    fetchScanHistory();
  }, [fetchScanHistory]);

  // Generate Telegram link code
  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    setErrorMsg(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`${backendUrl}/api/v1/telegram/generate-link-code`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLinkCode(data.link_code);
        setExpiresIn(data.expires_in_seconds || 600);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.detail || 'Failed to generate link code.');
      }
    } catch (err) {
      setErrorMsg('Could not reach backend API. Make sure server is running.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Check Telegram link status
  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    await refreshProfile();
    await fetchScanHistory();
    setIsCheckingStatus(false);
  };

  // Unlink Telegram account
  const handleUnlinkTelegram = async () => {
    setIsUnlinking(true);
    setErrorMsg(null);
    try {
      const token = session?.access_token;
      const res = await fetch(`${backendUrl}/api/v1/telegram/unlink`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await refreshProfile();
        setLinkCode(null);
        setExpiresIn(0);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.detail || 'Failed to unlink account.');
      }
    } catch (err) {
      setErrorMsg('Could not reach backend API.');
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleCopyCode = () => {
    if (linkCode) {
      navigator.clipboard.writeText(`/link ${linkCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account & Telegram Settings</h1>
        <p className="text-foreground/60 mt-1">
          Manage your profile, connect your Telegram account, and view scan history.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* ── User Profile Card ── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold flex items-center mb-4">
          <User className="mr-2 text-blue-500" size={22} />
          Profile Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-background border border-border rounded-xl">
            <span className="text-foreground/50 text-xs font-semibold uppercase block mb-1">
              Email Address
            </span>
            <span className="font-semibold text-foreground">{user?.email || 'N/A'}</span>
          </div>

          <div className="p-4 bg-background border border-border rounded-xl">
            <span className="text-foreground/50 text-xs font-semibold uppercase block mb-1">
              Role
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 capitalize">
              <Shield size={12} className="mr-1" />
              {profile?.role || 'investor'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Telegram Account Link Card ── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <Send className="mr-2 text-blue-400" size={22} />
            Telegram Bot Link
          </h2>
          {profile?.telegramChatId ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/30">
              <CheckCircle size={14} className="mr-1.5" /> Linked
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertTriangle size={14} className="mr-1.5" /> Not Linked
            </span>
          )}
        </div>

        <p className="text-sm text-foreground/70 mb-6">
          Link your SEBI Kavach Telegram bot to automatically save every stock tip, voice note, and document scan directly to your account.
        </p>

        {profile?.telegramChatId ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-400">Telegram Account Connected</p>
                <p className="text-xs text-foreground/50 font-mono mt-0.5">
                  Chat ID: {profile.telegramChatId}
                  {profile.telegramUsername ? ` (@${profile.telegramUsername})` : ''}
                </p>
              </div>
              <button
                onClick={handleUnlinkTelegram}
                disabled={isUnlinking}
                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
              >
                {isUnlinking ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Unlink size={14} className="mr-1" /> Unlink Telegram
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {!linkCode ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center space-x-2"
                >
                  {isGeneratingCode ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Generating Code...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon size={18} />
                      <span>Generate Telegram Link Code</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-foreground/50">
                  Generates a one-time 6-digit code valid for 10 minutes.
                </p>
              </div>
            ) : (
              <div className="p-6 bg-background border border-blue-500/30 rounded-xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    One-Time Link Code
                  </span>
                  <span className="text-xs font-mono text-foreground/60 flex items-center">
                    <Clock size={12} className="mr-1 text-amber-400" />
                    Expires in: {formatSeconds(expiresIn)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-3xl font-mono font-bold tracking-[0.3em] px-6 py-3 bg-card border border-border rounded-xl text-blue-400">
                    {linkCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-3 bg-card border border-border hover:bg-card/80 rounded-xl text-foreground/70 hover:text-foreground transition-colors flex items-center space-x-1"
                    title="Copy command"
                  >
                    {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                  </button>
                </div>

                <div className="p-4 bg-card border border-border rounded-lg space-y-2 text-sm">
                  <p className="font-semibold">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-foreground/70">
                    <li>Open Telegram and search for your SEBI Kavach Bot.</li>
                    <li>
                      Send the message: <code className="bg-background px-2 py-0.5 rounded text-blue-400 font-mono">/link {linkCode}</code>
                    </li>
                    <li>The bot will confirm your account link instantly!</li>
                  </ol>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleCheckStatus}
                    disabled={isCheckingStatus}
                    className="px-4 py-2 bg-foreground text-background font-semibold rounded-lg text-xs hover:bg-foreground/90 transition-colors flex items-center space-x-1"
                  >
                    {isCheckingStatus ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <RefreshCw size={14} className="mr-1" /> Check Status
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Scan History Section ── */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <History className="mr-2 text-purple-400" size={22} />
            Recent AI Scan History
          </h2>
          <button
            onClick={fetchScanHistory}
            disabled={isLoadingHistory}
            className="p-2 hover:bg-background rounded-lg transition-colors text-foreground/60 hover:text-foreground"
            title="Refresh history"
          >
            <RefreshCw size={16} className={isLoadingHistory ? 'animate-spin' : ''} />
          </button>
        </div>

        {isLoadingHistory ? (
          <div className="py-8 text-center text-foreground/50 flex justify-center items-center space-x-2">
            <Loader2 className="animate-spin" size={20} />
            <span>Loading history...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-border rounded-xl text-foreground/50 text-sm">
            No scan history found. Forward a message or document to the Telegram bot or use the web console to see results here.
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-background border border-border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        item.risk_level === 'high'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30'
                          : item.risk_level === 'medium'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-green-500/10 text-green-400 border-green-500/30'
                      }`}
                    >
                      {item.risk_level} Risk
                    </span>
                    <span className="text-xs text-foreground/50 capitalize font-medium">
                      {item.scan_type} Scan
                    </span>
                    {item.confidence_score && (
                      <span className="text-xs text-foreground/40 font-mono">
                        {(item.confidence_score * 100).toFixed(0)}% conf
                      </span>
                    )}
                  </div>
                  <p className="font-medium truncate text-foreground/90">
                    {item.input_summary || 'Media Content'}
                  </p>
                  {item.explanation && (
                    <p className="text-xs text-foreground/60 line-clamp-2">{item.explanation}</p>
                  )}
                </div>
                <div className="text-xs text-foreground/40 shrink-0 font-mono">
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
