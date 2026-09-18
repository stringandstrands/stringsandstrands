import React, { useState } from 'react';
import { X, Mail, Sparkles, CheckCircle, Lock, Phone } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useNavigate } from 'react-router';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot_password';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (mode === 'login') {
        if (!password) {
          setError("Password is required");
          setLoading(false);
          return;
        }
        const { error } = await signIn(email.trim(), password);
        if (error) throw new Error(error);
        handleClose();
        navigate('/profile');
      } else if (mode === 'signup') {
        if (!password) {
          setError("Password is required");
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          setError("Phone number is required");
          setLoading(false);
          return;
        }
        const { error } = await signUp(email.trim(), password, phone.trim());
        if (error) throw new Error(error);
        handleClose();
        navigate('/profile');
      } else if (mode === 'forgot_password') {
        const apiBase = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001');
        const checkRes = await fetch(`${apiBase}/api/auth/check-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() })
        });
        const checkData = await checkRes.json();

        if (!checkData.exists) {
          setError("Uh-oh! No account found. Please sign up.");
          setMode('signup');
          setLoading(false);
          return;
        }

        const { error } = await resetPassword(email.trim());
        if (error) throw new Error(error);
        setSent(true);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSent(false);
    setEmail('');
    setPassword('');
    setPhone('');
    setError(null);
    setMode('login');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#FF2D74]/20 backdrop-blur-sm z-50" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(255,45,116,0.25)] w-full max-w-md p-8 relative pointer-events-auto">
          <button onClick={handleClose} className="absolute top-5 right-5 text-[#FFD1E3] hover:text-[#FF2D74] transition-colors">
            <X size={20} />
          </button>

          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-[#FFD1E3] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={24} className="text-[#FF2D74]" />
                </div>
                <h2 className="text-2xl font-bold text-[#FF2D74] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {mode === 'login' && 'Welcome Back'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot_password' && 'Reset Password'}
                </h2>
                <p className="text-sm text-[#D41E5C]">
                  {mode === 'login' && 'Log in to your account'}
                  {mode === 'signup' && 'Join us today'}
                  {mode === 'forgot_password' && "We'll send you a reset link"}
                </p>
              </div>

              {/* Toggle Login/Signup */}
              {mode !== 'forgot_password' && (
                <div className="flex bg-[#fff5f8] rounded-xl p-1 mb-6">
                  <button
                    onClick={() => { setMode('login'); setError(null); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white text-[#FF2D74] shadow-sm' : 'text-[#D41E5C]/60 hover:text-[#FF2D74]'}`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setMode('signup'); setError(null); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-white text-[#FF2D74] shadow-sm' : 'text-[#D41E5C]/60 hover:text-[#FF2D74]'}`}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD1E3]" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required className="w-full pl-10 pr-4 py-3.5 bg-white border-2 border-[#FFD1E3] rounded-2xl text-[#B3184F] placeholder-[#FFD1E3] focus:outline-none focus:border-[#FF2D74] transition-colors text-sm" />
                </div>
                
                {mode !== 'forgot_password' && (
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD1E3]" />
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full pl-10 pr-4 py-3.5 bg-white border-2 border-[#FFD1E3] rounded-2xl text-[#B3184F] placeholder-[#FFD1E3] focus:outline-none focus:border-[#FF2D74] transition-colors text-sm" />
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FFD1E3]" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" required className="w-full pl-10 pr-4 py-3.5 bg-white border-2 border-[#FFD1E3] rounded-2xl text-[#B3184F] placeholder-[#FFD1E3] focus:outline-none focus:border-[#FF2D74] transition-colors text-sm" />
                  </div>
                )}
                
                {mode === 'login' && (
                  <div className="text-right">
                    <button type="button" onClick={() => { setMode('forgot_password'); setError(null); }} className="text-xs font-semibold text-[#D41E5C] hover:text-[#FF2D74] transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                )}

                {error && <p className="text-xs text-[#FF2D74] bg-[#FFD1E3]/50 px-4 py-2 rounded-xl">{error}</p>}
                
                <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#FF2D74] text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-[#D41E5C] transition-all shadow-[0_4px_14px_rgba(255,45,116,0.3)] hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0">
                  {loading ? 'Please wait…' : (
                    mode === 'login' ? 'Log In ✨' :
                    mode === 'signup' ? 'Sign Up ✨' :
                    'Send Reset Link'
                  )}
                </button>
                
                {mode === 'forgot_password' && (
                  <button type="button" onClick={() => { setMode('login'); setError(null); }} className="w-full py-3.5 border-2 border-[#FFD1E3] text-[#FF2D74] rounded-2xl font-bold text-sm tracking-wide hover:bg-[#FFD1E3]/30 transition-all disabled:opacity-60">
                    Back to Login
                  </button>
                )}
              </form>

              <p className="text-center text-xs text-[#D41E5C]/60 mt-6">
                By continuing, you agree to our Terms & Privacy Policy.
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#FFD1E3] rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-[#FF2D74]" />
              </div>
              <h2 className="text-2xl font-bold text-[#FF2D74] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                Check your email!
              </h2>
              <p className="text-sm text-[#D41E5C] mb-2">We sent a password reset link to</p>
              <p className="font-bold text-[#FF2D74] text-sm mb-6">{email}</p>
              <p className="text-xs text-[#D41E5C]/70">Click the link in the email to set a new password. You can close this window.</p>
              <button onClick={handleClose} className="mt-6 w-full py-3 border-2 border-[#FFD1E3] rounded-2xl text-[#FF2D74] font-semibold text-sm hover:bg-[#FFD1E3]/30 transition-colors">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
