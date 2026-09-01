import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const source=fs.readFileSync(path.resolve(here,'../materials/liam-learning-app/math-course-quality-v3.js'),'utf8');
assert.doesNotThrow(()=>new Function(source),'Math quality v3 must parse');
const chapters=[{number:3,title:'Functions',sections:Array.from({length:6},(_,i)=>({title:`Section ${i+1}`}))}];
const S={subject:'math',chapter:3,view:'home',data:{math:{chapters},math3:{chapters:[{...chapters[0],number:1,title:'Polynomials'}]}}};
const guideFor=ch=>({title:ch.title,steps:[...ch.sections.map((s,i)=>({t:s.title,try:`Find the slope through (${i},${i+1}) and (${i+2},${i+5}).`,tryAnswer:`slope ${(4)/(2)}`})),{t:'Chapter mastery check',questions:['Solve the practice for Functions. Show the essential method, check the result, and explain one decision.']}]});
const worksheetItems=()=>Array.from({length:15},(_,i)=>({prompt:i<3?'Solve the practice for Functions.':`Evaluate f(${i}) when f(x)=2x+3.`,answer:String(2*i+3)}));
const knowledgeItems=()=>Array.from({length:8},(_,i)=>({prompt:i<2?'Solve the lesson problem using the most efficient valid method.':`Solve ${i+2}x+3=${2*i+11}.`,answer:'x=1'}));
const mathSectionPractice=(ch,s,i)=>[[`For y=${i+2}x+${i}, find y when x=${i+1}.`,String((i+2)*(i+1)+i)],[`A line passes through (${i},${i+2}) and (${i+2},${i+6}). Find the slope.`, '2']];
const mathTestQuestions=ch=>[
 {prompt:'For g(x)=3x-4, find g(7).',answer:'17'},
 {prompt:'Find the equation of the line with slope -2 through (4,1).',answer:'y=-2x+9'},
 {prompt:'Compare y=4x+12 and y=2x+30. Find their intersection.',answer:'(9,48)'}
];
const sandbox={console,S,guideFor,worksheetItems,knowledgeItems,mathSectionPractice,mathTestQuestions,render:()=>{}};sandbox.globalThis=sandbox;
vm.createContext(sandbox);vm.runInContext(source,sandbox,{filename:'math-course-quality-v3.js'});
const generic=/solve the practice for|solve the lesson problem/i;
for(const subject of ['math','math3']){
 S.subject=subject;const ch=S.data[subject].chapters[0];
 const g=sandbox.guideFor(ch),mastery=g.steps.find(s=>/chapter mastery/i.test(s.t));
 assert.ok(mastery.questions.length>=4,'Mastery must contain concrete questions');
 assert.ok(mastery.questions.every(q=>!generic.test(q)),'Mastery may not contain generic instructions');
 const w=sandbox.worksheetItems(ch);assert.equal(w.length,15);assert.ok(w.every(q=>!generic.test(q.prompt)),'Worksheet must contain actual problems');
 const k=sandbox.knowledgeItems(ch);assert.equal(k.length,8);assert.ok(k.every(q=>!generic.test(q.prompt)),'Knowledge check must contain actual problems');
}
const audit=sandbox.__auditMathCourseQualityV3();assert.equal(audit.passed,true,'Math I + Math III audit must pass');
console.log('PASS: Math mastery, worksheet, and knowledge checks contain concrete solvable questions');
