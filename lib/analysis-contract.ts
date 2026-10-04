import { z } from 'zod';

export const LUMBER_SIZES = ['1×2','1×4','1×6','2×2','2×4','2×6','2×8','2×10','2×12','4×4','6×6'] as const;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const ANALYSIS_ORIGIN = 'https://timber-plan.magentaratsbane.chatgpt.site';
export const PAGES_ORIGIN = 'https://mattsimoto.github.io';
export const analysisSchema = z.object({
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
export type AnalysisInput = {description:string;file?:{name:string;type:string;data:string}};

const strings = {type:'array',items:{type:'string'}};
export const analysisJsonSchema = {
  type:'object',additionalProperties:false,
  required:['title','summary','assumptions','questions','hardware','components'],
  properties:{
    title:{type:'string'},summary:{type:'string'},assumptions:strings,questions:strings,hardware:strings,
    components:{type:'array',items:{type:'object',additionalProperties:false,
      required:['name','size','length','qty','angle','evidence','notes'],
      properties:{name:{type:'string'},size:{anyOf:[{type:'string',enum:LUMBER_SIZES},{type:'null'}]},length:{type:['number','null']},qty:{type:['integer','null']},angle:{type:'string'},evidence:{type:'string',enum:['dimensioned','inferred','unknown']},notes:{type:'string'}}}},
  },
};
