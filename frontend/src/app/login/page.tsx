'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      toast.success('Login successful');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#F3F4F6] dark:bg-[#020817] p-4 transition-colors">
      <Card className="w-full max-w-md shadow-lg border-[#E5E7EB] dark:border-[#1e293b] dark:bg-[#0b1120] rounded-xl overflow-hidden">
        <CardHeader className="space-y-1 text-center bg-white dark:bg-[#0b1120] pb-8">
          <div className="mx-auto w-12 h-12 bg-[#1e3a8a] dark:bg-[#3b82f6] rounded-xl mb-4 flex items-center justify-center shadow-inner">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight text-[#00236f] dark:text-white">ASAS CRM</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Secure login for your sales dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-lg border-[#D1D5DB] dark:border-[#1e293b] dark:bg-[#1e293b] focus-visible:ring-2 focus-visible:ring-[#1e3a8a] dark:focus-visible:ring-[#3b82f6] h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-lg border-[#D1D5DB] dark:border-[#1e293b] dark:bg-[#1e293b] focus-visible:ring-2 focus-visible:ring-[#1e3a8a] dark:focus-visible:ring-[#3b82f6] h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="pb-8">
            <Button 
              type="submit" 
              className="w-full bg-[#1e3a8a] hover:bg-[#00236f] dark:bg-[#3b82f6] dark:hover:bg-[#2563eb] text-white rounded-lg h-11 font-bold shadow-md transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : 'Sign In'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
