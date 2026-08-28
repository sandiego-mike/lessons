import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../materials/liam-learning-app/math-interactions.js',import.meta.url),'utf8');
const context={console,globalThis:null,pdfClean:value=>String(value??'').replace(/[^\x20-\x7E]/g,'')};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'math-interactions.js'});

assert.equal(context.__pdfSafeMathText('x ≤ 4 and y ≥ -2'),'x <= 4 and y >= -2');
assert.equal(context.pdfClean('x ≤ 4 and y ≥ -2'),'x <= 4 and y >= -2','PDF cleaner must preserve inequality meaning instead of stripping the glyph');
assert.equal(context.pdfClean('a ≠ b'),'a != b');
assert.equal(context.pdfClean('√9 = 3'),'sqrt9 = 3');

const tools=context.__linearGraphTools;
assert.ok(tools,'linear graph helpers should be exposed for regression tests');
assert.deepEqual({...tools.parseLinearEquation('Graph y = 2x - 4.')},{m:2,b:-4});
assert.deepEqual({...tools.parseLinearEquation('y=-x+3')},{m:-1,b:3});
assert.equal(tools.pointOnLine({x:0,y:-4},{m:2,b:-4}),true);
assert.equal(tools.pointOnLine({x:2,y:0},{m:2,b:-4}),true);
assert.equal(tools.pointOnLine({x:2,y:1},{m:2,b:-4}),false);
const fromPoints=tools.lineFromPoints([{x:0,y:-4},{x:2,y:0}]);
assert.equal(fromPoints.m,2);assert.equal(fromPoints.b,-4);
assert.equal(tools.clipLine(2,-4).length,2,'line should clip to two visible grid endpoints');

assert.match(source,/type="range"/,'linear graph UI needs slope/intercept sliders');
assert.match(source,/pointerdown/,'points need drag support');
assert.match(source,/Tap two points/,'mobile tap plotting needs explicit support');
assert.match(source,/Check graph/,'student needs graph-specific feedback');
console.log('PASS: interactive linear graph tools and PDF-safe inequality export');
