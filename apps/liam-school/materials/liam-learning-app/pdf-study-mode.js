(function(){
'use strict';
if(typeof S==='undefined'||typeof save!=='function'||typeof chap!=='function'||typeof worksheetItems!=='function'||typeof knowledgeItems!=='function')return;
const SUBJECTS=new Set(['biology','geography']);
const RAW_BASE='https://raw.githubusercontent.com/sandiego-mike/lessons/main/apps/liam-school/materials/';
const BAD=/what you need to know|as you read chapter|list factors|left column|right column|make the following foldable|section preview|reading essentials|study guide|review vocabulary|national geographic|figure\s*\d|page\s*\d+/i;
function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function key(v){return clean(v).toLowerCase().replace(/[“”‘’]/g,"'").replace(/[^a-z0-9]+/g,' ').trim()}
function escHtml(v){return String(v||'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function pdfUrl(subject,n){
  if(subject==='biology'){
    const file=n<=9?`Chapter_${n}.pdf`:`Chapter ${n} PDF.pdf`;
    return RAW_BASE+'biology/'+encodeURIComponent(file).replace(/%2F/g,'/');
  }
  return RAW_BASE+'world-geography/'+`chapter-${String(n).padStart(2,'0')}.pdf`;
}
function addQuestion(out,seen,prompt,kind,sourceIndex,answer){
  prompt=clean(typeof cleanStudentText==='function'?cleanStudentText(prompt):prompt);
  if(prompt.length<10||prompt.length>700||BAD.test(prompt))return;
  const k=key(prompt);if(!k||seen.has(k))return;seen.add(k);
  out.push({id:`q${out.length}`,prompt,kind,sourceIndex,answer:clean(answer)});
}
function collectQuestions(ch){
  // PDF Study Mode is intentionally source-first. Do not dump the regular app's
  // generated guided questions into this path; that was creating 40+ repetitive items.
  const out=[],seen=new Set();
  (ch.worksheet||[]).forEach((q,i)=>addQuestion(out,seen,q.prompt||q.question,'Chapter question',`source-${i}`,q.answer));
  try{
    if(typeof textbookSectionQuestions==='function'){
      (textbookSectionQuestions(ch,99)||[]).forEach((q,i)=>addQuestion(out,seen,q.prompt||q.question,'Section review',`textbook-${i}`,q.answer));
    }
  }catch(_){}
  // Some imported chapters have a thin source-question field. In that case add only
  // enough aligned app questions to make the chapter usable, while still avoiding duplication.
  if(out.length<6){
    (worksheetItems(ch)||[]).forEach((q,i)=>addQuestion(out,seen,q.prompt||q.question,'Practice',`worksheet-${i}`,q.answer));
  }
  if(out.length<8){
    (knowledgeItems(ch)||[]).forEach((q,i)=>addQuestion(out,seen,q.prompt||q.question,'Knowledge check',`check-${i}`,q.answer));
  }
  return out;
}
function stateKey(subject,n){return `${subject}-${n}-pdf-study`}
function answersFor(subject,n){return saved[stateKey(subject,n)]||{}}
function syncMappedAnswer(subject,n,q,value){
  if(q.sourceIndex.startsWith('worksheet-')){
    const i=Number(q.sourceIndex.split('-')[1]),k=`${subject}-${n}-worksheet`;saved[k]=saved[k]||{};saved[k][i]=value;saved[k+'-updatedAt']=new Date().toISOString();
  }
  if(q.sourceIndex.startsWith('check-')){
    const i=Number(q.sourceIndex.split('-')[1]),k=`${subject}-${n}-check`;saved[k]=saved[k]||{};saved[k][i]=value;saved[k+'-updatedAt']=new Date().toISOString();
  }
}
function completion(subject,ch,questions,vals){
  const answered=questions.filter(q=>clean(vals[q.id])).length;
  return {answered,total:questions.length,done:questions.length>0&&answered===questions.length};
}
function syncCompletion(subject,ch,questions,vals){
  const c=completion(subject,ch,questions,vals);if(!c.done)return c;
  const guide=guideFor(ch);(guide?.steps||[]).forEach((_,i)=>{saved[`${subject}-${ch.number}-guide-done-${i}`]=true;saved[`${subject}-${ch.number}-guide-completedAt-${i}`]=saved[`${subject}-${ch.number}-guide-completedAt-${i}`]||new Date().toISOString()});
  saved[`${subject}-${ch.number}-done`]=true;saved[`${subject}-${ch.number}-mastery`]=100;saved[`${subject}-${ch.number}-completedAt`]=saved[`${subject}-${ch.number}-completedAt`]||new Date().toISOString();
  const courseData=S.data?.[subject],idx=courseData?.chapters?.findIndex(x=>x.number===ch.number),next=idx>=0?courseData.chapters[idx+1]:null;if(next)saved[subject+'-current']=Math.max(Number(saved[subject+'-current']||ch.number),next.number);
  save();return c;
}
function renderQuestions(subject,ch,questions){
  const vals=answersFor(subject,ch.number),c=completion(subject,ch,questions,vals),pct=c.total?Math.round(c.answered/c.total*100):0;
  return `<div class="pdfstudy-progress"><strong>${c.answered}/${c.total} questions saved</strong><span>${pct}%</span><div><i style="width:${pct}%"></i></div></div>`+questions.map((q,i)=>`<section class="pdfstudy-q"><div class="pdfstudy-label">${i+1}. ${escHtml(q.kind)}</div><p>${escHtml(q.prompt)}</p><textarea data-pdfstudy-id="${q.id}" placeholder="Type Liam's answer here. It saves automatically.">${escHtml(vals[q.id]||'')}</textarea></section>`).join('');
}
function exportPdfStudy(subject,ch,questions){
  const vals=answersFor(subject,ch.number),student=typeof currentStudent==='function'?currentStudent():{name:'Liam DeVries',grade:9};
  const blocks=[{type:'p',text:`Student: ${student.name}`},{type:'p',text:`Grade: ${student.grade}`},{type:'p',text:`Course: ${subjectLabel(subject)}`},{type:'p',text:`Chapter ${ch.number}: ${ch.title}`},{type:'p',text:'Completed in PDF Study Mode using the supplied chapter PDF.'}];
  questions.forEach((q,i)=>{blocks.push({type:'h2',text:`${i+1}. ${q.prompt}`});blocks.push({type:'p',text:clean(vals[q.id])||'(No response saved)'})});
  if(typeof academicPdfBlob==='function'&&typeof download==='function'){
    const blob=academicPdfBlob({subject:subjectLabel(subject),chapter:ch.number,chapterTitle:ch.title,docTitle:'PDF Study Mode - Completed Chapter Questions',dateLabel:'Exported',blocks});
    download(blob,`${student.name.replace(/[^A-Za-z0-9]+/g,'_')}_${subjectLabel(subject).replace(/[^A-Za-z0-9]+/g,'_')}_Chapter_${String(ch.number).padStart(2,'0')}_PDF_Study.pdf`);
  }else window.print();
}
function closeMode(){document.getElementById('pdfstudy-overlay')?.remove()}
function setMobilePane(which){const overlay=document.getElementById('pdfstudy-overlay');if(!overlay)return;overlay.dataset.pane=which;overlay.querySelectorAll('[data-pane]').forEach(b=>b.classList.toggle('active',b.dataset.pane===which));}
function openMode(){
  if(!SUBJECTS.has(S.subject))return;const ch=chap(),questions=collectQuestions(ch),subject=S.subject,url=pdfUrl(subject,ch.number),vals=answersFor(subject,ch.number);syncCompletion(subject,ch,questions,vals);
  closeMode();document.body.insertAdjacentHTML('beforeend',`<div id="pdfstudy-overlay" class="pdfstudy-overlay" data-pane="questions"><div class="pdfstudy-shell"><header><div><span>Alternate learning path</span><h2>${escHtml(subjectLabel(subject))} · Chapter ${ch.number}: ${escHtml(ch.title)}</h2><p>Use the actual supplied chapter PDF and answer the source-aligned chapter questions. Responses save automatically and feed the same course progress.</p></div><div class="pdfstudy-actions"><a href="${url}" target="_blank" rel="noopener">Open chapter PDF</a><button id="pdfstudy-export">Export completed PDF</button><button id="pdfstudy-close">Close</button></div><div class="pdfstudy-mobile-switch"><button data-pane="pdf">📖 PDF</button><button data-pane="questions" class="active">✍️ Questions</button></div></header><main><div class="pdfstudy-reader"><iframe src="${url}#view=FitH" title="Chapter ${ch.number} PDF"></iframe><div class="pdfstudy-mobile-reader-fallback"><p>iPhone Safari does not reliably display large PDFs inside an embedded frame.</p><a href="${url}" target="_blank" rel="noopener">Open Chapter ${ch.number} PDF</a><small>Return to this tab to keep answering; your responses stay saved.</small></div></div><aside id="pdfstudy-questions">${renderQuestions(subject,ch,questions)}</aside></main></div></div>`);
  const overlay=document.getElementById('pdfstudy-overlay'),host=document.getElementById('pdfstudy-questions');
  document.getElementById('pdfstudy-close').onclick=closeMode;document.getElementById('pdfstudy-export').onclick=()=>exportPdfStudy(subject,ch,questions);
  overlay.querySelectorAll('[data-pane]').forEach(b=>b.onclick=()=>setMobilePane(b.dataset.pane));
  overlay.addEventListener('input',e=>{const t=e.target;if(!t.matches('textarea[data-pdfstudy-id]'))return;const q=questions.find(x=>x.id===t.dataset.pdfstudyId);if(!q)return;const k=stateKey(subject,ch.number);saved[k]=saved[k]||{};saved[k][q.id]=t.value;saved[k+'-updatedAt']=new Date().toISOString();syncMappedAnswer(subject,ch.number,q,t.value);save();const c=syncCompletion(subject,ch,questions,saved[k]);const pct=c.total?Math.round(c.answered/c.total*100):0;const prog=host.querySelector('.pdfstudy-progress');if(prog)prog.innerHTML=`<strong>${c.answered}/${c.total} questions saved</strong><span>${pct}%</span><div><i style="width:${pct}%"></i></div>`;});
}
function injectButton(){
  if(!SUBJECTS.has(S.subject)||S.view!=='chapter'||document.getElementById('pdfstudy-open'))return;
  const tabs=document.querySelector('.tabs');if(!tabs)return;const b=document.createElement('button');b.id='pdfstudy-open';b.className='tab pdfstudy-tab';b.textContent='📖 PDF Study Mode';b.onclick=openMode;tabs.appendChild(b);
}
const style=document.createElement('style');style.textContent=`.pdfstudy-tab{background:#eef8f4!important;border:1px solid #8bc9b7!important}.pdfstudy-overlay{position:fixed;inset:0;background:rgba(13,24,38,.72);z-index:99999;padding:18px}.pdfstudy-shell{height:100%;background:white;border-radius:16px;overflow:hidden;display:flex;flex-direction:column}.pdfstudy-shell>header{display:flex;gap:20px;justify-content:space-between;padding:16px 18px;border-bottom:1px solid #dde3e8;flex-wrap:wrap}.pdfstudy-shell>header h2{margin:3px 0}.pdfstudy-shell>header p{margin:4px 0;max-width:850px}.pdfstudy-shell>header span,.pdfstudy-label{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#476}.pdfstudy-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.pdfstudy-actions a,.pdfstudy-actions button,.pdfstudy-mobile-switch button,.pdfstudy-mobile-reader-fallback a{padding:9px 12px;border:1px solid #ccd5da;border-radius:8px;background:white;color:#123;text-decoration:none;font:inherit;cursor:pointer}.pdfstudy-shell>main{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(340px,.75fr);min-height:0;flex:1}.pdfstudy-reader{min-height:0;background:#e7ebee;position:relative}.pdfstudy-reader iframe{width:100%;height:100%;border:0}.pdfstudy-mobile-reader-fallback,.pdfstudy-mobile-switch{display:none}.pdfstudy-shell aside{overflow:auto;padding:16px;background:#f7faf9}.pdfstudy-progress{position:sticky;top:0;z-index:2;background:#fff;padding:12px;border:1px solid #dce5e1;border-radius:10px;margin-bottom:12px;display:grid;grid-template-columns:1fr auto;gap:7px}.pdfstudy-progress>div{grid-column:1/-1;height:7px;background:#e7eeeb;border-radius:7px;overflow:hidden}.pdfstudy-progress i{display:block;height:100%;background:#3f8d76}.pdfstudy-q{background:#fff;border:1px solid #dce5e1;border-radius:10px;padding:12px;margin-bottom:12px}.pdfstudy-q p{font-size:16px;line-height:1.45}.pdfstudy-q textarea{width:100%;min-height:105px;box-sizing:border-box;padding:10px;border:1px solid #bfcac5;border-radius:8px;font:inherit;line-height:1.45}@media(max-width:850px){.pdfstudy-overlay{padding:0}.pdfstudy-shell{border-radius:0}.pdfstudy-shell>header{display:block;padding:14px}.pdfstudy-shell>header h2{font-size:24px;line-height:1.15}.pdfstudy-shell>header p{font-size:15px}.pdfstudy-actions{margin-top:10px}.pdfstudy-actions a{display:none}.pdfstudy-mobile-switch{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.pdfstudy-mobile-switch button.active{background:#dff2eb;border-color:#5aa88d;font-weight:700}.pdfstudy-shell>main{display:block;overflow:hidden;position:relative}.pdfstudy-reader,.pdfstudy-shell aside{position:absolute;inset:0;overflow:auto}.pdfstudy-reader iframe{display:none}.pdfstudy-mobile-reader-fallback{display:flex;min-height:100%;box-sizing:border-box;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:28px;gap:12px;background:#f1f4f5}.pdfstudy-mobile-reader-fallback a{background:#123;color:#fff;border-color:#123;font-weight:700}.pdfstudy-mobile-reader-fallback small{max-width:280px;line-height:1.4}.pdfstudy-overlay[data-pane="questions"] .pdfstudy-reader{display:none}.pdfstudy-overlay[data-pane="pdf"] aside{display:none}.pdfstudy-shell aside{padding:12px}.pdfstudy-progress{top:0}.pdfstudy-q textarea{min-height:130px}}`;
document.head.appendChild(style);
const baseRender=render;render=function(){baseRender();injectButton()};
window.openPdfStudyMode=openMode;window.pdfStudyAudit=function(){const rows=[];for(const subject of SUBJECTS){const oldSubject=S.subject,oldChapter=S.chapter;S.subject=subject;for(const ch of S.data?.[subject]?.chapters||[])rows.push({subject,chapter:ch.number,url:pdfUrl(subject,ch.number),questions:collectQuestions(ch).length});S.subject=oldSubject;S.chapter=oldChapter}return {rows,passed:rows.length>0&&rows.every(r=>r.questions>=4&&r.questions<=30&&/\.pdf$/.test(decodeURIComponent(r.url)))}};
try{injectButton()}catch(e){console.error('PDF Study Mode:',e)}
})();
