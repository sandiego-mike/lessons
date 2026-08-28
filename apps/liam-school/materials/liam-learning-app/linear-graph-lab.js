(function(){
'use strict';

function parseEquation(text){
  let s=String(text||'').replace(/−/g,'-').replace(/\s+/g,'').replace(/\^1/g,'');
  let m=s.match(/y=([+-]?(?:\d+(?:\.\d+)?|\.\d+)?)(?:\*)?x([+-]\d+(?:\.\d+)?)?/i);
  if(!m)return null;
  let raw=m[1],slope=raw===''||raw==='+'?1:raw==='-'?-1:Number(raw),intercept=m[2]?Number(m[2]):0;
  return Number.isFinite(slope)&&Number.isFinite(intercept)?{m:slope,b:intercept}:null;
}
function lineFromTwo(a,b){
  if(!a||!b)return null;
  let dx=b.x-a.x;
  if(Math.abs(dx)<1e-9)return {vertical:true,x:a.x};
  let m=(b.y-a.y)/dx;
  return {m,b:a.y-m*a.x};
}
function onLine(p,line,t=.13){
  if(!p||!line)return false;
  return line.vertical?Math.abs(p.x-line.x)<=t:Math.abs(p.y-(line.m*p.x+line.b))<=t;
}
globalThis.__linearGraphLabTools={parseEquation,lineFromTwo,onLine};
if(typeof document==='undefined'||typeof S==='undefined')return;

const STYLE=`
#linear-graph-lab{border:2px solid #a9c9df;background:#f8fcff}
#linear-graph-lab .lab-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
#linear-graph-lab .lab-head h2{margin:0 0 4px}#linear-graph-lab .lab-head p{margin:0;color:#5c7085}
#linear-graph-lab .lab-tools{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(240px,.75fr);gap:16px;margin-top:14px}
#linear-graph-lab .lab-grid{width:100%;aspect-ratio:1/1;border:1px solid #bccfe0;border-radius:14px;background:#fff;touch-action:none;user-select:none}
#linear-graph-lab .gline{stroke:#dbe6ef;stroke-width:1}#linear-graph-lab .axis{stroke:#17324f;stroke-width:2.5}
#linear-graph-lab .student-line{stroke:#167a64;stroke-width:4;stroke-linecap:round}.plot-dot{fill:#167a64;stroke:#fff;stroke-width:3}.plot-hit{fill:transparent}.plot-label{font-size:13px;fill:#17324f;font-weight:700;pointer-events:none}.tick{font-size:11px;fill:#65798d;pointer-events:none}
#linear-graph-lab .lab-panel{display:flex;flex-direction:column;gap:11px}.lab-panel label{font-weight:700}.lab-panel input[type=text]{width:100%;min-height:44px;border:1px solid #b9cbdc;border-radius:10px;padding:9px 11px;font-size:16px}
#linear-graph-lab .slider-box{border:1px solid #d3e0eb;border-radius:12px;padding:10px}.slider-box label{display:flex;justify-content:space-between}.slider-box input{width:100%}
#linear-graph-lab .mode-row,#linear-graph-lab .lab-actions{display:flex;gap:8px;flex-wrap:wrap}#linear-graph-lab button{min-height:42px}.mode-row button.active{background:#17324f;color:white}
#linear-graph-lab .eq-readout{text-align:center;font-size:1.15rem;font-weight:800;background:#eaf6f2;color:#135e50;padding:9px;border-radius:10px}.lab-status{min-height:24px;font-weight:700}.lab-status.good{color:#126a4f}.lab-status.bad{color:#9b4b24}
@media(max-width:760px){#linear-graph-lab .lab-tools{grid-template-columns:1fr}.mode-row button,.lab-actions button{flex:1 1 auto}}
`;
if(!document.getElementById('linear-graph-lab-style')){let st=document.createElement('style');st.id='linear-graph-lab-style';st.textContent=STYLE;document.head.appendChild(st)}

function fmt(n){let v=Math.round(Number(n)*100)/100;return Number.isInteger(v)?String(v):String(v)}
function eqLabel(m,b){let sx=Math.abs(m-1)<1e-9?'x':Math.abs(m+1)<1e-9?'-x':`${fmt(m)}x`;return `y = ${sx}${Math.abs(b)<1e-9?'':b>0?` + ${fmt(b)}`:` - ${fmt(Math.abs(b))}`}`}
function toSvg(p){return {x:300+p.x*50,y:300-p.y*50}}
function fromPointer(svg,e){let r=svg.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*600,py=(e.clientY-r.top)/r.height*600;return {x:Math.max(-5,Math.min(5,Math.round(((px-300)/50)*2)/2)),y:Math.max(-5,Math.min(5,Math.round(((300-py)/50)*2)/2))}}
function endpoints(m,b){let out=[],add=(x,y)=>{if(x>=-5&&x<=5&&y>=-5&&y<=5&&!out.some(p=>Math.abs(p.x-x)<1e-7&&Math.abs(p.y-y)<1e-7))out.push({x,y})};add(-5,m*-5+b);add(5,m*5+b);if(Math.abs(m)>1e-9){add((-5-b)/m,-5);add((5-b)/m,5)}return out.slice(0,2)}
function markupGrid(){let a=[];for(let n=-5;n<=5;n++){let p=300+n*50;a.push(`<line class="gline" x1="50" y1="${p}" x2="550" y2="${p}"/><line class="gline" x1="${p}" y1="50" x2="${p}" y2="550"/>`);if(n!==0)a.push(`<text class="tick" x="${p}" y="318" text-anchor="middle">${n}</text><text class="tick" x="287" y="${306-n*50}" text-anchor="end">${n}</text>`)}return a.join('')+'<line class="axis" x1="50" y1="300" x2="550" y2="300"/><line class="axis" x1="300" y1="50" x2="300" y2="550"/>'}
function detectEquation(){let text=document.querySelector('.math-question,.mental-equation')?.textContent||document.querySelector('#app')?.textContent||'';let m=String(text).match(/y\s*=\s*[+-]?(?:\d+(?:\.\d+)?|\.\d+)?x(?:\s*[+-]\s*\d+(?:\.\d+)?)?/i);return m?m[0].replace(/\s+/g,' '):'y = 2x - 4'}
function stateKey(){return `math-${S.chapter}-persistent-linear-graph-lab`}
function loadState(){let r=saved[stateKey()];return r&&typeof r==='object'?{mode:r.mode==='slider'?'slider':'points',points:Array.isArray(r.points)?r.points:[],m:Number(r.m)||1,b:Number(r.b)||0,equation:String(r.equation||detectEquation())}:{mode:'points',points:[],m:1,b:0,equation:detectEquation()}}
function persist(st){saved[stateKey()]={...st,updatedAt:new Date().toISOString()};if(typeof save==='function')save()}
function eligible(){return S.subject==='math'&&Number(S.chapter)===3&&S.view==='chapter'&&(!S.tab||S.tab==='learn')}

function mount(){
  if(!eligible())return;
  if(document.getElementById('linear-graph-lab'))return;
  let anchor=document.querySelector('.mental-drill,.guide-card,.math1-varied-task,.card');if(!anchor)return;
  let card=document.createElement('div');card.id='linear-graph-lab';card.className='card';card.innerHTML=`<div class="lab-head"><div><div class="eyebrow">Integrated Math I · Chapter 3</div><h2>Linear Graph Lab</h2><p>Tap the grid to place points, drag a point to move it, or build the line with slope and y-intercept sliders.</p></div></div><div class="lab-tools"><svg class="lab-grid" viewBox="0 0 600 600" role="application" aria-label="Interactive coordinate plane">${markupGrid()}<line class="student-line" data-line x1="0" y1="0" x2="0" y2="0" visibility="hidden"/><g data-points></g></svg><div class="lab-panel"><div><label for="linear-lab-equation">Equation to graph</label><input id="linear-lab-equation" type="text" inputmode="text" autocomplete="off"></div><div class="mode-row"><button type="button" data-mode="points">Plot points</button><button type="button" data-mode="slider">Slope & intercept</button></div><div class="slider-box" data-sliders><label><span>Slope (m)</span><output data-m-out></output></label><input type="range" min="-5" max="5" step="0.5" data-m><label><span>y-intercept (b)</span><output data-b-out></output></label><input type="range" min="-5" max="5" step="0.5" data-b></div><div class="eq-readout" data-eq></div><div data-point-summary></div><div class="lab-actions"><button type="button" class="secondary" data-undo>Undo point</button><button type="button" class="secondary" data-clear>Clear</button><button type="button" class="primary" data-check>Check graph</button></div><div class="lab-status" data-status></div></div></div>`;
  anchor.insertAdjacentElement('afterend',card);
  let st=loadState(),svg=card.querySelector('.lab-grid'),pts=card.querySelector('[data-points]'),line=card.querySelector('[data-line]'),eq=card.querySelector('#linear-lab-equation'),mIn=card.querySelector('[data-m]'),bIn=card.querySelector('[data-b]'),drag=-1,moved=false;
  eq.value=st.equation;mIn.value=st.m;bIn.value=st.b;
  function draw(){
    card.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===st.mode));card.querySelector('[data-sliders]').style.display=st.mode==='slider'?'block':'none';
    card.querySelector('[data-m-out]').textContent=fmt(st.m);card.querySelector('[data-b-out]').textContent=fmt(st.b);card.querySelector('[data-eq]').textContent=eqLabel(st.m,st.b);card.querySelector('[data-point-summary]').textContent=st.points.length?'Points: '+st.points.map(p=>`(${fmt(p.x)}, ${fmt(p.y)})`).join(', '):'No points plotted yet.';
    pts.innerHTML=st.points.map((p,i)=>{let s=toSvg(p);return `<circle class="plot-hit" data-i="${i}" cx="${s.x}" cy="${s.y}" r="20"/><circle class="plot-dot" data-i="${i}" cx="${s.x}" cy="${s.y}" r="8"/><text class="plot-label" x="${s.x+11}" y="${s.y-11}">(${fmt(p.x)},${fmt(p.y)})</text>`}).join('');
    let l=st.mode==='slider'?{m:st.m,b:st.b}:lineFromTwo(st.points[0],st.points[1]);if(l){if(l.vertical){let x=toSvg({x:l.x,y:0}).x;line.setAttribute('x1',x);line.setAttribute('x2',x);line.setAttribute('y1',50);line.setAttribute('y2',550);line.setAttribute('visibility','visible')}else{let ep=endpoints(l.m,l.b);if(ep.length===2){let a=toSvg(ep[0]),b=toSvg(ep[1]);line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);line.setAttribute('visibility','visible')}else line.setAttribute('visibility','hidden')}}else line.setAttribute('visibility','hidden');persist(st)
  }
  svg.addEventListener('pointerdown',e=>{let h=e.target.closest('[data-i]');if(!h||st.mode!=='points')return;drag=Number(h.dataset.i);moved=false;svg.setPointerCapture?.(e.pointerId);e.preventDefault()});
  svg.addEventListener('pointermove',e=>{if(drag<0)return;st.points[drag]=fromPointer(svg,e);moved=true;draw();e.preventDefault()});
  svg.addEventListener('pointerup',()=>drag=-1);svg.addEventListener('pointercancel',()=>drag=-1);
  svg.addEventListener('click',e=>{if(st.mode!=='points'){moved=false;return}if(moved){moved=false;return}if(e.target.closest('[data-i]'))return;st.points=[...st.points,fromPointer(svg,e)].slice(-8);card.querySelector('[data-status]').textContent='';draw()});
  card.addEventListener('click',e=>{let mode=e.target.closest('[data-mode]');if(mode){st.mode=mode.dataset.mode;draw();return}if(e.target.closest('[data-undo]')){st.points=st.points.slice(0,-1);draw();return}if(e.target.closest('[data-clear]')){st.points=[];card.querySelector('[data-status]').textContent='';draw();return}if(e.target.closest('[data-check]')){let target=parseEquation(eq.value),status=card.querySelector('[data-status]');if(!target){status.className='lab-status bad';status.textContent='Enter an equation in slope-intercept form, such as y = 2x - 4.';return}let ok=st.mode==='slider'?Math.abs(st.m-target.m)<1e-9&&Math.abs(st.b-target.b)<1e-9:st.points.length>=2&&st.points.slice(0,2).every(p=>onLine(p,target));status.className='lab-status '+(ok?'good':'bad');status.textContent=ok?'Correct — your graph matches the equation.':'Not yet — check the y-intercept first, then use rise/run to place the second point.';}});
  eq.addEventListener('input',()=>{st.equation=eq.value;let p=parseEquation(eq.value);if(p&&st.mode==='slider'){st.m=p.m;st.b=p.b;mIn.value=st.m;bIn.value=st.b}draw()});mIn.addEventListener('input',()=>{st.m=Number(mIn.value);draw()});bIn.addEventListener('input',()=>{st.b=Number(bIn.value);draw()});draw();
}
let timer=null;function schedule(){clearTimeout(timer);timer=setTimeout(mount,0)}
new MutationObserver(schedule).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
window.addEventListener('hashchange',schedule);setTimeout(mount,0);
})();
