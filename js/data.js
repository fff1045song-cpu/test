// games.json, seed-reviews.json 불러오기 + 리뷰/추천률 계산
import * as store from './store.js';

// 이 파일(js/data.js) 기준으로 사이트 최상위 폴더를 찾는다.
// 그래서 g/<게임>/ 런처 페이지에서 불러도 경로가 깨지지 않는다.
export const ROOT = new URL('../', import.meta.url);
export const url = (path) => new URL(path, ROOT).href;

let gamesPromise;
let seedPromise;

export function loadGames() {
  gamesPromise ??= fetch(url('data/games.json')).then((r) => r.json());
  return gamesPromise;
}

function loadSeed() {
  seedPromise ??= fetch(url('data/seed-reviews.json')).then((r) => r.json());
  return seedPromise;
}

export async function loadAll() {
  const [games, seed] = await Promise.all([loadGames(), loadSeed()]);
  return { games, seed };
}

export async function getGame(slug) {
  const games = await loadGames();
  return games.find((g) => g.slug === slug) || null;
}

// 예시 리뷰 + 내 리뷰를 합치고 '도움돼요' 수를 반영한다.
export function reviewsFor(slug, seed) {
  const list = [...seed.filter((r) => r.game === slug)];
  const mine = store.getMyReview(slug);
  if (mine) list.unshift(mine);
  return list.map((r) => ({
    ...r,
    helpfulCount: r.helpful + (store.isHelpful(r.id) ? 1 : 0),
  }));
}

export function bestReview(reviews) {
  return reviews.reduce((best, r) => (!best || r.helpfulCount > best.helpfulCount ? r : best), null);
}

// 추천률 = 추천 리뷰 수 / 전체 리뷰 수
export function rateFor(game, seed) {
  const reviews = reviewsFor(game.slug, seed);
  const base = game.reviewBase || { up: 0, down: 0 };
  const up = base.up + reviews.filter((r) => r.recommend).length;
  const total = base.up + base.down + reviews.length;
  const rate = total ? Math.round((up / total) * 100) : 0;
  return { up, down: total - up, total, rate, label: rateLabel(rate, total) };
}

export function rateLabel(rate, total = 1) {
  if (!total) return '리뷰 없음';
  if (rate >= 85) return '매우 긍정적';
  if (rate >= 70) return '긍정적';
  if (rate >= 40) return '복합적';
  return '부정적';
}
