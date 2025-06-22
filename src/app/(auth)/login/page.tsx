
"use client";

import type { UserRole } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// RadioGroup and related imports are no longer needed
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Headset } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

// Updated schema: role removed
const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido." }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres." }),
  // role field removed from schema
});

// Updated type: role removed
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      // role default value removed
    },
  });

  async function onSubmit(data: LoginFormValues) {
    // Call login without the role, it will be determined by useAuth
    await login(data.email);
  }

  if (!isClient) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary animate-spin h-12 w-12">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <Image
            src="https://res.cloudinary.com/dm77rdv3r/image/upload/fl_preserve_transparency/v1747146142/Logo_bluetech_sem_fundo_azul_Prancheta_1_Prancheta_1_2_hrr3g5.jpg?_s=public-apps"
            alt="Bluetech Window Films Logo"
            width={320} 
            height={160}
            priority
            className="mx-auto"
            data-ai-hint="company logo"
          />
          <CardTitle className="flex items-center justify-center gap-2 text-3xl font-bold">
            <Headset className="h-10 w-10 text-primary" />
            <span>SAC</span>
          </CardTitle>
          <CardDescription>Bem-vindo! Faça login para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* RadioGroup for role selection removed */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                ) : null}
                Entrar
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Bluetech Window Films®. Todos os direitos reservados.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
