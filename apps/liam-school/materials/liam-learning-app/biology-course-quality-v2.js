(function(){
'use strict';
if(typeof S==='undefined'||typeof guideFor!=='function'||typeof worksheetItems!=='function'||typeof knowledgeItems!=='function')return;
const IS_BIO=()=>S.subject==='biology';
const TARGET_WORKSHEET=15,TARGET_CHECK=8;
const GENERIC=/use the chapter lesson|use one specific chapter concept|what is the central idea|representative|chapter term|solve the practice|this section is about/i;
function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function norm(v){return clean(v).toLowerCase().replace(/[“”‘’]/g,"'").replace(/[^a-z0-9]+/g,' ').trim()}
function meta(ch,s,i){try{return sectionMeta(ch,s,i)}catch(_){return {title:s?.title||`Section ${i+1}`,vocabulary:s?.vocabulary||[],learningObjectives:s?.learningObjectives||[]}}}
function blocks(ch,s,i){try{return sectionBlocks(ch,s,i)||[]}catch(_){return s?.blocks||[]}}
function facts(ch,s,i){
  const out=[],seen=new Set();
  for(const raw of blocks(ch,s,i)){
    const p=clean(typeof cleanStudentText==='function'?cleanStudentText(raw):raw);
    if(p.length<70)continue;
    try{if(typeof artifactText==='function'&&artifactText(p))continue}catch(_){}
    for(const part of p.split(/(?<=[.!?])\s+/)){
      const t=clean(part),k=norm(t).slice(0,140);
      if(t.length<45||t.length>280||seen.has(k))continue;
      seen.add(k);out.push(t);if(out.length===5)return out;
    }
  }
  return out;
}
function terms(ch,s,i){const m=meta(ch,s,i),out=[],seen=new Set();for(const raw of [...(m.vocabulary||[]),...(s?.vocabulary||[])]){const t=clean(raw?.term||raw),k=norm(t);if(t&&k&&!seen.has(k)){seen.add(k);out.push(t)}}return out}
function objective(m){return clean((m.learningObjectives||[]).map(x=>clean(x)).find(Boolean)||'').replace(/[.]+$/,'')}
function promptFor(ch,s,i,v=0){
  const m=meta(ch,s,i),title=clean(m.title||s?.title||`Section ${i+1}`),ts=terms(ch,s,i),obj=objective(m);
  switch(v%7){
    case 0:return obj?`${obj}. Support the answer with one specific observation, example, structure, process, or result from ${title}.`:`Explain the main biological idea in ${title} using two specific facts from the lesson.`;
    case 1:return `From ${title}, identify one cause-and-effect relationship or biological mechanism. State what starts the process, what changes, and what result follows.`;
    case 2:return `Compare two structures, organisms, stages, variables, or processes from ${title}. Give one meaningful similarity or difference and explain why it matters.`;
    case 3:return `Use evidence from ${title} to predict what would happen if one important condition or variable changed. State the change, prediction, and evidence.`;
    case 4:return `Build a sequence or model for one process in ${title}. Put the important stages in order and explain what changes at each stage.`;
    case 5:return ts.length?`Apply the term “${ts[v%ts.length]}” to a specific example from ${title}. Explain how the example demonstrates the term rather than only defining it.`:`Choose one concrete example from ${title} and explain what biological principle it demonstrates.`;
    default:return `Scientific reasoning from ${title}: identify a claim the section supports, cite two pieces of chapter evidence, and explain how the evidence supports the claim.`;
  }
}
function answerFor(ch,s,i){const fs=facts(ch,s,i);return fs.slice(0,3).join(' ')||`Use accurate evidence from ${clean(s?.title||`Section ${i+1}`)}.`}
function vocabTarget(prompt,ch){const p=norm(prompt);if(!/\b(define|definition|mean|own words|term|vocabulary)\b/i.test(clean(prompt)))return '';const all=[];(ch.vocabulary||[]).forEach(v=>all.push(clean(v?.term||v)));(ch.sections||[]).forEach((s,i)=>all.push(...terms(ch,s,i)));return all.find(t=>t&&p.includes(norm(t)))||''}
function semKey(prompt){return norm(prompt).replace(/\b(from|in|using|use|support|answer|chapter|section|specific|evidence|lesson)\b/g,' ').replace(/\s+/g,' ').trim()}
function qualityItems(ch,base,target,kind,exclude=new Set()){
  const out=[],seen=new Set(exclude),seenVocab=new Set();
  const add=q=>{const p=clean(q?.prompt||q?.question||'');if(!p||GENERIC.test(p))return false;const k=semKey(p);if(!k||seen.has(k))return false;const vt=vocabTarget(p,ch),vk=norm(vt);if(vk&&seenVocab.has(vk))return false;seen.add(k);if(vk)seenVocab.add(vk);out.push({...q,prompt:p});return true};
  (base||[]).forEach(add);
  const ss=ch.sections||[];let pass=0;
  while(out.length<target&&ss.length&&pass<target*10){const i=pass%ss.length,v=Math.floor(pass/ss.length),s=ss[i],p=promptFor(ch,s,i,v);pass++;add({type:kind==='check'?'check':v%3===0?'evidence':v%3===1?'reasoning':'application',prompt:p,answer:answerFor(ch,s,i),guidance:kind==='check'?'Answer from memory, then justify with one chapter fact.':'Use the lesson text and one concrete chapter fact.',conceptId:`biology-${ch.number}-${i+1}-quality-${v}`,objectiveId:`biology-${ch.number}-${i+1}`})}
  return out.slice(0,target);
}
const baseGuide=guideFor;
guideFor=function(ch){const g=baseGuide(ch);if(!IS_BIO()||!g||!Array.isArray(g.steps))return g;const ss=ch.sections||[],seen=new Set();const steps=g.steps.map((st,i)=>{if(st?.vocabularyCheck)return st;const next={...st},si=Math.min(i,Math.max(0,ss.length-1)),s=ss[si],fs=s?facts(ch,s,si):[];if(s&&fs.length&&clean(next.learn).length<320)next.learn=`From the supplied chapter PDF: ${fs.slice(0,4).join(' ')}`;const p=clean(next.try||(next.questions||[])[0]||'');if(s&&(!p||GENERIC.test(p)||seen.has(semKey(p)))){const replacement=promptFor(ch,s,si,i);if(next.try!==undefined)next.try=replacement;else next.questions=[replacement];seen.add(semKey(replacement))}else if(p)seen.add(semKey(p));return next});return {...g,steps}};
const baseWorksheet=worksheetItems;worksheetItems=function(ch){if(!IS_BIO())return baseWorksheet(ch);return qualityItems(ch,baseWorksheet(ch),TARGET_WORKSHEET,'worksheet')};
const baseKnowledge=knowledgeItems;knowledgeItems=function(ch){if(!IS_BIO())return baseKnowledge(ch);const worksheetKeys=new Set(worksheetItems(ch).map(q=>semKey(q.prompt)));return qualityItems(ch,baseKnowledge(ch),TARGET_CHECK,'check',worksheetKeys)};
function audit(ch){const g=guideFor(ch),w=worksheetItems(ch),k=knowledgeItems(ch),gp=(g.steps||[]).filter(s=>!s.vocabularyCheck).flatMap(s=>[s.try||'',...(s.questions||[])]).map(clean).filter(Boolean);const dups=a=>{const seen=new Set(),d=[];for(const x of a){const p=typeof x==='string'?x:x.prompt,key=semKey(p);if(key&&seen.has(key))d.push(key);seen.add(key)}return d};return {chapter:ch.number,title:ch.title,sections:(ch.sections||[]).length,guide:g.steps?.length||0,worksheet:w.length,check:k.length,vocabularyCheck:(g.steps||[]).some(s=>s.vocabularyCheck),duplicateGuide:dups(gp),duplicateWorksheet:dups(w),duplicateCheck:dups(k),thinLessons:(g.steps||[]).filter(s=>!s.vocabularyCheck&&clean(s.learn).length<100).length}}
globalThis.__auditBiologyCourseQualityV2=function(){const rows=(S.data?.biology?.chapters||[]).map(audit);return {rows,passed:rows.length===16&&rows.every(r=>r.sections>0&&r.guide>=3&&r.worksheet===15&&r.check===8&&r.vocabularyCheck&&!r.duplicateGuide.length&&!r.duplicateWorksheet.length&&!r.duplicateCheck.length&&r.thinLessons===0)}};
try{if(IS_BIO()&&S.view==='chapter'&&typeof render==='function')render(false)}catch(e){console.error('Biology quality v2:',e)}
})();
