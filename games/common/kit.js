/*
 * 샘플 게임 3개가 같이 쓰는 작은 도구 (canvas, 터치, 캔디 아케이드 색)
 * 일반 script 로 불러온다 (sandbox iframe 에서도 문제없이 동작하도록 ES 모듈을 쓰지 않음).
 */
(function () {
  'use strict';

  var C = {
    ink: '#1A1033', bg: '#1A1033', theme: '#6C4CF5', yellow: '#FFD23F', pink: '#FF5DA2',
    mint: '#2EE6A6', sky: '#4CC9F0', orange: '#FF8C42', lilac: '#B9A3FF', white: '#FFFFFF',
    muted: '#5A4F7A',
  };
  var FONT = "'Jua', 'Noto Sans KR', sans-serif";

  function setup(canvas) {
    var ctx = canvas.getContext('2d');
    var view = { ctx: ctx, w: 0, h: 0, dpr: 1 };
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var w = canvas.clientWidth || window.innerWidth;
      var h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      view.w = w;
      view.h = h;
      view.dpr = dpr;
      if (view.onResize) view.onResize(w, h);
    }
    window.addEventListener('resize', resize);
    resize();
    return view;
  }

  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 눌리는 그림자가 있는 스티커 상자
  function box(ctx, x, y, w, h, r, fill, opt) {
    opt = opt || {};
    var line = opt.line == null ? 3 : opt.line;
    var shadow = opt.shadow == null ? 4 : opt.shadow;
    if (shadow) {
      rr(ctx, x, y + shadow, w, h, r);
      ctx.fillStyle = opt.shadowColor || C.ink;
      ctx.fill();
    }
    rr(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (line) {
      ctx.lineWidth = line;
      ctx.strokeStyle = opt.lineColor || C.ink;
      ctx.stroke();
    }
  }

  function text(ctx, str, x, y, opt) {
    opt = opt || {};
    ctx.font = (opt.size || 24) + 'px ' + FONT;
    ctx.textAlign = opt.align || 'center';
    ctx.textBaseline = opt.baseline || 'middle';
    if (opt.stroke) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = opt.strokeWidth || 6;
      ctx.strokeStyle = opt.stroke;
      ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = opt.color || C.white;
    ctx.fillText(str, x, y);
  }

  function dots(ctx, w, h, offsetY, color) {
    var gap = 18;
    var oy = ((offsetY || 0) % gap + gap) % gap;
    ctx.fillStyle = color || 'rgba(185,163,255,0.14)';
    for (var y = -gap + oy; y < h + gap; y += gap) {
      for (var x = 9; x < w; x += gap) {
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 터치·마우스 모두 pointerdown 하나로 처리
  function onTap(canvas, fn) {
    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      fn(e.clientX - rect.left, e.clientY - rect.top, e);
    });
    canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    });
  }

  function loop(fn) {
    var last = performance.now();
    function frame(now) {
      // 다음 프레임을 먼저 예약해서, 한 프레임에서 오류가 나도 게임이 멈추지 않게
      requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      fn(dt, now);
    }
    requestAnimationFrame(frame);
  }

  // 플랫폼 밖에서 단독으로 열었을 때만 점수를 직접 그린다 (안에서는 플랫폼이 표시)
  function standaloneScore(ctx, w, score) {
    if (window.PG && PG.embedded) return;
    text(ctx, String(score), w / 2, 46, { size: 40, color: C.yellow, stroke: C.ink });
  }

  var fontReady = new Promise(function (resolve) {
    if (!document.fonts || !document.fonts.load) return resolve();
    document.fonts.load('24px Jua').then(resolve, resolve);
    setTimeout(resolve, 1200);
  });

  // 게임 위쪽은 플랫폼 점수 표시가 덮으므로 비워 둔다
  var TOP_SAFE = 96;

  window.Kit = {
    C: C, FONT: FONT, setup: setup, rr: rr, box: box, text: text, dots: dots, onTap: onTap,
    loop: loop, standaloneScore: standaloneScore, fontReady: fontReady, TOP_SAFE: TOP_SAFE,
  };
})();
