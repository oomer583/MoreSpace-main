import React, { useState, useEffect, useRef } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  useNavigate, 
  Navigate 
} from 'react-router-dom';
import { 
  Shield, 
  Trash2, 
  RefreshCw, 
  Terminal, 
  HardDrive, 
  Search, 
  AlertCircle,
  CheckCircle2,
  Layers,
  Cpu,
  Monitor,
  Key,
  Mail,
  Users,
  Plus,
  ArrowRight,
  ChevronRight,
  LogOut,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---

type CleanStatus = 'idle' | 'scanning' | 'ready' | 'cleaning' | 'done';

interface Directory {
  id: string;
  name: string;
  path: string;
  icon: React.ElementType;
  description: string;
  baseSize: number; // in MB
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

// --- Constants ---

// NOT: Buradaki URL sizin gerçek 'Shared App URL'iniz olmalıdır.
const PROD_URL = 'https://ais-pre-7amllufbqsrzegzup4k6z5-22751828229.europe-west1.run.app';

const API_BASE_URL = typeof window !== 'undefined' && (window.location.origin.includes('localhost') || window.location.origin.includes('run.app'))
  ? '' 
  : PROD_URL;

const DIRECTORIES: Directory[] = [
  { 
    id: 'win-temp', 
    name: 'Windows Temp Dosyaları', 
    path: 'C:\\Windows\\Temp', 
    icon: HardDrive, 
    description: 'İşletim sistemi geçici (temp) yükleme ve log dosyaları.',
    baseSize: 1240 
  },
  { 
    id: 'prefetch', 
    name: 'Prefetch Cache', 
    path: 'C:\\Windows\\Prefetch', 
    icon: RefreshCw, 
    description: 'Uygulama başlatma hızlandırma verileri ve prefetch cache dosyaları.',
    baseSize: 450 
  },
  { 
    id: 'user-temp', 
    name: 'User Temp Klasörü', 
    path: '%LocalAppData%\\Temp', 
    icon: Layers, 
    description: 'Aktif kullanıcı uygulamaları tarafından oluşturulan temp dosyaları.',
    baseSize: 2800 
  },
  { 
    id: 'windows-update', 
    name: 'Windows Update Dosyaları', 
    path: 'C:\\Windows\\SoftwareDistribution\\Download', 
    icon: Shield, 
    description: 'İndirilen Windows Update paketleri ve indirilen (download) yüklemeler.',
    baseSize: 4200 
  },
  { 
    id: 'nvidia-cache', 
    name: 'NVIDIA GL Cache', 
    path: '%LocalAppData%\\NVIDIA\\GLCache', 
    icon: Monitor, 
    description: 'NVIDIA grafik sürücüleri için shader cache ve telemetri günlükleri.',
    baseSize: 890 
  }
];

// --- Sub-Components ---

// 1. GATE / LANDING PAGE
const EmailGate = () => {
  const [keyCode, setKeyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyCode) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyCode })
      });
      const data = await res.json();

      if (res.status !== 200) {
        setError(data.error || 'Geçersiz anahtar.');
        return;
      }

      if (data.role === 'admin') {
        localStorage.setItem('admin_auth', 'true');
        navigate('/admin');
      } else if (data.role === 'user') {
        localStorage.setItem('user_key', keyCode);
        localStorage.setItem('session_expiry', data.expiresAt);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Sistem hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] shadow-2xl relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <img 
              src="https://i.ibb.co/RkNcLGt3/0712025c-2dcc-4de3-bda3-bcdb796a7d1f.png" 
              alt="Logo" 
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Sistem Erişimi</h1>
          <p className="text-white/50 text-sm">Devam etmek için geçerli bir kullanım anahtarı (Usage Key) girmeniz gerekmektedir.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text"
              required
              placeholder="Usage Key örneği: ABCD-1234..."
              className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-2xl py-5 pl-12 pr-6 text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-mono tracking-wider`}
              value={keyCode}
              onChange={(e) => setKeyCode(e.target.value.toUpperCase())}
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-red-400 text-xs font-semibold bg-red-400/10 p-3 rounded-xl border border-red-400/20">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-4">
            <button 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>SİSTEME ERİŞİM SAĞLA</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <a 
              href="https://morespacekeypanel.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors py-2"
            >
              Kullanım anahtarınız (Key) yok mu? Buradan oluşturun.
            </a>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Secure Access System v1.2</p>
        </div>
      </motion.div>
    </div>
  );
};

// 2. ADMIN PANEL
const AdminPanel = () => {
  const [stats, setStats] = useState({ usersCount: 0, tokensCount: 0, lastTokens: [] as any[] });
  const [tokenInput, setTokenInput] = useState({ duration: 30, type: 'paid' });
  const [generatedToken, setGeneratedToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('admin_auth') !== 'true') navigate('/');
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
  };

  const generateToken = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/generate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationDays: tokenInput.duration, type: tokenInput.type })
      });
      const data = await res.json();
      setGeneratedToken(data.token);
      fetchStats();
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
              <Key className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Admin Kontrol Paneli</h1>
              <p className="text-white/40 text-sm">Sistem token ve kullanıcı yönetimi</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 transition-all font-bold flex items-center gap-2"
          >
            <span>ÇIKIŞ</span>
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white/30 uppercase tracking-widest mb-6">Genel Durum</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-semibold text-white/40">Aktif Kullanıcılar</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.usersCount}</p>
                </div>
                <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Key className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-white/40">Toplam Anahtarlar</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.tokensCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-xl">
              <h3 className="text-sm font-bold text-white/30 uppercase tracking-widest mb-6">Yeni Anahtar Üret</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/40 block mb-2 px-1">Süre (Gün)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[7, 30, 365].map(d => (
                      <button 
                        key={d}
                        onClick={() => setTokenInput({...tokenInput, duration: d})}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all ${tokenInput.duration === d ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                      >
                        {d === 365 ? '1 Yıl' : `${d} G`}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={generateToken}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>TOKEN OLUŞTUR</span>
                </button>
                {generatedToken && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Oluşturuldu</p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-sm font-bold text-white tracking-widest bg-black/30 px-2 py-1 rounded">{generatedToken}</span>
                      <button onClick={() => {navigator.clipboard.writeText(generatedToken)}} className="p-2 hover:bg-white/5 rounded-lg transition-colors"><RefreshCw className="w-4 h-4" /></button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl h-full">
              <h3 className="text-sm font-bold text-white/30 uppercase tracking-widest mb-8">Son Oluşturulan Anahtarlar</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {stats.lastTokens.length === 0 && <p className="text-white/20 text-center py-12 italic">Henüz anahtar oluşturulmamış.</p>}
                {stats.lastTokens.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5 group hover:border-white/10 transition-all text-xs">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${t.isUsed ? 'bg-white/5 text-white/20' : 'bg-blue-500/20 text-blue-400'}`}>
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-mono font-bold tracking-widest text-white/90">{t.code}</p>
                        <p className="text-[9px] text-white/30 uppercase font-bold tracking-wider mt-1">
                          {t.durationDays} Gün • {t.type} • {t.isUsed ? (
                            <span className="text-red-400/50">KULLANILDI</span>
                          ) : (
                            <span className="text-emerald-400/50">AKTİF</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {!t.isUsed && (
                      <button 
                        onClick={() => {navigator.clipboard.writeText(t.code)}}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Plus className="w-4 h-4 text-white/40 rotate-45" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. MAIN DASHBOARD (ORIGINAL APP)
const MainDashboard = () => {
  const [status, setStatus] = useState<CleanStatus>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [cleanProgress, setCleanProgress] = useState(0);
  const [activeDirectory, setActiveDirectory] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalFound: 0,
    totalCleaned: 0,
    failedToClean: 0,
  });
  
  const navigate = useNavigate();
  const logEndRef = useRef<HTMLDivElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<{email: string, expiry: string} | null>(null);

  useEffect(() => {
    const userKey = localStorage.getItem('user_key');
    if (!userKey) {
      navigate('/');
      return;
    }

    // Verify session with server strictly
    const verify = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/verify-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyCode: userKey })
        });
        const data = await res.json();
        if (data.valid) {
          setSessionInfo({ email: userKey, expiry: data.expiresAt });
        } else {
          localStorage.removeItem('user_key');
          localStorage.removeItem('session_expiry');
          navigate('/');
        }
      } catch (err) {
        console.error("Session verification failed", err);
      }
    };
    verify();
  }, [navigate]);

  useEffect(() => {
    if (shouldAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, shouldAutoScroll]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  };

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { id, timestamp, message, type }]);
  };

  const startScan = async () => {
    setStatus('scanning');
    setScanProgress(0);
    setLogs([]);
    addLog('Sistem tarama dizisi başlatılıyor...', 'info');
    for (const dir of DIRECTORIES) {
      setActiveDirectory(dir.id);
      addLog(`Analiz ediliyor: ${dir.path}`, 'info');
      for (let i = 0; i <= 100; i += 20) {
        setScanProgress(prev => prev + (100 / (DIRECTORIES.length * 5)));
        await new Promise(r => setTimeout(r, 150));
      }
      addLog(`${dir.name} içerisinde gereksiz dosya kalıntıları bulundu`, 'success');
    }
    setStats(prev => ({ ...prev, totalFound: 0 }));
    setStatus('ready');
    setActiveDirectory(null);
    addLog('Sistem taraması tamamlandı. Optimizasyon hazır.', 'warning');
  };

  const startClean = async () => {
    setStatus('cleaning');
    setCleanProgress(0);
    addLog('--- MoreSpace Derin Temizleme Başlatıldı ---', 'warning');
    let toplamsilinen = 0;
    let silinemeyen = 0;
    let totalSizeMB = 0;
    for (const dir of DIRECTORIES) {
      setActiveDirectory(dir.id);
      addLog(`Temizleniyor: ${dir.path}`, 'info');
      const estimatedItems = Math.floor(Math.random() * 40) + 10;
      for (let i = 0; i < estimatedItems; i++) {
        if (Math.random() > 0.1) {
          toplamsilinen++;
          totalSizeMB += (dir.baseSize / (DIRECTORIES.length * estimatedItems));
        } else {
          silinemeyen++;
          addLog(`Erişim engellendi (Kilitli): ${dir.path}\\file_${i}.tmp`, 'error');
        }
        setCleanProgress(prev => Math.min(prev + (100 / (DIRECTORIES.length * estimatedItems)), 100));
        await new Promise(r => setTimeout(r, 40));
      }
      addLog(`Klasör tamamlandı: ${dir.name}`, 'success');
    }
    setStats({ totalFound: 0, totalCleaned: totalSizeMB, failedToClean: silinemeyen });
    setStatus('done');
    setCleanProgress(100);
    setActiveDirectory(null);
    addLog('\n--- İŞLEM TAMAMLANDI! ---', 'success');
    addLog(`Toplam silinen dosya/klasör: ${toplamsilinen}`, 'success');
    addLog(`Silinemeyen dosya sayısı: ${silinemeyen}`, 'error');
  };

  const handleLogout = () => {
    localStorage.removeItem('user_key');
    localStorage.removeItem('session_expiry');
    navigate('/');
  };

  return (
    <div className="h-screen bg-[#0a0c14] text-white font-sans selection:bg-blue-500/30 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <main className="relative h-full max-w-7xl mx-auto px-6 py-6 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto lg:overflow-hidden custom-scrollbar">
        
        <div className="lg:col-span-4 flex flex-col gap-6">
          <header className="mb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src="https://i.ibb.co/RkNcLGt3/0712025c-2dcc-4de3-bda3-bcdb796a7d1f.png" 
                    alt="Logo" 
                    className="w-10 h-10 object-contain rounded-lg shadow-lg shadow-blue-500/20"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white">MoreSpace <span className="text-blue-400 font-mono text-sm ml-2 opacity-70">v2.4.0</span></h1>
                  <p className="text-xs text-white/50 uppercase tracking-widest leading-none">Optimizasyon Aracı</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                <LogOut className="w-5 h-5 text-white/20 hover:text-white/60" />
              </button>
            </div>

            {sessionInfo && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-1">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white/80">{sessionInfo.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-white/20" />
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Sona Erme: {new Date(sessionInfo.expiry).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            )}

            {status !== 'idle' && (
              <div className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md inline-flex items-center gap-2">
                <span className="text-[10px] font-medium text-blue-300 uppercase tracking-widest">● SİSTEM {status.toUpperCase()}</span>
              </div>
            )}
          </header>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-white/40" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-white/40">Tarama</span>
              </div>
              <div className="text-lg font-bold text-blue-400 uppercase tracking-tighter truncate">
                {status === 'idle' ? 'BEKLEMEDE' : status === 'scanning' ? 'AKTİF' : 'HAZIR'}
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-3xl">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] uppercase tracking-wider font-bold text-white/40">Sonuç</span>
              </div>
              <div className="text-lg font-bold text-purple-400 uppercase tracking-tighter">
                {status === 'done' ? 'TEMİZLENDİ' : '---'}
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-3">
            {status === 'idle' && (
              <button 
                onClick={startScan}
                className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3"
              >
                <Search className="w-5 h-5" />
                <span>SİSTEMİ TARA</span>
              </button>
            )}
            
            {status === 'ready' && (
              <button 
                onClick={startClean}
                className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 animate-pulse"
              >
                <Trash2 className="w-5 h-5" />
                <span>BULUNANLARI SİL</span>
              </button>
            )}

            {(status === 'scanning' || status === 'cleaning') && (
              <div className="w-full bg-white/5 h-14 rounded-2xl relative flex items-center justify-center overflow-hidden border border-white/10">
                <motion.div 
                  className="absolute inset-0 bg-blue-500/30"
                  initial={{ width: 0 }}
                  animate={{ width: `${status === 'scanning' ? scanProgress : cleanProgress}%` }}
                />
                <span className="relative font-mono font-bold text-blue-300 text-sm tracking-widest uppercase">
                  {status}... {Math.round(status === 'scanning' ? scanProgress : cleanProgress)}%
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <h3 className="text-[10px] uppercase font-bold text-white/30 tracking-widest mb-4 flex items-center gap-2">
              <Layers className="w-3 h-3 text-white/20" />
              Dizin İzleyici
            </h3>
            <div className="space-y-3">
              {DIRECTORIES.map(dir => (
                <div 
                  key={dir.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 backdrop-blur-md ${
                    activeDirectory === dir.id 
                    ? 'bg-blue-500/10 border-blue-500/40 translate-x-1' 
                    : 'bg-white/5 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <dir.icon className={`w-5 h-5 ${activeDirectory === dir.id ? 'text-blue-400 animate-spin' : 'text-white/20'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white/80 truncate">{dir.name}</div>
                      <div className="text-[10px] font-mono text-white/30 truncate">{dir.path}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col bg-black/30 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[400px] lg:min-h-0">
          <div className="bg-white/5 px-8 py-5 border-bottom border-white/10 flex justify-between items-center transition-colors">
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white/70 tracking-wide uppercase">Konsol Günlüğü</h2>
            </div>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500/30"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500/30"></div>
              <div className="w-2 h-2 rounded-full bg-green-500/30"></div>
            </div>
          </div>

          <div 
            ref={logContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-8 font-mono text-xs space-y-3 selection:bg-blue-500 selection:text-white scroll-smooth custom-scrollbar"
          >
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10">
                <Cpu className="w-16 h-16 mb-4" />
                <p className="text-[10px] tracking-[0.4em] font-bold uppercase">SİSTEM BEKLEMEDE</p>
              </div>
            ) : (
              logs.map((log) => (
                <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} key={log.id} className="flex gap-4">
                  <span className="text-white/20 select-none shrink-0">[{log.timestamp}]</span>
                  <span className={`${log.type === 'success' ? 'text-emerald-400' : log.type === 'warning' ? 'text-amber-400' : log.type === 'error' ? 'text-rose-400' : 'text-blue-300'}`}>
                    <span className="mr-2 opacity-30">#</span>
                    {log.message}
                  </span>
                </motion.div>
              ))
            )}
            <div ref={logEndRef} />
          </div>

          <div className="p-8 border-t border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6 text-white/40 text-[9px] uppercase tracking-widest font-bold">
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                <span>Aktif Motor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-white/10"></span>
                <span>Thread-ID: 4A92</span>
              </div>
            </div>
            
            {status === 'done' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-4 px-5 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="text-right">
                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1 leading-none">Kurtarıldı</p>
                  <p className="text-lg font-bold text-white leading-none">+{stats.totalCleaned.toFixed(0)} MB</p>
                </div>
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- App Entry (Router) ---

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<EmailGate />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/dashboard" element={<MainDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 100px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
        `}} />
      </div>
    </BrowserRouter>
  );
}
