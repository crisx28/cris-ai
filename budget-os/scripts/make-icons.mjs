// Generates PWA icons by rendering HTML with the pre-installed Chromium.
// Run once: node scripts/make-icons.mjs  (dev-only; not needed at runtime)

import { chromium } from "playwright-core";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");
const EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

// rounded = transparent corners (maskable=false). maskable = full-bleed square.
function html(size, { rounded }) {
  const radius = rounded ? Math.round(size * 0.22) : 0;
  const glyph = Math.round(size * 0.58);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${size}px;height:${size}px;background:transparent}
    .box{width:${size}px;height:${size}px;border-radius:${radius}px;
      background:linear-gradient(145deg,#97a664 0%,#586032 100%);
      display:flex;align-items:center;justify-content:center;
      box-shadow:inset 0 ${Math.round(size*0.02)}px ${Math.round(size*0.06)}px rgba(255,255,255,0.25);
      font-family:-apple-system,'SF Pro Display','Segoe UI',Roboto,sans-serif;}
    .p{color:#fff;font-size:${glyph}px;font-weight:800;line-height:1;
      text-shadow:0 ${Math.round(size*0.01)}px ${Math.round(size*0.03)}px rgba(0,0,0,0.18);}
  </style></head><body><div class="box"><span class="p">₱</span></div></body></html>`;
}

const TARGETS = [
  { file: "icon-192.png", size: 192, rounded: true },
  { file: "icon-512.png", size: 512, rounded: true },
  { file: "maskable-512.png", size: 512, rounded: false },
  { file: "apple-touch-icon.png", size: 180, rounded: false },
  { file: "favicon-32.png", size: 32, rounded: true },
];

const browser = await chromium.launch({ executablePath: EXE });
for (const t of TARGETS) {
  const page = await browser.newPage({
    viewport: { width: t.size, height: t.size },
    deviceScaleFactor: 1,
  });
  await page.setContent(html(t.size, { rounded: t.rounded }), {
    waitUntil: "networkidle",
  });
  await page.screenshot({
    path: path.join(PUBLIC, t.file),
    omitBackground: t.rounded,
  });
  await page.close();
  console.log("wrote", t.file, `${t.size}x${t.size}`);
}
await browser.close();
console.log("done");
