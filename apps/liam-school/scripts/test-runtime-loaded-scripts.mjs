import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../materials/liam-learning-app');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\s+src="([^"?]+)(?:\?[^\"]*)?"/g)].map(m=>m[1]);
assert.ok(scripts.length>=10,'Expected the production script stack');
for(const src of scripts){
  const file=path.join(root,src);assert.ok(fs.existsSync(file),`Loaded script must exist: ${src}`);
  const source=fs.readFileSync(file,'utf8');
  assert.doesNotThrow(()=>new Function(source),`Loaded script must parse: ${src}`);
}
const sanitizer=fs.readFileSync(path.join(root,'pre-render-sanitizer.js'),'utf8');
assert.ok(sanitizer.includes('__sanitizeLegacyMathHtml'));
assert.ok(sanitizer.includes('data-guide-try-key'));
const quality=fs.readFileSync(path.join(root,'math-course-quality-v3.js'),'utf8');
assert.ok(/solve the practice for/.test(quality),'Quality layer must explicitly reject the screenshot failure');
assert.ok(quality.includes('__auditMathCourseQualityV3'));
console.log(`PASS: ${scripts.length} production JavaScript files parse, including startup and math quality guards`);
