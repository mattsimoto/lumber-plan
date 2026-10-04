// Open-source inference on the visitor's device. No upload or inference API.
import { AutoProcessor, AutoModelForVision2Seq, TextStreamer, load_image, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
env.allowLocalModels = false;
// GitHub Pages does not provide cross-origin isolation for threaded WASM.
env.backends.onnx.wasm.numThreads = 1;
const modelId='HuggingFaceTB/SmolVLM-500M-Instruct';
const revision='a7da5b986cb59b408707209984f360a5f4ad7e47';
self.onmessage=async ({data})=>{
 let model;
 try{
  const adapter=await self.navigator.gpu?.requestAdapter().catch(()=>null);
  const device=adapter?'webgpu':'wasm';
  const dtype=adapter?.features.has('shader-f16')?'q4f16':'q4';
  const progress_callback=p=>{if(p.status==='progress')self.postMessage({type:'status',text:`Downloading photo model: ${p.file} ${Math.round(p.progress||0)}%`})};
  self.postMessage({type:'status',text:'Loading the local photo model. The first run downloads several hundred MB…'});
  const processor=await AutoProcessor.from_pretrained(modelId,{revision,progress_callback});
  model=await AutoModelForVision2Seq.from_pretrained(modelId,{revision,dtype,device,progress_callback});
  self.postMessage({type:'status',text:adapter?'Inspecting the photo…':'Inspecting on your CPU. This can take several minutes on a phone…'});
  const image=await load_image(data.image);
  const messages=[{role:'user',content:[{type:'image'},{type:'text',text:'Name the main wooden structure in this image first. Describe only what is visible and list its wooden parts, such as legs, posts, rails, braces, shelves or seat boards. Do not guess measurements. Keep the answer short.'}]}];
  const text=processor.apply_chat_template(messages,{add_generation_prompt:true});
  const inputs=await processor(text,[image],{do_image_splitting:false});
  let output='';
  const streamer=new TextStreamer(processor.tokenizer,{skip_prompt:true,skip_special_tokens:true,callback_function:chunk=>{output+=chunk;self.postMessage({type:'status',text:'Inspecting the photo on your device…'})}});
  await model.generate({...inputs,max_new_tokens:240,do_sample:false,repetition_penalty:1.1,streamer});
  if(!output.trim())throw new Error('The photo model did not produce a description.');
  self.postMessage({type:'result',text:output});
 }catch(e){self.postMessage({type:'error',text:e instanceof Error?e.message:String(e)})}
 finally{await model?.dispose()}
};
