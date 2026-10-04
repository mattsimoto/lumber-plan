'use client';
import {useId,useState} from 'react';

type Dimension={label:string;value:number;onChange:(inches:number)=>void};
/** Store inches regardless of the selected display units, preserving existing plans. */
export default function DimensionInputs({dimensions}:{dimensions:Dimension[]}){
 const [units,setUnits]=useState<'mixed'|'in'|'ft'>('mixed');
 const id=useId();
 return <div className="dimension-editor">
  <label htmlFor={id}>Dimension units</label>
  <select id={id} value={units} onChange={e=>setUnits(e.target.value as typeof units)}><option value="mixed">Feet + inches</option><option value="ft">Feet</option><option value="in">Inches</option></select>
  <div className="dimension-rows">{dimensions.map(({label,value,onChange})=>{
   const safe=Number.isFinite(value)?Math.max(0,value):0,feet=Math.floor(safe/12),inches=Number((safe-feet*12).toFixed(6));
   return <div className="dimension-row" key={label}><span>{label}</span><div className="dimension-values">
    {units==='mixed'?<><label className="unit-input"><input aria-label={`${label} feet`} type="number" inputMode="numeric" min="0" step="1" value={feet} onChange={e=>onChange(Math.max(0,Math.floor(Number(e.target.value)))*12+inches)}/><span>ft</span></label><label className="unit-input"><input aria-label={`${label} inches`} type="number" inputMode="decimal" min="0" step=".125" value={inches} onChange={e=>onChange(feet*12+Math.max(0,Number(e.target.value)))}/><span>in</span></label></>:<label className="unit-input"><input aria-label={`${label} ${units==='ft'?'feet':'inches'}`} type="number" inputMode="decimal" min="0" step={units==='ft'?'.01':'.125'} value={units==='ft'?Number((safe/12).toFixed(6)):safe} onChange={e=>onChange(Math.max(0,Number(e.target.value))*(units==='ft'?12:1))}/><span>{units}</span></label>}
   </div></div>;
  })}</div>
 </div>;
}
