import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const source=fs.readFileSync(path.resolve(here,'../materials/liam-learning-app/math-course-upgrade.js'),'utf8');

for(let ch=1;ch<=12;ch++){
  assert.match(source,new RegExp(`\\n\\s*${ch}:\\[`),`Chapter ${ch} needs a persistent tool lab`);
}
const required=[
 'Equation Balance Lab','Inequality Number Line Lab','Linear Graph Lab',
 'Linear Forms & Sequences Lab','Systems Graph Lab','Exponential Graph Lab',
 'Statistics Data Lab','Coordinate Geometry Lab','Logic & Proof Lab',
 'Parallel & Perpendicular Lab','Transformation Lab','Triangle Geometry Lab'
];
for(const label of required)assert.ok(source.includes(label),`Missing ${label}`);
for(const token of ['pointerdown','pointermove','type="range"','Slope & intercept','data-op="','Analyze data','contrapositive','Dilation scale']){
  assert.ok(source.includes(token),`Missing interaction contract: ${token}`);
}
for(const symbol of ['≤','≥','≠'])assert.ok(source.includes(symbol),`Missing symbol ${symbol}`);
assert.ok(source.includes("split(/or|and/)"),'Compound inequality partial-answer feedback must exist.');
assert.ok(source.includes("sort().join('or')"),'Equivalent OR branch order should normalize.');
assert.ok(source.includes("sort().join('and')"),'Equivalent AND branch order should normalize.');
assert.ok(source.includes("document.getElementById('linear-graph-lab')?.remove()"),'Legacy Chapter 3 special-case lab should be superseded.');
console.log('PASS: Math I Chapters 1-12 have topic-matched tools, symbols, and interaction contracts');
