// 앱 셸: 해시 라우터, 화면 전환, 하단 탭
import * as store from './store.js';
import { noteVisit, goBack } from './nav.js';
import { icon, toast, isIOS, isStandalone } from './ui.js';
import * as home from './screens/home.js';
import * as detail from './screens/detail.js';
import * as play from './screens/play.js';
import * as review from './screens/review.js';
import * as rewards from './screens/rewards.js';
import * as my from './screens/my.js';
import * as soon from './screens/soon.js';

// [주소 패턴, 화면, 옵션] — tab: 켜질 하단 탭, tabbar:false 면 탭 숨김
const ROUTES = [
  [/^\/$/, home, { tab: 'home' }],
  [/^\/ranking$/, home, { tab: 'ranking', mode: 'ranking' }],
  [/^\/friends$/, soon, { tab: 'friends', mode: 'friends' }],
  [/^\/rewards$/, rewards, { tab: 'rewards' }],
  [/^\/my$/, my, { tab: 'my' }],
  [/^\/game\/([\w-]+)$/, detail, { tabbar: false }],
  [/^\/review\/([\w-]+)$/, review, { tabbar: false }],
  [/^\/play\/([\w-]+)$/, play, { tabbar: false, play: true }],
];

const TABS = [
  ['home', '#/', 'home', '홈'],
  ['ranking', '#/ranking', 'ranking', '랭킹'],
  ['friends', '#/friends', 'friends', '친구'],
  ['rewards', '#/rewards', 'gift', '리워드'],
  ['my', '#/my', 'grid', '내 게임'],
];

const view = document.getElementById('view');
const tabbar = document.getElementById('tabbar');
const scrollMemo = new Map();
let cleanup = null;
let renderId = 0;
let currentHash = null;
let currentOpts = {};

function currentPath() {
  const h = location.hash.replace(/^#/, '') || '/';
  return h.split('?')[0];
}

async function route() {
  const path = currentPath();
  const hash = `#${path}`;

  noteVisit(hash);

  if (currentHash) scrollMemo.set(currentHash, window.scrollY);
  currentHash = hash;

  let match = null;
  let screen = home;
  let opts = { tab: 'home' };
  for (const [re, s, o] of ROUTES) {
    match = path.match(re);
    if (match) {
      screen = s;
      opts = o;
      break;
    }
  }
  if (!match) {
    location.replace('#/');
    return;
  }

  const id = ++renderId;
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;

  const el = document.createElement('div');
  el.className = `screen${opts.tabbar === false ? ' no-tabbar' : ''}`;
  view.replaceChildren(el);
  updateTabbar(opts);
  if (!opts.play && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});

  try {
    const result = await screen.render(el, { slug: match[1], mode: opts.mode });
    if (id !== renderId) {
      if (typeof result === 'function') result();
      return;
    }
    cleanup = result;
  } catch (err) {
    console.error(err);
    el.innerHTML = `<div class="soon-screen"><div><h2>앗, 화면을 못 열었어요</h2><p>새로고침하거나 홈으로 돌아가 주세요.</p><a class="btn btn-theme" href="#/">홈으로</a></div></div>`;
  }

  const y = scrollMemo.get(hash) || 0;
  window.scrollTo(0, y);
}

function updateTabbar(opts) {
  currentOpts = opts;
  tabbar.hidden = opts.tabbar === false;
  if (tabbar.hidden) return;
  const dot = store.hasClaimable();
  tabbar.innerHTML = TABS.map(
    ([key, href, ic, label]) => `
      <a class="tab" href="${href}" ${opts.tab === key ? 'aria-current="page"' : ''}>
        <span class="tab-ic">${icon(ic, 22)}</span>${label}
        ${key === 'rewards' && dot ? '<i class="tab-dot" aria-label="받을 보상 있음"></i>' : ''}
      </a>`,
  ).join('');
}

window.addEventListener('hashchange', route);
window.addEventListener('store:change', () => {
  // 받을 보상이 생기거나 없어지면 리워드 탭의 빨간 점을 갱신
  if (!tabbar.hidden && !!tabbar.querySelector('.tab-dot') !== store.hasClaimable()) updateTabbar(currentOpts);
});

// 전역 클릭 처리
document.addEventListener('click', (e) => {
  // "곧 만나요" 게임
  const soonEl = e.target.closest('[data-soon]');
  if (soonEl) {
    e.preventDefault();
    toast(`${soonEl.dataset.soon} — 곧 만나요! 출시 준비 중이에요.`);
    return;
  }
  // 플레이 버튼: 안드로이드에서는 주소창을 숨기는 전체 화면으로
  const playEl = e.target.closest('[data-play]');
  if (playEl && wantsFullscreen()) {
    document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
  }
  // 뒤로 버튼
  const backEl = e.target.closest('[data-back]');
  if (backEl) {
    e.preventDefault();
    goBack(backEl.getAttribute('href') || '#/');
  }
});

function wantsFullscreen() {
  return (
    document.fullscreenEnabled &&
    !document.fullscreenElement &&
    !isIOS() &&
    !isStandalone() &&
    matchMedia('(pointer: coarse)').matches
  );
}

route();
