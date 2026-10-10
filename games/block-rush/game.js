/*
 * 블록 러시: 좌우로 움직이는 블록을 탭해서 떨어뜨려 탑을 쌓는다.
 * 어긋난 부분은 잘려 나가고, 딱 맞추면 콤보.
 */
(function () {
  'use strict';
  var K = window.Kit;
  var C = K.C;
  var canvas = document.getElementById('c');
  var view = K.setup(canvas);
  var ctx = view.ctx;

  var COLORS = [C.pink, C.sky, C.mint, C.yellow, C.theme, C.orange, C.lilac];
  var BH = 30; // 블록 높이
  var PERFECT = 5; // 이 픽셀 안이면 퍼펙트

  var state = 'title';
  var stack = [], mover = null, debris = [], popups = [];
  var score = 0, combo = 0, best = 0, camY = 0, camTarget = 0, overAt = 0, flash = 0;

  function baseWidth() {
    return Math.min(view.w * 0.62, 250);
  }

  function baseY() {
    return view.h - 70;
  }

  function reset() {
    var bw = baseWidth();
    stack = [{ x: (view.w - bw) / 2, w: bw, color: C.white }];
    debris = [];
    popups = [];
    score = 0;
    combo = 0;
    camY = 0;
    camTarget = 0;
    flash = 0;
    spawn();
  }

  function spawn() {
    var top = stack[stack.length - 1];
    var level = stack.length;
    var fromLeft = level % 2 === 1;
    mover = {
      x: fromLeft ? -top.w * 0.2 : view.w - top.w * 0.8,
      w: top.w,
      dir: fromLeft ? 1 : -1,
      speed: Math.min(150 + level * 7, 430),
      color: COLORS[level % COLORS.length],
    };
  }

  function levelY(i) {
    return baseY() - i * BH;
  }

  function drop() {
    var top = stack[stack.length - 1];
    var left = Math.max(mover.x, top.x);
    var right = Math.min(mover.x + mover.w, top.x + top.w);
    var overlap = right - left;
    var y = levelY(stack.length);

    if (overlap <= 0) {
      debris.push({ x: mover.x, y: y, w: mover.w, color: mover.color, vy: 0, vx: mover.dir * 60, rot: 0, vr: mover.dir * 3 });
      mover = null;
      gameOver();
      return;
    }

    if (Math.abs(mover.x - top.x) <= PERFECT) {
      combo++;
      var grow = combo >= 3 ? Math.min(8, baseWidth() - top.w) : 0;
      stack.push({ x: top.x - grow / 2, w: top.w + grow, color: mover.color });
      score += 10 + combo * 5;
      flash = 1;
      popups.push({ text: combo > 1 ? combo + ' 콤보!' : 'PERFECT', y: y, t: 0, big: combo > 1 });
    } else {
      combo = 0;
      stack.push({ x: left, w: overlap, color: mover.color });
      // 잘려 나간 조각
      var cutX = mover.x < top.x ? mover.x : right;
      var cutW = mover.w - overlap;
      debris.push({ x: cutX, y: y, w: cutW, color: mover.color, vy: 0, vx: (mover.x < top.x ? -1 : 1) * 40, rot: 0, vr: (mover.x < top.x ? -1 : 1) * 2.5 });
      score += 10;
    }
    if (navigator.vibrate) navigator.vibrate(combo > 0 ? [10, 30, 10] : 8);
    PG.score(score);
    camTarget = Math.max(0, stack.length * BH - view.h * 0.42);
    spawn();
  }

  function gameOver() {
    state = 'over';
    overAt = performance.now();
    best = Math.max(best || 0, score);
    PG.gameOver(score);
    if (navigator.vibrate) navigator.vibrate(60);
  }

  K.onTap(canvas, function () {
    if (state === 'title') {
      reset();
      state = 'play';
      PG.gameStart();
      PG.score(0);
    } else if (state === 'play') {
      if (mover) drop();
    } else if (state === 'over' && performance.now() - overAt > 600) {
      reset();
      state = 'play';
      PG.gameStart();
      PG.score(0);
    }
  });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'Enter') canvas.dispatchEvent(new PointerEvent('pointerdown'));
  });

  function update(dt) {
    if (state === 'play' && mover) {
      mover.x += mover.dir * mover.speed * dt;
      var minX = -mover.w * 0.35;
      var maxX = view.w - mover.w * 0.65;
      if (mover.x < minX) { mover.x = minX; mover.dir = 1; }
      if (mover.x > maxX) { mover.x = maxX; mover.dir = -1; }
    }
    camY += (camTarget - camY) * Math.min(1, dt * 6);
    for (var i = debris.length - 1; i >= 0; i--) {
      var d = debris[i];
      d.vy += 1400 * dt;
      d.y += d.vy * dt;
      d.x += d.vx * dt;
      d.rot += d.vr * dt;
      if (d.y + camY > view.h + 200) debris.splice(i, 1);
    }
    for (var j = popups.length - 1; j >= 0; j--) {
      popups[j].t += dt;
      if (popups[j].t > 1) popups.splice(j, 1);
    }
    flash = Math.max(0, flash - dt * 3);
  }

  function block(x, y, w, color) {
    K.box(ctx, x, y, w, BH - 2, 6, color, { line: 3, shadow: 0 });
    // 반짝이 줄
    if (w > 16) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      K.rr(ctx, x + 6, y + 5, Math.max(4, w - 12) * 0.35, 4, 2);
      ctx.fill();
    }
  }

  function draw() {
    var w = view.w, h = view.h;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    K.dots(ctx, w, h, camY * 0.5);

    if (state === 'title') return drawTitle();

    ctx.save();
    ctx.translate(0, camY);
    // 바닥
    ctx.fillStyle = C.theme;
    ctx.fillRect(-10, baseY() + BH - 2, w + 20, 400);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, baseY() + BH - 2);
    ctx.lineTo(w + 10, baseY() + BH - 2);
    ctx.stroke();

    for (var i = 0; i < stack.length; i++) {
      var s = stack[i];
      block(s.x, levelY(i), s.w, s.color);
    }
    if (flash > 0) {
      var top = stack[stack.length - 1];
      ctx.strokeStyle = 'rgba(255,210,63,' + flash + ')';
      ctx.lineWidth = 4;
      K.rr(ctx, top.x - 6 * (1 - flash) - 3, levelY(stack.length - 1) - 6 * (1 - flash) - 3, top.w + 12 * (1 - flash) + 6, BH + 12 * (1 - flash) + 4, 9);
      ctx.stroke();
    }
    if (mover) {
      var my = levelY(stack.length);
      // 떨어질 자리 안내선
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mover.x + 6, my + BH);
      ctx.lineTo(mover.x + 6, my + BH + 14);
      ctx.moveTo(mover.x + mover.w - 6, my + BH);
      ctx.lineTo(mover.x + mover.w - 6, my + BH + 14);
      ctx.stroke();
      ctx.setLineDash([]);
      block(mover.x, my, mover.w, mover.color);
    }
    for (var d = 0; d < debris.length; d++) {
      var p = debris[d];
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + BH / 2);
      ctx.rotate(p.rot);
      block(-p.w / 2, -BH / 2, p.w, p.color);
      ctx.restore();
    }
    for (var k = 0; k < popups.length; k++) {
      var pp = popups[k];
      var a = 1 - pp.t;
      ctx.globalAlpha = Math.max(0, a);
      ctx.save();
      ctx.translate(w / 2, pp.y - 26 - pp.t * 30);
      ctx.rotate(-0.06);
      var label = pp.text;
      ctx.font = (pp.big ? 22 : 18) + 'px ' + K.FONT;
      var tw = ctx.measureText(label).width + 24;
      K.box(ctx, -tw / 2, -17, tw, 34, 10, pp.big ? C.mint : C.yellow, { line: 3, shadow: 3 });
      K.text(ctx, label, 0, 1, { size: pp.big ? 22 : 18, color: C.ink });
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    K.standaloneScore(ctx, w, score);
    if (state === 'over') drawOver();
  }

  function drawTitle() {
    var w = view.w, h = view.h;
    var t = performance.now() / 1000;
    var cy = h * 0.42;
    var cols = [C.pink, C.sky, C.mint];
    for (var i = 0; i < 3; i++) block(w / 2 - 75 + i * 50, cy + 40, 50, cols[i]);
    block(w / 2 - 25, cy + 10, 50, C.theme);
    ctx.save();
    ctx.translate(w / 2 + 20, cy - 34 + Math.sin(t * 3) * 6);
    ctx.rotate(0.25);
    block(-25, -15, 50, C.orange);
    ctx.restore();
    K.text(ctx, '블록 러시', w / 2, cy - 100, { size: 46, color: C.yellow, stroke: C.ink, strokeWidth: 10 });
    K.text(ctx, '블록이 겹칠 때 탭!', w / 2, cy - 58, { size: 18, color: C.lilac });
    ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.4;
    K.text(ctx, '탭해서 시작', w / 2, cy + 120, { size: 26, color: C.white, stroke: C.ink });
    ctx.globalAlpha = 1;
  }

  function drawOver() {
    var w = view.w, h = view.h;
    ctx.fillStyle = 'rgba(26,16,51,0.6)';
    ctx.fillRect(0, 0, w, h);
    var bw = Math.min(280, w - 48), bh = 190;
    var y = h * 0.36 - bh / 2;
    ctx.save();
    ctx.translate(w / 2, y + bh / 2);
    ctx.rotate(-0.03);
    K.box(ctx, -bw / 2, -bh / 2, bw, bh, 22, C.white, { line: 3, shadow: 6 });
    K.text(ctx, '탑이 무너졌어요!', 0, -bh / 2 + 36, { size: 24, color: C.ink });
    K.text(ctx, String(score), 0, -8, { size: 54, color: C.theme });
    K.text(ctx, '블록 ' + (stack.length - 1) + '개 · 최고 ' + best, 0, 36, { size: 16, color: C.muted });
    ctx.restore();
    var t = performance.now() / 1000;
    ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.4;
    K.text(ctx, '탭해서 한 판 더', w / 2, y + bh + 40, { size: 24, color: C.yellow, stroke: C.ink });
    ctx.globalAlpha = 1;
  }

  view.onResize = function () {
    if (state !== 'title' && stack) camTarget = Math.max(0, stack.length * BH - view.h * 0.42);
  };

  K.fontReady.then(function () {
    PG.ready();
    K.loop(function (dt) {
      update(dt);
      draw();
    });
  });
})();
