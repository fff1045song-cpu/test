// 리워드 (#/rewards): 포인트, 7일 출석판, 오늘의 미션, 이번 주 베스트 리뷰
// 원칙: 포인트는 게임 점수·승패·확률과 연결하지 않는다. 참여 활동에만 준다.
import * as store from '../store.js';
import { loadAll, reviewsFor, url } from '../data.js';
import { icon, esc, fmt, fmtTime, toast, pointsToast, countUp, shareLink } from '../ui.js';

const COINS = `<svg class="coins" viewBox="0 0 64 64" aria-hidden="true"><g stroke="#1A1033" stroke-width="3" fill="#FFD23F">
  <ellipse cx="28" cy="50" rx="20" ry="7"/><path d="M8 50v-6M48 50v-6"/><ellipse cx="28" cy="44" rx="20" ry="7"/>
  <ellipse cx="28" cy="36" rx="20" ry="7"/><path d="M8 36v-6M48 36v-6"/><ellipse cx="28" cy="30" rx="20" ry="7"/>
  <circle cx="30" cy="16" r="12"/><path d="M26 11h5a3 3 0 0 1 0 6h-5zM26 17v5M24 14h10" fill="none"/></g>
  <path d="M54 8c.5 3 1.8 4.3 4.6 4.8-2.8.5-4.1 1.8-4.6 4.8-.5-3-1.8-4.3-4.6-4.8 2.8-.5 4.1-1.8 4.6-4.8z" fill="#fff" stroke="#1A1033" stroke-width="1.5"/></svg>`;

let lastShown = 0;

export async function render(el) {
  const { games, seed } = await loadAll();
  const name = (slug) => games.find((g) => g.slug === slug)?.name || slug;

  const draw = () => {
    const points = store.getPoints();
    const att = store.getAttendance();
    const s = att.streak;
    const done = s === 0 ? 0 : att.checkedToday ? ((s - 1) % 7) + 1 : s % 7;

    const days = Array.from({ length: 7 }, (_, k) => {
      const i = k + 1;
      if (i === 7) {
        if (att.chestPending)
          return `<button class="day chest open" type="button" data-chest aria-label="보물상자 열기 +${store.RULES.chest}">${icon('chest', 22)}</button>`;
        if (i <= done) return `<span class="day done" aria-label="7일째 출석 완료">${icon('check', 20)}</span>`;
        if (i === done + 1 && !att.checkedToday)
          return `<button class="day today chest" type="button" data-checkin aria-label="오늘 출석하기 (7일째)">${icon('chest', 22)}</button>`;
        return `<span class="day chest" aria-label="7일째 보물상자">${icon('chest', 22)}</span>`;
      }
      if (i <= done) return `<span class="day done" aria-label="${i}일째 출석 완료">${icon('check', 20)}</span>`;
      if (i === done + 1 && !att.checkedToday)
        return `<button class="day today" type="button" data-checkin aria-label="오늘 출석하기 (${i}일째)">${i}</button>`;
      return `<span class="day">${i}</span>`;
    }).join('');

    const pm = store.getPlayMission();
    const myReviews = store.getMyReviews();
    const reviewedToday = myReviews.some((r) => r.date === store.today());
    const reviewable = games.find((g) => !g.soon && store.canReview(g.slug).ok);
    const friendDone = store.isFriendMissionDone();

    const missions = [
      {
        ic: '출', color: 'var(--yellow)', title: `출석 체크 +${store.RULES.checkIn}`,
        sub: att.checkedToday ? `오늘 출석 완료 · 연속 ${s}일` : '하루 한 번, 7일 연속이면 보물상자 +100',
        pct: att.checkedToday ? 100 : 0, barColor: 'var(--yellow)',
        btn: att.checkedToday ? doneBtn() : `<button class="btn btn-sm btn-yellow" type="button" data-checkin>받기</button>`,
      },
      {
        ic: '플', color: 'var(--orange)', title: `게임 5분 플레이 +${store.RULES.play5min}`,
        sub: pm.ready.length
          ? `${pm.ready.map(name).join(', ')} 5분 달성!`
          : pm.progressSlug
            ? `${name(pm.progressSlug)} ${fmtTime(pm.progressSec)} / 5분 · 게임별 하루 1번`
            : pm.claimed.length ? `오늘 ${pm.claimed.length}개 게임 완료 · 다른 게임도 가능` : '아무 게임이나 5분 · 게임별 하루 1번',
        pct: pm.ready.length ? 100 : Math.round(pm.progress * 100), barColor: 'var(--orange)',
        btn: pm.ready.length
          ? `<button class="btn btn-sm btn-yellow" type="button" data-claim-play>받기</button>`
          : `<a class="btn btn-sm" href="#/">도전</a>`,
      },
      {
        ic: '글', color: 'var(--sky)', title: `리뷰 1편 쓰기 +${store.RULES.review}`,
        sub: reviewedToday ? '오늘 리뷰 작성 완료 · 등록할 때 바로 지급됐어요' : '3분 이상 플레이한 게임에 쓸 수 있어요',
        pct: reviewedToday ? 100 : 0, barColor: 'var(--sky)',
        btn: reviewedToday
          ? doneBtn()
          : reviewable
            ? `<a class="btn btn-sm btn-yellow" href="#/review/${reviewable.slug}">쓰기</a>`
            : `<a class="btn btn-sm" href="#/">도전</a>`,
      },
      {
        ic: '친', color: 'var(--mint)', title: `친구와 함께 플레이 +${store.RULES.friend}`,
        sub: friendDone ? '오늘 초대 완료' : '초대 링크를 보내면 완료 (연습용)',
        pct: friendDone ? 100 : 0, barColor: 'var(--mint)',
        btn: friendDone ? doneBtn() : `<button class="btn btn-sm btn-yellow" type="button" data-invite>초대</button>`,
      },
    ];

    const all = games.flatMap((g) => reviewsFor(g.slug, seed).map((r) => ({ ...r, gameName: g.name })));
    const best = all.reduce((b, r) => (!b || r.helpfulCount > b.helpfulCount ? r : b), null);

    el.innerHTML = `
      <header class="hdr rw-hdr">
        <div class="sub-hdr">
          <a class="icon-btn" href="#/" data-back aria-label="뒤로">${icon('back', 22)}</a>
          <h1 class="hdr-title">리워드</h1>
        </div>
        <div class="rw-balance">
          ${COINS}
          <div>
            <div class="rw-label">내 포인트</div>
            <div class="rw-points" data-points aria-live="polite">${fmt(lastShown)}</div>
          </div>
          <button class="btn btn-sm btn-yellow" type="button" data-exchange>교환</button>
        </div>
      </header>

      <section class="card attend" aria-labelledby="att-title">
        <div class="attend-head">
          <h2 id="att-title">연속 출석 ${s}일째</h2>
          <span>7일째 보물상자</span>
        </div>
        <div class="attend-days">${days}</div>
      </section>

      <section class="section" aria-labelledby="ms-title">
        <div class="section-head">
          <h2 class="section-title" id="ms-title">오늘의 미션</h2>
          <span class="section-sub">점수·승패와 상관없이 참여하면 OK</span>
        </div>
        <div class="missions">
          ${missions.map((m) => `
            <div class="mission">
              <span class="mission-ic" style="background:${m.color}">${m.ic}</span>
              <div class="mission-body">
                <div class="mission-title">${m.title}</div>
                <div class="bar"><i style="width:${m.pct}%;background:${m.barColor}"></i></div>
                <div class="mission-sub">${esc(m.sub)}</div>
              </div>
              ${m.btn}
            </div>`).join('')}
        </div>
      </section>

      ${best ? `
      <section class="section">
        <a class="best-week" href="#/game/${best.game}">
          ${icon('trophy', 40)}
          <div class="best-week-body">
            <div class="best-week-title">이번 주 베스트 리뷰</div>
            <div class="best-week-sub">'도움돼요' 1위 리뷰어에게 베스트 배지를 드려요</div>
            <div class="best-week-quote"><b>${esc(best.user)}</b> · ${esc(best.gameName)} — ${esc(best.text)}</div>
          </div>
          <span class="icon-btn" aria-hidden="true">${icon('chevron', 22)}</span>
        </a>
      </section>` : ''}
    `;

    countUp(el.querySelector('[data-points]'), lastShown, points);
    lastShown = points;
  };

  draw();

  el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-checkin]')) {
      const r = store.checkIn();
      if (r.ok) {
        pointsToast(r.points, `출석 ${r.streak}일째`);
        if (r.chest) toast('7일 연속 출석! 보물상자를 열어 보세요');
      }
      draw();
    } else if (e.target.closest('[data-chest]')) {
      const r = store.openChest();
      if (r.ok) pointsToast(r.points, '보물상자 오픈!');
      draw();
    } else if (e.target.closest('[data-claim-play]')) {
      const r = store.claimPlayMission();
      if (r.ok) pointsToast(r.points, '5분 플레이 미션');
      draw();
    } else if (e.target.closest('[data-invite]')) {
      const ok = await shareLink(url('index.html'), '놀이터에서 같이 게임하자!');
      if (!ok) return;
      const r = store.completeFriendMission();
      if (r.ok) pointsToast(r.points, '친구 초대 완료');
      draw();
    } else if (e.target.closest('[data-exchange]')) {
      toast('포인트 교환은 준비 중이에요. 열심히 모아 두세요!');
    }
  });
}

const doneBtn = () => `<button class="btn btn-sm" type="button" disabled>완료</button>`;
