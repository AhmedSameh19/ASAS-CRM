'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, Rocket, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

import { AsasLogo } from '../AsasLogo';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter all credentials');
      return;
    }

    try {
      setLoading(true);
      const data = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      toast.success('Successfully logged in to management workspace');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full flex items-center justify-center p-md bg-[#f1f3ff] dark:bg-[#020617] min-h-screen">
      <div className="w-full max-w-[460px] mx-auto space-y-md">
        {/* Logo Container */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-4 flex items-center justify-center p-2 rounded-2xl">
            <AsasLogo size="xl" className="hover:scale-105 transition-transform duration-300" />
          </div>
          <h1 className="font-headline-lg text-2xl font-black text-[#00236f] dark:text-[#3b82f6] tracking-tight">Asas CRM</h1>
          <p className="font-label-md text-xs text-outline dark:text-gray-400 uppercase tracking-widest mt-1">Founder Suite</p>
        </div>

        {/* Card Panel */}
        <div className="bg-white dark:bg-[#0b1120] border border-outline-variant dark:border-[#1e293b] p-8 rounded-2xl shadow-xl transition-all duration-200">
          <div className="mb-6">
            <h2 className="font-headline-lg text-xl font-extrabold text-on-surface dark:text-white">Welcome back</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="font-label-md text-xs font-bold text-outline dark:text-gray-400 uppercase tracking-wider" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-outline" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9 pr-4 py-2.5 w-full bg-[#f9f9ff] dark:bg-[#1e293b] border border-outline-variant dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-on-surface dark:text-white placeholder:text-outline transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-xs font-bold text-outline dark:text-gray-400 uppercase tracking-wider" htmlFor="password">
                  Password
                </label>

              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-outline" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-9 pr-10 py-2.5 w-full bg-[#f9f9ff] dark:bg-[#1e293b] border border-outline-variant dark:border-[#334155] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-on-surface dark:text-white placeholder:text-outline transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-outline hover:text-on-surface dark:hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00236f] hover:bg-[#1e3a8a] disabled:bg-primary/50 text-white font-bold text-sm py-3 rounded-xl hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-outline-variant dark:bg-gray-800"></div>
            <span className="font-label-sm text-[10px] text-outline uppercase font-bold tracking-widest">Workspace</span>
            <div className="h-px flex-1 bg-outline-variant dark:bg-gray-800"></div>
          </div>

          <p className="text-center font-label-md text-xs text-on-surface-variant dark:text-gray-400">
            Don't have an account?
            <a className="text-[#00236f] dark:text-[#3b82f6] font-bold hover:underline ml-1" href="#">
              Contact your administrator.
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
