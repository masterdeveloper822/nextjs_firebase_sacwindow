
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function RootPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (role === 'administrator') {
          router.replace('/admin/dashboard');
        } else if (role === 'ti') {
          router.replace('/admin/it-settings');
        } else { // attendant
          router.replace('/dashboard');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [user, role, loading, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary animate-spin h-12 w-12">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}
