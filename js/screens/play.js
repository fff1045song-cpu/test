// 플레이 (#/play/:slug)
// 게임은 sandbox iframe 안에서 돌고, SDK 메시지(postMessage)로만 대화한다.
// 채팅·음성챗은 연습용 흉내 (실제 연결 없음).
import * as store from '../store.js';
import { getGame, url } from '../data.js';
import { icon, esc, fmt, thumb, toast, shareLink } from '../ui.js';

const NS = 'noriteo-pg';
const VERSION = 1;
const MSG_TYPES = new Set(['ready', 'gameStart', 'score', 'gameOver', 'save', 'load']);

const FRIENDS = {
  민지: { color: 'var(--sky)', short: '민' },
  하준: { color: 'var(--yellow)', short: '하' },
};

const SCRIPT = [
  ['민지', '오 나 들어왔어!'],
  ['하준', '3판 2선승 ㄱ?'],
  ['민지', '콜! 지는 사람이 리뷰 쓰기'],
  ['하준', '방금 그거 봤어? 미쳤다'],
  ['민지', '나 이 구간 맨날 죽음 ㅠㅠ'],
  ['하준', '천천히 해 천천히'],
  ['민지', '한 판만 더 하자'],
];

const RANDOM = [
  ['하준', 'ㅋㅋㅋ 손 풀렸다'],
  ['민지', '와 점수 뭐야'],
  ['하준', '집중 집중'],
  ['민지', '오늘 출석 체크 했어?'],
  ['하준', '이거 홈 화면에 추가해 둠'],
];

const REPLIES = ['ㅋㅋㅋ 인정', '오케이!', '가보자고', 'ㄱㄱ', '나도 나도'];

const REACTIONS = [
  ['나이스!', 'btn-mint', 'var(--yellow)'],
  ['한 판 더', 'btn-orange', 'var(--orange)'],
  ['도와줘', 'btn-sky', 'var(--sky)'],
];

export async function render(el, { slug }, { launcher = false } = {}) {
  const g = await getGame(slug);
  if (!g || g.soon) {
    location.replace('#/');
    return;
  }

  const exitBtn = launcher
    ? `<a class="icon-btn" href="${url('index.html')}#/game/${g.slug}" aria-label="놀이터 홈으로">${icon('home', 22)}</a>`
    : `<a class="icon-btn" href="#/game/${g.slug}" data-back aria-label="게임 나가기">${icon('close', 22)}</a>`;

  el.innerHTML = `
    <div class="play">
      <div class="play-top">
        ${exitBtn}
        <div class="voice">
          <div class="voice-text"><b>음성챗</b><span data-voice>민지, 하준 접속 중</span></div>
          <div class="voice-avatars">
            <span class="avatar" data-av="민지" style="background:${FRIENDS.민지.color}">민</span>
            <span class="avatar" data-av="하준" style="background:${FRIENDS.하준.color}">하</span>
            <span class="avatar" data-av="나" style="background:var(--pink)">나</span>
          </div>
        </div>
        <button class="icon-btn yellow" type="button" data-invite aria-label="친구 초대 링크 보내기">${icon('userPlus', 22)}</button>
      </div>
      <div class="practice-label">연습용 — 실제 연결 없음</div>

      <div class="stage">
        <iframe sandbox="allow-scripts" src="${url(g.path)}" title="${esc(g.name)} 게임 화면"></iframe>
        <div class="stage-score" data-score hidden><small>SCORE</small><b>0</b></div>
        <div class="chat-log" data-log aria-live="polite"></div>
        <div class="loading" data-loading>${thumb(g)}<span>${esc(g.name)} 불러오는 중…</span></div>
      </div>

      <div class="play-bottom">
        <div class="reactions">
          ${REACTIONS.map(([t, cls], i) => `<button class="btn ${cls}" type="button" data-react="${i}">${t}</button>`).join('')}
        </div>
        <form class="chat-form" data-form>
          <button class="icon-btn" type="button" data-chat-toggle aria-pressed="true" aria-label="채팅 말풍선 접기">${icon('chat', 20)}</button>
          <label class="sr-only" for="chat-input">메시지</label>
          <input class="chat-input" id="chat-input" type="text" maxlength="60" placeholder="메시지 보내기" autocomplete="off" enterkeyhint="send" />
          <button class="icon-btn" type="button" data-mic aria-pressed="false" aria-label="마이크 켜기">${icon('micOff', 20)}</button>
        </form>
      </div>
    </div>`;

  const frame = el.querySelector('iframe');
  const stage = el.querySelector('.stage');
  const scoreBox = el.querySelector('[data-score]');
  const scoreNum = scoreBox.querySelector('b');
  const log = el.querySelector('[data-log]');
  const loading = el.querySelector('[data-loading]');
  const voiceText = el.querySelector('[data-voice]');
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };

  // ---------- 게임 ↔ 플랫폼 메시지 ----------

  let running = false;

  const hideLoading = () => {
    loading.style.opacity = '0';
    later(() => loading.remove(), 300);
  };
  later(hideLoading, 6000);

  const reply = (type, payload, id) => {
    frame.contentWindow?.postMessage({ ns: NS, v: VERSION, type, payload, id }, '*');
  };

  const onMessage = (e) => {
    // 우리 게임 iframe 이 보낸 메시지만, 정해진 형식만 받는다. 모르는 메시지는 무시.
    if (e.source !== frame.contentWindow) return;
    const d = e.data;
    if (!d || typeof d !== 'object' || d.ns !== NS || d.v !== VERSION || !MSG_TYPES.has(d.type)) return;

    switch (d.type) {
      case 'ready':
        hideLoading();
        break;
      case 'gameStart':
        running = true;
        store.markPlayed(slug);
        scoreBox.hidden = false;
        scoreNum.textContent = '0';
        break;
      case 'score':
        if (Number.isFinite(d.payload)) {
          scoreBox.hidden = false;
          scoreNum.textContent = fmt(Math.max(0, Math.floor(d.payload)));
        }
        break;
      case 'gameOver':
        // 점수는 화면 표시용일 뿐, 포인트와는 연결하지 않는다.
        running = false;
        if (Number.isFinite(d.payload)) scoreNum.textContent = fmt(Math.max(0, Math.floor(d.payload)));
        break;
      case 'save':
        if (!store.saveGame(slug, d.payload)) console.warn('[놀이터] 저장 데이터가 너무 크거나 형식이 맞지 않아요');
        break;
      case 'load':
        if (Number.isInteger(d.id)) reply('loadResult', store.loadGame(slug), d.id);
        break;
    }
  };
  window.addEventListener('message', onMessage);

  // ---------- 플레이 시간: 게임이 시작됐고 화면이 보이는 동안만 ----------

  const tick = setInterval(() => {
    if (!running || document.visibilityState !== 'visible') return;
    const beforeTotal = store.getPlaytime(slug);
    const beforeToday = store.getTodayPlaytime(slug);
    store.addPlaytime(slug, 1);
    const R = store.RULES;
    if (beforeTotal < R.reviewMinSec && beforeTotal + 1 >= R.reviewMinSec && !store.getMyReview(slug)) {
      toast(`3분 플레이 달성! 이제 리뷰를 쓸 수 있어요 (+${R.review})`);
    }
    if (beforeToday < R.play5minSec && beforeToday + 1 >= R.play5minSec && !store.getPlayMission().claimed.includes(slug)) {
      toast(`5분 플레이 미션 달성! 리워드에서 +${R.play5min} 받기`);
    }
  }, 1000);

  // ---------- 채팅·음성챗 흉내 ----------

  const addBubble = (who, text) => {
    const b = document.createElement('div');
    if (who === '나') {
      b.className = 'bubble me';
      b.textContent = text;
    } else {
      b.className = 'bubble';
      b.innerHTML = `<i style="background:${FRIENDS[who].color}"></i><b>${esc(who)}</b> ${esc(text)}`;
      speak(who);
    }
    log.append(b);
    while (log.children.length > 4) log.firstElementChild.remove();
  };

  let speakTimer;
  const speak = (who) => {
    el.querySelectorAll('[data-av]').forEach((a) => a.classList.toggle('talking', a.dataset.av === who));
    voiceText.textContent = `${who} 말하는 중`;
    clearTimeout(speakTimer);
    speakTimer = setTimeout(() => {
      el.querySelectorAll('[data-av]').forEach((a) => a.classList.remove('talking'));
      voiceText.textContent = '민지, 하준 접속 중';
    }, 2400);
  };

  let line = 0;
  const nextLine = () => {
    const [who, text] = line < SCRIPT.length ? SCRIPT[line] : RANDOM[Math.floor(Math.random() * RANDOM.length)];
    line++;
    addBubble(who, text);
    later(nextLine, line < SCRIPT.length ? 3500 + Math.random() * 2500 : 11000 + Math.random() * 6000);
  };
  later(nextLine, 1800);

  const form = el.querySelector('[data-form]');
  const input = form.querySelector('input');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addBubble('나', text);
    input.value = '';
    const who = Math.random() < 0.5 ? '민지' : '하준';
    later(() => addBubble(who, REPLIES[Math.floor(Math.random() * REPLIES.length)]), 1400);
  });

  el.addEventListener('click', async (e) => {
    const react = e.target.closest('[data-react]');
    if (react) {
      const [text, , color] = REACTIONS[Number(react.dataset.react)];
      const s = document.createElement('div');
      s.className = 'sticker';
      s.textContent = text;
      s.style.background = color;
      s.style.setProperty('--rot', `${(Math.random() * 16 - 8).toFixed(1)}deg`);
      s.style.left = `${15 + Math.random() * 40}%`;
      s.style.top = `${22 + Math.random() * 30}%`;
      stage.append(s);
      later(() => s.remove(), 1500);
      return;
    }
    const toggle = e.target.closest('[data-chat-toggle]');
    if (toggle) {
      log.hidden = !log.hidden;
      toggle.setAttribute('aria-pressed', String(!log.hidden));
      toggle.setAttribute('aria-label', log.hidden ? '채팅 말풍선 펼치기' : '채팅 말풍선 접기');
      toggle.innerHTML = icon(log.hidden ? 'chatOff' : 'chat', 20);
      return;
    }
    const mic = e.target.closest('[data-mic]');
    if (mic) {
      const on = mic.getAttribute('aria-pressed') !== 'true';
      mic.setAttribute('aria-pressed', String(on));
      mic.setAttribute('aria-label', on ? '마이크 끄기' : '마이크 켜기');
      mic.classList.toggle('mic-on', on);
      mic.innerHTML = icon(on ? 'mic' : 'micOff', 20);
      el.querySelector('[data-av="나"]').style.boxShadow = on ? '0 0 0 3px var(--mint)' : '';
      toast(on ? '마이크 켜짐 (연습용이라 실제로 들리진 않아요)' : '마이크 꺼짐', { ms: 1400 });
      return;
    }
    if (e.target.closest('[data-invite]')) {
      const ok = await shareLink(url(`index.html#/game/${g.slug}`), `${g.name} 같이 하자!`);
      if (!ok) return;
      const r = store.completeFriendMission();
      toast(r.ok ? `초대 링크 준비 완료! 친구 미션 +${r.points}` : '초대 링크를 준비했어요');
    }
  });

  if (document.fullscreenElement) screen.orientation?.lock?.('portrait').catch(() => {});

  return () => {
    clearInterval(tick);
    clearTimeout(speakTimer);
    timers.forEach(clearTimeout);
    window.removeEventListener('message', onMessage);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };
}
