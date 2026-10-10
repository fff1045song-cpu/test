/*
 * 달빛 짝맞추기: 카드를 뒤집어 같은 그림 짝을 찾는다.
 * 스테이지 5개, 스테이지마다 제한 시간. 진행 상황은 PG.save 로 저장해서 이어하기를 보여준다.
 */
(function () {
  'use strict';
  var K = window.Kit;
  var C = K.C;
  var canvas = document.getElementById('c');
  var view = K.setup(canvas);
  var ctx = view.ctx;

  var STAGES = [
    { pairs: 4, cols: 4, time: 40 },
    { pairs: 6, cols: 3, time: 60 },
    { pairs: 8, cols: 4, time: 80 },
    { pairs: 10, cols: 4, time: 100 },
    { pairs: 12, cols: 4, time: 120 },
  ];
  var SAVE_VERSION = 1;

  var state = 'loading'; // loading, title, play, clear, over, done
  var saved = null;
  var stage, cards, open, lock, score, stageStartScore, timeLeft, moves, combo, popups, lastSave, overAt, buttons;

  // ---------- 그림 12종 ----------
  var SYMBOLS = [moon, star, heart, leaf, flower, cloud, planet, drop, diamond, sun, mushroom, candy];

  function path(fn, fill) {
    ctx.beginPath();
    fn();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
  }
  function moon(s) {
    path(function () {
      ctx.arc(0, 0, s, Math.PI * 0.35, Math.PI * 1.65, false);
      ctx.arc(s * 0.45, -s * 0.1, s * 0.78, Math.PI * 1.45, Math.PI * 0.55, true);
      ctx.closePath();
    }, C.yellow);
  }
  function starPath(s, inner) {
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + (i * Math.PI) / 5;
      var r = i % 2 ? s * inner : s;
      if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
  }
  function star(s) {
    path(function () { starPath(s, 0.45); }, C.sky);
  }
  function heart(s) {
    path(function () {
      ctx.moveTo(0, s * 0.85);
      ctx.bezierCurveTo(-s * 1.3, -s * 0.1, -s * 0.55, -s * 1.05, 0, -s * 0.35);
      ctx.bezierCurveTo(s * 0.55, -s * 1.05, s * 1.3, -s * 0.1, 0, s * 0.85);
    }, C.pink);
  }
  function leaf(s) {
    path(function () {
      ctx.moveTo(-s * 0.8, s * 0.8);
      ctx.quadraticCurveTo(-s, -s, s * 0.85, -s * 0.85);
      ctx.quadraticCurveTo(s, s, -s * 0.8, s * 0.8);
    }, C.mint);
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, s * 0.6);
    ctx.lineTo(s * 0.5, -s * 0.5);
    ctx.stroke();
  }
  function flower(s) {
    for (var i = 0; i < 5; i++) {
      var a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      path(function () { ctx.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.42, 0, Math.PI * 2); }, C.lilac);
    }
    path(function () { ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2); }, C.yellow);
  }
  function cloud(s) {
    path(function () {
      ctx.moveTo(-s * 0.9, s * 0.45);
      ctx.arc(-s * 0.45, s * 0.05, s * 0.45, Math.PI * 0.6, Math.PI * 1.5);
      ctx.arc(s * 0.05, -s * 0.25, s * 0.55, Math.PI * 1.1, Math.PI * 1.9);
      ctx.arc(s * 0.55, s * 0.1, s * 0.4, Math.PI * 1.5, Math.PI * 0.45);
      ctx.closePath();
    }, C.white);
  }
  function planet(s) {
    path(function () { ctx.arc(0, 0, s * 0.62, 0, Math.PI * 2); }, C.orange);
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 1.05, s * 0.3, -0.35, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = C.lilac;
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
  }
  function drop(s) {
    path(function () {
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.4, -s * 0.4, s * 0.75, 0, s * 0.75, s * 0.3);
      ctx.arc(0, s * 0.3, s * 0.75, 0, Math.PI);
      ctx.bezierCurveTo(-s * 0.75, 0, -s * 0.4, -s * 0.4, 0, -s);
    }, C.sky);
  }
  function diamond(s) {
    path(function () {
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.75, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.75, 0);
      ctx.closePath();
    }, C.mint);
  }
  function sun(s) {
    path(function () { starPath(s, 0.72); }, C.orange);
    path(function () { ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2); }, C.yellow);
  }
  function mushroom(s) {
    path(function () { K.rr(ctx, -s * 0.3, -s * 0.05, s * 0.6, s * 0.95, s * 0.2); }, C.white);
    path(function () {
      ctx.moveTo(-s, 0);
      ctx.quadraticCurveTo(-s, -s, 0, -s);
      ctx.quadraticCurveTo(s, -s, s, 0);
      ctx.closePath();
    }, C.pink);
    ctx.fillStyle = C.white;
    [[-0.45, -0.35], [0.1, -0.65], [0.5, -0.3]].forEach(function (d) {
      ctx.beginPath();
      ctx.arc(d[0] * s, d[1] * s, s * 0.13, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function candy(s) {
    path(function () { ctx.moveTo(-s * 0.5, 0); ctx.lineTo(-s, -s * 0.4); ctx.lineTo(-s, s * 0.4); ctx.closePath(); }, C.theme);
    path(function () { ctx.moveTo(s * 0.5, 0); ctx.lineTo(s, -s * 0.4); ctx.lineTo(s, s * 0.4); ctx.closePath(); }, C.theme);
    path(function () { ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2); }, C.theme);
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.3, 0, Math.PI * 1.4);
    ctx.stroke();
  }

  // ---------- 진행 ----------

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function newStage(n, startScore) {
    stage = n;
    var cfg = STAGES[n];
    var pick = shuffle(SYMBOLS.map(function (_, i) { return i; })).slice(0, cfg.pairs);
    var deck = shuffle(pick.concat(pick));
    setupCards(deck, deck.map(function () { return false; }));
    score = startScore;
    stageStartScore = startScore;
    timeLeft = cfg.time;
    moves = 0;
    save();
  }

  function setupCards(deck, matched) {
    cards = deck.map(function (sym, i) {
      return { sym: sym, matched: !!matched[i], flip: matched[i] ? 1 : 0, target: matched[i] ? 1 : 0, pop: 0 };
    });
    open = [];
    lock = false;
    combo = 0;
    popups = [];
  }

  function save() {
    PG.save({
      v: SAVE_VERSION,
      stage: stage,
      score: score,
      stageStartScore: stageStartScore,
      timeLeft: Math.ceil(timeLeft),
      moves: moves,
      deck: cards.map(function (c) { return c.sym; }),
      matched: cards.map(function (c) { return c.matched; }),
    });
    lastSave = performance.now();
  }

  function validSave(d) {
    if (!d || d.v !== SAVE_VERSION || !STAGES[d.stage]) return false;
    var cfg = STAGES[d.stage];
    return (
      Array.isArray(d.deck) && d.deck.length === cfg.pairs * 2 &&
      Array.isArray(d.matched) && d.matched.length === d.deck.length &&
      d.deck.every(function (s) { return SYMBOLS[s]; }) &&
      typeof d.timeLeft === 'number' && typeof d.score === 'number'
    );
  }

  function resume(d) {
    stage = d.stage;
    setupCards(d.deck, d.matched);
    score = d.score;
    stageStartScore = d.stageStartScore || 0;
    timeLeft = Math.max(10, d.timeLeft);
    moves = d.moves || 0;
  }

  function begin(fromSave) {
    if (fromSave && validSave(saved)) resume(saved);
    else newStage(0, 0);
    state = 'play';
    PG.gameStart();
    PG.score(score);
  }

  function layout() {
    var cfg = STAGES[stage];
    var rows = Math.ceil((cfg.pairs * 2) / cfg.cols);
    var top = K.TOP_SAFE + 36;
    var bottom = 24;
    var gap = 10;
    var availW = view.w - 32;
    var availH = view.h - top - bottom;
    var cw = Math.min((availW - gap * (cfg.cols - 1)) / cfg.cols, ((availH - gap * (rows - 1)) / rows) * 0.78, 96);
    var ch = cw / 0.78;
    var gridW = cw * cfg.cols + gap * (cfg.cols - 1);
    var gridH = ch * rows + gap * (rows - 1);
    var x0 = (view.w - gridW) / 2;
    var y0 = top + Math.max(0, (availH - gridH) / 2);
    return { cw: cw, ch: ch, gap: gap, cols: cfg.cols, x0: x0, y0: y0 };
  }

  function cardRect(i, L) {
    var c = i % L.cols, r = Math.floor(i / L.cols);
    return { x: L.x0 + c * (L.cw + L.gap), y: L.y0 + r * (L.ch + L.gap), w: L.cw, h: L.ch };
  }

  function tapCard(x, y) {
    if (lock) return;
    var L = layout();
    for (var i = 0; i < cards.length; i++) {
      var R = cardRect(i, L);
      if (x >= R.x && x <= R.x + R.w && y >= R.y && y <= R.y + R.h) {
        var c = cards[i];
        if (c.matched || c.target === 1) return;
        c.target = 1;
        open.push(i);
        if (open.length === 2) check();
        return;
      }
    }
  }

  function check() {
    moves++;
    var a = cards[open[0]], b = cards[open[1]];
    if (a.sym === b.sym) {
      a.matched = b.matched = true;
      a.pop = b.pop = 1;
      combo++;
      var gain = 100 + (combo - 1) * 30;
      score += gain;
      popups.push({ text: combo > 1 ? combo + ' 콤보! +' + gain : '+' + gain, t: 0 });
      open = [];
      PG.score(score);
      if (navigator.vibrate) navigator.vibrate([10, 40, 10]);
      if (cards.every(function (c) { return c.matched; })) stageClear();
      else save();
    } else {
      combo = 0;
      lock = true;
      setTimeout(function () {
        a.target = 0;
        b.target = 0;
        open = [];
        lock = false;
      }, 650);
    }
  }

  function stageClear() {
    var bonus = Math.ceil(timeLeft) * 5;
    score += bonus;
    PG.score(score);
    if (stage === STAGES.length - 1) {
      state = 'done';
      overAt = performance.now();
      PG.save(null);
      saved = null;
      PG.gameOver(score);
      return;
    }
    state = 'clear';
    overAt = performance.now();
    clearBonus = bonus;
    clearedStage = stage;
    // 다음 스테이지 시작 상태로 바로 저장 → 여기서 나가도 다음 스테이지부터 이어진다
    newStage(stage + 1, score);
  }
  var clearBonus = 0;
  var clearedStage = 0;

  function timeUp() {
    state = 'over';
    overAt = performance.now();
    // 같은 스테이지 처음부터 다시 할 수 있게 저장
    var finalScore = score;
    newStage(stage, stageStartScore);
    PG.gameOver(finalScore);
  }

  // ---------- 입력 ----------

  function hit(btn, x, y) {
    return btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
  }

  K.onTap(canvas, function (x, y) {
    if (state === 'title') {
      if (buttons.cont && hit(buttons.cont, x, y)) return begin(true);
      if (buttons.fresh && hit(buttons.fresh, x, y)) {
        saved = null;
        return begin(false);
      }
      if (!buttons.cont) return begin(false);
      return;
    }
    if (state === 'play') return tapCard(x, y);
    if (performance.now() - overAt < 600) return;
    if (state === 'clear') {
      state = 'play';
      PG.gameStart();
      return;
    }
    if (state === 'over') {
      state = 'play';
      PG.gameStart();
      PG.score(score);
      return;
    }
    if (state === 'done') begin(false);
  });

  // ---------- 그리기 ----------

  function update(dt) {
    if (state === 'play') {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        timeUp();
      } else if (performance.now() - lastSave > 3000) {
        save();
      }
    }
    if (cards) {
      cards.forEach(function (c) {
        c.flip += (c.target - c.flip) * Math.min(1, dt * 14);
        c.pop = Math.max(0, c.pop - dt * 2.5);
      });
    }
    if (popups) {
      for (var i = popups.length - 1; i >= 0; i--) {
        popups[i].t += dt;
        if (popups[i].t > 1) popups.splice(i, 1);
      }
    }
  }

  function drawCard(i, R) {
    var c = cards[i];
    var f = c.flip;
    var scaleX = Math.abs(Math.cos(f * Math.PI));
    var showFace = f > 0.5;
    var s = 1 + c.pop * 0.12;
    ctx.save();
    ctx.translate(R.x + R.w / 2, R.y + R.h / 2);
    ctx.scale(Math.max(0.04, scaleX) * s, s);
    if (showFace) {
      K.box(ctx, -R.w / 2, -R.h / 2, R.w, R.h, 12, c.matched ? '#FFF7D1' : C.white, { line: 3, shadow: 4 });
      SYMBOLS[c.sym](R.w * 0.3);
    } else {
      K.box(ctx, -R.w / 2, -R.h / 2, R.w, R.h, 12, C.theme, { line: 3, shadow: 4 });
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (var y = -R.h / 2 + 10; y < R.h / 2 - 4; y += 12) {
        for (var x = -R.w / 2 + 10; x < R.w / 2 - 4; x += 12) {
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.save();
      ctx.scale(0.55, 0.55);
      moon(R.w * 0.3);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawHud() {
    var w = view.w;
    var y = K.TOP_SAFE - 4;
    K.text(ctx, '스테이지 ' + (stage + 1) + '/' + STAGES.length, 18, y, { size: 18, color: C.white, align: 'left' });
    var t = Math.ceil(timeLeft);
    K.text(ctx, t + '초', w - 18, y, { size: 18, color: t <= 10 ? C.pink : C.yellow, align: 'right' });
    var bw = w - 36;
    K.rr(ctx, 18, y + 14, bw, 8, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
    var ratio = Math.max(0, timeLeft / STAGES[stage].time);
    if (ratio > 0) {
      K.rr(ctx, 18, y + 14, bw * ratio, 8, 4);
      ctx.fillStyle = t <= 10 ? C.pink : C.mint;
      ctx.fill();
    }
  }

  function draw() {
    var w = view.w, h = view.h;
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, w, h);
    K.dots(ctx, w, h, 0);

    if (state === 'loading') return;
    if (state === 'title') return drawTitle();

    var L = layout();
    for (var i = 0; i < cards.length; i++) drawCard(i, cardRect(i, L));
    drawHud();
    for (var k = 0; k < popups.length; k++) {
      var p = popups[k];
      ctx.globalAlpha = Math.max(0, 1 - p.t);
      K.text(ctx, p.text, w / 2, h * 0.5 - p.t * 40, { size: 30, color: C.yellow, stroke: C.ink, strokeWidth: 8 });
      ctx.globalAlpha = 1;
    }
    K.standaloneScore(ctx, w, score);
    if (state === 'clear') panel('스테이지 ' + (clearedStage + 1) + ' 클리어!', '남은 시간 보너스 +' + clearBonus, '탭해서 다음 스테이지', C.mint);
    if (state === 'over') panel('시간 초과!', '스테이지 ' + (stage + 1) + '부터 다시 도전해요', '탭해서 다시 도전', C.pink);
    if (state === 'done') panel('모든 스테이지 클리어!', '최종 점수 ' + score, '탭해서 처음부터', C.yellow);
  }

  function panel(title, sub, cta, color) {
    var w = view.w, h = view.h;
    ctx.fillStyle = 'rgba(26,16,51,0.65)';
    ctx.fillRect(0, 0, w, h);
    var bw = Math.min(300, w - 40), bh = 150;
    ctx.save();
    ctx.translate(w / 2, h * 0.42);
    ctx.rotate(-0.03);
    K.box(ctx, -bw / 2, -bh / 2, bw, bh, 22, color, { line: 3, shadow: 6 });
    K.text(ctx, title, 0, -22, { size: 26, color: C.ink });
    K.text(ctx, sub, 0, 20, { size: 17, color: C.ink });
    ctx.restore();
    var t = performance.now() / 1000;
    ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.4;
    K.text(ctx, cta, w / 2, h * 0.42 + bh / 2 + 44, { size: 22, color: C.white, stroke: C.ink });
    ctx.globalAlpha = 1;
  }

  function button(label, cx, y, color, textColor) {
    var bw = Math.min(240, view.w - 64), bh = 54;
    var b = { x: cx - bw / 2, y: y, w: bw, h: bh };
    K.box(ctx, b.x, b.y, bw, bh, 16, color, { line: 3, shadow: 5 });
    K.text(ctx, label, cx, y + bh / 2 + 1, { size: 21, color: textColor || C.ink });
    return b;
  }

  function drawTitle() {
    var w = view.w, h = view.h;
    var t = performance.now() / 1000;
    var cx = w / 2, cy = h * 0.4;
    ctx.save();
    ctx.translate(cx, cy - 40 + Math.sin(t * 2) * 5);
    moon(46);
    ctx.restore();
    ctx.save();
    ctx.translate(cx - 70, cy + 40);
    ctx.rotate(-0.15);
    K.box(ctx, -26, -34, 52, 68, 10, C.theme, { line: 3, shadow: 4 });
    ctx.restore();
    ctx.save();
    ctx.translate(cx + 70, cy + 40);
    ctx.rotate(0.15);
    K.box(ctx, -26, -34, 52, 68, 10, C.white, { line: 3, shadow: 4 });
    star(16);
    ctx.restore();
    K.text(ctx, '달빛 짝맞추기', cx, cy - 130, { size: 40, color: C.lilac, stroke: C.ink, strokeWidth: 10 });
    buttons = {};
    var by = cy + 110;
    if (saved && validSave(saved)) {
      buttons.cont = button('이어하기 · 스테이지 ' + (saved.stage + 1), cx, by, C.yellow);
      buttons.fresh = button('처음부터', cx, by + 70, C.white);
    } else {
      ctx.globalAlpha = 0.6 + Math.sin(t * 4) * 0.4;
      K.text(ctx, '탭해서 시작', cx, by + 26, { size: 26, color: C.white, stroke: C.ink });
      ctx.globalAlpha = 1;
    }
  }

  // 시작: 저장된 진행 상황을 먼저 불러온다
  Promise.all([K.fontReady, PG.load()]).then(function (res) {
    saved = validSave(res[1]) ? res[1] : null;
    state = 'title';
    buttons = {};
    PG.ready();
    K.loop(function (dt) {
      update(dt);
      draw();
    });
  });
})();
