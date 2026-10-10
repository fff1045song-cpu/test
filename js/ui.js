// 여러 화면이 같이 쓰는 작은 도구들: 토스트, 안내 창, 글자 처리, 시간 표시
import { icon } from './icons.js';
import { art } from './art.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export const fmt = (n) => Number(n).toLocaleString('ko-KR');

export function fmtTime(sec) {
  sec = Math.floor(sec);
  if (sec < 60) return `${sec}초`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}분${sec % 60 ? ` ${sec % 60}초` : ''}`;
  const h = Math.floor(m / 60);
  return `${h}시간${m % 60 ? ` ${m % 60}분` : ''}`;
}

export function fmtMinutes(min) {
  if (min < 60) return `${min}분`;
  return `${Math.floor(min / 60)}시간`;
}

export function fmtAgo(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export function thumb(game, cls = '') {
  return `<div class="thumb ${cls}" style="background-color:${game.color}">${art(game.slug)}</div>`;
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

// ---- 토스트 ----

let toastBox;

export function toast(text, { kind = '', action = null, ms = 2400 } = {}) {
  if (!toastBox) {
    toastBox = document.createElement('div');
    toastBox.className = 'toasts';
    toastBox.setAttribute('role', 'status');
    toastBox.setAttribute('aria-live', 'polite');
    document.body.append(toastBox);
  }
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<span>${esc(text)}</span>${action ? `<a href="${esc(action.href)}">${esc(action.label)}</a>` : ''}`;
  toastBox.append(el);
  while (toastBox.children.length > 2) toastBox.firstElementChild.remove();
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 260);
  }, action ? ms + 1500 : ms);
  return el;
}

export function pointsToast(points, label) {
  return toast(`+${points} 포인트! ${label || ''}`.trim(), { kind: 'points' });
}

// ---- 바텀 시트 안내 창 ----

export function sheet(html, { onClose } = {}) {
  const back = document.createElement('div');
  back.className = 'sheet-back';
  back.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  const prevFocus = document.activeElement;
  const close = () => {
    back.remove();
    document.removeEventListener('keydown', onKey);
    prevFocus?.focus?.();
    onClose?.();
  };
  const onKey = (e) => e.key === 'Escape' && close();
  back.addEventListener('click', (e) => {
    if (e.target === back || e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);
  document.body.append(back);
  back.querySelector('button, a')?.focus();
  return { el: back, close };
}

// ---- 공유 / 링크 복사 ----

export async function shareLink(link, title) {
  try {
    if (navigator.share) {
      await navigator.share({ title, url: link });
      return true;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return false;
  }
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch {
    // 클립보드가 막힌 브라우저: 임시 입력칸으로 복사
    const ta = document.createElement('textarea');
    ta.value = link;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

// ---- 숫자 올라가는 애니메이션 ----

export function countUp(el, from, to, ms = 900) {
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = fmt(Math.round(from + (to - from) * eased));
    if (t < 1 && el.isConnected) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---- 기기 ----

export const isIOS = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches ||
  matchMedia('(display-mode: fullscreen)').matches ||
  navigator.standalone === true;

export { icon };
