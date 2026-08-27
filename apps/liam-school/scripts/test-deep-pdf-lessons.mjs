import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../materials/liam-learning-app/deep-pdf-lessons.js',import.meta.url),'utf8');
const S={subject:'biology',chapter:4,view:'home'};
const chapter={number:4,title:'Population Biology',sections:[
  {title:'Population Growth',blocks:[
    'Population growth can begin slowly and then become exponential when resources are abundant. As the population grows, more organisms use the available resources.',
    'Carrying capacity is the number of organisms an environment can support. Above carrying capacity, deaths can exceed births and the population falls.'
  ],vocabulary:[{term:'carrying capacity'}]},
  {title:'Population Limits',blocks:[
    'Density-dependent factors include competition, disease, and predation. Their effects usually become stronger as population density increases.',
    'Density-independent factors such as drought, floods, or severe weather can affect populations regardless of density.'
  ],vocabulary:[{term:'density-dependent factor'}]}
],vocabulary:[],worksheet:[]};
let saved={};
const context={console,S,saved,
  guideFor:()=>({title:'Chapter 4',big:'old generic',steps:[{t:'one',learn:'same',apply:'Explain your reasoning.'},{t:'two',learn:'same',apply:'Explain your reasoning.'}]}),
  cleanStudentText:x=>String(x).replace(/\s+/g,' ').trim(),
  usableStudentText:x=>String(x).length>45,
  artifactText:()=>false,
  sectionMeta:(ch,s,i)=>({title:s.title,interactionType:i?'cause-effect':'data-analysis',vocabulary:s.vocabulary||[],learningObjectiveId:'o',conceptId:'c'}),
  termInfo:v=>({term:v.term||v,definition:(v.term||v)+' definition'}),
  conceptDepth:()=> 'This section connects evidence to the biological process.',
  activityRequiresCompletion:a=>a&&['choice','sort','sequence'].includes(a.type),
  activityComplete:()=>false,
  normalizeStepActivity:st=>st.questions?{type:'shortResponseGroup'}:null,
  isStepReady:()=>true,
  mathGuidedLesson:()=>'',subjectLabel:x=>x,esc:x=>String(x),injectTerms:x=>String(x),
  formatMathNotation:x=>x,guideHelp:()=>'',guideMore:()=>'',guideVisual:()=>'',guideTry:(ch,st)=>`TRY:${(st.questions||[]).join('|')}`,
  guideText:()=>'<textarea></textarea>',render:()=>{}
};
vm.createContext(context);
vm.runInContext(source,context,{filename:'deep-pdf-lessons.js'});
const guide=context.guideFor(chapter);
assert.match(guide.big,/taught from the supplied textbook PDF/i);
assert.match(guide.steps[0].learn,/Population growth can begin slowly/);
assert.match(guide.steps[0].learn,/Carrying capacity is the number/);
assert.match(guide.steps[1].learn,/Density-dependent factors include competition/);
assert.notEqual(guide.steps[0].learn,guide.steps[1].learn,'different PDF sections must not collapse into the same lesson');
assert.equal(guide.steps[0].noApply,true);
assert.equal(guide.steps[1].noApply,true);
assert.equal(guide.steps[0].questions.length,1,'each deep lesson needs an answerable Try It control');
assert.equal(guide.steps[1].questions.length,1,'each deep lesson needs an answerable Try It control');
assert.notEqual(guide.steps[0].questions[0],guide.steps[1].questions[0],'activity type should change the practice prompt');
context.S.chapter=4;
const html=context.guidedLesson(chapter,guide);
assert.match(html,/<h3>Lesson<\/h3>/);
assert.match(html,/TRY:/);
assert.doesNotMatch(html,/<h3>Apply<\/h3>/,'written Try It should not receive a duplicate explanation box');
assert.match(source,/REDUNDANT_APPLY/);
assert.match(source,/Now explain your reasoning/);
console.log('PASS: later chapters use distinct PDF text, answerable Try It blocks, and no redundant Apply prompt');
