// 준비 중 화면 (#/friends)
import { art } from '../art.js';

export function render(el) {
  el.innerHTML = `
    <header class="hdr"><h1 class="hdr-title">친구</h1></header>
    <div class="soon-screen">
      <div>
        <div class="thumb">${art('candy-battle')}</div>
        <h2>친구 탭은 준비 중이에요</h2>
        <p>친구 목록, 같이 하기 방, 친구 랭킹이 여기에 들어와요.<br />지금은 게임 화면에서 채팅·음성챗 흉내를 볼 수 있어요.</p>
        <a class="btn btn-theme" href="#/">홈으로</a>
      </div>
    </div>`;
}
