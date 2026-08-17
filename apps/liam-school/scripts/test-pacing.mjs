import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'materials', 'liam-learning-app');
const context = { console };
context.globalThis = context;
context.window = context;
vm.createContext(context);
vm.runInContext(readFileSync(path.join(appDir, 'pacing.js'), 'utf8'), context, { filename: 'pacing.js' });
vm.runInContext(readFileSync(path.join(appDir, 'data-inline.js'), 'utf8'), context, { filename: 'data-inline.js' });

const results = context.LiamPacing.runTests(context.__LIAM_COURSE_DATA__);
let failed = 0;
for (const result of results) {
  console.log(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}`);
  if (!result.pass) failed++;
}
if (failed) {
  process.exitCode = 1;
}
