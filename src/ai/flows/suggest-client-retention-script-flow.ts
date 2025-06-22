
'use server';
/**
 * @fileOverview An AI agent that suggests a script for client retention.
 *
 * - suggestClientRetentionScript - A function that suggests a script based on the complaint description.
 * - SuggestClientRetentionScriptInput - The input type for the suggestClientRetentionScript function.
 * - SuggestClientRetentionScriptOutput - The return type for the suggestClientRetentionScript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestClientRetentionScriptInputSchema = z.object({
  complaintDescription: z
    .string()
    .describe('The detailed description of the customer complaint.'),
});
export type SuggestClientRetentionScriptInput = z.infer<
  typeof SuggestClientRetentionScriptInputSchema
>;

const SuggestClientRetentionScriptOutputSchema = z.object({
  suggestedScript: z
    .string()
    .describe(
      'A suggested script in Portuguese for the attendant to use with the client, focusing on retention and empathy.'
    ),
});
export type SuggestClientRetentionScriptOutput = z.infer<
  typeof SuggestClientRetentionScriptOutputSchema
>;

export async function suggestClientRetentionScript(
  input: SuggestClientRetentionScriptInput
): Promise<SuggestClientRetentionScriptOutput> {
  return suggestClientRetentionScriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestClientRetentionScriptPrompt',
  input: {schema: SuggestClientRetentionScriptInputSchema},
  output: {schema: SuggestClientRetentionScriptOutputSchema},
  prompt: `Você é um especialista em atendimento ao cliente e retenção, focado em criar uma experiência positiva para o cliente, mesmo diante de uma reclamação.
  Sua tarefa é gerar uma orientação humanizada e empática, em português simples, para o atendente do SAC utilizar ao interagir com um cliente que registrou a seguinte manifestação:

  Descrição da Manifestação do Cliente:
  "{{{complaintDescription}}}"

  Baseado nesta descrição, crie um texto que o atendente possa usar. Este texto deve:
  1. Fazer o cliente se sentir ouvido, compreendido e acolhido.
  2. Reforçar que o SAC está ali para ajudar e que a empresa valoriza o cliente.
  3. Ser apresentado como uma sugestão de abordagem para o atendente.
  4. Usar uma linguagem clara, direta e empática.
  5. O resultado deve ser um único parágrafo ou alguns parágrafos curtos formando uma orientação coesa.

  Exemplo de como o atendente poderia iniciar a conversa (adapte conforme a reclamação):
  "Olá [Nome do Cliente], compreendo perfeitamente sua frustração com [problema específico da manifestação] e quero que saiba que estamos aqui para resolver isso da melhor forma possível. A sua satisfação é muito importante para nós..."

  Forneça a sua sugestão de script/orientação abaixo.
  `,
});

const suggestClientRetentionScriptFlow = ai.defineFlow(
  {
    name: 'suggestClientRetentionScriptFlow',
    inputSchema: SuggestClientRetentionScriptInputSchema,
    outputSchema: SuggestClientRetentionScriptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI did not return a valid output for script suggestion.");
    }
    return output;
  }
);

