(function(){
'use strict';
if(typeof document==='undefined')return;
const TARGET='Sides 5 and 9 include a 45-degree angle. Find the opposite side.';
const CORRECT='About 6.51';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();

if(typeof guideFor==='function'){
  const baseGuideFor=guideFor;
  guideFor=function(ch){
    const g=baseGuideFor(ch);
    try{
      if(typeof S!=='undefined'&&S.subject==='math3'&&Number(ch?.number||S.chapter)===8&&Array.isArray(g?.steps)){
        for(const st of g.steps){
          if(clean(st?.try)===TARGET){
            st.tryAnswer=CORRECT;
            st.apply='Use the Law of Cosines because two sides and their included angle are given. Show the substitution and explain why this formula fits.';
          }
        }
      }
    }catch(_){ }
    return g;
  };
}

function patchLawCosinesPanel(root=document){
  root.querySelectorAll?.('.genuine-math-panel').forEach(panel=>{
    const problem=clean(panel.querySelector('.gm-problem')?.textContent);
    if(problem!==TARGET||panel.dataset.lawCosinesPatched==='1')return;
    panel.dataset.lawCosinesPatched='1';
    const h=panel.querySelector('h4');
    if(h)h.textContent='Law of Cosines';
    const rule=panel.querySelector('.gm-rule > div');
    if(rule)rule.textContent='c² = a² + b² − 2ab cos(C). Use this when two sides and the included angle are known and you need the opposite side.';
    const steps=panel.querySelector('.gm-steps ol');
    if(steps)steps.innerHTML='<li>Let a=5, b=9, and C=45°.</li><li>Substitute: c² = 5² + 9² − 2(5)(9)cos(45°).</li><li>Compute: c² = 106 − 90(√2/2) = 106 − 45√2 ≈ 42.3604.</li><li>Take the positive square root: c ≈ √42.3604 ≈ 6.5085.</li><li>Round as requested: c ≈ 6.51.</li>';
    const check=panel.querySelector('.gm-check > div');
    if(check)check.textContent='Check reasonableness: with sides 5 and 9 and a 45° included angle, the third side must be between 4 and 14. A result near 6.51 is reasonable.';
  });
}

const observer=new MutationObserver(muts=>{
  for(const m of muts){
    for(const n of m.addedNodes){
      if(n.nodeType===1)patchLawCosinesPanel(n);
    }
  }
});
function start(){patchLawCosinesPanel();observer.observe(document.documentElement,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.__MATH3_LAW_COSINES_FIX__={target:TARGET,answer:CORRECT};
})();
