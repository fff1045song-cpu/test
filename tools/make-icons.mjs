// 앱 아이콘 PNG 만들기: js/art.js 의 SVG 일러스트를 그대로 그려서 저장한다.
// 실행: node tools/make-icons.mjs   (playwright 가 설치된 환경에서)
// 결과: assets/icons/ 에 플랫폼(icon-*)과 게임별(<slug>-*) 아이콘
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { art } from '../js/art.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets/icons');
await mkdir(out, { recursive: true });

const games = JSON.parse(await readFile(path.join(root, 'data/games.json'), 'utf8')).filter((g) => !g.soon);
const targets = [
  { name: 'icon', slug: 'noriteo', color: '#6C4CF5' },
  ...games.map((g) => ({ name: g.slug, slug: g.slug, color: g.color })),
];

// scale: 그림이 차지하는 비율 (maskable 은 안전 영역 때문에 더 작게)
function page(t, scale) {
  return `<!doctype html><html><body style="margin:0">
    <div id="i" style="width:512px;height:512px;background:${t.color};display:grid;place-items:center;
      background-image:radial-gradient(rgba(255,255,255,.22) 5px, transparent 6px);background-size:44px 44px">
      <div style="width:${512 * scale}px;height:${512 * scale}px">${art(t.slug).replace('class="art"', 'width="100%" height="100%"')}</div>
    </div></body></html>`;
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const p = await browser.newPage();
for (const t of targets) {
  for (const [suffix, size, scale] of [
    ['512', 512, 0.86],
    ['192', 192, 0.86],
    ['180', 180, 0.86],
    ['maskable-512', 512, 0.66],
  ]) {
    await p.setViewportSize({ width: 512, height: 512 });
    await p.setContent(page(t, scale));
    const buf = await p.locator('#i').screenshot();
    const file = path.join(out, `${t.name}-${suffix}.png`);
    if (size === 512) {
      await writeFile(file, buf);
    } else {
      // 작은 크기는 브라우저에서 줄여서 다시 찍는다
      await p.setContent(`<body style="margin:0"><img id="i" style="width:${size}px;height:${size}px;display:block" src="data:image/png;base64,${buf.toString('base64')}"></body>`);
      await p.setViewportSize({ width: size, height: size });
      await writeFile(file, await p.locator('#i').screenshot());
    }
    console.log('saved', path.relative(root, file));
  }
}
await browser.close();
