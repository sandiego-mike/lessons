(function(){
'use strict';
if(typeof document==='undefined')return;
const prompt='Write both point-slope and slope-intercept forms for slope 2 through (-1,5).';
const correct='y-5=2(x+1); y=2x+7';
function fix(){
  if(typeof S==='undefined'||S.subject!=='math'||Number(S.chapter)!==4)return;
  document.querySelectorAll('.math1-varied-task').forEach(task=>{
    if(!String(task.textContent||'').includes(prompt))return;
    task.querySelectorAll('li,p').forEach(el=>{
      if(/^Expected result:/i.test(String(el.textContent||'').trim())) el.textContent='Expected result: '+correct;
    });
    const ta=task.querySelector('textarea');
    if(ta){
      const a=String(ta.value||'').replace(/\s+/g,'');
      if(a.includes('y-5=2(x+1)')&&a.includes('y=2x+7')){
        let msg=task.querySelector('.math-answer-correction');
        if(!msg){msg=document.createElement('div');msg.className='math-answer-correction';msg.textContent='Correct — this answer matches the actual problem through (-1,5).';ta.insertAdjacentElement('afterend',msg);}
      }
    }
  });
}
const st=document.createElement('style');st.textContent='.math-answer-correction{margin:8px 0;padding:9px 11px;border:1px solid #9bcfb6;border-radius:9px;background:#eef9f3;color:#165d43;font-weight:700}';document.head.appendChild(st);
new MutationObserver(fix).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('input',fix,true);fix();
})();