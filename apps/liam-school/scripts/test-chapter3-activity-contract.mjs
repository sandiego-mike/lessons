import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const fix=fs.readFileSync(new URL('../materials/liam-learning-app/chapter3-activity-fix.js',import.meta.url),'utf8');
const WEEK2_GUIDES={
  biology:{3:{steps:[
    {t:'Limiting factors',apply:'Drought cuts grass seed production in half. Predict what may happen to mice and hawks and explain the chain.'},
    {t:'Mastery',questions:['What is a limiting factor?'],apply:'Write a summary.'}
  ]}},
  geography:{3:{steps:[
    {t:'Weather vs climate',apply:'Classify the examples.'}
  ]}}
};
const context={WEEK2_GUIDES};
vm.createContext(context);
vm.runInContext(fix,context,{filename:'chapter3-activity-fix.js'});
for(const subject of ['biology','geography']){
  for(const step of context.WEEK2_GUIDES[subject][3].steps){
    const hasActivity=!!(step.sort||step.sequence||step.choices||step.questions||step.try||step.tryAnswer);
    assert.ok(hasActivity,`${subject} Chapter 3 contains a lesson block without an activity`);
  }
}
assert.deepEqual([...context.WEEK2_GUIDES.biology[3].steps[0].questions],[
  'Drought cuts grass seed production in half. Predict what may happen to mice and hawks and explain the chain.'
]);
assert.equal(context.WEEK2_GUIDES.biology[3].steps[1].apply,'Write a summary.');
console.log('PASS: Chapter 3 guided blocks all have renderable activities');
