export type Piece={id:string;name:string;size:string;length:number;qty:number;angle:string};
export type Board={size:string;stock:number;cuts:{name:string;length:number}[];used:number};
export const uid=()=>Math.random().toString(36).slice(2,9);
export function template(kind:string,w:number,d:number,h:number,shelves:number):Piece[]{
 const p=(name:string,size:string,length:number,qty:number):Piece=>({id:uid(),name,size,length:Math.round(length*1000)/1000,qty,angle:'Square / 90°'});
 if(kind==='planter')return [p('Long side boards','2×6',w,2*Math.ceil(h/5.5)),p('End boards · fit between sides','2×6',d-3,2*Math.ceil(h/5.5)),p('Inside corner cleats','2×2',h,4)];
 if(kind==='bench')return [p('Seat boards · ¼″ gaps','2×6',w,Math.ceil((d+.25)/5.75)),p('Legs','4×4',h-1.5,4),p('Long aprons · between legs','2×4',w-7,2),p('End aprons · between legs','2×4',d-7,2),p('Seat supports · inside aprons','2×4',d-3,Math.max(1,Math.ceil(w/24)-1))];
 if(kind==='shelf')return [p('Uprights','2×4',h,4),p('Long shelf rails','2×4',w-3,2*shelves),p('End shelf rails','2×4',d-7,2*shelves),p('Shelf slats · ¼″ gaps','1×4',d,Math.ceil((w+.25)/3.75)*shelves)];
 return [];
}
export function pack(pieces:Piece[],stocks:number[],kerf:number){
 const boards:Board[]=[];const errors:string[]=[];
 for(const size of [...new Set(pieces.map(p=>p.size))]){
 const cuts=pieces.filter(p=>p.size===size).flatMap(p=>Array.from({length:p.qty},()=>({name:p.name,length:p.length}))).sort((a,b)=>b.length-a.length);
 while(cuts.length){const longest=cuts[0];const options=stocks.filter(s=>s>=longest.length).map(stock=>{let used=0;const indices:number[]=[];cuts.forEach((c,i)=>{const need=c.length+(used?kerf:0);if(used+need<=stock+1e-8){used+=need;indices.push(i)}});return {stock,used,indices}});
 if(!options.length){errors.push(`${size}: ${longest.name} (${longest.length}″) exceeds every selected stock length.`);cuts.shift();continue}
 options.sort((a,b)=>(a.stock-a.used)-(b.stock-b.used)||a.stock-b.stock);const best=options[0];boards.push({size,stock:best.stock,used:best.used,cuts:best.indices.map(i=>cuts[i])});for(const i of best.indices.reverse())cuts.splice(i,1);
 }
 }return {boards,errors};
}
