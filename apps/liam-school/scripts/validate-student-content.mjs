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
const rows = [];
function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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

for (const subject of ["biology", "geography"]) {
  S.subject = subject;
  const course = S.data[subject];
  for (const chapter of course.chapters) {
    S.chapter = chapter.number;
    const guide = guideFor(chapter);
    if (guide) {
      guide.steps.forEach((step, index) => {
        const activity = normalizeStepActivity(step, index);
        checkText(subject, chapter.number, "guide-learn", step.learn);
        checkText(subject, chapter.number, "guide-try", activity?.prompt || step.try);
        if (activity?.options) activity.options.forEach((option) => checkText(subject, chapter.number, "guide-choice", option.label));
      });
    } else {
      (chapter.sections || []).forEach((section, index) => {
        sectionBlocks(chapter, section).forEach((block) => checkText(subject, chapter.number, "lesson", block));
        checkText(subject, chapter.number, "activity", clarityScenario(chapter, termInfo((chapter.vocabulary || [])[index % Math.max(1, chapter.vocabulary.length)] || { term: chapter.title })).scenario);
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
`;
vm.runInContext(appJs.replace(/\nboot\(\);\s*$/, "") + validator, context, { filename: "student-content-validation.js" });

const rows = context.__studentContentRows || [];

const failed = rows.filter((row) => row.issues.length);
const summary = {};
for (const row of rows) {
  summary[row.subject] ||= { reviewed: 0, issues: 0 };
  summary[row.subject].reviewed++;
  if (row.issues.length) summary[row.subject].issues++;
}

for (const [subject, item] of Object.entries(summary)) {
  console.log(`${subject}: ${item.reviewed} student-facing prompts reviewed, ${item.issues} issues`);
}
console.log("math: 0 student-facing prompts reviewed, 0 issues (no Integrated Math I content is implemented in this app folder)");

if (failed.length) {
  for (const row of failed.slice(0, 30)) {
    console.error(`FAIL ${row.subject} chapter ${row.chapter} ${row.type}: ${row.issues.join("; ")} :: ${row.text.slice(0, 180)}`);
  }
  process.exit(1);
}
