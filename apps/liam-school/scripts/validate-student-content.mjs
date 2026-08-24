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
  document: {
    getElementById: () => null,
    querySelectorAll: () => [],
    querySelector: () => null,
  },
  location: { hash: "" },
  history: { pushState: () => {}, replaceState: () => {} },
  window: {},
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(dataJs, context, { filename: "data-inline.js" });

const badPatternSources = [
  ["North Carolina Objectives", "i"],
  ["Make the following Foldable", "i"],
  ["\\bFoldable\\b", "i"],
  ["\\bSTEP\\s+\\d\\b", "i"],
  ["Review Vocabulary", "i"],
  ["Use biology to", "i"],
  ["Connect biology to", "i"],
  ["Use geography to", "i"],
  ["Connect geography to", "i"],
  ["Which term best matches this meaning:\\s*\\.?$", "i"],
  ["\\b[A-Za-z]+,\\s*3\\.$", ""],
  ["\\bObjective\\s+\\d+\\.\\d+", "i"],
  ["publisher|copyright|ISBN", "i"],
];

const validator = `
S.data=window.__LIAM_COURSE_DATA__;
const badPatterns = ${JSON.stringify(badPatternSources)}.map(([source,flags])=>new RegExp(source,flags));
const badTellMorePatterns = [
  /Liam does not need/i,
  /evidence can/i,
  /can be saved as evidence/i,
  /duplicate worksheet/i,
  /worksheet/i,
  /Parent Mode/i,
  /portfolio/i,
  /standards/i,
  /documentation/i,
  /the app/i,
  /this feature/i,
  /curriculum/i,
  /progress storage/i,
  /assessment architecture/i,
  /developer/i
];
const rows = [];
const tellMoreRows = [];
function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim();
}
function wordSet(value) {
  return new Set(String(value || "").toLowerCase().match(/[a-z0-9]+/g) || []);
}
function overlapCount(a, b) {
  const A = wordSet(a), B = wordSet(b);
  let count = 0;
  for (const word of A) if (B.has(word) && word.length > 3) count++;
  return count;
}
function checkText(subject, chapter, type, text) {
  const value = stripHtml(text);
  if (!value) return;
  const issues = [];
  for (const pattern of badPatterns) if (pattern.test(value)) issues.push(pattern.toString());
  if (/^(this|it|they|these|those)\b/i.test(value)) issues.push("starts with unclear pronoun");
  if (value.length < 8 && /[?]/.test(value)) issues.push("too short to be clear");
  rows.push({ subject, chapter, type, text: value, issues });
}
function checkTellMore(chapter, meta, rawMore) {
  const subject = meta.subject || S.subject;
  const value = stripHtml(tellMoreContent(chapter, meta, rawMore || ""));
  const issues = [];
  if (!subject || !chapter.number || !meta.section || !meta.conceptId || !meta.learningObjectiveId) issues.push("missing Tell Me More metadata");
  if (!value) issues.push("missing Tell Me More content");
  if (value.length < 45) issues.push("too short to add useful depth");
  if (value.length > 900) issues.push("too long for optional depth");
  for (const pattern of badTellMorePatterns) if (pattern.test(value)) issues.push(pattern.toString());
  const conceptAnchors = {
    "ecosystem-parts": "biotic abiotic living nonliving ecosystem factors",
    "ecosystem-interdependence": "ecosystem relationships organisms food source affect change ecologists connections",
    "symbiosis-relationships": "symbiosis mutualism commensalism parasitism benefit harmed unaffected",
    "habitat-niche": "habitat niche where lives role survives",
    "ecosystem-energy-roles": "producer consumer decomposer herbivore carnivore omnivore scavenger energy nutrients",
    "food-chain-arrow": "food chain food web arrow energy matter moves",
    "earth-layers": "crust mantle core layers depth rocky",
    "earth-forces": "internal external forces surface mountains plates wind water gravity",
  };
  const anchor = [meta.title, meta.conceptId, meta.learningObjectiveId, conceptAnchors[meta.conceptId] || "", ...(meta.vocabulary || []).map((term) => term.term || term)].join(" ");
  if (overlapCount(anchor, value) < 1) issues.push("low overlap with current lesson concept");
  const rewritten = stripHtml(rawMore || "") !== value;
  tellMoreRows.push({ subject, chapter: chapter.number, section: meta.section, type: "tell-more", conceptId: meta.conceptId, objectiveId: meta.learningObjectiveId, text: value, rewritten, issues });
}

for (const subject of Object.keys(S.data)) {
  S.subject = subject;
  const course = S.data[subject];
  for (const chapter of course.chapters) {
    S.chapter = chapter.number;
    const guide = guideFor(chapter);
    if (guide) {
      guide.steps.forEach((step, index) => {
        const activity = normalizeStepActivity(step, index);
        checkTellMore(chapter, guideStepMeta(chapter, step, index), step.more || "");
        checkText(subject, chapter.number, "guide-learn", step.learn);
        checkText(subject, chapter.number, "guide-try", activity?.prompt || step.try);
        if (activity?.options) activity.options.forEach((option) => checkText(subject, chapter.number, "guide-choice", option.label));
      });
    } else {
      (chapter.sections || []).forEach((section, index) => {
        const meta = sectionMeta(chapter, section, index);
        const activity = alignedActivity(meta, chapter);
        checkTellMore(chapter, meta, "");
        sectionBlocks(chapter, section, index).forEach((block) => checkText(subject, chapter.number, "lesson", block));
        checkText(subject, chapter.number, "activity", activity.scenario);
        checkText(subject, chapter.number, "apply", activity.apply);
      });
    }
    worksheetItems(chapter).forEach((item) => checkText(subject, chapter.number, "worksheet", item.prompt));
    knowledgeItems(chapter).forEach((item) => checkText(subject, chapter.number, "knowledge-check", item.prompt));
    for (const semester of Object.values(course.semesters || {})) {
      [...(semester.review || []), ...(semester.final || [])]
        .filter((item) => item.chapter === chapter.number)
        .slice(0, 2)
        .forEach((item) => checkText(subject, chapter.number, "semester", semesterQuestion(item)));
    }
  }
}
globalThis.__studentContentRows = rows;
globalThis.__tellMoreRows = tellMoreRows;
`;
vm.runInContext(appJs.replace(/\nboot\(\);\s*$/, "") + validator, context, { filename: "student-content-validation.js" });

const rows = context.__studentContentRows || [];
const tellMoreRows = context.__tellMoreRows || [];

const failed = [...rows, ...tellMoreRows].filter((row) => row.issues.length);
const summary = {};
for (const row of rows) {
  summary[row.subject] ||= { reviewed: 0, issues: 0 };
  summary[row.subject].reviewed++;
  if (row.issues.length) summary[row.subject].issues++;
}
const tellMoreSummary = {};
for (const row of tellMoreRows) {
  tellMoreSummary[row.subject] ||= { reviewed: 0, rewritten: 0, issues: 0 };
  tellMoreSummary[row.subject].reviewed++;
  if (row.rewritten) tellMoreSummary[row.subject].rewritten++;
  if (row.issues.length) tellMoreSummary[row.subject].issues++;
}

for (const [subject, item] of Object.entries(summary)) {
  console.log(`${subject}: ${item.reviewed} student-facing prompts reviewed, ${item.issues} issues`);
}
for (const subject of Object.keys(context.window.__LIAM_COURSE_DATA__)) {
  const item = tellMoreSummary[subject] || { reviewed: 0, rewritten: 0, issues: 0 };
  console.log(`${subject}: ${item.reviewed} Tell Me More entries reviewed, ${item.rewritten} rewritten/generated, ${item.issues} issues`);
}

if (failed.length) {
  for (const row of failed.slice(0, 30)) {
    console.error(`FAIL ${row.subject} chapter ${row.chapter} ${row.type}: ${row.issues.join("; ")} :: ${row.text.slice(0, 180)}`);
  }
  process.exit(1);
}
