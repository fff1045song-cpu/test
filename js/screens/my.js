// 내 게임 (#/my): 최근 플레이, 총 플레이 시간, 내가 쓴 리뷰
import * as store from '../store.js';
import { loadGames } from '../data.js';
import { icon, esc, fmt, fmtTime, fmtAgo, thumb, toast } from '../ui.js';
import { reviewCard } from './detail.js';

export async function render(el) {
  const games = await loadGames();
  const bySlug = Object.fromEntries(games.map((g) => [g.slug, g]));

  const draw = () => {
    const recent = store.getRecentPlays().filter((p) => bySlug[p.slug]);
    const total = Object.values(store.getAllPlaytime()).reduce((a, b) => a + b, 0);
    const reviews = store.getMyReviews();

    el.innerHTML = `
      <header class="hdr">
        <h1 class="hdr-title">내 게임</h1>
        <div class="stats">
          <div class="stat"><b>${fmtTime(total)}</b><span>총 플레이</span></div>
          <div class="stat"><b>${fmtTime(store.getTodayTotal())}</b><span>오늘 플레이</span></div>
          <a class="stat" href="#/rewards"><b>${fmt(store.getPoints())}</b><span>내 포인트</span></a>
        </div>
      </header>

      <section class="section" aria-labelledby="recent-title">
        <div class="section-head"><h2 class="section-title" id="recent-title">최근 플레이</h2></div>
        ${recent.length
          ? `<ul class="list">${recent.map(({ slug, at, total: sec }) => {
              const g = bySlug[slug];
              const saved = store.loadGame(slug) !== null;
              return `
              <li class="row-card">
                <a href="#/game/${slug}">${thumb(g)}</a>
                <a class="row-body" href="#/game/${slug}">
                  <div class="row-title">${esc(g.name)}</div>
                  <div class="row-sub">${fmtAgo(at)} · 총 ${fmtTime(sec)}</div>
                </a>
                <a class="btn btn-sm ${saved ? 'btn-yellow' : ''}" href="#/play/${slug}" data-play>${saved ? '이어하기' : '플레이'}</a>
              </li>`;
            }).join('')}</ul>`
          : `<div class="empty">아직 플레이한 게임이 없어요.<br />오늘의 게임부터 시작해 볼까요?<br /><a class="btn btn-theme" href="#/">게임 고르러 가기</a></div>`}
      </section>

      <section class="section" aria-labelledby="myrv-title">
        <div class="section-head"><h2 class="section-title" id="myrv-title">내가 쓴 리뷰</h2><span class="section-sub">${reviews.length}개</span></div>
        ${reviews.length
          ? reviews.map((r) => `<div class="row-sub" style="margin-top:12px">${esc(bySlug[r.game]?.name || r.game)}</div>${reviewCard({ ...r, helpfulCount: 0 })}`).join('')
          : `<div class="empty">3분 이상 플레이한 게임에 리뷰를 쓰면 +${store.RULES.review} 포인트를 받아요.</div>`}
      </section>

      <details class="dev-tools">
        <summary>연습용 테스트 도구</summary>
        <p>흐름을 빨리 확인하려고 넣은 버튼이에요. 정식 버전에서는 빠져요.</p>
        <button class="btn" type="button" data-dev="time">게임 3개 플레이 시간 +3분</button>
        <button class="btn" type="button" data-dev="yesterday">오늘 출석을 어제로 옮기기 (연속 출석 시험)</button>
        <button class="btn btn-pink" type="button" data-dev="reset">모든 기록 지우기</button>
      </details>
    `;
  };

  draw();

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dev]');
    if (!b) return;
    const kind = b.dataset.dev;
    if (kind === 'time') {
      store.devAddPlaytime(games.filter((g) => !g.soon).map((g) => g.slug), 180);
      toast('플레이 시간을 3분씩 더했어요');
    } else if (kind === 'yesterday') {
      store.devYesterdayCheckIn();
      toast('오늘 출석을 어제로 옮겼어요. 리워드에서 다시 출석해 보세요');
    } else if (kind === 'reset') {
      if (!confirm('포인트, 리뷰, 플레이 기록, 이어하기를 모두 지울까요?')) return;
      store.resetAll();
      toast('모든 기록을 지웠어요');
    }
    const open = el.querySelector('details').open;
    draw();
    el.querySelector('details').open = open;
  });
}
