// 홈 (#/) 과 랭킹 탭 (#/ranking)
import * as store from '../store.js';
import { loadAll, rateFor } from '../data.js';
import { recommend } from '../recommend.js';
import { art } from '../art.js';
import { icon, esc, fmt, thumb, toast } from '../ui.js';

const CATS = [
  ['퍼즐', 'var(--sky)', icon('puzzle', 26), (g) => g.genre === '퍼즐'],
  ['액션', 'var(--pink)', icon('bolt', 26), (g) => g.genre === '액션' || g.genre === '아케이드'],
  ['경영', 'var(--mint)', icon('shop', 26), (g) => g.genre === '경영'],
  ['친구 대전', 'var(--orange)', 'VS', (g) => g.tags.includes('친구대전')],
  ['신작', 'var(--white)', `<span style="color:var(--theme)">${icon('sparkle', 26)}</span>`, (g) => !!g.isNew],
];

let nudged = false;

export async function render(el, { mode }) {
  const { games, seed } = await loadAll();
  if (mode === 'ranking') return renderRanking(el, games, seed);

  const att = store.getAttendance();
  const playable = games.filter((g) => !g.soon);
  const dayNo = Math.floor(Date.now() / 86400000);
  const todayGame = playable[dayNo % playable.length];
  const friendsNow = 2 + (dayNo % 4);
  const rec = recommend(games, seed, store.getAllPlaytime());
  let cat = null;

  el.innerHTML = `
    <header class="hdr home-hdr">
      <div class="hdr-row">
        <h1 class="logo">놀이터${icon('sparkle', 20)}</h1>
        <a class="chip chip-streak" href="#/rewards" aria-label="연속 출석 ${att.streak}일째">${icon('flame', 18)}${att.streak}일째</a>
        <a class="chip chip-points" href="#/rewards" aria-label="내 포인트 ${fmt(store.getPoints())}">${icon('coin', 20)}<span data-points>${fmt(store.getPoints())}</span></a>
        <button class="icon-btn" type="button" data-search aria-label="게임 검색">${icon('search', 22)}</button>
      </div>
    </header>

    <a class="today" href="#/game/${todayGame.slug}" style="background-color:${todayGame.color}" aria-label="오늘의 게임 ${esc(todayGame.name)}">
      <span class="badge badge-ink tilt-l today-badge">오늘의 게임</span>
      <h2 class="today-title">${esc(todayGame.name)}</h2>
      <div class="today-sub"><i class="dot-live"></i>친구 ${friendsNow}명이 지금 플레이 중</div>
      <span class="btn btn-theme" role="presentation">${icon('play', 18)}플레이</span>
      <span class="today-art">${art(todayGame.slug)}</span>
    </a>

    <nav class="cats" aria-label="카테고리">
      ${CATS.map(
        ([name, color, ic], i) => `
        <button class="cat" type="button" data-cat="${i}" aria-pressed="false">
          <span class="cat-ic" style="background:${color}">${ic}</span>${name}
        </button>`,
      ).join('')}
    </nav>

    <section class="section" aria-labelledby="rec-title">
      <div class="section-head">
        <h2 class="section-title" id="rec-title">내 취향 저격</h2>
        <span class="section-sub">${esc(rec.reason)}</span>
      </div>
      <div class="hscroll">
        ${rec.list.map(({ game, rate }) => `
          <a class="pick" href="#/game/${game.slug}" ${game.soon ? `data-soon="${esc(game.name)}"` : ''}>
            <div class="thumb" style="background-color:${game.color}">${art(game.slug)}${game.soon ? '<span class="soon-pill">준비 중</span>' : ''}</div>
            <span class="pick-name">${esc(game.name)}</span>
            <span class="rate-pill">추천 ${rate}%</span>
          </a>`).join('')}
      </div>
    </section>

    <section class="section" aria-labelledby="rank-title">
      <div class="section-head">
        <h2 class="section-title" id="rank-title">실시간 랭킹</h2>
        <span class="live">LIVE</span>
        <a class="section-more" href="#/ranking">전체</a>
      </div>
      <ol class="rank-list" data-ranks></ol>
    </section>
  `;

  const ranksEl = el.querySelector('[data-ranks]');
  const titleEl = el.querySelector('#rank-title');
  const drawRanks = () => {
    const filter = cat === null ? () => true : CATS[cat][3];
    const list = games.filter(filter).sort((a, b) => a.rank - b.rank).slice(0, cat === null ? 5 : 8);
    titleEl.textContent = cat === null ? '실시간 랭킹' : `${CATS[cat][0]} 랭킹`;
    ranksEl.innerHTML = list.length ? list.map((g, i) => rankItem(g, i + 1, seed)).join('') : '<li class="empty">이 카테고리 게임을 준비하고 있어요.</li>';
  };
  drawRanks();

  el.addEventListener('click', (e) => {
    const catBtn = e.target.closest('[data-cat]');
    if (catBtn) {
      const i = Number(catBtn.dataset.cat);
      cat = cat === i ? null : i;
      el.querySelectorAll('[data-cat]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.cat) === cat)));
      drawRanks();
      ranksEl.closest('section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (e.target.closest('[data-search]')) toast('검색은 준비 중이에요. 랭킹과 취향 추천에서 골라 보세요!');
  });

  if (!att.checkedToday && !nudged) {
    nudged = true;
    toast('오늘 출석하고 +10 포인트 받아요', { action: { label: '출석하기', href: '#/rewards' } });
  }
}

function rankItem(g, n, seed) {
  const { label } = rateFor(g, seed);
  const sub = g.tags.includes('친구대전') ? '친구 대전' : g.isNew ? '신작' : label;
  const ch = g.rankChange;
  const change =
    ch === null || ch === undefined
      ? '<span class="new-pill">NEW</span>'
      : ch > 0
        ? `<span class="rank-change up" aria-label="${ch}계단 상승">${icon('arrowUp', 14)}${ch}</span>`
        : ch < 0
          ? `<span class="rank-change down" aria-label="${-ch}계단 하락">${icon('arrowDown', 14)}${-ch}</span>`
          : '<span class="rank-change same" aria-label="변동 없음">-</span>';
  const soonAttr = g.soon ? `data-soon="${esc(g.name)}"` : '';
  return `
    <li class="rank-item">
      <span class="rank-num">${n}</span>
      <a class="rank-link" href="#/game/${g.slug}" ${soonAttr}>
        ${thumb(g, 'rank-thumb')}
        <span class="rank-info">
          <span class="rank-name">${esc(g.name)}</span>
          <span class="rank-sub">${esc(g.genre)} · ${esc(sub)}</span>
        </span>
      </a>
      <span class="rank-change-wrap">${change}</span>
      ${g.soon
        ? `<button class="btn btn-sm" type="button" ${soonAttr}>곧 출시</button>`
        : `<a class="btn btn-sm" href="#/play/${g.slug}" data-play aria-label="${esc(g.name)} 플레이">플레이</a>`}
    </li>`;
}

function renderRanking(el, games, seed) {
  const list = [...games].sort((a, b) => a.rank - b.rank);
  el.innerHTML = `
    <header class="hdr">
      <div class="hdr-row"><h1 class="hdr-title">실시간 랭킹</h1><span class="live">LIVE</span></div>
      <p style="margin:8px 0 0;font-size:13.5px;opacity:.9">지금 놀이터에서 가장 많이 플레이하는 게임이에요.</p>
    </header>
    <section class="section">
      <ol class="rank-list">${list.map((g, i) => rankItem(g, i + 1, seed)).join('')}</ol>
    </section>`;
}
