(function(){
'use strict';
if(typeof S==='undefined'||typeof guideFor!=='function')return;

const BAD_LEAD=/^(?:what you need to know:\s*)?(?:then,?\s+)?(?:as you read|before you read|read chapter|use the chapter|from the supplied chapter pdf|from the chapter pdf)/i;
const ARTIFACT=/\b(?:as you read chapter|list factors? that|in the left column|in the right column|reading essentials|study guide|section preview|objectives|foldable|review vocabulary|page\s+\d+)\b/i;

function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function sentences(text){
  return clean(text)
    .replace(/^What you need to know:\s*/i,'')
    .split(/(?<=[.!?])\s+/)
    .map(clean)
    .filter(Boolean);
}
function studentCopy(text){
  const ss=sentences(text).filter(s=>!ARTIFACT.test(s));
  if(!ss.length)return clean(text).replace(/^What you need to know:\s*/i,'');
  const useful=[];
  for(const s of ss){
    if(s.length<25)continue;
    useful.push(s);
    if(useful.length===3)break;
  }
  return useful.length?useful.join(' '):ss.slice(0,3).join(' ');
}
function simplify(g){
  if(!g?.steps)return g;
  const steps=g.steps.map(st=>{
    if(st?.vocabularyCheck||/mastery check/i.test(clean(st.t)))return st;
    const next={...st};
    const original=clean(next.learn);
    if(original){
      const concise=studentCopy(original);
      // Never show textbook directions or four-sentence PDF dumps as the lesson itself.
      if(BAD_LEAD.test(original)||ARTIFACT.test(original)||sentences(original).length>4||original.length>650){
        next.learn=concise;
      }
    }
    // Keep practice focused on understanding, not copying vocabulary back into a sentence.
    const q=clean(next.try);
    if(/\b(?:fill in|complete the sentence|type the term|enter the word)\b/i.test(q)){
      next.try=`Explain the main idea in ${clean(next.t)||'this lesson'} in your own words and give one specific example.`;
      next.tryAnswer='A strong answer explains the concept accurately and uses one concrete example from the lesson.';
    }
    return next;
  });
  return {...g,steps};
}

const baseGuide=guideFor;
guideFor=function(ch){
  if(S.subject==='biology'){
    const n=Number(ch?.number);
    // Chapters 4 and 5 already have hand-written student-first lessons. Force those
    // versions so an earlier generic PDF layer can never replace them.
    if(n===4&&typeof globalThis.__BIO4_TEACHING_V4==='function')return simplify(globalThis.__BIO4_TEACHING_V4());
    if(n===5&&typeof globalThis.__BIO5_TEACHING_V5==='function')return simplify(globalThis.__BIO5_TEACHING_V5());
    return simplify(baseGuide(ch));
  }
  return baseGuide(ch);
};

globalThis.__auditBiologyReadabilityHotfix=function(){
  const previousSubject=S.subject;
  S.subject='biology';
  const rows=(S.data?.biology?.chapters||[]).map(ch=>{
    const g=guideFor(ch);
    const lessons=(g.steps||[]).filter(s=>!s.vocabularyCheck&&!/mastery check/i.test(clean(s.t)));
    const bad=lessons.filter(s=>BAD_LEAD.test(clean(s.learn))||ARTIFACT.test(clean(s.learn))||clean(s.learn).length>700);
    return {chapter:Number(ch.number),lessons:lessons.length,bad:bad.length,maxChars:Math.max(0,...lessons.map(s=>clean(s.learn).length))};
  });
  S.subject=previousSubject;
  return {rows,passed:rows.length===16&&rows.every(r=>r.lessons>0&&r.bad===0)};
};

try{
  if(S.subject==='biology'&&S.view==='chapter'&&typeof render==='function')render(false);
}catch(e){console.error('Biology readability hotfix:',e)}
})();
