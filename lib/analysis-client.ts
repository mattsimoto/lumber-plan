import { ANALYSIS_ORIGIN, analysisSchema, type Analysis, type AnalysisInput, MAX_UPLOAD_BYTES } from './analysis-contract';

async function inputFromFile(file:File|null,description:string):Promise<AnalysisInput>{
 if(!file)return {description};
 if(file.size>MAX_UPLOAD_BYTES)throw new Error('Use a file smaller than 15 MB.');
 const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('The file could not be read.'));reader.readAsDataURL(file)});
 return {description,file:{name:file.name,type:file.type,data}};
}
export async function requestAnalysis(input:AnalysisInput,signal?:AbortSignal):Promise<Analysis>{
 const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal});
 if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Sign in to the analysis window and try again.');
 const data=await response.json() as {error?:unknown;analysis?:unknown};if(!response.ok)throw new Error(typeof data.error==='string'?data.error:'Analysis failed. Please try again.');
 return analysisSchema.parse(data.analysis);
}
export function startAnalysis(file:File|null,description:string,onStatus:(text:string)=>void):{promise:Promise<Analysis>;cancel:()=>void}{
 const controller=new AbortController();let cancel=()=>controller.abort();
 if(window.location.origin===ANALYSIS_ORIGIN||window.location.hostname==='localhost'||window.location.hostname==='terminal.local'){
  return {promise:inputFromFile(file,description).then(input=>requestAnalysis(input,controller.signal)),cancel};
 }
 const job=crypto.randomUUID();
 const popup=window.open(`${ANALYSIS_ORIGIN}/analysis-bridge#${job}`,'lumberplan-analysis','popup,width=580,height=640');
 if(!popup)return {promise:Promise.reject(new Error('Allow the analysis window to open, then try again.')),cancel};
 const promise=new Promise<Analysis>((resolve,reject)=>{
  let sent=false;let done=false;let timeout:ReturnType<typeof setTimeout>;let poll:ReturnType<typeof setInterval>;
  const finish=(error?:Error,result?:Analysis)=>{if(done)return;done=true;clearTimeout(timeout);clearInterval(poll);window.removeEventListener('message',receive);popup.close();if(error)reject(error);else if(result)resolve(result)};
  const receive=async(event:MessageEvent)=>{
   if(event.origin!==ANALYSIS_ORIGIN||event.source!==popup||event.data?.job!==job)return;
   if(event.data.type==='lumberplan-ready'&&!sent){sent=true;onStatus('Reading your reference…');try{const input=await inputFromFile(file,description);if(!done)popup.postMessage({type:'lumberplan-analyze',job,input},ANALYSIS_ORIGIN)}catch(e){finish(e instanceof Error?e:new Error('Unable to read this file.'))}}
   if(event.data.type==='lumberplan-result'){const parsed=analysisSchema.safeParse(event.data.analysis);if(parsed.success)finish(undefined,parsed.data);else finish(new Error('The analysis was incomplete. Please try again.'))}
   if(event.data.type==='lumberplan-error')finish(new Error(String(event.data.error||'Analysis failed.')));
  };
  window.addEventListener('message',receive);
  // A nonce-bound handshake works even if sign-in drops the URL fragment.
  poll=setInterval(()=>{if(popup.closed){finish(new Error('The analysis window was closed. Reopen it to continue.'));return}popup.postMessage({type:'lumberplan-hello',job},ANALYSIS_ORIGIN)},750);
  timeout=setTimeout(()=>finish(new Error('The analysis window timed out. If you just signed in, please try again.')),180000);
  cancel=()=>finish(new Error('Analysis canceled.'));
 });
 return {promise,cancel:()=>cancel()};
}
