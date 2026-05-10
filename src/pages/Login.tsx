import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ShieldAlert, Lock, Mail, User, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [rememberMe, setRememberMe] = React.useState(false);
  const [resetSent, setResetSent] = React.useState(false);

  // Simple Captcha
  const [captcha, setCaptcha] = React.useState({ a: Math.floor(Math.random() * 10), b: Math.floor(Math.random() * 10) });
  const [captchaInput, setCaptchaInput] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if user is admin/officer in Firestore
      const userDoc = await getDoc(doc(db, 'admins', user.uid));
      if (!userDoc.exists()) {
        await auth.signOut();
        throw new Error('Akun Anda tidak memiliki izin akses administrator.');
      }

      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Gagal login. Periksa email dan password Anda.');
      setCaptcha({ a: Math.floor(Math.random() * 10), b: Math.floor(Math.random() * 10) });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Masukkan email Anda terlebih dahulu.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
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
            <div className="w-20 h-20 bg-brand-red rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-900/20">
              <ShieldAlert className="text-white w-10 h-10" />
            </div>
            <h1 className="text-4xl heading-bold text-brand-dark mb-2 leading-none uppercase">Admin <span className="text-brand-red">Login.</span></h1>
            <p className="tag-label text-slate-400">Control Panel Damkar Malinau</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border-2 border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-600 font-bold text-xs uppercase"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </motion.div>
              )}
              {resetSent && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-green-50 border-2 border-green-200 p-4 rounded-xl flex items-center gap-3 text-green-600 font-bold text-xs uppercase"
                >
                  Link reset password telah dikirim ke email Anda.
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div>
                <label className="tag-label text-slate-500 mb-2 block">Email / Username</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    required
                    type="email"
                    className="w-full bg-slate-50 border-4 border-slate-100 rounded-xl py-4 pl-12 pr-4 focus:border-brand-red outline-none font-bold transition-all"
                    placeholder="admin@malinau.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="tag-label text-slate-500 mb-2 block">Password</label>
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
            </div>

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
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  MEMPROSES...
                </>
              ) : (
                <>
                  LOGIN KE DASHBOARD <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>

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
