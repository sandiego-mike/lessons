(()=>{
'use strict';
const KEY='devries-sat-performance-data-v1';
const PACE={rw:71,math:95}; // seconds/question from official section timing divided by module question count
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{"sessions":[]}')}catch(e){return {sessions:[]}}};
const save=db=>localStorage.setItem(KEY,JSON.stringify(db));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const now=()=>Date.now();
const student=()=>localStorage.getItem('sat-last-student')||(/Leilani/i.test(document.body.innerText)?'leilani':'liam');
const subject=()=>{const t=(document.querySelector('.sathead')?.innerText||document.querySelector('.satover')?.innerText||'').toLowerCase();return /math/.test(t)?'math':'rw'};
const mode=()=>{const t=(document.querySelector('.sathead')?.innerText||document.querySelector('.satover')?.innerText||'').toLowerCase();return /practice with me|coach|teach/.test(t)?'coach':/timed|solitary|simulation/.test(t)?'timed':'practice'};
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
let active=null,lastQuestion=null,lastSeen=0,finalizedResultSignature='';
function visibleQuestion(){
 const root=document.querySelector('.satover'); if(!root)return null;
 const q=root.querySelector('.satq'); if(!q)return null;
 const domain=(q.querySelector('.satdomain')?.textContent||'Unclassified').replace(/^Q\d+\s*[·:-]?\s*/,'').trim();
 const text=(q.querySelector('h3,h4')?.textContent||q.textContent||'').trim().slice(0,800);
 const numberMatch=(root.querySelector('.testtop')?.textContent||domain).match(/(?:question|q)\s*(\d+)/i);
 return {key:hash(domain+'|'+text),domain,text,number:numberMatch?Number(numberMatch[1]):null};
}
function ensureSession(q){
 if(active)return;
 active={id:'s'+now(),student:student(),subject:subject(),mode:mode(),source:'PDF-calibrated',startedAt:new Date().toISOString(),startedMs:now(),questions:{},events:[],result:null};
 if(q)startQuestion(q);
}
function startQuestion(q){
 ensureSession();
 if(lastQuestion&&active.questions[lastQuestion])active.questions[lastQuestion].timeMs+=(now()-lastSeen);
 lastQuestion=q.key;lastSeen=now();
 const rec=active.questions[q.key]||{key:q.key,number:q.number,domain:q.domain,text:q.text,timeMs:0,firstAnswerMs:null,answerChanges:0,flagged:false,answers:[],correct:null};
 active.questions[q.key]=rec;
 rec.views=(rec.views||0)+1;
}
function captureAnswer(el){
 const q=visibleQuestion();if(!q)return;ensureSession(q);if(lastQuestion!==q.key)startQuestion(q);
 const rec=active.questions[q.key];
 if(rec.firstAnswerMs==null)rec.firstAnswerMs=now()-lastSeen;
 const value=el.value||el.getAttribute('data-answer')||el.textContent?.trim();
 if(rec.answers.length && rec.answers[rec.answers.length-1]!==value)rec.answerChanges++;
 if(!rec.answers.length||rec.answers[rec.answers.length-1]!==value)rec.answers.push(value);
 active.events.push({t:now()-active.startedMs,type:'answer',q:q.key,value});
}
function captureFlag(){const q=visibleQuestion();if(!q)return;ensureSession(q);active.questions[q.key].flagged=!active.questions[q.key].flagged;active.events.push({t:now()-active.startedMs,type:'flag',q:q.key,value:active.questions[q.key].flagged})}
function parseResults(){
 const root=document.querySelector('.satover');if(!root)return;
 const reviews=[...root.querySelectorAll('.review')];if(!reviews.length)return;
 const sig=hash(reviews.map(x=>x.className+'|'+x.textContent.slice(0,80)).join('||'));if(sig===finalizedResultSignature)return;
 ensureSession(); if(lastQuestion&&active.questions[lastQuestion]){active.questions[lastQuestion].timeMs+=(now()-lastSeen);lastQuestion=null}
 let correct=0;const domains={};
 reviews.forEach((r,i)=>{
  const ok=r.classList.contains('right')||/\bcorrect\b/i.test(r.querySelector('.satdomain')?.textContent||''); if(ok)correct++;
  const d=(r.querySelector('.satdomain')?.textContent||'Unclassified').replace(/^Q\d+\s*[·:-]?\s*/,'').replace(/\s*[·:-]?\s*(CORRECT|REVIEW).*$/i,'').trim();
  domains[d]??={correct:0,total:0};domains[d].total++;if(ok)domains[d].correct++;
  const title=(r.querySelector('h3,h4')?.textContent||'').trim();const k=Object.keys(active.questions).find(k=>active.questions[k].text===title)||Object.keys(active.questions)[i];if(k)active.questions[k].correct=ok;
 });
 const total=reviews.length,accuracy=total?Math.round(correct/total*100):0;
 const qs=Object.values(active.questions),answered=qs.filter(q=>q.answers.length).length,flagged=qs.filter(q=>q.flagged).length;
 const times=qs.map(q=>Math.round(q.timeMs/1000)).filter(n=>n>0).sort((a,b)=>a-b);const median=times.length?times[Math.floor(times.length/2)]:null;
 const paceTarget=PACE[active.subject]||80;
 const rushedErrors=qs.filter(q=>q.correct===false&&q.timeMs/1000<Math.max(20,paceTarget*.4)).length;
 const slowCorrect=qs.filter(q=>q.correct===true&&q.timeMs/1000>paceTarget*1.35).length;
 const secondGuess=qs.filter(q=>q.correct===false&&q.answerChanges>0).length;
 active.result={correct,total,accuracy,answered,omitted:Math.max(0,total-answered),flagged,medianSeconds:median,paceTarget,rushedErrors,slowCorrect,secondGuess,domains,durationSeconds:Math.round((now()-active.startedMs)/1000)};
 const db=load();db.sessions.push(active);if(db.sessions.length>200)db.sessions=db.sessions.slice(-200);save(db);finalizedResultSignature=sig;active=null;lastQuestion=null;updateButton();
}
function readiness(sessions,subj){
 const recent=sessions.filter(s=>s.subject===subj&&s.result).slice(-3);if(recent.length<2)return {status:'Need more data',detail:'Complete at least 2 comparable timed sets.'};
 const good=recent.slice(-2).every(s=>s.result.accuracy>=85&&(s.result.medianSeconds==null||s.result.medianSeconds<=PACE[subj]*1.1));
 const dom={};recent.forEach(s=>Object.entries(s.result.domains||{}).forEach(([k,v])=>{dom[k]??={c:0,t:0};dom[k].c+=v.correct;dom[k].t+=v.total}));
 const weak=Object.entries(dom).filter(([,v])=>v.t>=2&&v.c/v.t<.7).map(([k])=>k);
 if(good&&!weak.length)return {status:'Ready to move harder',detail:'Recent accuracy and pacing are both on target with no persistent weak domain.'};
 return {status:'Keep training',detail:weak.length?'Weakest: '+weak.slice(0,3).join(', '):'Accuracy or pacing is not yet stable across two sets.'};
}
function summary(studentId){
 const ss=load().sessions.filter(s=>s.student===studentId&&s.result);const latest=ss[ss.length-1];const dom={};ss.slice(-8).forEach(s=>Object.entries(s.result.domains||{}).forEach(([k,v])=>{dom[k]??={c:0,t:0};dom[k].c+=v.correct;dom[k].t+=v.total}));
 const weakest=Object.entries(dom).map(([k,v])=>({k,p:v.t?Math.round(v.c/v.t*100):0,n:v.t})).sort((a,b)=>a.p-b.p).slice(0,4);
 return {sessions:ss,latest,weakest,rw:readiness(ss,'rw'),math:readiness(ss,'math')};
}
function showDashboard(){
 const id=student(),name=id==='leilani'?'Leilani':'Liam',x=summary(id),latest=x.latest;
 let old=document.getElementById('sat-data-overlay');if(old)old.remove();
 const el=document.createElement('div');el.id='sat-data-overlay';el.innerHTML=`<div class="satdata-card"><button class="satdata-close">×</button><h2>${name} · SAT Performance Data</h2>${latest?`<div class="satdata-grid"><div><span>Latest accuracy</span><strong>${latest.result.accuracy}%</strong></div><div><span>Median pace</span><strong>${latest.result.medianSeconds??'—'}s</strong></div><div><span>Rushed errors</span><strong>${latest.result.rushedErrors}</strong></div><div><span>Slow correct</span><strong>${latest.result.slowCorrect}</strong></div><div><span>Second-guessed misses</span><strong>${latest.result.secondGuess}</strong></div><div><span>Omitted</span><strong>${latest.result.omitted}</strong></div></div>`:'<p>No completed tracked set yet. Finish a PDF-calibrated practice set to create a baseline.</p>'}<section><h3>Move-on signal</h3><p><b>Reading & Writing:</b> ${esc(x.rw.status)} — ${esc(x.rw.detail)}</p><p><b>Math:</b> ${esc(x.math.status)} — ${esc(x.math.detail)}</p></section><section><h3>Weakest recent domains</h3>${x.weakest.length?x.weakest.map(w=>`<p>${esc(w.k)}: <b>${w.p}%</b> across ${w.n} questions</p>`).join(''):'<p>Not enough domain data yet.</p>'}</section><section><h3>What this tracks</h3><p>Accuracy, domain mastery, time per question, omitted questions, flags, answer changes, rushed misses, correct-but-too-slow questions, and trends by student.</p></section><div class="satdata-actions"><button data-export="csv">Export CSV</button><button data-export="json">Export JSON</button></div><p class="satdata-note">Score estimates are training estimates only. Official College Board scoring uses proprietary item parameters.</p></div>`;document.body.appendChild(el);el.querySelector('.satdata-close').onclick=()=>el.remove();el.addEventListener('click',e=>{if(e.target===el)el.remove();const f=e.target?.dataset?.export;if(f)exportData(f,id)});
}
function exportData(type,id){const ss=load().sessions.filter(s=>s.student===id);let blob,name;if(type==='json'){blob=new Blob([JSON.stringify(ss,null,2)],{type:'application/json'});name=`${id}-sat-performance.json`}else{const rows=[['date','subject','mode','accuracy','correct','total','median_seconds','rushed_errors','slow_correct','second_guess','omitted','flagged']];ss.filter(s=>s.result).forEach(s=>rows.push([s.startedAt,s.subject,s.mode,s.result.accuracy,s.result.correct,s.result.total,s.result.medianSeconds??'',s.result.rushedErrors,s.result.slowCorrect,s.result.secondGuess,s.result.omitted,s.result.flagged]));blob=new Blob([rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')],{type:'text/csv'});name=`${id}-sat-performance.csv`}const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function updateButton(){let b=document.getElementById('sat-data-launch');if(!b){b=document.createElement('button');b.id='sat-data-launch';b.textContent='SAT Data';b.onclick=showDashboard;document.body.appendChild(b)}}
document.addEventListener('change',e=>{if(e.target.matches('.satover input[type="radio"],.satover input[type="text"],.satover input[type="number"]'))captureAnswer(e.target)},true);
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!b.closest('.satover'))return;if(/flag/i.test(b.textContent||''))captureFlag();setTimeout(scan,0)},true);
function scan(){const q=visibleQuestion();if(q&&q.key!==lastQuestion){ensureSession(q);startQuestion(q)}parseResults();updateButton()}
const obs=new MutationObserver(()=>scan());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{obs.observe(document.body,{childList:true,subtree:true});updateButton();scan()});else{obs.observe(document.body,{childList:true,subtree:true});updateButton();scan()}
const css=document.createElement('style');css.textContent=`#sat-data-launch{position:fixed;right:18px;bottom:72px;z-index:8999;border:1px solid #aeb8c2;border-radius:999px;padding:10px 15px;background:white;color:#132d46;font-weight:800;box-shadow:0 4px 16px #0002}#sat-data-overlay{position:fixed;inset:0;z-index:110000;background:#0c1825e8;padding:14px;overflow:auto;-webkit-overflow-scrolling:touch}.satdata-card{max-width:760px;margin:20px auto;background:#f7f9fb;border-radius:16px;padding:20px;position:relative}.satdata-close{position:absolute;right:12px;top:10px;border:0;background:transparent;font-size:30px}.satdata-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.satdata-grid div,.satdata-card section{background:#fff;border:1px solid #d8e0e7;border-radius:12px;padding:13px;margin:10px 0}.satdata-grid span,.satdata-grid strong{display:block}.satdata-grid strong{font-size:24px}.satdata-actions{display:flex;gap:8px;flex-wrap:wrap}.satdata-actions button{padding:10px 14px;border:1px solid #aeb8c2;border-radius:8px;background:#fff;font-weight:750}.satdata-note{font-size:12px;color:#5b6874}@media(max-width:700px){#sat-data-launch{right:12px;bottom:68px}.satdata-grid{grid-template-columns:1fr 1fr}.satdata-card{margin:0;padding:14px;padding-top:42px}}`;document.head.appendChild(css);
window.SATPerformanceData={summary:()=>summary(student()),all:()=>load(),dashboard:showDashboard};
})();