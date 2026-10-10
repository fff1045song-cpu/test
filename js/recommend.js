// 취향 추천: 간단한 태그 점수 방식
// 1) 내가 플레이한 게임의 태그(+장르)에 플레이 시간만큼 가중치
// 2) 아직 안 해본 게임을 태그 점수 합으로 정렬
// 3) 기록이 없으면 추천률 높은 순
import { rateFor } from './data.js';

const traits = (g) => [...g.tags, g.genre];

export function recommend(games, seed, playtime) {
  const played = games.filter((g) => (playtime[g.slug] || 0) > 0);
  const withRate = (g) => ({ game: g, rate: rateFor(g, seed).rate });

  if (!played.length) {
    const list = games.map(withRate).sort((a, b) => b.rate - a.rate);
    return { list, reason: '추천률이 높은 게임부터 골랐어요' };
  }

  const weight = {};
  for (const g of played) {
    for (const t of traits(g)) weight[t] = (weight[t] || 0) + playtime[g.slug];
  }

  const list = games
    .filter((g) => !playtime[g.slug])
    .map((g) => ({ ...withRate(g), score: traits(g).reduce((s, t) => s + (weight[t] || 0), 0) }))
    .sort((a, b) => b.score - a.score || b.rate - a.rate);

  const fav = played.sort((a, b) => playtime[b.slug] - playtime[a.slug])[0];
  return { list, reason: `${fav.name}${hasBatchim(fav.name) ? '을' : '를'} 좋아하셨죠?`, fav };
}

// 받침 유무로 을/를 고르기
function hasBatchim(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}
