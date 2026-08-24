import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const appUrl = new URL("../materials/liam-learning-app/app.js", import.meta.url);
const dataUrl = new URL("../materials/liam-learning-app/data/course-data.json", import.meta.url);
const pacingUrl = new URL("../materials/liam-learning-app/pacing.js", import.meta.url);
const inlineUrl = new URL("../materials/liam-learning-app/data-inline.js", import.meta.url);
const indexUrl = new URL("../materials/liam-learning-app/index.html", import.meta.url);
const stylesUrl = new URL("../materials/liam-learning-app/styles.css", import.meta.url);
const [source, pacing, inline, data, indexHtml, styles] = await Promise.all([
  readFile(appUrl, "utf8"),
  readFile(pacingUrl, "utf8"),
  readFile(inlineUrl, "utf8"),
  readFile(dataUrl, "utf8").then(JSON.parse),
  readFile(indexUrl, "utf8"),
  readFile(stylesUrl, "utf8"),
]);
assert.ok(!/Print chapter:|teacherToggle|chapterSelect/.test(indexHtml),
  "legacy floating print controls must not appear over the live worksheet");

const expected = { biology: 16, geography: 34, math: 12, math3: 9 };
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

assert.equal(data.math.scopeAlignment?.units, 13, "Math must cover all 13 Reveal Integrated I units");
const revealLessons = new Set(data.math.chapters.flatMap(chapter => chapter.sections.map(section => section.title)));
for (const title of [
  "Properties of Real Numbers", "Piecewise and Step Functions", "Absolute Value Functions",
  "Linear Regression", "Inverses of Linear Functions", "Transformations of Exponential Functions",
  "Summarizing Categorical Data", "Two- and Three-Dimensional Figures", "Precision and Accuracy",
  "Conjectures and Counterexamples", "Compositions of Transformations", "Symmetry",
  "Proving Right Triangles Congruent", "Proving the Slope Criteria", "Constructing Inscribed Polygons"
]) assert.ok(revealLessons.has(title), `Reveal Math alignment is missing ${title}`);
assert.equal(data.math3.scopeAlignment?.units, 9, "Math III must cover all 9 Reveal Integrated III units");
assert.equal(data.math3.scopeAlignment?.lessons, 47, "Math III must include all 47 Reveal Integrated III lessons");
assert.equal(data.math3.studentId, "leilani", "Math III must belong to Leilani");
assert.equal(data.math3.grade, 11, "Leilani's Math III course must export Grade 11 documents");

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
const math3Pacing = context.LiamPacing.summary("math3", data.math3, {});
assert.ok(math3Pacing.plans.some(plan => plan.type === "chapter" && plan.chapter === 9),
  "Leilani's pacing must schedule all nine Math III units");
assert.equal(math3Pacing.validations.length, 0,
  "Leilani's Math III pacing must have no calendar validation issues");
vm.runInContext(`${source}\n;globalThis.__coverage=(()=>{let rows=[];for(let subject of allSubjectIds()){S.subject=subject;S.student=S.data[subject].studentId||'liam';for(let chapter of S.data[subject].chapters){let guide=guideFor(chapter),worksheet=worksheetItems(chapter),check=knowledgeItems(chapter);rows.push({subject,chapter:chapter.number,steps:guide.steps.length,worksheet:worksheet.length,prompts:worksheet.map(q=>q.prompt),sourceQuestions:worksheet.filter(q=>q.type==='source_question').length,testStyle:worksheet.filter(q=>/SAT\\/ACT|Error analysis/i.test(q.prompt)).length,check:check.length,invalid:guide.steps.flatMap((step,index)=>validateActivity(normalizeStepActivity(step,index))).length})}}return rows})()`, context);
assert.equal(context.__coverage.length, 71, "runtime coverage must include all 71 available chapters and units");
for (const row of context.__coverage) {
  assert.ok(row.steps >= 2, `${row.subject} chapter ${row.chapter} has too few guided blocks`);
  assert.ok(row.worksheet >= 1, `${row.subject} chapter ${row.chapter} has no worksheet`);
  if (row.subject === "geography") {
    assert.ok(row.worksheet >= 12 && row.worksheet <= 15,
      `geography chapter ${row.chapter} must have 12-15 balanced worksheet questions`);
  }
  if (row.subject === "biology") assert.ok(row.worksheet >= 9 && row.worksheet <= 15,
    `biology chapter ${row.chapter} must have a substantial worksheet`);
  if (row.subject === "math" || row.subject === "math3") {
    assert.equal(row.worksheet, 15, `math chapter ${row.chapter} must include concrete test-prep practice`);
    if (row.subject === "math") assert.ok(row.testStyle >= 1, `math chapter ${row.chapter} needs SAT/ACT or error-analysis practice`);
  }
  assert.ok(row.check >= 1, `${row.subject} chapter ${row.chapter} has no knowledge check`);
  assert.equal(row.invalid, 0, `${row.subject} chapter ${row.chapter} has an invalid guided activity`);
}
assert.ok(context.__coverage.filter(r=>r.subject==='biology').reduce((sum,row)=>sum+row.sourceQuestions,0)>=12,
  "biology worksheets must include a meaningful set of curated textbook section questions");
const mathOne = context.__coverage.find(row => row.subject === "math" && row.chapter === 1);
assert.ok(!mathOne.prompts.some(prompt => /Earth sphere|plate tectonics|weathering|water cycle/i.test(prompt)),
  "Math Chapter 1 must never receive geography worksheet questions");
const inequalities = context.__coverage.find(row => row.subject === "math" && row.chapter === 2);
assert.equal(new Set(inequalities.prompts).size, 15, "inequality worksheet questions must all be distinct");
for (const skill of [/write an inequality/i,/addition|x - 9/i,/-4x|z\/\(-3\)/i,/multi|5\(2x/i,/compound|-5 < 2x/i,/absolute|\|x - 2\|/i]) {
  assert.ok(inequalities.prompts.some(prompt => skill.test(prompt)), `inequality worksheet is missing ${skill}`);
}
vm.runInContext("S.subject='math';S.chapter=2;globalThis.__inequalityWorksheetHtml=worksheet(chap())", context);
assert.ok(!/Table<\/span>.*Coordinate plane/s.test(context.__inequalityWorksheetHtml),
  "inequality webpage must not show the coordinate-graph response scaffold");
assert.ok(/Solve and write the final inequality.*sign reversal.*Graph the endpoint.*Check one value/s.test(context.__inequalityWorksheetHtml),
  "inequality webpage must show every required understanding step");
assert.ok(/<svg[^>]*Blank number line/s.test(context.__inequalityWorksheetHtml),
  "inequality webpage must include a visible number line for graphing");
context.__mathPdfMode = process.env.MATH_PDF_MODE || "blank";
vm.runInContext("globalThis.__mathPdf=mathWorksheetPdfBlob(chap(),globalThis.__mathPdfMode);globalThis.__graphSpecs=[inequalityGraphSpec('x <= -7'),inequalityGraphSpec('-3 < x <= 5'),inequalityGraphSpec('x < 3 or x >= 6')]", context);
assert.ok(context.__mathPdf.size > 12000, "Math worksheet PDF must contain rendered workspace and number lines");
assert.equal(context.__graphSpecs[0].segments[0].hiClosed, true, "closed inequality endpoint was not parsed");
assert.equal(context.__graphSpecs[1].segments[0].lo, -3, "compound inequality lower endpoint was not parsed");
assert.equal(context.__graphSpecs[2].segments.length, 2, "union inequality must render two rays");
vm.runInContext("S.chapter=3;globalThis.__functionWorksheetHtml=worksheet(chap());globalThis.__functionPdf=mathWorksheetPdfBlob(chap(),'blank')", context);
assert.ok(/Blank coordinate grid/.test(context.__functionWorksheetHtml),
  "function worksheets must include coordinate grids where graphing is required");
assert.ok(context.__functionPdf.size > 12000, "graphing worksheet PDF must contain coordinate-grid workspace");
if (process.env.MATH_PDF_OUTPUT) await writeFile(process.env.MATH_PDF_OUTPUT, Buffer.from(await context.__mathPdf.arrayBuffer()));
vm.runInContext("S.subject='math';S.chapter=2;globalThis.__mentalHtml=guidedLesson(chap(),guideFor(chap()));globalThis.__mentalBanks=S.data.math.chapters.map(ch=>mentalMathBank(ch,0).length)", context);
assert.ok(/Mental Math Lab|Solve mentally first|Incorrect answers show the fastest reliable method/.test(context.__mentalHtml),
  "Math lessons must use the rapid mental-practice interface");
assert.ok(!/This section is about/.test(context.__mentalHtml),
  "Math lessons must not begin with dense generated section prose");
assert.ok(context.__mentalBanks.every(count => count >= 5),
  "Every Math chapter needs at least five rapid-practice questions");
assert.match(source, /Here is the fastest clean path/, "incorrect Math answers must display a direct worked correction");

vm.runInContext("S.student='liam';globalThis.__liamSubjects=subjectIds();S.student='leilani';globalThis.__leilaniSubjects=subjectIds();S.subject='math3';S.chapter=1;globalThis.__leilaniHome=home();globalThis.__math3WorksheetHtml=worksheet(chap());globalThis.__math3TestPrep=mathTestPrepPanel(chap());globalThis.__math3Pdf=mathWorksheetPdfBlob(chap(),'blank')", context);
assert.deepEqual(Array.from(context.__liamSubjects), ["biology", "geography", "math"],
  "Liam must retain his three courses");
assert.deepEqual(Array.from(context.__leilaniSubjects), ["math3"],
  "Leilani must see only her Integrated Math III course");
assert.match(context.__leilaniHome, /Leilani DeVries|Integrated Math III/,
  "Leilani's home screen must identify her and her course");
assert.match(context.__math3WorksheetHtml, /Leilani DeVries.*Grade: 11/s,
  "Math III worksheet must identify Leilani and Grade 11");
assert.match(context.__math3WorksheetHtml, /Think first - write only what matters.*Notice.*Fast route.*Solve.*Verify/s,
  "Math III worksheet must use the efficient structured-work scaffold");
assert.match(context.__math3WorksheetHtml, /3x<sup>2<\/sup>.*x<sup>2<\/sup>/s,
  "Math III equations must render exponents as mathematical superscripts");
assert.doesNotMatch(context.__math3WorksheetHtml, /3x\^2/,
  "Math III webpage must not show keyboard-style exponents");
assert.doesNotMatch(context.__math3WorksheetHtml, /transfer: solve the lesson problem/i,
  "Math III worksheet must not contain vague transfer prompts");
assert.match(context.__math3WorksheetHtml, /A student gave this result.*independent check.*verdict/s,
  "Math III worksheet must include concrete verification practice");
for (const requirement of [/Math learning coach/, /Check my work/, /Attempt required/, /Show worked solution/]) {
  assert.match(source, requirement, "Math must use an attempt-gated work coach instead of a grammar checker");
}
assert.match(source, /Degree buckets:.*Synthetic route:.*Pattern route:.*Structure-first factoring:/s,
  "Math coach must include topic-specific efficient alternate methods");
vm.runInContext("S.subject='math3';S.student='leilani';S.chapter=1;S.tab='check';globalThis.__math3CheckHtml=check(chap())", context);
assert.doesNotMatch(context.__math3CheckHtml, /Check answer/,
  "Math knowledge checks must not expose an immediate answer button");
vm.runInContext(`S.subject='math3';S.student='leilani';S.chapter=1;S.tab='learn';
  globalThis.__math3LessonRows=Object.entries(MATH3_LESSON_BANK).map(([id,x])=>({id,...x}));
  globalThis.__math3LessonHtml=guidedLesson(chap(),guideFor(chap()));`, context);
assert.equal(context.__math3LessonRows.length, 47,
  "Every Integrated Math III section must have a separate worked example and Try It problem");
for (const lesson of context.__math3LessonRows) {
  const [unit, section] = lesson.id.split('.').map(Number);
  const worksheetPrompts = context.__coverage
    .find(row => row.subject === 'math3' && row.chapter === unit).prompts
    .map(text => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim());
  for (const learningText of [lesson.e, lesson.t]) {
    const normalized = learningText.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    assert.ok(!worksheetPrompts.includes(normalized),
      `Math III ${lesson.id} learning equation must not duplicate a worksheet question: ${learningText}`);
  }
  assert.ok(lesson.s.length >= 3 && lesson.w.length >= 35 && lesson.a,
    `Math III ${lesson.id} must explain steps, why the method works, and the Try It answer`);
}
assert.match(context.__math3LessonHtml, /Worked example.*Step 1.*Step 2.*Step 3.*Try It - new problem/s,
  "Math III learning screen must visibly break down a worked example before Try It");
assert.match(styles, /\.math3-guide \.guide-layout\{grid-template-columns:1fr\}/,
  "Math III worked examples must use the full card width");
assert.match(styles, /\.math3-guide \.visual-box\.cards\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/,
  "Math III worked steps must use three readable desktop columns");
assert.match(styles, /@media\(max-width:900px\)\{\.math3-guide \.visual-box\.cards\{grid-template-columns:1fr\}/,
  "Math III worked steps must stack on smaller screens");
assert.doesNotMatch(styles, /\.math3-guide \.visual-box\.cards span\{[^}]*word-break:break-all/,
  "Math III equations must never break one character at a time");
assert.match(styles, /@media\(max-width:600px\)\{html,body\{max-width:100%;overflow-x:hidden\}/,
  "The app must contain page-level overflow on phones");
assert.match(styles, /\.top\{position:relative;display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/,
  "The phone header must use a responsive two-column grid");
assert.match(styles, /\.math-question span:last-child\{min-width:0;overflow-x:auto;overflow-wrap:normal;word-break:normal\}/,
  "Long phone equations must scroll inside their question instead of widening the page");
assert.match(context.__math3TestPrep, /integrated-math-3-resources.*Carnegie Integrated Math III assignments/s,
  "Leilani's Carnegie resource must point to Integrated Math III");
assert.ok(context.__math3Pdf.size > 12000,
  "Math III worksheet PDF must contain complete printable learning workspace");
if (process.env.MATH3_PDF_OUTPUT) await writeFile(process.env.MATH3_PDF_OUTPUT, Buffer.from(await context.__math3Pdf.arrayBuffer()));

vm.runInContext(`globalThis.__writingChecks=[
  writingReview('The Pacific Ocean is apart of the hydrosphere.'),
  writingReview('Earths water is limited'),
  writingReview('Earthâs water is limited.')
]`, context);
assert.ok(context.__writingChecks[0].issues.some(x => x.includes('a part of')), "writing coach must catch apart of");
assert.ok(context.__writingChecks[1].issues.some(x => x.includes('Earthâs')), "writing coach must catch Earths");
assert.equal(context.__writingChecks[2].issues.length, 0, "correct writing should not receive a false warning");

console.log("Full-year app coverage checks passed for Liam's three courses and Leilani's Integrated Math III.");
