(function(){
'use strict';
if(typeof guideFor!=='function'||typeof termInfo!=='function')return;
const originalGuideFor=guideFor;
const VOCAB_SUBJECTS=new Set(['biology','geography']);
const MAX_TERMS=10;
function cleanTerm(value){return String(value||'').replace(/\s+/g,' ').trim()}
function keyTerm(value){return cleanTerm(value).toLowerCase()}
function definitionFor(term){
  try{
    const info=termInfo({term});
    const definition=cleanTerm(info?.definition);
    if(definition&&definition.toLowerCase()!==keyTerm(term))return definition;
  }catch(_){ }
  return '';
}
function vocabularyEntries(ch,guide){
  const seen=new Set(),primary=[],secondary=[];
  const add=(bucket,term)=>{term=cleanTerm(term);const key=keyTerm(term);if(!term||term.length<2||seen.has(key))return;const definition=definitionFor(term);if(!definition||definition.length<12)return;seen.add(key);bucket.push({term,definition})};
  for(const st of guide?.steps||[]){
    const terms=String(st?.k||'').split(',').map(cleanTerm).filter(Boolean);
    if(terms[0])add(primary,terms[0]);
    terms.slice(1).forEach(t=>add(secondary,t));
  }
  for(const raw of ch?.vocabulary||[]){
    const term=cleanTerm(raw?.term||raw);
    add(secondary,term);
  }
  return [...primary,...secondary].slice(0,MAX_TERMS);
}
function rotated(items){
  if(items.length<2)return items.slice();
  const shift=Math.min(3,items.length-1);
  return items.slice(shift).concat(items.slice(0,shift));
}
function vocabularyStep(ch,guide){
  const entries=vocabularyEntries(ch,guide);
  if(entries.length<4)return null;
  const base=`${S.subject}-${ch.number}-vocabulary-check`;
  const groups=entries.map((entry,i)=>({id:`${base}-term-${i}`,label:entry.term,description:'Match the correct definition.'}));
  const items=rotated(entries.map((entry,i)=>({id:`${base}-definition-${i}`,label:entry.definition,correctGroupId:groups[i].id})));
  return {
    vocabularyCheck:true,
    t:'Vocabulary Check',
    k:entries.map(x=>x.term).join(','),
    v:'cards',
    learn:`Test the key vocabulary from Chapter ${ch.number}. Do not look at the Important Words tab while you match. Read each definition, then match it to the correct term.`,
    see:['Read the definition','Choose the term','Check the match','Fix any misses'],
    sort:{
      id:base,
      prompt:'Match every definition to the correct vocabulary term. Drag a definition into a term box. On a phone, tap the definition and then tap the term box.',
      groups,
      items
    },
    apply:'Choose two vocabulary terms that could be confused. Explain the difference between them in your own words and give one chapter example for each.',
    more:'This is a retrieval check. Matching from memory is stronger practice than rereading the definitions. If a match is wrong, return to that lesson idea, then try again.'
  };
}
guideFor=function(ch){
  const guide=originalGuideFor(ch);
  if(!guide||!VOCAB_SUBJECTS.has(S.subject)||!Array.isArray(guide.steps))return guide;
  if(guide.steps.some(st=>st?.vocabularyCheck||/^Vocabulary Check$/i.test(String(st?.t||''))))return guide;
  const vocab=vocabularyStep(ch,guide);
  if(!vocab)return guide;
  return {...guide,steps:[...guide.steps,vocab]};
};
try{if(typeof S!=='undefined'&&S.view==='chapter'&&VOCAB_SUBJECTS.has(S.subject)&&typeof render==='function')render(false)}catch(_){ }
})();
