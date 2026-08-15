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

async function createAsciiFixture({ mobile = false, reduceMotion = false, canvasAvailable = true } = {}) {
  const animationFrames = [];
  const canvases = [];
  const documentListeners = new Map();

  function createCanvas() {
    const fillTextCalls = [];
    const context = {
      clearRect() {},
      drawImage() {},
      fillRect() {},
      fillText(...args) {
        fillTextCalls.push(args);
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
      shadowBlur: 0,
      textAlign: "left",
      textBaseline: "alphabetic",
    };
    const canvas = createEventTarget({
      classList: new FakeClassList(),
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
    return createEventTarget({
      classList: new FakeClassList(),
      complete: true,
      naturalHeight: 800,
      naturalWidth: 640,
      src: "/images/career/08-ai-engineer.png",
      currentSrc: "/images/career/08-ai-engineer.webp",
      decode: () => Promise.resolve(),
      getAttribute: (name) => attributes.get(name) || null,
      setAttribute(name, value) {
        attributes.set(name, String(value));
        if (name === "src") this.src = String(value);
      },
    });
  }

  function createWrap({ inline = false } = {}) {
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
      style: { setProperty() {} },
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
  const inlineWraps = [createWrap({ inline: true }), createWrap({ inline: true })];
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
      if (selector === "[data-timeline-step]") return [];
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
    inlineWraps,
    runAnimationFrame(time = 16) {
      const callback = animationFrames.shift();
      assert.ok(callback, "an animation frame must be scheduled");
      callback(time);
    },
  };
}

test("renders settled career portraits as glyphs", async () => {
  const fixture = await createAsciiFixture();

  assert.equal(typeof fixture.context.initializeAsciiPortraits, "function");
  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const displayCanvas = fixture.desktopWrap.querySelector(".ascii-portrait-canvas");
  assert.ok(displayCanvas, "desktop portrait must receive a decorative ASCII canvas");
  assert.ok(displayCanvas.fillTextCalls.length > 100, "settled portrait must be drawn from glyphs");
  assert.equal(fixture.desktopWrap.classList.contains("is-ascii-rendered"), true);
});

test("enhances every mobile inline portrait and responds to pointer movement", async () => {
  const fixture = await createAsciiFixture({ mobile: true });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  for (const wrap of fixture.inlineWraps) {
    const canvas = wrap.querySelector(".ascii-portrait-canvas");
    assert.ok(canvas, "each mobile timeline portrait must receive an ASCII canvas");
    assert.ok(canvas.fillTextCalls.length > 80, "each mobile portrait must visibly use glyphs");
    assert.equal(wrap.classList.contains("is-ascii-rendered"), true);
  }

  const firstCanvas = fixture.inlineWraps[0].querySelector(".ascii-portrait-canvas");
  const settledDrawCount = firstCanvas.fillTextCalls.length;
  fixture.inlineWraps[0].dispatch("pointermove", { clientX: 130, clientY: 160, pointerType: "touch" });
  fixture.runAnimationFrame();
  assert.ok(firstCanvas.fillTextCalls.length > settledDrawCount, "pointer movement must redraw displaced glyphs");
});

test("reduced motion renders static glyphs without a recurring animation frame", async () => {
  const fixture = await createAsciiFixture({ reduceMotion: true });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const displayCanvas = fixture.desktopWrap.querySelector(".ascii-portrait-canvas");
  assert.ok(displayCanvas.fillTextCalls.length > 100);
  assert.equal(fixture.animationFrames.length, 0);
});

test("canvas failure leaves the normal portrait fallback visible", async () => {
  const fixture = await createAsciiFixture({ canvasAvailable: false });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  assert.equal(fixture.desktopWrap.classList.contains("is-ascii-rendered"), false);
  assert.equal(fixture.desktopWrap.image.classList.contains("ascii-portrait-source"), false);
});
