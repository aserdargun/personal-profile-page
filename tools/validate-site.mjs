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
const expectedPortraitModes = [
  "ascii-depth",
  "ascii-depth",
  "ascii-depth",
  "pixel-analog",
  "pixel-analog",
  "pixel-analog",
  "pixel-analog",
  "pixel-analog",
];
const expectedPixelSizes = ["4", "6", "8", "11", "14"];
const expectedPaletteLevels = ["5", "4", "4", "3", "2"];
const expectedEnglishBridges = [
  "Turning intelligence into working systems",
  "From models to products",
  "From data to models",
  "From operations to data",
  "Making production measurable",
  "From materials to evidence",
  "Systems and flow",
  "Matter and mechanics",
];
const expectedTurkishBridges = [
  "Zekâyı çalışan sistemlere dönüştürmek",
  "Modellerden ürünlere",
  "Veriden modellere",
  "Operasyondan veriye",
  "Üretimi ölçülebilir kılmak",
  "Malzemeden kanıta",
  "Sistemler ve akış",
  "Madde ve mekanik",
];
const expectedAnchors = ["top", "apps", "learning", "journey", "approach", "about"];
const expectedAssetVersion = "20260819-learning-mobile";
const expectedStylesheetHref = `/styles.css?v=${expectedAssetVersion}`;
const expectedScriptSrc = `/scripts.js?v=${expectedAssetVersion}`;
const expectedApplicationRows = [
  { code: "aia", repository: "aia-aserdargun-com", repositoryUrl: "https://github.com/aserdargun/aia-aserdargun-com", productUrl: "https://aia.aserdargun.com/", productLabel: "aia.aserdargun.com" },
  { code: "llm", repository: "llm-aserdargun-com", repositoryUrl: "https://github.com/aserdargun/llm-aserdargun-com", productUrl: "https://llm.aserdargun.com/", productLabel: "llm.aserdargun.com" },
  { code: "usl", repository: "usl-aserdargun-com", repositoryUrl: "https://github.com/aserdargun/usl-aserdargun-com", productUrl: "https://usl.aserdargun.com/", productLabel: "usl.aserdargun.com" },
  { code: "gpu", repository: "gpu-aserdargun-com", repositoryUrl: "https://github.com/aserdargun/gpu-aserdargun-com", productUrl: "https://gpu.aserdargun.com/", productLabel: "gpu.aserdargun.com" },
  { code: "cld", repository: "cld-aserdargun-com", repositoryUrl: "https://github.com/aserdargun/cld-aserdargun-com", productUrl: "https://cld.aserdargun.com/", productLabel: "cld.aserdargun.com" },
].map((row) => ({
  code: row.code,
  repository: row.repository,
  repositoryUrl: row.repositoryUrl,
  repositoryTarget: "_blank",
  repositoryRel: "noreferrer",
  repositoryArrow: "↗",
  repositoryArrowAriaHidden: "true",
  productUrl: row.productUrl,
  productTarget: "_blank",
  productRel: "noreferrer",
  productLabel: row.productLabel,
  productArrow: "↗",
  productArrowAriaHidden: "true",
}));
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

function tokenizeAttributes(source) {
  const attributes = new Map();
  const pattern = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    const values = attributes.get(name) ?? [];
    values.push(value);
    attributes.set(name, values);
  }
  return attributes;
}

function attribute(attributes, name) {
  const values = attributes.get(name.toLowerCase());
  return values?.length === 1 ? values[0] : null;
}

function parseMarkerContent(content) {
  const match = content.match(/^\s*([\s\S]*?)\s*<span\b([^>]*)>([\s\S]*?)<\/span>\s*$/i);
  if (!match) return null;
  const [, label, markerAttributes, marker] = match;
  return {
    label: label.trim(),
    marker: marker.trim(),
    markerAriaHidden: attribute(tokenizeAttributes(markerAttributes), "aria-hidden"),
  };
}

function parseAnchor(anchorHtml) {
  const match = anchorHtml.match(/^<a\b([^>]*)>([\s\S]*?)<\/a>$/i);
  if (!match) return null;
  const [, attributeSource, content] = match;
  const attributes = tokenizeAttributes(attributeSource);
  return {
    href: attribute(attributes, "href"),
    target: attribute(attributes, "target"),
    rel: attribute(attributes, "rel"),
    content,
  };
}

function onlyAnchor(cell) {
  const openingAnchorCount = Array.from(cell.matchAll(/<a\b/gi)).length;
  const anchors = Array.from(cell.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi), (match) => match[0]);
  return openingAnchorCount === 1 && anchors.length === 1 ? parseAnchor(anchors[0]) : null;
}

function parseApplicationMapRows(html) {
  const body = html.match(/<section class="app-map"[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? "";
  return Array.from(body.matchAll(/<tr>([\s\S]*?)<\/tr>/g), (match) => {
    const row = match[1];
    const cells = Array.from(row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi), (cell) => cell[1]);
    const repositoryAnchor = cells.length === 3 ? onlyAnchor(cells[1]) : null;
    const productAnchor = cells.length === 3 ? onlyAnchor(cells[2]) : null;
    const repositoryPresentation = parseMarkerContent(repositoryAnchor?.content ?? "");
    const repository = repositoryPresentation?.label.match(/^<code>([^<]+)<\/code>$/)?.[1] ?? null;
    const productPresentation = parseMarkerContent(productAnchor?.content ?? "");
    const productLabel = productPresentation && !/[<>]/.test(productPresentation.label)
      ? productPresentation.label
      : null;
    return {
      code: row.match(/<th\s+scope="row">\s*<code>([^<]+)<\/code>\s*<\/th>/)?.[1] ?? null,
      repository,
      repositoryUrl: repositoryAnchor?.href ?? null,
      repositoryTarget: repositoryAnchor?.target ?? null,
      repositoryRel: repositoryAnchor?.rel ?? null,
      repositoryArrow: repositoryPresentation?.marker ?? null,
      repositoryArrowAriaHidden: repositoryPresentation?.markerAriaHidden ?? null,
      productUrl: productAnchor?.href ?? null,
      productTarget: productAnchor?.target ?? null,
      productRel: productAnchor?.rel ?? null,
      productLabel,
      productArrow: productPresentation?.marker ?? null,
      productArrowAriaHidden: productPresentation?.markerAriaHidden ?? null,
    };
  });
}

function validateApplicationMapRows(locale, html) {
  const rows = parseApplicationMapRows(html);
  check(rows.length === expectedApplicationRows.length, `${locale}: application map row count differs`);
  check(
    JSON.stringify(rows) === JSON.stringify(expectedApplicationRows),
    `${locale}: application map row tuples or order differ`,
  );
}

const expectedLearningCodes = ["aia", "gpu", "llm", "usl", "cld", "aia"];
const expectedLearningUrls = expectedLearningCodes.map((code) => `https://${code}.aserdargun.com/`);
const expectedLearningQuestions = {
  en: [
    "“What exists?”",
    "“How does compute work?”",
    "“How do models run?”",
    "“How do models learn/change?”",
    "“How do I operate this at scale?”",
    "“Where does this technology fit?”",
  ],
  tr: [
    "“Neler var?”",
    "“Hesaplama nasıl çalışır?”",
    "“Modeller nasıl çalıştırılır?”",
    "“Modeller nasıl öğrenir/değişir?”",
    "“Bunu ölçekte nasıl işletirim?”",
    "“Bu teknoloji nereye oturur?”",
  ],
};
const expectedLearningStudyRoles = {
  en: [
    "Living map · never “done”",
    "Foundation",
    "Main project",
    "From running to changing models",
    "Production, last",
  ],
  tr: [
    "Yaşayan harita · hiç “bitmez”",
    "Temel katman",
    "Ana proje",
    "Çalıştırmadan değiştirmeye",
    "Üretim · en son",
  ],
};
const expectedLearningTopics = {
  en: [
    "ecosystem → models → training → inference → runtime → hardware → cloud",
    "CPU vs GPU → GPU architecture → VRAM → memory bandwidth → CUDA / Tensor cores → FP32 / FP16 / BF16 / FP8 / INT8 / INT4 → matrix multiplication → CUDA kernels → FlashAttention → KV cache → quantization → multi-GPU → tensor parallelism",
    "model → architecture → precision → memory calculator → runtime → inference engine → serving → API → benchmark",
    "Ollama · llama.cpp · vLLM · SGLang · TensorRT-LLM · Transformers · MLX",
    "pretrained model → dataset → tokenization → LoRA → QLoRA → SFT → DPO → GRPO → evaluation → merged model → LLM runtime",
    "model → vLLM → Docker → GPU instance → cloud GPU → load balancer → autoscaling → API",
  ],
  tr: [
    "ekosistem → modeller → eğitim → inference → runtime → donanım → bulut",
    "CPU vs GPU → GPU mimarisi → VRAM → bellek bant genişliği → CUDA / Tensor çekirdekleri → FP32 / FP16 / BF16 / FP8 / INT8 / INT4 → matris çarpımı → CUDA kernelleri → FlashAttention → KV cache → quantization → çoklu GPU → tensor paralellik",
    "model → mimari → hassasiyet → bellek hesabı → runtime → inference motoru → sunum → API → benchmark",
    "Ollama · llama.cpp · vLLM · SGLang · TensorRT-LLM · Transformers · MLX",
    "eğitilmiş model → veri seti → tokenization → LoRA → QLoRA → SFT → DPO → GRPO → değerlendirme → birleştirilmiş model → LLM runtime",
    "model → vLLM → Docker → GPU instance → bulut GPU → load balancer → autoscaling → API",
  ],
};

function validateLearningSystem(locale, html) {
  const isTurkish = locale === "tr";
  const section = html.match(/<section class="learning-system"[\s\S]*?<\/section>/)?.[0] ?? "";
  check(section.length > 0, `${locale}: learning system section is missing`);
  if (section.length === 0) return;
  check(section.includes('id="learning"'), `${locale}: learning system anchor is missing`);
  check(section.includes('aria-labelledby="learning-title"'), `${locale}: learning system heading relationship is missing`);
  check(section.includes('aria-describedby="learning-description"'), `${locale}: learning system description relationship is missing`);
  const intro = section.match(/<div class="learning-intro">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const expectedKicker = isTurkish
    ? "Öğrenme sistemi · AI Ekosistem Atlası"
    : "Learning system · AI Ecosystem Atlas";
  const expectedHeading = isTurkish
    ? "Atlas bir öğrenme sistemidir."
    : "The atlas is a learning system.";
  check(intro.includes(expectedKicker), `${locale}: learning system kicker is missing`);
  check(intro.includes(expectedHeading), `${locale}: learning system heading is missing`);
  check(section.includes('<pre class="learning-diagram" aria-hidden="true">'), `${locale}: learning system diagram is missing`);
  check(section.includes("AIA") && section.includes("CLD"), `${locale}: learning system diagram endpoints are missing`);
  const codes = matches(section, /<code class="learning-code">([a-z]{3})<\/code>/g);
  check(JSON.stringify(codes) === JSON.stringify(expectedLearningCodes), `${locale}: learning system node codes or order differ`);
  const urls = matches(section, /<a class="learning-node-link" href="(https:\/\/[a-z]{3}\.aserdargun\.com\/)" target="_blank" rel="noreferrer">/g);
  check(JSON.stringify(urls) === JSON.stringify(expectedLearningUrls), `${locale}: learning system node links or order differ`);
  for (const [index, code] of expectedLearningCodes.entries()) {
    const link = `<a class="learning-node-link" href="${expectedLearningUrls[index]}" target="_blank" rel="noreferrer">${code}.aserdargun.com <span aria-hidden="true">↗</span></a>`;
    check(section.includes(link), `${locale}: learning system node link is missing or malformed: ${code}`);
  }
  check(section.includes("gpu → llm") && section.includes("usl → llm") && section.includes("llm → gpu"), `${locale}: learning system feed markers are missing`);
  const questions = matches(section, /<p class="learning-question">([^<]+)<\/p>/g);
  check(
    JSON.stringify(questions) === JSON.stringify(isTurkish ? expectedLearningQuestions.tr : expectedLearningQuestions.en),
    `${locale}: learning system guiding questions or order differ`,
  );
  const studyCodes = matches(section, /<li><span class="learning-order" aria-hidden="true">\d<\/span><code>([a-z]{3})<\/code>/g);
  check(JSON.stringify(studyCodes) === JSON.stringify(["aia", "gpu", "llm", "usl", "cld"]), `${locale}: learning study order codes differ`);
  const studyRoles = matches(section, /<span class="learning-study-role">([^<]+)<\/span>/g);
  check(
    JSON.stringify(studyRoles) === JSON.stringify(isTurkish ? expectedLearningStudyRoles.tr : expectedLearningStudyRoles.en),
    `${locale}: learning study order roles differ`,
  );
  const topics = matches(section, /<p class="learning-topics">([\s\S]*?)<\/p>/g).map((topic) => topic.replace(/<span aria-hidden="true">([^<]*)<\/span>/g, "$1").replace(/\s+/g, " ").trim());
  check(
    JSON.stringify(topics) === JSON.stringify(isTurkish ? expectedLearningTopics.tr : expectedLearningTopics.en),
    `${locale}: learning system topic chains differ`,
  );
  check((section.match(/class="learning-stage-label"/g) || []).length === 4, `${locale}: learning system must keep four stages`);
}

function validateLearningInvest(locale, html) {
  const isTurkish = locale === "tr";
  const section = html.match(/<section class="learning-invest"[\s\S]*?<\/section>/)?.[0] ?? "";
  check(section.length > 0, `${locale}: learning investment section is missing`);
  if (section.length === 0) return;
  const segments = matches(section, /<span class="learning-invest-seg" style="flex-basis: \d+%;"><code>([a-z]{3})<\/code> ([^<]+)<\/span>/g);
  const expectedCodes = ["llm", "gpu", "usl", "cld", "aia"];
  check(JSON.stringify(segments) === JSON.stringify(expectedCodes), `${locale}: learning investment segment codes or order differ`);
  const labels = Array.from(
    section.matchAll(/<span class="learning-invest-seg" style="flex-basis: \d+%;"><code>[a-z]{3}<\/code> ([^<]+)<\/span>/g),
    (match) => match[1].trim(),
  );
  const expectedLabels = isTurkish ? ["%30", "%25", "%20", "%15", "%10"] : ["30%", "25%", "20%", "15%", "10%"];
  check(JSON.stringify(labels) === JSON.stringify(expectedLabels), `${locale}: learning investment percentages differ`);
  const expectedBasis = ["30", "25", "20", "15", "10"];
  const basis = matches(section, /flex-basis: (\d+)%;/g);
  check(JSON.stringify(basis) === JSON.stringify(expectedBasis), `${locale}: learning investment weights differ`);
}

function stripCssComments(source) {
  let result = "";
  let quote = null;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      result += character;
      if (character === "\\") {
        index += 1;
        result += source[index] ?? "";
      } else if (character === quote) {
        quote = null;
      }
    } else if (character === '"' || character === "'") {
      quote = character;
      result += character;
    } else if (character === "/" && source[index + 1] === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) index += 1;
      index += 1;
      result += " ";
    } else {
      result += character;
    }
  }
  return result;
}

function findCssDelimiter(source, start) {
  let quote = null;
  let parentheses = 0;
  let brackets = 0;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === "(") parentheses += 1;
    else if (character === ")") parentheses = Math.max(0, parentheses - 1);
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets = Math.max(0, brackets - 1);
    else if (parentheses === 0 && brackets === 0 && (character === "{" || character === ";")) {
      return { character, index };
    }
  }
  return null;
}

function findMatchingCssBrace(source, openIndex) {
  let depth = 1;
  let quote = null;
  for (let index = openIndex + 1; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === "{") depth += 1;
    else if (character === "}" && --depth === 0) return index;
  }
  return -1;
}

function splitCssSelectorList(source) {
  const selectors = [];
  let start = 0;
  let quote = null;
  let parentheses = 0;
  let brackets = 0;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = null;
    } else if (character === '"' || character === "'") quote = character;
    else if (character === "(") parentheses += 1;
    else if (character === ")") parentheses = Math.max(0, parentheses - 1);
    else if (character === "[") brackets += 1;
    else if (character === "]") brackets = Math.max(0, brackets - 1);
    else if (character === "," && parentheses === 0 && brackets === 0) {
      selectors.push(source.slice(start, index).trim());
      start = index + 1;
    }
  }
  selectors.push(source.slice(start).trim());
  return selectors.filter(Boolean);
}

function scanCssRules(source) {
  const rules = [];
  const groupingAtRules = new Set(["container", "document", "layer", "media", "scope", "starting-style", "supports"]);

  function scanBlock(block) {
    let cursor = 0;
    while (cursor < block.length) {
      while (/\s/.test(block[cursor] ?? "")) cursor += 1;
      const delimiter = findCssDelimiter(block, cursor);
      if (!delimiter) break;
      if (delimiter.character === ";") {
        cursor = delimiter.index + 1;
        continue;
      }
      const closeIndex = findMatchingCssBrace(block, delimiter.index);
      if (closeIndex < 0) break;
      const prelude = block.slice(cursor, delimiter.index).trim();
      const body = block.slice(delimiter.index + 1, closeIndex);
      if (prelude.startsWith("@")) {
        const atRuleName = prelude.match(/^@([\w-]+)/)?.[1].toLowerCase();
        if (groupingAtRules.has(atRuleName)) scanBlock(body);
      } else if (prelude) {
        rules.push({ selectors: splitCssSelectorList(prelude), declarations: body });
      }
      cursor = closeIndex + 1;
    }
  }

  scanBlock(stripCssComments(source));
  return rules;
}

function declarationExists(rule, property, value) {
  const declarations = rule.split(";");
  return declarations.some((declaration) => {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex < 0) return false;
    const actualProperty = declaration.slice(0, colonIndex).trim().toLowerCase();
    const actualValue = declaration.slice(colonIndex + 1).trim().toLowerCase();
    return actualProperty === property && actualValue === value;
  });
}

const canonicalRepositoryCodeSelector = ".app-map tbody td:nth-of-type(2) a code";
const retiredRowSelectorSuffixes = [
  ".app-map tbody tr:first-child",
  ".app-map tbody > tr:first-child",
  ".app-map > tbody tr:first-child",
  ".app-map > tbody > tr:first-child",
  ".app-map tbody tr:nth-child(1)",
  ".app-map tbody > tr:nth-child(1)",
  ".app-map > tbody tr:nth-child(1)",
  ".app-map > tbody > tr:nth-child(1)",
];

function normalizeCssSelectorComponent(selector) {
  return selector
    .trim()
    .replace(/[ \t\r\n\f]+/g, " ")
    .replace(/[ \t\r\n\f]*>[ \t\r\n\f]*/g, " > ");
}

function isCanonicalRepositoryCodeSelector(selector) {
  return normalizeCssSelectorComponent(selector) === canonicalRepositoryCodeSelector;
}

function isRetiredRowSelector(selector) {
  const normalized = normalizeCssSelectorComponent(selector);
  return retiredRowSelectorSuffixes.some(
    (suffix) => normalized === suffix || normalized.endsWith(` ${suffix}`),
  );
}

function readPngDimensions(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function pngHasAlpha(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") return false;
  const colorType = buffer.readUInt8(25);
  if ([4, 6].includes(colorType)) return true;
  if (colorType !== 3) return false;
  let offset = 8;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("latin1", offset + 4, offset + 8);
    if (type === "tRNS") return true;
    if (type === "IDAT") break;
    offset += 12 + length;
  }
  return false;
}

function readJpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  return null;
}

const pages = {
  en: await readFile(path.join(root, "index.html"), "utf8"),
  tr: await readFile(path.join(root, "tr/index.html"), "utf8"),
};
const styles = await readFile(path.join(root, "styles.css"), "utf8");

for (const [locale, html] of Object.entries(pages)) {
  const expectedCanonical = locale === "tr" ? "https://aserdargun.com/tr/" : "https://aserdargun.com/";
  check(html.includes(`<html lang="${locale}" data-locale="${locale}">`), `${locale}: html language marker is missing`);
  check(html.includes(`<link rel="canonical" href="${expectedCanonical}">`), `${locale}: canonical URL is incorrect`);
  check(!html.includes("https://aserdargun.com/en/"), `${locale}: retired /en/ URL remains`);
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
  check(html.includes(`<link rel="stylesheet" href="${expectedStylesheetHref}">`), `${locale}: stylesheet cache version is stale`);
  check(html.includes(`<script src="${expectedScriptSrc}" defer></script>`), `${locale}: script cache version is stale`);
  check(html.includes("data-career-portrait"), `${locale}: career portrait stage is missing`);
  check(html.includes("data-career-transition"), `${locale}: career transition canvas is missing`);
  check(html.includes('width="640" height="800"'), `${locale}: normalized career portrait dimensions are missing`);
  check(!html.includes("current-stage-link"), `${locale}: current-stage Explore buttons must be removed`);

  const stageKeys = matches(html, /data-stage-key="([^"]+)"/g);
  check(JSON.stringify(stageKeys) === JSON.stringify(expectedStageKeys), `${locale}: timeline stage keys or order differ`);
  const stageNumbers = matches(html, /class="timeline-index">(\d+)<\/span>/g);
  check(JSON.stringify(stageNumbers) === JSON.stringify(expectedStageNumbers), `${locale}: timeline stage numbers must descend from 08 to 01`);
  const portraitModes = matches(html, /data-stage-portrait-mode="([^"]+)"/g);
  check(JSON.stringify(portraitModes) === JSON.stringify(expectedPortraitModes), `${locale}: portrait modes or order differ`);
  const pixelSizes = matches(html, /data-stage-pixel-size="([^"]+)"/g);
  check(JSON.stringify(pixelSizes) === JSON.stringify(expectedPixelSizes), `${locale}: analog pixel sizes must be 4, 6, 8, 11, 14 in reverse timeline order`);
  const paletteLevels = matches(html, /data-stage-palette-levels="([^"]+)"/g);
  check(JSON.stringify(paletteLevels) === JSON.stringify(expectedPaletteLevels), `${locale}: analog palette levels must be 5, 4, 4, 3, 2 in reverse timeline order`);
  const expectedBridges = locale === "tr" ? expectedTurkishBridges : expectedEnglishBridges;
  const bridges = matches(html, /class="portrait-story-bridge">([^<]+)<\/span>/g);
  check(JSON.stringify(bridges) === JSON.stringify(expectedBridges), `${locale}: physical-to-digital bridge copy differs`);
  check((html.match(/class="portrait-story"/g) || []).length === 8, `${locale}: every portrait needs one visible story`);
  const worldLabels = matches(html, /class="portrait-story-world"><span aria-hidden="true">[^<]*<\/span>\s*([^<]+)<\/span>/g);
  const expectedWorldLabels = expectedPortraitModes.map((mode) => (
    locale === "tr"
      ? mode === "pixel-analog" ? "FİZİKSEL DÜNYA" : "DİJİTAL DÜNYA"
      : mode === "pixel-analog" ? "PHYSICAL WORLD" : "DIGITAL WORLD"
  ));
  check(JSON.stringify(worldLabels) === JSON.stringify(expectedWorldLabels), `${locale}: physical/digital world labels differ`);
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
  check(html.includes('class="app-map-band"'), `${locale}: standalone application map band is missing`);
  check(html.includes('aria-labelledby="app-map-title"'), `${locale}: application map heading relationship is missing`);
  check(html.includes('aria-describedby="app-map-description"'), `${locale}: application map description relationship is missing`);
  validateApplicationMapRows(locale, html);
  validateLearningSystem(locale, html);
  validateLearningInvest(locale, html);
  check(html.includes('<a href="#learning">'), `${locale}: learning navigation link is missing`);

  const appMapIntro = html.match(/<div class="app-map-intro">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const expectedKicker = locale === "tr"
    ? "Uygulama haritası · canlı adresler"
    : "Application map · live destinations";
  const expectedHeading = locale === "tr"
    ? "Tek portföy. Odaklı uygulamalar."
    : "One portfolio. Focused applications.";
  check(appMapIntro.includes(expectedKicker), `${locale}: number-neutral application map kicker is missing`);
  check(appMapIntro.includes(expectedHeading), `${locale}: number-neutral application map heading is missing`);
  check(!/\b(?:06|six|altı)\b/i.test(appMapIntro), `${locale}: numeric application count remains in the map introduction`);

  check(!html.includes('<th scope="row"><code>stk</code></th>'), `${locale}: Stackfolio application code remains`);
  check(!html.includes("Stackfolio"), `${locale}: Stackfolio product content remains`);
  check(!html.includes("stk-aserdargun-com"), `${locale}: Stackfolio repository name remains`);
  check(!html.includes("https://stk.aserdargun.com/"), `${locale}: Stackfolio product URL remains`);
  check(!html.includes("https://github.com/aserdargun/stk-aserdargun-com"), `${locale}: Stackfolio repository URL remains`);
  for (const retiredUrl of retiredProjectUrls) {
    check(!html.includes(`href="${retiredUrl}"`), `${locale}: retired project URL remains: ${retiredUrl}`);
  }

  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  check(Boolean(jsonLdMatch), `${locale}: JSON-LD is missing`);
  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      check(jsonLd["@type"] === "Person", `${locale}: JSON-LD type must be Person`);
      check(jsonLd.url === (locale === "tr" ? "https://aserdargun.com/tr/" : "https://aserdargun.com/"), `${locale}: JSON-LD URL is incorrect`);
      check(!String(jsonLd.image || "").includes("?"), `${locale}: JSON-LD image URL must not carry a cache-busting query`);
    } catch (error) {
      failures.push(`${locale}: JSON-LD is invalid JSON (${error.message})`);
    }
  }

  check(html.includes('rel="preload" href="/fonts/inter-var-latin.woff2"'), `${locale}: self-hosted Inter preload is missing`);
  check(html.includes('class="contact-kicker"'), `${locale}: contact section heading is missing`);
}

const externalAnchorPattern = /<a[^>]+href="(https:\/\/[^"#]+)"/g;
const enExternalLinks = matches(pages.en, externalAnchorPattern).sort();
const trExternalLinks = matches(pages.tr, externalAnchorPattern).sort();
check(JSON.stringify(enExternalLinks) === JSON.stringify(trExternalLinks), "TR/EN external links differ");

check(pages.en.includes("https://aserdargun.com/images/og-ascii.jpg"), "English Open Graph image is incorrect");
check(pages.tr.includes("https://aserdargun.com/images/og-ascii-tr.jpg"), "Turkish Open Graph image is incorrect");
check(pages.en.includes('<meta property="og:image:type" content="image/jpeg">'), "English Open Graph image MIME type is missing");
check(pages.tr.includes('<meta property="og:image:type" content="image/jpeg">'), "Turkish Open Graph image MIME type is missing");
check(pages.en.includes("AI Engineer"), "English AI Engineer status is missing");
check(pages.tr.includes("AI Engineer"), "Turkish AI Engineer status is missing");
check(pages.en.includes("Reading direction · 08 → 01"), "English reverse-chronology explanation is missing");
check(pages.tr.includes("Okuma yönü · 08 → 01"), "Turkish reverse-chronology explanation is missing");
check(pages.en.includes("https://gpu.aserdargun.com/") && pages.tr.includes("https://gpu.aserdargun.com/"), "Kernel Atlas link is missing");
check(pages.en.includes("https://usl.aserdargun.com/") && pages.tr.includes("https://usl.aserdargun.com/"), "Unsloth Studio Learning link is missing");
check(pages.en.includes("One portfolio. Focused applications."), "English application map definition is missing");
check(pages.tr.includes("Tek portföy. Odaklı uygulamalar."), "Turkish application map definition is missing");
check(!pages.en.includes("<h3>GPU Kernel Engineer") && !pages.tr.includes("<h3>GPU Kernel Engineer"), "Legacy GPU Kernel Engineer career title is still present");
check(styles.includes(".career-transition"), "Career transition canvas styles are missing");
check(styles.includes(".career-portrait-fallback"), "Career portrait fallback styles are missing");
check(/\.has-js \.timeline-step\s*\{[^}]*opacity:\s*1;/.test(styles), "Inactive timeline steps must not reduce descendant contrast with parent opacity");
check(/\.section-kicker\s*\{[^}]*color:\s*rgba\(18, 19, 16, 0\.65\);/.test(styles), "Section kicker contrast is below the required token");
const cssRules = scanCssRules(styles);
check(
  !cssRules.some((rule) => rule.selectors.some(isRetiredRowSelector)),
  "Stackfolio-first application map styling remains",
);
const requiredRepositoryCodeDeclarations = [
  ["color", "inherit"],
  ["font", "inherit"],
  ["overflow-wrap", "anywhere"],
  ["white-space", "inherit"],
];
const repositoryCodeRules = cssRules.filter(
  (rule) => rule.selectors.some(isCanonicalRepositoryCodeSelector),
);
check(repositoryCodeRules.length > 0, "Repository code labels do not inherit application map link styling");
check(
  repositoryCodeRules.some((rule) => requiredRepositoryCodeDeclarations.every(
    ([property, value]) => declarationExists(rule.declarations, property, value),
  )),
  "Repository code labels must declare color: inherit, font: inherit, overflow-wrap: anywhere, and white-space: inherit in the same canonical rule",
);
check(styles.includes(".app-map tbody td:nth-of-type(1) span"), "Application descriptions are not styled");
for (const selector of ["credentials-heading", "credentials small"]) {
  const selectorPattern = selector.replace(" ", "\\s+");
  check(new RegExp(`\\.${selectorPattern}\\s*\\{[^}]*color:\\s*rgba\\(18, 19, 16, 0\\.7\\);`).test(styles), `${selector} contrast is below the required token`);
}

const rootPage = await readFile(path.join(root, "index.html"), "utf8");
check(rootPage.includes('<html lang="en" data-locale="en">'), "Root English language marker is missing");
check(rootPage.includes('<link rel="canonical" href="https://aserdargun.com/">'), "Root canonical URL is incorrect");
check(rootPage.includes('<meta property="og:url" content="https://aserdargun.com/">'), "Root Open Graph URL is incorrect");
check(rootPage.includes(`<link rel="stylesheet" href="${expectedStylesheetHref}">`), "Root stylesheet cache version is stale");
check(rootPage.includes(`<script src="${expectedScriptSrc}" defer></script>`), "Root script cache version is stale");
check(rootPage.includes('"url": "https://aserdargun.com/"'), "Root JSON-LD URL is incorrect");
check(!rootPage.includes("window.location.replace"), "Root must not redirect with client JavaScript");
check(rootPage.includes('href="/tr/"') && rootPage.includes('data-language-link="en"'), "Root language links are missing");
check(JSON.stringify(matches(rootPage, /data-stage-key="([^"]+)"/g)) === JSON.stringify(expectedStageKeys), "Root timeline stage keys or order differ");
check(JSON.stringify(matches(rootPage, /class="timeline-index">(\d+)<\/span>/g)) === JSON.stringify(expectedStageNumbers), "Root timeline stage numbers must descend from 08 to 01");
check(JSON.stringify(matches(rootPage, /data-stage-portrait-mode="([^"]+)"/g)) === JSON.stringify(expectedPortraitModes), "Root portrait modes or order differ");
check(JSON.stringify(matches(rootPage, /data-stage-pixel-size="([^"]+)"/g)) === JSON.stringify(expectedPixelSizes), "Root analog pixel sizes must be 4, 6, 8, 11, 14 in reverse timeline order");
check(JSON.stringify(matches(rootPage, /data-stage-palette-levels="([^"]+)"/g)) === JSON.stringify(expectedPaletteLevels), "Root analog palette levels must be 5, 4, 4, 3, 2 in reverse timeline order");
check(JSON.stringify(matches(rootPage, /class="portrait-story-bridge">([^<]+)<\/span>/g)) === JSON.stringify(expectedEnglishBridges), "Root physical-to-digital bridge copy differs");
check((rootPage.match(/class="portrait-story"/g) || []).length === 8, "Root every portrait needs one visible story");
const rootWorldLabels = matches(rootPage, /class="portrait-story-world"><span aria-hidden="true">[^<]*<\/span>\s*([^<]+)<\/span>/g);
check(JSON.stringify(rootWorldLabels) === JSON.stringify(expectedPortraitModes.map((mode) => mode === "pixel-analog" ? "PHYSICAL WORLD" : "DIGITAL WORLD")), "Root physical/digital world labels differ");
for (const assetName of expectedStageImages) {
  check(rootPage.includes(`/images/career/${assetName}.webp`), `Root WebP career portrait is missing: ${assetName}`);
  check(rootPage.includes(`/images/career/${assetName}.png`), `Root PNG career portrait is missing: ${assetName}`);
}
check(!/AI Practitioner/i.test(rootPage.replaceAll("AWS Certified AI Practitioner", "")), "Root AI Practitioner personal title remains");
validateApplicationMapRows("Root", rootPage);
validateLearningSystem("Root", rootPage);
validateLearningInvest("Root", rootPage);
check(rootPage.includes('<a href="#learning">'), "Root learning navigation link is missing");
const rootAppMapIntro = rootPage.match(/<div class="app-map-intro">([\s\S]*?)<\/div>/)?.[1] ?? "";
check(rootAppMapIntro.includes("Application map · live destinations"), "Root number-neutral application map kicker is missing");
check(rootAppMapIntro.includes("One portfolio. Focused applications."), "Root number-neutral application map heading is missing");
check(!/\b(?:06|six)\b/i.test(rootAppMapIntro), "Root numeric application count remains in the map introduction");
check(!rootPage.includes('<th scope="row"><code>stk</code></th>'), "Root Stackfolio application code remains");
check(!rootPage.includes("Stackfolio"), "Root Stackfolio product content remains");
check(!rootPage.includes("stk-aserdargun-com"), "Root Stackfolio repository name remains");
check(!rootPage.includes("https://stk.aserdargun.com/"), "Root Stackfolio product URL remains");
check(rootPage.includes("<h3>AI Engineer</h3>") && !rootPage.includes("<h3>GPU Kernel Engineer"), "Root AI Engineer career content is incorrect");
check(!rootPage.includes("current-stage-link"), "Root current-stage Explore buttons must be removed");

const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
check(sitemap.includes("<loc>https://aserdargun.com/</loc>"), "Sitemap is missing root URL");
check(!sitemap.includes("https://aserdargun.com/en/"), "Sitemap must not list the redirected /en/ URL");
check(sitemap.includes("<loc>https://aserdargun.com/tr/</loc>"), "Sitemap is missing /tr/");

for (const asset of [
  "images/og-ascii.jpg",
  "images/og-ascii-tr.jpg",
  "fonts/inter-var-latin.woff2",
  "fonts/inter-var-latin-ext.woff2",
  "styles.css",
  "scripts.js",
]) {
  try {
    await stat(path.join(root, asset));
  } catch {
    failures.push(`Required asset is missing: ${asset}`);
  }
}

const trOgBuffer = await readFile(path.join(root, "images/og-ascii-tr.jpg"));
const trOgDimensions = readJpegDimensions(trOgBuffer);
check(trOgDimensions?.width === 1200 && trOgDimensions?.height === 630, "Turkish Open Graph image must be 1200×630 JPEG");
check(trOgBuffer.length <= 400_000, "Turkish Open Graph image exceeds 400 KB");

const enOgBuffer = await readFile(path.join(root, "images/og-ascii.jpg"));
check(readJpegDimensions(enOgBuffer)?.width === 1200 && readJpegDimensions(enOgBuffer)?.height === 630, "English Open Graph image must be 1200×630 JPEG");
check(enOgBuffer.length <= 400_000, "English Open Graph image exceeds 400 KB");

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
  if (pngStats) check(pngStats.size <= 250_000, `Career PNG exceeds 250 KB after palette optimization: ${assetName}`);
  if (webpStats) check(webpStats.size <= 300_000, `Career WebP exceeds 300 KB: ${assetName}`);
}

if (failures.length > 0) {
  console.error("Site validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Site validation passed: TR/EN routes, application map, timeline parity, metadata, links, and assets are consistent.");
}
