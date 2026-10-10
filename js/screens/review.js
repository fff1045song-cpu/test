// 리뷰 쓰기 (#/review/:slug)
import * as store from '../store.js';
import { getGame } from '../data.js';
import { icon, esc, fmtTime, thumb, pointsToast } from '../ui.js';
import { reviewCard } from './detail.js';
import { backTo } from '../nav.js';

const MIN_TEXT = 10;
const MAX_TEXT = 500;

export async function render(el, { slug }) {
  const g = await getGame(slug);
  if (!g || g.soon) {
    location.replace('#/');
    return;
  }

  const head = `
    <header class="hdr">
      <div class="sub-hdr">
        <a class="icon-btn" href="#/game/${g.slug}" data-back aria-label="뒤로">${icon('back', 22)}</a>
        <h1 class="hdr-title">리뷰 쓰기</h1>
      </div>
    </header>`;

  const check = store.canReview(slug);

  if (!check.ok && check.reason === 'done') {
    const mine = store.getMyReview(slug);
    el.innerHTML = `${head}
      <div class="notice">${icon('check', 26)}<div class="notice-body"><div class="notice-title">이미 리뷰를 썼어요</div><p>리뷰는 게임마다 한 번만 쓸 수 있어요.</p></div></div>
      <div style="padding:0 16px">${reviewCard({ ...mine, helpfulCount: 0 })}</div>`;
    return;
  }

  if (!check.ok && check.reason === 'playtime') {
    const need = store.RULES.reviewMinSec;
    const pct = Math.min(100, Math.round((check.sec / need) * 100));
    el.innerHTML = `${head}
      <div class="notice">
        ${icon('lock', 26)}
        <div class="notice-body" style="flex:1">
          <div class="notice-title">3분 이상 플레이하면 리뷰를 쓸 수 있어요</div>
          <p>믿을 수 있는 리뷰를 위해 직접 플레이해 본 분만 쓸 수 있어요. 지금 <b>${fmtTime(check.sec)}</b> 플레이했어요.</p>
          <div class="progress-big" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
          <p>앞으로 ${fmtTime(need - check.sec)} 더!</p>
        </div>
      </div>
      <div style="padding:8px 16px">
        <a class="btn btn-theme btn-lg btn-block" href="#/play/${g.slug}" data-play>${icon('play', 18)}${esc(g.name)} 플레이하러 가기</a>
      </div>`;
    return;
  }

  let verdict = null;
  el.innerHTML = `${head}
    <form class="card form-card" novalidate>
      <div class="game-mini">
        ${thumb(g)}
        <div>
          <div class="game-mini-name">${esc(g.name)}</div>
          <span class="pt-chip">${icon('clock', 12, 'style="display:inline;vertical-align:-1px"')} 내 플레이 ${fmtTime(check.sec)}</span>
        </div>
      </div>
      <fieldset style="border:0;padding:0;margin:0">
        <legend class="sr-only">이 게임을 추천하나요?</legend>
        <div class="verdict-pick">
          <button class="btn verdict-btn up" type="button" data-verdict="up" aria-pressed="false">${icon('thumbUp', 22)}추천해요</button>
          <button class="btn verdict-btn down" type="button" data-verdict="down" aria-pressed="false">${icon('thumbDown', 22)}별로예요</button>
        </div>
      </fieldset>
      <label class="field-label" for="rv-text">어떤 점이 좋았나요? 아쉬웠나요?</label>
      <textarea class="textarea" id="rv-text" maxlength="${MAX_TEXT}" placeholder="다른 플레이어가 고를 때 도움이 되도록 솔직하게 적어 주세요. (${MIN_TEXT}자 이상)"></textarea>
      <div class="counter"><span data-count>0</span> / ${MAX_TEXT}</div>
      <p class="row-sub" style="margin:6px 0 14px">리뷰에는 작성할 때의 플레이 시간(${fmtTime(check.sec)})이 함께 표시돼요.</p>
      <button class="btn btn-yellow btn-lg btn-block" type="submit" disabled>${icon('pencil', 20)}등록하고 +${store.RULES.review} 받기</button>
    </form>`;

  const form = el.querySelector('form');
  const text = form.querySelector('textarea');
  const submit = form.querySelector('[type=submit]');
  const counter = form.querySelector('[data-count]');
  const sync = () => {
    counter.textContent = text.value.length;
    submit.disabled = !verdict || text.value.trim().length < MIN_TEXT;
  };

  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-verdict]');
    if (!b) return;
    verdict = b.dataset.verdict;
    form.querySelectorAll('[data-verdict]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    sync();
  });
  text.addEventListener('input', sync);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    const res = store.addReview(slug, verdict === 'up', text.value.trim());
    if (res.ok) {
      pointsToast(res.points, '리뷰 고마워요');
      backTo(`#/game/${slug}`);
    }
  });
}
