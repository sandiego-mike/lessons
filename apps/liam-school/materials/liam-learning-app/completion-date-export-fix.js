(()=>{
'use strict';
/* TLC sample requirement: completed work must show the actual calendar year and date completed.
   This patch preserves the existing generated PDF and replaces the old school-year-only header
   with a same-length date-completed header so the PDF object lengths remain valid. */
const isoToDisplay=v=>{
  if(!v)return '';
  const s=String(v).trim();
  const direct=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(direct)return `${direct[2]}/${direct[3]}/${direct[1]}`;
  const d=new Date(s);
  if(Number.isNaN(d.getTime()))return '';
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`;
};
function completionDateFor(ch){
  const prefix=`${S.subject}-${ch.number}`;
  const direct=[
    saved[`${prefix}-manualCompletedDate`],
    saved[`${prefix}-completedAt`],
    saved[`${prefix}-worksheet-updatedAt`]
  ].map(isoToDisplay).filter(Boolean);
  if(direct.length)return direct[0];
  const guideDates=Object.keys(saved)
    .filter(k=>k.startsWith(`${prefix}-guide-completedAt-`))
    .map(k=>saved[k]).filter(Boolean).sort();
  return guideDates.length?isoToDisplay(guideDates[guideDates.length-1]):'';
}
function validDisplayDate(v){
  const m=String(v||'').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m)return '';
  const mm=Number(m[1]),dd=Number(m[2]),yy=Number(m[3]);
  if(mm<1||mm>12||dd<1||dd>31||yy<2020||yy>2100)return '';
  return `${String(mm).padStart(2,'0')}/${String(dd).padStart(2,'0')}/${yy}`;
}
function toHex(s){return [...String(s)].map(ch=>ch.charCodeAt(0).toString(16).toUpperCase().padStart(2,'0')).join('')}
async function patchHeader(blob,ch,date){
  const student=currentStudent();
  const old=`Student: ${student.name}    Grade: ${student.grade}    School Year: 2026-2027`;
  let replacement=`Student: ${student.name} | Gr ${student.grade} | ${date.slice(-4)} | Done: ${date}`;
  if(replacement.length>old.length)replacement=`${student.name} | Gr ${student.grade} | ${date.slice(-4)} | Done ${date}`;
  replacement=replacement.slice(0,old.length).padEnd(old.length,' ');
  const bytes=new Uint8Array(await blob.arrayBuffer());
  const text=new TextDecoder('latin1').decode(bytes);
  const oldHex=toHex(old),newHex=toHex(replacement);
  if(!text.includes(oldHex))return blob;
  return new Blob([new TextEncoder().encode(text.replace(oldHex,newHex))],{type:'application/pdf'});
}
const originalExport=window.exportWorksheet;
window.exportWorksheet=async function(mode){
  if(mode!=='completed'||!isMathSubject())return originalExport(mode);
  const ch=chap();
  let date=completionDateFor(ch);
  if(!date){
    const entered=prompt(`Enter the date ${currentStudent().name.split(' ')[0]} completed this lesson (MM/DD/YYYY). This will be saved with Chapter ${ch.number}.`,'');
    date=validDisplayDate(entered);
    if(!date){alert('A valid completion date is required for the school work sample. Please enter MM/DD/YYYY.');return}
    saved[`${S.subject}-${ch.number}-manualCompletedDate`]=date;
    save();
  }
  const blob=await patchHeader(mathWorksheetPdfBlob(ch,mode),ch,date);
  const label=subjectExportLabel(S.subject),kind='Completed_Worksheet';
  download(blob,`${studentFileName()}_${label}_Chapter_${String(ch.number).padStart(2,'0')}_${kind}_${date.replaceAll('/','-')}.pdf`);
};
window.getMathWorkSampleCompletionDate=()=>completionDateFor(chap());
})();