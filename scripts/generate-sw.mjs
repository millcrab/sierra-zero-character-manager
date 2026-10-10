import { readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, relative, sep } from "node:path";

const root = new URL("../dist/", import.meta.url);
const rootPath = root.pathname;
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(path));
    else if (entry.name !== "sw.js") files.push(path);
  }
  return files;
}

const assets = (await filesUnder(rootPath)).map((path) => `./${relative(rootPath, path).split(sep).join("/")}`);
const buildFingerprint = createHash("sha256").update(JSON.stringify(assets)).digest("hex").slice(0, 12);
const source = `const CACHE = "sierra-zero-shell-v${packageJson.version}-${buildFingerprint}";
const PRECACHE = ${JSON.stringify(assets, null, 2)};
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: "window" });
    await Promise.all(windows.map(client => client.navigate(client.url)));
  })());
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("./index.html"))));
});
`;
await writeFile(join(rootPath, "sw.js"), source);
