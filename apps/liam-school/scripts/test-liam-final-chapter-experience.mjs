import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../materials/liam-learning-app/',import.meta.url);
const index=await readFile(new URL('index.html',root),'utf8');
const scripts=[...index.matchAll(/<script src="([^"?]+)(?:\?[^\"]*)?"><\/script>/g)].map(x=>x[1]);
const skip=new Set(['data-inline.js','inventory-inline.js','pacing.js','pre-render-sanitizer.js','response-autogrow.js']);
const storage=new Map(),appRoot={innerHTML:'',addEventListener(){},querySelectorAll(){return []}};
const context={console,Date,Map,Set,Blob,TextEncoder,setTimeout,clearTimeout,requestAnimationFrame(fn){fn()},MutationObserver:class{observe(){} disconnect(){}},alert(){},confirm(){return true},location:{hash:'#home'},history:{pushState(){},replaceState(){}},localStorage:{getItem(k){return storage.get(k)??null},setItem(k,v){storage.set(k,v)}},document:{getElementById(id){return id==='app'?appRoot:null},querySelectorAll(){return []},addEventListener(){},createElement(){return {style:{},setAttribute(){},appendChild(){},click(){},remove(){}}},head:{appendChild(){}},body:{appendChild(){},insertAdjacentHTML(){}}},fetch(){throw new Error('inline data should be used')}};
context.window=context;context.window.addEventListener=()=>{};context.window.scrollTo=()=>{};context.URL={createObjectURL(){return 'blob:test'},revokeObjectURL(){}};
context.globalThis=context;vm.createContext(context);
for(const file of ['pacing.js','data-inline.js'])vm.runInContext(await readFile(new URL(file,root),'utf8'),context,{filename:file});
for(const file of scripts.filter(x=>!skip.has(x)))vm.runInContext(await readFile(new URL(file,root),'utf8'),context,{filename:file});

const rows=vm.runInContext(`(()=>{let out=[];for(const subject of ['biology','geography','math']){S.subject=subject;S.student='liam';for(const ch of S.data[subject].chapters){let guide=guideFor(ch),bad=[],maxTerms=0;if((subject==='biology'||subject==='geography')&&Number(ch.number)===5&&guide.teachingV5!==true)bad.push('missing explicit Chapter 5 lesson');for(let i=0;i<guide.steps.length;i++){let st=guide.steps[i],lesson=studentLessonText(st.learn||'');if(!st.vocabularyCheck&&lesson.length<35)bad.push('thin lesson '+(i+1));if(/as you read|left column|right column|make (?:the )?following foldable|review vocabulary|read for main ideas/i.test(lesson))bad.push('textbook direction '+(i+1));saved[subject+'-'+ch.number+'-guide-step']=i;let html=subject==='math'?mathGuidedLesson(ch,guide):guidedLesson(ch,guide),lead=(html.match(/worked-example-lead[^>]*>([\\s\\S]*?)<\\/p>/)||[])[1]||'',terms=(lead.match(/class="term"/g)||[]).length;maxTerms=Math.max(maxTerms,terms);if(terms>3)bad.push('vocabulary clutter '+(i+1))}let worksheet=[],checks=[],prompts=[];try{worksheet=worksheetItems(ch);checks=knowledgeItems(ch);prompts=[...worksheet,...checks].map(q=>cleanStudentText(q.prompt||''))}catch(e){bad.push('runtime '+e.message)};if(subject==='math')for(const p of prompts){if(p.includes('+ +')||p.includes('- .')||p.includes('- )'))bad.push('damaged equation');if(p.split('(').length!==p.split(')').length)bad.push('unbalanced parentheses')}out.push({subject,chapter:ch.number,title:ch.title,steps:guide.steps.length,worksheet:worksheet.length,check:checks.length,maxTerms,bad:[...new Set(bad)]})}}return out})()`,context);
assert.equal(rows.length,62,'Liam must have 62 available chapters across Biology, Geography, and Math I');
for(const row of rows.filter(x=>x.bad.length))console.error(`FAIL ${row.subject} ${row.chapter}: ${row.bad.join(', ')}`);
for(const row of rows)assert.deepEqual(Array.from(row.bad),[],`${row.subject} chapter ${row.chapter} (${row.title}): ${row.bad.join(', ')}`);
for(const row of rows)console.log(`PASS ${row.subject} ${row.chapter}: ${row.title} (${row.steps} lesson blocks, ${row.worksheet} practice, ${row.check} checks)`);
console.log('PASS: every Liam chapter passed the final combined student-experience audit in consecutive course order');
