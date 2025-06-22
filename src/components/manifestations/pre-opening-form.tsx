
"use client";

import type { Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { FileText, UserCircle, Send, XCircle } from 'lucide-react';
import React, { useState } from 'react';

const preOpeningSchema = z.object({
  summary: z.string().min(10, { message: "Resumo da solicitação é obrigatório (mínimo 10 caracteres)." }),
  // attachments: typeof window === 'undefined' ? z.any() : z.instanceof(FileList).optional(), // Simplified for now
});

type PreOpeningFormValues = z.infer<typeof preOpeningSchema>;

export interface PreOpeningData {
  summary: string;
  // attachments?: FileList;
}

interface PreOpeningFormProps {
  client: Client;
  onSubmit: (data: PreOpeningData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function PreOpeningForm({ client, onSubmit, onCancel, isLoading }: PreOpeningFormProps) {
  const form = useForm<PreOpeningFormValues>({
    resolver: zodResolver(preOpeningSchema),
    defaultValues: {
      summary: '',
      // attachments: undefined,
    },
  });

  const handleFormSubmit = (values: PreOpeningFormValues) => {
    onSubmit({ summary: values.summary /*, attachments: values.attachments*/ });
  };

  return (
    <Card className="shadow-lg w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Pré-Abertura de Manifestação
        </CardTitle>
        <CardDescription>
          Forneça um resumo da solicitação para o cliente <span className="font-semibold">{client.fantasyName || client.name}</span>. O SAC dará continuidade.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                Cliente Selecionado
              </h3>
              <p className="text-sm"><strong>Razão Social:</strong> {client.name}</p>
              <p className="text-sm"><strong>Nome Fantasia:</strong> {client.fantasyName || 'N/A'}</p>
              <p className="text-sm"><strong>Código:</strong> {client.code}</p>
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumo da Solicitação</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva brevemente o problema ou solicitação do cliente. Inclua N° Pedido/Etiqueta se aplicável..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Anexar Arquivos (Opcional)</FormLabel>
              <FormControl>
                <Input type="file" multiple /* {...form.register('attachments')} */ />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Você pode anexar arquivos como fotos ou documentos. A funcionalidade completa de anexos será gerenciada pelo SAC.
              </p>
              <FormMessage />
            </FormItem>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar Pré-abertura
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
