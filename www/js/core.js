'use strict';
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.RepairCore = factory(); })(typeof self !== 'undefined' ? self : this, function () {
  const STATUS = ['received','diagnosing','waiting-approval','waiting-parts','repairing','quality-check','ready','delivered','cancelled'];
  const CATEGORIES = ['phone','computer','console','tablet','appliance','audio','other'];
  const LANGS = ['es','en','pt','fr'];
  const PLANS = Object.freeze({free:Object.freeze({activeOrders:20,parts:40,encryptedBackup:false}),'repair-pro':Object.freeze({activeOrders:100,parts:500,encryptedBackup:false}),'repair-pro-plus':Object.freeze({activeOrders:Infinity,parts:Infinity,encryptedBackup:true})});
  function planLimits(plan='free'){return PLANS[plan]||PLANS.free;}
  const TODAY = () => new Date().toISOString();
  const id = () => crypto.randomUUID();
  const clean = (v, n=500) => typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim().slice(0,n) : '';
  const number = (v, min=0, max=1e9) => Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : 0;
  function emptyState(lang='es') { return { schema: 1, createdAt: TODAY(), shop: { name:'', kind:'repair-shop', currency:'ARS', email:'', phone:'', address:'' }, settings: { lang: LANGS.includes(lang)?lang:'es', theme:'system', motion:'on', motionChosen:false, opening:true, autoUpdate:true, compact:false, watermark:true, paper:'a4', printWidth:80, printHeight:120, tourDone:false }, categories:[...CATEGORIES], statuses:[...STATUS], orders:[], parts:[] }; }
  function addEvent(order, kind, title, detail='', extra={}) {
    const previous = order.events.at(-1); const body = { id:id(), at:TODAY(), kind:clean(kind,40), title:clean(title,160), detail:clean(detail,1200), extra, previousHash:previous?.hash || '' };
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body))).then(bytes => { body.hash=[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join(''); order.events.push(body); order.updatedAt=body.at; return body; });
  }
  async function verifyEvents(events) {
    let prev='';
    for (const e of events) { const {hash,...body}=e; if (body.previousHash!==prev) return false; const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(body))); const expected=[...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join(''); if(expected!==hash)return false; prev=hash; }
    return true;
  }
  function createOrder(input, state, limits=PLANS.free) {
    if(stats(state).active>=limits.activeOrders)throw Error('plan-active-order-limit');
    const name=clean(input.customerName,100), contact=clean(input.customerContact,160), problem=clean(input.problem,3000);
    if (!name || !contact || !problem) throw Error('required-fields');
    let ticket, serial=0; do { ticket=`KR-${new Date().getFullYear()}-${String(Date.now()+serial++).slice(-6)}`; } while(state.orders.some(x=>x.ticket===ticket));
    const order={ id:id(), ticket, createdAt:TODAY(), updatedAt:TODAY(), status:'received', priority:['normal','high','urgent'].includes(input.priority)?input.priority:'normal', customer:{name,contact}, device:{category:(state.categories||CATEGORIES).includes(input.category)?input.category:'other',brand:clean(input.brand,100),model:clean(input.model,120),serial:clean(input.serial,160),condition:clean(input.condition,1200),accessories:clean(input.accessories,600)}, problem, diagnosis:'', dueDate:/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate||'')?input.dueDate:'', quoteVersions:[], parts:[], photos:[], events:[] };
    state.orders.unshift(order); return addEvent(order,'created','Repair received',problem,{customer:name,contact,device:order.device,dueDate:order.dueDate});
  }
  async function updateOrder(order, patch, description, reason='') {
    const allowed=['status','priority','diagnosis','dueDate','device','problem']; const changes={};
    for(const key of allowed) if(Object.hasOwn(patch,key)) { const before=order[key]; const after=patch[key]; if(JSON.stringify(before)!==JSON.stringify(after)){ changes[key]={before,after}; order[key]=after; } }
    if(!Object.keys(changes).length)return null;
    return addEvent(order,'updated',clean(description,160)||'Work order updated',clean(reason,1200),{changes});
  }
  async function addCorrection(order, targetEventId, text, reason) {
    if(!order.events.some(e=>e.id===targetEventId))throw Error('event-not-found');
    text=clean(text,1200); reason=clean(reason,800); if(!text||!reason)throw Error('correction-fields');
    return addEvent(order,'correction','Correction added',text,{targetEventId,reason});
  }
  async function addQuote(order, lines, note='') {
    if(!Array.isArray(lines)||!lines.length)throw Error('quote-lines');
    const safe=lines.slice(0,100).map(x=>({description:clean(x.description,180),quantity:number(x.quantity,0.01,100000),unitPrice:number(x.unitPrice,0,1e9)}));
    if(safe.some(x=>!x.description))throw Error('quote-description');
    const quote={id:id(),version:order.quoteVersions.length+1,createdAt:TODAY(),status:'pending',note:clean(note,1000),lines:safe,total:safe.reduce((s,x)=>s+x.quantity*x.unitPrice,0)};
    order.quoteVersions.push(quote); await addEvent(order,'quote','Estimate prepared',`${quote.lines.length} line(s) · ${quote.total.toFixed(2)}`,{quoteId:quote.id,version:quote.version,total:quote.total}); return quote;
  }
  async function recordApproval(order, quoteId, decision, method='in-person', note='') {
    const q=order.quoteVersions.find(x=>x.id===quoteId); if(!q)throw Error('quote-not-found'); if(!['approved','rejected'].includes(decision))throw Error('decision');
    q.status=decision; q.decidedAt=TODAY(); q.method=clean(method,40); q.decisionNote=clean(note,800);
    await addEvent(order,decision==='approved'?'approval':'rejection',decision==='approved'?'Estimate approved':'Estimate declined',q.decisionNote,{quoteId:q.id,version:q.version,total:q.total,method:q.method}); return q;
  }
  async function addPart(state, input, limits=PLANS.free) {
    if(state.parts.filter(p=>!p.archived).length>=limits.parts)throw Error('plan-parts-limit');
    const name=clean(input.name,140); if(!name)throw Error('part-name');
    const part={id:id(),sku:clean(input.sku,80),name,category:clean(input.category,80),quantity:number(input.quantity,0,1e7),cost:number(input.cost,0,1e9),price:number(input.price,0,1e9),minimum:number(input.minimum,0,1e7),createdAt:TODAY(),updatedAt:TODAY(),archived:false}; state.parts.unshift(part); return part;
  }
  async function usePart(state, order, partId, quantity) {
    const part=state.parts.find(p=>p.id===partId&&!p.archived), qty=number(quantity,0.01,1e6); if(!part||part.quantity<qty)throw Error('stock-insufficient');
    part.quantity-=qty; part.updatedAt=TODAY(); order.parts.push({partId,quantity:qty,at:TODAY(),name:part.name,unitPrice:part.price}); await addEvent(order,'part-used','Part assigned',`${part.name} · ${qty}`,{partId,quantity:qty});
  }
  function safeMeta(value,depth=0) {
    if(depth>6)return null;
    if(value===null||typeof value==='boolean')return value;
    if(typeof value==='number')return Number.isFinite(value)?value:null;
    if(typeof value==='string')return clean(value,1200);
    if(Array.isArray(value))return value.slice(0,100).map(v=>safeMeta(v,depth+1));
    if(value&&typeof value==='object'){const out={};for(const [k,v] of Object.entries(value).slice(0,100)){if(['__proto__','prototype','constructor'].includes(k))continue;out[clean(k,100)]=safeMeta(v,depth+1);}return out;}
    return null;
  }
  function sanitize(raw) {
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('invalid-backup');
    const s=emptyState(); const shop=raw.shop||{}; s.shop={name:clean(shop.name,120),kind:clean(shop.kind,60)||'repair-shop',currency:/^[A-Z]{3}$/.test(shop.currency)?shop.currency:'ARS',email:clean(shop.email,160),phone:clean(shop.phone,80),address:clean(shop.address,220)};
    const st=raw.settings||{}, motionChosen=st.motionChosen===true; s.settings={...s.settings,lang:LANGS.includes(st.lang)?st.lang:'es',theme:['light','dark','system'].includes(st.theme)?st.theme:'system',motion:st.motion==='off'?'off':st.motion==='on'?'on':st.motion==='system'&&motionChosen?'system':'on',motionChosen,opening:st.opening!==false,autoUpdate:st.autoUpdate!==false,compact:!!st.compact,watermark:st.watermark!==false,paper:['a4','letter','58mm','80mm','custom'].includes(st.paper)?st.paper:'a4',printWidth:number(st.printWidth,40,300)||80,printHeight:number(st.printHeight,50,600)||120,tourDone:!!st.tourDone};
    if(Array.isArray(raw.categories))s.categories=[...new Set([...CATEGORIES,...raw.categories.map(x=>clean(x,60)).filter(Boolean)])].slice(0,50);
    if(Array.isArray(raw.statuses))s.statuses=[...new Set(raw.statuses.filter(x=>STATUS.includes(x)))];
    const orders=Array.isArray(raw.orders)?raw.orders:[]; if(orders.length>100000)throw Error('backup-too-large');
    s.orders=orders.map(o=>{ if(!o||typeof o!=='object')throw Error('invalid-order'); const customer=o.customer||{}, device=o.device||{}; const q=Array.isArray(o.quoteVersions)?o.quoteVersions.slice(0,100).map((x,i)=>({id:clean(x.id,64)||id(),version:i+1,createdAt:typeof x.createdAt==='string'?x.createdAt:TODAY(),status:['pending','approved','rejected'].includes(x.status)?x.status:'pending',note:clean(x.note,1000),lines:Array.isArray(x.lines)?x.lines.slice(0,100).map(y=>({description:clean(y.description,180),quantity:number(y.quantity,0,1e6),unitPrice:number(y.unitPrice,0,1e9)})):[],total:number(x.total,0,1e12),decidedAt:clean(x.decidedAt,40),method:clean(x.method,40),decisionNote:clean(x.decisionNote,800)})):[]; const category=clean(device.category,60); return {id:clean(o.id,64)||id(),ticket:clean(o.ticket,50),createdAt:clean(o.createdAt,40)||TODAY(),updatedAt:clean(o.updatedAt,40)||TODAY(),status:STATUS.includes(o.status)?o.status:'received',priority:['normal','high','urgent'].includes(o.priority)?o.priority:'normal',customer:{name:clean(customer.name,100),contact:clean(customer.contact,160)},device:{category:s.categories.includes(category)?category:'other',brand:clean(device.brand,100),model:clean(device.model,120),serial:clean(device.serial,160),condition:clean(device.condition,1200),accessories:clean(device.accessories,600)},problem:clean(o.problem,3000),diagnosis:clean(o.diagnosis,3000),dueDate:/^\d{4}-\d{2}-\d{2}$/.test(o.dueDate||'')?o.dueDate:'',quoteVersions:q,parts:Array.isArray(o.parts)?o.parts.slice(0,1000).map(x=>({partId:clean(x.partId,64),quantity:number(x.quantity,0,1e6),at:clean(x.at,40),name:clean(x.name,140),unitPrice:number(x.unitPrice,0,1e9)})):[],photos:Array.isArray(o.photos)?o.photos.slice(0,50).map(x=>({id:clean(x.id,64),name:clean(x.name,120),mime:clean(x.mime,80),size:number(x.size,0,15*1048576)})):[],events:Array.isArray(o.events)?o.events.slice(0,20000).map(x=>({id:clean(x.id,64),at:clean(x.at,40),kind:clean(x.kind,40),title:clean(x.title,160),detail:clean(x.detail,1200),extra:safeMeta(x.extra||{}),previousHash:clean(x.previousHash,64),hash:clean(x.hash,64)})):[]}; });
    const parts=Array.isArray(raw.parts)?raw.parts:[]; if(parts.length>100000)throw Error('backup-too-large'); s.parts=parts.map(p=>({id:clean(p.id,64)||id(),sku:clean(p.sku,80),name:clean(p.name,140),category:clean(p.category,80),quantity:number(p.quantity,0,1e7),cost:number(p.cost,0,1e9),price:number(p.price,0,1e9),minimum:number(p.minimum,0,1e7),createdAt:clean(p.createdAt,40)||TODAY(),updatedAt:clean(p.updatedAt,40)||TODAY(),archived:!!p.archived}));
    return s;
  }
  function stats(s) { const active=s.orders.filter(o=>!['delivered','cancelled'].includes(o.status)); return {active:active.length,ready:s.orders.filter(o=>o.status==='ready').length,waiting:s.orders.filter(o=>['waiting-parts','waiting-approval'].includes(o.status)).length,overdue:active.filter(o=>o.dueDate&&o.dueDate<new Date().toISOString().slice(0,10)).length,week:Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);const key=d.toISOString().slice(0,10);return {day:key,count:s.orders.filter(o=>o.createdAt.slice(0,10)===key).length};})}; }
  return { STATUS,CATEGORIES,LANGS,PLANS,planLimits,emptyState,addEvent,verifyEvents,createOrder,updateOrder,addCorrection,addQuote,recordApproval,addPart,usePart,sanitize,stats,id,clean,number };
});
