import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import ts from 'typescript';
const dir=new URL('../.sites-runtime/analysis-tests/',import.meta.url);
await mkdir(dir,{recursive:true});
try{
 for(const name of ['analysis-contract','analysis-server']){
  const source=await readFile(new URL(`../lib/${name}.ts`,import.meta.url),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'./analysis-contract'","'./analysis-contract.mjs'");
  await writeFile(new URL(`${name}.mjs`,dir),js);
 }
 const {analyzeRequest}=await import(new URL('analysis-server.mjs',dir));
 const valid={title:'Unscaled bench',summary:'No dimension labels.',questions:['What is the seat length?'],assumptions:[],hardware:['Confirm the leg connection.'],components:[{name:'Seat',size:null,length:null,qty:1,angle:'Confirm',evidence:'unknown',notes:'No scale visible.'}]};
 const input={description:'An unscaled bench photo'};
 const request=(body,origin='https://example.test')=>new Request('https://example.test/api/analyze',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
 let calls=0;
 const success=async(_url,options)=>{calls++;const payload=JSON.parse(options.body);assert.equal(payload.store,false);assert.equal(payload.text.format.strict,true);return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(valid)}]}]})};
 assert.equal((await analyzeRequest(request(input),{OPENAI_API_KEY:'test'},null,success)).status,401);
 assert.equal((await analyzeRequest(request(input),{},'user',success)).status,503);
 assert.equal((await analyzeRequest(request(input,'https://other.test'),{OPENAI_API_KEY:'test'},'user',success)).status,403);
 assert.equal(calls,0);
 const response=await analyzeRequest(request(input),{OPENAI_API_KEY:'test'},'user',success);
 assert.equal(response.status,200);assert.equal((await response.json()).analysis.components[0].length,null);
 const bad={...input,file:{name:'bad.png',type:'image/png',data:'data:image/png;base64,YmFk'}};
 assert.equal((await analyzeRequest(request(bad),{OPENAI_API_KEY:'test'},'user',success)).status,400);
 const png='data:image/png;base64,'+Buffer.from('\x89PNG\r\n\x1a\n','binary').toString('base64');
 await analyzeRequest(request({...input,file:{name:'drawing.png',type:'image/png',data:png}}),{OPENAI_API_KEY:'test'},'user',async(_url,options)=>{const p=JSON.parse(options.body);assert.equal(p.input[0].content[1].type,'input_image');assert.equal(p.input[0].content[1].image_url,png);return success(_url,options)});
 const pdf='data:application/pdf;base64,'+Buffer.from('%PDF-1.7\n').toString('base64');
 await analyzeRequest(request({...input,file:{name:'plan.pdf',type:'application/pdf',data:pdf}}),{OPENAI_API_KEY:'test'},'user',async(_url,options)=>{const p=JSON.parse(options.body);assert.equal(p.input[0].content[1].type,'input_file');assert.equal(p.input[0].content[1].file_data,pdf);return success(_url,options)});
 const malformed=await analyzeRequest(request(input),{OPENAI_API_KEY:'test'},'user',async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{"components":[]}'}]}]}));assert.equal(malformed.status,502);
 const refused=await analyzeRequest(request(input),{OPENAI_API_KEY:'test'},'user',async()=>Response.json({status:'completed',output:[{type:'message',content:[{type:'refusal'}]}]}));assert.equal(refused.status,502);
 const limited=await analyzeRequest(request(input),{OPENAI_API_KEY:'test'},'user',async()=>new Response('provider detail',{status:429}));assert.equal(limited.status,502);assert.ok(!(await limited.text()).includes('provider detail'));
 console.log('Analysis tests passed: auth, origin, missing credential, null measurements, file validation, image/PDF payloads, invalid output, refusal and upstream errors. Provider requests were mocked.');
}finally{await rm(dir,{recursive:true,force:true})}
