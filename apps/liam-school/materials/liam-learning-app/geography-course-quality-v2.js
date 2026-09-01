(function(){
'use strict';
if(typeof S==='undefined')return;
const IS_GEO=()=>S.subject==='geography';
const TARGET_WORKSHEET=15;
const TARGET_CHECK=8;
const STALE_REGION=/name the region type shown in one section example/i;
const VOCAB_LANGUAGE=/\b(in your own words|define|definition|what does|what is|explain the term|vocabulary)\b/i;

function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function norm(v){return clean(v).toLowerCase().replace(/[“”‘’]/g,"'").replace(/[^a-z0-9]+/g,' ').trim()}
function sectionMetaSafe(ch,s,i){
  try{return typeof sectionMeta==='function'?sectionMeta(ch,s,i):{title:s?.title||`Section ${i+1}`,vocabulary:s?.vocabulary||[],learningObjectives:s?.learningObjectives||[]}}catch(_){return {title:s?.title||`Section ${i+1}`,vocabulary:s?.vocabulary||[],learningObjectives:s?.learningObjectives||[]}}
}
function blocksSafe(ch,s,i){
  try{if(typeof sectionBlocks==='function')return sectionBlocks(ch,s,i)||[]}catch(_){}
  return s?.blocks||[];
}
function usable(v){
  let t=clean(v);if(t.length<55)return false;
  try{if(typeof artifactText==='function'&&artifactText(t))return false}catch(_){}
  return true;
}
function sectionFacts(ch,s,i){
  const seen=new Set(),facts=[];
  for(const raw of blocksSafe(ch,s,i)){
    let p=clean(typeof cleanStudentText==='function'?cleanStudentText(raw):raw);
    if(!usable(p))continue;
    for(let sentence of p.split(/(?<=[.!?])\s+/)){
      sentence=clean(sentence);let k=norm(sentence).slice(0,120);
      if(sentence.length<45||sentence.length>260||seen.has(k))continue;
      seen.add(k);facts.push(sentence);if(facts.length===4)return facts;
    }
  }
  return facts;
}
function vocabTerms(ch,s,i){
  const meta=sectionMetaSafe(ch,s,i),out=[],seen=new Set();
  const raw=[...(meta.vocabulary||[]),...(s?.vocabulary||[])];
  for(const v of raw){let term=clean(v?.term||v);let k=norm(term);if(!term||term.length<2||seen.has(k))continue;seen.add(k);out.push(term)}
  return out;
}
function chapterText(ch){
  let out=[ch?.title||''];
  (ch?.sections||[]).forEach((s,i)=>out.push(s?.title||'',...sectionFacts(ch,s,i)));
  return norm(out.join(' '));
}
function hasRegionConcept(ch){return /formal region|functional region|perceptual region|region type/.test(chapterText(ch))}
function objectiveText(meta){
  let raw=(meta.learningObjectives||[]).map(x=>clean(x)).find(Boolean)||'';
  return raw.replace(/[.]+$/,'');
}
function sectionQuestion(ch,s,i,variant=0){
  const meta=sectionMetaSafe(ch,s,i),title=clean(meta.title||s?.title||`Section ${i+1}`),facts=sectionFacts(ch,s,i),terms=vocabTerms(ch,s,i),objective=objectiveText(meta),sample=facts[0]||'';
  if(variant%5===0&&objective)return `${objective}. Use one specific fact, example, place, or data point from ${title} as evidence.`;
  if(variant%5===1)return `From ${title}, identify one important geographic pattern or relationship. Describe it and support it with two specific chapter facts.`;
  if(variant%5===2)return `Choose one concrete example from ${title}. What does the example show, and why is it important to understanding this section?`;
  if(variant%5===3)return `Identify one cause-and-effect or change-over-time relationship from ${title}. State what changes, what results, and the evidence from the chapter.`;
  if(terms.length)return `In your own words, explain “${terms[variant%terms.length]}” as it is used in ${title}, then apply it to one different chapter example.`;
  return `Summarize the central idea of ${title} and support it with two details from the textbook section${sample?' rather than a general definition':''}.`;
}
function answerFor(ch,s,i){
  const facts=sectionFacts(ch,s,i);return facts.slice(0,2).join(' ')||`A complete answer should use specific evidence from ${clean(s?.title||`Section ${i+1}`)}.`;
}
function chapterVocab(ch){
  const out=[],seen=new Set();
  for(const raw of ch?.vocabulary||[]){let term=clean(raw?.term||raw),k=norm(term);if(term&&k&&!seen.has(k)){seen.add(k);out.push(term)}}
  (ch?.sections||[]).forEach((s,i)=>vocabTerms(ch,s,i).forEach(term=>{let k=norm(term);if(k&&!seen.has(k)){seen.add(k);out.push(term)}}));
  return out;
}
function vocabTarget(prompt,ch){
  const p=norm(prompt);if(!VOCAB_LANGUAGE.test(clean(prompt)))return '';
  return chapterVocab(ch).find(term=>p.includes(norm(term)))||'';
}
function staleForChapter(prompt,ch){return STALE_REGION.test(clean(prompt))&&!hasRegionConcept(ch)}
function uniqueItems(ch,items,target,kind){
  const kept=[],seenPrompt=new Set(),seenVocab=new Set();
  for(const raw of items||[]){
    const q={...raw,prompt:clean(raw?.prompt||raw?.question||'')};
    if(!q.prompt||staleForChapter(q.prompt,ch))continue;
    const pk=norm(q.prompt);if(!pk||seenPrompt.has(pk))continue;
    const vt=vocabTarget(q.prompt,ch),vk=norm(vt);if(vk&&seenVocab.has(vk))continue;
    seenPrompt.add(pk);if(vk)seenVocab.add(vk);kept.push(q);if(kept.length===target)break;
  }
  const sections=ch?.sections||[];let pass=0;
  while(kept.length<target&&sections.length&&pass<target*5){
    const i=pass%sections.length,variant=Math.floor(pass/sections.length),s=sections[i];
    let prompt=sectionQuestion(ch,s,i,variant),pk=norm(prompt),vt=vocabTarget(prompt,ch),vk=norm(vt);
    pass++;
    if(seenPrompt.has(pk)||(vk&&seenVocab.has(vk)))continue;
    seenPrompt.add(pk);if(vk)seenVocab.add(vk);
    kept.push({type:kind==='check'?'check':'evidence',prompt,answer:answerFor(ch,s,i),guidance:kind==='check'?'Answer from memory, then support it with one chapter fact.':'Use the lesson text and one specific chapter fact.',conceptId:`geography-${ch.number}-${i+1}-quality-${variant}`,objectiveId:`geography-${ch.number}-${i+1}`});
  }
  return kept.slice(0,target);
}
function masteryQuestions(ch){
  const out=[],seen=new Set();
  (ch?.sections||[]).forEach((s,i)=>{
    for(let variant=0;variant<2;variant++){
      const q=sectionQuestion(ch,s,i,variant),k=norm(q);if(k&&!seen.has(k)){seen.add(k);out.push(q)}
      if(out.length>=Math.max(4,Math.min(8,(ch.sections||[]).length*2)))return;
    }
  });
  return out;
}

if(typeof guideFor==='function'&&!guideFor.__geographyQualityV2){
  const base=guideFor;
  const wrapped=function(ch){
    const g=base(ch);if(!IS_GEO()||!g||!Array.isArray(g.steps))return g;
    const sections=ch?.sections||[],seen=new Set();
    const steps=g.steps.map((st,i)=>{
      if(st?.vocabularyCheck)return st;
      let next={...st};
      if(Array.isArray(next.questions)&&next.questions.length>1){
        let qs=masteryQuestions(ch).filter(q=>!seen.has(norm(q)));
        let pass=0;
        while(qs.length<Math.max(4,Math.min(8,(sections.length||1)*2))&&sections.length&&pass<30){
          const si=pass%sections.length,variant=2+Math.floor(pass/sections.length),q=sectionQuestion(ch,sections[si],si,variant),k=norm(q);pass++;
          if(!k||seen.has(k)||qs.some(x=>norm(x)===k))continue;qs.push(q);
        }
        qs.forEach(q=>seen.add(norm(q)));next.questions=qs;return next
      }
      const prompt=clean(next.try||(next.questions||[])[0]||'');
      if(prompt){
        let replacement=prompt;
        if(staleForChapter(prompt,ch)||seen.has(norm(prompt))){const si=Math.min(i,Math.max(0,sections.length-1));replacement=sections.length?sectionQuestion(ch,sections[si],si,i):prompt}
        const key=norm(replacement);if(key)seen.add(key);
        if(next.try)next.try=replacement;else if(Array.isArray(next.questions))next.questions=[replacement];
      }
      return next;
    });
    return {...g,steps};
  };
  wrapped.__geographyQualityV2=true;guideFor=wrapped;
}
if(typeof worksheetItems==='function'&&!worksheetItems.__geographyQualityV2){
  const base=worksheetItems;const wrapped=function(ch){const items=base(ch);return IS_GEO()?uniqueItems(ch,items,TARGET_WORKSHEET,'worksheet'):items};wrapped.__geographyQualityV2=true;worksheetItems=wrapped;
}
if(typeof knowledgeItems==='function'&&!knowledgeItems.__geographyQualityV2){
  const base=knowledgeItems;const wrapped=function(ch){const items=base(ch);return IS_GEO()?uniqueItems(ch,items,TARGET_CHECK,'check'):items};wrapped.__geographyQualityV2=true;knowledgeItems=wrapped;
}

function auditChapter(ch){
  const oldSubject=S.subject;S.subject='geography';
  let guide,worksheet,check;try{guide=guideFor(ch);worksheet=worksheetItems(ch);check=knowledgeItems(ch)}finally{S.subject=oldSubject}
  const guidePrompts=(guide?.steps||[]).flatMap(st=>st?.vocabularyCheck?[]:[st.try||'',...(st.questions||[])]).map(clean).filter(Boolean);
  const dupes=a=>{const seen=new Set(),d=[];a.forEach(x=>{let k=norm(typeof x==='string'?x:x.prompt);if(k&&seen.has(k))d.push(k);seen.add(k)});return d};
  const vocabSeen=new Set(),vocabDup=[];for(const q of worksheet||[]){let t=vocabTarget(q.prompt,ch),k=norm(t);if(k&&vocabSeen.has(k))vocabDup.push(t);if(k)vocabSeen.add(k)}
  return {chapter:ch.number,title:ch.title,sections:(ch.sections||[]).length,guideQuestions:guidePrompts.length,worksheet:(worksheet||[]).length,knowledgeCheck:(check||[]).length,duplicateGuidePrompts:dupes(guidePrompts),duplicateWorksheetPrompts:dupes(worksheet||[]),duplicateCheckPrompts:dupes(check||[]),repeatedWorksheetVocabulary:vocabDup,hasVocabularyCheck:(guide?.steps||[]).some(st=>st?.vocabularyCheck)};
}
globalThis.__auditGeographyCourseQuality=function(){
  const chapters=S.data?.geography?.chapters||[];const rows=chapters.map(auditChapter);return {chapters:rows.length,passed:rows.every(r=>r.sections>0&&r.worksheet===TARGET_WORKSHEET&&r.knowledgeCheck===TARGET_CHECK&&!r.duplicateGuidePrompts.length&&!r.duplicateWorksheetPrompts.length&&!r.duplicateCheckPrompts.length&&!r.repeatedWorksheetVocabulary.length),rows};
};
try{if(IS_GEO()&&S.view==='chapter'&&typeof render==='function')render(false)}catch(error){console.error('Geography quality v2:',error)}
})();
