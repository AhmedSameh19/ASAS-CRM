'use client';

import { useAuthStore } from '@/store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, Loader2, KanbanSquare, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from '@/components/mode-toggle';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

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

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Prospects', href: '/prospects', icon: Users },
    { name: 'Pipeline', href: '/pipeline', icon: KanbanSquare },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-[#F3F4F6] dark:bg-[#020817] overflow-hidden flex-row">
      {/* Sidebar Navigation: Visible ONLY on desktop (>= lg) */}
      <aside className="hidden lg:flex lg:flex-col w-[240px] bg-white dark:bg-[#0b1120] border-r border-[#E5E7EB] dark:border-[#1e293b] h-full flex-shrink-0">
        <div className="p-6">
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
                    pathname === '/analytics' ? 'Deep Analytics' : ''}
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
