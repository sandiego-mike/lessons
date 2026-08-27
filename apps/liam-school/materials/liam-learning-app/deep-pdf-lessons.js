(function(){
'use strict';
if(typeof guideFor!=='function'||typeof S==='undefined')return;

const previousGuideFor=guideFor;
const SUBJECTS=new Set(['biology','geography']);
const REDUNDANT_APPLY=/^Now explain your reasoning in 1.?2 sentences\. Use at least one specific fact from the chapter to support your answer\.?$/i;
const EXPLANATION_VERBS=/\b(explain|describe|compare|contrast|predict|analy[sz]e|justify|infer|evaluate|interpret|how|why|cause|effect|relationship)\b/i;

function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function sourceParagraphs(section){
  const out=[],seen=new Set();
  for(const raw of section?.blocks||[]){
    const t=cleanStudentText(raw);
    if(!usableStudentText(t)||artifactText(t)||t.length<85)continue;
    const key=t.toLowerCase().replace(/[^a-z0-9]+/g,' ').slice(0,120);
    if(seen.has(key))continue;
    seen.add(key);
    out.push(t);
  }
  let chosen=[],chars=0;
  for(const p of out){
    if(chosen.length>=4)break;
    if(chars>1450&&chosen.length>=2)break;
    chosen.push(p);
    chars+=p.length;
  }
  return chosen;
}
function sentenceFacts(paragraphs){
  const facts=[],seen=new Set();
  for(const p of paragraphs){
    for(let s of p.split(/(?<=[.!?])\s+/)){
      s=clean(s);
      if(s.length<45||s.length>230||artifactText(s))continue;
      const k=s.toLowerCase().replace(/[^a-z0-9]+/g,' ').slice(0,90);
      if(seen.has(k))continue;
      seen.add(k);facts.push(s);
      if(facts.length===4)return facts;
    }
  }
  return facts;
}
function sourceQuestion(ch,meta,index){
  const terms=(meta.vocabulary||[]).map(x=>clean(x.term).toLowerCase()).filter(x=>x.length>3);
  const rows=(ch.worksheet||[]).map(q=>({...q,prompt:cleanStudentText(q.prompt||'')}))
    .filter(q=>usableStudentText(q.prompt)&&!/show your work|use .* in your answer|central idea|source-review/i.test(q.prompt));
  let best=null,bestScore=-1;
  rows.forEach((q,i)=>{
    const low=q.prompt.toLowerCase();
    let score=terms.reduce((n,t)=>n+(low.includes(t)?2:0),0);
    if(clean(meta.title).split(/\s+/).some(w=>w.length>5&&low.includes(w.toLowerCase())))score+=2;
    score-=Math.abs(i-index)*.05;
    if(score>bestScore){best=q;bestScore=score}
  });
  return bestScore>=2?best:null;
}
function practicePrompt(meta,facts,ch,index){
  const source=sourceQuestion(ch,meta,index);
  if(source)return source.prompt;
  const title=clean(meta.title);
  const type=meta.interactionType||'evidence';
  if(type==='sequence')return `Put the process from ${title} in the correct order. Name at least three stages and state what changes from one stage to the next.`;
  if(type==='classification')return `Classify two examples from ${title}. For each one, name the clue from the textbook that tells you where it belongs.`;
  if(type==='cause-effect')return `Identify one cause-and-effect relationship from ${title}. State the cause, the effect, and the textbook fact that connects them.`;
  if(type==='data-analysis')return `What pattern does ${title} describe? Use two specific facts or values from the textbook lesson to state the pattern.`;
  if(type==='map-analysis'||type==='map-location'||type==='route-analysis')return `Use the places and patterns in ${title}: where is the important pattern located, what is happening there, and what chapter fact helps explain it?`;
  if(type==='comparison')return `Compare two examples or groups from ${title}. Give one meaningful similarity or difference supported by the textbook lesson.`;
  if(type==='prediction')return `Use the process in ${title} to predict what would happen if one condition changed. State the condition, prediction, and evidence.`;
  return `Using ${title}, what is the most important relationship or process in this section? Support your answer with two specific textbook facts.`;
}
function visualType(meta){
  const t=meta.interactionType||'';
  if(t==='sequence')return 'cycle';
  if(/map|route/.test(t))return 'earth';
  if(/cause|prediction|data/.test(t))return 'web';
  return 'cards';
}
function deepenGuide(ch,guide){
  if(!guide||!Array.isArray(guide.steps)||!SUBJECTS.has(S.subject))return guide;
  const sections=ch.sections||[];
  const steps=guide.steps.map((st,i)=>{
    if(st?.vocabularyCheck)return st;
    let next={...st};
    if(REDUNDANT_APPLY.test(clean(next.apply))){
      next.apply='';
      next.noApply=true;
    }
    if(i>=sections.length||ch.number===3)return next;

    const section=sections[i],meta=sectionMeta(ch,section,i);
    const paras=sourceParagraphs(section);
    if(!paras.length)return next;
    const facts=sentenceFacts(paras);
    const vocab=(meta.vocabulary||[]).slice(0,4).map(termInfo);
    const vocabLine=vocab.length
      ? ` Key terms for this section: ${vocab.map(v=>`${v.term} — ${v.definition}`).join(' ')}`
      : '';
    next.t=meta.title||next.t;
    next.learn=`From the chapter PDF: ${paras.join(' ')}${vocabLine}`;
    next.see=(facts.length?facts:paras).slice(0,4);
    next.v=visualType(meta);
    next.try=practicePrompt(meta,facts,ch,i);
    delete next.choices;
    delete next.sort;
    delete next.sequence;
    delete next.questions;
    next.noApply=true;
    next.apply='';
    next.more=`Why this section matters: ${conceptDepth(meta,ch)}`;
    next.sourceGrounded=true;
    return next;
  });
  return {
    ...guide,
    big:ch.number===3?guide.big:`This chapter is taught from the supplied textbook PDF. Each lesson block below uses the content of its own section rather than a repeated generic template. ${guide.big||''}`.trim(),
    steps
  };
}

guideFor=function(ch){
  return deepenGuide(ch,previousGuideFor(ch));
};

function shouldShowApply(st,activity){
  if(st?.noApply)return false;
  const text=clean(st?.apply);
  if(!text||REDUNDANT_APPLY.test(text))return false;
  const prompt=clean(st?.try||(st?.questions||[]).join(' '));
  if(activity&&!activityRequiresCompletion(activity)&&EXPLANATION_VERBS.test(prompt)&&EXPLANATION_VERBS.test(text))return false;
  return true;
}

guidedLesson=function(ch,guide){
  if(S.subject==='math')return mathGuidedLesson(ch,guide);
  let key=`${S.subject}-${ch.number}-guide-step`;
  let idx=Math.max(0,Math.min(guide.steps.length-1,Number(saved[key]||0)));
  let st=guide.steps[idx];
  let done=guide.steps.filter((_,i)=>saved[`${S.subject}-${ch.number}-guide-done-${i}`]).length;
  let pct=Math.round(done/guide.steps.length*100);
  let activity=normalizeStepActivity(st,idx);
  let ready=isStepReady(st,idx);
  let apply='';
  if(shouldShowApply(st,activity)){
    apply=activity&&!activityComplete(activity)&&activityRequiresCompletion(activity)
      ? '<div class="locked-apply"><strong>Apply</strong><p>The written follow-up appears after the activity is complete.</p></div>'
      : `<h3>Apply</h3>${guideText(ch,idx,'apply',st.apply)}`;
  }
  let learn=S.subject==='math3'?formatMathNotation(injectTerms(st.learn,ch)):injectTerms(st.learn,ch);
  let lessonHeading=SUBJECTS.has(S.subject)?'Lesson':'Worked example';
  return `<div class="card guided-start"><div class="eyebrow">Guided chapter path · ${subjectLabel(S.subject)}</div><h2>${esc(guide.title)}</h2><p>${injectTerms(guide.big,ch)}</p><div class="progress"><span style="width:${pct}%"></span></div><p class="muted">${done} of ${guide.steps.length} blocks complete. Work is saved automatically.</p><div class="guide-pills">${guide.steps.map((s,i)=>`<button class="${i===idx?'current':''} ${saved[`${S.subject}-${ch.number}-guide-done-${i}`]?'done':''}" onclick="setGuideStep(${i})">${i+1}</button>`).join('')}</div></div><div class="card guide-card ${S.subject==='math3'?'math3-guide':''}"><div class="eyebrow">Block ${idx+1} of ${guide.steps.length}</div><h2>${injectTerms(st.t,ch)}</h2><div class="guide-layout"><div><h3>${lessonHeading}</h3><p class="worked-example-lead">${learn}</p>${guideHelp(ch,st)}${guideMore(ch,st,idx)}</div><div>${guideVisual(st)}</div></div><div class="interaction guide-try"><h3>Try It - new problem</h3>${guideTry(ch,st,idx)}${apply}</div><div class="actions no-print"><button class="secondary" ${idx===0?'disabled':''} onclick="setGuideStep(${idx-1})">Previous block</button><button class="primary" ${ready?'':'disabled'} onclick="completeGuideStep()">${idx===guide.steps.length-1?'Save mastery work':'Complete block and continue'}</button><button class="secondary" ${idx===guide.steps.length-1?'disabled':''} onclick="setGuideStep(${idx+1})">Next block</button>${ready?'':'<span class="muted complete-hint">Finish the activity to continue.</span>'}</div></div>`;
};

try{if(S.view==='chapter'&&SUBJECTS.has(S.subject)&&typeof render==='function')render(false)}catch(_){}
})();
