'use client';

import { useAuthStore } from '@/store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, Loader2, KanbanSquare, Bell } from 'lucide-react';
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
  ];

  return (
    <div className="flex h-screen bg-[#F3F4F6] dark:bg-[#020817]">
      {/* Sidebar */}
      <div className="w-[240px] bg-white dark:bg-[#0b1120] border-r border-[#E5E7EB] dark:border-[#1e293b] flex flex-col h-full transition-colors">
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Global Topbar */}
        <header className="h-16 bg-white dark:bg-[#0b1120] border-b border-[#E5E7EB] dark:border-[#1e293b] flex items-center justify-between px-8 transition-colors">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {pathname === '/dashboard' ? 'Overview' : 
               pathname.startsWith('/prospects') ? 'Prospects Management' : 
               pathname === '/pipeline' ? 'Sales Pipeline' : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-[#1e293b]">
              <Bell className="h-5 w-5" />
            </button>
            <div className="h-6 w-[1px] bg-gray-200 dark:bg-[#1e293b]" />
            <ModeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-[#F3F4F6] dark:bg-[#020817] transition-colors">
          {children}
        </main>
      </div>
    </div>
  );
}
