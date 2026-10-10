/*
 * 무한 점프: 다음 계단이 있는 쪽(왼쪽/오른쪽)을 탭해서 끝없이 오른다.
 * 방향을 틀리거나 시간 막대가 다 닳으면 떨어져서 끝.
 */
(function () {
  'use strict';
  var K = window.Kit;
  var C = K.C;
  var canvas = document.getElementById('c');
  var view = K.setup(canvas);
  var ctx = view.ctx;

  var SW = 62; // 계단 가로 간격
  var SH = 34; // 계단 세로 간격
  var COLORS = [C.yellow, C.mint, C.sky, C.white, C.lilac, C.orange, C.pink];

  var state = 'title';
  var steps, pos, score, best = 0, gauge, cam, player, popups, overAt, overReason;

  function makeSteps(from, count) {
    for (var i = 0; i < count; i++) {
      var prev = steps[steps.length - 1];
      var dir = prev.dir;
      // 같은 방향으로 1~4칸 가다가 방향을 바꾼다
      if (prev.run <= 0) {
        dir = -dir;
        prev.run = 0;
      }
      var run = prev.run > 0 ? prev.run - 1 : 1 + Math.floor(Math.random() * 4);
      steps.push({ col: prev.col + dir, dir: dir, run: run });
    }
  }

  function reset() {
    steps = [{ col: 0, dir: 1, run: 2 }];
    makeSteps(0, 40);
    pos = 0;
    score = 0;
    gauge = 1;
    popups = [];
    player = { x: 0, y: 0, fromX: 0, fromY: 0, t: 1, face: 1, falling: false, vy: 0, rot: 0 };
    cam = { x: 0, y: 0 };
    syncPlayer(true);
  }

  function stepXY(i) {
    return { x: steps[i].col * SW, y: -i * SH };
  }

  function syncPlayer(instant) {
    var p = stepXY(pos);
    player.fromX = instant ? p.x : player.x;
    player.fromY = instant ? p.y : player.y;
    player.toX = p.x;
    player.toY = p.y;
    player.t = instant ? 1 : 0;
  }

  function go(dir) {
    if (state !== 'play') return;
    var next = steps[pos + 1];
    player.face = dir;
    if (next.col - steps[pos].col !== dir) {
      fall('방향이 틀렸어요!');
      return;
    }
    pos++;
    score++;
    gauge = Math.min(1, gauge + 0.11);
    syncPlayer(false);
    PG.score(score);
    if (navigator.vibrate) navigator.vibrate(6);
    if (score % 50 === 0) popups.push({ text: score + '계단!', t: 0 });
    if (steps.length - pos < 30) makeSteps(steps.length, 30);
  }

  function fall(reason) {
    state = 'falling';
    overReason = reason;
    player.falling = true;
    player.vy = -260;
    player.t = 1;
    player.x = player.toX;
    player.y = player.toY;
    if (navigator.vibrate) navigator.vibrate(60);
    setTimeout(function () {
      state = 'over';
      overAt = performance.now();
      best = Math.max(best, score);
      PG.gameOver(score);
    }, 700);
  }

  function start() {
    reset();
    state = 'play';
    PG.gameStart();
    PG.score(0);
  }

  K.onTap(canvas, function (x) {
    if (state === 'title') return start();
    if (state === 'over') {
      if (performance.now() - overAt > 600) start();
      return;
    }
    go(x < view.w / 2 ? -1 : 1);
  });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft') go(-1);
    else if (e.code === 'ArrowRight') go(1);
    else if (e.code === 'Space' || e.code === 'Enter') {
      if (state === 'title' || (state === 'over' && performance.now() - overAt > 600)) start();
    }
  });

  function update(dt) {
    if (state === 'play') {
      var drain = Math.min(0.2 + score * 0.0035, 0.75);
      gauge -= drain * dt;
      if (gauge <= 0) {
        gauge = 0;
        fall('시간이 다 됐어요!');
      }
    }
    if (player) {
      if (player.falling) {
        player.vy += 1500 * dt;
        player.y += player.vy * dt;
        player.x += player.face * 40 * dt;
        player.rot += player.face * 6 * dt;
      } else if (player.t < 1) {
        player.t = Math.min(1, player.t + dt / 0.09);
        player.x = player.fromX + (player.toX - player.fromX) * player.t;
        player.y = player.fromY + (player.toY - player.fromY) * player.t - Math.sin(player.t * Math.PI) * 16;
      } else {
        player.x = player.toX;
        player.y = player.toY;
      }
      if (!player.falling) {
        cam.x += (player.x - cam.x) * Math.min(1, dt * 10);
        cam.y += (player.y - cam.y) * Math.min(1, dt * 10);
      }
    }
    if (popups) {
      for (var i = popups.length - 1; i >= 0; i--) {
        popups[i].t += dt;
        if (popups[i].t > 1.2) popups.splice(i, 1);
      }
    }
  }

  function toScreen(x, y) {
    return { x: x - cam.x + view.w / 2, y: y - cam.y + view.h * 0.62 };
  }

  function drawStep(i) {
    var p = stepXY(i);
    var s = toScreen(p.x, p.y);
    if (s.y < -40 || s.y > view.h + 40) return;
    K.box(ctx, s.x - 28, s.y, 56, 18, 6, COLORS[i % COLORS.length], { line: 3, shadow: 4 });
  }

  function drawBlob(x, y, face, rot, sad) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.yellow;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
    ctx.fillStyle = C.ink;
    var ex = face * 4;
    if (sad) {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ex - 8, -5); ctx.lineTo(ex - 3, -1); ctx.moveTo(ex - 3, -5); ctx.lineTo(ex - 8, -1);
      ctx.moveTo(ex + 3, -5); ctx.lineTo(ex + 8, -1); ctx.moveTo(ex + 8, -5); ctx.lineTo(ex + 3, -1);
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(ex - 5, -3, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex + 5, -3, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,93,162,0.7)';
    ctx.beginPath(); ctx.arc(ex - 10, 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 10, 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (sad) ctx.arc(ex, 8, 3.5, Math.PI * 1.1, Math.PI * 1.9);
    else ctx.arc(ex, 3, 3.5, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.restore();
  }

  function drawGauge() {
    var w = Math.min(view.w - 64, 260);
    var x = (view.w - w) / 2, y = K.TOP_SAFE - 10;
    K.box(ctx, x, y, w, 16, 8, 'rgba(255,255,255,0.15)', { line: 3, shadow: 0, lineColor: C.white });
    var col = gauge > 0.4 ? C.mint : gauge > 0.2 ? C.yellow : C.pink;
    if (gauge > 0.01) {
      K.rr(ctx, x + 3, y + 3, (w - 6) * gauge, 10, 5);
      ctx.fillStyle = col;
      ctx.fill();
    }
  }

  function drawHints() {
    if (score > 6) return;
    var a = 0.35 + Math.sin(performance.now() / 300) * 0.15;
    ctx.globalAlpha = a;
    K.text(ctx, '◀ 왼쪽 탭', view.w * 0.25, view.h - 120, { size: 20, color: C.white });
    K.text(ctx, '오른쪽 탭 ▶', view.w * 0.75, view.h - 120, { size: 20, color: C.white });
    ctx.globalAlpha = 1;
  }

  function draw() {
    var w = view.w, h = view.h;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    K.dots(ctx, w, h, cam ? -cam.y * 0.5 : 0);

    if (state === 'title') return drawTitle();

    for (var i = Math.max(0, pos - 14); i < Math.min(steps.length, pos + 22); i++) drawStep(i);
    var s = toScreen(player.x, player.y);
    drawBlob(s.x, s.y - 14, player.face, player.rot, state !== 'play');
    drawGauge();
    drawHints();

    for (var k = 0; k < popups.length; k++) {
      var p = popups[k];
      ctx.globalAlpha = Math.max(0, 1.2 - p.t);
      ctx.save();
      ctx.translate(w / 2, h * 0.3 - p.t * 30);
      ctx.rotate(-0.06);
      K.box(ctx, -70, -22, 140, 44, 12, C.mint, { line: 3, shadow: 4 });
      K.text(ctx, p.text, 0, 1, { size: 24, color: C.ink });
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    K.standaloneScore(ctx, w, score);
    if (state === 'over') drawOver();
  }

  function drawTitle() {
    var w = view.w, h = view.h;
    var t = performance.now() / 1000;
    var cx = w / 2, cy = h * 0.5;
    for (var i = 0; i < 5; i++) K.box(ctx, cx - 120 + i * 50, cy + 60 - i * 28, 54, 18, 6, COLORS[i], { line: 3, shadow: 4 });
    drawBlob(cx + 80 - 0, cy - 72 - Math.abs(Math.sin(t * 4)) * 22, 1, 0, false);
    K.text(ctx, '무한 점프', cx, cy - 170, { size: 46, color: C.pink, stroke: C.ink, strokeWidth: 10 });
    K.text(ctx, '다음 계단이 있는 쪽을 탭!', cx, cy - 128, { size: 18, color: C.lilac });
    ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.4;
    K.text(ctx, '탭해서 시작', cx, cy + 140, { size: 26, color: C.white, stroke: C.ink });
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
    ctx.rotate(0.03);
    K.box(ctx, -bw / 2, -bh / 2, bw, bh, 22, C.white, { line: 3, shadow: 6 });
    K.text(ctx, overReason || '떨어졌어요!', 0, -bh / 2 + 36, { size: 22, color: C.ink });
    K.text(ctx, score + '계단', 0, -6, { size: 50, color: C.pink });
    K.text(ctx, '최고 ' + best + '계단', 0, 38, { size: 16, color: C.muted });
    ctx.restore();
    var t = performance.now() / 1000;
    ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.4;
    K.text(ctx, '탭해서 한 판 더', w / 2, y + bh + 40, { size: 24, color: C.yellow, stroke: C.ink });
    ctx.globalAlpha = 1;
  }

  K.fontReady.then(function () {
    PG.ready();
    K.loop(function (dt) {
      update(dt);
      draw();
    });
  });
})();
