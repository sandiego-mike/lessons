(function(){
'use strict';
if(typeof S==='undefined'||typeof save!=='function')return;

const BANKS={
  biology:[
    {section:'5.1 Biodiversity',q:'Define biodiversity in your own words.'},
    {section:'5.1 Biodiversity',q:'Why does a rain forest usually have greater biodiversity than a cornfield?'},
    {section:'5.1 Biodiversity',q:'A wetland contains 80 species and a planted field contains 12 species. Which has greater species diversity, and what evidence supports your answer?'},
    {section:'5.1 Biodiversity',q:'Give two ways biodiversity benefits people.'},
    {section:'5.1 Biodiversity',q:'Explain one ecosystem service provided by living organisms, such as pollination, decomposition, nutrient cycling, soil formation, or water purification.'},
    {section:'5.1 Biodiversity',q:'Why can an ecosystem with many species be more resilient when disease or environmental conditions change?'},
    {section:'5.2 Threats to Biodiversity',q:'What is extinction, and how is it different from a species being endangered?'},
    {section:'5.2 Threats to Biodiversity',q:'Distinguish endangered species from threatened species.'},
    {section:'5.2 Threats to Biodiversity',q:'A bird still has several breeding populations, but its nesting habitat is shrinking and its numbers keep falling. Why would threatened be a better description than extinct?'},
    {section:'5.2 Threats to Biodiversity',q:'Explain how habitat destruction can reduce biodiversity.'},
    {section:'5.2 Threats to Biodiversity',q:'What is habitat fragmentation, and how can it isolate populations?'},
    {section:'5.2 Threats to Biodiversity',q:'A road cuts a forest into four small patches. Describe one problem caused by fragmentation.'},
    {section:'5.2 Threats to Biodiversity',q:'What is an edge effect? Give one example of how conditions at the edge of a habitat can differ from the interior.'},
    {section:'5.2 Threats to Biodiversity',q:'What is habitat degradation? How is it different from complete habitat destruction?'},
    {section:'5.2 Threats to Biodiversity',q:'How can acid precipitation harm organisms and ecosystems?'},
    {section:'5.2 Threats to Biodiversity',q:'What role does the ozone layer play, and why can damage to it harm living things?'},
    {section:'5.2 Threats to Biodiversity',q:'What is an exotic species?'},
    {section:'5.2 Threats to Biodiversity',q:'An introduced plant spreads rapidly because local herbivores do not eat it. Explain how it could reduce native biodiversity.'},
    {section:'5.3 Conserving Biodiversity',q:'Why is protecting habitat an important way to conserve biodiversity?'},
    {section:'5.3 Conserving Biodiversity',q:'How can wildlife corridors help populations living in fragmented habitats?'},
    {section:'5.3 Conserving Biodiversity',q:'Match each threat with a useful conservation response: isolated habitat patches, polluted lake water, and a harmful introduced species.'},
    {section:'5.3 Conserving Biodiversity',q:'Design a two-part conservation plan for a declining animal whose habitat is both fragmented and degraded. Explain which threat each action addresses.'},
    {section:'5.3 Conserving Biodiversity',q:'After habitat restoration, native species counts rise from 24 to 37 while an invasive species declines. What conclusion does this evidence support?'},
    {section:'5.3 Conserving Biodiversity',q:'What additional evidence would make the habitat-restoration conclusion stronger?'},
    {section:'Chapter 5 Review',q:'Explain the relationship among biodiversity, habitat quality, and extinction risk.'},
    {section:'Chapter 5 Review',q:'Choose one major threat to biodiversity and explain both how it causes harm and one realistic conservation response.'}
  ],
  geography:[
    {section:'5.1 Landforms and Water',q:'Compare the major western, central, and eastern landform regions of the United States and Canada.'},
    {section:'5.1 Landforms and Water',q:'What is the Continental Divide, and how does it affect the direction rivers flow?'},
    {section:'5.1 Landforms and Water',q:'What are headwaters?'},
    {section:'5.1 Landforms and Water',q:'What is a tributary? Give one North American example.'},
    {section:'5.1 Landforms and Water',q:'Explain the difference between headwaters and a tributary.'},
    {section:'5.1 Landforms and Water',q:'Why have the Great Lakes and the St. Lawrence River been important to transportation, settlement, and economic development?'},
    {section:'5.1 Landforms and Water',q:'Why has the Mississippi River system been important to the interior of North America?'},
    {section:'5.1 Landforms and Water',q:'What is a fall line, and why did cities often develop near one?'},
    {section:'5.2 Natural Resources',q:'Identify one important natural resource in the United States or Canada and connect it to the physical region where it is found.'},
    {section:'5.2 Natural Resources',q:'Explain how one natural resource supports an economic activity.'},
    {section:'5.2 Natural Resources',q:'What is a fishery, and why is careful management important to a fishery?'},
    {section:'5.2 Natural Resources',q:'Why can conservation be necessary even in a region with abundant natural resources?'},
    {section:'5.3 Climate and Vegetation',q:'How does latitude help explain climate differences across the United States and Canada?'},
    {section:'5.3 Climate and Vegetation',q:'How does elevation affect temperature and vegetation?'},
    {section:'5.3 Climate and Vegetation',q:'What is timberline, and what does it tell you about climate conditions?'},
    {section:'5.3 Climate and Vegetation',q:'Explain how mountains and Pacific air can create a rain-shadow effect.'},
    {section:'5.3 Climate and Vegetation',q:'What is a chinook, and how can it change winter weather east of the Rocky Mountains?'},
    {section:'5.3 Climate and Vegetation',q:'What is a prairie, and what physical conditions helped prairies develop in central North America?'},
    {section:'5.3 Climate and Vegetation',q:'Connect one major climate region of the United States or Canada with the natural vegetation found there.'},
    {section:'5.4 Weather Hazards',q:'What is a supercell, and why can it be dangerous?'},
    {section:'5.4 Weather Hazards',q:'Why are parts of the Great Plains especially vulnerable to severe thunderstorms and tornadoes?'},
    {section:'5.4 Weather Hazards',q:'What conditions and hazards are associated with a hurricane?'},
    {section:'5.4 Weather Hazards',q:'Which parts of the United States and Canada are most exposed to hurricanes, and why?'},
    {section:'5.4 Weather Hazards',q:'What makes a blizzard dangerous?'},
    {section:'5.4 Weather Hazards',q:'Choose one major weather hazard in the region and explain an appropriate preparation or safety response.'},
    {section:'Chapter 5 Review',q:'Explain how landforms, water, climate, vegetation, and natural resources influence where and how people live in the United States and Canada.'},
    {section:'Chapter 5 Review',q:'Choose one physical-geography pattern from Chapter 5 and explain its cause and one human or environmental effect.'}
  ]
};

function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function esc(v){return String(v||'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function storeKey(subject){return `${subject}-5-pdf-study-complete`}
function vals(subject){return saved[storeKey(subject)]||{}}
function completion(subject){const bank=BANKS[subject]||[],v=vals(subject),answered=bank.filter((_,i)=>clean(v[i])).length;return {answered,total:bank.length,done:bank.length>0&&answered===bank.length}}
function progressHtml(subject){const c=completion(subject),pct=c.total?Math.round(c.answered/c.total*100):0;return `<div class="pdfstudy-progress"><strong>${c.answered}/${c.total} Chapter 5 questions saved</strong><span>${pct}%</span><div><i style="width:${pct}%"></i></div></div>`}
function questionHtml(subject){let last='';return progressHtml(subject)+(BANKS[subject]||[]).map((item,i)=>{let head='';if(item.section!==last){last=item.section;head=`<h3 class="ch5-section">${esc(item.section)}</h3>`}return `${head}<section class="pdfstudy-q"><div class="pdfstudy-label">${i+1}. ${esc(item.section)}</div><p>${esc(item.q)}</p><textarea data-ch5-study="${i}" placeholder="Type Liam's answer here. It saves automatically.">${esc(vals(subject)[i]||'')}</textarea></section>`}).join('')}
function syncMain(subject){const c=completion(subject);if(!c.done)return;const ch=S.data?.[subject]?.chapters?.find(x=>Number(x.number)===5);if(!ch)return;let guide=null;try{guide=guideFor(ch)}catch(_){};(guide?.steps||[]).forEach((_,i)=>{saved[`${subject}-5-guide-done-${i}`]=true;saved[`${subject}-5-guide-completedAt-${i}`]=saved[`${subject}-5-guide-completedAt-${i}`]||new Date().toISOString()});
  const v=vals(subject),wk=`${subject}-5-worksheet`,ck=`${subject}-5-check`;saved[wk]=saved[wk]||{};saved[ck]=saved[ck]||{};
  for(let i=0;i<Math.min(6,BANKS[subject].length);i++)saved[wk][i]=v[i]||'Completed in PDF Study Mode';
  for(let i=0;i<Math.min(4,BANKS[subject].length);i++)saved[ck][i]=v[Math.min(i+6,BANKS[subject].length-1)]||'Completed in PDF Study Mode';
  saved[wk+'-updatedAt']=new Date().toISOString();saved[ck+'-updatedAt']=new Date().toISOString();saved[`${subject}-5-done`]=true;saved[`${subject}-5-mastery`]=100;saved[`${subject}-5-completedAt`]=saved[`${subject}-5-completedAt`]||new Date().toISOString();save();
}
function exportBank(subject){const bank=BANKS[subject],v=vals(subject),student=typeof currentStudent==='function'?currentStudent():{name:'Liam DeVries',grade:9},ch=S.data?.[subject]?.chapters?.find(x=>Number(x.number)===5);if(!bank||!ch)return;const blocks=[{type:'p',text:`Student: ${student.name}`},{type:'p',text:`Grade: ${student.grade}`},{type:'p',text:`Course: ${subjectLabel(subject)}`},{type:'p',text:`Chapter 5: ${ch.title}`},{type:'p',text:'Chapter 5 PDF Study Mode - saved responses.'}];let last='';bank.forEach((item,i)=>{if(item.section!==last){last=item.section;blocks.push({type:'h2',text:item.section})}blocks.push({type:'p',text:`${i+1}. ${item.q}`});blocks.push({type:'p',text:clean(v[i])||'(No response saved)'})});if(typeof academicPdfBlob==='function'&&typeof download==='function'){const blob=academicPdfBlob({subject:subjectLabel(subject),chapter:5,chapterTitle:ch.title,docTitle:'Chapter 5 PDF Study Mode - Completed Work',dateLabel:'Exported',blocks});download(blob,`${student.name.replace(/[^A-Za-z0-9]+/g,'_')}_${subjectLabel(subject).replace(/[^A-Za-z0-9]+/g,'_')}_Chapter_05_PDF_Study.pdf`)}else window.print()}
function patch(){if(S.view!=='chapter'||Number(S.chapter)!==5||!BANKS[S.subject])return;const overlay=document.getElementById('pdfstudy-overlay'),host=document.getElementById('pdfstudy-questions');if(!overlay||!host||overlay.dataset.ch5CompleteBank==='1')return;overlay.dataset.ch5CompleteBank='1';const subject=S.subject;host.innerHTML=questionHtml(subject);host.addEventListener('input',e=>{const t=e.target;if(!t.matches('textarea[data-ch5-study]'))return;const i=Number(t.dataset.ch5Study);saved[storeKey(subject)]=saved[storeKey(subject)]||{};saved[storeKey(subject)][i]=t.value;saved[storeKey(subject)+'-updatedAt']=new Date().toISOString();save();syncMain(subject);const p=host.querySelector('.pdfstudy-progress');if(p){const box=document.createElement('div');box.innerHTML=progressHtml(subject);p.replaceWith(box.firstElementChild)}});const old=document.getElementById('pdfstudy-export');if(old){const b=old.cloneNode(true);old.replaceWith(b);b.onclick=()=>exportBank(subject)}
}
document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('#pdfstudy-open'))setTimeout(patch,0)},false);
const style=document.createElement('style');style.textContent='.ch5-section{position:sticky;top:74px;z-index:1;background:#eaf4f0;border:1px solid #cde0d9;border-radius:9px;padding:9px 11px;margin:16px 0 8px;color:#274d42;font-size:16px}.pdfstudy-q+.ch5-section{margin-top:22px}';document.head.appendChild(style);
window.__CH5_COMPLETE_STUDY_BANKS__=BANKS;
})();
