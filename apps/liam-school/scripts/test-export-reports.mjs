import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../materials/liam-learning-app/app.js", import.meta.url), "utf8");

assert.match(source, /let answerText = key \? String\(q\.answer/,
  "answer-key exports must use the configured answer, not the student's response");
assert.doesNotMatch(source, /function download(?:Monthly|Semester|Course)Portfolio\(\).*weeklyPortfolioData\(2,/,
  "multi-week exports must not be hard-coded to Week 2");
assert.match(source, /dateInWeek\(completionDate,week\)/,
  "weekly guide work must be filtered by completion date");
assert.match(source, /worksheet-updatedAt`\),week\)/,
  "weekly worksheet responses must be filtered by saved date");
assert.match(source, /Response completion only; not auto-graded/,
  "response completion must not be presented as an academic score");
assert.doesNotMatch(source, /hex='FEFF'/,
  "Helvetica PDF strings must not be emitted as unsupported UTF-16 text");
assert.match(source, /endsWith\('-worksheet'\)&&hasResponses/,
  "progress reports must ignore empty worksheet records");

console.log("Export/report regression checks passed.");
