// Erzeugt catalog.json aus games/*.yaml und prüft die Vorlagen grob.
// Die vollständige Prüfung macht Serverdeck beim Installieren (gleicher Prüfer wie im Editor).
//
//   node scripts/build-catalog.mjs          catalog.json schreiben
//   node scripts/build-catalog.mjs --check  nur prüfen, Fehler wenn catalog.json veraltet ist
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { parse } from "yaml";

const check = process.argv.includes("--check");
const errors = [];
const games = [];
const ids = new Set();

for (const file of (await readdir("games")).filter((f) => /\.ya?ml$/.test(f)).sort()) {
  const text = await readFile(`games/${file}`, "utf8");
  const fail = (msg) => errors.push(`games/${file}: ${msg}`);
  let t;
  try {
    t = parse(text);
  } catch (e) {
    fail(`kein gültiges YAML – ${e.message.split("\n")[0]}`);
    continue;
  }
  if (!t || typeof t !== "object") {
    fail("leer");
    continue;
  }
  if (typeof t.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,49}$/.test(t.id)) fail("id fehlt oder enthält ungültige Zeichen");
  else if (`${t.id}.yaml` !== file) fail(`Dateiname muss ${t.id}.yaml sein`);
  if (ids.has(t.id)) fail(`id „${t.id}“ gibt es doppelt`);
  ids.add(t.id);
  for (const k of ["name", "short"]) if (typeof t[k] !== "string" || !t[k]) fail(`${k} fehlt`);
  if (typeof t.hue !== "number") fail("hue fehlt");
  if (t.version === undefined) fail("version fehlt (bei jeder Änderung erhöhen)");
  if (!t.image && !t.runtime) fail("image oder runtime fehlt");
  if (!Array.isArray(t.ports) || !t.ports.length) fail("ports fehlen");
  games.push({
    id: t.id,
    name: t.name,
    short: t.short,
    hue: t.hue,
    description: t.description ?? null,
    beta: !!t.beta,
    version: String(t.version),
    runtime: t.runtime ?? null,
    install: t.install?.steamcmd ? "steamcmd" : t.install?.download ? "download" : t.install ? "script" : null,
    file: `games/${file}`,
    sha256: createHash("sha256").update(text).digest("hex"),
  });
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}

games.sort((a, b) => a.name.localeCompare(b.name, "de"));
const json = JSON.stringify({ format: 1, name: "Serverdeck-Spiele", games }, null, 2) + "\n";

if (check) {
  const current = await readFile("catalog.json", "utf8").catch(() => "");
  if (current !== json) {
    console.error("✗ catalog.json ist nicht aktuell – „npm run build“ ausführen und mit committen.");
    process.exit(1);
  }
  console.log(`✓ ${games.length} Spiele, catalog.json ist aktuell.`);
} else {
  await writeFile("catalog.json", json);
  console.log(`✓ catalog.json mit ${games.length} Spielen geschrieben.`);
}
