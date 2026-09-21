(function(){
'use strict';
if(typeof window==='undefined')return;

// The final Math guided block used to save successfully but leave Liam on the
// exact same screen, making the Complete button appear broken. Make completion
// visibly advance to the Worksheet, which is the next required chapter step.
if(typeof completeMathMentalBlock==='function'){
  completeMathMentalBlock=function(idx){
    let key=mentalKey(idx),state=saved[key]||{};
    if((state.correct||0)<4)return;
    let guide=guideFor(chap());
    saved[`${S.subject}-${S.chapter}-guide-done-${idx}`]=true;
    saved[`${S.subject}-${S.chapter}-guide-completedAt-${idx}`]=new Date().toISOString();
    saved[`${S.subject}-${S.chapter}-progress`]=Math.max(saved[`${S.subject}-${S.chapter}-progress`]||0,(idx+1)/guide.steps.length);
    if(idx<guide.steps.length-1){
      saved[`${S.subject}-${S.chapter}-guide-step`]=idx+1;
    }else{
      // Final guided block: advance into the next required phase.
      S.tab='worksheet';
    }
    save();
    navigate();
    window.scrollTo(0,0);
  };
}
})();