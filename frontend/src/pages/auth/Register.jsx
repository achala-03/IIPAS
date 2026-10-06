import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, X, Sparkles } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Register() {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  // Password strength meter
  const passwordStrength = useMemo(() => {
    if (!passwordValue) return { score: 0, label: '' };
    let score = 0;
    if (passwordValue.length >= 6) score++;
    if (passwordValue.length >= 8) score++;
    if (/[A-Z]/.test(passwordValue)) score++;
    if (/[0-9]/.test(passwordValue)) score++;
    if (/[^A-Za-z0-9]/.test(passwordValue)) score++;
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    return { score, label: labels[score] };
  }, [passwordValue]);

  const strengthColors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500', 'bg-green-600'];

  // ✅ UNCHANGED — same backend logic
  const onSubmit = async (data) => {
    setServerError('');
    const result = await registerUser(data.name, data.email, data.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setServerError(result.error || 'Failed to register');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute top-6 left-8 flex items-center gap-3 font-display font-bold text-lg text-white">
          <img src="/logo.jpg" alt="IIPAS Logo" className="w-9 h-9 object-contain rounded-lg shadow-sm" />
          <span>IIPAS</span>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="relative text-center text-white max-w-md">
          <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <circle cx="40" cy="40" r="18" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <rect x="36" y="20" width="8" height="30" rx="4" fill="currentColor" opacity="0.8" />
              <path d="M30 52 Q40 62 50 52" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" />
              <rect x="38" y="60" width="4" height="8" fill="currentColor" opacity="0.4" />
            </svg>
          </div>
          <h2 className="text-3xl font-display font-bold mb-4">Start Your Interview<br />Confidence Journey</h2>
          <p className="text-white/70 leading-relaxed">
            Join 50,000+ students who are practicing smarter and landing their dream jobs at top MNCs.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6 text-white/50 text-xs">
            <span>🔒 Secure & Private</span>
            <span>🤖 AI Powered</span>
            <span>🇮🇳 23+ Languages</span>
          </div>
        </motion.div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 relative overflow-hidden py-8">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative">
          <div className="rounded-2xl bg-card shadow-card border border-border/50 p-8 relative">
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            {/* Mobile logo */}
            <div className="text-center mb-8">
              <div className="lg:hidden flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-display font-bold">Create Your Account</h1>
              <p className="text-muted-foreground text-sm mt-1">Start building your interview confidence today</p>
            </div>

            {serverError && (
              <div className="mb-5 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    {...register('name')}
                    placeholder="Your name"
                    className={`w-full bg-background border ${errors.name ? 'border-destructive' : 'border-border'} rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                  />
                </div>
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className={`w-full bg-background border ${errors.email ? 'border-destructive' : 'border-border'} rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                  />
                </div>
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    onChange={e => setPasswordValue(e.target.value)}
                    className={`w-full bg-background border ${errors.password ? 'border-destructive' : 'border-border'} rounded-xl pl-10 pr-10 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}

                {/* Password Strength */}
                {passwordValue && (
                  <div className="space-y-2 mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength.score ? strengthColors[passwordStrength.score] : 'bg-muted'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>
                    <div className="space-y-0.5 text-xs">
                      {[
                        { test: passwordValue.length >= 8, label: '8+ characters' },
                        { test: /[A-Z]/.test(passwordValue), label: 'Uppercase letter' },
                        { test: /[0-9]/.test(passwordValue), label: 'Number' },
                      ].map(r => (
                        <div key={r.label} className="flex items-center gap-1.5">
                          {r.test ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-muted-foreground" />}
                          <span className={r.test ? 'text-success' : 'text-muted-foreground'}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Role selection */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border-2 border-primary bg-primary/5 text-center cursor-pointer">
                    <span className="text-sm font-medium">🎓 Student</span>
                  </div>
                  <div className="p-3 rounded-xl border border-border text-center cursor-pointer opacity-50">
                    <span className="text-sm font-medium">💼 Professional</span>
                  </div>
                </div>
              </div>

              <button disabled={isLoading} type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-hero text-white font-bold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-glow mt-2">
                {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><span>Create Account</span> <ArrowRight size={18} /></>}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
