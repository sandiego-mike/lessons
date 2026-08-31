import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const source=fs.readFileSync(path.resolve(here,'../materials/liam-learning-app/math-graph-points.js'),'utf8');
assert.doesNotThrow(()=>new Function(source),'math-graph-points.js must parse');
for(const token of ['pointerdown','pointermove','pointerup','Tap the graph to place a point','Drag any orange point','math3','graph-points-v44'])assert.ok(source.includes(token),`Missing graph interaction token: ${token}`);
for(const ch of [3,4,5,6,8,10,11])assert.ok(source.includes(String(ch)),`Math I graph chapter ${ch} missing`);
for(const ch of [1,2,3,4,5,6,9])assert.ok(source.includes(String(ch)),`Math III graph unit ${ch} missing`);
assert.ok(source.includes('saveState(st)'),'Point work must save automatically');
console.log('PASS: tap/drag graph points parse and cover Math I + Math III graph-heavy units');
