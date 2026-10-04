import { type Analysis, MAX_UPLOAD_BYTES } from './analysis-contract';
import { localReport } from './local-analysis';
export type LocalAnalysisOptions={mode:'drawing'|'photo';page:number};
const TESSERACT='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.esm.min.js';
const PDFJS='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs';
const PDF_WORKER='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
type OCRWorker={recognize:(image:Blob)=>Promise<{data:{text:string}}>;terminate:()=>Promise<unknown>};
function imageUrl(blob:Blob):Promise<string>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Could not read this image.'));reader.readAsDataURL(blob)})}
export function startAnalysis(file:File|null,description:string,onStatus:(text:string)=>void,options:LocalAnalysisOptions={mode:'drawing',page:1}):{promise:Promise<Analysis>;cancel:()=>void}{
 let canceled=false;let ocr:OCRWorker|null=null;let vision:Worker|null=null;let rejectPending:(e:Error)=>void=()=>{};let cleanupPdf:undefined|(()=>Promise<unknown>);
 const check=()=>{if(canceled)throw new Error('Analysis canceled.')};
 const promise=new Promise<Analysis>((resolve,reject)=>{rejectPending=reject;(async()=>{
  let recognized='';let observation='';const notes:string[]=[];
  if(!file){return localReport(description,'')}
  if(file.size>MAX_UPLOAD_BYTES)throw new Error('Use a file under 15 MB.');
  if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type))throw new Error('Use JPG, PNG, WEBP or PDF.');
  let image:Blob=file;
  if(file.type.startsWith('image/')){
   onStatus('Preparing image on your device…');
   const bitmap=await createImageBitmap(file);check();
   const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height));
   if(scale<1){const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const context=canvas.getContext('2d');if(!context){bitmap.close();throw new Error('This browser cannot prepare the image.')};context.drawImage(bitmap,0,0,canvas.width,canvas.height);image=await new Promise<Blob>((done,fail)=>canvas.toBlob(b=>b?done(b):fail(new Error('Could not resize this image.')),'image/png'));canvas.width=canvas.height=0}
   bitmap.close();
  }
  if(file.type==='application/pdf'){
   onStatus(`Reading PDF page ${options.page} on your device…`);
   const pdfjs=await import(/* @vite-ignore */ PDFJS);check();pdfjs.GlobalWorkerOptions.workerSrc=PDF_WORKER;
   const task=pdfjs.getDocument({data:await file.arrayBuffer(),isEvalSupported:false});cleanupPdf=()=>task.destroy();
   const pdf=await task.promise;check();if(options.page<1||options.page>pdf.numPages)throw new Error(`This PDF has ${pdf.numPages} pages. Choose a page from 1 to ${pdf.numPages}.`);
   const page=await pdf.getPage(options.page);const content=await page.getTextContent();
   recognized=content.items.map((item:{str?:string;hasEOL?:boolean})=>(item.str??'')+(item.hasEOL?'\n':' ')).join('');
   const initial=page.getViewport({scale:1});const viewport=page.getViewport({scale:Math.min(2,2400/Math.max(initial.width,initial.height))});
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   const context=canvas.getContext('2d');if(!context)throw new Error('This browser cannot render the PDF.');
   await page.render({canvasContext:context,viewport}).promise;check();
   image=await new Promise<Blob>((done,fail)=>canvas.toBlob(b=>b?done(b):fail(new Error('Could not render this PDF page.')),'image/png'));
   canvas.width=canvas.height=0;notes.push(`Only PDF page ${options.page} of ${pdf.numPages} was analyzed. Other pages are not included.`);
   await cleanupPdf();cleanupPdf=undefined;
  }
  check();
  if(recognized.trim().length<15){
   onStatus('Loading free text recognition…');
   try{
    const {default:Tesseract}=await import(/* @vite-ignore */ TESSERACT);check();
    ocr=await Tesseract.createWorker('eng',1,{logger:(p:{status:string;progress?:number})=>{if(!canceled)onStatus(`${p.status} ${Math.round((p.progress??0)*100)}%`)}});check();
    recognized=(await ocr!.recognize(image)).data.text;
   }catch(e){check();if(options.mode==='drawing')throw new Error('Text recognition could not load or finish. Check your connection and try a smaller, clearer image.');notes.push('Text recognition was unavailable for this photo.');void e}
   finally{await ocr?.terminate();ocr=null}
  }
  check();
  if(options.mode==='photo'){
   if(!('gpu' in navigator)){notes.push('This browser has no WebGPU support. Only text recognition was used.');}
   else try{
    const data=await imageUrl(image);check();
    observation=await new Promise<string>((done,fail)=>{
     vision=new Worker(new URL('./local-vision.worker.js',window.location.href),{type:'module'});
     vision.onmessage=event=>{const p=event.data;if(p.type==='status')onStatus(p.text);else if(p.type==='result')done(p.text);else if(p.type==='error')fail(new Error(p.text))};
     vision.onerror=()=>fail(new Error('The local photo model could not load.'));
     vision.postMessage({image:data});
    });
   }catch(e){check();notes.push(`Photo understanding unavailable: ${e instanceof Error?e.message:'model could not run'}. Text recognition results are still shown.`)}
  }
  check();return localReport(description,recognized,observation,notes.join(' '));
 })().then(result=>{if(!canceled)resolve(result)}).catch(e=>{if(!canceled)reject(e)}).finally(()=>{vision?.terminate();ocr?.terminate();cleanupPdf?.()})});
 return {promise,cancel:()=>{canceled=true;vision?.terminate();ocr?.terminate();cleanupPdf?.();rejectPending(new Error('Analysis canceled.'))}};
}
