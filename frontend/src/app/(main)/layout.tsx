'use client';

import { useAuthStore } from '@/store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, Loader2, KanbanSquare, BarChart3, Settings, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';
import { AsasLogo } from '@/components/AsasLogo';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, login, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!mounted || !user) {
    return (
      <div className="flex h-screen items-center justify-center dark:bg-[#020817]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a8a] dark:text-[#3b82f6]" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setResetLoading(true);
      const res = await api.post('/auth/change-password', { newPassword });
      toast.success('Password changed successfully');
      login(res.user, res.token);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setResetLoading(false);
    }
  };

  // Enforce password reset overlay
  if (user.requires_password_change) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F3F4F6] dark:bg-[#020817] p-4">
        <div className="w-[448px] max-w-full bg-white dark:bg-[#0b1120] border border-[#E5E7EB] dark:border-[#1e293b] rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Lock className="h-6 w-6 animate-pulse" />
            </div>
            <h2 className="text-xl font-extrabold text-on-surface dark:text-white">Mandatory Password Reset</h2>
            <p className="text-xs text-outline dark:text-gray-400 leading-relaxed">
              As a security precaution, you must change your password before you can access your ASAS CRM workspace.
            </p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-outline tracking-wider" htmlFor="new-password">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                placeholder="Enter at least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#f9f9ff] dark:bg-[#1e293b] border border-outline-variant dark:border-[#334155] rounded-xl px-3 py-2 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-outline/70 transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-outline tracking-wider" htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#f9f9ff] dark:bg-[#1e293b] border border-outline-variant dark:border-[#334155] rounded-xl px-3 py-2 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-outline/70 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={resetLoading}
              className="w-full py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white font-bold rounded-xl text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {resetLoading ? 'Updating Password...' : 'Save New Password & Continue'}
            </button>
          </form>

          <div className="border-t border-gray-100 dark:border-[#1e293b] pt-4 flex justify-center">
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-outline hover:text-on-surface dark:hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Prospects', href: '/prospects', icon: Users },
    { name: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    // { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (user.role === 'admin') {
    navItems.push({ name: 'Settings', href: '/settings', icon: Settings });
  }

  return (
    <div className="flex h-screen bg-[#F3F4F6] dark:bg-[#020817] overflow-hidden flex-row">
      {/* Sidebar Navigation: Visible ONLY on desktop (>= lg) */}
      <aside className="hidden lg:flex lg:flex-col w-[240px] bg-white dark:bg-[#0b1120] border-r border-[#E5E7EB] dark:border-[#1e293b] h-full flex-shrink-0">
        <div className="p-6 flex flex-col gap-2">
          <AsasLogo size="sm" className="hover:scale-105 transition-transform duration-300" />
          <h1 className="text-xl font-bold tracking-tight text-[#00236f] dark:text-[#3b82f6]">ASAS CRM</h1>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md relative transition-colors',
                  isActive
                    ? 'text-[#00236f] bg-[#f1f3ff] dark:text-[#3b82f6] dark:bg-[#1e293b]'
                    : 'text-[#444651] dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1e293b] hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#1e3a8a] dark:bg-[#3b82f6] rounded-r-md" />
                )}
                <item.icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    isActive ? 'text-[#1e3a8a] dark:text-[#3b82f6]' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-[#1e293b]">
          <div className="flex items-center justify-between">
            <div className="text-sm overflow-hidden">
              <p className="font-medium text-gray-700 dark:text-gray-200 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-[#1e293b]"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-hidden min-w-0">
        {/* Global Topbar */}
        <header className="h-16 flex-shrink-0 bg-white dark:bg-[#0b1120] border-b border-[#E5E7EB] dark:border-[#1e293b] flex items-center justify-between px-4 md:px-8 transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight text-[#00236f] dark:text-[#3b82f6] lg:hidden">ASAS CRM</span>
            <div className="h-4 w-[1px] bg-gray-200 dark:bg-[#1e293b] lg:hidden" />
            <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
              {pathname === '/dashboard' ? 'Overview' :
                pathname.startsWith('/prospects') ? 'Prospects Management' :
                  pathname === '/pipeline' ? 'Sales Pipeline' :
                    pathname === '/analytics' ? 'Deep Analytics' :
                      pathname.startsWith('/settings') ? 'System Settings' : ''}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block lg:hidden">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{user.name}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
            <ModeToggle />
            <div className="h-4 w-[1px] bg-gray-200 dark:bg-[#1e293b] lg:hidden" />
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-[#1e293b] transition-colors lg:hidden"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 lg:pb-8 bg-[#F3F4F6] dark:bg-[#020817] transition-colors">
          {children}
        </main>
      </div>

      {/* Bottom Tab Bar (Visible ONLY on Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-[#0b1120] border-t border-[#E5E7EB] dark:border-[#1e293b] flex items-center justify-around lg:hidden px-2 shadow-lg transition-colors">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-colors',
                isActive
                  ? 'text-[#00236f] dark:text-[#3b82f6]'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 mb-1',
                  isActive ? 'text-[#1e3a8a] dark:text-[#3b82f6]' : 'text-gray-400'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
