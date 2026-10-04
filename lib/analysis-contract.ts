import { z } from 'zod';

export const LUMBER_SIZES = ['1×2','1×4','1×6','2×2','2×4','2×6','2×8','2×10','2×12','4×4','6×6'] as const;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const analysisSchema = z.object({
  sourceText: z.string().max(24000).optional(),
  title: z.string().min(1).max(200),
  summary: z.string().max(2500),
  assumptions: z.array(z.string().max(1000)).max(30),
  questions: z.array(z.string().max(1000)).max(30),
  hardware: z.array(z.string().max(1000)).max(30),
  components: z.array(z.object({
    name: z.string().min(1).max(150),
    size: z.enum(LUMBER_SIZES).nullable(),
    length: z.number().positive().max(1200).nullable(),
    qty: z.number().int().min(1).max(500).nullable(),
    angle: z.string().max(200),
    evidence: z.enum(['dimensioned','inferred','unknown']),
    notes: z.string().max(1500),
  }).strict()).max(100),
}).strict();
export type Analysis = z.infer<typeof analysisSchema>;
