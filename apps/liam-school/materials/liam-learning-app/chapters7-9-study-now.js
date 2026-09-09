(function(){
'use strict';
if(typeof S==='undefined'||typeof save!=='function')return;
const ACTIVE=new Set([7,8,9]);
const BASE='source-extracts/';
const MAPS={
 biology:{
  7:[{to:5,n:'7.1 The Discovery of Cells'},{to:9,n:'7.2 The Plasma Membrane'},{to:18,n:'7.3 Eukaryotic Cell Structure'},{to:22,n:'Chapter 7 Activities',optional:true},{to:24,n:'Chapter 7 Assessment'}],
  8:[{to:7,n:'8.1 Cellular Transport'},{to:17,n:'8.2 Cell Growth and Reproduction'},{to:20,n:'8.3 Control of the Cell Cycle'},{to:22,n:'Chapter 8 Activities',optional:true},{to:26,n:'Chapter 8 Assessment'}],
  9:[{to:5,n:'9.1 The Need for Energy'},{to:11,n:'9.2 Photosynthesis'},{to:18,n:'9.3 Cellular Respiration'},{to:22,n:'Chapter 9 Activities',optional:true},{to:30,n:'Chapter 9 Assessment'}]
 },
 geography:{
  7:[{to:9,n:'7.1 Economic Activities'},{to:14,n:'7.2 Environmental Issues'},{to:18,n:'Chapter 7 Maps and Applications',optional:true},{to:20,n:'Chapter 7 Assessment'}],
  8:[{to:23,n:'8.1 Landforms and Resources'},{to:28,n:'8.2 Climate and Vegetation'},{to:30,n:'Chapter 8 Review'},{to:34,n:'Chapter 8 Maps and Applications',optional:true}],
  9:[{to:8,n:'9.1 Population Patterns'},{to:16,n:'9.2 History and Government'},{to:22,n:'9.3 Cultures and Lifestyles'},{to:24,n:'Chapter 9 Maps and Applications',optional:true},{to:26,n:'Chapter 9 Assessment'}]
 }
};
function clean(v){return String(v||'').replace(/\s+/g,' ').replace(/\s+([?.!,;:])/g,'$1').trim()}
function esc(v){return String(v||'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function sectionFor(subject,ch,page){const a=MAPS[subject]?.[ch]||[];return a.find(x=>page<=x.to)||a[a.length-1]||{n:`Chapter ${ch}`}}
function goodStart(q){return /^(?:\d+\.\s*)?(?:what|why|how|where|which|who|when|describe|explain|compare|contrast|identify|infer|predict|evaluate|analyze|interpret|summarize|list|make|create|trace|discuss|distinguish|recognize|calculate|determine|draw|write|use|study|examine|classify|relate|apply|find|suppose|if|are|is|does|do|can|would|should|place|region|movement|human-environment interaction|critical thinking|open ended|think critically|main ideas|reviewing facts|define)\b/i.test(q)}
function junk(q){return /^(?:to question|the lowest|in texas|in the united states|not, what|do they differ|what's your point of view)\??$/i.test(q)||/^(?:mated|estimated|graphy|centage|ning|tion|somes|bohydrates|tant|nection|chlorophyll compare|from which|out the trash|like, what|these fibers|ing place)\b/i.test(q)}
function splitCandidate(raw){
 let q=clean(raw);if(!q)return[];
 q=q.replace(/Thinking Critically\s*/ig,' ').replace(/Critical Thinking\s*/ig,' ').replace(/SKILL REVIEW.*/ig,'');
 const parts=q.split(/(?=\b\d+\.\s+(?=[A-Z]))/g).map(clean).filter(Boolean);
 return parts.flatMap(p=>{
   // If extraction fused two explicit numbered questions, the split above separates them.
   // Keep a meaningful imperative even when the printed item did not end with a question mark.
   const x=p.replace(/^\d+\.\s*/,'').trim();
   if(x.length<12||x.length>650||junk(x))return[];
   if(!x.includes('?')&&!goodStart(x))return[];
   if(!goodStart(x)&&/^[a-z]/.test(x))return[];
   return [x];
 });
}
function optionalByText(q,sec){return !!sec.optional||/\b(?:lab|experiment|use the internet|geo.?journal|group research|multimedia|your community|your hair|prepared slide|potato|yeast cells|survey take place)\b/i.test(q)}
function dedupe(items){const seen=new Set(),out=[];for(const x of items){const k=clean(x.q).toLowerCase().replace(/[^a-z0-9]+/g,' ');if(k.length<10||seen.has(k))continue;seen.add(k);out.push(x)}return out}
async function loadBank(subject,ch){
 const url=`${BASE}${subject}-chapter-${String(ch).padStart(2,'0')}-candidates.json?v=1`;
 const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`Source question bank not found (${r.status})`);const data=await r.json();
 const rows=[];
 for(const c of data.candidates||[]){for(const q of splitCandidate(c.question)){const sec=sectionFor(subject,ch,Number(c.page)||1);rows.push({id:`src-${hash(`${subject}|${ch}|${c.page}|${q}`)}`,section:sec.n,page:Number(c.page)||1,q,required:!optionalByText(q,sec)})}}
 return {pages:data.pages||0,items:dedupe(rows)};
}
function sk(subject,ch){return `${subject}-${ch}-pdf-source-study`}
function vals(subject,ch){return saved[sk(subject,ch)]||{}}
function stats(subject,ch,items){const v=vals(subject,ch),required=items.filter(x=>x.required),answered=required.filter(x=>clean(v[x.id])).length;return {answered,total:required.length,done:required.length>0&&answered===required.length}}
function progress(subject,ch,items){const s=stats(subject,ch,items),pct=s.total?Math.round(s.answered/s.total*100):0;return `<div class="pdfstudy-progress"><strong>${s.answered}/${s.total} required questions saved</strong><span>${pct}%</span><div><i style="width:${pct}%"></i></div></div>`}
function render(subject,ch,items){const v=vals(subject,ch);let last='';return progress(subject,ch,items)+items.map((x,i)=>{let h='';if(x.section!==last){last=x.section;h=`<h3 class="ch6-section" data-page="${x.page}">${esc(x.section)}</h3>`}return `${h}<section class="pdfstudy-q" data-source-page="${x.page}"><div class="pdfstudy-label">${i+1}. ${esc(x.section)} · PDF Page ${x.page}${x.required?'':' · Optional'}</div><p>${esc(x.q)}</p><textarea data-src-id="${x.id}" placeholder="Type Liam's answer here. It saves automatically.">${esc(v[x.id]||'')}</textarea></section>`}).join('')}
function sync(subject,ch,items){const s=stats(subject,ch,items);if(!s.done)return s;const chapter=S.data?.[subject]?.chapters?.find(x=>Number(x.number)===ch);if(!chapter)return s;let g=null;try{g=guideFor(chapter)}catch(_){};(g?.steps||[]).forEach((_,i)=>{saved[`${subject}-${ch}-guide-done-${i}`]=true;saved[`${subject}-${ch}-guide-completedAt-${i}`]=saved[`${subject}-${ch}-guide-completedAt-${i}`]||new Date().toISOString()});saved[`${subject}-${ch}-done`]=true;saved[`${subject}-${ch}-mastery`]=100;saved[`${subject}-${ch}-completedAt`]=saved[`${subject}-${ch}-completedAt`]||new Date().toISOString();const cds=S.data?.[subject],idx=cds?.chapters?.findIndex(x=>Number(x.number)===ch),next=idx>=0?cds.chapters[idx+1]:null;if(next)saved[subject+'-current']=Math.max(Number(saved[subject+'-current']||ch),Number(next.number));save();return s}
function exportBank(subject,ch,items){const chapter=S.data?.[subject]?.chapters?.find(x=>Number(x.number)===ch),v=vals(subject,ch),student=typeof currentStudent==='function'?currentStudent():{name:'Liam DeVries',grade:9};const blocks=[{type:'p',text:`Student: ${student.name}`},{type:'p',text:`Grade: ${student.grade}`},{type:'p',text:`Course: ${subjectLabel(subject)}`},{type:'p',text:`Chapter ${ch}: ${chapter?.title||''}`},{type:'p',text:'PDF Study Mode — questions extracted from the supplied chapter PDF. Optional activities are identified separately.'}];let last='';items.forEach((x,i)=>{if(x.section!==last){last=x.section;blocks.push({type:'h2',text:x.section})}blocks.push({type:'p',text:`${i+1}. [PDF page ${x.page}]${x.required?'':' [Optional]'} ${x.q}`});blocks.push({type:'p',text:clean(v[x.id])||'(No response saved)'})});if(typeof academicPdfBlob==='function'&&typeof download==='function'){const blob=academicPdfBlob({subject:subjectLabel(subject),chapter:ch,chapterTitle:chapter?.title||'',docTitle:`Chapter ${ch} PDF Study Mode — Completed Work`,dateLabel:'Exported',blocks});download(blob,`${student.name.replace(/[^A-Za-z0-9]+/g,'_')}_${subjectLabel(subject).replace(/[^A-Za-z0-9]+/g,'_')}_Chapter_${String(ch).padStart(2,'0')}_PDF_Study.pdf`)}else window.print()}
async function patch(){if(S.view!=='chapter'||!ACTIVE.has(Number(S.chapter))||!['biology','geography'].includes(S.subject))return;const overlay=document.getElementById('pdfstudy-overlay'),host=document.getElementById('pdfstudy-questions');if(!overlay||!host||overlay.dataset.src789==='1')return;overlay.dataset.src789='loading';const subject=S.subject,ch=Number(S.chapter);host.innerHTML='<div class="src789-loading">Loading the extracted Chapter '+ch+' source questions…</div>';try{const bank=await loadBank(subject,ch);if(!bank.items.length)throw new Error('No usable source questions were extracted');overlay.dataset.src789='1';host.innerHTML=render(subject,ch,bank.items);host.addEventListener('input',e=>{const t=e.target;if(!t.matches('textarea[data-src-id]'))return;saved[sk(subject,ch)]=saved[sk(subject,ch)]||{};saved[sk(subject,ch)][t.dataset.srcId]=t.value;saved[sk(subject,ch)+'-updatedAt']=new Date().toISOString();save();const s=sync(subject,ch,bank.items),pct=s.total?Math.round(s.answered/s.total*100):0,p=host.querySelector('.pdfstudy-progress');if(p)p.innerHTML=`<strong>${s.answered}/${s.total} required questions saved</strong><span>${pct}%</span><div><i style="width:${pct}%"></i></div>`});const old=document.getElementById('pdfstudy-export');if(old){const b=old.cloneNode(true);old.replaceWith(b);b.onclick=()=>exportBank(subject,ch,bank.items)}sync(subject,ch,bank.items);document.dispatchEvent(new CustomEvent('pdfstudy:bank-ready'));}catch(e){overlay.dataset.src789='error';host.innerHTML=`<div class="src789-error"><strong>Could not load the extracted Chapter ${ch} question bank.</strong><br>${esc(e.message)}</div>`;console.error(e)}}
document.addEventListener('click',e=>{if(e.target?.closest?.('#pdfstudy-open'))setTimeout(patch,0)},false);
const mo=new MutationObserver(()=>{if(document.getElementById('pdfstudy-overlay'))patch()});mo.observe(document.documentElement,{childList:true,subtree:true});
const style=document.createElement('style');style.textContent='.src789-loading,.src789-error{background:#fff;border:1px solid #dce5e1;border-radius:10px;padding:18px;line-height:1.5}.ch6-section{position:sticky;top:0;z-index:4;background:#eaf4f0;border:1px solid #cde0d9;border-radius:9px;padding:9px 11px;margin:16px 0 8px;color:#274d42;font-size:16px;scroll-margin-top:58px}';document.head.appendChild(style);
window.__loadSourceStudy789=loadBank;
})();
