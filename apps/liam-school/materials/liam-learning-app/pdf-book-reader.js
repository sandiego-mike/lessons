(function(){
'use strict';

const PDFJS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
let pdfjsPromise=null;

function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function esc(v){return String(v||'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function loadPdfJs(){
  if(window.pdfjsLib){window.pdfjsLib.GlobalWorkerOptions.workerSrc=WORKER;return Promise.resolve(window.pdfjsLib)}
  if(pdfjsPromise)return pdfjsPromise;
  pdfjsPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');s.src=PDFJS;s.async=true;
    s.onload=()=>{if(!window.pdfjsLib)return reject(new Error('PDF reader library did not load'));window.pdfjsLib.GlobalWorkerOptions.workerSrc=WORKER;resolve(window.pdfjsLib)};
    s.onerror=()=>reject(new Error('Unable to load PDF reader library'));
    document.head.appendChild(s);
  });
  return pdfjsPromise;
}
function findPdfUrl(reader){
  const iframe=reader.querySelector('iframe[src]');if(iframe)return iframe.src.split('#')[0];
  const a=reader.querySelector('a[href$=".pdf"],a[href*=".pdf?"]');return a?a.href.split('#')[0]:'';
}
function currentChapter(){try{return Number(S&&S.chapter)||0}catch(_){return 0}}
function currentSubject(){try{return S&&S.subject||''}catch(_){return ''}}
function stateKey(){return `pdfbook-${currentSubject()}-${currentChapter()}-page`}
function rememberPage(n){try{localStorage.setItem(stateKey(),String(n))}catch(_){}}
function recalledPage(){try{return Math.max(1,Number(localStorage.getItem(stateKey())||1))}catch(_){return 1}}

function enhanceReader(overlay){
  if(!overlay||overlay.dataset.bookReader==='1')return;
  const reader=overlay.querySelector('.pdfstudy-reader');if(!reader)return;
  const url=findPdfUrl(reader);if(!url)return;
  overlay.dataset.bookReader='1';
  reader.innerHTML=`<div class="pdfbook-wrap"><div class="pdfbook-toolbar"><button type="button" data-pdf-prev aria-label="Previous page">‹ Previous</button><div class="pdfbook-pagebox"><label>Page <input data-pdf-page type="number" min="1" value="1" inputmode="numeric"> <span data-pdf-total>of …</span></label></div><button type="button" data-pdf-next aria-label="Next page">Next ›</button><button type="button" data-pdf-fit>Fit width</button><a href="${esc(url)}" target="_blank" rel="noopener">Open separately</a></div><div class="pdfbook-stage"><div class="pdfbook-loading">Loading Chapter ${currentChapter()} PDF…</div><canvas data-pdf-canvas></canvas></div><div class="pdfbook-footer"><span>Swipe left/right, use the arrows, or type a page number.</span><span data-pdf-source>Chapter ${currentChapter()} PDF</span></div></div>`;
  const canvas=reader.querySelector('[data-pdf-canvas]'),stage=reader.querySelector('.pdfbook-stage'),pageInput=reader.querySelector('[data-pdf-page]'),total=reader.querySelector('[data-pdf-total]'),loading=reader.querySelector('.pdfbook-loading');
  let doc=null,page=Math.max(1,recalledPage()),rendering=false,pending=null,fitWidth=true,renderTask=null;

  async function renderPage(n){
    if(!doc)return;if(rendering){pending=n;return}rendering=true;
    page=Math.max(1,Math.min(doc.numPages,n));pageInput.value=page;rememberPage(page);
    try{
      const p=await doc.getPage(page),base=p.getViewport({scale:1});
      const maxW=Math.max(300,stage.clientWidth-28),maxH=Math.max(300,stage.clientHeight-28);
      let scale=fitWidth?maxW/base.width:Math.min(maxW/base.width,maxH/base.height);
      scale=Math.max(.5,Math.min(2.5,scale));
      const viewport=p.getViewport({scale});
      const dpr=Math.min(window.devicePixelRatio||1,2),ctx=canvas.getContext('2d');
      canvas.width=Math.floor(viewport.width*dpr);canvas.height=Math.floor(viewport.height*dpr);canvas.style.width=Math.floor(viewport.width)+'px';canvas.style.height=Math.floor(viewport.height)+'px';
      if(renderTask)try{renderTask.cancel()}catch(_){}
      renderTask=p.render({canvasContext:ctx,viewport,transform:dpr!==1?[dpr,0,0,dpr,0,0]:null});await renderTask.promise;
      loading.style.display='none';canvas.style.display='block';stage.scrollTop=0;stage.scrollLeft=0;
    }catch(e){if(!(e&&e.name==='RenderingCancelledException')){loading.style.display='block';loading.textContent='Could not render this page. Use “Open separately” as a fallback.'}}
    rendering=false;if(pending!=null){const p=pending;pending=null;renderPage(p)}
  }
  function go(n){if(doc)renderPage(n)}
  reader.querySelector('[data-pdf-prev]').onclick=()=>go(page-1);reader.querySelector('[data-pdf-next]').onclick=()=>go(page+1);
  reader.querySelector('[data-pdf-fit]').onclick=e=>{fitWidth=!fitWidth;e.currentTarget.textContent=fitWidth?'Fit width':'Fit page';renderPage(page)};
  pageInput.onchange=()=>go(Number(pageInput.value)||1);
  let sx=0,sy=0;stage.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY},{passive:true});stage.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.4)go(page+(dx<0?1:-1))},{passive:true});
  overlay.addEventListener('keydown',e=>{if(e.target&&/input|textarea/i.test(e.target.tagName))return;if(e.key==='ArrowLeft')go(page-1);if(e.key==='ArrowRight')go(page+1)});
  let rt;new ResizeObserver(()=>{clearTimeout(rt);rt=setTimeout(()=>doc&&renderPage(page),180)}).observe(stage);

  loadPdfJs().then(lib=>lib.getDocument({url,withCredentials:false}).promise).then(d=>{doc=d;total.textContent=`of ${doc.numPages}`;page=Math.min(page,doc.numPages);renderPage(page)}).catch(e=>{loading.textContent='The built-in PDF reader could not load. Tap “Open separately” to view the chapter PDF.';console.error('PDF book reader:',e)});
  overlay.__pdfBookGoPage=go;
}

function sectionNodes(host){
  const heads=[...host.querySelectorAll('.ch5-section,.ch6-section')];
  if(heads.length)return heads.map(h=>({name:clean(h.textContent),el:h,page:Number(h.dataset.page||0)}));
  const cards=[...host.querySelectorAll('.pdfstudy-q')],out=[],seen=new Set();
  cards.forEach(card=>{const label=clean(card.querySelector('.pdfstudy-label')?.textContent||'').replace(/^\d+\.\s*/,'').replace(/\s*·\s*PDF PAGE\s*\d+.*/i,'');if(label&&!seen.has(label)){seen.add(label);out.push({name:label,el:card,page:Number((card.textContent.match(/PDF Page\s*(\d+)/i)||[])[1]||0)})}});return out;
}
function enhanceSections(overlay){
  const host=overlay.querySelector('#pdfstudy-questions');if(!host||host.dataset.sectionNav==='1')return;
  const sections=sectionNodes(host);if(sections.length<2)return;host.dataset.sectionNav='1';
  const nav=document.createElement('div');nav.className='pdfsection-nav';nav.innerHTML=`<button type="button" data-sec-prev>‹ Section</button><select data-sec-select aria-label="Jump to section">${sections.map((s,i)=>`<option value="${i}">${esc(s.name)}</option>`).join('')}</select><button type="button" data-sec-next>Next section ›</button><button type="button" data-sec-skip>Skip ahead</button>`;
  host.insertBefore(nav,host.firstChild);
  let current=0;const select=nav.querySelector('[data-sec-select]');
  function jump(i,alsoPdf){current=Math.max(0,Math.min(sections.length-1,i));select.value=String(current);sections[current].el.scrollIntoView({behavior:'smooth',block:'start'});if(alsoPdf&&sections[current].page&&overlay.__pdfBookGoPage)overlay.__pdfBookGoPage(sections[current].page)}
  nav.querySelector('[data-sec-prev]').onclick=()=>jump(current-1,true);nav.querySelector('[data-sec-next]').onclick=()=>jump(current+1,true);nav.querySelector('[data-sec-skip]').onclick=()=>jump(current+1,true);select.onchange=()=>jump(Number(select.value),true);
  const observer=new IntersectionObserver(entries=>{for(const en of entries)if(en.isIntersecting){const i=sections.findIndex(s=>s.el===en.target);if(i>=0){current=i;select.value=String(i);break}}},{root:host,threshold:.35});sections.forEach(s=>observer.observe(s.el));
}
function enhanceQuestionPageLinks(overlay){
  const host=overlay.querySelector('#pdfstudy-questions');if(!host||host.dataset.pageLinks==='1')return;host.dataset.pageLinks='1';
  host.addEventListener('click',e=>{const card=e.target.closest('.pdfstudy-q');if(!card||e.target.closest('textarea,button,a,input,select'))return;const m=card.textContent.match(/PDF Page\s*(\d+)/i);if(!m||!overlay.__pdfBookGoPage)return;overlay.__pdfBookGoPage(Number(m[1]));if(matchMedia('(max-width:850px)').matches&&typeof setMobilePane==='function')setMobilePane('pdf')});
}
function enhance(overlay){enhanceReader(overlay);setTimeout(()=>{enhanceSections(overlay);enhanceQuestionPageLinks(overlay)},20)}
const mo=new MutationObserver(()=>{const o=document.getElementById('pdfstudy-overlay');if(o)enhance(o)});mo.observe(document.documentElement,{childList:true,subtree:true});
const existing=document.getElementById('pdfstudy-overlay');if(existing)enhance(existing);

const style=document.createElement('style');style.textContent=`
.pdfbook-wrap{height:100%;display:flex;flex-direction:column;background:#dfe5e8}.pdfbook-toolbar{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;padding:9px;background:#fff;border-bottom:1px solid #cad4d9;position:sticky;top:0;z-index:5}.pdfbook-toolbar button,.pdfbook-toolbar a,.pdfbook-pagebox{border:1px solid #bdc9cf;background:#fff;border-radius:8px;padding:8px 10px;color:#123;text-decoration:none;font:inherit}.pdfbook-pagebox input{width:58px;border:0;border-bottom:1px solid #9eabb1;text-align:center;font:inherit}.pdfbook-stage{flex:1;min-height:0;overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:14px;box-sizing:border-box;overscroll-behavior:contain}.pdfbook-stage canvas{display:none;background:#fff;box-shadow:0 2px 14px rgba(0,0,0,.18)}.pdfbook-loading{margin:auto;background:#fff;border-radius:10px;padding:18px;max-width:360px;text-align:center}.pdfbook-footer{display:flex;justify-content:space-between;gap:12px;padding:7px 12px;background:#fff;border-top:1px solid #cad4d9;font-size:12px;color:#59676d}.pdfsection-nav{position:sticky;top:0;z-index:6;display:grid;grid-template-columns:auto minmax(140px,1fr) auto auto;gap:6px;background:#f7faf9;padding:0 0 10px;margin-bottom:4px}.pdfsection-nav button,.pdfsection-nav select{min-width:0;border:1px solid #c5d2cd;background:white;border-radius:8px;padding:8px;font:inherit}.pdfsection-nav [data-sec-skip]{background:#eef5f2}.pdfstudy-q{cursor:default}.pdfstudy-q:has(.pdfstudy-label){scroll-margin-top:58px}@media(max-width:850px){.pdfbook-toolbar{justify-content:flex-start;padding:7px}.pdfbook-toolbar button,.pdfbook-toolbar a,.pdfbook-pagebox{padding:7px 8px;font-size:13px}.pdfbook-footer{display:none}.pdfbook-stage{padding:8px}.pdfsection-nav{grid-template-columns:1fr 1fr;top:0}.pdfsection-nav select{grid-column:1/-1;grid-row:1}.pdfsection-nav [data-sec-prev],.pdfsection-nav [data-sec-next]{grid-row:2}.pdfsection-nav [data-sec-skip]{grid-column:1/-1;grid-row:3}.pdfstudy-reader iframe,.pdfstudy-mobile-reader-fallback{display:none!important}.pdfstudy-overlay[data-pane="pdf"] .pdfstudy-reader{display:block!important}}
`;
document.head.appendChild(style);
})();
