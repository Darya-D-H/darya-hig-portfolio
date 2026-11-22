// @ts-check
/// <reference types="node" />
// node scripts/generate-placeholders.mjs
//
// Writes the placeholder project images into src/assets/projects/<slug>/.
// They are deliberately heavy (200–400 KB PNGs, docs/06-content-model.md §4):
// a 2 KB placeholder would make the performance budget meaningless. Output
// is deterministic, so rerunning reproduces the same bytes. Phase 8
// replaces every one of these with a real screenshot.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const OUT = fileURLToPath(new URL("../src/assets/projects/", import.meta.url));
const MIN_BYTES = 200 * 1024;
const MAX_BYTES = 400 * 1024;
// Aim for the middle of the range: realistic, without bloating the history.
const TARGET_BYTES = 300 * 1024;

// Card thumbnails are 16:10 (docs/01-information-architecture.md §3); heroes
// span the 980px column at 2x; gallery shots are 16:10 like the cards.
const SIZE = {
  card: [1280, 800],
  hero: [1960, 1102],
  shot: [1600, 1000],
};

/** @type {Record<string, { title: string, hue: [number, number, number], images: Record<string, keyof typeof SIZE> }>} */
const PROJECTS = {
  "invoice-tracker": {
    title: "Invoice Tracker",
    hue: [30, 90, 200],
    images: {
      card: "card",
      hero: "hero",
      list: "shot",
      detail: "shot",
      digest: "shot",
      settings: "shot",
    },
  },
  "component-library": {
    title: "Component Library",
    hue: [120, 60, 170],
    images: {
      card: "card",
      hero: "hero",
      buttons: "shot",
      forms: "shot",
      tokens: "shot",
    },
  },
  "api-gateway": {
    title: "API Gateway",
    hue: [20, 130, 110],
    images: { card: "card", hero: "hero" },
  },
  "booking-widget": {
    title: "Booking Widget",
    hue: [190, 90, 40],
    images: {
      card: "card",
      hero: "hero",
      calendar: "shot",
      confirmation: "shot",
    },
  },
  "cli-toolkit": {
    title: "CLI Toolkit",
    hue: [50, 50, 60],
    images: { card: "card", help: "shot", output: "shot" },
  },
  "portfolio-site": {
    title: "Portfolio Site",
    hue: [0, 100, 210],
    images: {
      card: "card",
      hero: "hero",
      home: "shot",
      project: "shot",
      menu: "shot",
    },
  },
};

/**
 * Deterministic PRNG, seeded per image.
 * @param {number} seed
 */
function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** @param {string} text */
const seedOf = (text) =>
  [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

/** @param {number} v */
const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

/**
 * A diagonal gradient in the project's hue with blocky noise over it. The
 * block size sets how well the PNG compresses, which sets the file weight.
 * @param {number} width
 * @param {number} height
 * @param {[number, number, number]} hue
 * @param {number} seed
 * @param {number} cell
 */
function pixels(width, height, hue, seed, cell) {
  const rnd = mulberry32(seed);
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const grid = Float32Array.from({ length: cols * rows }, () => rnd() * 2 - 1);
  const buf = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const t = (x / width + y / height) / 2;
      const n =
        (grid[Math.floor(y / cell) * cols + Math.floor(x / cell)] ?? 0) * 10;
      const i = (y * width + x) * 3;
      buf[i] = clamp(hue[0] + 110 * t + n);
      buf[i + 1] = clamp(hue[1] + 70 * t + n);
      buf[i + 2] = clamp(hue[2] - 30 * t + n);
    }
  }
  return buf;
}

/**
 * @param {number} width
 * @param {number} height
 * @param {string} title
 * @param {string} view
 */
function label(width, height, title, view) {
  const big = Math.round(width / 16);
  const small = Math.round(width / 40);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <g font-family="Arial, Helvetica, sans-serif" fill="#ffffff" text-anchor="middle">
      <text x="50%" y="48%" font-size="${big}" font-weight="600">${title}</text>
      <text x="50%" y="58%" font-size="${small}" opacity="0.85">${view} · placeholder</text>
    </g>
  </svg>`);
}

/**
 * @param {number} width
 * @param {number} height
 * @param {[number, number, number]} hue
 * @param {number} seed
 * @param {string} title
 * @param {string} view
 * @returns {Promise<Buffer>}
 */
async function render(width, height, hue, seed, title, view) {
  // Bigger blocks compress better; step until the file lands in range.
  /** @type {Buffer | undefined} */
  let last;
  for (let cell = 2; cell <= 40; cell += 1) {
    const png = await sharp(pixels(width, height, hue, seed, cell), {
      raw: { width, height, channels: 3 },
    })
      .composite([{ input: label(width, height, title, view) }])
      .png({ compressionLevel: 9 })
      .toBuffer();
    last = png;
    if (png.length <= TARGET_BYTES) return png;
  }
  if (!last) throw new Error("no image rendered");
  return last;
}

let count = 0;
for (const [slug, { title, hue, images }] of Object.entries(PROJECTS)) {
  mkdirSync(`${OUT}${slug}`, { recursive: true });
  for (const [name, kind] of Object.entries(images)) {
    const [w, h] = SIZE[kind];
    const png = await render(w, h, hue, seedOf(`${slug}/${name}`), title, name);
    writeFileSync(`${OUT}${slug}/${name}.png`, png);
    const kb = Math.round(png.length / 1024);
    const flag =
      png.length < MIN_BYTES || png.length > MAX_BYTES ? "  OUT OF RANGE" : "";
    console.log(`${slug}/${name}.png  ${w}x${h}  ${kb} KB${flag}`);
    count += 1;
  }
}
console.log(`${count} images written to src/assets/projects/`);
