(function(){
'use strict';
if(typeof S==='undefined'||typeof guideFor!=='function'||typeof worksheetItems!=='function'||typeof knowledgeItems!=='function')return;
const isMath=()=>S.subject==='math'||S.subject==='math3';
const GENERIC=/solve the practice for|solve the lesson problem|answer each question|central idea|representative problem|connect the procedure|show the essential method, check the result|explain which structure or shortcut you used|transfer: solve the lesson problem/i;
function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function norm(v){return clean(v).toLowerCase().replace(/[−–—]/g,'-').replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/≠/g,'!=').replace(/[^a-z0-9<>=+*/^().,-]+/g,' ').trim()}
function concrete(prompt){
  const p=clean(prompt);if(p.length<12||GENERIC.test(p))return false;
  return /\d|[=<>≤≥]|\b(?:solve|find|write|graph|evaluate|simplify|factor|expand|calculate|determine|classify|compare|converse|conditional|midpoint|distance|slope|intercept|mean|median|probability|polynomial|logarithm|\blog\b|sine|cosine|tangent|triangle|parallel|perpendicular|translation|reflection|rotation|dilation|function\s+[a-z]\(|[fgh]\s*\()\b/i.test(p);
}
function q(prompt,answer,guidance='Solve independently. Show the decisive work and verify the result.'){return {type:'math-solve',prompt:clean(prompt),answer:clean(answer)||'Use the chapter method and verify the result.',guidance}}
function add(out,seen,item){if(!item)return;const prompt=clean(item.prompt||item.question||item.try||'');if(!concrete(prompt))return;const key=norm(prompt);if(!key||seen.has(key))return;seen.add(key);out.push({...item,prompt})}
function sectionPool(ch){
  const out=[],seen=new Set();
  if(typeof mathSectionPractice==='function'){
    (ch.sections||[]).forEach((s,i)=>{try{for(const item of mathSectionPractice(ch,s,i)||[])add(out,seen,item)}catch(_){}});
  }
  if(typeof mathTestQuestions==='function'){
    try{for(const item of mathTestQuestions(ch)||[])add(out,seen,item)}catch(_){}
  }
  return out;
}
function guidePool(ch,g){
  const out=[],seen=new Set();
  for(const st of g?.steps||[]){
    if(/chapter mastery/i.test(clean(st?.t)))continue;
    const prompt=clean(st?.try||'');
    if(concrete(prompt))add(out,seen,q(prompt,st?.tryAnswer||st?.more||st?.apply));
  }
  return out;
}
function basePool(ch,g,extra=[]){
  const out=[],seen=new Set();
  for(const item of [...extra,...sectionPool(ch),...guidePool(ch,g)])add(out,seen,item);
  return out;
}
function verificationVariant(item,index){
  const prompt=clean(item?.prompt),answer=clean(item?.answer);
  if(!concrete(prompt))return null;
  return q(`Independent check ${index+1}: ${prompt} After solving, verify the result using a different method, substitution, a graph, or a reasonableness check.`,answer,'Solve first, then use a genuinely different verification method.');
}
function fill(pool,target,exclude=new Set()){
  const out=[],seen=new Set(exclude);
  for(const item of pool){const k=norm(item.prompt);if(!k||seen.has(k))continue;seen.add(k);out.push(item);if(out.length===target)return out}
  let i=0;
  while(out.length<target&&pool.length&&i<target*4){const base=pool[i%pool.length],v=verificationVariant(base,i);i++;if(!v)continue;const k=norm(v.prompt);if(seen.has(k))continue;seen.add(k);out.push(v)}
  return out.slice(0,target);
}

const baseGuideFor=guideFor;
guideFor=function(ch){
  const g=baseGuideFor(ch);if(!isMath()||!g||!Array.isArray(g.steps))return g;
  const pool=basePool(ch,g);
  const steps=g.steps.map(st=>{
    if(!/chapter mastery/i.test(clean(st?.t)))return st;
    const mastery=fill(pool,Math.min(8,Math.max(5,pool.length))).map(x=>x.prompt);
    return {...st,learn:`Chapter mastery uses actual solvable problems from ${ch.title}. Every item below contains the mathematical information needed to work it.`,try:'Solve each concrete problem below. Show the essential method and verify when requested.',questions:mastery,apply:'Review any missed item, then write one sentence naming the method that was most useful in this chapter.'};
  });
  return {...g,steps};
};

const baseWorksheetItems=worksheetItems;
worksheetItems=function(ch){
  const original=baseWorksheetItems(ch);if(!isMath())return original;
  const g=guideFor(ch),pool=basePool(ch,g,original);
  const items=fill(pool,15);
  return items.map((item,i)=>({...item,type:item.type||'math-solve',guidance:item.guidance||'Show the setup, decisive steps, final answer, and one quick check.',conceptId:item.conceptId||`${S.subject}-ch${ch.number}-quality-${i+1}`,objectiveId:item.objectiveId||`${S.subject}-ch${ch.number}-quality`}));
};

const baseKnowledgeItems=knowledgeItems;
knowledgeItems=function(ch){
  const original=baseKnowledgeItems(ch);if(!isMath())return original;
  const worksheetKeys=new Set(worksheetItems(ch).map(x=>norm(x.prompt)));
  const g=guideFor(ch),pool=basePool(ch,g,original);
  let items=fill(pool.filter(x=>!worksheetKeys.has(norm(x.prompt))),8,worksheetKeys);
  if(items.length<8)items=fill(pool,8);
  return items.map((item,i)=>({...item,type:item.type||'solve-check',guidance:item.guidance||'Solve independently and include one verification.',conceptId:item.conceptId||`${S.subject}-ch${ch.number}-check-${i+1}`,objectiveId:item.objectiveId||`${S.subject}-ch${ch.number}-check`}));
};

function auditOne(subject,ch){
  const prev=S.subject;S.subject=subject;
  try{
    const g=guideFor(ch),w=worksheetItems(ch),k=knowledgeItems(ch),mastery=(g.steps||[]).find(st=>/chapter mastery/i.test(clean(st.t))),mp=mastery?.questions||[];
    const bad=a=>a.filter(x=>!concrete(typeof x==='string'?x:x.prompt)).map(x=>clean(typeof x==='string'?x:x.prompt));
    const dup=a=>{const seen=new Set(),d=[];for(const x of a){const key=norm(typeof x==='string'?x:x.prompt);if(key&&seen.has(key))d.push(key);seen.add(key)}return d};
    return {chapter:ch.number,title:ch.title,mastery:mp.length,worksheet:w.length,knowledge:k.length,badMastery:bad(mp),badWorksheet:bad(w),badKnowledge:bad(k),duplicateMastery:dup(mp),duplicateWorksheet:dup(w),duplicateKnowledge:dup(k)};
  }finally{S.subject=prev}
}
globalThis.__auditMathCourseQualityV3=function(){
  const rows=[];
  for(const subject of ['math','math3'])for(const ch of S.data?.[subject]?.chapters||[])rows.push({subject,...auditOne(subject,ch)});
  return {rows,passed:rows.every(r=>r.mastery>=4&&r.worksheet===15&&r.knowledge===8&&!r.badMastery.length&&!r.badWorksheet.length&&!r.badKnowledge.length&&!r.duplicateMastery.length&&!r.duplicateWorksheet.length&&!r.duplicateKnowledge.length)};
};
try{if(isMath()&&S.view==='chapter'&&typeof render==='function')render(false)}catch(error){console.error('Math course quality v3:',error)}
})();
