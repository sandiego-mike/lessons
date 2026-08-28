(function(){
'use strict';

// PDF export uses the built-in PDF fonts, which are ASCII-safe in this app.
// Convert display-only math glyphs back to unambiguous math text before the
// existing PDF cleaner removes unsupported Unicode. This preserves meaning in
// blank worksheets, completed work, answer keys, portfolios, and reports.
const originalPdfClean=typeof pdfClean==='function'?pdfClean:null;
function exportSafeMathText(value){
  return String(value??'')
    .replace(/&le;|&#8804;/gi,'<=')
    .replace(/&ge;|&#8805;/gi,'>=')
    .replace(/&ne;|&#8800;/gi,'!=')
    .replace(/≤/g,'<=')
    .replace(/≥/g,'>=')
    .replace(/≠/g,'!=')
    .replace(/−/g,'-')
    .replace(/×/g,'x')
    .replace(/÷/g,'/')
    .replace(/√/g,'sqrt')
    .replace(/π/g,'pi')
    .replace(/°/g,' degrees');
}
globalThis.__pdfSafeMathText=exportSafeMathText;
if(originalPdfClean){
  pdfClean=function(value){return originalPdfClean(exportSafeMathText(value))};
}

function parseLinearEquation(text){
  let s=String(text||'').replace(/−/g,'-').replace(/\s+/g,'');
  let match=s.match(/y=([+-]?(?:\d+(?:\.\d+)?|\.\d+)?)(?:\*)?x([+-]\d+(?:\.\d+)?)?/i);
  if(!match)return null;
  let raw=match[1],m=raw===''||raw==='+'?1:raw==='-'?-1:Number(raw),b=match[2]?Number(match[2]):0;
  return Number.isFinite(m)&&Number.isFinite(b)?{m,b}:null;
}
function lineFromPoints(points){
  if(!Array.isArray(points)||points.length<2)return null;
  let a=points[0],b=points[1],dx=b.x-a.x;
  if(Math.abs(dx)<1e-9)return {vertical:true,x:a.x};
  let m=(b.y-a.y)/dx;
  return {m,b:a.y-m*a.x};
}
function pointOnLine(point,line,tolerance=.12){
  if(!point||!line)return false;
  if(line.vertical)return Math.abs(point.x-line.x)<=tolerance;
  return Math.abs(point.y-(line.m*point.x+line.b))<=tolerance;
}
function clipLine(m,b,min=-5,max=5){
  if(!Number.isFinite(m)||!Number.isFinite(b))return [];
  let pts=[],add=(x,y)=>{
    if(x<min-1e-7||x>max+1e-7||y<min-1e-7||y>max+1e-7)return;
    if(!pts.some(p=>Math.abs(p.x-x)<1e-7&&Math.abs(p.y-y)<1e-7))pts.push({x,y});
  };
  add(min,m*min+b);add(max,m*max+b);
  if(Math.abs(m)>1e-9){add((min-b)/m,min);add((max-b)/m,max)}
  return pts.slice(0,2);
}
globalThis.__linearGraphTools={parseLinearEquation,lineFromPoints,pointOnLine,clipLine};

if(typeof document==='undefined'||typeof S==='undefined')return;

const css=`
.interactive-graph-card{border:1px solid #c9d8e7;border-radius:18px;background:#fff;padding:14px;margin:12px 0;box-shadow:0 1px 0 rgba(18,50,79,.04)}
.interactive-graph-head{display:flex;gap:10px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px}
.interactive-graph-head strong{font-size:1.05rem}.interactive-graph-head small{display:block;color:#63758a;margin-top:3px;max-width:620px}
.graph-mode-row,.graph-action-row{display:flex;gap:8px;flex-wrap:wrap}.graph-mode-row button,.graph-action-row button{min-height:42px;border:1px solid #b9cadb;border-radius:12px;background:#fff;padding:8px 12px;font-weight:650;color:#17324f}
.graph-mode-row button.active{background:#17324f;color:#fff;border-color:#17324f}
.interactive-graph-svg{display:block;width:100%;max-width:620px;aspect-ratio:1/1;margin:8px auto;border:1px solid #c7d6e5;border-radius:14px;background:#fbfdff;touch-action:none;user-select:none}
.graph-grid-line{stroke:#dbe5ef;stroke-width:1}.graph-axis{stroke:#17324f;stroke-width:2.2}.graph-student-line{stroke:#167a64;stroke-width:4;stroke-linecap:round}.graph-point{fill:#167a64;stroke:#fff;stroke-width:3;cursor:grab}.graph-point-hit{fill:transparent;cursor:grab}.graph-point-label{font-size:14px;fill:#17324f;font-weight:700;pointer-events:none}.graph-tick{font-size:12px;fill:#607489;pointer-events:none}
.graph-sliders{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0}.graph-slider{border:1px solid #d5e1ec;border-radius:12px;padding:10px}.graph-slider label{display:flex;justify-content:space-between;font-weight:700;margin-bottom:5px}.graph-slider input{width:100%}.graph-equation{font-size:1.12rem;font-weight:800;text-align:center;padding:9px;border-radius:12px;background:#eef7f4;color:#135e50}
.graph-feedback{min-height:24px;margin-top:8px;font-weight:650}.graph-feedback.good{color:#126a4f}.graph-feedback.try-again{color:#9a4b24}
.graph-point-list{color:#526b82;font-size:.93rem;margin-top:6px}.graph-hidden{display:none!important}
@media(max-width:620px){.graph-sliders{grid-template-columns:1fr}.interactive-graph-card{padding:10px}.graph-mode-row button,.graph-action-row button{flex:1 1 auto}.interactive-graph-svg{max-width:100%}}
`;
if(!document.getElementById('math-interactions-style')){
  let style=document.createElement('style');style.id='math-interactions-style';style.textContent=css;document.head.appendChild(style);
}

function nfmt(n){
  let v=Math.abs(n)<1e-9?0:Math.round(n*100)/100;
  return Number.isInteger(v)?String(v):String(v);
}
function equationLabel(m,b){
  let lead=Math.abs(m-1)<1e-9?'x':Math.abs(m+1)<1e-9?'-x':`${nfmt(m)}x`;
  let tail=Math.abs(b)<1e-9?'':b>0?` + ${nfmt(b)}`:` - ${nfmt(Math.abs(b))}`;
  return `y = ${lead}${tail}`;
}
function domainToSvg(point){return {x:300+point.x*50,y:300-point.y*50}}
function svgToDomain(svg,event){
  let rect=svg.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*600,y=(event.clientY-rect.top)/rect.height*600;
  return {x:Math.max(-5,Math.min(5,Math.round(((x-300)/50)*2)/2)),y:Math.max(-5,Math.min(5,Math.round(((300-y)/50)*2)/2))};
}
function graphKey(type,index){return type==='lesson'?`math-${S.chapter}-interactive-graph-${index}`:`math-${S.chapter}-worksheet-graph-${index}`}
function readGraphState(key){
  let raw=saved[key];
  if(!raw||typeof raw!=='object')return {mode:'points',points:[],m:1,b:0};
  return {mode:raw.mode==='slope'?'slope':'points',points:Array.isArray(raw.points)?raw.points.slice(0,8):[],m:Number.isFinite(Number(raw.m))?Number(raw.m):1,b:Number.isFinite(Number(raw.b))?Number(raw.b):0};
}
function storeGraphState(key,state){saved[key]={...state,updatedAt:new Date().toISOString()};if(typeof save==='function')save()}
function pointSummary(points){return points.length?points.map(p=>`(${nfmt(p.x)}, ${nfmt(p.y)})`).join(', '):'No points plotted yet.'}

function gridMarkup(){
  let grid=[],labels=[];
  for(let n=-5;n<=5;n++){
    let p=300+n*50;
    grid.push(`<line class="graph-grid-line" x1="50" y1="${p}" x2="550" y2="${p}"/><line class="graph-grid-line" x1="${p}" y1="50" x2="${p}" y2="550"/>`);
    if(n!==0){labels.push(`<text class="graph-tick" x="${p}" y="318" text-anchor="middle">${n}</text><text class="graph-tick" x="286" y="${306-n*50}" text-anchor="end">${n}</text>`)}
  }
  return `${grid.join('')}<line class="graph-axis" x1="50" y1="300" x2="550" y2="300"/><line class="graph-axis" x1="300" y1="50" x2="300" y2="550"/>${labels.join('')}<text class="graph-tick" x="558" y="294">x</text><text class="graph-tick" x="308" y="44">y</text>`;
}

function buildInteractiveGraph(oldGrid,{type,index,prompt,linear}){
  let key=graphKey(type,index),state=readGraphState(key),target=parseLinearEquation(prompt),host=document.createElement('div');
  host.className='interactive-graph-card';host.dataset.graphKey=key;
  host.innerHTML=`<div class="interactive-graph-head"><div><strong>${linear?'Interactive linear graph':'Interactive coordinate plane'}</strong><small>${linear?'Tap two points on the grid or switch to slope/intercept sliders. Drag any plotted point to move it.':'Tap the grid to place points. Drag a point to move it; use Undo or Clear when needed.'}</small></div><div class="graph-mode-row"><button type="button" data-graph-mode="points">Plot points</button>${linear?'<button type="button" data-graph-mode="slope">Slope & intercept</button>':''}</div></div>
  <svg class="interactive-graph-svg" viewBox="0 0 600 600" role="application" aria-label="Interactive coordinate plane from negative five to five">${gridMarkup()}<line class="graph-student-line graph-hidden" x1="0" y1="0" x2="0" y2="0"/><g class="graph-points"></g></svg>
  ${linear?`<div class="graph-sliders"><div class="graph-slider"><label><span>Slope m</span><output data-slope-output></output></label><input data-slope type="range" min="-5" max="5" step="0.5"></div><div class="graph-slider"><label><span>y-intercept b</span><output data-intercept-output></output></label><input data-intercept type="range" min="-5" max="5" step="0.5"></div></div><div class="graph-equation" data-equation-readout></div>`:''}
  <div class="graph-point-list" data-point-list></div><div class="graph-action-row"><button type="button" data-graph-undo>Undo point</button><button type="button" data-graph-clear>Clear graph</button>${target?'<button type="button" data-graph-check>Check graph</button>':''}</div><div class="graph-feedback" data-graph-feedback></div>`;
  oldGrid.replaceWith(host);
  let svg=host.querySelector('.interactive-graph-svg'),pointLayer=host.querySelector('.graph-points'),lineEl=host.querySelector('.graph-student-line'),slope=host.querySelector('[data-slope]'),intercept=host.querySelector('[data-intercept]');
  if(slope)slope.value=String(state.m);if(intercept)intercept.value=String(state.b);
  let dragging=-1,moved=false;

  function syncAttempt(){
    if(type!=='lesson')return;
    let task=host.closest('.math1-varied-task'),textarea=task&&task.querySelector('textarea[data-autosave-key]');
    if(!textarea)return;
    let summary=state.mode==='slope'?`Interactive graph: ${equationLabel(state.m,state.b)}.`:`Interactive graph points: ${pointSummary(state.points)}.`;
    if(textarea.value!==summary){textarea.value=summary;textarea.dispatchEvent(new Event('input',{bubbles:true}))}
  }
  function draw(){
    host.querySelectorAll('[data-graph-mode]').forEach(b=>b.classList.toggle('active',b.dataset.graphMode===state.mode));
    let sliderBox=host.querySelector('.graph-sliders'),eq=host.querySelector('[data-equation-readout]');
    if(sliderBox)sliderBox.classList.toggle('graph-hidden',state.mode!=='slope');
    if(eq)eq.classList.toggle('graph-hidden',state.mode!=='slope');
    if(slope){slope.value=String(state.m);host.querySelector('[data-slope-output]').textContent=nfmt(state.m)}
    if(intercept){intercept.value=String(state.b);host.querySelector('[data-intercept-output]').textContent=nfmt(state.b)}
    if(eq)eq.textContent=equationLabel(state.m,state.b);
    let line=state.mode==='slope'?{m:state.m,b:state.b}:lineFromPoints(state.points),ends=line&&!line.vertical?clipLine(line.m,line.b):[];
    if(line&&line.vertical){let x=domainToSvg({x:line.x,y:0}).x;lineEl.setAttribute('x1',x);lineEl.setAttribute('x2',x);lineEl.setAttribute('y1',50);lineEl.setAttribute('y2',550);lineEl.classList.remove('graph-hidden')}
    else if(ends.length===2){let a=domainToSvg(ends[0]),b=domainToSvg(ends[1]);lineEl.setAttribute('x1',a.x);lineEl.setAttribute('y1',a.y);lineEl.setAttribute('x2',b.x);lineEl.setAttribute('y2',b.y);lineEl.classList.remove('graph-hidden')}
    else lineEl.classList.add('graph-hidden');
    pointLayer.innerHTML=state.points.map((p,i)=>{let s=domainToSvg(p);return `<circle class="graph-point-hit" data-point-index="${i}" cx="${s.x}" cy="${s.y}" r="18"/><circle class="graph-point" data-point-index="${i}" cx="${s.x}" cy="${s.y}" r="8"/><text class="graph-point-label" x="${s.x+12}" y="${s.y-12}">(${nfmt(p.x)},${nfmt(p.y)})</text>`}).join('');
    host.querySelector('[data-point-list]').textContent=state.mode==='points'?`Points: ${pointSummary(state.points)}`:'Move the sliders to change the line.';
    storeGraphState(key,state);syncAttempt();
  }
  function addPoint(event){
    if(state.mode!=='points'||event.target.closest('[data-point-index]'))return;
    let p=svgToDomain(svg,event);state.points=[...state.points,p].slice(-8);host.querySelector('[data-graph-feedback]').textContent='';draw();
  }
  svg.addEventListener('click',e=>{if(!moved)addPoint(e);moved=false});
  svg.addEventListener('pointerdown',e=>{let hit=e.target.closest('[data-point-index]');if(!hit||state.mode!=='points')return;dragging=Number(hit.dataset.pointIndex);moved=false;svg.setPointerCapture?.(e.pointerId);e.preventDefault()});
  svg.addEventListener('pointermove',e=>{if(dragging<0)return;let p=svgToDomain(svg,e);state.points[dragging]=p;moved=true;draw();e.preventDefault()});
  let stopDrag=()=>{dragging=-1};svg.addEventListener('pointerup',stopDrag);svg.addEventListener('pointercancel',stopDrag);
  host.addEventListener('click',e=>{
    let mode=e.target.closest('[data-graph-mode]');if(mode){state.mode=mode.dataset.graphMode;host.querySelector('[data-graph-feedback]').textContent='';draw();return}
    if(e.target.closest('[data-graph-undo]')){state.points=state.points.slice(0,-1);draw();return}
    if(e.target.closest('[data-graph-clear]')){state.points=[];state.m=1;state.b=0;host.querySelector('[data-graph-feedback]').textContent='';draw();return}
    if(e.target.closest('[data-graph-check]')&&target){
      let feedback=host.querySelector('[data-graph-feedback]'),ok=false;
      if(state.mode==='slope')ok=Math.abs(state.m-target.m)<1e-9&&Math.abs(state.b-target.b)<1e-9;
      else ok=state.points.length>=2&&state.points.slice(0,2).every(p=>pointOnLine(p,target))&&Math.abs(state.points[0].x-state.points[1].x)>1e-9;
      feedback.className='graph-feedback '+(ok?'good':'try-again');
      feedback.textContent=ok?'Correct graph. Your plotted line matches the equation.':state.mode==='slope'?'Not yet. Recheck both the slope and y-intercept.':'Not yet. Two distinct plotted points must both satisfy the equation.';
    }
  });
  if(slope)slope.addEventListener('input',()=>{state.m=Number(slope.value);draw()});
  if(intercept)intercept.addEventListener('input',()=>{state.b=Number(intercept.value);draw()});
  draw();
}

function initInteractiveMath(){
  if(S.subject!=='math')return;
  document.querySelectorAll('.coordinate-work:not([data-interactive-seen])').forEach(grid=>{
    grid.dataset.interactiveSeen='1';
    let task=grid.closest('.math1-varied-task'),worksheet=grid.closest('.worksheet-item');
    if(task){
      let idx=Number(saved[`math-${S.chapter}-guide-step`]||0),prompt=task.querySelector('.math-question')?.textContent||'',linear=task.dataset.kind==='graph'||!!parseLinearEquation(prompt);
      buildInteractiveGraph(grid,{type:'lesson',index:idx,prompt,linear});
    }else if(worksheet){
      let all=[...document.querySelectorAll('.worksheet-item')],idx=Math.max(0,all.indexOf(worksheet)),prompt=worksheet.querySelector('.math-question')?.textContent||worksheet.textContent||'',linear=!!parseLinearEquation(prompt);
      buildInteractiveGraph(grid,{type:'worksheet',index:idx,prompt,linear});
    }
  });
}
globalThis.__initInteractiveMath=initInteractiveMath;

if(typeof render==='function'&&!render.__interactiveMathWrapped){
  const baseRender=render;
  const wrapped=function(){let result=baseRender.apply(this,arguments);setTimeout(initInteractiveMath,0);return result};
  wrapped.__interactiveMathWrapped=true;
  render=wrapped;
}
setTimeout(initInteractiveMath,0);
})();
