import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../materials/liam-learning-app');
const files=['math-course-upgrade-v2.js','math-graph-points.js','math-answer-input-fix.js'];
for(const name of files){
  const source=fs.readFileSync(path.join(root,name),'utf8');
  assert.doesNotThrow(()=>new Function(source),`${name} must parse as JavaScript`);
}
const fix=fs.readFileSync(path.join(root,'math-answer-input-fix.js'),'utf8');
assert.ok(fix.includes('data-guide-try-key'),'Try It input must use a data key');
assert.ok(fix.includes("document.addEventListener('input'"),'Try It autosave must use an event listener');
assert.ok(!/oninput\s*=/.test(fix),'Fix script must not generate inline oninput handlers');
assert.ok(fix.includes("S.subject==='math'||S.subject==='math3'"),'Fix must cover Math I and Math III');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(index.includes('math-course-upgrade-v2.js'),'Math course v2 must load');
console.log('PASS: loaded math upgrade scripts parse and Try It autosave is event-based');
