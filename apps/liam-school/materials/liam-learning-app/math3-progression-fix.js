(function(){
'use strict';
if(typeof window==='undefined'||typeof S==='undefined')return;

// Integrated Math III progression repair.
// Leilani uses the shared completeGuideStep() path, not Liam's mental-block path.
// On the final guided block the original function saved completion but left the
// guide pointer on that final block. Advance visibly to Worksheet instead.
if(typeof completeGuideStep==='function'){
  const baseCompleteGuideStep=completeGuideStep;
  completeGuideStep=function(){
    if(S.subject!=='math3')return baseCompleteGuideStep();
    const ch=chap(),guide=guideFor(ch);
    const key=`${S.subject}-${S.chapter}-guide-step`;
    const idx=Math.max(0,Math.min(guide.steps.length-1,Number(saved[key]||0)));
    const wasFinal=idx===guide.steps.length-1;
    baseCompleteGuideStep();
    if(wasFinal&&saved[`${S.subject}-${ch.number}-guide-done-${idx}`]){
      saved[key]=idx;
      S.tab='worksheet';
      save();
      navigate();
      window.scrollTo(0,0);
    }
  };
}

// Completing a Math III unit should visibly continue into the next unit.
// Preserve the normal completion requirements and saved evidence.
if(typeof markChapter==='function'){
  const baseMarkChapter=markChapter;
  markChapter=function(){
    if(S.subject!=='math3')return baseMarkChapter();
    const ch=chap(),status=chapterCompletionStatus(ch);
    if(!status.ready){
      alert('Finish the guided lesson, worksheet, and knowledge check before marking this chapter complete.');
      return;
    }
    const chapters=course().chapters||[];
    const idx=chapters.findIndex(x=>Number(x.number)===Number(ch.number));
    const next=idx>=0?chapters[idx+1]:null;
    saved[`math3-${ch.number}-done`]=true;
    saved[`math3-${ch.number}-mastery`]=100;
    saved[`math3-${ch.number}-completedAt`]=saved[`math3-${ch.number}-completedAt`]||new Date().toISOString();
    if(next){
      saved['math3-current']=next.number;
      S.chapter=next.number;
      S.tab='learn';
      S.view='chapter';
    }else{
      saved['math3-current']=ch.number;
      S.view='course';
    }
    save();
    navigate();
    window.scrollTo(0,0);
  };
}

// Audit all Math III units for the pieces required by the progression gate.
window.auditMath3Progression=function(){
  const prev={subject:S.subject,chapter:S.chapter,student:S.student};
  const rows=[];
  try{
    S.subject='math3';S.student='leilani';
    for(const ch of S.data?.math3?.chapters||[]){
      S.chapter=ch.number;
      const guide=guideFor(ch),worksheet=worksheetItems(ch),check=knowledgeItems(ch);
      rows.push({chapter:ch.number,title:ch.title,guideBlocks:guide?.steps?.length||0,worksheet:worksheet.length,knowledgeCheck:check.length,
        canProgress:!!(guide?.steps?.length&&worksheet.length>=8&&check.length>=5)});
    }
  }finally{S.subject=prev.subject;S.chapter=prev.chapter;S.student=prev.student}
  return {rows,passed:rows.length===9&&rows.every(r=>r.canProgress)};
};
})();