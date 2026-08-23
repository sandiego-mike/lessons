import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = path.join(projectRoot, "materials/liam-learning-app");
const materialsRoot = path.join(projectRoot, "materials");
const dataPath = path.join(appRoot, "data/course-data.json");
const inventoryJsonPath = path.join(appRoot, "data/curriculum-inventory.json");
const inventoryJsPath = path.join(appRoot, "inventory-inline.js");
const calendarSource = "/Users/michaeldevries/Downloads/2026-2027SchoolCalendar.pdf";

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function chapterNumber(file) {
  const name = path.basename(file).toLowerCase();
  const match = name.match(/chapter[_\s-]*(\d+)/) || name.match(/chap[_\s-]*(\d+)/) || name.match(/^chapter-(\d+)/) || name.match(/^(\d+)/);
  return match ? Number(match[1]) : null;
}

function pdfsIn(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs
    .readdirSync(folder)
    .filter((name) => name.toLowerCase().endsWith(".pdf"))
    .map((name) => path.join(folder, name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b), undefined, { numeric: true }));
}

function statusLine(ok, message) {
  return { ok, message };
}

function sourceMap(subject) {
  const folder = path.join(materialsRoot, subject === "biology" ? "biology" : subject === "math" ? "math" : "world-geography");
  const out = new Map();
  if (!fs.existsSync(folder) && fs.existsSync(inventoryJsonPath)) {
    const previous = readJson(inventoryJsonPath)?.[subject]?.chapters ?? [];
    for (const row of previous) {
      if (!row.sourceFile || !row.hash) continue;
      out.set(row.chapter, {
        file: row.sourceFile,
        absoluteFile: null,
        hash: row.hash,
        bytes: row.bytes ?? 0,
      });
    }
    return out;
  }
  for (const file of pdfsIn(folder)) {
    const number = chapterNumber(file);
    if (!number) continue;
    out.set(number, {
      file: path.relative(appRoot, file),
      absoluteFile: file,
      hash: sha256(file),
      bytes: fs.statSync(file).size,
    });
  }
  return out;
}

function chapterChecks(chapter) {
  return [
    statusLine(Boolean(chapter), "course record exists"),
    statusLine(Boolean(chapter?.title), "chapter title exists"),
    statusLine((chapter?.sections?.length ?? 0) > 0, "sections exist"),
    statusLine((chapter?.vocabulary?.length ?? 0) > 0, "vocabulary exists"),
    statusLine((chapter?.worksheet?.length ?? 0) > 0, "worksheet exists"),
    statusLine((chapter?.knowledgeCheck?.length ?? 0) > 0, "knowledge check exists"),
    statusLine((chapter?.objectives?.length ?? 0) > 0 || (chapter?.sections?.length ?? 0) > 0, "study guide source exists"),
    statusLine((chapter?.sections ?? []).some((section) => (section.blocks?.join(" ") ?? "").length > 240), "chapter notes / lesson text exists"),
    statusLine(Boolean(chapter?.cover && fs.existsSync(path.join(appRoot, chapter.cover))), "cover image renders"),
    statusLine(Boolean(chapter?.visual && fs.existsSync(path.join(appRoot, chapter.visual))), "visual image renders"),
  ];
}

function buildCourseInventory(subject, expected, unavailable = []) {
  const data = readJson(dataPath);
  const course = data[subject];
  const sources = sourceMap(subject);
  const records = new Map((course.chapters ?? []).map((chapter) => [chapter.number, chapter]));
  const rows = [];
  const failures = [];

  for (const number of expected) {
    if (unavailable.includes(number)) {
      rows.push({
        chapter: number,
        title: "Unavailable",
        sourceFile: null,
        hash: null,
        statuses: ["UNAVAILABLE"],
        note: "Intentionally excluded because the chapter PDF was not supplied.",
      });
      continue;
    }

    const source = sources.get(number);
    const chapter = records.get(number);
    const checks = chapterChecks(chapter);
    const failed = checks.filter((check) => !check.ok).map((check) => check.message);
    const statuses = [
      source ? "SOURCE_FOUND" : "MISSING",
      chapter ? "PARSED" : "FAILED",
      chapter ? "GENERATED" : "FAILED",
      chapter ? "RENDERED" : "FAILED",
      failed.length ? "FAILED" : "VALIDATED",
    ];
    if (failed.length) failures.push(`${subject} chapter ${number}: ${failed.join(", ")}`);
    rows.push({
      chapter: number,
      title: chapter?.title ?? "Missing course record",
      sourceFile: source?.file ?? null,
      hash: source?.hash ?? null,
      bytes: source?.bytes ?? 0,
      statuses,
      note: failed.join("; ") || "Ready.",
    });
  }

  const duplicateNumbers = [...records.keys()].filter((number, index, array) => array.indexOf(number) !== index);
  if (duplicateNumbers.length) failures.push(`${subject}: duplicate chapter numbers ${duplicateNumbers.join(", ")}`);
  const expectedWithoutUnavailable = expected.filter((number) => !unavailable.includes(number));
  const orderOk = expectedWithoutUnavailable.every((number, index) => course.chapters[index]?.number === number);
  if (!orderOk) failures.push(`${subject}: chapter order does not match expected sequence`);

  return {
    subject,
    label: course.name,
    expectedChapters: expected,
    unavailableChapters: unavailable,
    availableSourceChapters: [...sources.keys()].filter((number) => expected.includes(number)).length,
    parsed: rows.filter((row) => row.statuses.includes("PARSED")).length,
    rendered: rows.filter((row) => row.statuses.includes("RENDERED")).length,
    validated: rows.filter((row) => row.statuses.includes("VALIDATED")).length,
    intentionallyUnavailable: unavailable.length,
    unaccounted: failures.length,
    chapters: rows,
    failures,
  };
}

function supplementalInventory() {
  const geo = path.join(materialsRoot, "world-geography");
  const spanish = path.join(geo, "spanish-glossary.pdf");
  const calendarTarget = path.join(appRoot, "assets/2026-2027SchoolCalendar.pdf");
  if (fs.existsSync(calendarSource) && !fs.existsSync(calendarTarget)) {
    fs.copyFileSync(calendarSource, calendarTarget);
  }
  const calendar = fs.existsSync(calendarTarget) ? calendarTarget : calendarSource;
  return [
    {
      name: "Spanish glossary",
      file: path.relative(appRoot, spanish),
      status: fs.existsSync(spanish) ? "SOURCE_FOUND" : "MISSING",
      hash: fs.existsSync(spanish) ? sha256(spanish) : null,
    },
    {
      name: "School calendar",
      file: fs.existsSync(calendar) ? path.relative(appRoot, calendar) : "2026-2027SchoolCalendar.pdf",
      status: fs.existsSync(calendar) ? "SOURCE_FOUND" : "MISSING",
      hash: fs.existsSync(calendar) ? sha256(calendar) : null,
    },
  ];
}

function main() {
  const biology = buildCourseInventory("biology", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], [16]);
  const geography = buildCourseInventory(
    "geography",
    Array.from({ length: 34 }, (_, index) => index + 1),
    [],
  );
  const math = buildCourseInventory("math", Array.from({ length: 12 }, (_, index) => index + 1), []);
  const inventory = {
    generatedAt: new Date().toISOString(),
    biology,
    geography,
    math,
    supplemental: supplementalInventory(),
  };
  fs.writeFileSync(inventoryJsonPath, `${JSON.stringify(inventory, null, 2)}\n`);
  fs.writeFileSync(inventoryJsPath, `window.__LIAM_CURRICULUM_INVENTORY__=${JSON.stringify(inventory)};\n`);

  console.log("CURRICULUM VALIDATION\n");
  console.log("Biology");
  console.log(`${biology.availableSourceChapters} available source chapters`);
  console.log(`${biology.parsed} parsed`);
  console.log(`${biology.rendered} rendered`);
  console.log(`${biology.validated} validated`);
  console.log(`${biology.intentionallyUnavailable} intentionally unavailable`);
  console.log(`${biology.unaccounted} unaccounted\n`);
  console.log("World Geography");
  console.log(`${geography.availableSourceChapters} source chapters`);
  console.log(`${geography.parsed} parsed`);
  console.log(`${geography.rendered} rendered`);
  console.log(`${geography.validated} validated`);
  console.log(`${geography.unaccounted} unaccounted\n`);
  console.log("Integrated Math I");
  console.log(`${math.availableSourceChapters} source chapters`);
  console.log(`${math.parsed} parsed`);
  console.log(`${math.rendered} rendered`);
  console.log(`${math.validated} validated`);
  console.log(`${math.unaccounted} unaccounted\n`);
  for (const item of inventory.supplemental) {
    console.log(`${item.name}: ${item.status}`);
  }

  const failures = [...biology.failures, ...geography.failures, ...math.failures, ...inventory.supplemental.filter((item) => item.status !== "SOURCE_FOUND").map((item) => `${item.name}: ${item.status}`)];
  if (failures.length) {
    console.log("\nFAIL");
    failures.forEach((failure) => console.log(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log("\nPASS");
  }
}

main();
