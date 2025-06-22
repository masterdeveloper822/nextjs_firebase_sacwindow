
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
// ScrollArea import removed
import { analyzePageCode, type AnalyzePageCodeInput, type AnalyzePageCodeOutput } from '@/ai/flows/analyze-page-code-flow';
import { Bot, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function AiCodeAnalyzer() {
  const { role } = useAuth();
  const pathname = usePathname();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzePageCodeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAnalyzePage = async () => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setIsDialogOpen(true); 

    try {
      const input: AnalyzePageCodeInput = {
        pagePath: pathname,
      };
      const result = await analyzePageCode(input);
      setAnalysisResult(result);
    } catch (e) {
      console.error("AI Page Analysis error:", e);
      const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido durante a análise.";
      setError(`Falha ao analisar a página: ${errorMessage}`);
      toast({
        title: "Erro na Análise",
        description: `Não foi possível obter a análise da IA para ${pathname}. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (role !== 'ti') {
    return null; 
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleAnalyzePage}
        className="bg-accent hover:bg-accent/90 text-accent-foreground fixed bottom-4 right-4 z-50 shadow-lg"
        aria-label="Analisar Página com IA"
        title="Analisar Página com IA"
      >
        <Bot className="mr-2 h-4 w-4" />
        Analisar Página (IA)
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) { 
            setAnalysisResult(null);
            setError(null);
            setIsLoading(false);
        }
      }}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Análise da Página com IA: <span className="font-normal text-muted-foreground text-base break-all">{pathname}</span>
            </DialogTitle>
            <DialogDescription>
              Relatório conceitual gerado pela IA sobre o estado atual da página, incluindo pontos positivos, áreas para melhoria e sugestões opcionais.
              Esta análise é baseada em heurísticas e não substitui testes e revisões detalhadas.
            </DialogDescription>
          </DialogHeader>
          
          {/* Content wrapper for scrolling */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
              {isLoading && (
                <div className="flex flex-col items-center justify-center space-y-3 h-full py-10">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-lg text-muted-foreground">A IA está analisando a página...</p>
                  <p className="text-sm text-muted-foreground">Isso pode levar alguns instantes.</p>
                </div>
              )}
              {error && !isLoading && (
                <Card className="border-destructive bg-destructive/10 my-2">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5"/> Erro na Análise
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-destructive/90">{error}</p>
                        <p className="text-sm text-destructive/70 mt-2">Por favor, tente novamente mais tarde ou verifique os logs do servidor.</p>
                    </CardContent>
                </Card>
              )}
              {analysisResult && !isLoading && (
                <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/20 rounded-md border p-4 my-2">
                  {analysisResult.analysisReport}
                </pre>
              )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
