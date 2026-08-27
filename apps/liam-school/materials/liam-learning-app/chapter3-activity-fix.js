(function(){
'use strict';
if(typeof WEEK2_GUIDES==='undefined')return;
for(const subject of ['biology','geography']){
  const guide=WEEK2_GUIDES[subject]?.[3];
  if(!guide?.steps)continue;
  guide.steps.forEach((st)=>{
    if(!st||st.sort||st.sequence||st.choices||st.questions||st.try||st.tryAnswer)return;
    const practice=String(st.apply||'').trim()||`Explain ${st.t||'this idea'} using one specific fact from the lesson.`;
    st.questions=[practice];
    st.apply='Now explain your reasoning in 1–2 sentences. Use at least one specific fact from the chapter to support your answer.';
  });
}
})();
