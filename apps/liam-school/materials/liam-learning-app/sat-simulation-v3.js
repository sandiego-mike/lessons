(()=>{
'use strict';
/* SAT simulation v3: fixes module timing/structure and provides deterministic QA harness.
   This augments the existing coach; it does not claim College Board official scoring. */
const SPEC={rw:{moduleQuestions:27,seconds:32*60},math:{moduleQuestions:22,seconds:35*60},breakSeconds:10*60,totalQuestions:98};
const DOMAINS={rw:['Information and Ideas','Craft and Structure','Expression of Ideas','Standard English Conventions'],math:['Algebra','Advanced Math','Problem-Solving and Data Analysis','Geometry and Trigonometry']};
function assert(c,m){if(!c)throw new Error(m)}
function route(correct,total){return correct/total>=.65?'hard':'standard'}
function estimate(sectionCorrect,total,route2){let pct=sectionCorrect/total;let base=200+Math.round(pct*600/10)*10;if(route2==='standard')base=Math.min(base,650);return Math.max(200,Math.min(800,base))}
function makeVariant(seed,subject,i,difficulty){
 if(subject==='math'){
  const a=2+(seed+i)%7,b=3+((seed*3+i)%9),x=2+((seed+i*2)%8),c=a*x+b;
  if(i%4===0)return{id:`m-${seed}-${i}`,domain:DOMAINS.math[i%4],type:'spr',q:`If ${a}x + ${b} = ${c}, what is x?`,answer:String(x),solve:`${a}x=${c-b}, so x=${x}.`,difficulty};
  const opts=[x-2,x-1,x,x+1].map(String);return{id:`m-${seed}-${i}`,domain:DOMAINS.math[i%4],type:'mc',q:`If ${a}x + ${b} = ${c}, what is x?`,o:opts,a:2,solve:`${a}x=${c-b}, so x=${x}.`,difficulty};
 }
 const bank=[
  ['Information and Ideas','A study found that students who reviewed material with short retrieval quizzes remembered more after four weeks than students who only reread notes. Which choice best states the finding?',['Rereading is always ineffective.','Retrieval practice was associated with better later retention.','All students prefer quizzes.','Four weeks is too long to study.'],1],
  ['Craft and Structure','The scientist described the result as “tentative.” As used here, “tentative” most nearly means',['uncertain','celebrated','permanent','obvious'],0],
  ['Expression of Ideas','The first trial failed to detect a difference. _____, the researchers increased the sample size and repeated the trial.',['For example','Therefore','Similarly','Meanwhile'],1],
  ['Standard English Conventions','The collection of samples, along with the field notes, _____ stored securely.',['are','were','is','have'],2]
 ][i%4];
 return{id:`r-${seed}-${i}`,domain:bank[0],type:'mc',q:bank[1],o:bank[2],a:bank[3],solve:`Correct answer: ${bank[2][bank[3]]}.`,difficulty};
}
function module(seed,subject,difficulty){let n=SPEC[subject].moduleQuestions;return Array.from({length:n},(_,i)=>makeVariant(seed,subject,i,difficulty))}
function buildTest(seed=1,path={rw:'hard',math:'hard'}){return{rw1:module(seed,'rw','mixed'),rw2:module(seed+101,'rw',path.rw),math1:module(seed+202,'math','mixed'),math2:module(seed+303,'math',path.math)}}
function validateQuestion(q){assert(q.id&&q.q&&q.domain,'missing required question fields');assert(['mc','spr'].includes(q.type),'bad response type');if(q.type==='mc'){assert(Array.isArray(q.o)&&q.o.length===4,'MC must have four choices');assert(Number.isInteger(q.a)&&q.a>=0&&q.a<4,'bad answer key');assert(new Set(q.o).size===4,'duplicate choices')}else assert(q.answer!==undefined&&String(q.answer).trim()!=='','SPR answer missing');assert(q.solve&&q.solve.length>4,'explanation missing');}
function simulate(seed,pattern){let t=buildTest(seed);Object.values(t).flat().forEach(validateQuestion);let rw1=pattern==='perfect'?27:pattern==='zero'?0:(seed%28),math1=pattern==='perfect'?22:pattern==='zero'?0:(seed%23);let rr=route(rw1,27),mr=route(math1,22);let rw2=pattern==='perfect'?27:pattern==='zero'?0:Math.min(27,(seed*7)%28),math2=pattern==='perfect'?22:pattern==='zero'?0:Math.min(22,(seed*5)%23);return{rr,mr,rw:estimate(rw1+rw2,54,rr),math:estimate(math1+math2,44,mr),totalQuestions:Object.values(t).reduce((n,a)=>n+a.length,0)}}
function qa(){let checks=[];const ok=(name,fn)=>{try{fn();checks.push({name,pass:true})}catch(e){checks.push({name,pass:false,error:e.message})}};
 ok('spec total 98',()=>assert(SPEC.totalQuestions===98,'total'));
 ok('RW module 27',()=>assert(SPEC.rw.moduleQuestions===27,'rw count'));
 ok('Math module 22',()=>assert(SPEC.math.moduleQuestions===22,'math count'));
 ok('RW timer 32m',()=>assert(SPEC.rw.seconds===1920,'rw timer'));
 ok('Math timer 35m',()=>assert(SPEC.math.seconds===2100,'math timer'));
 ok('break 10m',()=>assert(SPEC.breakSeconds===600,'break'));
 for(let i=1;i<=100;i++)ok(`simulation ${i}`,()=>{let p=i%10===0?'perfect':i%11===0?'zero':'mixed',r=simulate(i,p);assert(r.totalQuestions===98,'wrong generated count');assert(r.rw>=200&&r.rw<=800,'rw score bounds');assert(r.math>=200&&r.math<=800,'math score bounds');if(p==='perfect')assert(r.rw===800&&r.math===800,'perfect must estimate 800/800');if(p==='zero')assert(r.rw===200&&r.math===200,'zero must estimate 200/200')});
 let sample=buildTest(42);ok('all 98 questions validate',()=>Object.values(sample).flat().forEach(validateQuestion));
 ok('student-produced math present',()=>assert(sample.math1.concat(sample.math2).some(q=>q.type==='spr'),'no SPR'));
 ok('MC math present',()=>assert(sample.math1.concat(sample.math2).some(q=>q.type==='mc'),'no MC'));
 ok('adaptive hard route',()=>assert(route(20,27)==='hard','hard route'));
 ok('adaptive standard route',()=>assert(route(5,27)==='standard','standard route'));
 let passed=checks.filter(x=>x.pass).length;return{passed,total:checks.length,failed:checks.filter(x=>!x.pass),checks};}
window.SATSimulationV3={SPEC,buildTest,route,estimate,simulate,qa};
window.runSAT100QA=qa;
})();