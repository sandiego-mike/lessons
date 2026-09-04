(function(){
'use strict';
const MAX_HEIGHT=520;
const MIN_HEIGHT=96;
function grow(area){
  if(!area||area.tagName!=='TEXTAREA')return;
  area.style.boxSizing='border-box';
  area.style.width='100%';
  area.style.minHeight=MIN_HEIGHT+'px';
  area.style.resize='vertical';
  area.style.overflowY='hidden';
  area.style.height='auto';
  const wanted=Math.max(MIN_HEIGHT,Math.min(MAX_HEIGHT,area.scrollHeight+2));
  area.style.height=wanted+'px';
  area.style.overflowY=area.scrollHeight>MAX_HEIGHT?'auto':'hidden';
}
function growAll(root){
  if(!root)return;
  if(root.matches&&root.matches('textarea'))grow(root);
  if(root.querySelectorAll)root.querySelectorAll('textarea').forEach(grow);
}
document.addEventListener('input',e=>{if(e.target&&e.target.matches('textarea'))grow(e.target)},true);
document.addEventListener('focusin',e=>{if(e.target&&e.target.matches('textarea'))requestAnimationFrame(()=>grow(e.target))},true);
window.addEventListener('resize',()=>growAll(document));
const observer=new MutationObserver(records=>{
  for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)growAll(node);
});
function start(){
  growAll(document);
  observer.observe(document.documentElement,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
globalThis.__responseAutogrow={grow,growAll,MIN_HEIGHT,MAX_HEIGHT};
})();
