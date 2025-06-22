
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lightbulb, MessageSquareHeart } from 'lucide-react'; // Changed Wand2 to MessageSquareHeart
import { suggestClientRetentionScript, type SuggestClientRetentionScriptInput } from '@/ai/flows/suggest-client-retention-script-flow';

interface AiActionSuggesterProps {
  complaintDescription: string;
  onSuggestionSelect?: (suggestion: string) => void;
}

export function AiActionSuggester({ complaintDescription, onSuggestionSelect }: AiActionSuggesterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null); // Changed from string[] to string | null
  const [error, setError] = useState<string | null>(null);
  const [currentDescription, setCurrentDescription] = useState(complaintDescription);

  React.useEffect(() => {
    setCurrentDescription(complaintDescription);
    setSuggestion(null); // Clear suggestion when description changes
  }, [complaintDescription]);

  const handleSuggestScript = async () => { // Renamed function
    if (!currentDescription.trim()) {
      setError("Por favor, forneça uma descrição da manifestação.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const input: SuggestClientRetentionScriptInput = { complaintDescription: currentDescription };
      const result = await suggestClientRetentionScript(input); // Call new flow
      if (result && result.suggestedScript) {
        setSuggestion(result.suggestedScript); // Set single string
      } else {
        setSuggestion(null);
        setError("Não foi possível obter sugestões no momento.");
      }
    } catch (e) {
      console.error("AI suggestion error:", e);
      const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
      setError(`Ocorreu um erro ao buscar sugestões: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquareHeart className="h-5 w-5 text-primary" /> {/* Changed icon */}
          Sugestão de Abordagem (IA)
        </CardTitle>
        <CardDescription>
          Obtenha uma sugestão de como abordar o cliente, com foco em retenção e empatia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="ai-complaint-description">Descrição da Manifestação (para IA)</Label>
          <Textarea
            id="ai-complaint-description"
            value={currentDescription}
            onChange={(e) => setCurrentDescription(e.target.value)}
            placeholder="A IA usará este texto para gerar a sugestão de abordagem..."
            rows={3}
            className="mt-1"
          />
           <p className="text-xs text-muted-foreground mt-1">Edite o texto acima se necessário antes de pedir a sugestão.</p>
        </div>
        
        <Button onClick={handleSuggestScript} disabled={isLoading || !currentDescription.trim()} className="w-full">
          {isLoading ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin mr-2 h-4 w-4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          ) : (
            <Lightbulb className="mr-2 h-4 w-4" />
          )}
          Sugerir Abordagem
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {suggestion && (
          <div className="space-y-2">
            <h4 className="font-medium">Sugestão de Abordagem ao Cliente:</h4>
            <div className="rounded-md border p-3 bg-muted/30 whitespace-pre-wrap text-sm">
                {suggestion}
            </div>
            {onSuggestionSelect && (
              <Button
                variant="link"
                size="sm"
                className="mt-1 p-0 h-auto text-primary hover:underline"
                onClick={() => onSuggestionSelect(suggestion)}
              >
                Usar esta sugestão (copiar para parecer)
              </Button>
            )}
          </div>
        )}
      </CardContent>
      {!suggestion && !isLoading && !error && (
         <CardFooter>
            <p className="text-sm text-muted-foreground">Nenhuma sugestão gerada ainda.</p>
         </CardFooter>
      )}
    </Card>
  );
}
