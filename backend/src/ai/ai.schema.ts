import { z } from 'zod';

const cellValueSchema = z.union([z.string(), z.number(), z.null()]);

export const aiQueryResponseSchema = z.object({
  type: z.enum(['text', 'table', 'mixed', 'clarification']),
  title: z.string(),
  summary: z.string(),
  insights: z.array(z.string()),
  table: z
    .object({
      columns: z.array(z.string()),
      rows: z.array(z.record(cellValueSchema)),
    })
    .nullable(),
  followUpQuestions: z.array(z.string()),
});
