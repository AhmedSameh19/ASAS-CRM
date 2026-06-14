'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function Home() {
  const router = useRouter();
  // The JWT is now in an HttpOnly cookie — we redirect based on the cached user profile.
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
    </div>
  );
}
