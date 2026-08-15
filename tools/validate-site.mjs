import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const expectedStageKeys = [
  "ai-engineer",
  "full-stack-ai",
  "data-scientist",
  "production-manager",
  "production-engineer",
  "materials-manufacturing",
  "industrial-engineering",
  "mechanical-engineering",
];
const expectedStageNumbers = ["08", "07", "06", "05", "04", "03", "02", "01"];
const expectedStageImages = [
  "08-ai-engineer",
  "07-full-stack-ai-engineer",
  "06-data-scientist",
  "05-production-manager",
  "04-production-engineer",
  "03-materials-manufacturing",
  "02-industrial-engineering",
  "01-mechanical-engineering",
];
const expectedAnchors = ["top", "apps", "journey", "approach", "about"];
const expectedAppCodes = ["stk", "aia", "llm", "usl", "gpu", "cld"];
const expectedAppUrls = expectedAppCodes.map((code) => `https://${code}.aserdargun.com/`);
const expectedAppRepos = expectedAppCodes.map((code) => `${code}-aserdargun-com`);
const retiredProjectUrls = [
  "https://stackfolio.aserdargun.com/",
  "https://unsloth.aserdargun.com/",
  "https://swapp.org.tr",
  "https://github.com/aserdargun/pipolars",
  "https://pypi.org/project/pipolars/",
  "https://github.com/aserdargun/ai-practitioner-dev-os",
  "https://projectpulsar.org/",
  "https://github.com/aserdargun/piwebapi",
  "https://scadanerve.com",
  "https://industry-learn.com",
  "https://scikit-play.org",
  "https://aeon-play.org",
  "https://pytorch-play.org",
  "https://dsml101.com",
];
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

function pngHasAlpha(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return false;
  return [4, 6].includes(buffer.readUInt8(25));
}

const pages = {
  en: await readFile(path.join(root, "en/index.html"), "utf8"),
  tr: await readFile(path.join(root, "tr/index.html"), "utf8"),
};
const styles = await readFile(path.join(root, "styles.css"), "utf8");

for (const [locale, html] of Object.entries(pages)) {
  check(html.includes(`<html lang="${locale}" data-locale="${locale}">`), `${locale}: html language marker is missing`);
  check(html.includes(`<link rel="canonical" href="https://aserdargun.com/${locale}/">`), `${locale}: canonical URL is incorrect`);
  check(html.includes("hreflang=\"en\""), `${locale}: English hreflang is missing`);
  check(html.includes("hreflang=\"tr\""), `${locale}: Turkish hreflang is missing`);
  check(html.includes("hreflang=\"x-default\""), `${locale}: x-default hreflang is missing`);
  check(html.includes("data-language-link=\"tr\""), `${locale}: Turkish language link is missing`);
  check(html.includes("data-language-link=\"en\""), `${locale}: English language link is missing`);
  const trLanguageLink = html.match(/<a[^>]+data-language-link="tr"[^>]*>/)?.[0] ?? "";
  const enLanguageLink = html.match(/<a[^>]+data-language-link="en"[^>]*>/)?.[0] ?? "";
  check(trLanguageLink.includes('aria-label="TR —'), `${locale}: Turkish language label must contain visible text TR`);
  check(enLanguageLink.includes('aria-label="EN —'), `${locale}: English language label must contain visible text EN`);
  const wordmarkLink = html.match(/<a class="wordmark"[^>]*>/)?.[0] ?? "";
  check(wordmarkLink.includes('aria-label="SG — Serdar Gündoğdu'), `${locale}: wordmark accessible name must contain all visible text`);
  check(html.includes("/styles.css") && html.includes("/scripts.js"), `${locale}: shared root assets are not linked`);
  check(html.includes("data-career-portrait"), `${locale}: career portrait stage is missing`);
  check(html.includes("data-career-transition"), `${locale}: career transition canvas is missing`);
  check(html.includes('width="640" height="800"'), `${locale}: normalized career portrait dimensions are missing`);
  check(!html.includes("current-stage-link"), `${locale}: current-stage Explore buttons must be removed`);

  const stageKeys = matches(html, /data-stage-key="([^"]+)"/g);
  check(JSON.stringify(stageKeys) === JSON.stringify(expectedStageKeys), `${locale}: timeline stage keys or order differ`);
  const stageNumbers = matches(html, /data-stage-number="([^"]+)"/g);
  check(JSON.stringify(stageNumbers) === JSON.stringify(expectedStageNumbers), `${locale}: timeline stage numbers must descend from 08 to 01`);
  for (const assetName of expectedStageImages) {
    check(html.includes(`/images/career/${assetName}.webp`), `${locale}: WebP career portrait is missing: ${assetName}`);
    check(html.includes(`/images/career/${assetName}.png`), `${locale}: PNG career portrait is missing: ${assetName}`);
  }
  const withoutCredential = html.replaceAll("AWS Certified AI Practitioner", "");
  check(!/AI Practitioner/i.test(withoutCredential), `${locale}: AI Practitioner remains as a personal title`);

  for (const anchor of expectedAnchors) {
    check(new RegExp(`id="${anchor}"`).test(html), `${locale}: #${anchor} anchor is missing`);
  }

  check(html.includes('class="app-map"'), `${locale}: application map is missing`);
  check(html.includes('aria-labelledby="app-map-title"'), `${locale}: application map heading relationship is missing`);
  check(html.includes('aria-describedby="app-map-description"'), `${locale}: application map description relationship is missing`);
  const appCodes = matches(html, /<th scope="row"><code>([^<]+)<\/code><\/th>/g);
  check(JSON.stringify(appCodes) === JSON.stringify(expectedAppCodes), `${locale}: application codes or order differ`);
  for (const url of expectedAppUrls) {
    check(html.includes(`href="${url}"`), `${locale}: application URL is missing: ${url}`);
  }
  for (const repository of expectedAppRepos) {
    check(html.includes(`<code>${repository}</code>`), `${locale}: repository mapping is missing: ${repository}`);
  }
  for (const retiredUrl of retiredProjectUrls) {
    check(!html.includes(`href="${retiredUrl}"`), `${locale}: retired project URL remains: ${retiredUrl}`);
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
check(pages.en.includes("AI Engineer"), "English AI Engineer status is missing");
check(pages.tr.includes("AI Engineer"), "Turkish AI Engineer status is missing");
check(pages.en.includes("Reading direction · 08 → 01"), "English reverse-chronology explanation is missing");
check(pages.tr.includes("Okuma yönü · 08 → 01"), "Turkish reverse-chronology explanation is missing");
check(pages.en.includes("https://gpu.aserdargun.com/") && pages.tr.includes("https://gpu.aserdargun.com/"), "Kernel Atlas link is missing");
check(pages.en.includes("https://usl.aserdargun.com/") && pages.tr.includes("https://usl.aserdargun.com/"), "Unsloth Studio Learning link is missing");
check(pages.en.includes("One portfolio, six focused applications."), "English application map definition is missing");
check(pages.tr.includes("Tek portföy, altı odaklı uygulama."), "Turkish application map definition is missing");
check(!pages.en.includes("<h3>GPU Kernel Engineer") && !pages.tr.includes("<h3>GPU Kernel Engineer"), "Legacy GPU Kernel Engineer career title is still present");
check(styles.includes(".career-transition"), "Career transition canvas styles are missing");
check(styles.includes(".career-portrait-fallback"), "Career portrait fallback styles are missing");
check(/\.has-js \.timeline-step\s*\{[^}]*opacity:\s*1;/.test(styles), "Inactive timeline steps must not reduce descendant contrast with parent opacity");
check(/\.section-kicker\s*\{[^}]*color:\s*rgba\(18, 19, 16, 0\.65\);/.test(styles), "Section kicker contrast is below the required token");
check(styles.includes(".app-map tbody tr:first-child"), "Stackfolio-first application map styling is missing");
check(styles.includes(".app-map tbody td:nth-of-type(1) span"), "Application descriptions are not styled");
for (const selector of ["credentials-heading", "credentials small"]) {
  const selectorPattern = selector.replace(" ", "\\s+");
  check(new RegExp(`\\.${selectorPattern}\\s*\\{[^}]*color:\\s*rgba\\(18, 19, 16, 0\\.7\\);`).test(styles), `${selector} contrast is below the required token`);
}

const rootPage = await readFile(path.join(root, "index.html"), "utf8");
check(rootPage.includes('<html lang="en" data-locale="en">'), "Root English language marker is missing");
check(rootPage.includes('<link rel="canonical" href="https://aserdargun.com/">'), "Root canonical URL is incorrect");
check(rootPage.includes('<meta property="og:url" content="https://aserdargun.com/">'), "Root Open Graph URL is incorrect");
check(rootPage.includes('"url": "https://aserdargun.com/"'), "Root JSON-LD URL is incorrect");
check(!rootPage.includes("window.location.replace"), "Root must not redirect with client JavaScript");
check(rootPage.includes('href="/tr/"') && rootPage.includes('href="/en/"'), "Root language links are missing");
check(JSON.stringify(matches(rootPage, /data-stage-key="([^"]+)"/g)) === JSON.stringify(expectedStageKeys), "Root timeline stage keys or order differ");
check(JSON.stringify(matches(rootPage, /data-stage-number="([^"]+)"/g)) === JSON.stringify(expectedStageNumbers), "Root timeline stage numbers must descend from 08 to 01");
for (const assetName of expectedStageImages) {
  check(rootPage.includes(`/images/career/${assetName}.webp`), `Root WebP career portrait is missing: ${assetName}`);
  check(rootPage.includes(`/images/career/${assetName}.png`), `Root PNG career portrait is missing: ${assetName}`);
}
check(!/AI Practitioner/i.test(rootPage.replaceAll("AWS Certified AI Practitioner", "")), "Root AI Practitioner personal title remains");
for (const url of expectedAppUrls) {
  check(rootPage.includes(`href="${url}"`), `Root application URL is missing: ${url}`);
}
check(rootPage.includes("<h3>AI Engineer</h3>") && !rootPage.includes("<h3>GPU Kernel Engineer"), "Root AI Engineer career content is incorrect");
check(!rootPage.includes("current-stage-link"), "Root current-stage Explore buttons must be removed");

const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
check(sitemap.includes("<loc>https://aserdargun.com/</loc>"), "Sitemap is missing root URL");
check(sitemap.includes("https://aserdargun.com/en/"), "Sitemap is missing /en/");
check(sitemap.includes("https://aserdargun.com/tr/"), "Sitemap is missing /tr/");

for (const asset of ["images/og-ascii.png", "images/og-ascii-tr.png", "styles.css", "scripts.js"]) {
  try {
    await stat(path.join(root, asset));
  } catch {
    failures.push(`Required asset is missing: ${asset}`);
  }
}

const trOgBuffer = await readFile(path.join(root, "images/og-ascii-tr.png"));
const trOgDimensions = readPngDimensions(trOgBuffer);
check(trOgDimensions?.width === 1730 && trOgDimensions?.height === 909, "Turkish Open Graph image must be 1730×909 PNG");

for (const assetName of expectedStageImages) {
  const pngPath = path.join(root, `images/career/${assetName}.png`);
  const webpPath = path.join(root, `images/career/${assetName}.webp`);
  const pngBuffer = await readFile(pngPath).catch(() => null);
  const pngStats = await stat(pngPath).catch(() => null);
  const webpStats = await stat(webpPath).catch(() => null);

  check(Boolean(pngBuffer), `Career PNG is missing: ${assetName}`);
  check(Boolean(webpStats), `Career WebP is missing: ${assetName}`);
  if (pngBuffer) {
    const dimensions = readPngDimensions(pngBuffer);
    check(dimensions?.width === 640 && dimensions?.height === 800, `Career PNG must be 640×800: ${assetName}`);
    check(pngHasAlpha(pngBuffer), `Career PNG must support transparency: ${assetName}`);
  }
  if (pngStats) check(pngStats.size <= 1_500_000, `Career PNG exceeds 1.5 MB: ${assetName}`);
  if (webpStats) check(webpStats.size <= 300_000, `Career WebP exceeds 300 KB: ${assetName}`);
}

if (failures.length > 0) {
  console.error("Site validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Site validation passed: TR/EN routes, application map, timeline parity, metadata, links, and assets are consistent.");
}
