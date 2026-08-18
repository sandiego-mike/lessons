(function(global){
  const DAY_MS=86400000;
  const CALENDAR={
    first:'2026-08-10',
    semester1End:'2026-12-18',
    semester2Start:'2027-01-04',
    last:'2027-05-25',
    breaks:[
      ['2026-11-23','2026-11-27','Fall Break'],
      ['2026-12-21','2027-01-01','Winter Break'],
      ['2027-03-22','2027-04-02','Spring Break']
    ],
    noSchool:[
      ['2026-09-07','Labor Day'],
      ['2026-10-12','No school'],
      ['2026-11-11','Veterans Day'],
      ['2027-01-18','Martin Luther King Jr. Day'],
      ['2027-02-15','Presidents Day'],
      ['2027-05-31','Memorial Day']
    ]
  };
  const SUBJECT_DEFAULTS={biology:{weekday:2,label:'Biology Day'},geography:{weekday:4,label:'World Geography Day'},math:{weekday:1,label:'Integrated Math I Day'}};
  const REVIEW_RESERVE=4;
  function date(s){const [y,m,d]=String(s).split('-').map(Number);return new Date(Date.UTC(y,m-1,d))}
  function iso(d){return d.toISOString().slice(0,10)}
  function addDays(d,n){return new Date(d.getTime()+n*DAY_MS)}
  function between(value,start,end){return value>=start&&value<=end}
  function isWeekday(d){const w=d.getUTCDay();return w>=1&&w<=5}
  function noSchoolReason(day,calendar=CALENDAR,extra=[]){for(const [s,e,name] of calendar.breaks){if(between(day,s,e))return name}for(const [s,name] of calendar.noSchool){if(day===s)return name}for(const item of extra){if(day===(Array.isArray(item)?item[0]:item.date))return Array.isArray(item)?item[1]:(item.reason||'Parent skipped day')}return ''}
  function instructionalDates(calendar=CALENDAR,extra=[]){let out=[];for(let d=date(calendar.first),last=date(calendar.last);d<=last;d=addDays(d,1)){let s=iso(d);if(isWeekday(d)&&!noSchoolReason(s,calendar,extra))out.push(s)}return out}
  function semesterOf(day){return day<=CALENDAR.semester1End?1:day>=CALENDAR.semester2Start?2:0}
  function subjectDates(subject,calendar=CALENDAR,extra=[],weekday){let w=weekday??SUBJECT_DEFAULTS[subject].weekday;return instructionalDates(calendar,extra).filter(s=>date(s).getUTCDay()===w)}
  function validBiologyChapters(chapters){return chapters.map(c=>c.number).filter(n=>n!==16).sort((a,b)=>a-b)}
  function chapterComplexity(ch,subject){if(subject!=='biology')return 'STANDARD';let n=ch.number;let dense=[6,7,8,9,10,11,12,13,15];let standard=[3,4,5,14,17];if(dense.includes(n))return 'DENSE';if(standard.includes(n))return 'STANDARD';let concepts=(ch.vocabulary?.length||0)+(ch.sections?.length||0)*2+(ch.objectives?.length||0);return concepts>24?'DENSE':concepts>14?'STANDARD':'LIGHT'}
  function biologySessionsFor(ch,mastery){let cx=chapterComplexity(ch,'biology');let base=cx==='LIGHT'?1:cx==='STANDARD'?2:3;let key='biology-'+ch.number+'-mastery';let score=Number(mastery?.[key]||0);let misconception=mastery?.['biology-'+ch.number+'-core-misconception'];return score>=80&&!misconception?0:base}
  function biologySessionPlan(target,saved,available){let rows=target.map(ch=>({ch,count:biologySessionsFor(ch,saved),complexity:chapterComplexity(ch,'biology')}));let total=()=>rows.reduce((n,r)=>n+r.count,0);while(total()>available){let dense=rows.find(r=>r.count>2&&!saved?.['biology-'+r.ch.number+'-core-misconception']);if(dense){dense.count--;continue}let standard=rows.find(r=>r.count>1&&!saved?.['biology-'+r.ch.number+'-core-misconception']);if(standard){standard.count--;continue}break}return rows}
  function currentChapter(subject,course,saved){let first=subject==='biology'?validBiologyChapters(course.chapters)[0]:course.chapters[0].number;let n=Number(saved?.[subject+'-current']||first);if(subject==='biology'&&n===16)n=17;return course.chapters.find(c=>c.number===n)||course.chapters.find(c=>c.number===first)||course.chapters[0]}
  function semesterTargets(subject){return subject==='biology'?{1:'Chapters 1-8',2:'Chapters 9-15 and 17'}:subject==='math'?{1:'Chapters 1-6',2:'Chapters 7-12'}:{1:'Approximately chapters 1-17',2:'Approximately chapters 18-34'}}
  function scheduledUnits(subject,course,saved={},options={}){
    let extra=options.extraNoSchool||[];
    let dates=subjectDates(subject,CALENDAR,extra,options.weekday);
    let chapters=subject==='biology'?course.chapters.filter(c=>c.number!==16):course.chapters.slice();
    let plans=[];
    for(const sem of [1,2]){
      let semDates=dates.filter(d=>semesterOf(d)===sem);
      let review=semDates.slice(Math.max(0,semDates.length-REVIEW_RESERVE));
      let learning=semDates.slice(0,Math.max(0,semDates.length-REVIEW_RESERVE));
      let target=subject==='biology'
        ?(sem===1?chapters.filter(c=>c.number>=1&&c.number<=8):chapters.filter(c=>(c.number>=9&&c.number<=15)||c.number===17))
        :subject==='math'
          ?(sem===1?chapters.filter(c=>c.number>=1&&c.number<=6):chapters.filter(c=>c.number>=7&&c.number<=12))
          :(sem===1?chapters.filter(c=>c.number>=1&&c.number<=17):chapters.filter(c=>c.number>=18&&c.number<=34));
      let i=0;
      if(subject==='geography'||subject==='math'){
        for(const ch of target){
          let date=learning[Math.min(i,Math.max(0,learning.length-1))];
          if(!date)break;
          plans.push({date,subject,semester:sem,chapter:ch.number,title:ch.title,type:'chapter',part:subject==='math'?'Concept practice day':i<learning.length?'Full chapter':'Short paired chapter',status:'planned'});
          i++;
        }
      }else{
        for(const row of biologySessionPlan(target,saved,learning.length)){
          if(row.count===0)continue;
          for(let part=1;part<=row.count&&i<learning.length;part++){
            plans.push({date:learning[i++],subject,semester:sem,chapter:row.ch.number,title:row.ch.title,type:'chapter',part:row.count===1?'Mastery day':`Part ${part} of ${row.count}`,complexity:row.complexity,status:'planned'});
          }
        }
      }
      review.forEach((d,idx)=>plans.push({date:d,subject,semester:sem,type:['review','targeted-review','practice-final','final'][idx]||'review',title:['Retrieval review','Targeted weak-area review','Practice final','Semester final'][idx]||'Review',status:'reserved'}));
    }
    return plans;
  }
  function nextValidBiologyChapter(n){return n>=15?17:n+1}
  function validate(subject,course,plans){let issues=[];let chapters=course.chapters.map(c=>c.number);if(subject==='biology'){if(plans.some(p=>p.chapter===16))issues.push('Biology Chapter 16 was scheduled.');if(chapters.includes(17)&&!plans.some(p=>p.chapter===17))issues.push('Biology Chapter 17 is omitted from the year plan.');if(plans.some(p=>p.chapter>17))issues.push('Biology scheduled a nonexistent chapter.')}else if(subject==='math'){if(plans.some(p=>p.chapter>12))issues.push('Math scheduled more chapters than exist.')}else{if(plans.some(p=>p.chapter>34))issues.push('Geography scheduled more chapters than exist.')}for(const sem of [1,2]){let reserved=plans.filter(p=>p.semester===sem&&p.status==='reserved');if(reserved.length<REVIEW_RESERVE)issues.push(`${subject} semester ${sem} has less than ${REVIEW_RESERVE} reserved review/final days.`)}let keys=new Set();for(const p of plans.filter(p=>p.type==='chapter')){let key=[p.subject,p.date,p.chapter,p.part].join('|');if(keys.has(key))issues.push('Duplicate chapter assignment detected.');keys.add(key);if(noSchoolReason(p.date))issues.push('Mandatory work assigned on no-school day '+p.date)}return issues}
  function summary(subject,course,saved={},options={}){let plans=scheduledUnits(subject,course,saved,options);let current=currentChapter(subject,course,saved);let today=options.today||CALENDAR.first;let currentPlan=plans.find(p=>p.chapter===current.number)||plans.find(p=>p.type==='chapter');let mastery=Number(saved?.[subject+'-'+current.number+'-mastery']||0);let misconceptionKey=Object.keys(saved||{}).find(k=>k.startsWith(subject+'-')&&k.endsWith('-core-misconception')&&saved[k]);let status=subject==='biology'&&((mastery>0&&mastery<80)||misconceptionKey)?'Continue current chapter with targeted review':'On Track';return {subject,current,currentPlan,plans,targets:semesterTargets(subject),validations:validate(subject,course,plans),instructionalDates:instructionalDates(CALENDAR,options.extraNoSchool||[]),subjectDates:subjectDates(subject,CALENDAR,options.extraNoSchool||[],options.weekday),today,status,mastery}}
  function runTests(data){let saved={};let bio=data.biology,geo=data.geography;let normalBio=summary('biology',bio,saved);let normalGeo=summary('geography',geo,saved);let holidayBio=summary('biology',bio,saved,{extraNoSchool:[['2026-08-11','Test Biology holiday']]});let denseSaved={'biology-6-mastery':20,'biology-6-core-misconception':true};let dense=scheduledUnits('biology',bio,denseSaved).filter(p=>p.chapter===6);let next=nextValidBiologyChapter(15);let semGeo=normalGeo.plans.filter(p=>p.semester===1&&p.type==='chapter').map(p=>p.chapter).pop();let geoEnd=normalGeo.plans.some(p=>p.chapter===35);let failSaved={'biology-2-mastery':65,'biology-2-core-misconception':true};let fail=summary('biology',bio,failSaved).status;return [
    ['normal school year progression',normalBio.validations.length===0&&normalGeo.validations.length===0],
    ['biology holiday creates no overdue debt',holidayBio.validations.every(x=>!String(x).includes('no-school'))],
    ['dense Biology chapter can take three sessions',dense.length>=3],
    ['Biology Chapter 15 advances to 17',next===17],
    ['Geography semester 1 reaches about Chapter 17',semGeo>=16&&semGeo<=17],
    ['Geography never creates Chapter 35',!geoEnd],
    ['Biology core misconception continues chapter',/targeted review/i.test(fail)],
    ['pacing state can persist from saved progress',currentChapter('biology',bio,{'biology-current':2}).number===2]
  ].map(([name,pass])=>({name,pass}))}
  const api={CALENDAR,SUBJECT_DEFAULTS,REVIEW_RESERVE,instructionalDates,subjectDates,semesterTargets,chapterComplexity,scheduledUnits,currentChapter,nextValidBiologyChapter,validate,summary,runTests};
  global.LiamPacing=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
