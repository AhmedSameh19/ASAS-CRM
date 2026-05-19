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
    <div className="flex h-screen bg-[#F3F4F6] dark:bg-[#020817] overflow-hidden flex-col">
      {/* Global Topbar */}
      <header className="h-16 flex-shrink-0 bg-white dark:bg-[#0b1120] border-b border-[#E5E7EB] dark:border-[#1e293b] flex items-center justify-between px-4 md:px-8 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight text-[#00236f] dark:text-[#3b82f6]">ASAS CRM</span>
          <div className="h-4 w-[1px] bg-gray-200 dark:bg-[#1e293b]" />
          <span className="text-xs md:text-sm font-medium text-gray-500 dark:text-gray-400">
            {pathname === '/dashboard' ? 'Overview' :
              pathname.startsWith('/prospects') ? 'Prospects Management' :
                pathname === '/pipeline' ? 'Sales Pipeline' :
                  pathname === '/analytics' ? 'Deep Analytics' : ''}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{user.name}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
          <ModeToggle />
          <div className="h-4 w-[1px] bg-gray-200 dark:bg-[#1e293b]" />
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-[#1e293b] transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-hidden min-w-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 bg-[#F3F4F6] dark:bg-[#020817] transition-colors">
          {children}
        </main>
      </div>

      {/* Bottom Tab Bar (Visible on both Mobile and Desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white dark:bg-[#0b1120] border-t border-[#E5E7EB] dark:border-[#1e293b] flex items-center justify-around px-2 shadow-lg transition-colors max-w-[600px] mx-auto sm:rounded-t-2xl sm:border-x">
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
