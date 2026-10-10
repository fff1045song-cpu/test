// 놀이터의 모든 저장은 이 파일 한 곳에서만 한다.
// 지금은 localStorage, 나중에 Supabase로 바꿀 때 이 파일만 고치면 된다.

const KEY = 'noriteo.v1';

export const RULES = {
  checkIn: 10,
  chest: 100,
  chestEvery: 7,
  play5min: 20,
  play5minSec: 300,
  review: 50,
  reviewMinSec: 180,
  friend: 30,
};

function emptyState() {
  return {
    points: 0,
    attendance: { last: null, streak: 0, chestPending: false },
    playtime: { total: {}, daily: {}, last: {} },
    reviews: [],
    helpful: [],
    missions: {},
    saves: {},
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const base = emptyState();
    const data = JSON.parse(raw);
    return {
      ...base,
      ...data,
      attendance: { ...base.attendance, ...data.attendance },
      playtime: { ...base.playtime, ...data.playtime },
    };
  } catch {
    return emptyState();
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 저장 공간이 막혀 있어도(사생활 보호 모드 등) 화면은 계속 동작한다.
  }
  window.dispatchEvent(new CustomEvent('store:change'));
}

// 다른 탭(예: 홈 화면에 추가한 게임 런처)에서 바뀐 내용도 반영
window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = load();
    window.dispatchEvent(new CustomEvent('store:change'));
  }
});

// ---- 날짜 ----

export function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function todayMissions() {
  const key = today();
  if (!state.missions[key]) {
    state.missions[key] = { play: [], friend: false };
    // 2주 넘은 미션 기록은 정리
    const cutoff = today(-14);
    for (const k of Object.keys(state.missions)) if (k < cutoff) delete state.missions[k];
    for (const k of Object.keys(state.playtime.daily)) if (k < cutoff) delete state.playtime.daily[k];
  }
  return state.missions[key];
}

// ---- 포인트 ----

export function getPoints() {
  return state.points;
}

function addPoints(n) {
  state.points += n;
}

// ---- 출석 ----

export function getAttendance() {
  const a = state.attendance;
  const checkedToday = a.last === today();
  // 어제도 오늘도 출석하지 않았다면 연속 기록은 끊긴 것으로 보여준다.
  const alive = checkedToday || a.last === today(-1);
  return {
    streak: alive ? a.streak : 0,
    checkedToday,
    chestPending: a.chestPending,
  };
}

export function checkIn() {
  const a = state.attendance;
  if (a.last === today()) return { ok: false };
  a.streak = a.last === today(-1) ? a.streak + 1 : 1;
  a.last = today();
  addPoints(RULES.checkIn);
  const chest = a.streak % RULES.chestEvery === 0;
  if (chest) a.chestPending = true;
  persist();
  return { ok: true, points: RULES.checkIn, streak: a.streak, chest };
}

export function openChest() {
  if (!state.attendance.chestPending) return { ok: false };
  state.attendance.chestPending = false;
  addPoints(RULES.chest);
  persist();
  return { ok: true, points: RULES.chest };
}

// ---- 플레이 시간 ----

export function addPlaytime(slug, sec) {
  const p = state.playtime;
  const d = today();
  p.total[slug] = (p.total[slug] || 0) + sec;
  p.daily[d] = p.daily[d] || {};
  p.daily[d][slug] = (p.daily[d][slug] || 0) + sec;
  p.last[slug] = Date.now();
  todayMissions();
  persist();
}

export function markPlayed(slug) {
  state.playtime.last[slug] = Date.now();
  persist();
}

export function getPlaytime(slug) {
  return state.playtime.total[slug] || 0;
}

export function getTodayPlaytime(slug) {
  return (state.playtime.daily[today()] || {})[slug] || 0;
}

export function getAllPlaytime() {
  return { ...state.playtime.total };
}

export function getTodayTotal() {
  return Object.values(state.playtime.daily[today()] || {}).reduce((a, b) => a + b, 0);
}

export function getRecentPlays() {
  return Object.entries(state.playtime.last)
    .sort((a, b) => b[1] - a[1])
    .map(([slug, at]) => ({ slug, at, total: getPlaytime(slug) }));
}

// ---- 미션 ----

export function getPlayMission() {
  const m = state.missions[today()] || { play: [] };
  const daily = state.playtime.daily[today()] || {};
  const ready = Object.entries(daily)
    .filter(([slug, sec]) => sec >= RULES.play5minSec && !m.play.includes(slug))
    .map(([slug]) => slug);
  // 진행 막대는 아직 안 받은 게임 중 가장 많이 한 게임 기준
  const best = Object.entries(daily)
    .filter(([slug]) => !m.play.includes(slug))
    .sort((a, b) => b[1] - a[1])[0];
  return {
    ready,
    claimed: [...m.play],
    progressSlug: best ? best[0] : null,
    progress: best ? Math.min(1, best[1] / RULES.play5minSec) : 0,
    progressSec: best ? best[1] : 0,
  };
}

export function claimPlayMission() {
  const { ready } = getPlayMission();
  if (!ready.length) return { ok: false };
  const m = todayMissions();
  m.play.push(...ready);
  const points = ready.length * RULES.play5min;
  addPoints(points);
  persist();
  return { ok: true, points, slugs: ready };
}

export function isFriendMissionDone() {
  return !!(state.missions[today()] || {}).friend;
}

export function completeFriendMission() {
  const m = todayMissions();
  if (m.friend) return { ok: false };
  m.friend = true;
  addPoints(RULES.friend);
  persist();
  return { ok: true, points: RULES.friend };
}

export function hasClaimable() {
  const a = getAttendance();
  return !a.checkedToday || a.chestPending || getPlayMission().ready.length > 0;
}

// ---- 리뷰 ----

export function getMyReviews() {
  return [...state.reviews];
}

export function getMyReview(slug) {
  return state.reviews.find((r) => r.game === slug) || null;
}

export function canReview(slug) {
  if (getMyReview(slug)) return { ok: false, reason: 'done' };
  const sec = getPlaytime(slug);
  if (sec < RULES.reviewMinSec) return { ok: false, reason: 'playtime', sec };
  return { ok: true, sec };
}

export function addReview(slug, recommend, text) {
  const check = canReview(slug);
  if (!check.ok) return check;
  const review = {
    id: `m-${slug}`,
    game: slug,
    user: '나',
    mine: true,
    recommend: !!recommend,
    text: String(text).slice(0, 500),
    playtimeMin: Math.floor(getPlaytime(slug) / 60),
    date: today(),
    helpful: 0,
  };
  state.reviews.push(review);
  addPoints(RULES.review);
  persist();
  return { ok: true, points: RULES.review, review };
}

export function isHelpful(id) {
  return state.helpful.includes(id);
}

export function toggleHelpful(id) {
  const i = state.helpful.indexOf(id);
  if (i >= 0) state.helpful.splice(i, 1);
  else state.helpful.push(id);
  persist();
  return i < 0;
}

// ---- 이어하기 (게임이 SDK로 저장) ----

const SAVE_LIMIT = 50_000; // 글자 수

export function saveGame(slug, data) {
  if (data === null || data === undefined) {
    delete state.saves[slug];
    persist();
    return true;
  }
  let json;
  try {
    json = JSON.stringify(data);
  } catch {
    return false;
  }
  if (!json || json.length > SAVE_LIMIT) return false;
  state.saves[slug] = JSON.parse(json);
  persist();
  return true;
}

export function loadGame(slug) {
  return state.saves[slug] ?? null;
}

// ---- 연습용 도구 ----

export function devAddPlaytime(slugs, sec) {
  for (const s of slugs) addPlaytime(s, sec);
}

export function devYesterdayCheckIn() {
  // 오늘 출석을 어제 출석으로 바꿔서 연속 출석을 시험해 볼 수 있게 한다.
  const a = state.attendance;
  if (a.last === today()) a.last = today(-1);
  persist();
}

export function resetAll() {
  state = emptyState();
  persist();
}
