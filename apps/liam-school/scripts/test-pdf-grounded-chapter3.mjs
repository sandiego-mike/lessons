import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const sourcePath = path.join(appRoot, 'materials', 'liam-learning-app', 'pdf-grounded-lessons.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const sandbox = {
  console,
  WEEK2_GUIDES:{biology:{},geography:{}},
  TERM_DEFS:{biology:{},geography:{}},
  S:{subject:'biology',view:'home',chapter:1},
  isMathSubject:()=>false,
  guideWorksheet:()=>[{prompt:'legacy'}],
  worksheetItems:()=>[{prompt:'legacy generic worksheet prompt long enough to be considered usable'}],
  knowledgeItems:()=>[{prompt:'legacy'}],
  generatedGuideFor:(ch)=>({title:ch.title,big:'legacy',mastery:['legacy'],steps:(ch.sections||[]).map((s)=>({t:s.title,learn:'legacy',apply:'legacy'}))}),
  sectionMeta:(ch,s,i)=>({subject:sandbox.S.subject,section:String(i+1),title:s.title||'Section',vocabulary:(ch.vocabulary||[]).slice(0,2),learningObjectives:[`Explain ${s.title} using chapter evidence.`],learningObjectiveId:'obj',conceptId:`concept-${i+1}`}),
  sectionBlocks:(ch,s)=>s.blocks||[],
  usableStudentText:(x)=>String(x||'').length>20,
  cleanStudentText:(x)=>String(x||'').replace(/\s+/g,' ').trim(),
  slugText:(x)=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,'-'),
  termInfo:(v)=>({term:v.term||v,definition:`definition of ${v.term||v}`,example:`example of ${v.term||v}`}),
  conceptDepth:()=> 'deeper explanation',
  alignedActivity:(meta)=>({apply:`Apply ${meta.title} using PDF evidence.`,answer:`Answer from ${meta.title}.`}),
  render:()=>{},
};
sandbox.customGuideFor=(ch)=>sandbox.WEEK2_GUIDES[sandbox.S.subject]?.[ch.number]||null;
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'pdf-grounded-lessons.js'});

assert.ok(sandbox.WEEK2_GUIDES.biology[3]);
assert.ok(sandbox.WEEK2_GUIDES.geography[3]);
assert.ok(sandbox.WEEK2_GUIDES.biology[3].steps.length >= 10);
assert.ok(sandbox.WEEK2_GUIDES.geography[3].steps.length >= 12);
assert.ok(sandbox.WEEK2_GUIDES.biology[3].steps.some(s=>/limiting factor/i.test(s.learn)));
assert.ok(sandbox.WEEK2_GUIDES.biology[3].steps.some(s=>/primary succession/i.test(s.learn)));
assert.ok(sandbox.WEEK2_GUIDES.biology[3].steps.some(s=>/photic/i.test(s.learn)));
assert.ok(sandbox.WEEK2_GUIDES.geography[3].steps.some(s=>/weather/i.test(s.learn)&&/climate/i.test(s.learn)));
assert.ok(sandbox.WEEK2_GUIDES.geography[3].steps.some(s=>/rain shadow/i.test(s.learn)));
assert.ok(sandbox.WEEK2_GUIDES.geography[3].steps.some(s=>/El Niño/i.test(s.learn)));

sandbox.S.subject='biology';
let qs=sandbox.guideWorksheet({number:3},{});
assert.equal(qs.length,12);
assert.ok(qs.every(q=>!/(pond parts|coyotes living|grass -> rabbit -> fox)/i.test(q.prompt)));
assert.ok(qs.some(q=>/carp survival/i.test(q.prompt)));
assert.ok(qs.some(q=>/Yellowstone/i.test(q.prompt)));
assert.equal(sandbox.knowledgeItems({number:3}).length,8);

sandbox.S.subject='geography';
qs=sandbox.guideWorksheet({number:3},{});
assert.equal(qs.length,12);
assert.ok(qs.some(q=>/3.5°F/i.test(q.prompt)));
assert.ok(qs.some(q=>/El Niño/i.test(q.prompt)));
assert.ok(qs.some(q=>/rain-shadow/i.test(q.prompt)));
assert.equal(sandbox.knowledgeItems({number:3}).length,8);

sandbox.S.subject='biology';
const fake={number:4,title:'Other PDF Chapter',sections:[{title:'Real PDF Section',blocks:['This is a sufficiently long paragraph extracted from the supplied textbook PDF and should become the visible lesson text.']}],vocabulary:[{term:'climate'}],worksheet:[]};
const guide=sandbox.generatedGuideFor(fake);
assert.match(guide.big,/supplied PDF section/i);
assert.match(guide.steps[0].learn,/extracted from the supplied textbook PDF/i);
assert.match(guide.steps[0].learn,/definition of climate/i);
const generatedQs=sandbox.worksheetItems(fake);
assert.ok(generatedQs.some(q=>/Real PDF Section/i.test(q.prompt)));
const generatedChecks=sandbox.knowledgeItems(fake);
assert.ok(generatedChecks.some(q=>/Real PDF Section/i.test(q.prompt)));

console.log('PASS: Chapter 3 textbook lessons + PDF-grounded full-course question generation');
