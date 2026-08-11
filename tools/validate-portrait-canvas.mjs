import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

test("responsive portrait draws the complete bitmap into the interactive canvas", async () => {
  const animationFrames = [];
  const documentListeners = new Map();
  const canvasDraws = [];
  const activeClasses = new Set();
  let sourceRasterized = false;

  const displayContext = {
    setTransform() {},
    clearRect() {},
    drawImage(...args) {
      canvasDraws.push(args);
    },
  };

  const displayCanvas = {
    getContext: () => displayContext,
    style: {},
    width: 0,
    height: 0,
  };

  const sourceCanvas = {
    getContext: () => ({
      drawImage(...args) {
        assert.equal(args.length, 5);
        sourceRasterized = true;
      },
    }),
    width: 0,
    height: 0,
  };

  const responsiveImage = {
    // Width descriptors report a density-corrected natural size even though
    // the selected resource is a 720 x 952 bitmap.
    naturalWidth: 290,
    naturalHeight: 383.4444,
    complete: true,
    currentSrc: "https://aserdargun.com/images/serdar-gundogdu-ascii-720.webp",
    src: "https://aserdargun.com/images/serdar-gundogdu-ascii.png",
    getAttribute(name) {
      return name === "width" ? "720" : name === "height" ? "952" : null;
    },
    addEventListener() {},
  };

  const portraitWrap = {
    querySelector(selector) {
      if (selector === ".portrait-ascii") return responsiveImage;
      if (selector === ".portrait-canvas") return displayCanvas;
      return null;
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 290, height: 384 }),
    addEventListener() {},
    classList: {
      add: (...names) => names.forEach((name) => activeClasses.add(name)),
      remove: (...names) => names.forEach((name) => activeClasses.delete(name)),
    },
    style: { setProperty() {} },
  };

  const document = {
    hidden: false,
    documentElement: { classList: { add() {} } },
    querySelector(selector) {
      return selector === "[data-portrait-effect]" ? portraitWrap : null;
    },
    querySelectorAll: () => [],
    createElement(tagName) {
      assert.equal(tagName, "canvas");
      return sourceCanvas;
    },
    addEventListener(type, listener) {
      documentListeners.set(type, listener);
    },
  };

  const window = {
    devicePixelRatio: 2,
    innerHeight: 900,
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame(callback) {
      animationFrames.push(callback);
      return animationFrames.length;
    },
    cancelAnimationFrame() {},
    addEventListener() {},
  };

  const context = vm.createContext({
    console,
    document,
    window,
    globalThis: null,
    getComputedStyle: () => ({
      getPropertyValue: (name) => name === "--portrait-media-scale" ? "0.9" : "",
    }),
  });
  context.globalThis = context;

  const scripts = await readFile(new URL("../scripts.js", import.meta.url), "utf8");
  vm.runInContext(scripts, context, { filename: "scripts.js" });
  documentListeners.get("DOMContentLoaded")();

  assert.equal(activeClasses.has("is-interactive"), true);
  assert.equal(animationFrames.length, 1);
  animationFrames.shift()(0);

  assert.equal(sourceRasterized, true);
  assert.equal(sourceCanvas.width, 720);
  assert.equal(sourceCanvas.height, 952);
  assert.equal(canvasDraws.length, 30 * 28);
  const leftmostDestinationEdge = Math.min(
    ...canvasDraws.map(([, , , , , destinationX]) => destinationX),
  );
  const topmostDestinationEdge = Math.min(
    ...canvasDraws.map(([, , , , , , destinationY]) => destinationY),
  );
  const rightmostSourceEdge = Math.max(
    ...canvasDraws.map(([, sourceX, , sourceWidth]) => sourceX + sourceWidth),
  );
  assert.ok(leftmostDestinationEdge >= 13.7 && leftmostDestinationEdge <= 14.5);
  assert.ok(Math.abs(topmostDestinationEdge - 19.2) < 0.0001);
  assert.ok(
    rightmostSourceEdge > 700,
    `interactive canvas sampled only ${rightmostSourceEdge.toFixed(1)}px of the 720px portrait bitmap`,
  );
});
