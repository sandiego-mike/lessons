import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../materials/liam-learning-app/vocabulary-check.js',import.meta.url),'utf8');
const context={
  S:{subject:'biology',chapter:3,view:'home'},
  render:()=>{},
  termInfo:({term})=>({term,definition:`Definition for ${term} with enough detail to test matching.`}),
  guideFor:(ch)=>({title:'Chapter',steps:[
    {t:'One',k:'limiting factor,tolerance'},
    {t:'Two',k:'succession,primary succession,pioneer species'},
    {t:'Three',k:'biome,photic zone,aphotic zone'},
    {t:'Mastery',questions:['q']}
  ]})
};
vm.createContext(context);
vm.runInContext(source,context,{filename:'vocabulary-check.js'});

let guide=context.guideFor({number:3,vocabulary:[{term:'estuary'},{term:'intertidal zone'}]});
let block=guide.steps.at(-1);
assert.equal(block.t,'Vocabulary Check');
assert.equal(block.sort.groups.length,10);
assert.equal(block.sort.items.length,10);
assert.notEqual(block.sort.items[0].correctGroupId,block.sort.groups[0].id,'definitions must not be shown in matching term order');
const groupIds=new Set(block.sort.groups.map(x=>x.id));
assert.ok(block.sort.items.every(x=>groupIds.has(x.correctGroupId)),'every definition must map to a real term group');
assert.match(block.sort.prompt,/phone, tap/i,'mobile must have a non-drag tap workflow');
assert.equal(guide.steps.filter(x=>x.t==='Vocabulary Check').length,1,'vocabulary block should be appended once');

context.S.subject='geography';
guide=context.guideFor({number:3,vocabulary:[{term:'weather'},{term:'climate'},{term:'axis'},{term:'revolution'}]});
assert.equal(guide.steps.at(-1).t,'Vocabulary Check');

context.S.subject='math';
guide=context.guideFor({number:3,vocabulary:[{term:'equation'},{term:'solution'},{term:'variable'},{term:'function'}]});
assert.notEqual(guide.steps.at(-1).t,'Vocabulary Check','this change should not alter the math lesson sequence');

console.log('PASS: vocabulary drag/tap matching block appended once for Biology and Geography');
