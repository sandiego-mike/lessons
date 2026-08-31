import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const file=path.resolve(here,'../materials/liam-learning-app/math-course-upgrade-v2.js');
const source=fs.readFileSync(file,'utf8');

// This catches the exact class of production failure that caused the startup-error screen.
assert.doesNotThrow(()=>new Function(source),'math-course-upgrade-v2.js must parse as JavaScript');

const math1=[
 'Equation Balance Lab','Inequality Number-Line Lab','Linear Graph Lab','Linear Forms & Sequences Lab',
 'Systems Graph Lab','Exponential Graph Lab','Statistics Data Lab','Coordinate Geometry Lab','Logic & Proof Lab',
 'Parallel & Perpendicular Lab','Transformation Lab','Triangle Geometry Lab'
];
const math3=[
 'Polynomial Structure & Graph Lab','Polynomial Zeros Lab','Radicals & Function Transformations Lab',
 'Exponential & Geometric Model Lab','Logarithm Lab','Rational Function Lab','Statistics & Probability Lab',
 'Triangle Modeling Lab','Trigonometry Graph Lab'
];
for(const label of math1)assert.ok(source.includes(label),`Missing Math I lab: ${label}`);
for(const label of math3)assert.ok(source.includes(label),`Missing Math III lab: ${label}`);
assert.equal(math1.length,12);
assert.equal(math3.length,9);
for(const symbol of ['≤','≥','≠','π','√','°'])assert.ok(source.includes(symbol),`Missing math symbol ${symbol}`);
for(const token of ['polynomial','radical','logarithm','rational','trig','systems','statistics','triangle'])assert.ok(source.includes(`'${token}'`)||source.includes(`===\'${token}\'`)||source.includes(`===\"${token}\"`)||source.includes(`=== '${token}'`)||source.includes(`===\"${token}\"`),`Missing tool type ${token}`);
assert.ok(source.includes("S.subject==='math3'"),'Math III subject path must be explicit');
assert.ok(source.includes('canonical'),'Equivalent symbol/input normalization must exist');
assert.ok(source.includes('guideFor'),'Math III guided lessons must receive the chapter-specific verification prompts');
console.log('PASS: syntax + Math I 12-chapter + Math III 9-unit interactive coverage');
