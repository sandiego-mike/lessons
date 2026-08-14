import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(projectRoot, "materials", "liam-learning-app");
const output = path.join(projectRoot, "dist");

await stat(path.join(source, "index.html"));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, {
  recursive: true,
  filter: (item) => !item.endsWith(".DS_Store"),
});

console.log("Built Liam Learning v5 static app into dist/");
