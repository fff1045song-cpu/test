/*
 * 놀이터 게임 SDK (playground-sdk.js)
 *
 * 게임은 <iframe sandbox="allow-scripts"> 안에서 돌아간다.
 * 그래서 플랫폼의 저장소(localStorage)를 직접 만질 수 없고,
 * 이 SDK가 postMessage 로 플랫폼에 부탁하는 방식으로만 대화한다.
 *
 * 게임에서 쓰는 함수:
 *   PG.ready()          로딩 끝
 *   PG.gameStart()      플레이 시작 (플레이 시간 측정 시작)
 *   PG.score(n)         현재 점수 (화면 표시용)
 *   PG.gameOver(score)  한 판 끝
 *   PG.save(data)       이어하기 저장 (플랫폼이 대신 저장)
 *   PG.load()           Promise 로 저장 데이터 받기 (없으면 null)
 *
 * 플랫폼 밖에서 게임 파일만 열어도 동작하도록, 부모 창이 없으면 아무것도 하지 않는다.
 */
(function () {
  'use strict';

  var NS = 'noriteo-pg';
  var VERSION = 1;
  var embedded = window.parent && window.parent !== window;
  var pending = {};
  var nextId = 1;

  function send(type, payload, id) {
    if (!embedded) return;
    // 샌드박스 iframe 은 출처(origin)가 'null' 이라 대상 출처를 지정할 수 없다.
    // 대신 플랫폼 쪽에서 보낸 창(event.source)과 메시지 형식을 꼼꼼히 확인한다.
    window.parent.postMessage({ ns: NS, v: VERSION, type: type, payload: payload, id: id }, '*');
  }

  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    var d = e.data;
    if (!d || d.ns !== NS || d.v !== VERSION) return;
    if (d.type === 'loadResult' && pending[d.id]) {
      pending[d.id](d.payload === undefined ? null : d.payload);
      delete pending[d.id];
    }
  });

  window.PG = {
    embedded: embedded,
    ready: function () {
      send('ready');
    },
    gameStart: function () {
      send('gameStart');
    },
    score: function (n) {
      n = Number(n);
      if (isFinite(n)) send('score', Math.floor(n));
    },
    gameOver: function (score) {
      score = Number(score);
      send('gameOver', isFinite(score) ? Math.floor(score) : 0);
    },
    save: function (data) {
      // JSON 으로 바꿀 수 있는 값만 저장할 수 있다.
      var json;
      try {
        json = JSON.stringify(data === undefined ? null : data);
      } catch (err) {
        console.warn('[PG] 저장할 수 없는 데이터예요', err);
        return;
      }
      send('save', JSON.parse(json));
    },
    load: function () {
      if (!embedded) return Promise.resolve(null);
      return new Promise(function (resolve) {
        var id = nextId++;
        pending[id] = resolve;
        send('load', null, id);
        // 플랫폼이 답하지 않아도 게임이 멈추지 않게
        setTimeout(function () {
          if (pending[id]) {
            pending[id](null);
            delete pending[id];
          }
        }, 1500);
      });
    },
  };
})();
