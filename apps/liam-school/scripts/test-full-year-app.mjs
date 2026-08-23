import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const appUrl = new URL("../materials/liam-learning-app/app.js", import.meta.url);
const dataUrl = new URL("../materials/liam-learning-app/data/course-data.json", import.meta.url);
const pacingUrl = new URL("../materials/liam-learning-app/pacing.js", import.meta.url);
const inlineUrl = new URL("../materials/liam-learning-app/data-inline.js", import.meta.url);
const [source, pacing, inline, data] = await Promise.all([
  readFile(appUrl, "utf8"),
  readFile(pacingUrl, "utf8"),
  readFile(inlineUrl, "utf8"),
  readFile(dataUrl, "utf8").then(JSON.parse),
]);

const expected = { biology: 16, geography: 34, math: 12 };
for (const [subject, count] of Object.entries(expected)) {
  const course = data[subject];
  assert.ok(course, `${subject} course is missing`);
  assert.equal(course.chapters.length, count, `${subject} chapter count changed`);
  for (const chapter of course.chapters) {
    assert.ok(chapter.title, `${subject} chapter ${chapter.number} has no title`);
    assert.ok(chapter.sections?.length, `${subject} chapter ${chapter.number} has no lesson sections`);
    assert.ok(chapter.vocabulary?.length, `${subject} chapter ${chapter.number} has no vocabulary`);
    assert.ok([1, 2].includes(chapter.semester), `${subject} chapter ${chapter.number} has no semester`);
  }
}

assert.match(source, /function generatedGuideFor\(ch\)/, "all chapters need a generated guided path");
assert.match(source, /customGuideFor\(ch\)\|\|generatedGuideFor\(ch\)/, "custom and generated guides must share one engine");
assert.match(source, /function chapterCompletionStatus\(ch\)/, "chapter completion requirements are missing");
assert.match(source, /function portfolioWeekMap\(\)/, "full-year portfolio calendar is missing");
assert.doesNotMatch(source, /\$\{week2Parent\(\)\}/, "parent mode must not remain Week-2-only");
assert.match(pacing, /Concept and foundation/, "math concept sessions are missing");
assert.match(pacing, /Guided practice and challenge/, "math guided-practice sessions are missing");
assert.match(pacing, /Mastery and application/, "math mastery sessions are missing");

const root = { innerHTML: "", addEventListener() {}, __autosaveInstalled: false };
const storage = new Map();
const context = {
  console,
  Date,
  Map,
  Set,
  Blob,
  TextEncoder,
  setTimeout,
  clearTimeout,
  alert() {},
  confirm() { return true; },
  location: { hash: "#home" },
  history: { pushState() {}, replaceState() {} },
  localStorage: {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, value); },
  },
  document: {
    getElementById(id) { return id === "app" ? root : null; },
    querySelectorAll() { return []; },
  },
  fetch() { throw new Error("inline course data should prevent fetch"); },
};
context.window = context;
context.window.addEventListener = () => {};
context.window.scrollTo = () => {};
vm.createContext(context);
vm.runInContext(pacing, context);
vm.runInContext(inline, context);
vm.runInContext(`${source}\n;globalThis.__coverage=(()=>{let rows=[];for(let subject of subjectIds()){S.subject=subject;for(let chapter of S.data[subject].chapters){let guide=guideFor(chapter),worksheet=worksheetItems(chapter),check=knowledgeItems(chapter);rows.push({subject,chapter:chapter.number,steps:guide.steps.length,worksheet:worksheet.length,check:check.length,invalid:guide.steps.flatMap((step,index)=>validateActivity(normalizeStepActivity(step,index))).length})}}return rows})()`, context);
assert.equal(context.__coverage.length, 62, "runtime coverage must include all 62 available chapters");
for (const row of context.__coverage) {
  assert.ok(row.steps >= 2, `${row.subject} chapter ${row.chapter} has too few guided blocks`);
  assert.ok(row.worksheet >= 1, `${row.subject} chapter ${row.chapter} has no worksheet`);
  if (row.subject === "geography") {
    assert.ok(row.worksheet >= 12 && row.worksheet <= 15,
      `geography chapter ${row.chapter} must have 12-15 balanced worksheet questions`);
  }
  assert.ok(row.check >= 1, `${row.subject} chapter ${row.chapter} has no knowledge check`);
  assert.equal(row.invalid, 0, `${row.subject} chapter ${row.chapter} has an invalid guided activity`);
}

vm.runInContext(`globalThis.__writingChecks=[
  writingReview('The Pacific Ocean is apart of the hydrosphere.'),
  writingReview('Earths water is limited'),
  writingReview('Earth’s water is limited.')
]`, context);
assert.ok(context.__writingChecks[0].issues.some(x => x.includes('a part of')), "writing coach must catch apart of");
assert.ok(context.__writingChecks[1].issues.some(x => x.includes('Earth’s')), "writing coach must catch Earths");
assert.equal(context.__writingChecks[2].issues.length, 0, "correct writing should not receive a false warning");

console.log("Full-year app coverage checks passed for Biology, World Geography, and Integrated Math I.");
