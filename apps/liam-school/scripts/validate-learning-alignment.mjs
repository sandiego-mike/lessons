import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "materials", "liam-learning-app");
const appJs = readFileSync(path.join(appDir, "app.js"), "utf8");
const dataJs = readFileSync(path.join(appDir, "data-inline.js"), "utf8");

const store = new Map();
const context = {
  console,
  TextEncoder,
  Blob: class Blob {},
  URL: { createObjectURL: () => "blob:test", revokeObjectURL: () => {} },
  localStorage: {
    getItem: (key) => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
  },
  document: { getElementById: () => null, querySelectorAll: () => [], querySelector: () => null },
  location: { hash: "" },
  history: { pushState: () => {}, replaceState: () => {} },
  window: {},
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(dataJs, context, { filename: "data-inline.js" });

const validator = `
S.data=window.__LIAM_COURSE_DATA__;
const genericPatterns=[
  /A houseplant normally sits near a sunny window/i,
  /houseplant is moved from a sunny window into a dark closet/i,
  /Use biology to/i,
  /Use geography to/i,
  /Connect biology to evidence/i,
  /Connect geography to evidence/i,
  /^Make a prediction\\.?$/i,
  /^Explain cause and effect\\.?$/i,
  /^Apply what you learned\\.?$/i,
  /North Carolina Objectives|Foldable|STEP\\s+\\d|Using Prior Knowledge|Organizing Your Notes|Review Vocabulary/i
];
const rows=[], issues=[];
function words(value){return String(value||'').toLowerCase().match(/[a-z0-9]+/g)||[]}
function overlap(a,b){const A=new Set(words(a)),B=new Set(words(b));let n=0;for(const w of A)if(B.has(w))n++;return n}
function addIssue(row,msg){issues.push({...row,msg})}
for (const subject of ["biology","geography"]) {
  S.subject=subject;
  const course=S.data[subject];
  for (const chapter of course.chapters) {
    S.chapter=chapter.number;
    for (const [index,section] of (chapter.sections||[]).entries()) {
      const meta=sectionMeta(chapter,section,index);
      const activity=alignedActivity(meta,chapter);
      const lesson=sectionBlocks(chapter,section,index).join(" ");
      const row={subject,chapter:chapter.number,section:meta.section,title:meta.title,activityId:activity.activityId,conceptId:activity.conceptId,objectiveId:activity.learningObjectiveId,scenario:activity.scenario,prompt:activity.question,apply:activity.apply,interactionType:activity.interactionType};
      rows.push(row);
      if(!activity.activityId||!activity.conceptId||!activity.learningObjectiveId)addIssue(row,"orphan activity metadata");
      if(!meta.coreConcepts.includes(activity.conceptId))addIssue(row,"activity concept is not approved for section");
      if(!activity.apply||activity.apply.length<25)addIssue(row,"missing or weak Apply activity");
      if(!activity.question||activity.question.length<25)addIssue(row,"missing or weak Try question");
      if(genericPatterns.some(p=>p.test(activity.scenario)||p.test(activity.question)||p.test(activity.apply)||p.test(lesson)))addIssue(row,"generic or source-artifact text");
      if(overlap(meta.title+" "+meta.coreConcepts.join(" ")+" "+lesson, activity.scenario+" "+activity.question+" "+activity.apply)<2)addIssue(row,"low semantic overlap between section and activity");
    }
    const sectionConcepts=new Set((chapter.sections||[]).map((section,index)=>sectionMeta(chapter,section,index).conceptId));
    worksheetItems(chapter).forEach((item,i)=>{if(item.conceptId&&!sectionConcepts.has(item.conceptId)&&!String(item.conceptId).startsWith("source")&&!String(item.conceptId).startsWith("term"))issues.push({subject,chapter:chapter.number,section:"worksheet",activityId:"worksheet-"+i,conceptId:item.conceptId,msg:"worksheet concept not taught in chapter sections"})});
    knowledgeItems(chapter).forEach((item,i)=>{if(item.conceptId&&!sectionConcepts.has(item.conceptId)&&!String(item.conceptId).startsWith("guided")&&!String(item.conceptId).startsWith("term"))issues.push({subject,chapter:chapter.number,section:"knowledge-check",activityId:"check-"+i,conceptId:item.conceptId,msg:"knowledge-check concept not taught in chapter sections"})});
  }
}
const duplicates=new Map();
for(const row of rows){const key=row.scenario.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();if(!duplicates.has(key))duplicates.set(key,[]);duplicates.get(key).push(row)}
for(const group of duplicates.values()){
  const concepts=new Set(group.map(x=>x.conceptId));
  if(group.length>1&&concepts.size>1)group.forEach(row=>addIssue(row,"duplicate scenario reused across unrelated concepts"));
}
globalThis.__alignmentRows=rows;
globalThis.__alignmentIssues=issues;
`;

vm.runInContext(appJs.replace(/\nboot\(\);\s*$/, "") + validator, context, { filename: "learning-alignment-validation.js" });

const rows = context.__alignmentRows || [];
const issues = context.__alignmentIssues || [];
const bySubject = {};
for (const row of rows) {
  bySubject[row.subject] ||= { sections: 0, activities: 0 };
  bySubject[row.subject].sections++;
  bySubject[row.subject].activities++;
}
for (const subject of ["biology", "geography"]) {
  const s = bySubject[subject] || { sections: 0, activities: 0 };
  console.log(`${subject}: ${s.sections} sections reviewed, ${s.activities} aligned activities reviewed`);
}
console.log("math: 0 units reviewed, 0 activities reviewed (no Integrated Math I content is implemented in this app folder)");
const duplicateCount = rows.length - new Set(rows.map((row) => row.scenario.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())).size;
console.log(`duplicate activity scenarios found: ${duplicateCount}`);

if (issues.length) {
  for (const issue of issues.slice(0, 40)) {
    console.error(`FAIL ${issue.subject} chapter ${issue.chapter} section ${issue.section} ${issue.activityId}: ${issue.msg} (${issue.conceptId})`);
  }
  console.error(`Alignment validation failed with ${issues.length} issue(s).`);
  process.exit(1);
}
console.log("Alignment validation: PASS");
