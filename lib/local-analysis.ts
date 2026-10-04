import { analysisSchema, LUMBER_SIZES, type Analysis } from './analysis-contract';

function numberValue(value:string){
 const parts=value.trim().split(/[ -]+/);let result=0;
 for(const part of parts){if(part.includes('/')){const [n,d]=part.split('/').map(Number);if(!d)return null;result+=n/d}else result+=Number(part)}
 return Number.isFinite(result)?result:null;
}
export function lengthInches(text:string):number|null{
 const clean=text.replace(/[“”″]/g,'"').replace(/[‘’′]/g,"'");
 const feet=clean.match(/(\d+(?:\.\d+)?)\s*(?:ft\b|feet\b|foot\b|')\s*(?:[- ]*([\d ./-]+)\s*(?:in\b|inches\b|inch\b|"))?/i);
 if(feet){const tail=feet[2]?numberValue(feet[2]):0;return tail===null?null:Number(feet[1])*12+tail}
 const match=clean.match(/(\d+(?:\.\d+)?(?:[ -]+\d+\/\d+)?|\d+\/\d+)\s*(mm\b|cm\b|m\b|inches\b|inch\b|in\b|")/i);
 if(!match)return null;const amount=numberValue(match[1]);if(amount===null)return null;const unit=match[2].toLowerCase();const value=amount*(unit==='mm'?1/25.4:unit==='cm'?1/2.54:unit==='m'?100/2.54:1);return value>0&&value<=1200?Math.round(value*1000)/1000:null;
}
export function rowsFromText(text:string):Analysis['components']{
 const rows:Analysis['components']=[];
 for(const line of text.split(/[\n;]+/).filter(Boolean).slice(0,200)){
  const match=line.match(/\b(1|2|4|6)\s*[x×]\s*(2|4|6|8|10|12)\b/i);if(!match)continue;
  const size=`${match[1]}×${match[2]}`;if(!LUMBER_SIZES.includes(size as typeof LUMBER_SIZES[number]))continue;
  const withoutSize=line.replace(match[0],' ').trim();
  const qty=withoutSize.match(/\b(?:qty|quantity|count)\s*[:=x-]?\s*(\d+)\b/i)||line.slice(0,match.index).match(/^\s*(\d+)\s+(?=[a-z])/i);
  const quantity=qty?Number(qty[1]):null;
  const name=line.slice(0,match.index).replace(/^\s*\d+\s+(?:pcs?\.?\s*)?/i,'').trim().replace(/[|,:–-]+$/,'').trim()||`Component ${rows.length+1}`;
  rows.push({name:name.slice(0,150),size:size as typeof LUMBER_SIZES[number],length:lengthInches(withoutSize),qty:quantity&&quantity<=500?quantity:null,angle:'Confirm square or angled ends',evidence:'inferred',notes:`Read from text; verify every field against the original: ${line.slice(0,700)}`});
  if(rows.length===100)break;
 }
 return rows;
}
export function localReport(description:string,extractedText:string,visionText:string='',note:string=''):Analysis{
 // Numeric proposals come only from user-supplied or OCR text, never the small vision model.
 const components=rowsFromText(description+'\n'+extractedText);
 if(visionText){
  const candidates=[['Legs',/\blegs?\b/i],['Posts',/\bposts?\b/i],['Rails',/\brails?\b/i],['Braces',/\bbraces?\b/i],['Shelves',/\bshel(?:f|ves)\b/i],['Seat boards',/\bseat\b/i],['Top boards',/\b(?:tabletop|table top)\b/i],['Rafters',/\brafters?\b/i],['Wall boards',/\b(?:side boards|wall boards|planter)\b/i]] as const;
  for(const [name,pattern]of candidates){if(pattern.test(visionText)&&!components.some(c=>pattern.test(c.name)))components.push({name,size:null,length:null,qty:null,angle:'Confirm cut ends',evidence:'unknown',notes:'Mentioned by the local photo model. Verify that this part is present and supply its size, cut length and quantity.'})}
 }
 const summary=visionText?`Local model observation (unverified): ${visionText.slice(0,1900)}`:components.length?'Found possible component rows in the project text. Verify OCR and units before applying.':'Text was read locally, but no complete component rows were recognized. Add explicit part descriptions or use photo mode.';
 return analysisSchema.parse({title:'Local reference review',summary,components,questions:components.some(c=>c.length===null||c.qty===null||c.size===null)?['Supply the missing dimensions, sizes and quantities for included components.']:components.length?['Confirm that the list includes hidden members and all required connections.']:['Try a line such as “4 legs, 2x4, 36 in” or “Long rails, 2x4, 48 in, qty 2”.'],assumptions:['Text recognition and the small photo model can misread labels or miss members.','Photo-model dimensions and counts are deliberately not imported. Unscaled images need real measurements.',...(note?[note]:[])],hardware:['Confirm each joint, intended load and indoor/outdoor exposure before selecting fastener lengths and connectors. No verified hardware quantities are inferred from a photo.'],sourceText:extractedText.slice(0,24000)});
}
