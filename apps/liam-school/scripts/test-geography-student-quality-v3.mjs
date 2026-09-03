import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../materials/liam-learning-app/geography-student-quality-v3.js',import.meta.url),'utf8');
new vm.Script(source,{filename:'geography-student-quality-v3.js'});

const chapter={number:4,title:'The Human World',vocabulary:[
 {term:'death rate'},{term:'birthrate'},{term:'natural increase'},{term:'doubling time'},{term:'population distribution'},{term:'population density'},{term:'migration'}
],sections:[{title:'World Population',blocks:[
 `World Population The world’s largest cities are often in the news. Why is the world’s population unevenly distributed? A Geographic View Nile Delta in Peril The black soil of the Nile Delta has made it the foundation stone of seven millennia of human history. Today Egypt’s battle is to preserve the soil and water that have always given life to the delta. One hundred fifty years ago this nation had five million acres of farmland and five million citizens; now it has seven million acres of farmland and 60 million citizens. National Geographic, January 1997. Key terms for this section: death rate birthrate natural increase doubling time population distribution population density migration.`
]}]};
const generic='death rate is a chapter term Liam should use to explain a specific place, region, pattern, map, or human-environment relationship.';
const groups=chapter.vocabulary.slice(0,7).map((v,i)=>({id:'g'+i,label:v.term}));
const items=groups.map((g,i)=>({id:'i'+i,label:generic,correctGroupId:g.id}));
const context={console,TERM_DEFS:{geography:{}},S:{subject:'geography',view:'home',data:{geography:{chapters:Array.from({length:34},(_,i)=>i===3?chapter:{...chapter,number:i+1})}}},cleanStudentText:x=>String(x),render(){},guideFor(ch){return {title:'x',steps:[{t:'World Population',learn:`From the chapter PDF: ${chapter.sections[0].blocks[0]} Key terms for this section: ${generic}`,see:[]},{vocabularyCheck:true,t:'Vocabulary Check',learn:'old',sort:{groups,items}}]}}};
context.globalThis=context;
vm.createContext(context);vm.runInContext(source,context);
const guide=context.guideFor(chapter);
const lesson=guide.steps[0].learn;
assert.doesNotMatch(lesson,/chapter term Liam should use|Key terms for this section|National Geographic|A Geographic View/i);
assert.match(lesson,/Egypt’s battle|five million acres|60 million citizens/i);
const vocab=guide.steps[1];
assert.ok(vocab.sort.items.length>=7,'Chapter 4 should retain verified vocabulary terms');
const labels=vocab.sort.items.map(x=>x.label).join(' ');
assert.match(labels,/number of deaths per year for every 1,000/i);
assert.match(labels,/number of births per year for every 1,000/i);
assert.match(labels,/takes a population growing at its current rate to double/i);
assert.doesNotMatch(labels,/Liam should|Use this concept|This section is about/i);
for(const item of vocab.sort.items){
 const group=vocab.sort.groups.find(g=>g.id===item.correctGroupId);
 assert.ok(group,'Every definition must point to a real term');
 assert.ok(!item.label.toLowerCase().includes(group.label.toLowerCase()),`Definition card reveals its own term: ${group.label}`);
}
assert.ok(context.TERM_DEFS.geography['death rate'],'Population vocabulary must be installed into the real glossary');
console.log('PASS Geography student-quality v3: clean PDF lesson + verified vocabulary cards');
