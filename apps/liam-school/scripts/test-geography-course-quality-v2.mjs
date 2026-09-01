import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const sourcePath=path.resolve(here,'../materials/liam-learning-app/geography-course-quality-v2.js');
const source=fs.readFileSync(sourcePath,'utf8');
assert.doesNotThrow(()=>new Function(source),'Geography quality layer must parse as JavaScript');

const S={subject:'geography',view:'home',chapter:4,data:{geography:{chapters:[]}}};
const chapter={number:4,title:'The Human World',vocabulary:[{term:'death rate'},{term:'birthrate'},{term:'migration'},{term:'population density'}],sections:[
 {title:'Population Patterns',vocabulary:[{term:'population density'},{term:'birthrate'}],blocks:['Population density describes how many people live in a unit of area. Population distribution is uneven because land, climate, resources, and jobs differ from place to place. Birthrates and death rates help explain whether a population grows or shrinks over time.']},
 {title:'Population Change',vocabulary:[{term:'death rate'},{term:'migration'}],blocks:['Population change is shaped by births, deaths, immigration, and emigration. A lower death rate can contribute to faster population growth when birthrates remain high. Migration also redistributes people between places and can change cities and rural areas.']},
 {title:'Urbanization and Movement',vocabulary:[{term:'urbanization'}],blocks:['Urbanization is the growth of cities and the movement of people into urban areas. People may migrate because of jobs, safety, education, family connections, conflict, or environmental change. These push and pull factors influence settlement patterns.']}
]};
S.data.geography.chapters=[chapter];
const duplicate='Name the region type shown in one section example and explain the evidence.';
const baseGuide=()=>({title:'Ch4',big:'x',steps:[{t:'s1',questions:[duplicate]},{t:'s2',questions:[duplicate]},{t:'mastery',questions:[duplicate,duplicate,duplicate]},{t:'Vocabulary Check',vocabularyCheck:true}]});
const baseWorksheet=()=>Array.from({length:15},(_,i)=>i===4?{prompt:'In your own words, explain “death rate” and give an example from the chapter.'}:i===14?{prompt:'In your own words, what does death rate mean? Give one example.'}:{prompt:i<3?duplicate:`Original geography question ${i} about chapter evidence`,answer:'a'});
const baseCheck=()=>Array.from({length:8},(_,i)=>({prompt:i<2?duplicate:`Check ${i} from the chapter`,answer:'a'}));
const sandbox={console,S,guideFor:baseGuide,worksheetItems:baseWorksheet,knowledgeItems:baseCheck,
 sectionMeta:(ch,s,i)=>({title:s.title,vocabulary:s.vocabulary,learningObjectives:[i===0?'Explain population distribution':i===1?'Explain causes of population change':'Explain urbanization and migration']}),
 sectionBlocks:(ch,s)=>s.blocks,cleanStudentText:x=>String(x),artifactText:()=>false,render:()=>{}};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'geography-course-quality-v2.js'});

const guide=sandbox.guideFor(chapter);const prompts=guide.steps.flatMap(s=>s.questions||[]);
assert.equal(new Set(prompts.map(x=>x.toLowerCase())).size,prompts.length,'Guided questions must be unique');
assert.ok(!prompts.some(p=>/region type/i.test(p)),'A stale region-type fallback must not appear in a population chapter');
const worksheet=sandbox.worksheetItems(chapter);
assert.equal(worksheet.length,15,'Geography worksheet must contain 15 quality questions');
assert.equal(worksheet.filter(q=>/death rate/i.test(q.prompt)&&/own words|mean/i.test(q.prompt)).length,1,'A vocabulary term may be directly defined only once per worksheet');
assert.equal(new Set(worksheet.map(q=>q.prompt.toLowerCase())).size,15,'Worksheet prompts must be unique');
const check=sandbox.knowledgeItems(chapter);
assert.equal(check.length,8,'Knowledge check must contain 8 questions');
assert.equal(new Set(check.map(q=>q.prompt.toLowerCase())).size,8,'Knowledge-check prompts must be unique');
const audit=sandbox.__auditGeographyCourseQuality();
assert.equal(audit.chapters,1);assert.equal(audit.passed,true,'Course audit must pass after repair');
console.log('PASS: Geography duplicate prompts, repeated vocabulary, and course-quality audit');
