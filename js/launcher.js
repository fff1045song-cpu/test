// 게임별 런처 페이지 (g/<게임>/) — 홈 화면 아이콘으로 열면 바로 게임 화면이 뜬다.
// ?install=1 로 열리면 "홈 화면에 추가" 안내를 띄운다.
import * as play from './screens/play.js';
import { getGame } from './data.js';
import { icon, esc, thumb, sheet, toast, isIOS, isStandalone } from './ui.js';

export async function start(slug) {
  const params = new URLSearchParams(location.search);
  const wantInstall = params.has('install') && !isStandalone();
  // 주소에서 ?install=1 을 지워 둔다. 아이폰은 지금 주소 그대로 홈 화면에 추가하기 때문.
  if (params.has('install')) history.replaceState(null, '', location.pathname);

  const game = await getGame(slug);
  const el = document.createElement('div');
  document.getElementById('view').append(el);
  await play.render(el, { slug }, { launcher: true });

  if (wantInstall && game) showInstall(game);
  window.addEventListener('appinstalled', () => toast(`${game.name} 홈 화면에 추가됐어요!`));
}

function showInstall(g) {
  const head = `
    <div class="game-mini" style="margin-bottom:14px">
      ${thumb(g)}
      <div>
        <h2>${esc(g.name)}<br />홈 화면에 추가</h2>
      </div>
    </div>
    <p>앱처럼 아이콘을 눌러 바로 플레이할 수 있어요. 설치 파일은 필요 없어요.</p>`;

  if (isIOS()) {
    sheet(`${head}
      <ol class="steps">
        <li class="step"><span class="step-num">1</span><div>
          <div class="step-title">사파리 아래쪽 <b>공유 버튼</b>을 눌러요</div>
          <div class="mock mock-bar" aria-hidden="true">
            <span>${icon('back', 20)}</span><span>${icon('chevron', 20)}</span>
            <span class="hl">${icon('share', 22)}</span><span>${icon('grid', 20)}</span><span>${icon('dots', 20)}</span>
          </div></div></li>
        <li class="step"><span class="step-num">2</span><div>
          <div class="step-title">목록에서 <b>홈 화면에 추가</b>를 골라요</div>
          <div class="mock mock-menu" aria-hidden="true">
            <div><span>복사</span>${icon('link', 18)}</div>
            <div class="hl"><span>홈 화면에 추가</span>${icon('plusSquare', 18)}</div>
            <div><span>즐겨찾기 추가</span>${icon('sparkle', 18)}</div>
          </div></div></li>
        <li class="step"><span class="step-num">3</span><div>
          <div class="step-title">오른쪽 위 <b>추가</b>를 누르면 끝!</div>
          <div class="mock" aria-hidden="true" style="display:flex;align-items:center;gap:10px">
            ${thumb(g)}<b style="flex:1">${esc(g.name)}</b><b style="color:#3478F6">추가</b>
          </div></div></li>
      </ol>
      <button class="btn btn-theme btn-lg btn-block" type="button" data-close>알겠어요, 플레이할게요</button>`);
    return;
  }

  const s = sheet(`${head}
    <button class="btn btn-yellow btn-lg btn-block" type="button" data-install disabled>${icon('addHome', 20)}<span>설치 준비 중…</span></button>
    <p style="margin-top:12px" data-help>버튼이 켜지지 않으면 브라우저 메뉴(${icon('dots', 16, 'style="display:inline;vertical-align:-3px"')})에서 <b>홈 화면에 추가</b> 또는 <b>앱 설치</b>를 눌러 주세요.</p>
    <button class="btn btn-lg btn-block" type="button" data-close>그냥 플레이할게요</button>`);

  const btn = s.el.querySelector('[data-install]');
  const enable = () => {
    btn.disabled = false;
    btn.querySelector('span').textContent = '홈 화면에 설치하기';
  };
  if (window.__installPrompt) enable();
  window.addEventListener('install-ready', enable, { once: true });

  btn.addEventListener('click', async () => {
    const prompt = window.__installPrompt;
    if (!prompt) return;
    prompt.prompt();
    const choice = await prompt.userChoice.catch(() => null);
    window.__installPrompt = null;
    s.close();
    if (choice && choice.outcome === 'accepted') toast('설치 중이에요. 홈 화면을 확인해 보세요!');
  });
}

