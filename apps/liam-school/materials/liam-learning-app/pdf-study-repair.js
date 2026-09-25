(function(){
'use strict';
if(typeof window==='undefined')return;
function repairPdfStudy(){
 var overlay=document.getElementById('pdfstudy-overlay');
 if(!overlay||typeof S==='undefined'||!['biology','geography'].includes(S.subject))return;
 var reader=overlay.querySelector('.pdfstudy-reader'); if(!reader||reader.dataset.repaired==='1')return;
 var ch=Number(S.chapter), base='https://raw.githubusercontent.com/sandiego-mike/lessons/main/apps/liam-school/materials/';
 var file=S.subject==='biology'?(ch<=9?'biology/Chapter_'+ch+'.pdf':'biology/Chapter '+ch+' PDF.pdf'):'world-geography/chapter-'+String(ch).padStart(2,'0')+'.pdf';
 var url=base+file.split('/').map(encodeURIComponent).join('/');
 reader.dataset.repaired='1';
 reader.innerHTML='<div class="pdfstudy-native-wrap"><object class="pdfstudy-native-object" data="'+url+'#view=FitH" type="application/pdf"><embed src="'+url+'#view=FitH" type="application/pdf"></embed></object></div><div class="pdfstudy-reader-help"><strong>Chapter '+ch+' textbook</strong><span>If the book does not appear above, open it directly. Your answers remain saved in this study window.</span><a href="'+url+'" target="_blank" rel="noopener">Open Chapter '+ch+' PDF</a></div>';
 if(!document.getElementById('pdfstudy-repair-style')){var st=document.createElement('style');st.id='pdfstudy-repair-style';st.textContent='.pdfstudy-reader{display:flex!important;flex-direction:column;overflow:auto!important}.pdfstudy-native-wrap{flex:1;min-height:70vh}.pdfstudy-native-object,.pdfstudy-native-object embed{display:block;width:100%;height:100%;min-height:70vh;border:0}.pdfstudy-reader-help{padding:12px 16px;background:#fff;border-top:1px solid #ccd5da;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.pdfstudy-reader-help span{flex:1;min-width:220px}.pdfstudy-reader-help a{padding:9px 12px;border:1px solid #ccd5da;border-radius:8px;background:#123;color:#fff;text-decoration:none}@media(max-width:850px){.pdfstudy-overlay[data-pane="questions"] .pdfstudy-reader{display:none!important}.pdfstudy-overlay[data-pane="pdf"] aside{display:none}.pdfstudy-native-wrap,.pdfstudy-native-object,.pdfstudy-native-object embed{min-height:75vh}}';document.head.appendChild(st);}
}
document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('#pdfstudy-open'))setTimeout(repairPdfStudy,80)},true);
document.addEventListener('pdfstudy:bank-ready',function(){setTimeout(repairPdfStudy,0)});
var mo=new MutationObserver(function(){if(document.getElementById('pdfstudy-overlay'))repairPdfStudy()});mo.observe(document.documentElement,{childList:true,subtree:true});
window.__repairPdfStudy=repairPdfStudy;
})();