// @ts-check
/// <reference types="node" />
// node scripts/generate-site-images.mjs
//
// Writes the site-wide images into public/:
// - favicon.svg, favicon.ico and apple-touch-icon.png: a PLACEHOLDER, a
//   plain rounded square in the secondary ink, until Darya has a logo.
// - og-image.png: the 1200 × 630 social preview. Minimal and inside the
//   design system: white canvas, the role as an eyebrow in link blue, the
//   name in the title style in ink. Rendered by Chromium with the site's own
//   Inter file, so the type is what non-Apple visitors see.
// Rerun this after changing the identity in src/site.config.ts.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = `${ROOT}public/`;

// Read from the token CSS so these never drift from the design system.
const css = readFileSync(`${ROOT}src/styles/global.css`, "utf8");
/** @param {string} name */
const token = (name) => {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match?.[1]) throw new Error(`--${name} not found in global.css`);
  return match[1].trim();
};
const COLOR = {
  canvas: token("color-canvas"),
  ink: token("color-ink"),
  secondary: token("color-ink-secondary"),
  link: token("color-link"),
};

// The identity, read from site.config.ts without compiling TypeScript.
const config = readFileSync(`${ROOT}src/site.config.ts`, "utf8");
/** @param {string} key */
const field = (key) => {
  const match = config.match(new RegExp(`${key}:\\s*"([^"]+)"`));
  if (!match?.[1]) throw new Error(`${key} not found in site.config.ts`);
  return match[1];
};
const NAME = field("name");
const ROLE = field("role");

// ---- placeholder icon -------------------------------------------------------
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${COLOR.secondary}"/>
</svg>
`;
writeFileSync(`${PUBLIC}favicon.svg`, iconSvg);

/**
 * Wraps a 32 × 32 PNG in the ICO container. Modern browsers use the SVG;
 * the ICO answers the /favicon.ico request older clients make regardless.
 * @param {Buffer} png
 */
function icoFromPng(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // width
  entry.writeUInt8(32, 1); // height
  entry.writeUInt8(0, 2); // no palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);
  return Buffer.concat([header, entry, png]);
}

const icon32 = await sharp(Buffer.from(iconSvg))
  .resize(32, 32)
  .png()
  .toBuffer();
writeFileSync(`${PUBLIC}favicon.ico`, icoFromPng(icon32));

// iOS rounds the corners itself, so the touch icon is a full square.
await sharp({
  create: { width: 180, height: 180, channels: 3, background: COLOR.secondary },
})
  .png()
  .toFile(`${PUBLIC}apple-touch-icon.png`);

// ---- social preview ---------------------------------------------------------
// Embedded as a data URI: a page set from a string has no origin that may
// load a file:// font, and Chromium would silently fall back to Arial.
const inter = `data:font/woff2;base64,${readFileSync(
  `${ROOT}node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2`,
).toString("base64")}`;

const html = `<!doctype html>
<html><head><style>
  @font-face { font-family: Inter; src: url("${inter}") format("woff2"); font-weight: 100 900; }
  html, body { margin: 0; }
  body {
    width: 1200px; height: 630px; box-sizing: border-box;
    padding: 0 96px; display: flex; flex-direction: column; justify-content: center;
    background: ${COLOR.canvas}; font-family: Inter, sans-serif;
  }
  .eyebrow { color: ${COLOR.link}; font-size: 38px; font-weight: 600; letter-spacing: 0.012em; margin: 0; }
  .name { color: ${COLOR.ink}; font-size: 128px; font-weight: 600; letter-spacing: -0.005em; line-height: 1.07; margin: 12px 0 0; }
</style></head>
<body>
  <p class="eyebrow">${ROLE}</p>
  <p class="name">${NAME}</p>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const usedInter = await page.evaluate(() =>
    document.fonts.check("600 128px Inter"),
  );
  if (!usedInter)
    throw new Error(
      "Inter did not load; refusing to write a fallback-font image",
    );
  await page.screenshot({ path: `${PUBLIC}og-image.png` });
} finally {
  await browser.close();
}

console.log(
  "Wrote favicon.svg, favicon.ico, apple-touch-icon.png and og-image.png to public/",
);
