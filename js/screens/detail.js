// 게임 상세 (#/game/:slug)
import * as store from '../store.js';
import { loadAll, rateFor, reviewsFor, bestReview } from '../data.js';
import { art } from '../art.js';
import { icon, esc, fmt, fmtMinutes, fmtTime, toast, shareLink } from '../ui.js';

const TAG_COLORS = ['var(--yellow)', 'var(--sky)', 'var(--pink)', 'var(--mint)'];

export async function render(el, { slug }) {
  const { games, seed } = await loadAll();
  const g = games.find((x) => x.slug === slug);
  if (!g) {
    el.innerHTML = `<div class="soon-screen"><div><h2>게임을 찾을 수 없어요</h2><p>주소를 다시 확인해 주세요.</p><a class="btn btn-theme" href="#/">홈으로</a></div></div>`;
    return;
  }

  const draw = () => {
    const rate = rateFor(g, seed);
    const reviews = reviewsFor(slug, seed);
    const best = bestReview(reviews);
    const rest = reviews.filter((r) => r !== best).sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || b.date.localeCompare(a.date));
    const mine = store.getMyReview(slug);
    const myTime = store.getPlaytime(slug);

    el.innerHTML = `
      <div class="detail-hero" style="background-color:${g.soon ? 'var(--muted)' : 'var(--theme)'}">
        <div class="hero-bar">
          <a class="icon-btn" href="#/" data-back aria-label="뒤로">${icon('back', 22)}</a>
          <button class="icon-btn" type="button" data-share aria-label="공유하기">${icon('share', 22)}</button>
        </div>
        ${art(g.slug)}
      </div>

      <section class="card detail-card">
        <h1 class="detail-title">${esc(g.name)}</h1>
        <p class="detail-meta">${esc(g.developer)} · ${esc(g.genre)} · ${g.orientation === 'portrait' ? '세로 화면' : '가로 화면'}</p>
        <div class="rate-sticker" aria-label="추천률 ${rate.rate}%"><b>${rate.rate}%</b><span>추천</span></div>
        <div class="tags">${g.tags.map((t, i) => `<span class="tag" style="background:${TAG_COLORS[i % 4]}">#${esc(t)}</span>`).join('')}</div>
        <div class="detail-actions">
          ${g.soon
            ? `<button class="btn btn-theme btn-lg" type="button" data-soon="${esc(g.name)}">곧 만나요</button>
               <button class="btn btn-lg" type="button" data-soon="${esc(g.name)}">${icon('addHome', 20)}홈에 추가</button>`
            : `<a class="btn btn-theme btn-lg" href="#/play/${g.slug}" data-play>${icon('play', 18)}바로 플레이</a>
               <a class="btn btn-lg" href="g/${g.slug}/?install=1">${icon('addHome', 20)}홈에 추가</a>`}
        </div>
        <p class="detail-desc">${esc(g.description)}</p>
        ${myTime ? `<p class="detail-meta" style="margin-top:8px">${icon('clock', 14, 'style="display:inline;vertical-align:-2px"')} 내 플레이 ${fmtTime(myTime)}</p>` : ''}
      </section>

      <section class="section" aria-labelledby="rv-title">
        <div class="section-head">
          <h2 class="section-title" id="rv-title">플레이어 리뷰</h2>
          <span class="rate-word ${rate.rate < 70 ? 'mixed' : ''}">${rate.label}</span>
        </div>
        <div class="rec-bar" role="img" aria-label="추천 ${rate.rate}%"><i style="width:${rate.rate}%"></i></div>
        <div class="rec-meta"><span>추천 ${fmt(rate.up)}</span><span>리뷰 ${fmt(rate.total)}개</span><span>비추천 ${fmt(rate.down)}</span></div>
        ${best ? reviewCard(best, { best: true }) : ''}
        ${rest.map((r) => reviewCard(r)).join('')}
        ${!reviews.length ? '<div class="empty" style="margin-top:14px">아직 리뷰가 없어요. 첫 리뷰를 남겨 주세요!</div>' : ''}
      </section>

      ${g.soon ? '' : `
      <div class="fixed-bottom cta-bar">
        ${mine
          ? `<button class="btn btn-lg" type="button" disabled>${icon('check', 20)}리뷰 작성 완료</button>`
          : `<a class="btn btn-yellow btn-lg" href="#/review/${g.slug}">${icon('pencil', 20)}리뷰 쓰고 +${store.RULES.review} 받기</a>`}
      </div>`}
    `;
  };

  draw();

  el.addEventListener('click', async (e) => {
    const help = e.target.closest('[data-helpful]');
    if (help) {
      const on = store.toggleHelpful(help.dataset.helpful);
      const count = Number(help.dataset.count) + (on ? 1 : -1);
      help.dataset.count = count;
      help.setAttribute('aria-pressed', String(on));
      help.querySelector('span').textContent = fmt(count);
      return;
    }
    const replyBtn = e.target.closest('[data-reply]');
    if (replyBtn) {
      const box = el.querySelector(`#${replyBtn.dataset.reply}`);
      box.hidden = !box.hidden;
      replyBtn.setAttribute('aria-expanded', String(!box.hidden));
      return;
    }
    if (e.target.closest('[data-share]')) {
      const ok = await shareLink(location.href, `${g.name} — 놀이터`);
      if (ok) toast('게임 링크를 준비했어요. 친구에게 보내 보세요!');
    }
  });
}

export function reviewCard(r, { best = false } = {}) {
  const initial = esc(r.user.slice(0, 1));
  const replyId = `reply-${r.id}`;
  return `
    <article class="card review ${best ? 'best' : ''}">
      ${best ? '<span class="badge badge-pink best-badge">BEST 리뷰</span>' : ''}
      <div class="review-head">
        <span class="avatar" style="background:${r.mine ? 'var(--yellow)' : r.color || 'var(--sky)'}">${initial}</span>
        <span class="review-user">${esc(r.user)}${r.mine ? ' (내 리뷰)' : ''}</span>
        <span class="pt-chip">플레이 ${fmtMinutes(r.playtimeMin)}</span>
      </div>
      <div class="review-verdict ${r.recommend ? '' : 'no'}">
        ${icon(r.recommend ? 'thumbUp' : 'thumbDown', 18)}${r.recommend ? '추천해요' : '추천하지 않아요'}
      </div>
      <p class="review-text">${esc(r.text)}</p>
      <div class="review-foot">
        ${r.mine
          ? `<span class="pt-chip">도움돼요 ${fmt(r.helpfulCount)}</span>`
          : `<button class="btn btn-sm helpful" type="button" data-helpful="${esc(r.id)}" data-count="${r.helpfulCount}" aria-pressed="${store.isHelpful(r.id)}">도움돼요 <span>${fmt(r.helpfulCount)}</span></button>`}
        ${r.reply ? `<button class="link-btn" type="button" data-reply="${replyId}" aria-expanded="false">개발사 답글 1개</button>` : ''}
        <span class="row-sub" style="margin-left:auto">${esc(r.date)}</span>
      </div>
      ${r.reply ? `<div class="dev-reply" id="${replyId}" hidden><b>${esc(r.reply.from)}</b>${esc(r.reply.text)}</div>` : ''}
    </article>`;
}
