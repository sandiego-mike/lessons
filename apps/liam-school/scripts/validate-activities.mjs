import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "materials", "liam-learning-app");
const appJs = readFileSync(path.join(appDir, "app.js"), "utf8");
const dataJs = readFileSync(path.join(appDir, "data-inline.js"), "utf8");

const forbidden = [
  "showActivityFeedback(",
  "saveGuideChoice(",
  "placeSelectedSortCard(",
  "sortingKey(",
];

let failed = 0;
for (const token of forbidden) {
  const matches = [...appJs.matchAll(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))].length;
  const allowedSelfDefinition = token === "sortingKey(" ? 0 : token === "saveGuideChoice(" ? 0 : token === "showActivityFeedback(" ? 0 : 0;
  if (matches > allowedSelfDefinition) {
    console.error(`FAIL fragile activity function still present: ${token}`);
    failed++;
  }
}

const localStorageStore = new Map();
const context = {
  console,
  TextEncoder,
  Blob: class Blob {},
  URL: { createObjectURL: () => "blob:test", revokeObjectURL: () => {} },
  localStorage: {
    getItem: (key) => localStorageStore.has(key) ? localStorageStore.get(key) : null,
    setItem: (key, value) => localStorageStore.set(key, String(value)),
  },
  document: {
    getElementById: () => null,
    querySelectorAll: () => [],
    querySelector: () => null,
  },
  window: {},
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(dataJs, context, { filename: "data-inline.js" });
const appWithoutBoot = appJs.replace(/\nboot\(\);\s*$/, "");
vm.runInContext(`${appWithoutBoot}
S.data=window.__LIAM_COURSE_DATA__;
const activityRows=[];
function pushActivity(activity,label){
  const errors=validateActivity(activity);
  activityRows.push({subject:activity?.subject||'unknown',chapter:activity?.chapter||0,type:activity?.type||'unknown',label,errors});
}
for (const subject of ['biology','geography']) {
  S.subject=subject;
  const course=S.data[subject];
  for (const chapter of course.chapters) {
    S.chapter=chapter.number;
    (chapter.sections||[]).forEach((section,index)=>{
      pushActivity({
        subject,
        chapter:chapter.number,
        id:subject+'-'+chapter.number+'-section-'+index+'-response',
        type:'shortResponse',
        prompt:section.title||chapter.title
      }, chapter.title+' section '+index);
    });
    const guide=guideFor(chapter);
    if (guide) guide.steps.forEach((step,index)=>pushActivity(normalizeStepActivity(step,index), chapter.title+' guide '+index));
  }
}
globalThis.__activityRows=activityRows;`, context, { filename: "app-validation.js" });

const rows = context.__activityRows || [];
const totals = {
  biology: { checked: 0, failed: 0 },
  geography: { checked: 0, failed: 0 },
};
for (const row of rows) {
  if (!totals[row.subject]) totals[row.subject] = { checked: 0, failed: 0 };
  totals[row.subject].checked++;
  if (row.errors?.length) {
    totals[row.subject].failed++;
    failed++;
    console.error(`FAIL ${row.subject} chapter ${row.chapter} ${row.type}: ${row.errors.join("; ")}`);
  }
}

for (const [subject, total] of Object.entries(totals)) {
  console.log(`${subject}: ${total.checked} activities checked, ${total.checked - total.failed} valid, ${total.failed} failed`);
}

if (!rows.length) {
  console.error("FAIL no activities were discovered");
  failed++;
}

if (failed) process.exit(1);
