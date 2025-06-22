
'use server';
/**
 * @fileOverview An AI agent that analyzes a database schema and suggests layouts.
 *
 * - analyzeDatabaseSchema - A function that analyzes the database schema.
 * - AnalyzeDatabaseSchemaInput - The input type for the analyzeDatabaseSchema function.
 * - AnalyzeDatabaseSchemaOutput - The return type for the analyzeDatabaseSchema function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDatabaseSchemaInputSchema = z.object({
  dbType: z.string().describe('The type of the database (e.g., Oracle, PostgreSQL, MySQL).'),
  tableNames: z.array(z.string()).describe('A list of table names in the database.'),
  databaseMap: z.string().describe('A textual representation or summary of the database structure or relationships (can be a simplified map for this flow).'),
});
export type AnalyzeDatabaseSchemaInput = z.infer<typeof AnalyzeDatabaseSchemaInputSchema>;

const AnalyzeDatabaseSchemaOutputSchema = z.object({
  analysisText: z.string().describe('The AI-generated analysis of the database schema, including suggested layouts and field formats.'),
});
export type AnalyzeDatabaseSchemaOutput = z.infer<typeof AnalyzeDatabaseSchemaOutputSchema>;

export async function analyzeDatabaseSchema(
  input: AnalyzeDatabaseSchemaInput
): Promise<AnalyzeDatabaseSchemaOutput> {
  return analyzeDatabaseSchemaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDatabaseSchemaPrompt',
  input: {schema: AnalyzeDatabaseSchemaInputSchema},
  output: {schema: AnalyzeDatabaseSchemaOutputSchema},
  prompt: `You are an expert database administrator and data architect.
Your task is to analyze the provided database schema information and generate a detailed report.
This report should include:
1.  A brief overview of the database structure based on the provided tables.
2.  For each table provided in the 'tableNames' list, suggest a potential layout. This should include:
    *   Key fields (columns) you would expect in such a table.
    *   Suggested data types for these fields (e.g., VARCHAR2(255), NUMBER, DATE, TEXT, INTEGER, BOOLEAN).
    *   A brief note on potential primary keys or important indexes if obvious from the table name or context.
3.  Comment on any potential relationships between tables if discernible.

Database Type: {{{dbType}}}

Tables to Analyze:
{{#each tableNames}}
- {{this}}
{{/each}}

Additional Database Map/Structure Information (if provided):
{{{databaseMap}}}

Please format your output clearly. Use markdown for structure if it helps readability (e.g., headings for each table).
Focus on providing practical and actionable suggestions for table layouts and field definitions.
If the 'databaseMap' is simple or a placeholder, base your analysis primarily on the table names and common database design principles.
`,
config: { // Loosen safety settings for schema discussions, if necessary. Re-evaluate if issues arise.
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

const analyzeDatabaseSchemaFlow = ai.defineFlow(
  {
    name: 'analyzeDatabaseSchemaFlow',
    inputSchema: AnalyzeDatabaseSchemaInputSchema,
    outputSchema: AnalyzeDatabaseSchemaOutputSchema,
  },
  async input => {
    // For now, we'll pass the input directly.
    // In a more complex scenario, you might fetch more detailed schema info here based on input.dbType and input.tableNames
    // using a hypothetical service, then pass that to the prompt.
    const {output} = await prompt(input);
    return output!;
  }
);
