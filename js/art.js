// 게임마다 직접 그린 썸네일 일러스트 (인라인 SVG)
// 배경색은 바깥 카드가 칠하고, 여기서는 그림만 그린다. viewBox 120×120.

const INK = '#1A1033';
const C = {
  yellow: '#FFD23F', pink: '#FF5DA2', mint: '#2EE6A6', sky: '#4CC9F0',
  orange: '#FF8C42', lilac: '#B9A3FF', theme: '#6C4CF5', white: '#FFFFFF',
};

function star(cx, cy, r, fill, rot = -90) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = ((rot + i * 36) * Math.PI) / 180;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + rr * Math.cos(rad)).toFixed(1)},${(cy + rr * Math.sin(rad)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
}

function sparkle(cx, cy, s, fill = C.white) {
  return `<path d="M${cx} ${cy - s}C${cx + s * 0.15} ${cy - s * 0.15} ${cx + s * 0.15} ${cy - s * 0.15} ${cx + s} ${cy}C${cx + s * 0.15} ${cy + s * 0.15} ${cx + s * 0.15} ${cy + s * 0.15} ${cx} ${cy + s}C${cx - s * 0.15} ${cy + s * 0.15} ${cx - s * 0.15} ${cy + s * 0.15} ${cx - s} ${cy}C${cx - s * 0.15} ${cy - s * 0.15} ${cx - s * 0.15} ${cy - s * 0.15} ${cx} ${cy - s}Z" fill="${fill}"/>`;
}

const crescent = (fill) =>
  `<path d="M62 18.1A28 28 0 1 0 89.8 56.9A24 24 0 0 1 62 18.1Z" fill="${fill}"/>`;

const ART = {
  'block-rush': () => `
    ${sparkle(28, 30, 10)}
    <rect x="16" y="74" width="29" height="29" rx="6" fill="${C.pink}"/>
    <rect x="45" y="74" width="29" height="29" rx="6" fill="${C.sky}"/>
    <rect x="74" y="74" width="29" height="29" rx="6" fill="${C.mint}"/>
    <rect x="45" y="45" width="29" height="29" rx="6" fill="${C.theme}"/>
    <rect x="62" y="11" width="27" height="27" rx="6" fill="${C.orange}" transform="rotate(16 75.5 24.5)"/>
    <path d="M52 40v-4M66 41v-4" stroke-dasharray="3 3"/>`,

  'endless-jump': () => `
    ${sparkle(26, 26, 9)}
    <rect x="8" y="94" width="30" height="13" rx="4" fill="${C.yellow}"/>
    <rect x="32" y="78" width="30" height="13" rx="4" fill="${C.mint}"/>
    <rect x="56" y="62" width="30" height="13" rx="4" fill="${C.sky}"/>
    <rect x="80" y="46" width="30" height="13" rx="4" fill="${C.white}"/>
    <path d="M60 40c4-8 10-12 18-13" stroke-dasharray="4 5"/>
    <ellipse cx="94" cy="32" rx="13" ry="12" fill="${C.yellow}"/>
    <circle cx="90" cy="30" r="2.4" fill="${INK}" stroke="none"/>
    <circle cx="99" cy="30" r="2.4" fill="${INK}" stroke="none"/>
    <path d="M91 36q3.5 3 7 0" stroke-width="3"/>`,

  'moon-match': () => `
    ${crescent(C.yellow)}
    ${sparkle(26, 22, 8)}
    <circle cx="100" cy="72" r="4" fill="${C.pink}"/>
    <rect x="16" y="62" width="34" height="46" rx="7" fill="${C.theme}" transform="rotate(-10 33 85)"/>
    <circle cx="33" cy="85" r="5" fill="${C.lilac}" stroke-width="3" transform="rotate(-10 33 85)"/>
    <rect x="52" y="66" width="34" height="46" rx="7" fill="${C.white}" transform="rotate(8 69 89)"/>
    <g stroke-width="3">${star(69, 89, 11, C.yellow)}</g>`,

  'moon-garden-2': () => `
    ${crescent(C.yellow)}
    <circle cx="44" cy="58" r="4.5" fill="${C.pink}"/>
    <path d="M14 106C16 84 32 72 52 74C50 94 34 106 14 106Z" fill="${C.mint}"/>
    <path d="M20 100L44 80" stroke-width="3"/>
    <path d="M52 110C58 92 76 84 96 88C90 104 72 112 52 110Z" fill="${C.mint}"/>
    <path d="M60 106L86 92" stroke-width="3"/>
    ${sparkle(24, 30, 9)}`,

  'cat-diner': () => `
    <path d="M26 56L30 16L56 36Z" fill="${C.white}"/>
    <path d="M94 56L90 16L64 36Z" fill="${C.white}"/>
    <ellipse cx="60" cy="68" rx="38" ry="34" fill="${C.white}"/>
    <ellipse cx="46" cy="64" rx="4.5" ry="6" fill="${INK}" stroke="none"/>
    <ellipse cx="74" cy="64" rx="4.5" ry="6" fill="${INK}" stroke="none"/>
    <path d="M55 75h10l-5 5z" fill="${C.pink}" stroke-width="3"/>
    <path d="M60 80q-4 6-9 3M60 80q4 6 9 3" stroke-width="3"/>
    <path d="M30 74h-14M31 82l-13 4M90 74h14M89 82l13 4" stroke-width="3"/>
    <circle cx="38" cy="76" r="4" fill="${C.pink}" stroke="none" opacity=".6"/>
    <circle cx="82" cy="76" r="4" fill="${C.pink}" stroke="none" opacity=".6"/>`,

  'star-link': () => `
    <path d="M26 88L48 60L78 70L96 30" stroke-width="3.5"/>
    <path d="M48 60L56 28" stroke-width="3.5"/>
    <circle cx="26" cy="88" r="5" fill="${C.white}"/>
    ${star(56, 28, 14, C.white)}
    ${star(48, 60, 9, C.yellow)}
    ${star(78, 70, 13, C.pink)}
    ${star(96, 30, 10, C.yellow)}
    ${sparkle(98, 96, 7)}`,

  'candy-battle': () => `
    <g transform="rotate(-24 40 62)">
      <path d="M8 62L20 50V74Z" fill="${C.pink}"/>
      <path d="M72 62L60 50V74Z" fill="${C.pink}"/>
      <circle cx="40" cy="62" r="20" fill="${C.pink}"/>
      <path d="M30 50q10 12 0 24M42 44q10 18 0 36" stroke-width="3"/>
    </g>
    <g transform="rotate(24 80 62)">
      <path d="M48 62L60 50V74Z" fill="${C.yellow}"/>
      <path d="M112 62L100 50V74Z" fill="${C.yellow}"/>
      <circle cx="80" cy="62" r="20" fill="${C.yellow}"/>
      <path d="M70 50q10 12 0 24M82 44q10 18 0 36" stroke-width="3"/>
    </g>
    ${sparkle(60, 22, 11)}`,

  'rocket-delivery': () => `
    <g transform="rotate(35 60 60)">
      <path d="M60 10C76 24 80 44 76 76H44C40 44 44 24 60 10Z" fill="${C.white}"/>
      <circle cx="60" cy="42" r="9" fill="${C.sky}"/>
      <path d="M44 62L30 82L44 80Z" fill="${C.pink}"/>
      <path d="M76 62L90 82L76 80Z" fill="${C.pink}"/>
      <path d="M48 76L52 98L60 88L68 98L72 76Z" fill="${C.orange}"/>
    </g>
    <rect x="12" y="20" width="24" height="20" rx="3" fill="${C.yellow}"/>
    <path d="M24 20v20M12 28h24" stroke-width="3"/>
    ${sparkle(98, 100, 8)}`,

  // 플랫폼 앱 아이콘용
  noriteo: () => `
    <rect x="22" y="22" width="76" height="76" rx="20" fill="${C.yellow}"/>
    <path d="M50 42v36l30-18z" fill="${INK}"/>
    ${sparkle(96, 22, 12, C.white)}`,
};

export function art(slug, { cls = 'art' } = {}) {
  const body = (ART[slug] || ART['block-rush'])();
  return `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><g fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
}
