import { access, readFile, readdir } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const root = new URL("../dist/", import.meta.url).pathname;
const required = ["index.html", "manifest.webmanifest", "sw.js", "icon-192.png", "icon-512.png", ".nojekyll"];
for (const file of required) await access(join(root, file));

const index = await readFile(join(root, "index.html"), "utf8");
if (/\b(?:src|href)="\/(?!\/)/.test(index)) throw new Error("Build contains a domain-root asset path and is unsafe for a GitHub Pages subpath.");
if (!index.includes("./manifest.webmanifest")) throw new Error("Manifest link is not relative.");

const manifest = JSON.parse(await readFile(join(root, "manifest.webmanifest"), "utf8"));
if (manifest.start_url !== "./" || manifest.scope !== "./" || manifest.display !== "standalone") throw new Error("PWA manifest scope/start/display is invalid.");

async function filesUnder(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await filesUnder(path));
    else if (entry.name !== "sw.js") output.push(`./${relative(root, path).split(sep).join("/")}`);
  }
  return output;
}
const serviceWorker = await readFile(join(root, "sw.js"), "utf8");
for (const file of await filesUnder(root)) if (!serviceWorker.includes(JSON.stringify(file))) throw new Error(`Service worker does not precache ${file}.`);
if (!serviceWorker.includes('caches.match("./index.html")')) throw new Error("Service worker has no offline navigation fallback.");
if (!serviceWorker.includes('event.data?.type === "SKIP_WAITING"')) throw new Error("Service worker has no user-controlled update activation.");
console.log("Verified relative GitHub Pages paths, PWA manifest, offline fallback, and complete precache.");
