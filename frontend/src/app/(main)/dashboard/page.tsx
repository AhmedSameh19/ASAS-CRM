'use client';

import DashboardView from '@/components/screens/DashboardView';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <DashboardView 
      onAddProspectClick={() => router.push('/prospects')}
      onNavigate={(href) => router.push(href)}
    />
  );
}
