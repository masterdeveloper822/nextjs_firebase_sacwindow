
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-client-retention-script-flow.ts'; // Changed from suggest-recommended-actions.ts
import '@/ai/flows/analyze-database-schema-flow.ts';
import '@/ai/flows/suggest-application-schema-flow.ts';
import '@/ai/flows/analyze-page-code-flow.ts'; // Added new flow

