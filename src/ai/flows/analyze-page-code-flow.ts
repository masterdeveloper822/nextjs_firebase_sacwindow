
'use server';
/**
 * @fileOverview An AI agent that provides a conceptual analysis of a page's code.
 *
 * - analyzePageCode - A function that triggers the page code analysis.
 * - AnalyzePageCodeInput - The input type for the analyzePageCode function.
 * - AnalyzePageCodeOutput - The return type for the analyzePageCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePageCodeInputSchema = z.object({
  pagePath: z.string().describe('The file path of the page/component to be analyzed (e.g., /src/app/dashboard/page.tsx).'),
  pageDescription: z.string().optional().describe('A brief description of what the page does or its main purpose, if available.'),
});
export type AnalyzePageCodeInput = z.infer<typeof AnalyzePageCodeInputSchema>;

const AnalyzePageCodeOutputSchema = z.object({
  analysisReport: z.string().describe('A textual report from the AI, including suggestions on potential issues, performance improvements, or bugs based on common best practices for the given page context, structured into "O que está bom", "O que precisa ser melhorado", and "O que opcionalmente poderia ser melhorado".'),
});
export type AnalyzePageCodeOutput = z.infer<typeof AnalyzePageCodeOutputSchema>;

export async function analyzePageCode(
  input: AnalyzePageCodeInput
): Promise<AnalyzePageCodeOutput> {
  return analyzePageCodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePageCodePrompt',
  input: {schema: AnalyzePageCodeInputSchema},
  output: {schema: AnalyzePageCodeOutputSchema},
  prompt: `Você é um engenheiro de software sênior e especialista em qualidade de código, com foco em aplicações Next.js e React. Sua tarefa é fornecer uma análise conceitual e objetiva sobre o estado atual de uma página/componente da aplicação, baseado no seu caminho e, opcionalmente, uma breve descrição.

Caminho da Página/Componente: {{{pagePath}}}
{{#if pageDescription}}
Descrição da Página: {{{pageDescription}}}
{{/if}}

Por favor, organize sua análise nos seguintes tópicos, sempre em português:

1.  **O QUE ESTÁ BOM:**
    *   Com base no caminho e propósito geral inferido, quais aspectos provavelmente estão bem implementados ou seguem boas práticas comuns para este tipo de componente? (Ex: uso de Server Components se for uma página de dados, componentização adequada, clareza na nomenclatura de props, etc.)
    *   Seja específico sobre o que você deduz que está bom e porquê.

2.  **O QUE PRECISA SER MELHORADO (CRÍTICO/IMPORTANTE):**
    *   Quais são os pontos de atenção mais críticos ou comuns que podem levar a bugs, problemas de performance, ou má experiência do usuário para um componente neste contexto?
    *   Existem features específicas do Next.js/React que, se mal utilizadas aqui, seriam problemáticas? (Seja específico, por exemplo, "Cuidado com data fetching excessivo no cliente se esta for uma página primariamente estática ou server-side renderable. Avaliar Server Actions para mutações.")
    *   Considere aspectos como: gerenciamento de estado ineficiente, falta de tratamento de erros, problemas de acessibilidade óbvios para o tipo de componente, ou antipadrões comuns.

3.  **O QUE OPCIONALMENTE PODERIA SER MELHORADO (SUGESTÕES/REFINAMENTOS):**
    *   Quais seriam sugestões de otimização, refatoração ou recursos adicionais que poderiam aprimorar este componente, mas não são necessariamente críticos? (Ex: "Considerar adicionar skeleton loaders para melhor UX no carregamento de dados", "Avaliar uso de React.memo para componentes de lista se houver re-renderizações desnecessárias", "Para formulários complexos, ponderar o uso de bibliotecas de gerenciamento de formulário como React Hook Form para validação e estado.")
    *   Pense em legibilidade, manutenibilidade, e performance secundária.

Seja conciso, objetivo e forneça feedback acionável. Sua resposta deve ser um único texto para o campo 'analysisReport'.
Lembre-se que você não está vendo o código diretamente, então sua análise é baseada em experiência e inferências sobre um componente típico encontrado no caminho fornecido.
`,
  config: {
    temperature: 0.5, // Slightly more creative for suggestions but still grounded
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
       {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

const analyzePageCodeFlow = ai.defineFlow(
  {
    name: 'analyzePageCodeFlow',
    inputSchema: AnalyzePageCodeInputSchema,
    outputSchema: AnalyzePageCodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.analysisReport) {
      throw new Error("AI did not return a valid analysis report.");
    }
    return output;
  }
);

