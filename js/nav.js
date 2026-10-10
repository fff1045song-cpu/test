// 앱 안에서 지나온 화면 기록 (뒤로 버튼이 앱 밖으로 나가지 않게)
const visited = [];

export function noteVisit(hash) {
  if (visited.length > 1 && visited[visited.length - 2] === hash) visited.pop();
  else if (visited[visited.length - 1] !== hash) visited.push(hash);
}

// 뒤로 가기: 앱 안에서 온 곳이 있으면 그곳으로, 없으면 fallback
export function goBack(fallback = '#/') {
  if (visited.length > 1) history.back();
  else location.replace(fallback);
}

// 바로 전 화면이 hash 라면 뒤로, 아니면 hash 로 바꿔치기
export function backTo(hash) {
  if (visited.length > 1 && visited[visited.length - 2] === hash) history.back();
  else location.replace(hash);
}
