(function(){
'use strict';
if(typeof S==='undefined'||typeof guideFor!=='function')return;

const GENERIC=/chapter term|should use to explain|specific place, region, pattern|human-environment relationship|matching chapter|use this word to explain|use this concept in a real chapter example|this section is about this concept/i;
const ARTIFACT=/A Geographic View|Places to Locate|Key terms for this section|National Geographic|Reading Essentials|Study Guide|Review Vocabulary|In this section you will learn|Young and old flock|Figure\s+\d|page\s+\d+|©|copyright|www\.|January\s+19\d\d/i;
const GEO_DEFS={
  'death rate':['The number of deaths per year for every 1,000 people in a population.','A lower death rate can contribute to population growth when the birthrate stays higher.'],
  'birthrate':['The number of births per year for every 1,000 people in a population.','A country with many births relative to deaths can experience rapid natural population growth.'],
  'natural increase':['Population growth that results when the birthrate is higher than the death rate, not counting migration.','If a country has a birthrate of 24 per 1,000 and a death rate of 8 per 1,000, its natural increase is 16 per 1,000.'],
  'doubling time':['The number of years it takes a population growing at its current rate to double in size.','A faster population growth rate produces a shorter doubling time.'],
  'population distribution':['The pattern showing where people live across an area.','World population is unevenly distributed because water, climate, land, jobs, transportation, and history affect settlement.'],
  'population density':['The average number of people living in a given unit of area, such as a square mile or square kilometer.','A crowded urban area generally has a higher population density than a sparsely settled desert.'],
  'migration':['The movement of people from one place to another with the intention of changing where they live.','People may migrate because of jobs, conflict, family, resources, or environmental conditions.'],
  'immigration':['Movement into a country or region to live there.','A person who moves into another country is an immigrant to the destination country.'],
  'emigration':['Movement out of a country or region to live somewhere else.','A person leaving a country to settle elsewhere is emigrating from the country of origin.'],
  'urbanization':['The growth of cities and the increase in the share of people living in urban areas.','Urbanization often grows as people move toward cities for jobs, services, education, and transportation.'],
  'refugee':['A person forced to leave home because of war, persecution, disaster, or another serious threat.','Refugee movements can rapidly change population patterns in both origin and destination regions.'],
  'culture':['The shared beliefs, customs, language, knowledge, arts, and ways of life of a group of people.','Language, religion, food, music, and traditions are cultural traits.'],
  'population':['The people living in a particular place or area.','Geographers compare populations by size, density, distribution, growth, and movement.'],
  'standard of living':['A measure of material well-being based on factors such as income, housing, food, health care, and access to goods and services.','Two countries can have different standards of living even when their populations are similar in size.'],
  'life expectancy':['The average number of years a person in a population is expected to live.','Life expectancy often reflects health care, nutrition, sanitation, income, and safety conditions.'],
  'literacy rate':['The percentage of people in a population who can read and write at a specified level.','Literacy rates are often used as one indicator of education and development.'],
  'gross domestic product':['The total value of goods and services produced within a country during a given period.','GDP is one measure geographers and economists use when comparing national economies.'],
  'per capita':['For each person; a total amount divided by the number of people.','GDP per capita divides a country’s economic output by its population to make comparisons easier.']
};

function clean(v){return String(v||'').replace(/\s+/g,' ').trim()}
function norm(v){return clean(v).toLowerCase().replace(/[“”‘’]/g,"'").replace(/[^a-z0-9]+/g,' ').trim()}
function escapeRe(v){return String(v).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function badDefinition(v){const s=clean(v);return !s||s.length<18||GENERIC.test(s)||ARTIFACT.test(s)}

try{
  if(typeof TERM_DEFS!=='undefined'){
    TERM_DEFS.geography=TERM_DEFS.geography||{};
    for(const [term,pair] of Object.entries(GEO_DEFS))TERM_DEFS.geography[term]=pair;
  }
}catch(_){ }

function rawVocabularyDefinition(ch,term){
  const key=norm(term);
  const item=(ch.vocabulary||[]).find(v=>norm(v?.term||v)===key);
  if(!item||typeof item!=='object')return '';
  for(const field of ['definition','shortDefinition','meaning','description','fullExplanation']){
    const value=clean(item[field]);
    if(!badDefinition(value)&&!norm(value).startsWith(key+' is a chapter term'))return value;
  }
  return '';
}
function definingSentence(ch,term){
  const key=norm(term),re=escapeRe(clean(term));
  const defineRe=new RegExp(`(?:^|[.!?]\\s+)(?:the\\s+)?${re}\\s+(?:is|are|means|refers to|describes|measures|is defined as)\\s+([^.!?]{15,220})[.!?]`,'i');
  for(const section of ch.sections||[]){
    for(const raw of section.blocks||[]){
      const text=clean(typeof cleanStudentText==='function'?cleanStudentText(raw):raw);
      const m=(' '+text).match(defineRe);
      if(m){const value=clean(m[1]);if(!badDefinition(value)&&!norm(value).includes(key+' is a chapter term'))return value.replace(/^[,:;\-–—\s]+/,'')+'.'}
    }
  }
  return '';
}
function realDefinition(ch,term){
  const key=norm(term);
  if(GEO_DEFS[key])return GEO_DEFS[key][0];
  try{
    const known=typeof TERM_DEFS!=='undefined'?TERM_DEFS.geography?.[key]?.[0]:'';
    if(!badDefinition(known))return clean(known);
  }catch(_){ }
  const raw=rawVocabularyDefinition(ch,term);if(raw)return raw;
  return definingSentence(ch,term);
}

function sentenceCandidates(text){
  text=clean(text).replace(/\s*Key terms for this section:.*$/i,'');
  const out=[];
  for(let sentence of text.split(/(?<=[.!?])\s+/)){
    sentence=clean(sentence);
    if(sentence.length<45||sentence.length>260||sentence.includes('?')||ARTIFACT.test(sentence)||GENERIC.test(sentence))continue;
    if(/^[A-Z][A-Za-z ]{2,35}$/.test(sentence))continue;
    if(/^[A-Z][A-Za-z ]{2,50}\s+[A-Z][A-Za-z ]{2,50}$/.test(sentence)&&!/[,.]/.test(sentence))continue;
    out.push(sentence);
  }
  return out;
}
function sourceFacts(ch,index){
  const section=(ch.sections||[])[index];if(!section)return [];
  const facts=[],seen=new Set();
  for(const raw of section.blocks||[]){
    const text=clean(typeof cleanStudentText==='function'?cleanStudentText(raw):raw);
    if(!text||GENERIC.test(text))continue;
    for(const sentence of sentenceCandidates(text)){
      const key=norm(sentence).slice(0,120);if(seen.has(key))continue;seen.add(key);
      facts.push(sentence);if(facts.length===4)return facts;
    }
  }
  return facts;
}
function cleanExistingLearn(text){
  let s=clean(text).replace(/^From the chapter PDF:\s*/i,'');
  s=s.replace(/\s*Key terms for this section:.*$/i,'');
  s=s.replace(/\b\w[\w -]{1,40}\s+is a chapter term\s+\w+\s+should use to explain a specific place, region, pattern, map, or human-environment relationship\.?/gi,'');
  const facts=sentenceCandidates(s);
  return facts.length?facts.slice(0,4).join(' '):clean(s.replace(ARTIFACT,''));
}
function cleanLesson(ch,st,index){
  if(st?.vocabularyCheck||ch.number===3||index>=(ch.sections||[]).length)return st;
  const facts=sourceFacts(ch,index);
  let lesson=facts.length>=2?facts.join(' '):cleanExistingLearn(st.learn);
  if(lesson.length>950)lesson=lesson.slice(0,950).replace(/\s+\S*$/,'')+'…';
  if(!lesson)return st;
  return {...st,learn:`From the chapter PDF: ${lesson}`,see:facts.length?facts.slice(0,4):st.see};
}
function rebuildVocabulary(ch,st){
  if(!st?.vocabularyCheck||!st.sort)return st;
  const oldGroups=st.sort.groups||[],byId=new Map(oldGroups.map(g=>[g.id,g])),entries=[],seen=new Set();
  const add=term=>{
    term=clean(term);const key=norm(term);if(!term||seen.has(key))return;
    const definition=realDefinition(ch,term);if(badDefinition(definition)||norm(definition).includes(key))return;
    seen.add(key);entries.push({term,definition});
  };
  for(const item of st.sort.items||[])add(byId.get(item.correctGroupId)?.label);
  for(const raw of ch.vocabulary||[]){if(entries.length>=10)break;add(raw?.term||raw)}
  if(entries.length<4)return {...st,sort:{...st.sort,groups:[],items:[]},learn:'Vocabulary Check is unavailable for this chapter until four verified definitions are present.'};
  const base=`geography-${ch.number}-verified-vocab`,groups=entries.map((e,i)=>({id:`${base}-g${i}`,label:e.term,description:'Match the verified chapter definition.'}));
  let items=entries.map((e,i)=>({id:`${base}-i${i}`,label:e.definition,correctGroupId:groups[i].id}));
  const shift=Math.min(3,items.length-1);items=items.slice(shift).concat(items.slice(0,shift));
  return {...st,learn:`Vocabulary Check: match each verified Chapter ${ch.number} meaning to the correct term.`,sort:{...st.sort,id:base,groups,items}};
}

const baseGuideFor=guideFor;
guideFor=function(ch){
  const guide=baseGuideFor(ch);if(S.subject!=='geography'||!guide?.steps)return guide;
  return {...guide,steps:guide.steps.map((st,i)=>rebuildVocabulary(ch,cleanLesson(ch,st,i)))};
};

globalThis.__auditGeographyStudentQualityV3=function(){
  const previous=S.subject;S.subject='geography';const rows=[];
  for(const ch of S.data?.geography?.chapters||[]){
    const g=guideFor(ch),lessonSteps=(g.steps||[]).filter((s,i)=>!s.vocabularyCheck&&i<(ch.sections||[]).length&&ch.number!==3),v=(g.steps||[]).find(s=>s.vocabularyCheck),defs=v?.sort?.items||[];
    rows.push({chapter:ch.number,genericLesson:lessonSteps.filter(s=>GENERIC.test(s.learn)||/Key terms for this section/i.test(s.learn)).length,artifactLesson:lessonSteps.filter(s=>ARTIFACT.test(s.learn)).length,vocab:defs.length,badVocab:defs.filter(x=>badDefinition(x.label)).length});
  }
  S.subject=previous;return {rows,passed:rows.length===34&&rows.every(r=>r.genericLesson===0&&r.artifactLesson===0&&r.vocab>=4&&r.badVocab===0)};
};

try{if(S.subject==='geography'&&S.view==='chapter'&&typeof render==='function')render(false)}catch(e){console.error('Geography student quality v3:',e)}
})();
