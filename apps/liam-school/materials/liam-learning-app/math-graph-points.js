(function(){
'use strict';
if(typeof document==='undefined'||typeof S==='undefined')return;

const GRAPH_CHAPTERS={
  math:new Set([3,4,5,6,8,10,11]),
  math3:new Set([1,2,3,4,5,6,9])
};
const LINE_CHAPTERS={math:new Set([3,4,5,10]),math3:new Set([])};

function eligible(){
  return (S.subject==='math'||S.subject==='math3') &&
    GRAPH_CHAPTERS[S.subject]?.has(Number(S.chapter)) &&
    S.view==='chapter' && (!S.tab||S.tab==='learn');
}
function fmt(n){let v=Math.round(Number(n)*100)/100;return Number.isInteger(v)?String(v):String(v)}
function key(){return `${S.subject}-${S.chapter}-graph-points-v44`}
function load(){let r=saved[key()];return r&&Array.isArray(r.points)?r:{points:[]}}
function saveState(st){saved[key()]={...st,updatedAt:new Date().toISOString()};if(typeof save==='function')save()}
function toSvg(p){return{x:300+p.x*50,y:300-p.y*50}}
function fromPointer(svg,e){
  let r=svg.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*600,py=(e.clientY-r.top)/r.height*600;
  return {x:Math.max(-5,Math.min(5,Math.round(((px-300)/50)*2)/2)),y:Math.max(-5,Math.min(5,Math.round(((300-py)/50)*2)/2))};
}
function lineEndpoints(a,b){
  let dx=b.x-a.x,dy=b.y-a.y;if(Math.abs(dx)<1e-9)return [{x:a.x,y:-5},{x:a.x,y:5}];
  let m=dy/dx,c=a.y-m*a.x,out=[];
  const add=(x,y)=>{if(x>=-5&&x<=5&&y>=-5&&y<=5&&!out.some(p=>Math.abs(p.x-x)<1e-6&&Math.abs(p.y-y)<1e-6))out.push({x,y})};
  add(-5,m*-5+c);add(5,m*5+c);if(Math.abs(m)>1e-9){add((-5-c)/m,-5);add((5-c)/m,5)}return out.slice(0,2);
}
function mount(){
  if(!eligible())return;
  const lab=document.getElementById('math-course-lab-v2'),svg=lab?.querySelector('svg.plot');
  if(!svg||svg.dataset.pointPlotting)return;
  svg.dataset.pointPlotting='1';
  const ns='http://www.w3.org/2000/svg';
  const line=document.createElementNS(ns,'line');line.setAttribute('data-student-line','');line.setAttribute('stroke','#d17b1f');line.setAttribute('stroke-width','3');line.setAttribute('stroke-dasharray','9 7');line.style.pointerEvents='none';svg.appendChild(line);
  const layer=document.createElementNS(ns,'g');layer.setAttribute('data-student-points','');svg.appendChild(layer);
  const panel=lab.querySelector('.panel')||lab;
  const box=document.createElement('div');box.className='readout';box.innerHTML='<strong>Plot points</strong><br>Tap the graph to place a point. Drag any orange point to move it. Points snap to 0.5 units and save automatically.<div class="row" style="margin-top:8px"><button class="secondary" type="button" data-undo-point>Undo point</button><button class="secondary" type="button" data-clear-points>Clear points</button></div><div data-point-list style="margin-top:6px"></div>';
  panel.appendChild(box);
  let st=load(),drag=-1;
  function render(){
    while(layer.firstChild)layer.removeChild(layer.firstChild);
    st.points.forEach((p,i)=>{
      let s=toSvg(p),g=document.createElementNS(ns,'g');g.dataset.pointIndex=String(i);g.style.cursor='grab';
      let hit=document.createElementNS(ns,'circle');hit.setAttribute('cx',s.x);hit.setAttribute('cy',s.y);hit.setAttribute('r','20');hit.setAttribute('fill','transparent');hit.dataset.pointIndex=String(i);
      let dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',s.x);dot.setAttribute('cy',s.y);dot.setAttribute('r','9');dot.setAttribute('fill','#d17b1f');dot.setAttribute('stroke','white');dot.setAttribute('stroke-width','3');dot.dataset.pointIndex=String(i);
      let label=document.createElementNS(ns,'text');label.setAttribute('x',s.x+12);label.setAttribute('y',s.y-12);label.setAttribute('font-size','14');label.setAttribute('font-weight','700');label.setAttribute('fill','#7b4514');label.style.pointerEvents='none';label.textContent=`(${fmt(p.x)}, ${fmt(p.y)})`;
      g.append(hit,dot,label);layer.appendChild(g);
    });
    const showLine=LINE_CHAPTERS[S.subject]?.has(Number(S.chapter))&&st.points.length>=2;
    if(showLine){let ep=lineEndpoints(st.points[0],st.points[1]);if(ep.length===2){let a=toSvg(ep[0]),b=toSvg(ep[1]);line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);line.style.display='';}else line.style.display='none';}else line.style.display='none';
    let list=box.querySelector('[data-point-list]');list.textContent=st.points.length?st.points.map((p,i)=>`P${i+1}=(${fmt(p.x)}, ${fmt(p.y)})`).join(' · '):'No points placed yet.';
    saveState(st);
  }
  svg.addEventListener('pointerdown',e=>{
    const idx=e.target?.dataset?.pointIndex;
    if(idx!==undefined){drag=Number(idx);try{svg.setPointerCapture(e.pointerId)}catch(_){}e.preventDefault();return;}
    st.points.push(fromPointer(svg,e));if(st.points.length>8)st.points.shift();render();e.preventDefault();
  });
  svg.addEventListener('pointermove',e=>{
    if(drag<0||!st.points[drag])return;st.points[drag]=fromPointer(svg,e);render();e.preventDefault();
  });
  const end=e=>{if(drag>=0){drag=-1;try{svg.releasePointerCapture(e.pointerId)}catch(_){}e.preventDefault();}};
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
  box.querySelector('[data-undo-point]').onclick=()=>{st.points.pop();render()};
  box.querySelector('[data-clear-points]').onclick=()=>{st.points=[];render()};
  render();
}
function schedule(){setTimeout(()=>{try{mount()}catch(e){console.error('Math graph points:',e)}},0)}
const root=document.getElementById('app')||document.body;
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
window.addEventListener('hashchange',schedule);schedule();
})();
