(function(){
'use strict';
if(typeof document==='undefined'||typeof guideTry!=='function')return;

const baseGuideTry=guideTry;

// Replace the legacy inline oninput handler used by generated math Try It fields.
// The old HTML nested JSON double quotes inside a double-quoted attribute, which
// Safari only attempted to compile when the student typed in the field.
guideTry=function(ch,st,idx){
  if(st&&st.tryAnswer!==undefined&&st.tryAnswer!==null&&String(st.tryAnswer)!==''){
    const key=guideSaveKey(idx,'try');
    return `<div class="guided-math-try"><p>${formatMathNotation(esc(st.try||''))}</p><input type="text" data-guide-try-key="${esc(key)}" value="${esc(saved[key]||'')}" placeholder="Solve before checking" autocomplete="off"><button type="button" class="secondary no-print" data-guide-try-check data-guide-try-answer="${esc(String(st.tryAnswer))}">Check my attempt</button><div class="guided-try-feedback"></div></div>`;
  }
  return baseGuideTry(ch,st,idx);
};

document.addEventListener('input',function(event){
  const input=event.target?.closest?.('.guided-math-try [data-guide-try-key]');
  if(!input)return;
  const key=input.dataset.guideTryKey;
  if(!key)return;
  saved[key]=input.value;
  saved[S.subject+'-'+S.chapter+'-progress']=Math.max(saved[S.subject+'-'+S.chapter+'-progress']||0,.25);
  if(typeof save==='function')save();
},true);

document.addEventListener('click',function(event){
  const button=event.target?.closest?.('[data-guide-try-check]');
  if(!button)return;
  event.preventDefault();
  if(typeof checkGuidedMathTry==='function')checkGuidedMathTry(button,button.dataset.guideTryAnswer||'');
},true);

// Rebuild the currently visible math lesson once so any malformed legacy field
// already rendered during initial startup is replaced before the student types.
try{
  if((S.subject==='math'||S.subject==='math3')&&S.view==='chapter'&&typeof render==='function')render(false);
}catch(error){
  console.error('Math answer input fix:',error);
}
})();
