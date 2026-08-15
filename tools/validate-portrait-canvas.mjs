import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...names) {
    names.forEach((name) => this.values.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.values.delete(name));
  }

  contains(name) {
    return this.values.has(name);
  }

  toggle(name, force) {
    const enabled = force ?? !this.values.has(name);
    if (enabled) this.values.add(name);
    else this.values.delete(name);
    return enabled;
  }
}

function createEventTarget(properties = {}) {
  const listeners = new Map();

  return Object.assign(properties, {
    addEventListener(type, listener) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(listener);
    },
    removeEventListener(type, listener) {
      listeners.set(type, (listeners.get(type) || []).filter((candidate) => candidate !== listener));
    },
    dispatch(type, event = {}) {
      for (const listener of listeners.get(type) || []) listener({ pointerType: "mouse", ...event });
    },
  });
}

function createStage({
  mode = "ascii-depth",
  nominalCellSize,
  paletteLevels,
  scale = 1,
  role = "AI Engineer",
  png = "/images/career/08-ai-engineer.png",
  webp = "/images/career/08-ai-engineer.webp",
} = {}) {
  const attributes = new Map([
    ["data-stage-image-alt", `Portrait associated with the ${role} career stage`],
    ["data-stage-image-png", png],
    ["data-stage-image-webp", webp],
    ["data-stage-portrait-mode", mode],
    ["data-stage-role", role],
  ]);
  if (nominalCellSize != null) attributes.set("data-stage-pixel-size", String(nominalCellSize));
  if (paletteLevels != null) attributes.set("data-stage-palette-levels", String(paletteLevels));
  if (scale !== 1) attributes.set("data-stage-portrait-scale", String(scale));
  return createEventTarget({
    getAttribute: (name) => attributes.get(name) || null,
  });
}

async function createAsciiFixture({
  mobile = false,
  reduceMotion = false,
  canvasAvailable = true,
  mobileStages,
  portraitScales = [1, 1],
} = {}) {
  const animationFrames = [];
  const canvases = [];
  const documentListeners = new Map();

  function createCanvas() {
    const drawImageCalls = [];
    const fillRectCalls = [];
    const fillTextCalls = [];
    const context = {
      clearRect() {},
      drawImage(...args) {
        drawImageCalls.push(args);
      },
      fillRect(x, y, width, height) {
        fillRectCalls.push({
          alpha: context.globalAlpha,
          fillStyle: context.fillStyle,
          height,
          width,
          x,
          y,
        });
      },
      fillText(glyph, x, y) {
        fillTextCalls.push({
          alpha: context.globalAlpha,
          fillStyle: context.fillStyle,
          glyph,
          x,
          y,
        });
      },
      getImageData(x, y, width, height) {
        const data = new Uint8ClampedArray(width * height * 4);
        for (let index = 0; index < width * height; index += 1) {
          const offset = index * 4;
          const shade = (index % 5) * 46;
          data[offset] = shade;
          data[offset + 1] = shade;
          data[offset + 2] = shade;
          data[offset + 3] = index % 7 === 0 ? 0 : 255;
        }
        return { data, width, height };
      },
      restore() {},
      save() {},
      setTransform() {},
      globalAlpha: 1,
      fillStyle: "#000000",
      imageSmoothingEnabled: true,
      shadowBlur: 0,
      textAlign: "left",
      textBaseline: "alphabetic",
    };
    const canvas = createEventTarget({
      classList: new FakeClassList(),
      drawImageCalls,
      fillRectCalls,
      fillTextCalls,
      getContext: () => canvasAvailable ? context : null,
      setAttribute() {},
      style: {},
      width: 0,
      height: 0,
    });
    canvases.push(canvas);
    return canvas;
  }

  function createImage() {
    const attributes = new Map([
      ["alt", "Portrait associated with a career stage"],
      ["width", "640"],
      ["height", "800"],
    ]);
    const image = createEventTarget({
      classList: new FakeClassList(),
      complete: true,
      naturalHeight: 800,
      naturalWidth: 640,
      currentSrc: "/images/career/08-ai-engineer.webp",
      decode: () => Promise.resolve(),
      getAttribute: (name) => attributes.get(name) || null,
      setAttribute(name, value) {
        attributes.set(name, String(value));
        if (name === "src") this.src = String(value);
      },
    });
    let src = "/images/career/08-ai-engineer.png";
    Object.defineProperty(image, "src", {
      get() {
        return src;
      },
      set(value) {
        src = String(value);
        image.onload?.();
      },
    });
    return image;
  }

  function createWrap({ inline = false, scale = 1, stage = null } = {}) {
    const styleValues = new Map();
    const attributes = new Map();
    if (scale !== 1) attributes.set("data-portrait-scale", String(scale));
    const image = createImage();
    const source = { removeAttribute() {}, setAttribute() {} };
    const transition = createCanvas();
    const fallback = { setAttribute() {}, removeAttribute() {} };
    const children = inline ? [image] : [];
    const wrap = createEventTarget({
      classList: new FakeClassList(),
      children,
      image,
      source,
      closest(selector) {
        if (selector === "[data-timeline-step]") return stage;
        return null;
      },
      getAttribute(name) {
        return attributes.get(name) || null;
      },
      setAttribute(name, value) {
        attributes.set(name, String(value));
      },
      style: {
        getPropertyValue(name) {
          return styleValues.get(name) || "";
        },
        setProperty(name, value) {
          styleValues.set(name, String(value));
        },
      },
      append(...nodes) {
        children.push(...nodes);
      },
      appendChild(node) {
        children.push(node);
        return node;
      },
      getBoundingClientRect: () => inline
        ? { bottom: 325, height: 325, left: 0, right: 260, top: 0, width: 260 }
        : { bottom: 384, height: 384, left: 0, right: 290, top: 0, width: 290 },
      querySelector(selector) {
        if (selector === "img" || selector === "[data-career-image]") return image;
        if (selector === "[data-career-source]") return source;
        if (selector === "[data-career-transition]") return transition;
        if (selector === "[data-career-fallback]") return fallback;
        if (selector === ".ascii-portrait-canvas") {
          return children.find((child) => child.className === "ascii-portrait-canvas") || null;
        }
        return null;
      },
    });
    return wrap;
  }

  const desktopWrap = createWrap();
  const desktopSteps = [
    createEventTarget({
      getAttribute(name) {
        return {
          "data-stage-image-alt": "Portrait associated with the AI Engineer career stage",
          "data-stage-image-png": "/images/career/08-ai-engineer.png",
          "data-stage-image-webp": "/images/career/08-ai-engineer.webp",
          "data-stage-role": "AI Engineer",
        }[name] || null;
      },
    }),
    createEventTarget({
      getAttribute(name) {
        return {
          "data-stage-image-alt": "Portrait associated with the Production Engineer career stage",
          "data-stage-image-png": "/images/career/04-production-engineer.png",
          "data-stage-image-webp": "/images/career/04-production-engineer.webp",
          "data-stage-portrait-scale": "0.84",
          "data-stage-role": "Production Engineer",
        }[name] || null;
      },
    }),
    createEventTarget({
      getAttribute(name) {
        return {
          "data-stage-image-alt": "Portrait associated with the Data Scientist career stage",
          "data-stage-image-png": "/images/career/06-data-scientist.png",
          "data-stage-image-webp": "/images/career/06-data-scientist.webp",
          "data-stage-role": "Data Scientist",
        }[name] || null;
      },
    }),
  ];
  const resolvedMobileStages = mobileStages || [null, null];
  const inlineWraps = resolvedMobileStages.map((stage, index) => createWrap({
    inline: true,
    scale: portraitScales[index] ?? 1,
    stage,
  }));
  const document = createEventTarget({
    documentElement: { classList: new FakeClassList() },
    hidden: false,
    createElement(tagName) {
      assert.equal(tagName, "canvas");
      const canvas = createCanvas();
      canvas.className = "";
      return canvas;
    },
    querySelector(selector) {
      if (selector === "[data-career-portrait]") return desktopWrap;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === ".timeline-step-portrait") return inlineWraps;
      if (selector === "[data-timeline-step]") return desktopSteps;
      return [];
    },
  });
  document.addEventListener = (type, listener) => documentListeners.set(type, listener);

  const windowTarget = createEventTarget({
    devicePixelRatio: 2,
    innerHeight: 844,
    matchMedia(query) {
      if (query === "(max-width: 900px)") return { matches: mobile };
      if (query === "(prefers-reduced-motion: reduce)") return { matches: reduceMotion };
      return { matches: false };
    },
    requestAnimationFrame(callback) {
      animationFrames.push(callback);
      return animationFrames.length;
    },
    cancelAnimationFrame() {},
    requestIdleCallback(callback) {
      callback({ didTimeout: false, timeRemaining: () => 50 });
      return 1;
    },
    setTimeout(callback) {
      callback();
      return 1;
    },
  });

  class FakeResizeObserver {
    observe() {}
    disconnect() {}
  }

  const context = vm.createContext({
    console,
    document,
    globalThis: null,
    Image: function Image() { return createImage(); },
    performance: { now: () => 0 },
    ResizeObserver: FakeResizeObserver,
    Uint8ClampedArray,
    URL,
    window: windowTarget,
    getComputedStyle: () => ({ getPropertyValue: () => "" }),
    requestAnimationFrame: windowTarget.requestAnimationFrame,
    cancelAnimationFrame: windowTarget.cancelAnimationFrame,
  });
  context.globalThis = context;

  const scripts = await readFile(new URL("../scripts.js", import.meta.url), "utf8");
  vm.runInContext(scripts, context, { filename: "scripts.js" });

  return {
    animationFrames,
    canvases,
    context,
    desktopWrap,
    desktopSteps,
    inlineWraps,
    runAnimationFrame(time = 16) {
      const callback = animationFrames.shift();
      assert.ok(callback, "an animation frame must be scheduled");
      callback(time);
    },
  };
}

async function flushPortraitLoad() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

test("renders settled career portraits with a detailed glyph grid", async () => {
  const fixture = await createAsciiFixture();

  assert.equal(typeof fixture.context.initializeAsciiPortraits, "function");
  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const displayCanvas = fixture.desktopWrap.querySelector(".ascii-portrait-canvas");
  assert.ok(displayCanvas, "desktop portrait must receive a decorative ASCII canvas");
  assert.ok(
    displayCanvas.fillTextCalls.length > 6_500,
    "desktop portrait must preserve facial detail with a dense glyph grid",
  );
  assert.equal(fixture.desktopWrap.classList.contains("is-ascii-rendered"), true);
});

test("draws settled glyphs as extrusion, front face, and selective edge highlight", async () => {
  const fixture = await createAsciiFixture();

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const calls = fixture.desktopWrap.querySelector(".ascii-portrait-canvas").fillTextCalls;
  const styles = new Set(calls.map((call) => call.fillStyle));
  const extrusionCalls = calls.filter((call) => call.fillStyle === "#24420f");
  const frontCalls = calls.slice(extrusionCalls.length, extrusionCalls.length * 2);
  const highlightCalls = calls.slice(extrusionCalls.length * 2);
  const highlightOffset = { x: 0.72 * 0.38, y: 0.64 * 0.38 };

  assert.ok(styles.has("#24420f"), "dark extrusion layer must render");
  assert.ok(styles.has("#c8ff36"), "Matrix front glyphs must render");
  assert.equal(frontCalls.length, extrusionCalls.length, "front glyphs must follow the complete extrusion pass");
  const matchedHighlight = highlightCalls.find((highlight) =>
    highlight.fillStyle === "#efffb8"
    && frontCalls.some((front) => (
      front.glyph === highlight.glyph
      && Math.abs(front.x - highlight.x - highlightOffset.x) < 0.0001
      && Math.abs(front.y - highlight.y - highlightOffset.y) < 0.0001
    )),
  );
  assert.ok(
    matchedHighlight,
    "at least one edge-highlight glyph must use the inverse-light offset from its front glyph",
  );
  assert.ok(calls.length > 13_000, "embossed rendering must add real glyph layers");
});

test("routes explicit analog presentation and defaults ordinary stages to ASCII depth", async () => {
  const analogStage = createStage({
    mode: "pixel-analog",
    nominalCellSize: 14,
    paletteLevels: 2,
    role: "Mechanical Engineering",
  });
  const fixture = await createAsciiFixture({ mobile: true, mobileStages: [analogStage, createStage()] });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  assert.equal(fixture.inlineWraps[0].getAttribute("data-portrait-render-mode"), "pixel-analog");
  assert.equal(fixture.inlineWraps[0].style.getPropertyValue("--portrait-pixel-size"), "14");
  assert.equal(fixture.inlineWraps[0].style.getPropertyValue("--portrait-palette-levels"), "2");
  assert.equal(fixture.inlineWraps[1].getAttribute("data-portrait-render-mode"), "ascii-depth");
});

test("renders stages 01 through 05 as progressively finer square phosphor pixels", async () => {
  const physicalStages = [
    createStage({ mode: "pixel-analog", nominalCellSize: 14, paletteLevels: 2, role: "Mechanical Engineering" }),
    createStage({ mode: "pixel-analog", nominalCellSize: 11, paletteLevels: 3, role: "Industrial Engineering" }),
    createStage({ mode: "pixel-analog", nominalCellSize: 8, paletteLevels: 4, role: "M.Sc. Materials and Manufacturing" }),
    createStage({ mode: "pixel-analog", nominalCellSize: 6, paletteLevels: 4, scale: 0.84, role: "Production Engineer" }),
    createStage({ mode: "pixel-analog", nominalCellSize: 4, paletteLevels: 5, role: "Production Manager" }),
  ];
  const fixture = await createAsciiFixture({ mobile: true, mobileStages: physicalStages });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const widths = fixture.inlineWraps.map((wrap) => {
    const canvas = wrap.querySelector(".ascii-portrait-canvas");
    assert.ok(canvas.fillRectCalls.length > 100, "analog head must contain visible pixel cells");
    assert.equal(canvas.fillTextCalls.length, 0, "physical stages must not draw ASCII glyphs");
    const first = canvas.fillRectCalls[0];
    assert.ok(Math.abs(first.width - first.height) < 0.0001, "analog cells must be square");
    return first.width;
  });

  assert.ok(widths.every((width, index) => index === 0 || widths[index - 1] > width));
  const expectedColorCaps = [2, 3, 4, 4, 5];
  fixture.inlineWraps.forEach((wrap, index) => {
    const colors = new Set(wrap.querySelector(".ascii-portrait-canvas").fillRectCalls.map((call) => call.fillStyle));
    assert.ok(colors.size <= expectedColorCaps[index]);
    assert.ok(colors.size >= 2);
  });
});

test("analog pointer movement changes phosphor pixels without drawing glyphs", async () => {
  const analog = createStage({ mode: "pixel-analog", nominalCellSize: 8, paletteLevels: 4 });
  const fixture = await createAsciiFixture({ mobile: true, mobileStages: [analog] });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const canvas = fixture.inlineWraps[0].querySelector(".ascii-portrait-canvas");
  const settledCalls = canvas.fillRectCalls.slice();
  fixture.inlineWraps[0].dispatch("pointermove", { clientX: 210, clientY: 70, pointerType: "touch" });
  fixture.runAnimationFrame();
  const movedCalls = canvas.fillRectCalls.slice(settledCalls.length);

  assert.ok(movedCalls.length > 0, "pointer movement must redraw analog pixels");
  assert.ok(
    movedCalls.some((moved, index) => {
      const settled = settledCalls[index];
      return settled && (
        moved.x !== settled.x
        || moved.y !== settled.y
        || moved.alpha !== settled.alpha
        || moved.fillStyle !== settled.fillStyle
      );
    }),
    "analog pointer must change at least one pixel position, brightness, or palette level",
  );
  assert.equal(canvas.fillTextCalls.length, 0);
});

test("reduced motion draws static analog pixels with no recurring frame", async () => {
  const analog = createStage({ mode: "pixel-analog", nominalCellSize: 14, paletteLevels: 2 });
  const fixture = await createAsciiFixture({ mobile: true, reduceMotion: true, mobileStages: [analog] });
  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const canvas = fixture.inlineWraps[0].querySelector(".ascii-portrait-canvas");
  assert.ok(canvas.fillRectCalls.length > 100);
  assert.equal(canvas.fillTextCalls.length, 0);
  assert.equal(fixture.animationFrames.length, 0);
});

test("enhances every mobile inline portrait and responds to pointer movement", async () => {
  const fixture = await createAsciiFixture({ mobile: true });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  for (const wrap of fixture.inlineWraps) {
    const canvas = wrap.querySelector(".ascii-portrait-canvas");
    assert.ok(canvas, "each mobile timeline portrait must receive an ASCII canvas");
    assert.ok(
      canvas.fillTextCalls.length > 5_000,
      "each mobile portrait must preserve facial detail with a dense glyph grid",
    );
    assert.equal(wrap.classList.contains("is-ascii-rendered"), true);
  }

  const firstCanvas = fixture.inlineWraps[0].querySelector(".ascii-portrait-canvas");
  const settledCalls = firstCanvas.fillTextCalls.slice();
  const settledExtrusion = settledCalls.find((call) => call.fillStyle === "#24420f");
  assert.ok(settledExtrusion, "settled portrait must render an extrusion glyph before pointer coordinates are read");
  fixture.inlineWraps[0].dispatch("pointermove", {
    clientX: 210,
    clientY: 70,
    pointerType: "touch",
  });
  fixture.runAnimationFrame();
  const movedCalls = firstCanvas.fillTextCalls.slice(settledCalls.length);
  const movedExtrusion = movedCalls.find((call) => call.fillStyle === "#24420f");
  assert.ok(movedExtrusion, "pointer redraw must render an extrusion glyph before moved coordinates are read");

  assert.notEqual(movedExtrusion.x, settledExtrusion.x);
  assert.notEqual(movedExtrusion.y, settledExtrusion.y);
});

test("applies desktop stage scale metadata and resets it for an unannotated stage", async () => {
  const fixture = await createAsciiFixture();

  const transition = fixture.context.initializeAsciiPortraits();
  assert.equal(fixture.desktopSteps[1].getAttribute("data-stage-role"), "Production Engineer");

  transition.setStage(1);
  await flushPortraitLoad();

  const sourceCanvas = fixture.canvases.find((canvas) =>
    canvas.drawImageCalls.some((call) => call.length === 9),
  );
  assert.ok(sourceCanvas, "desktop renderer must sample its portrait source canvas");
  const productionCall = sourceCanvas.drawImageCalls.at(-1);
  assert.equal(
    fixture.desktopWrap.style.getPropertyValue("--portrait-source-scale"),
    "0.84",
    "Production Engineer metadata must set the desktop source scale",
  );

  transition.setStage(2);
  await flushPortraitLoad();

  const defaultCall = sourceCanvas.drawImageCalls.at(-1);
  const productionArea = productionCall[7] * productionCall[8];
  const defaultArea = defaultCall[7] * defaultCall[8];
  assert.ok(
    Math.abs(productionArea / defaultArea - 0.84 ** 2) < 0.02,
    "Production Engineer desktop source draw area must be 0.84 squared of the default stage",
  );
  assert.equal(
    fixture.desktopWrap.style.getPropertyValue("--portrait-source-scale"),
    "1",
    "an unannotated desktop stage must restore the default source scale",
  );
});

test("applies explicit Production Engineer scale without changing ordinary portraits", async () => {
  const fixture = await createAsciiFixture({ mobile: true, portraitScales: [0.84, 1] });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const sourceCanvases = fixture.canvases.filter((canvas) =>
    canvas.drawImageCalls.some((call) => call.length === 9),
  );
  assert.equal(sourceCanvases.length, 2);

  const productionCall = sourceCanvases[0].drawImageCalls.at(-1);
  const ordinaryCall = sourceCanvases[1].drawImageCalls.at(-1);
  const productionArea = productionCall[7] * productionCall[8];
  const ordinaryArea = ordinaryCall[7] * ordinaryCall[8];

  assert.ok(Math.abs(productionArea / ordinaryArea - 0.84 ** 2) < 0.02);
  assert.equal(
    fixture.inlineWraps[0].style.getPropertyValue("--portrait-source-scale"),
    "0.84",
  );
  assert.equal(
    fixture.inlineWraps[1].style.getPropertyValue("--portrait-source-scale"),
    "1",
  );
});

test("reduced motion renders static glyphs without a recurring animation frame", async () => {
  const fixture = await createAsciiFixture({ reduceMotion: true });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const displayCanvas = fixture.desktopWrap.querySelector(".ascii-portrait-canvas");
  assert.ok(displayCanvas.fillTextCalls.length > 100);
  const styles = new Set(displayCanvas.fillTextCalls.map((call) => call.fillStyle));
  assert.ok(styles.has("#24420f"));
  assert.ok(styles.has("#c8ff36"));
  assert.ok(styles.has("#efffb8"));
  assert.equal(fixture.animationFrames.length, 0);
});

test("canvas failure leaves the normal portrait fallback visible", async () => {
  const fixture = await createAsciiFixture({ canvasAvailable: false });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  assert.equal(fixture.desktopWrap.classList.contains("is-ascii-rendered"), false);
  assert.equal(fixture.desktopWrap.image.classList.contains("ascii-portrait-source"), false);
});
