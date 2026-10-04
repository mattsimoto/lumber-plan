'use client';
import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { Analysis, LUMBER_SIZES } from '../lib/analysis-contract';
import { startAnalysis } from '../lib/analysis-client';
import { draftDefaults, draftReport, type DraftLayout } from '../lib/local-analysis';
import DimensionInputs from './dimension-inputs';
import { Piece, uid } from '../lib/planner';

type Row=Analysis['components'][number]&{include:boolean};
export default function ProjectAnalysis({file,description,onApply}:{file:File|null;description:string;onApply:(pieces:Piece[],analysis:Analysis)=>void}){
 const [mode,setMode]=useState<'drawing'|'photo'>('photo'),[page,setPage]=useState(1);
 const [busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState(''),[result,setResult]=useState<Analysis|null>(null),[rows,setRows]=useState<Row[]>([]),[confirmed,setConfirmed]=useState(false);
 const [layout,setLayout]=useState<DraftLayout>('bench'),[dims,setDims]=useState(draftDefaults.bench),[draftError,setDraftError]=useState('');
 const review=useRef<HTMLDialogElement>(null),cancel=useRef<null|(()=>void)>(null),generation=useRef(0);
 useEffect(()=>{setMode(file?.type==='application/pdf'?'drawing':'photo');setPage(1)},[file]);
 useEffect(()=>{if(result&&!review.current?.open)review.current?.showModal()},[result]);
 useEffect(()=>{generation.current++;cancel.current?.();cancel.current=null;setBusy(false);setStatus('');setError('');setResult(null);setRows([]);setConfirmed(false)},[file,description,mode,page]);
 useEffect(()=>()=>{generation.current++;cancel.current?.()},[]);
 function show(data:Analysis){setResult(data);setRows(data.components.map(r=>({...r,include:true})));setConfirmed(false);setDraftError('');if(data.draftLayout){setLayout(data.draftLayout);setDims(data.draftDimensions??draftDefaults[data.draftLayout])}}
 async function analyze(){
  const attempt=++generation.current;setBusy(true);setError('');setResult(null);setConfirmed(false);setStatus('Starting local analysis…');
  const operation=startAnalysis(file,description,text=>{if(attempt===generation.current)setStatus(text)},{mode,page});cancel.current=operation.cancel;
  try{const data=await operation.promise;if(attempt!==generation.current)return;show(data);setStatus('')}
  catch(e){if(attempt===generation.current)setError(e instanceof Error?e.message:'Analysis failed.')}
  finally{if(attempt===generation.current){setBusy(false);cancel.current=null}}
 }
 function edit(index:number,patch:Partial<Row>){setRows(old=>old.map((r,i)=>i===index?{...r,...patch}:r));setConfirmed(false)}
 function rebuild(){if(!result)return;try{show(draftReport(result,layout,dims))}catch(e){setDraftError(e instanceof Error?e.message:'Check the dimensions.')}}
 const draftChanged=!!result?.draftLayout&&(layout!==result.draftLayout||JSON.stringify(dims)!==JSON.stringify(result.draftDimensions));
 const selected=rows.filter(r=>r.include),valid=selected.length>0&&selected.every(r=>r.size&&r.length!==null&&r.length>0&&r.length<=1200&&r.qty!==null&&Number.isInteger(r.qty)&&r.qty>0&&r.qty<=500);
 return <div className="project-analysis">
  <label>Reference type<select value={mode} disabled={busy} onChange={e=>setMode(e.target.value as 'drawing'|'photo')}><option value="photo">Photo · identify structure and draft parts</option><option value="drawing">Drawing / blueprint · read dimensions and text</option></select></label>
  {file?.type==='application/pdf'&&<label>PDF page to analyze<input type="number" min="1" step="1" value={page} onChange={e=>setPage(Math.max(1,Math.floor(Number(e.target.value))))}/></label>}
  <button className="primary full" disabled={busy||(!file&&!description.trim())} onClick={analyze}><Sparkles size={17}/>{busy?'Analyzing…':file?'Generate plan from reference':'Analyze description'}</button>
  <small>Free processing on your device. Photo mode downloads a model on first use and may take several minutes. Photos provide a starting layout; exact measurements need confirmation.</small>
  {busy&&<div role="status"><p className="hint">{status}</p><button className="quiet" onClick={()=>cancel.current?.()}><X size={15}/>Cancel</button></div>}
  {error&&<p className="error" role="alert">{error}</p>}
  {result&&<dialog ref={review} className="analysis-review" aria-label="Review analyzed components" onCancel={()=>setResult(null)}><div className="review-content">
   <div className="section-heading"><div><div className="eyebrow">{result.draftLayout?'DRAFT · ASSUMED DIMENSIONS':'REVIEW BEFORE APPLYING'}</div><h2>{result.title}</h2></div><button className="icon" aria-label="Close review" onClick={()=>setResult(null)}><X/></button></div>
   <p>{result.summary}</p>
   {(result.draftLayout||rows.length===0||rows.some(r=>r.length===null))&&<div className="photo-draft">
    <h3>{result.draftLayout?'Adjust this starting design':'Create a starting design'}</h3>
    <p className="hint">{result.draftLayout?'The photo suggested this structure type. Parts and numbers below come from a standard layout, not measurements of the image.':'Choose a matching layout to generate a draft. This is a manual fallback, not a detected result. Custom structures need individual part details.'}</p>
    <label>Starting layout<select value={layout} onChange={e=>{const kind=e.target.value as DraftLayout;setLayout(kind);setDims(draftDefaults[kind]);setConfirmed(false)}}><option value="bench">Simple backless bench</option><option value="planter">Open-bottom raised bed</option><option value="shelf">Freestanding shelving</option></select></label>
    <DimensionInputs dimensions={(['width','depth','height'] as const).map(key=>({label:key==='width'?'Length':key==='depth'?'Depth':'Height',value:dims[key],onChange:(value:number)=>{setDims(previous=>({...previous,[key]:value}));setConfirmed(false)}}))}/>
    {layout==='shelf'&&<label>Shelf levels<input type="number" min="1" max="10" value={dims.shelves} onChange={e=>{setDims({...dims,shelves:Number(e.target.value)});setConfirmed(false)}}/></label>}
    <button className="secondary" onClick={rebuild}>Recalculate draft parts</button><small>Recalculating replaces the reviewed rows below.</small>{draftError&&<p className="error" role="alert">{draftError}</p>}
   </div>}
   {result.sourceText&&<details><summary>Recognized text</summary><pre className="recognized-text">{result.sourceText}</pre></details>}
   {result.questions.length>0&&<div className="notice"><div><strong>Confirm these details</strong><ul>{result.questions.map((q,i)=><li key={i}>{q}</li>)}</ul></div></div>}
   {rows.length>0&&<h3>{rows.length} component groups · {selected.reduce((n,r)=>n+(r.qty??0),0)} proposed pieces</h3>}
   {rows.map((r,i)=><div className="analysis-row" key={i}><label className="check"><input type="checkbox" checked={r.include} onChange={e=>edit(i,{include:e.target.checked})}/><strong>{r.name}</strong><span className="evidence">{result.draftLayout?'Draft estimate':r.evidence==='dimensioned'?'From dimensions':r.evidence==='inferred'?'Verify values':'Needs details'}</span></label><p className="hint">{r.notes}</p><div className="review-fields"><label>Lumber<select value={r.size??''} onChange={e=>edit(i,{size:(e.target.value||null) as Row['size']})}><option value="">Confirm size</option>{LUMBER_SIZES.map(s=><option key={s}>{s}</option>)}</select></label><label>Length (in)<input type="number" min=".001" max="1200" step=".125" placeholder="Required" value={r.length??''} onChange={e=>edit(i,{length:e.target.value?Number(e.target.value):null})}/></label><label>Quantity<input type="number" min="1" max="500" placeholder="Required" value={r.qty??''} onChange={e=>edit(i,{qty:e.target.value?Number(e.target.value):null})}/></label><label>Cut ends<input value={r.angle} onChange={e=>edit(i,{angle:e.target.value})}/></label></div></div>)}
   {result.assumptions.length>0&&<><h3>Assumptions</h3><ul>{result.assumptions.map((a,i)=><li key={i}>{a}</li>)}</ul></>}
   {result.hardware.length>0&&<><h3>Proposed hardware</h3><ul>{result.hardware.map((a,i)=><li key={i}>{a}</li>)}</ul></>}
   <div className="review-actions">{draftChanged&&<p className="hint">Recalculate draft parts to apply the changed dimensions before generating the plan.</p>}<label className="check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>{result.draftLayout?'Use these draft values for planning. I will verify measurements and joints before buying or cutting.':'I have verified included sizes, cut lengths, quantities and joints.'}</label>{!valid&&<p className="hint">Fill in missing values, choose a starting design, or exclude unresolved components.</p>}<button className="primary" disabled={!valid||!confirmed||draftChanged} onClick={()=>{onApply(selected.map(r=>({id:uid(),name:r.name,size:r.size!,length:r.length!,qty:r.qty!,angle:r.angle})),{...result,components:selected.map(({include,...r})=>{void include;return r})});setResult(null)}}><Check size={17}/>Generate buy list & cut plan</button><small>This replaces the current list. Unchecked items are omitted.</small></div>
  </div></dialog>}
 </div>;
}
