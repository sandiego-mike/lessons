import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../materials/liam-learning-app/math1-deep-lessons.js',import.meta.url),'utf8');
let saved={};
const S={subject:'math',chapter:1,view:'home'};
function makeChapter(n){return {number:n,title:`Chapter ${n}`,sections:Array.from({length:6},(_,i)=>({title:`Section ${i+1}`,math:{standard:{id:`STD-${n}-${i+1}`,shortDescription:`Standard ${n}.${i+1}`}}}))}}
const context={console,S,saved,globalThis:null,
  guideFor:(ch)=>({title:`Chapter ${ch.number}`,big:'Base guide.',mastery:[],steps:Array.from({length:7},(_,i)=>i===6?{t:'Chapter mastery check',questions:['Mixed question 1','Mixed question 2'],learn:'mastery'}:{t:`Section ${i+1}`,learn:'generic',try:'generic same problem',apply:'generic same apply'})}),
  mathGuidedLesson:()=>'<div>old mental drill</div>',
  save:()=>{},navigate:()=>{},render:()=>{},chap:()=>context.currentChapter,
  guideSaveKey:(idx,field)=>`math-${S.chapter}-guide-${idx}-${field}`,
  esc:x=>String(x).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m])),
  formatMathNotation:x=>String(x),injectTerms:x=>String(x),
  blankCoordinateGridHtml:()=>'<div>GRID</div>',blankNumberLineHtml:()=>'<div>NUMBER LINE</div>',
  alert:()=>{},window:{scrollTo:()=>{}}
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'math1-deep-lessons.js'});

const audit=context.__auditMath1Lessons();
assert.equal(audit.length,12,'audit must cover all 12 Integrated Math I chapters');
for(const row of audit){
  assert.ok(row.lessons>=6,`chapter ${row.chapter} should have at least 6 distinct lesson designs`);
  assert.equal(row.duplicatePrompts,0,`chapter ${row.chapter} should not repeat Try It prompts`);
  assert.ok(row.kinds>=6,`chapter ${row.chapter} should vary task types`);
}
for(const n of [1,2,3]){
  S.chapter=n; context.currentChapter=makeChapter(n);
  const guide=context.guideFor(context.currentChapter);
  const prompts=guide.steps.slice(0,6).map(s=>s.try);
  assert.equal(new Set(prompts).size,prompts.length,`chapter ${n} visible blocks must have different questions`);
  assert.ok(guide.steps.every(s=>s.math1),`chapter ${n} steps should be upgraded`);
}
S.chapter=3; context.currentChapter=makeChapter(3);
let guide=context.guideFor(context.currentChapter);
assert.doesNotMatch(guide.steps[0].learn,/undo operations in reverse order/i,'function chapter must not use generic equation rule');
let html=context.mathGuidedLesson(context.currentChapter,guide);
assert.match(html,/Worked example/);
assert.match(html,/Try It — new problem/);
assert.match(html,/Check my attempt/);
assert.match(html,/LEARNING TARGET/);
assert.match(html,/STANDARD FOCUS/);
assert.doesNotMatch(html,/Mental Math Lab/);

const bank=context.__MATH1_LESSON_BANK__;
assert.match(bank[7].map(x=>x.core+' '+x.try).join(' '),/sampling|standard deviation|scatterplot|margin of error/i,'statistics chapter needs statistics-specific work');
assert.match(bank[9].map(x=>x.core+' '+x.try).join(' '),/converse|counterexample|deductive|proof/i,'reasoning chapter needs proof-specific work');
assert.match(bank[11].map(x=>x.core+' '+x.try).join(' '),/translation|reflection|rotation|dilation/i,'transformations chapter needs transformation-specific work');
assert.match(bank[12].map(x=>x.core+' '+x.try).join(' '),/SAS|ASA|HL|similar/i,'triangle chapter needs congruence/similarity work');
console.log('PASS: all 12 Math I chapters have distinct, topic-specific lesson tasks and the repeated mental-drill renderer is replaced.');
