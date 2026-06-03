import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { collection, query, where, getDocs, setDoc, doc } from '@/src/lib/supabase-adapter';
import { ShieldAlert, Lock, Mail, User, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, UserPlus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [role, setRole] = React.useState<'field_personnel' | 'officer' | 'admin'>('field_personnel');
  const [isRegister, setIsRegister] = React.useState(false);
  const [registrationSuccess, setRegistrationSuccess] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [resetSent, setResetSent] = React.useState(false);
  const [config, setConfig] = React.useState<any>(null);

  React.useEffect(() => {
    let unsub: any;
    import('@/src/lib/supabase-adapter').then(({ doc, onSnapshot }) => {
      unsub = onSnapshot(doc(db, 'settings', 'app'), (snap: any) => {
        if (snap.exists()) {
          setConfig(snap.data());
        }
      });
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Simple Captcha
  const [captcha, setCaptcha] = React.useState({ a: Math.floor(Math.random() * 10), b: Math.floor(Math.random() * 10) });
  const [captchaInput, setCaptchaInput] = React.useState('');

  const handleFormAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Captcha
    if (parseInt(captchaInput) !== captcha.a + captcha.b) {
      setError('Verifikasi keamanan salah. Silakan coba lagi.');
      setCaptcha({ a: Math.floor(Math.random() * 10), b: Math.floor(Math.random() * 10) });
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        // Handle Registration
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          const isSuperAdminEmail = (authData.user.email || email).toLowerCase() === 'ukungdorkas@gmail.com';
          const userData: any = {
            user_id: authData.user.id,
            email: authData.user.email || email,
            name: isSuperAdminEmail ? "Super Admin" : fullName,
            role: isSuperAdminEmail ? 'super' : role,
            status: isSuperAdminEmail ? 'active' : 'pending', // Usually requires approval
            created_at: Date.now()
          };

          // If admin or super admin email, store in admins for direct access
          if (role === 'admin' || isSuperAdminEmail) {
            await setDoc(doc(db, 'admins', authData.user.id), userData);
          } else {
            // Store in personnel
            await setDoc(doc(db, 'personnel', authData.user.id), {
              ...userData,
              position: 'Petugas Damkar',
              rank: role === 'officer' ? 'DANRU' : 'ANGGOTA'
            });
          }
        }

        setRegistrationSuccess(true);
        setLoading(false);
        setTimeout(() => {
          setIsRegister(false);
          setRegistrationSuccess(false);
        }, 3000);
      } else {
        // Handle Login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
        
        const user = authData.user;
        if (!user) throw new Error("Gagal login: User tidak ditemukan.");
        
        // Check in admins collection
        const adminQ = query(collection(db, 'admins'), where('user_id', '==', user.id));
        const adminSnap = await getDocs(adminQ);
        let adminData = !adminSnap.empty ? adminSnap.docs[0].data() : null;
        
        // Auto-restore, repair or boost super admin on login to guarantee full access
        if (user.email === 'ukungdorkas@gmail.com') {
          if (!adminData || adminData.role !== 'super' || adminData.status !== 'active') {
            const updatedSuperData = {
              user_id: user.id,
              email: user.email,
              name: "Super Admin",
              role: 'super',
              status: 'active',
              created_at: Date.now()
            };
            await setDoc(doc(db, 'admins', user.id), updatedSuperData);
            adminData = updatedSuperData;
          }
          navigate('/admin');
          return;
        }

        if (adminData) {
          if (adminData.status === 'pending') {
            await supabase.auth.signOut();
            setLoading(false);
            throw new Error('Akun Admin Anda sedang menunggu verifikasi dari Administrator Utama.');
          }
          navigate('/admin');
          return;
        }

        // Check in personnel collection
        const persQ = query(collection(db, 'personnel'), where('user_id', '==', user.id));
        const persSnap = await getDocs(persQ);
        const personnelData = !persSnap.empty ? persSnap.docs[0].data() : null;
          
        if (personnelData) {
          if (personnelData.status === 'pending') {
            await supabase.auth.signOut();
            setLoading(false);
            throw new Error('Akun Petugas Anda sedang menunggu verifikasi. Silakan hubungi Pimpinan Regu atau Admin.');
          }
          navigate('/staff/ops');
          return;
        }

        // If neither, sign out
        await supabase.auth.signOut();
        setLoading(false);
        throw new Error('Akun Anda belum memiliki izin akses sistem. Hubungi administrator.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memproses permintaan Anda.');
      setCaptcha({ a: Math.floor(Math.random() * 10), b: Math.floor(Math.random() * 10) });
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Masukkan email Anda terlebih dahulu.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      setResetSent(true);
      setError(null);
    } catch (err: any) {
      setError('Gagal mengirim reset password: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 py-32 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-red/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-red/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="bg-white rounded-[3rem] border-8 border-slate-900 shadow-2xl p-8 md:p-12">
          {/* Logo & Header */}
          <div className="text-center mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 hover:text-brand-red transition-all group">
              <ArrowRight className="w-4 h-4 rotate-180" />
              Kembali ke Beranda
            </Link>
            <div className="w-20 h-20 bg-brand-red rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-900/20 relative overflow-hidden">
              {isRegister ? (
                <UserPlus className="text-white w-10 h-10 relative z-10" />
              ) : config?.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain p-2 relative z-10" />
              ) : (
                <ShieldAlert className="text-white w-10 h-10 relative z-10" />
              )}
            </div>
            <h1 className="text-4xl heading-bold text-brand-dark mb-2 leading-none uppercase">
              {isRegister ? 'Daftar' : 'Admin'} <span className="text-brand-red">{isRegister ? 'Petugas.' : 'Login.'}</span>
            </h1>
            <p className="tag-label text-slate-400">
              {isRegister ? 'Registrasi Personil Baru Damkar' : 'Control Panel Damkar Malinau'}
            </p>
          </div>

          <form onSubmit={handleFormAction} className="space-y-6">
            <div className="min-h-8">
              <AnimatePresence mode="wait">
                {registrationSuccess ? (
                  <motion.div 
                    key="registration-success-alert"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-green-50 border-2 border-green-200 p-6 rounded-2xl text-center mb-6"
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-sm font-black text-green-700 uppercase tracking-tight">Akun Berhasil Dibuat!</p>
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">Mengalihkan ke halaman login...</p>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    key="login-error-alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border-2 border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-600 font-bold text-xs uppercase overflow-hidden mb-6"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="flex-1">{error}</span>
                  </motion.div>
                ) : resetSent ? (
                  <motion.div 
                    key="reset-sent-alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-green-50 border-2 border-green-200 p-4 rounded-xl flex items-center gap-3 text-green-600 font-bold text-xs uppercase overflow-hidden mb-6"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span className="flex-1">Link reset password telah dikirim ke email Anda.</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="space-y-4">
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <label className="tag-label text-slate-500 mb-2 block">Nama Lengkap Sesuai KTP/SK</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      required
                      type="text"
                      className="w-full bg-slate-50 border-4 border-slate-100 rounded-xl py-4 pl-12 pr-4 focus:border-brand-red outline-none font-bold transition-all"
                      placeholder="Masukkan nama lengkap..."
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              <div>
                <label className="tag-label text-slate-500 mb-2 block">Email Dinas / Pribadi</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    required
                    type="email"
                    className="w-full bg-slate-50 border-4 border-slate-100 rounded-xl py-4 pl-12 pr-4 focus:border-brand-red outline-none font-bold transition-all"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="tag-label text-slate-500 mb-2 block">Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    required
                    type={showPassword ? 'text' : 'password'}
                    className="w-full bg-slate-50 border-4 border-slate-100 rounded-xl py-4 pl-12 pr-12 focus:border-brand-red outline-none font-bold transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-red"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <label className="tag-label text-slate-500 mb-2 block">Pilih Jabatan Akses</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'field_personnel', label: 'Petugas' },
                      { id: 'officer', label: 'Danru' },
                      { id: 'admin', label: 'Admin' }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id as any)}
                        className={cn(
                          "py-3 rounded-lg font-black text-[9px] uppercase tracking-tighter border-2 transition-all",
                          role === r.id 
                            ? "bg-brand-red border-brand-red text-white shadow-lg" 
                            : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {!isRegister && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-2 border-slate-200 text-brand-red focus:ring-brand-red" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter group-hover:text-brand-dark transition-colors">Ingat Saya</span>
                </label>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-brand-red uppercase tracking-tighter hover:underline"
                >
                  Lupa Password?
                </button>
              </div>
            )}

            {/* Simple Security Verification */}
            <div className="pt-4 border-t-2 border-slate-50">
              <label className="tag-label text-slate-500 mb-2 block">Verifikasi Keamanan: Apa hasil dari {captcha.a} + {captcha.b}?</label>
              <input 
                required
                type="number"
                className="w-full bg-slate-50 border-4 border-slate-100 rounded-xl py-4 px-4 focus:border-brand-red outline-none font-bold transition-all"
                placeholder="Hasil"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
              />
            </div>

            <button
              disabled={loading}
              className="emergency-btn w-full py-5 flex items-center justify-center gap-3 text-xl tracking-tighter mt-4"
            >
              {loading ? (
                <React.Fragment key="login-loading-state">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  MEMPROSES...
                </React.Fragment>
              ) : (
                <React.Fragment key="login-idle-state">
                  {isRegister ? 'DAFTAR AKUN BARU' : 'LOGIN KE DASHBOARD'} <ArrowRight className="w-6 h-6" />
                </React.Fragment>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t-4 border-slate-50 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              {isRegister ? 'Sudah memiliki akun?' : 'Belum memiliki akses sistem?'}
            </p>
            <button 
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="px-8 py-3 bg-slate-900 rounded-xl text-white font-black italic uppercase tracking-tighter text-[10px] hover:bg-brand-red transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              {isRegister ? 'Masuk ke Dashboard' : 'Mendaftar Sebagai Personil'}
            </button>
          </div>

          <footer className="mt-12 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
              SISTEM INFORMASI TERPADU & KESELAMATAN <br />
              BPBD PEMADAM KEBAKARAN KABUPATEN MALINAU
            </p>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}
