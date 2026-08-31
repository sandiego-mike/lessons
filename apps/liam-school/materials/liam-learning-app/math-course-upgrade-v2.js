(function(){
'use strict';
if(typeof document==='undefined'||typeof S==='undefined') return;

const IS_MATH=()=>S.subject==='math'||S.subject==='math3';
const LABS={
  math:{
    1:['Equation Balance Lab','equation'],
    2:['Inequality Number-Line Lab','inequality'],
    3:['Linear Graph Lab','linear'],
    4:['Linear Forms & Sequences Lab','linear'],
    5:['Systems Graph Lab','systems'],
    6:['Exponential Graph Lab','exponential'],
    7:['Statistics Data Lab','statistics'],
    8:['Coordinate Geometry Lab','coordinate'],
    9:['Logic & Proof Lab','logic'],
    10:['Parallel & Perpendicular Lab','relation'],
    11:['Transformation Lab','transform'],
    12:['Triangle Geometry Lab','triangle']
  },
  math3:{
    1:['Polynomial Structure & Graph Lab','polynomial'],
    2:['Polynomial Zeros Lab','polynomial'],
    3:['Radicals & Function Transformations Lab','radical'],
    4:['Exponential & Geometric Model Lab','exponential'],
    5:['Logarithm Lab','logarithm'],
    6:['Rational Function Lab','rational'],
    7:['Statistics & Probability Lab','statistics'],
    8:['Triangle Modeling Lab','triangle'],
    9:['Trigonometry Graph Lab','trig']
  }
};
globalThis.__MATH_COURSE_LABS__=LABS;

const STYLE=`
#math-course-lab-v2{border:2px solid #9fc4df;background:#f9fcff}
#math-course-lab-v2 h2{margin:.1rem 0 .3rem}
#math-course-lab-v2 .lab-sub{color:#5b7085;margin:0 0 12px}
#math-course-lab-v2 .lab-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(250px,.8fr);gap:16px;align-items:start}
#math-course-lab-v2 .panel{display:flex;flex-direction:column;gap:10px}
#math-course-lab-v2 .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#math-course-lab-v2 label{font-weight:700}
#math-course-lab-v2 input,#math-course-lab-v2 select{min-height:42px;border:1px solid #b8cadb;border-radius:10px;padding:8px 10px;font-size:16px;background:white}
#math-course-lab-v2 input[type=range]{width:100%;padding:0;border:0}
#math-course-lab-v2 .readout{background:#edf7f4;color:#135e50;border-radius:11px;padding:10px;font-weight:750}
#math-course-lab-v2 .status{min-height:24px;font-weight:700}
#math-course-lab-v2 .good{color:#12684f}.bad{color:#984a26}
#math-course-lab-v2 svg.plot{width:100%;aspect-ratio:1/1;border:1px solid #bfd1df;border-radius:14px;background:#fff;touch-action:none;user-select:none}
#math-course-lab-v2 .gridline{stroke:#dce7ef;stroke-width:1}.axis{stroke:#17324f;stroke-width:2.4}
#math-course-lab-v2 .curve-a{stroke:#167a64;stroke-width:4;fill:none;stroke-linecap:round}.curve-b{stroke:#8457a8;stroke-width:4;fill:none;stroke-linecap:round}
#math-course-lab-v2 .dot{fill:#167a64;stroke:#fff;stroke-width:3}.hit{fill:transparent}.labtext{font-size:12px;fill:#17324f;font-weight:700}
.math-symbol-palette-v2{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.math-symbol-palette-v2 button{min-width:42px;min-height:36px;padding:5px 9px}
@media(max-width:760px){#math-course-lab-v2 .lab-grid{grid-template-columns:1fr}}
`;
if(!document.getElementById('math-course-v2-style')){
  const st=document.createElement('style'); st.id='math-course-v2-style'; st.textContent=STYLE; document.head.appendChild(st);
}

function fmt(n){n=Number(n);if(!Number.isFinite(n))return 'undefined';let v=Math.round(n*100)/100;return Number.isInteger(v)?String(v):String(v)}
function pretty(v){return String(v??'').replace(/<=/g,'≤').replace(/>=/g,'≥').replace(/!=/g,'≠').replace(/\bpi\b/gi,'π').replace(/sqrt/g,'√')}
function canonical(v){
  let s=String(v??'').toLowerCase().replace(/[−–—]/g,'-').replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/≠/g,'!=').replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/\s+/g,'');
  if(s.includes('or'))s=s.split('or').filter(Boolean).sort().join('or');
  if(s.includes('and'))s=s.split('and').filter(Boolean).sort().join('and');
  return s;
}
globalThis.__prettyMath=pretty;
globalThis.__canonicalMathAnswer=canonical;
if(typeof normalizedMathAnswer==='function') normalizedMathAnswer=function(v){return canonical(v)};

function beautify(root=document){
  if(!IS_MATH())return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(n){
    const p=n.parentElement;
    if(!p||['SCRIPT','STYLE','TEXTAREA','INPUT','OPTION'].includes(p.tagName))return NodeFilter.FILTER_REJECT;
    return NodeFilter.FILTER_ACCEPT;
  }});
  const nodes=[]; let n; while(n=walker.nextNode())nodes.push(n);
  nodes.forEach(x=>{const a=x.nodeValue||'',b=pretty(a);if(a!==b)x.nodeValue=b});
}
function insertAt(input,text){let a=input.selectionStart??input.value.length,b=input.selectionEnd??input.value.length;input.value=input.value.slice(0,a)+text+input.value.slice(b);input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();try{input.setSelectionRange(a+text.length,a+text.length)}catch(_){}}
function symbolPalettes(){
  if(!IS_MATH())return;
  document.querySelectorAll('input[type=text],textarea').forEach(input=>{
    if(input.dataset.mathSymbols||input.closest('#math-course-lab-v2'))return;
    if(!input.closest('.mental-drill,.guided-math-try,.worksheet-item,.check-grid,.guide-card'))return;
    input.dataset.mathSymbols='1';
    const row=document.createElement('div');row.className='math-symbol-palette-v2 no-print';
    ['≤','≥','≠','π','√','°','²','³'].forEach(sym=>{const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=sym;b.onclick=()=>insertAt(input,sym);row.appendChild(b)});
    input.insertAdjacentElement('afterend',row);
  });
}

function improveMentalChecker(){
  if(typeof checkMentalAnswer!=='function'||typeof mentalMathBank!=='function'||checkMentalAnswer.__v2)return;
  const upgraded=function(idx){
    let ch=chap(),bank=mentalMathBank(ch,idx),key=mentalKey(idx),state=saved[key]||{at:0,correct:0,attempts:0},at=Number(state.at||0)%bank.length,q=bank[at],input=document.getElementById('mental-answer'),given=canonical(input?.value),ok=q.answers.some(a=>canonical(a)===given),attempts=(state.attempts||0)+1;
    if(ok) state={...state,correct:(state.correct||0)+1,attempts,at:(at+1)%bank.length,feedback:'<div class="feedback correct"><strong>Correct.</strong><p>Good — now try another while the pattern is fresh.</p></div>'};
    else {
      const expected=canonical(q.answers[0]),parts=expected.split(/or|and/),givenParts=given.split(/or|and/);
      const partial=parts.length>1&&given&&givenParts.length<parts.length?'<p>You have one correct part, but the full compound solution needs every branch.</p>':'';
      state={...state,attempts,feedback:`<div class="feedback correction"><strong>Not yet.</strong>${partial}<ol>${q.steps.map(x=>`<li>${esc(pretty(x))}</li>`).join('')}</ol><p><strong>Correct answer:</strong> ${esc(pretty(q.answers[0]))}</p><button class="secondary" onclick="nextMentalProblem(${idx})">Try a similar problem</button></div>`};
    }
    saved[key]=state;save();render(false);
  };
  upgraded.__v2=true;checkMentalAnswer=upgraded;
}
improveMentalChecker();

const APPLY={
  1:'Verify the result by substitution, factoring, or a second representation.',
  2:'Verify one zero or solution using substitution or the Remainder Theorem.',
  3:'State the domain or inverse/composition check that confirms the result.',
  4:'Identify the growth factor, asymptote, or ratio that supports the model.',
  5:'Rewrite the logarithmic statement in exponential form and check the domain.',
  6:'State all restrictions and identify the relevant asymptote or hole.',
  7:'Interpret the statistic or probability in context and describe uncertainty.',
  8:'Name the geometry formula you chose and why the given information fits it.',
  9:'State the angle unit, reference angle/period, and one graph feature used to verify the answer.'
};
if(typeof guideFor==='function'&&!guideFor.__math3V2){
  const baseGuide=guideFor;
  const wrapped=function(ch){
    const g=baseGuide(ch);
    if(S.subject!=='math3'||!g||!Array.isArray(g.steps))return g;
    const apply=APPLY[Number(ch.number)]||'Verify the result using a second representation or independent check.';
    return {...g,steps:g.steps.map(st=>({...st,apply}))};
  };
  wrapped.__math3V2=true;guideFor=wrapped;
}

function courseLabel(){return S.subject==='math3'?'Integrated Math III':'Integrated Math I'}
function stateKey(){return `${S.subject}-${S.chapter}-course-tool-v2`}
function load(def){let r=saved[stateKey()];return r&&typeof r==='object'?{...def,...r}:{...def}}
function store(st){saved[stateKey()]={...st,updatedAt:new Date().toISOString()};if(typeof save==='function')save()}
function gridMarkup(){
  let out=[];
  for(let n=-5;n<=5;n++){let p=300+n*50;out.push(`<line class="gridline" x1="50" y1="${p}" x2="550" y2="${p}"/><line class="gridline" x1="${p}" y1="50" x2="${p}" y2="550"/>`)}
  return out.join('')+'<line class="axis" x1="50" y1="300" x2="550" y2="300"/><line class="axis" x1="300" y1="50" x2="300" y2="550"/>';
}
function svgPoint(x,y){return {x:300+x*50,y:300-y*50}}
function polyPath(fn){
  let d='',started=false;
  for(let px=-5;px<=5.0001;px+=.05){let y=fn(px);if(!Number.isFinite(y)||y<-5.5||y>5.5){started=false;continue}let p=svgPoint(px,y);d+=(started?' L ':' M ')+p.x+' '+p.y;started=true}
  return d;
}
function labHead(cfg,inner){return `<div class="eyebrow">${courseLabel()} · Chapter ${S.chapter}</div><h2>${cfg[0]}</h2><p class="lab-sub">Use the controls to test the chapter idea, then compare the visual with the algebra.</p>${inner}`}

function graphLab(card,cfg,type){
  let st=load({m:1,b:0,m2:-1,b2:0,a:1,g:2,h:0,k:0,amp:2,freq:1,phase:0});
  let controls='';
  if(type==='linear')controls=`<label>Slope m <input data-m type="range" min="-5" max="5" step=".5"></label><label>y-intercept b <input data-b type="range" min="-5" max="5" step=".5"></label>`;
  if(type==='systems'||type==='relation')controls=`<label>Line A slope <input data-m type="range" min="-5" max="5" step=".5"></label><label>Line A intercept <input data-b type="range" min="-5" max="5" step=".5"></label><label>Line B slope <input data-m2 type="range" min="-5" max="5" step=".5"></label><label>Line B intercept <input data-b2 type="range" min="-5" max="5" step=".5"></label>`;
  if(type==='exponential')controls=`<label>Initial value a <input data-a type="range" min=".5" max="5" step=".5"></label><label>Growth factor b <input data-g type="range" min=".25" max="3" step=".25"></label><label>Vertical shift k <input data-k type="range" min="-4" max="4" step=".5"></label>`;
  if(type==='polynomial')controls=`<label>Cubic coefficient a <input data-a type="range" min="-2" max="2" step=".25"></label><label>Vertical shift k <input data-k type="range" min="-4" max="4" step=".5"></label><label>Horizontal shift h <input data-h type="range" min="-3" max="3" step=".5"></label>`;
  if(type==='radical')controls=`<label>Horizontal shift h <input data-h type="range" min="-4" max="4" step=".5"></label><label>Vertical shift k <input data-k type="range" min="-4" max="4" step=".5"></label><label>Vertical scale a <input data-a type="range" min="-3" max="3" step=".5"></label>`;
  if(type==='logarithm')controls=`<label>Log base b <input data-g type="range" min="1.25" max="5" step=".25"></label><label>Horizontal shift h <input data-h type="range" min="-4" max="4" step=".5"></label><label>Vertical shift k <input data-k type="range" min="-4" max="4" step=".5"></label>`;
  if(type==='rational')controls=`<label>Vertical asymptote x=h <input data-h type="range" min="-4" max="4" step=".5"></label><label>Horizontal asymptote y=k <input data-k type="range" min="-4" max="4" step=".5"></label><label>Scale a <input data-a type="range" min="-4" max="4" step=".5"></label>`;
  if(type==='trig')controls=`<label>Amplitude A <input data-amp type="range" min=".5" max="4" step=".5"></label><label>Frequency B <input data-freq type="range" min=".5" max="3" step=".5"></label><label>Phase shift C <input data-phase type="range" min="-3.14" max="3.14" step=".26"></label><label>Midline D <input data-k type="range" min="-3" max="3" step=".5"></label>`;
  card.innerHTML=labHead(cfg,`<div class="lab-grid"><svg class="plot" viewBox="0 0 600 600">${gridMarkup()}<path class="curve-a" data-a-path/><path class="curve-b" data-b-path/></svg><div class="panel">${controls}<div class="readout" data-readout></div><div class="status" data-status></div></div></div>`);
  const bind=(name,key)=>{let el=card.querySelector(`[data-${name}]`);if(!el)return;el.value=st[key];el.oninput=()=>{st[key]=Number(el.value);draw()}};
  [['m','m'],['b','b'],['m2','m2'],['b2','b2'],['a','a'],['g','g'],['h','h'],['k','k'],['amp','amp'],['freq','freq'],['phase','phase']].forEach(x=>bind(x[0],x[1]));
  function draw(){
    let f=()=>0,g=null,read='';
    if(type==='linear'){f=x=>st.m*x+st.b;read=`y = ${fmt(st.m)}x ${st.b>=0?'+':'−'} ${fmt(Math.abs(st.b))}`}
    if(type==='systems'||type==='relation'){f=x=>st.m*x+st.b;g=x=>st.m2*x+st.b2;let relation=Math.abs(st.m-st.m2)<1e-9?'parallel':Math.abs(st.m*st.m2+1)<.02?'perpendicular':'neither';read=`A: y=${fmt(st.m)}x${st.b>=0?'+':''}${fmt(st.b)} · B: y=${fmt(st.m2)}x${st.b2>=0?'+':''}${fmt(st.b2)} · ${relation}`}
    if(type==='exponential'){f=x=>st.a*Math.pow(st.g,x)+st.k;read=`y = ${fmt(st.a)}(${fmt(st.g)})^x ${st.k>=0?'+':'−'} ${fmt(Math.abs(st.k))}; asymptote y=${fmt(st.k)}`}
    if(type==='polynomial'){f=x=>st.a*Math.pow(x-st.h,3)+st.k;read=`y = ${fmt(st.a)}(x−${fmt(st.h)})³ ${st.k>=0?'+':'−'} ${fmt(Math.abs(st.k))}`}
    if(type==='radical'){f=x=>x>=st.h?st.a*Math.sqrt(x-st.h)+st.k:NaN;read=`y = ${fmt(st.a)}√(x−${fmt(st.h)}) ${st.k>=0?'+':'−'} ${fmt(Math.abs(st.k))}; domain x ≥ ${fmt(st.h)}`}
    if(type==='logarithm'){f=x=>x>st.h?Math.log(x-st.h)/Math.log(st.g)+st.k:NaN;read=`y = log base ${fmt(st.g)}(x−${fmt(st.h)}) ${st.k>=0?'+':'−'} ${fmt(Math.abs(st.k))}; vertical asymptote x=${fmt(st.h)}`}
    if(type==='rational'){f=x=>Math.abs(x-st.h)<.03?NaN:st.a/(x-st.h)+st.k;read=`y = ${fmt(st.a)}/(x−${fmt(st.h)}) ${st.k>=0?'+':'−'} ${fmt(Math.abs(st.k))}; asymptotes x=${fmt(st.h)}, y=${fmt(st.k)}`}
    if(type==='trig'){f=x=>st.amp*Math.sin(st.freq*(x-st.phase))+st.k;read=`y = ${fmt(st.amp)} sin(${fmt(st.freq)}(x−${fmt(st.phase)})) ${st.k>=0?'+':'−'} ${fmt(Math.abs(st.k))}; period ≈ ${fmt(2*Math.PI/st.freq)}`}
    card.querySelector('[data-a-path]').setAttribute('d',polyPath(f));
    const bp=card.querySelector('[data-b-path]');if(g){bp.setAttribute('d',polyPath(g));bp.style.display=''}else bp.style.display='none';
    card.querySelector('[data-readout]').textContent=pretty(read); store(st);
  }
  draw();
}

function equationLab(card,cfg){
  let st=load({a:3,b:5,c:20,answer:''});
  card.innerHTML=labHead(cfg,`<div class="lab-grid"><div class="panel"><label>a <input data-a type="range" min="-6" max="6" step="1"></label><label>b <input data-b type="range" min="-12" max="12" step="1"></label><label>c <input data-c type="range" min="-30" max="30" step="1"></label><div class="readout" data-eq></div></div><div class="panel"><label>Solve for x <input data-answer type="text"></label><button class="primary" data-check>Check</button><div class="status" data-status></div></div></div>`);
  let a=card.querySelector('[data-a]'),b=card.querySelector('[data-b]'),c=card.querySelector('[data-c]'),ans=card.querySelector('[data-answer]');a.value=st.a;b.value=st.b;c.value=st.c;ans.value=st.answer;
  function draw(){st.a=Number(a.value)||1;st.b=Number(b.value);st.c=Number(c.value);st.answer=ans.value;card.querySelector('[data-eq]').textContent=`${fmt(st.a)}x ${st.b>=0?'+':'−'} ${fmt(Math.abs(st.b))} = ${fmt(st.c)}`;store(st)}
  [a,b,c,ans].forEach(x=>x.oninput=draw);card.querySelector('[data-check]').onclick=()=>{let target=(Number(c.value)-Number(b.value))/(Number(a.value)||1),got=Number(String(ans.value).replace(/^x\s*=\s*/i,'')),ok=Math.abs(got-target)<.01,el=card.querySelector('[data-status]');el.className='status '+(ok?'good':'bad');el.textContent=ok?'Correct — both sides balance.':`Not yet. Check the inverse steps; x = ${fmt(target)}.`};draw();
}
function inequalityLab(card,cfg){
  let st=load({n:2,op:'≤'});
  card.innerHTML=labHead(cfg,`<div class="lab-grid"><svg class="plot" viewBox="0 0 600 240"><line class="axis" x1="50" y1="120" x2="550" y2="120"/><line class="curve-a" data-shade y1="120" y2="120"/><circle data-end cy="120" r="10" stroke="#167a64" stroke-width="4"/></svg><div class="panel"><label>Boundary <input data-n type="range" min="-10" max="10" step="1"></label><div class="row">${['<','≤','>','≥'].map(op=>`<button class="secondary" data-op="${op}">${op}</button>`).join('')}</div><div class="readout" data-readout></div></div></div>`);
  let n=card.querySelector('[data-n]');n.value=st.n;
  function draw(){st.n=Number(n.value);let x=300+st.n*22,shade=card.querySelector('[data-shade]'),end=card.querySelector('[data-end]'),left=st.op.includes('<');shade.setAttribute('x1',left?50:x);shade.setAttribute('x2',left?x:550);end.setAttribute('cx',x);end.setAttribute('fill',st.op.includes('=')?'#167a64':'white');card.querySelector('[data-readout]').textContent=`x ${st.op} ${st.n}`;store(st)}
  n.oninput=draw;card.querySelectorAll('[data-op]').forEach(b=>b.onclick=()=>{st.op=b.dataset.op;draw()});draw();
}
function statisticsLab(card,cfg){
  let st=load({data:'4, 6, 8, 9, 13'});
  card.innerHTML=labHead(cfg,`<div class="panel"><label>Data values <input data-data type="text" value="${String(st.data).replace(/"/g,'&quot;')}"></label><button class="primary" data-run>Analyze data</button><div class="readout" data-readout></div></div>`);
  let input=card.querySelector('[data-data]');
  function run(){let a=input.value.split(/[,\s]+/).map(Number).filter(Number.isFinite).sort((x,y)=>x-y);if(!a.length)return;let mean=a.reduce((x,y)=>x+y,0)/a.length,mid=Math.floor(a.length/2),median=a.length%2?a[mid]:(a[mid-1]+a[mid])/2;card.querySelector('[data-readout]').textContent=`n=${a.length} · mean=${fmt(mean)} · median=${fmt(median)} · range=${fmt(a.at(-1)-a[0])}`;st.data=input.value;store(st)}card.querySelector('[data-run]').onclick=run;run();
}
function coordinateLab(card,cfg,type){
  let st=load({x1:-2,y1:1,x2:3,y2:4,dx:2,dy:-1,scale:2});
  card.innerHTML=labHead(cfg,`<div class="lab-grid"><svg class="plot" viewBox="0 0 600 600">${gridMarkup()}<circle class="dot" data-p1 r="9"/><circle class="dot" data-p2 r="9"/><circle class="dot" data-p3 r="9"/></svg><div class="panel"><label>x1 <input data-x1 type="range" min="-5" max="5" step=".5"></label><label>y1 <input data-y1 type="range" min="-5" max="5" step=".5"></label><label>x2 <input data-x2 type="range" min="-5" max="5" step=".5"></label><label>y2 <input data-y2 type="range" min="-5" max="5" step=".5"></label>${type==='transform'?'<label>Δx <input data-dx type="range" min="-5" max="5" step=".5"></label><label>Δy <input data-dy type="range" min="-5" max="5" step=".5"></label><label>Dilation scale <input data-scale type="range" min=".5" max="3" step=".5"></label>':''}<div class="readout" data-readout></div></div></div>`);
  let keys=['x1','y1','x2','y2','dx','dy','scale'];keys.forEach(k=>{let e=card.querySelector(`[data-${k}]`);if(e){e.value=st[k];e.oninput=()=>{st[k]=Number(e.value);draw()}}});
  function setDot(sel,x,y){let p=svgPoint(x,y),e=card.querySelector(sel);e.setAttribute('cx',p.x);e.setAttribute('cy',p.y)}
  function draw(){setDot('[data-p1]',st.x1,st.y1);setDot('[data-p2]',st.x2,st.y2);let dx=st.x2-st.x1,dy=st.y2-st.y1,dist=Math.hypot(dx,dy),mid=[(st.x1+st.x2)/2,(st.y1+st.y2)/2],txt=`midpoint (${fmt(mid[0])}, ${fmt(mid[1])}) · distance ${fmt(dist)} · slope ${Math.abs(dx)<1e-9?'undefined':fmt(dy/dx)}`;if(type==='transform'){let tx=st.x1*st.scale+st.dx,ty=st.y1*st.scale+st.dy;setDot('[data-p3]',tx,ty);txt=`Original (${fmt(st.x1)},${fmt(st.y1)}) → dilate ×${fmt(st.scale)}, translate (${fmt(st.dx)},${fmt(st.dy)}) → (${fmt(tx)},${fmt(ty)})`}else card.querySelector('[data-p3]').style.display='none';card.querySelector('[data-readout]').textContent=txt;store(st)}draw();
}
function logicLab(card,cfg){
  card.innerHTML=labHead(cfg,`<div class="panel"><label>Hypothesis p <input data-p type="text" value="an angle is a right angle"></label><label>Conclusion q <input data-q type="text" value="the angle measures 90 degrees"></label><button class="primary" data-run>Build related statements</button><div class="readout" data-readout></div></div>`);
  card.querySelector('[data-run]').onclick=()=>{let p=card.querySelector('[data-p]').value,q=card.querySelector('[data-q]').value;card.querySelector('[data-readout]').innerHTML=`Conditional: If ${p}, then ${q}.<br>Converse: If ${q}, then ${p}.<br>Inverse: If not ${p}, then not ${q}.<br>Contrapositive: If not ${q}, then not ${p}.`};card.querySelector('[data-run]').click();
}
function triangleLab(card,cfg){
  let st=load({a:7,b:10,C:60});
  card.innerHTML=labHead(cfg,`<div class="panel"><label>Side a <input data-a type="range" min="1" max="15" step=".5"></label><label>Side b <input data-b type="range" min="1" max="15" step=".5"></label><label>Included angle C <input data-c type="range" min="10" max="160" step="1"></label><div class="readout" data-readout></div></div>`);
  let a=card.querySelector('[data-a]'),b=card.querySelector('[data-b]'),c=card.querySelector('[data-c]');a.value=st.a;b.value=st.b;c.value=st.C;
  function draw(){st.a=Number(a.value);st.b=Number(b.value);st.C=Number(c.value);let r=st.C*Math.PI/180,third=Math.sqrt(st.a*st.a+st.b*st.b-2*st.a*st.b*Math.cos(r)),area=.5*st.a*st.b*Math.sin(r);card.querySelector('[data-readout]').textContent=`Third side c ≈ ${fmt(third)} · area ≈ ${fmt(area)} square units. Law of Cosines uses the two sides and included angle.`;store(st)}[a,b,c].forEach(x=>x.oninput=draw);draw();
}

function mountLab(){
  if(!IS_MATH()||S.view!=='chapter'||(S.tab&&S.tab!=='learn'))return;
  document.getElementById('math-course-lab')?.remove();
  document.getElementById('linear-graph-lab')?.remove();
  let cfg=LABS[S.subject]?.[Number(S.chapter)];if(!cfg)return;
  let existing=document.getElementById('math-course-lab-v2');if(existing){if(existing.dataset.subject===S.subject&&existing.dataset.chapter===String(S.chapter))return;existing.remove()}
  let anchor=document.querySelector('.guide-card,.mental-drill,.guided-start,.math-profile.compact,.card');if(!anchor)return;
  let card=document.createElement('div');card.id='math-course-lab-v2';card.className='card';card.dataset.subject=S.subject;card.dataset.chapter=String(S.chapter);anchor.insertAdjacentElement('afterend',card);
  let type=cfg[1];
  if(type==='equation')equationLab(card,cfg);
  else if(type==='inequality')inequalityLab(card,cfg);
  else if(['linear','systems','relation','exponential','polynomial','radical','logarithm','rational','trig'].includes(type))graphLab(card,cfg,type);
  else if(type==='statistics')statisticsLab(card,cfg);
  else if(type==='coordinate'||type==='transform')coordinateLab(card,cfg,type);
  else if(type==='logic')logicLab(card,cfg);
  else if(type==='triangle')triangleLab(card,cfg);
}
function schedule(){setTimeout(()=>{try{beautify();symbolPalettes();mountLab()}catch(e){console.error('Math course v2:',e)}},0)}
const root=document.getElementById('app')||document.body;
new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
window.addEventListener('hashchange',schedule);
schedule();
})();
