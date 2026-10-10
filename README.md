# 놀이터 — 모바일 HTML5 게임 플랫폼 (연습용)

"앱스토어처럼 고르고, 모바일 게임처럼 플레이하는" HTML5 게임 놀이터의 연습용 버전입니다.
빌드 도구 없이 순수 HTML·CSS·JavaScript로 만들었고, GitHub Pages에 그대로 올리면 동작합니다.

## 바로 보기

GitHub Pages를 켜면 이 주소로 열립니다: `https://fff1045song-cpu.github.io/test/`

### GitHub Pages 켜는 법 (처음 한 번만)

1. 저장소 페이지 → **Settings** → 왼쪽 메뉴 **Pages**
2. **Source**: `Deploy from a branch`
3. **Branch**: 이 사이트가 들어 있는 브랜치(예: `main`)와 `/ (root)` 선택 → **Save**
4. 1~3분 뒤 위 주소로 접속

## 내 컴퓨터에서 확인하기

파일을 더블클릭해서 열면 ES 모듈이 동작하지 않으니, 폴더에서 간단한 서버를 켜고 엽니다.

```bash
python3 -m http.server 8000
# 또는
npx serve .
```

브라우저에서 `http://localhost:8000` 을 열고, 개발자 도구에서 폰 크기(390×844)로 보면 됩니다.

## 들어 있는 것

| 화면 | 주소 | 내용 |
| --- | --- | --- |
| 홈 | `#/` | 포인트·연속 출석, 오늘의 게임, 카테고리, 내 취향 저격, 실시간 랭킹 |
| 게임 상세 | `#/game/<게임>` | 추천률 스티커, 바로 플레이, 홈에 추가, BEST 리뷰, 리뷰 목록 |
| 플레이 | `#/play/<게임>` | 풀스크린 게임, 음성챗·채팅 흉내, 빠른 리액션, 친구 초대 |
| 리뷰 쓰기 | `#/review/<게임>` | 3분 이상 플레이해야 작성, 추천/비추천 + 본문 |
| 리워드 | `#/rewards` | 포인트, 7일 출석판·보물상자, 오늘의 미션, 이번 주 베스트 리뷰 |
| 내 게임 | `#/my` | 최근 플레이, 플레이 시간, 내가 쓴 리뷰, 연습용 테스트 도구 |

샘플 게임: **블록 러시**, **무한 점프**, **달빛 짝맞추기**(이어하기 지원)

포인트는 출석·플레이 시간·리뷰·친구 초대 같은 참여 활동에만 주고, 게임 점수·승패와는 연결하지 않습니다.

## 폴더 구조

```
index.html               앱 셸
manifest.webmanifest     플랫폼 PWA 정보
css/app.css              "캔디 아케이드" 디자인
js/app.js                화면 전환(해시 라우터), 하단 탭
js/store.js              저장(localStorage) — 나중에 Supabase로 바꿀 곳
js/data.js               게임·리뷰 데이터, 추천률 계산
js/recommend.js          취향 추천
js/screens/              화면별 코드
js/launcher.js           게임별 홈 화면 앱(런처) 페이지
data/                    games.json, seed-reviews.json
sdk/playground-sdk.js    게임 ↔ 플랫폼 대화용 SDK
games/                   샘플 게임 3개
g/<게임>/                게임별 홈 화면 아이콘용 런처 + 매니페스트
assets/icons/            앱 아이콘 PNG
tools/make-icons.mjs     아이콘 PNG 다시 만들기 (Playwright 필요)
```

## 새 게임 붙이기 (SDK)

게임은 `<iframe sandbox="allow-scripts">` 안에서 돌고, SDK로만 플랫폼과 대화합니다.

```html
<script src="../../sdk/playground-sdk.js"></script>
<script>
  PG.ready();            // 로딩 끝
  PG.gameStart();        // 플레이 시작 (플레이 시간 측정 시작)
  PG.score(120);         // 현재 점수 (화면 표시용)
  PG.gameOver(120);      // 한 판 끝
  PG.save({ stage: 3 }); // 이어하기 저장
  PG.load().then((data) => { /* 저장 데이터 또는 null */ });
</script>
```

그다음 `data/games.json` 에 게임 정보를 추가하고, 홈 화면 아이콘이 필요하면 `g/<게임>/` 폴더를 기존 게임처럼 만들면 됩니다.

작업 지시서는 [`CLAUDE.md`](CLAUDE.md)에 있습니다.
