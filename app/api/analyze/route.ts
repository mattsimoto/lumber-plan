import { env } from 'cloudflare:workers';
import { analyzeRequest, type AnalysisEnv } from '../../../lib/analysis-server';

export async function POST(request:Request){
  // Sites dispatch authenticates the visitor and supplies this trusted header.
  return analyzeRequest(request,env as AnalysisEnv,request.headers.get('oai-authenticated-user-id'));
}
export async function GET(request:Request){
  if(!request.headers.get('oai-authenticated-user-id'))return Response.json({ready:false,error:'Sign in to continue.'},{status:401,headers:{'Cache-Control':'no-store'}});
  return Response.json({ready:Boolean((env as AnalysisEnv).OPENAI_API_KEY)},{headers:{'Cache-Control':'no-store'}});
}
