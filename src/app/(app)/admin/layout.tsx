"use client";

import type React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This effect handles redirecting an authenticated user with the WRONG role.
    if (!loading && user && user.id) { // Only if authenticated
      if (!(role === 'administrator' || role === 'ti')) {
        router.replace('/dashboard'); // Redirect to a safe, general page
      }
    }
    // If !loading and !user (unauthenticated), AuthProvider's useEffect 
    // (in use-auth.tsx) handles redirecting to /login.
  }, [user, role, loading, router]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary animate-spin h-12 w-12">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </div>
    );
  }

  // If AuthProvider is not loading, but there's no user (unauthenticated)
  // AuthProvider will handle the redirect to /login. Show a spinner here in AdminLayout.
  if (!user || !user.id) {
    return (
      <div className="flex h-full items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary animate-spin h-12 w-12">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      </div>
    );
  }

  // At this point, user is authenticated (user && user.id is true).
  // Now, check if they have the correct role for admin areas.
  if (!(role === 'administrator' || role === 'ti')) {
    // User is authenticated but does NOT have the correct role.
    // The useEffect hook above will trigger a redirect to /dashboard.
    // Show "Acesso Negado" message while this redirect happens.
    return (
        <div className="flex flex-grow items-center justify-center p-8">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-2 text-2xl text-destructive">
                        <ShieldAlert className="h-8 w-8" /> Acesso Negado
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg">Você não tem permissão para acessar esta área.</p>
                    <p className="text-muted-foreground mt-2">Contate um administrador se você acredita que isso é um erro.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  // User is authenticated AND has the correct role.
  return <>{children}</>;
}
