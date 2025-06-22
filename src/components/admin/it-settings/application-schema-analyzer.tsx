
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, FileJson2, AlertTriangle } from 'lucide-react';
import { suggestApplicationSchema, type SuggestApplicationSchemaOutput } from '@/ai/flows/suggest-application-schema-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ApplicationSchemaAnalyzer() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SuggestApplicationSchemaOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeSchema = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // No input needed for this flow as the prompt is self-contained for now
      const result = await suggestApplicationSchema({});
      setAnalysisResult(result);
    } catch (e) {
      console.error("Application schema analysis error:", e);
      const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido durante a análise.";
      setError(`Falha na análise do esquema da aplicação: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileJson2 className="h-5 w-5 text-primary" />
          Analisador de Esquema da Aplicação
        </CardTitle>
        <CardDescription>
          Utilize a IA para analisar as entidades da aplicação e sugerir um esquema de banco de dados inicial (SQL DDL).
          Isso pode ajudar a criar as tabelas necessárias no seu banco de dados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="default" className="bg-primary/10 border-primary/30">
          <Brain className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Como Funciona?</AlertTitle>
          <AlertDescription>
            Ao clicar no botão abaixo, a IA (Gemini) receberá uma descrição das principais estruturas de dados
            definidas nesta aplicação (como Manifestações, Clientes, Pedidos, etc.). Com base nisso, ela
            gerará sugestões de comandos SQL `CREATE TABLE` para Oracle, PostgreSQL e MySQL.
            Lembre-se que estas são sugestões e podem necessitar de ajustes.
          </AlertDescription>
        </Alert>

        <Button onClick={handleAnalyzeSchema} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          ) : (
            <Brain className="mr-2 h-4 w-4" />
          )}
          Analisar Aplicação e Sugerir Esquema
        </Button>

        {isLoading && !analysisResult && !error && (
          <div className="space-y-4 pt-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Analisando com Gemini... Por favor, aguarde. Pode levar alguns instantes.
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro na Análise</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysisResult && (
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold text-primary">Esquema de Banco de Dados Sugerido pela IA</h3>
            <p className="text-sm text-muted-foreground">
              Abaixo estão as sugestões de SQL DDL. Copie e adapte conforme necessário para o seu ambiente de banco de dados.
            </p>
            <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-muted/30">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {analysisResult.suggestedSchemaDdl}
              </pre>
            </ScrollArea>
          </div>
        )}
      </CardContent>
       {analysisResult && (
        <CardFooter>
            <p className="text-xs text-muted-foreground">
                Nota: As sugestões de esquema podem não incluir todas as otimizações, índices ou constraints complexas.
                Revise e adapte antes de aplicar em um ambiente de produção.
            </p>
        </CardFooter>
      )}
    </Card>
  );
}
