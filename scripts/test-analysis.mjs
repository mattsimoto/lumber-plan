import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import ts from 'typescript';
const dir=new URL('../.sites-runtime/analysis-tests/',import.meta.url);
await mkdir(dir,{recursive:true});
try{
 for(const name of ['analysis-contract','planner','local-analysis']){
  const source=await readFile(new URL(`../lib/${name}.ts`,import.meta.url),'utf8');
  const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace("'./analysis-contract'","'./analysis-contract.mjs'").replace("'./planner'","'./planner.mjs'");
  await writeFile(new URL(`${name}.mjs`,dir),js);
 }
 const {lengthInches,rowsFromText,localReport,draftReport,suggestedLayout}=await import(new URL('local-analysis.mjs',dir));
 assert.equal(lengthInches('36 in'),36);assert.equal(lengthInches('3 feet 6 inches'),42);
 assert.equal(lengthInches('1/2 inch'),.5);assert.equal(lengthInches('36 1/2 in'),36.5);
 assert.equal(lengthInches('914.4 mm'),36);assert.equal(lengthInches('91.44 cm'),36);
 assert.equal(lengthInches('36'),null);assert.equal(lengthInches('No scale'),null);
 const row=rowsFromText('4 legs, 2x4, 36 in')[0];assert.equal(row.qty,4);assert.equal(row.length,36);assert.equal(row.size,'2×4');assert.equal(row.name,'legs');
 const rails=rowsFromText('Long rails, 2x4, 48 in, qty 2')[0];assert.equal(rails.qty,2);assert.equal(rails.length,48);
 assert.equal(rowsFromText('2x4 36 in')[0].qty,null);
 assert.equal(rowsFromText('Legs 2x4 qty 4')[0].length,null);
 assert.equal(rowsFromText('An unscaled bench with legs').length,0);
 const photo=localReport('','','The bench has four legs, a seat and rails. It is 60 inches long.');
 assert.ok(photo.components.length>0);assert.equal(photo.draftLayout,'bench');assert.equal(photo.draftDimensions.width,48);assert.ok(photo.components.every(c=>c.length>0&&c.qty>0&&c.size));assert.ok(photo.assumptions[0].includes('not measurements'));assert.ok(!photo.components.some(c=>c.length===60));
 const custom=localReport('','','A pergola with posts and rafters');assert.ok(custom.components.every(c=>c.length===null&&c.qty===null));assert.equal(custom.draftLayout,undefined);
 assert.equal(suggestedLayout('a bench beside a planter'),null);
 const revised=draftReport(photo,'bench',{width:72,depth:18,height:20,shelves:3});assert.equal(revised.components[0].length,72);assert.equal(revised.components[1].length,18.5);
 assert.throws(()=>draftReport(photo,'bench',{width:0,depth:18,height:20,shelves:3}));
 const explicit=localReport('4 legs, 2x4, 36 in','','A bench with legs');assert.equal(explicit.draftLayout,undefined);assert.equal(explicit.components[0].length,36);
 const {pack}=await import(new URL('planner.mjs',dir));for(const kind of ['bench','planter','shelf']){const plan=draftReport(custom,kind);const packed=pack(plan.components,[96,120],.125);assert.equal(packed.errors.length,0);assert.ok(packed.boards.length>0);assert.ok(plan.hardware.length>0)}
 const mixed=localReport('4 legs, 2x4, 36 in','Long rails, 2x4, 48 in, qty 2');assert.equal(mixed.components.length,2);assert.equal(mixed.sourceText,'Long rails, 2x4, 48 in, qty 2');
 console.log('Local analysis tests passed: units, fractions, component rows, missing values, and rejection of model-invented dimensions/counts.');
}finally{await rm(dir,{recursive:true,force:true})}
