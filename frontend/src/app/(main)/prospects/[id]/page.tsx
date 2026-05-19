'use client';

import ProspectDetailView from '@/components/screens/ProspectDetailView';
import { useParams } from 'next/navigation';

export default function ProspectDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  return <ProspectDetailView prospectId={id} />;
}
