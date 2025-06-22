
'use server';
/**
 * @fileOverview An AI agent that analyzes application entities and suggests a database schema.
 *
 * - suggestApplicationSchema - A function that suggests a database schema.
 * - SuggestApplicationSchemaInput - The input type for the suggestApplicationSchema function (currently empty).
 * - SuggestApplicationSchemaOutput - The return type for the suggestApplicationSchema function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input is currently not used as the prompt is self-contained, but defined for future flexibility.
const SuggestApplicationSchemaInputSchema = z.object({}).optional();
export type SuggestApplicationSchemaInput = z.infer<typeof SuggestApplicationSchemaInputSchema>;

const SuggestApplicationSchemaOutputSchema = z.object({
  suggestedSchemaDdl: z.string().describe('The AI-generated SQL DDL for the suggested database schema, covering Oracle, PostgreSQL, and MySQL syntax where possible.'),
});
export type SuggestApplicationSchemaOutput = z.infer<typeof SuggestApplicationSchemaOutputSchema>;

export async function suggestApplicationSchema(
  _input: SuggestApplicationSchemaInput // _input indicates it's not currently used
): Promise<SuggestApplicationSchemaOutput> {
  return suggestApplicationSchemaFlow(_input);
}

const prompt = ai.definePrompt({
  name: 'suggestApplicationSchemaPrompt',
  input: {schema: SuggestApplicationSchemaInputSchema }, // Input schema still needed even if empty
  output: {schema: SuggestApplicationSchemaOutputSchema},
  prompt: `
You are an expert Database Architect. Your task is to generate a suggested SQL DDL (Data Definition Language) schema
for a web application based on the following entities and their typical relationships.
Provide CREATE TABLE statements. Where possible, try to provide syntax compatible with Oracle, PostgreSQL, and MySQL,
or provide separate blocks for each if major differences exist (e.g., for auto-incrementing primary keys or data types).
Focus on creating a relational schema.

The application has the following main entities:

1.  **Client:**
    *   Attributes: ID (primary key), Name, Code (unique identifier), CNPJ/CPF (Brazilian tax ID), Email, Phone.
    *   Represents customers of the system.

2.  **Order:**
    *   Attributes: ID (primary key), Client ID (foreign key to Client), Branch Number, Order Number (unique within branch or globally), Order Date, Total Value.
    *   Represents sales orders placed by clients.

3.  **OrderItem:**
    *   Attributes: ID (primary key), Order ID (foreign key to Order), Product ID (or code), Product Description, Quantity, Unit Price, Total Item Value, Lot Number (optional).
    *   Represents individual items within an order. This is a many-to-many relationship resolver between Order and Product, but here we can assume Product details are denormalized or simpler for this context.

4.  **Manifestation (Customer Service Ticket):**
    *   Attributes: ID (primary key), Manifestation Number (unique human-readable ID), Client ID (foreign key to Client), Client Name (denormalized for display), Branch (text), Type (e.g., 'Complaint', 'Suggestion', 'Query'), Opening Date, Status (e.g., 'Pending', 'Analyzing', 'Resolved', 'Overdue'), Attendant ID (foreign key to User, optional), Attendant Name (denormalized), Reason (text, could be a code from a Parameter table), Description (long text), SLA Due Date (optional date).
    *   Represents customer service tickets or issues.

5.  **ManifestationAttachment (related to Manifestation):**
    *   Attributes: ID (primary key), Manifestation ID (foreign key to Manifestation), Name, URL (path to file), Type (e.g., 'image', 'video', 'document').
    *   Stores files attached to a manifestation.

6.  **ManifestationHistoryLog (related to Manifestation):**
    *   Attributes: ID (primary key), Manifestation ID (foreign key to Manifestation), Timestamp, Action Performed (text), User ID (who performed, foreign key to User), User Name (denormalized).
    *   Tracks changes and actions on a manifestation.

7.  **ParameterItem (for configurable lists):**
    *   Attributes: ID (primary key), Name (the value/text of the parameter), Type (e.g., 'Reason', 'RecommendedAction', 'CollectionType'), IsActive (boolean).
    *   Used to populate dropdowns and selectable options in the application. For example, 'Manifestation.Reason' could be populated from ParameterItems where Type='Reason'.

8.  **User (Application User/Attendant):**
    *   Attributes: ID (primary key), Email (login), Display Name, Role (e.g., 'attendant', 'administrator').
    *   Represents users of the application, like customer service attendants.

9.  **ProductForReturn (related to Manifestation for product returns):**
    *   Attributes: ID (primary key), Manifestation ID (foreign key to Manifestation), Order Number (text, identifies original order), Product ID (text), Product Name (denormalized), Quantity To Return, Label Number (text, for return label), Label Quantity.

10. **DynamicFieldMapping (for IT settings):**
    * Attributes: ID (primary key), Application Field (text, e.g., 'ManifestationReason'), Description, Database Table Name, Database Value Column, Database Display Column, IsActive (boolean).
    * Configures how application dropdowns are populated from external database tables.

Please generate the SQL DDL (CREATE TABLE statements) for these entities.
Include primary keys for all tables.
Suggest appropriate data types for each column (e.g., VARCHAR2(255)/VARCHAR(255), NUMBER/INTEGER, DATE/TIMESTAMP, CLOB/TEXT for long descriptions, BOOLEAN).
Indicate foreign key relationships with comments or, if syntax is common, with constraints.
For primary keys, suggest auto-incrementing/identity mechanisms if possible (e.g., IDENTITY for PostgreSQL/MySQL, or a sequence + trigger approach for Oracle if you want to be detailed, otherwise just NUMBER GENERATED AS IDENTITY).

Structure your output clearly. You can provide a general DDL and then notes on dialect-specific adjustments, or separate blocks for each SQL dialect if that's clearer.
Example for a simple table:
\`\`\`sql
-- For Client Table
CREATE TABLE TBL_CLIENTS (
    ID_CLIENT VARCHAR(255) PRIMARY KEY, -- Or appropriate type like UUID or NUMBER
    NM_CLIENT VARCHAR(255) NOT NULL,
    CD_CLIENT_CODE VARCHAR(50) UNIQUE NOT NULL,
    NR_CNPJ_CPF VARCHAR(20),
    DS_EMAIL VARCHAR(255),
    NR_PHONE VARCHAR(20)
);
\`\`\`
Begin your response with "Here is the suggested SQL DDL schema based on the application entities:"
`,
config: {
    temperature: 0.2, // Lower temperature for more deterministic DDL generation
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE', // Schemas might involve terms flagged by default
      },
       {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

const suggestApplicationSchemaFlow = ai.defineFlow(
  {
    name: 'suggestApplicationSchemaFlow',
    inputSchema: SuggestApplicationSchemaInputSchema,
    outputSchema: SuggestApplicationSchemaOutputSchema,
  },
  async (input) => {
    // The input is not strictly needed for this version of the prompt,
    // but we pass it in case the prompt evolves to use it.
    const {output} = await prompt(input || {}); // Pass empty object if input is undefined
    if (!output) {
      throw new Error("AI did not return a valid output for schema suggestion.");
    }
    return output;
  }
);
