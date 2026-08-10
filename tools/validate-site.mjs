import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedStageKeys = [
  "gpu-kernel-engineer",
  "ai-practitioner",
  "full-stack-ai",
  "data-scientist",
  "production-manager",
  "production-engineer",
  "materials-manufacturing",
  "industrial-engineering",
  "mechanical-engineering",
];
const expectedAnchors = ["top", "journey", "work", "approach", "about"];
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function matches(source, pattern) {
  return Array.from(source.matchAll(pattern), (match) => match[1]);
}

function readPngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const pages = {
  en: await readFile(path.join(root, "en/index.html"), "utf8"),
  tr: await readFile(path.join(root, "tr/index.html"), "utf8"),
};

for (const [locale, html] of Object.entries(pages)) {
  check(html.includes(`<html lang="${locale}" data-locale="${locale}">`), `${locale}: html language marker is missing`);
  check(html.includes(`<link rel="canonical" href="https://aserdargun.com/${locale}/">`), `${locale}: canonical URL is incorrect`);
  check(html.includes("hreflang=\"en\""), `${locale}: English hreflang is missing`);
  check(html.includes("hreflang=\"tr\""), `${locale}: Turkish hreflang is missing`);
  check(html.includes("hreflang=\"x-default\""), `${locale}: x-default hreflang is missing`);
  check(html.includes("data-language-link=\"tr\""), `${locale}: Turkish language link is missing`);
  check(html.includes("data-language-link=\"en\""), `${locale}: English language link is missing`);
  check(html.includes("/styles.css") && html.includes("/scripts.js"), `${locale}: shared root assets are not linked`);

  const stageKeys = matches(html, /data-stage-key="([^"]+)"/g);
  check(JSON.stringify(stageKeys) === JSON.stringify(expectedStageKeys), `${locale}: timeline stage keys or order differ`);
  const stageNumbers = matches(html, /data-stage-number="([^"]+)"/g);
  check(JSON.stringify(stageNumbers) === JSON.stringify(["09", "08", "07", "06", "05", "04", "03", "02", "01"]), `${locale}: timeline stage numbers must descend from 09 to 01`);

  for (const anchor of expectedAnchors) {
    check(new RegExp(`id="${anchor}"`).test(html), `${locale}: #${anchor} anchor is missing`);
  }

  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  check(Boolean(jsonLdMatch), `${locale}: JSON-LD is missing`);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      check(jsonLd["@type"] === "Person", `${locale}: JSON-LD type must be Person`);
      check(jsonLd.url === `https://aserdargun.com/${locale}/`, `${locale}: JSON-LD URL is incorrect`);
    } catch (error) {
      failures.push(`${locale}: JSON-LD is invalid JSON (${error.message})`);
    }
  }
}

const externalAnchorPattern = /<a[^>]+href="(https:\/\/[^"#]+)"/g;
const enExternalLinks = matches(pages.en, externalAnchorPattern).sort();
const trExternalLinks = matches(pages.tr, externalAnchorPattern).sort();
check(JSON.stringify(enExternalLinks) === JSON.stringify(trExternalLinks), "TR/EN external links differ");

check(pages.en.includes("https://aserdargun.com/images/og-ascii.png"), "English Open Graph image is incorrect");
check(pages.tr.includes("https://aserdargun.com/images/og-ascii-tr.png"), "Turkish Open Graph image is incorrect");
check(pages.en.includes("GPU Kernel Engineer — studying"), "English GPU kernel learning status is missing");
check(pages.tr.includes("GPU Kernel Engineer — öğrenme aşamasında"), "Turkish GPU kernel learning status is missing");
check(pages.en.includes("Reading direction · 09 → 01"), "English reverse-chronology explanation is missing");
check(pages.tr.includes("Okuma yönü · 09 → 01"), "Turkish reverse-chronology explanation is missing");
check(pages.en.includes("https://gpu.aserdargun.com/") && pages.tr.includes("https://gpu.aserdargun.com/"), "Kernel Atlas link is missing");
check(pages.en.includes("https://unsloth.aserdargun.com/") && pages.tr.includes("https://unsloth.aserdargun.com/"), "Unsloth Studio Learning Atlas link is missing");
check(pages.en.includes("Explore Unsloth Studio Atlas") && pages.tr.includes("Unsloth Studio Atlas&apos;ı keşfet"), "Localized Unsloth Studio Atlas labels are missing");

const rootPage = await readFile(path.join(root, "index.html"), "utf8");
check(rootPage.includes("portfolio-language"), "Root language preference lookup is missing");
check(rootPage.includes("navigator.language"), "Root browser-language fallback is missing");
check(rootPage.includes("href=\"/tr/\"") && rootPage.includes("href=\"/en/\""), "Root no-JavaScript language links are missing");

const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
check(sitemap.includes("https://aserdargun.com/en/"), "Sitemap is missing /en/");
check(sitemap.includes("https://aserdargun.com/tr/"), "Sitemap is missing /tr/");

for (const asset of ["images/og-ascii.png", "images/og-ascii-tr.png", "images/serdar-gundogdu-ascii.png", "styles.css", "scripts.js"]) {
  try {
    await stat(path.join(root, asset));
  } catch {
    failures.push(`Required asset is missing: ${asset}`);
  }
}

const trOgBuffer = await readFile(path.join(root, "images/og-ascii-tr.png"));
const trOgDimensions = readPngDimensions(trOgBuffer);
check(trOgDimensions?.width === 1730 && trOgDimensions?.height === 909, "Turkish Open Graph image must be 1730×909 PNG");

if (failures.length > 0) {
  console.error("Site validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Site validation passed: TR/EN routes, timeline parity, metadata, links, and assets are consistent.");
}
