import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const scripts = await readFile(new URL("../scripts.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

test("career portrait transition exposes the stage controller contract", () => {
  assert.match(scripts, /function initializeCareerPortraitTransition\(\)/);
  assert.match(scripts, /data-career-portrait/);
  assert.match(scripts, /data-career-image/);
  assert.match(scripts, /data-career-transition/);
  assert.match(scripts, /data-stage-image-webp/);
  assert.match(scripts, /data-stage-image-png/);
  assert.match(scripts, /function setStage\(index/);
});

test("career portrait transition cancels stale animation and supports load failure", () => {
  assert.match(scripts, /cancelAnimationFrame\(transitionFrame\)/);
  assert.match(scripts, /classList\.add\("has-image-error"\)/);
  assert.match(scripts, /classList\.remove\("has-image-error"\)/);
  assert.match(scripts, /clearRect\(0, 0, width, height\)/);
});

test("career portraits stay normal outside the temporary ASCII overlay", () => {
  assert.match(styles, /\.career-portrait\s+picture/);
  assert.match(styles, /\.career-transition/);
  assert.match(styles, /\.career-portrait-fallback/);
  assert.doesNotMatch(scripts, /function initializePortrait\(\)/);
  assert.doesNotMatch(styles, /\.portrait-wrap\.is-interactive \.portrait-ascii/);
});

test("career portrait motion has a reduced-motion fallback", () => {
  assert.match(scripts, /prefers-reduced-motion: reduce/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /\.career-transition/);
});
