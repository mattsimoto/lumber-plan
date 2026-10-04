'use client';
import { useEffect, useState } from 'react';
import { PAGES_ORIGIN } from '../../lib/analysis-contract';
import { requestAnalysis } from '../../lib/analysis-client';

export default function AnalysisBridge(){
 const [status,setStatus]=useState('Waiting for your project…');
 const [error,setError]=useState(false);
 useEffect(()=>{
  let job='';let started=false;const controller=new AbortController();
  const receive=async(event:MessageEvent)=>{
   if(event.origin!==PAGES_ORIGIN||!window.opener||event.source!==window.opener)return;
   const message=event.data;if(typeof message?.job!=='string'||!/^[a-f0-9-]{36}$/.test(message.job))return;
   if(message.type==='lumberplan-hello'&&!started){job=message.job;window.opener.postMessage({type:'lumberplan-ready',job},PAGES_ORIGIN)}
   if(message.type!=='lumberplan-analyze'||started||message.job!==job)return;
   started=true;setStatus('Analyzing your reference. Keep this window open; the results will return to LumberPlan.');
   try{const analysis=await requestAnalysis(message.input,controller.signal);window.opener.postMessage({type:'lumberplan-result',job,analysis},PAGES_ORIGIN);setStatus('Analysis complete. You can return to LumberPlan.')}
   catch(e){const text=e instanceof Error?e.message:'Unable to analyze this reference.';setError(true);setStatus(text);window.opener?.postMessage({type:'lumberplan-error',job,error:text},PAGES_ORIGIN)}
  };
  window.addEventListener('message',receive);
  if(!window.opener){setError(true);setStatus('Return to LumberPlan and click Analyze again. If you just signed in, your session is now ready.')}
  return ()=>{window.removeEventListener('message',receive);controller.abort()};
 },[]);
 return <main className="analysis-window"><div className="eyebrow">LUMBERPLAN</div><h1>Project analysis</h1><p role={error?'alert':'status'}>{status}</p><p className="hint">Your reference is sent to OpenAI only when analysis is configured. Review the resulting measurements and component assumptions before applying them.</p><button className="secondary" onClick={()=>window.close()}>Close window</button></main>;
}
