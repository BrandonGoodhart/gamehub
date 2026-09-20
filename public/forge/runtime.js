/* Game Forge — runtime for a generated game.
 *
 * Everything here is inlined into the downloaded .html file: the generator
 * serialises RUNTIME with Function.prototype.toString() and pastes RUNTIME_CSS
 * into a <style> tag. That keeps the exported game a single offline file while
 * letting this stay an ordinary, lintable source file.
 *
 * No imports, no network, no globals beyond the browser's own.
 */
window.FORGE = window.FORGE || {};

window.FORGE.RUNTIME_CSS = [
  '*,*::before,*::after{box-sizing:border-box}',
  'html,body{margin:0;height:100%}',
  'body{background:var(--bg);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;',
  '-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:transparent;touch-action:manipulation;overscroll-behavior:none}',
  'button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}',
  'input{font:inherit}',
  '#app{min-height:100%;display:flex;flex-direction:column;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}',

  /* ---- header ---- */
  '.hud{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--line);background:var(--panel)}',
  '.brand{font-weight:800;font-size:clamp(15px,2.2vw,22px);letter-spacing:-.01em;margin-right:auto;display:flex;align-items:center;gap:8px}',
  '.brand .dot{width:10px;height:10px;border-radius:50%;background:var(--accent);flex:none}',
  '.tools{display:flex;gap:6px;flex-wrap:wrap}',
  '.tool{border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:13px;color:var(--dim);background:var(--bg)}',
  '.tool:hover{color:var(--ink);border-color:var(--accent)}',
  '.tool[aria-pressed="true"]{color:var(--bg);background:var(--accent);border-color:var(--accent)}',

  /* ---- scoreboard ---- */
  '.scores{display:flex;gap:8px;flex-wrap:wrap;padding:10px 16px;border-bottom:1px solid var(--line)}',
  '.score{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:12px;padding:6px 12px;background:var(--panel);min-width:104px}',
  '.score .pip{width:12px;height:12px;border-radius:4px;flex:none}',
  '.score .nm{font-size:13px;color:var(--dim);max-width:12ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.score .pts{margin-left:auto;font-weight:800;font-variant-numeric:tabular-nums;font-size:clamp(15px,2vw,20px)}',
  '.score.lead{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}',
  '.score.buzzed{animation:pop .4s ease}',
  '@keyframes pop{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}',

  /* ---- layout ---- */
  'main{flex:1;padding:18px 16px 28px;display:flex;flex-direction:column}',
  '.wrap{width:100%;max-width:1100px;margin:0 auto;flex:1;display:flex;flex-direction:column}',
  'h1.big{font-size:clamp(28px,6vw,54px);line-height:1.05;margin:0 0 8px;letter-spacing:-.02em}',
  '.sub{color:var(--dim);margin:0 0 22px;font-size:clamp(14px,2vw,18px);line-height:1.5}',
  '.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px}',
  '.card + .card{margin-top:14px}',
  '.card h2{margin:0 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:var(--dim)}',
  '.rules{margin:0;padding-left:20px;color:var(--dim);line-height:1.7;font-size:15px}',
  '.rules b{color:var(--ink);font-weight:700}',

  /* ---- team setup ---- */
  '.teamrow{display:flex;align-items:center;gap:10px;margin-bottom:8px}',
  '.swatch{width:30px;height:30px;border-radius:9px;flex:none;border:1px solid rgba(255,255,255,.18)}',
  '.teamrow input{flex:1;min-width:0;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:10px 12px;color:var(--ink)}',
  '.teamrow input:focus{outline:2px solid var(--accent);outline-offset:1px}',
  '.mini{border:1px solid var(--line);border-radius:9px;width:34px;height:34px;flex:none;color:var(--dim);font-size:18px;line-height:1}',
  '.mini:hover{color:var(--ink);border-color:var(--accent)}',
  '.opts{display:flex;gap:18px;flex-wrap:wrap;color:var(--dim);font-size:14px}',
  '.opts label{display:flex;align-items:center;gap:7px;cursor:pointer}',
  '.go{display:block;width:100%;margin-top:18px;padding:18px;border-radius:14px;background:var(--accent);color:var(--bg);',
  'font-weight:800;font-size:clamp(18px,3vw,24px);letter-spacing:-.01em}',
  '.go:hover{filter:brightness(1.08)}',
  '.go.ghost{background:none;color:var(--ink);border:1px solid var(--line);font-size:16px;padding:14px}',

  /* ---- board ---- */
  '.board{display:grid;gap:8px;flex:1;align-content:start}',
  '.cat{font-weight:800;text-align:center;padding:12px 6px;border-radius:10px;background:var(--accent2);color:var(--bg);',
  'font-size:clamp(11px,1.5vw,15px);text-transform:uppercase;letter-spacing:.04em;display:flex;align-items:center;justify-content:center;min-height:56px}',
  '.tile{border-radius:10px;background:var(--panel);border:1px solid var(--line);font-weight:800;font-variant-numeric:tabular-nums;',
  'font-size:clamp(18px,3.4vw,34px);color:var(--accent);min-height:62px;display:flex;align-items:center;justify-content:center;transition:transform .08s}',
  '.tile:hover:not(.spent){transform:translateY(-2px);border-color:var(--accent);background:var(--bg)}',
  '.tile.spent{color:var(--line);background:transparent;border-style:dashed;cursor:default;font-size:15px}',

  /* ---- question overlay ---- */
  '.overlay{position:fixed;inset:0;background:var(--bg);display:flex;flex-direction:column;z-index:40;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)}',
  '.qtop{display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid var(--line);flex-wrap:wrap}',
  '.tag{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:var(--bg);background:var(--accent2);padding:5px 11px;border-radius:999px;font-weight:700}',
  '.worth{font-weight:800;color:var(--accent);font-size:19px;margin-left:auto;font-variant-numeric:tabular-nums}',
  '.qbody{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:24px 20px;gap:22px;overflow:auto}',
  '.qtext{font-size:clamp(24px,5.2vw,52px);font-weight:700;line-height:1.2;max-width:22ch;margin:0;letter-spacing:-.02em}',
  '.choices{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;width:100%;max-width:820px}',
  '.choice{border:1px solid var(--line);border-radius:12px;padding:14px 16px;text-align:left;display:flex;gap:11px;align-items:center;font-size:clamp(15px,2.2vw,19px);background:var(--panel)}',
  '.choice .ltr{width:28px;height:28px;border-radius:8px;background:var(--bg);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex:none;color:var(--dim)}',
  '.choice.right{border-color:var(--ok);background:color-mix(in srgb,var(--ok) 16%,transparent)}',
  '.choice.right .ltr{background:var(--ok);color:var(--bg);border-color:var(--ok)}',
  '.answer{font-size:clamp(20px,3.6vw,34px);font-weight:800;color:var(--ok);max-width:26ch;margin:0}',
  '.answer .lbl{display:block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);font-weight:700;margin-bottom:6px}',

  /* ---- timer ---- */
  '.timer{width:100%;height:6px;background:var(--line);position:relative;overflow:hidden;flex:none}',
  '.timer i{position:absolute;inset:0 auto 0 0;background:var(--accent);transition:width .25s linear}',
  '.timer.low i{background:var(--bad)}',
  '.clock{font-variant-numeric:tabular-nums;font-weight:800;font-size:19px;color:var(--dim);min-width:3ch}',
  '.clock.low{color:var(--bad)}',

  /* ---- award bar ---- */
  '.awards{padding:14px 18px;border-top:1px solid var(--line);background:var(--panel);display:flex;gap:9px;flex-wrap:wrap;align-items:center}',
  '.awards .lead-in{font-size:13px;color:var(--dim);width:100%;margin-bottom:2px}',
  '.award{border-radius:12px;padding:13px 17px;font-weight:800;color:var(--bg);font-size:clamp(14px,2vw,18px);display:flex;align-items:center;gap:8px;flex:1 1 140px;justify-content:center}',
  '.award:hover{filter:brightness(1.12)}',
  '.award .key{font-size:11px;opacity:.72;border:1px solid currentColor;border-radius:5px;padding:0 5px;font-weight:700}',
  '.award.none{background:none;color:var(--dim);border:1px dashed var(--line)}',

  /* ---- buzzer ---- */
  '.buzzgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;padding:14px 18px;border-top:1px solid var(--line)}',
  '.buzz{border-radius:14px;padding:22px 12px;font-weight:800;color:var(--bg);font-size:clamp(15px,2.4vw,21px);text-align:center;line-height:1.25;border:3px solid transparent}',
  '.buzz small{display:block;font-size:11px;opacity:.75;font-weight:700;margin-top:5px;letter-spacing:.06em}',
  '.buzz:hover{filter:brightness(1.1)}',
  '.buzz.dim{opacity:.34}',
  '.buzz.hot{border-color:var(--ink);transform:scale(1.03)}',
  '.banner{text-align:center;font-weight:800;font-size:clamp(18px,3.4vw,30px);padding:10px 0}',
  '.progress{font-size:13px;color:var(--dim);letter-spacing:.04em}',

  /* ---- bingo ---- */
  '.tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}',
  '.tab{border:1px solid var(--line);border-radius:999px;padding:9px 16px;font-size:14px;color:var(--dim)}',
  '.tab[aria-selected="true"]{background:var(--accent);color:var(--bg);border-color:var(--accent);font-weight:700}',
  '.called{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}',
  '.called span{border:1px solid var(--line);border-radius:8px;padding:5px 10px;font-size:13px;color:var(--dim)}',
  '.called span.newest{border-color:var(--accent);color:var(--ink)}',
  '.cardsheet{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:16px;margin-top:16px}',
  '.bcard{border:2px solid var(--line);border-radius:12px;padding:12px;background:var(--panel);break-inside:avoid}',
  '.bcard h3{margin:0 0 4px;font-size:15px;display:flex;justify-content:space-between;align-items:baseline;gap:8px}',
  '.bcard h3 em{font-style:normal;color:var(--dim);font-size:12px;font-weight:600}',
  '.bgrid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-top:8px}',
  '.bcell{border:1px solid var(--line);border-radius:6px;min-height:58px;display:flex;align-items:center;justify-content:center;',
  'text-align:center;font-size:10.5px;line-height:1.2;padding:3px;overflow:hidden;hyphens:auto}',
  '.bcell.free{background:var(--accent);color:var(--bg);font-weight:800;font-size:12px}',
  '.bhead{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-top:4px}',
  '.bhead span{text-align:center;font-weight:800;color:var(--accent);font-size:19px}',

  /* ---- results ---- */
  '.podium{display:flex;flex-direction:column;gap:9px;margin-top:18px}',
  '.rank{display:flex;align-items:center;gap:13px;border:1px solid var(--line);border-radius:13px;padding:14px 16px;background:var(--panel)}',
  '.rank .pos{font-weight:800;font-size:22px;color:var(--dim);width:2ch;font-variant-numeric:tabular-nums}',
  '.rank.win{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,var(--panel))}',
  '.rank.win .pos{color:var(--accent)}',
  '.rank .nm{font-weight:700;font-size:clamp(16px,2.6vw,22px)}',
  '.rank .pts{margin-left:auto;font-weight:800;font-size:clamp(18px,3vw,26px);font-variant-numeric:tabular-nums;color:var(--accent)}',
  '#confetti{position:fixed;inset:0;pointer-events:none;z-index:60}',

  /* ---- editor ---- */
  '.erow{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px}',
  '.erow input{background:var(--bg);border:1px solid var(--line);border-radius:9px;padding:9px 11px;color:var(--ink);min-width:0;font-size:14px}',
  '.erow input:focus{outline:2px solid var(--accent);outline-offset:1px}',
  '.ehead{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--dim);margin-bottom:6px}',
  '.note{color:var(--dim);font-size:13px;line-height:1.6;margin:12px 0 0}',
  '@media (max-width:620px){.erow,.ehead{grid-template-columns:1fr}.erow .mini{justify-self:end}}',

  /* ---- print (bingo cards) ---- */
  '@media print{',
  '  body{background:#fff;color:#000}',
  '  .hud,.scores,.tabs,.go,.noprint{display:none !important}',
  '  main{padding:0}',
  '  .cardsheet{grid-template-columns:repeat(2,1fr);gap:10px}',
  '  .bcard{background:#fff;border-color:#000;page-break-inside:avoid}',
  '  .bcell{border-color:#666}',
  '  .bcell.free{background:#ddd;color:#000}',
  '  .bhead span{color:#000}',
  '}'
].join('\n');

window.FORGE.RUNTIME = function (DATA) {
  'use strict';

  var doc = document;
  var root = doc.getElementById('app');
  var LS_KEY = 'forge-game:' + DATA.id;

  /* ---------------------------------------------------------------- state */
  var S = {
    screen: 'setup',
    teams: DATA.teams.map(function (t) { return { name: t.name, color: t.color, score: 0 }; }),
    used: {},
    order: [],
    qi: 0,
    locked: -1,
    revealed: false,
    muted: false,
    tId: null,
    left: 0,
    called: [],
    bingoTab: 'call',
    questions: null
  };

  /* ------------------------------------------------------------- storage */
  function load() {
    try {
      var raw = window.localStorage.getItem(LS_KEY);
      if (!raw) { return; }
      var saved = JSON.parse(raw);
      if (saved.teams && saved.teams.length) {
        S.teams = saved.teams.map(function (t) { return { name: t.name, color: t.color, score: 0 }; });
      }
      if (saved.questions) { S.questions = saved.questions; }
    } catch (e) { /* private mode, file:// restrictions — defaults are fine */ }
  }
  function save() {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify({
        teams: S.teams.map(function (t) { return { name: t.name, color: t.color }; }),
        questions: S.questions
      }));
    } catch (e) { /* not fatal */ }
  }

  /* --------------------------------------------------------------- sound */
  var actx = null;
  function tone(freq, dur, type, vol) {
    if (S.muted) { return; }
    try {
      if (!actx) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) { return; }
        actx = new Ctx();
      }
      if (actx.state === 'suspended') { actx.resume(); }
      var o = actx.createOscillator();
      var g = actx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.16, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + dur);
    } catch (e) { /* audio is optional */ }
  }
  function sfx(name) {
    if (name === 'buzz') { tone(160, 0.28, 'sawtooth', 0.2); }
    if (name === 'right') { tone(660, 0.13); window.setTimeout(function () { tone(990, 0.26); }, 120); }
    if (name === 'wrong') { tone(240, 0.2, 'square', 0.13); window.setTimeout(function () { tone(150, 0.3, 'square', 0.13); }, 150); }
    if (name === 'tick') { tone(900, 0.05, 'square', 0.07); }
    if (name === 'up') { tone(520, 0.09); }
    if (name === 'end') {
      [523, 659, 784, 1047].forEach(function (f, i) {
        window.setTimeout(function () { tone(f, 0.34); }, i * 130);
      });
    }
  }

  /* ---------------------------------------------------------- dom helpers */
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined && text !== null) { n.textContent = String(text); }
    return n;
  }
  function on(node, evt, fn) { node.addEventListener(evt, fn); return node; }
  function clear(node) { while (node.firstChild) { node.removeChild(node.firstChild); } }

  /* ------------------------------------------------------------ question set */
  function questions() {
    if (!S.questions) {
      S.questions = JSON.parse(JSON.stringify(DATA.questions));
    }
    return S.questions;
  }
  function boardCats() {
    var qs = questions();
    var cats = [];
    var byCat = {};
    qs.forEach(function (q) {
      if (!byCat[q.cat]) { byCat[q.cat] = []; cats.push(q.cat); }
      byCat[q.cat].push(q);
    });
    return cats.map(function (c) { return { name: c, items: byCat[c] }; });
  }

  /* --------------------------------------------------------------- timer */
  function stopTimer() {
    if (S.tId) { window.clearInterval(S.tId); S.tId = null; }
  }
  function startTimer(seconds, onDone) {
    stopTimer();
    if (!seconds) { return; }
    S.left = seconds;
    paintTimer(seconds);
    S.tId = window.setInterval(function () {
      S.left -= 1;
      paintTimer(seconds);
      if (S.left <= 3 && S.left > 0) { sfx('tick'); }
      if (S.left <= 0) {
        stopTimer();
        sfx('wrong');
        if (onDone) { onDone(); }
      }
    }, 1000);
  }
  function paintTimer(total) {
    var bar = doc.querySelector('.timer');
    var fill = doc.querySelector('.timer i');
    var clock = doc.querySelector('.clock');
    var low = S.left <= Math.max(3, Math.round(total * 0.25));
    if (fill) { fill.style.width = Math.max(0, (S.left / total) * 100) + '%'; }
    if (bar) { bar.classList.toggle('low', low); }
    if (clock) {
      clock.textContent = Math.max(0, S.left) + 's';
      clock.classList.toggle('low', low);
    }
  }

  /* ----------------------------------------------------------- chrome */
  function header() {
    var hud = el('header', 'hud');
    var brand = el('div', 'brand');
    brand.appendChild(el('span', 'dot'));
    brand.appendChild(el('span', null, DATA.title));
    hud.appendChild(brand);

    var tools = el('div', 'tools');
    function tool(label, fn, pressed) {
      var b = el('button', 'tool', label);
      if (pressed !== undefined) { b.setAttribute('aria-pressed', String(pressed)); }
      return on(b, 'click', fn);
    }
    if (S.screen !== 'setup') {
      tools.appendChild(tool('Scores ↺', function () {
        S.teams.forEach(function (t) { t.score = 0; });
        render();
      }));
    }
    tools.appendChild(tool(S.muted ? 'Sound off' : 'Sound on', function () {
      S.muted = !S.muted; render();
    }, !S.muted));
    tools.appendChild(tool('Full screen', function () {
      try {
        if (doc.fullscreenElement) { doc.exitFullscreen(); }
        else if (doc.documentElement.requestFullscreen) { doc.documentElement.requestFullscreen(); }
        else if (doc.documentElement.webkitRequestFullscreen) { doc.documentElement.webkitRequestFullscreen(); }
      } catch (e) { /* iOS Safari blocks this on some elements */ }
    }));
    tools.appendChild(tool(S.screen === 'editor' ? 'Done editing' : 'Edit questions', function () {
      S.screen = S.screen === 'editor' ? 'setup' : 'editor';
      render();
    }));
    if (S.screen !== 'setup') {
      tools.appendChild(tool('Quit', function () {
        stopTimer();
        S.screen = 'setup'; S.used = {}; S.qi = 0; S.locked = -1;
        S.called = [];
        S.teams.forEach(function (t) { t.score = 0; });
        render();
      }));
    }
    hud.appendChild(tools);
    return hud;
  }

  function scoreboard(buzzedIdx) {
    var best = Math.max.apply(null, S.teams.map(function (t) { return t.score; }));
    var wrap = el('div', 'scores');
    S.teams.forEach(function (t, i) {
      var s = el('div', 'score' + (t.score === best && best > 0 ? ' lead' : '') + (i === buzzedIdx ? ' buzzed' : ''));
      var pip = el('span', 'pip');
      pip.style.background = t.color;
      s.appendChild(pip);
      s.appendChild(el('span', 'nm', t.name));
      s.appendChild(el('span', 'pts', t.score));
      wrap.appendChild(s);
    });
    return wrap;
  }

  /* ------------------------------------------------------------- setup */
  function setupScreen() {
    var wrap = el('div', 'wrap');
    wrap.appendChild(el('h1', 'big', DATA.title));
    wrap.appendChild(el('p', 'sub', DATA.tagline));

    var rules = el('div', 'card');
    rules.appendChild(el('h2', null, 'How to play'));
    var ul = el('ul', 'rules');
    DATA.rules.forEach(function (r) {
      var li = doc.createElement('li');
      li.innerHTML = r;
      ul.appendChild(li);
    });
    rules.appendChild(ul);
    wrap.appendChild(rules);

    var teamCard = el('div', 'card');
    teamCard.appendChild(el('h2', null, 'Teams (' + S.teams.length + ')'));
    S.teams.forEach(function (t, i) {
      var row = el('div', 'teamrow');
      var sw = el('span', 'swatch');
      sw.style.background = t.color;
      row.appendChild(sw);
      var inp = doc.createElement('input');
      inp.value = t.name;
      inp.setAttribute('aria-label', 'Team ' + (i + 1) + ' name');
      inp.maxLength = 22;
      on(inp, 'input', function () { t.name = inp.value || 'Team ' + (i + 1); save(); });
      row.appendChild(inp);
      if (S.teams.length > 2) {
        row.appendChild(on(el('button', 'mini', '−'), 'click', function () {
          S.teams.splice(i, 1); save(); render();
        }));
      }
      teamCard.appendChild(row);
    });
    if (S.teams.length < 10) {
      teamCard.appendChild(on(el('button', 'go ghost', '+ Add a team'), 'click', function () {
        var i = S.teams.length;
        S.teams.push({ name: DATA.teamNames[i % DATA.teamNames.length], color: DATA.palette[i % DATA.palette.length], score: 0 });
        save(); render();
      }));
    }
    wrap.appendChild(teamCard);

    var start = el('button', 'go', DATA.mode === 'bingo' ? 'Open the caller →' : 'Start the game →');
    on(start, 'click', function () {
      sfx('up');
      beginGame();
    });
    wrap.appendChild(start);

    var note = el('p', 'note');
    note.textContent = 'Built by Game Forge · ' + questions().length + ' questions · works offline, no sign-in, nothing to install.';
    wrap.appendChild(note);
    return wrap;
  }

  function beginGame() {
    S.teams.forEach(function (t) { t.score = 0; });
    S.used = {};
    S.qi = 0;
    S.locked = -1;
    S.revealed = false;
    S.called = [];
    S.order = questions().map(function (_, i) { return i; });
    if (DATA.shuffle) { shuffle(S.order); }
    if (DATA.mode === 'buzzer') { S.order = S.order.slice(0, DATA.rounds); }
    S.screen = 'play';
    render();
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /* -------------------------------------------------------------- board */
  function boardScreen() {
    var wrap = el('div', 'wrap');
    var cats = boardCats();
    var rows = Math.max.apply(null, cats.map(function (c) { return c.items.length; }));
    var grid = el('div', 'board');
    grid.style.gridTemplateColumns = 'repeat(' + cats.length + ',minmax(0,1fr))';

    cats.forEach(function (c) { grid.appendChild(el('div', 'cat', c.name)); });

    for (var r = 0; r < rows; r += 1) {
      cats.forEach(function (c, ci) {
        var item = c.items[r];
        var key = ci + '-' + r;
        if (!item) { grid.appendChild(el('div')); return; }
        var spent = !!S.used[key];
        var t = el('button', 'tile' + (spent ? ' spent' : ''), spent ? '\u2014' : String(item.points));
        if (!spent) {
          on(t, 'click', function () { openQuestion(item, key, c.name); });
        } else {
          t.disabled = true;
        }
        grid.appendChild(t);
      });
    }
    wrap.appendChild(grid);
    var left = countLeft(cats);
    var p = el('p', 'note', left + ' of ' + questions().length + ' clues left · press a number key to give points · Esc closes a clue');
    wrap.appendChild(p);
    return wrap;
  }
  function countLeft(cats) {
    var total = 0;
    cats.forEach(function (c) { total += c.items.length; });
    return total - Object.keys(S.used).length;
  }

  function openQuestion(item, key, catName) {
    S.revealed = false;
    var ov = el('div', 'overlay');

    var bar = el('div', 'timer');
    bar.appendChild(doc.createElement('i'));

    var top = el('div', 'qtop');
    top.appendChild(el('span', 'tag', catName || DATA.subjectName));
    if (DATA.timer) { top.appendChild(el('span', 'clock', DATA.timer + 's')); }
    top.appendChild(el('span', 'worth', '+' + item.points));
    var close = el('button', 'tool', 'Close');
    on(close, 'click', function () { closeOverlay(ov); });
    top.appendChild(close);

    var body = el('div', 'qbody');
    body.appendChild(el('h2', 'qtext', item.q));

    var choiceWrap = null;
    if (DATA.showChoices && item.choices && item.choices.length) {
      choiceWrap = el('div', 'choices');
      item.choices.forEach(function (c, i) {
        var b = el('div', 'choice');
        b.appendChild(el('span', 'ltr', 'ABCD'.charAt(i)));
        b.appendChild(el('span', null, c));
        choiceWrap.appendChild(b);
      });
      body.appendChild(choiceWrap);
    }

    var answerBox = el('div');
    body.appendChild(answerBox);

    var awards = el('div', 'awards');

    function showAnswer() {
      if (S.revealed) { return; }
      S.revealed = true;
      stopTimer();
      sfx('up');
      if (choiceWrap && item.choices) {
        var nodes = choiceWrap.children;
        for (var i = 0; i < nodes.length; i += 1) {
          if (item.choices[i] === item.a) { nodes[i].className = 'choice right'; }
        }
      }
      clear(answerBox);
      var a = el('p', 'answer');
      a.appendChild(el('span', 'lbl', 'Answer'));
      a.appendChild(doc.createTextNode(item.a));
      answerBox.appendChild(a);
      buildAwards();
    }

    function buildAwards() {
      clear(awards);
      awards.appendChild(el('span', 'lead-in', 'Who got it? Tap a team or press its number.'));
      S.teams.forEach(function (t, i) {
        var b = el('button', 'award');
        b.style.background = t.color;
        b.appendChild(el('span', 'key', String(i + 1)));
        b.appendChild(el('span', null, t.name));
        on(b, 'click', function () { give(i); });
        awards.appendChild(b);
      });
      var none = el('button', 'award none', 'Nobody — move on');
      on(none, 'click', function () { give(-1); });
      awards.appendChild(none);
    }

    function give(teamIdx) {
      if (teamIdx >= 0) {
        S.teams[teamIdx].score += item.points;
        sfx('right');
      } else {
        sfx('wrong');
      }
      S.used[key] = true;
      closeOverlay(ov);
      var cats = boardCats();
      if (countLeft(cats) === 0) { finish(); }
    }

    var revealBtn = el('button', 'award', 'Show the answer  (space)');
    revealBtn.style.background = 'var(--accent)';
    on(revealBtn, 'click', showAnswer);
    awards.appendChild(revealBtn);

    ov.appendChild(bar);
    ov.appendChild(top);
    ov.appendChild(body);
    ov.appendChild(awards);
    doc.body.appendChild(ov);

    ov._keys = function (e) {
      if (e.key === 'Escape') { closeOverlay(ov); return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); showAnswer(); return; }
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= S.teams.length) { showAnswer(); give(n - 1); }
      if (e.key === '0') { showAnswer(); give(-1); }
    };
    doc.addEventListener('keydown', ov._keys);
    if (DATA.timer) { startTimer(DATA.timer, showAnswer); }
  }

  function closeOverlay(ov) {
    stopTimer();
    if (ov._keys) { doc.removeEventListener('keydown', ov._keys); }
    if (ov.parentNode) { ov.parentNode.removeChild(ov); }
    render();
  }

  /* ------------------------------------------------------------- buzzer */
  function buzzerScreen() {
    var wrap = el('div', 'wrap');
    var idx = S.order[S.qi];
    var item = questions()[idx];
    if (!item) { finish(); return wrap; }

    var bar = el('div', 'timer');
    bar.appendChild(doc.createElement('i'));
    wrap.appendChild(bar);

    var top = el('div', 'qtop');
    top.appendChild(el('span', 'tag', item.cat || DATA.subjectName));
    top.appendChild(el('span', 'progress', 'Question ' + (S.qi + 1) + ' of ' + S.order.length));
    if (DATA.timer) { top.appendChild(el('span', 'clock', DATA.timer + 's')); }
    top.appendChild(el('span', 'worth', '+' + item.points));
    wrap.appendChild(top);

    var body = el('div', 'qbody');
    body.appendChild(el('h2', 'qtext', item.q));

    if (DATA.showChoices && item.choices && item.choices.length) {
      var cw = el('div', 'choices');
      item.choices.forEach(function (c, i) {
        var b = el('div', 'choice' + (S.revealed && c === item.a ? ' right' : ''));
        b.appendChild(el('span', 'ltr', 'ABCD'.charAt(i)));
        b.appendChild(el('span', null, c));
        cw.appendChild(b);
      });
      body.appendChild(cw);
    }

    if (S.locked >= 0) {
      var t = S.teams[S.locked];
      var ban = el('p', 'banner', t.name + ' buzzed in!');
      ban.style.color = t.color;
      body.appendChild(ban);
    }
    if (S.revealed) {
      var a = el('p', 'answer');
      a.appendChild(el('span', 'lbl', 'Answer'));
      a.appendChild(doc.createTextNode(item.a));
      body.appendChild(a);
    }
    wrap.appendChild(body);

    if (S.locked >= 0 || S.revealed) {
      var awards = el('div', 'awards');
      if (S.locked >= 0 && !S.revealed) {
        awards.appendChild(el('span', 'lead-in', 'Did ' + S.teams[S.locked].name + ' get it right?'));
        var yes = el('button', 'award', 'Correct  +' + item.points);
        yes.style.background = 'var(--ok)';
        on(yes, 'click', function () {
          S.teams[S.locked].score += item.points;
          sfx('right'); S.revealed = true; render();
        });
        awards.appendChild(yes);
        var no = el('button', 'award', DATA.negative ? 'Wrong  −' + item.points : 'Wrong');
        no.style.background = 'var(--bad)';
        on(no, 'click', function () {
          if (DATA.negative) { S.teams[S.locked].score -= item.points; }
          sfx('wrong'); S.locked = -1; render();
        });
        awards.appendChild(no);
      } else {
        var next = el('button', 'award', S.qi + 1 >= S.order.length ? 'See the results →' : 'Next question →  (space)');
        next.style.background = 'var(--accent)';
        on(next, 'click', nextQuestion);
        awards.appendChild(next);
      }
      wrap.appendChild(awards);
    }

    var grid = el('div', 'buzzgrid');
    S.teams.forEach(function (team, i) {
      var b = el('button', 'buzz' + (S.locked === i ? ' hot' : (S.locked >= 0 ? ' dim' : '')));
      b.style.background = team.color;
      b.appendChild(doc.createTextNode(team.name));
      b.appendChild(el('small', null, 'press ' + (i + 1)));
      on(b, 'click', function () { buzz(i); });
      grid.appendChild(b);
    });
    wrap.appendChild(grid);

    if (!S.revealed && S.locked < 0) {
      var skip = el('button', 'go ghost', 'Nobody knows — reveal it');
      on(skip, 'click', function () { stopTimer(); S.revealed = true; render(); });
      wrap.appendChild(skip);
    }

    if (DATA.timer && S.locked < 0 && !S.revealed) {
      startTimer(DATA.timer, function () { S.revealed = true; render(); });
    }
    return wrap;
  }

  function buzz(i) {
    if (S.locked >= 0 || S.revealed) { return; }
    stopTimer();
    S.locked = i;
    sfx('buzz');
    render();
  }
  function nextQuestion() {
    stopTimer();
    S.qi += 1;
    S.locked = -1;
    S.revealed = false;
    if (S.qi >= S.order.length) { finish(); return; }
    render();
  }

  /* -------------------------------------------------------------- bingo */
  function bingoScreen() {
    var wrap = el('div', 'wrap');
    var tabs = el('div', 'tabs');
    [['call', 'Caller'], ['cards', 'Print cards']].forEach(function (pair) {
      var b = el('button', 'tab', pair[1]);
      b.setAttribute('aria-selected', String(S.bingoTab === pair[0]));
      on(b, 'click', function () { S.bingoTab = pair[0]; render(); });
      tabs.appendChild(b);
    });
    wrap.appendChild(tabs);

    if (S.bingoTab === 'call') {
      var pool = DATA.terms;
      var card = el('div', 'card');
      card.appendChild(el('h2', null, 'Call ' + (S.called.length) + ' of ' + pool.length));
      var current = S.called.length ? S.called[S.called.length - 1] : null;
      var big = el('h1', 'big', current ? current.clue : 'Ready when you are.');
      card.appendChild(big);
      card.appendChild(el('p', 'sub', current
        ? 'Answer on the card: ' + current.term
        : 'Read each clue out loud. Students cover the matching answer on their card.'));
      var nextBtn = el('button', 'go', S.called.length >= pool.length ? 'All clues called' : 'Call the next clue →');
      if (S.called.length >= pool.length) { nextBtn.disabled = true; nextBtn.className = 'go ghost'; }
      on(nextBtn, 'click', function () {
        if (S.called.length >= pool.length) { return; }
        var remaining = pool.filter(function (p) {
          return S.called.indexOf(p) === -1;
        });
        S.called.push(remaining[Math.floor(Math.random() * remaining.length)]);
        sfx('up');
        render();
      });
      card.appendChild(nextBtn);

      var called = el('div', 'called');
      S.called.slice().reverse().forEach(function (c, i) {
        called.appendChild(el('span', i === 0 ? 'newest' : null, c.term));
      });
      card.appendChild(called);
      wrap.appendChild(card);
    } else {
      var info = el('div', 'card noprint');
      info.appendChild(el('h2', null, 'Printable cards'));
      info.appendChild(el('p', 'sub', DATA.cardCount + ' cards, each one a different mix of ' + DATA.terms.length + ' answers. Print, hand out, play.'));
      var pr = el('button', 'go', 'Print these cards');
      on(pr, 'click', function () { window.print(); });
      info.appendChild(pr);
      wrap.appendChild(info);

      var sheet = el('div', 'cardsheet');
      for (var n = 0; n < DATA.cardCount; n += 1) {
        sheet.appendChild(bingoCard(n));
      }
      wrap.appendChild(sheet);
    }
    return wrap;
  }

  function bingoCard(n) {
    var c = el('div', 'bcard');
    var head = el('h3');
    head.appendChild(doc.createTextNode(DATA.title));
    head.appendChild(el('em', null, 'Card #' + (n + 1)));
    c.appendChild(head);

    var bh = el('div', 'bhead');
    'BINGO'.split('').forEach(function (ch) { bh.appendChild(el('span', null, ch)); });
    c.appendChild(bh);

    var terms = pickTerms(n);
    var grid = el('div', 'bgrid');
    for (var i = 0; i < 25; i += 1) {
      if (i === 12) { grid.appendChild(el('div', 'bcell free', 'FREE')); }
      else { grid.appendChild(el('div', 'bcell', terms[i < 12 ? i : i - 1])); }
    }
    c.appendChild(grid);
    return c;
  }

  /* Deterministic per-card shuffle so re-renders and reprints match. */
  function pickTerms(seed) {
    var pool = DATA.terms.map(function (t) { return t.term; });
    var s = seed * 9301 + 49297;
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    var a = pool.slice();
    for (var i = a.length - 1; i > 0; i -= 1) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a.slice(0, 24);
  }

  /* ------------------------------------------------------------ results */
  function finish() {
    stopTimer();
    S.screen = 'over';
    sfx('end');
    render();
    confetti();
  }

  function overScreen() {
    var wrap = el('div', 'wrap');
    var sorted = S.teams.slice().sort(function (a, b) { return b.score - a.score; });
    var top = sorted[0];
    var tie = sorted.filter(function (t) { return t.score === top.score; });
    wrap.appendChild(el('h1', 'big', tie.length > 1 ? 'It’s a tie!' : top.name + ' wins!'));
    wrap.appendChild(el('p', 'sub', tie.length > 1
      ? tie.map(function (t) { return t.name; }).join(' and ') + ' finished level on ' + top.score + ' points.'
      : 'Final score: ' + top.score + ' points.'));

    var podium = el('div', 'podium');
    sorted.forEach(function (t, i) {
      var r = el('div', 'rank' + (t.score === top.score ? ' win' : ''));
      r.appendChild(el('span', 'pos', String(i + 1)));
      var pip = el('span', 'swatch');
      pip.style.background = t.color;
      r.appendChild(pip);
      r.appendChild(el('span', 'nm', t.name));
      r.appendChild(el('span', 'pts', t.score));
      podium.appendChild(r);
    });
    wrap.appendChild(podium);

    var again = el('button', 'go', 'Play again →');
    on(again, 'click', beginGame);
    wrap.appendChild(again);
    var back = el('button', 'go ghost', 'Back to setup');
    on(back, 'click', function () { S.screen = 'setup'; render(); });
    wrap.appendChild(back);
    return wrap;
  }

  function confetti() {
    var cv = doc.createElement('canvas');
    cv.id = 'confetti';
    doc.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    function size() {
      cv.width = window.innerWidth * dpr;
      cv.height = window.innerHeight * dpr;
      cv.style.width = window.innerWidth + 'px';
      cv.style.height = window.innerHeight + 'px';
    }
    size();
    var bits = [];
    for (var i = 0; i < 140; i += 1) {
      bits.push({
        x: Math.random() * cv.width,
        y: -Math.random() * cv.height * 0.4,
        vx: (Math.random() - 0.5) * 3 * dpr,
        vy: (2 + Math.random() * 4) * dpr,
        w: (5 + Math.random() * 7) * dpr,
        h: (8 + Math.random() * 10) * dpr,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.28,
        c: DATA.palette[i % DATA.palette.length]
      });
    }
    var start = Date.now();
    function frame() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      bits.forEach(function (b) {
        b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.c;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      });
      if (Date.now() - start < 3200) { window.requestAnimationFrame(frame); }
      else if (cv.parentNode) { cv.parentNode.removeChild(cv); }
    }
    window.requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------- editor */
  function editorScreen() {
    var wrap = el('div', 'wrap');
    wrap.appendChild(el('h1', 'big', 'Edit the questions'));
    wrap.appendChild(el('p', 'sub', 'Change anything you like — it saves in this browser and stays in the file when you re-share it.'));

    var card = el('div', 'card');
    var head = el('div', 'ehead');
    head.appendChild(el('span', null, 'Question'));
    head.appendChild(el('span', null, 'Answer'));
    head.appendChild(el('span', null, ''));
    card.appendChild(head);

    questions().forEach(function (q, i) {
      var row = el('div', 'erow');
      var a = doc.createElement('input');
      a.value = q.q;
      a.setAttribute('aria-label', 'Question ' + (i + 1));
      on(a, 'input', function () { q.q = a.value; save(); });
      var b = doc.createElement('input');
      b.value = q.a;
      b.setAttribute('aria-label', 'Answer ' + (i + 1));
      on(b, 'input', function () {
        if (q.choices) {
          var at = q.choices.indexOf(q.a);
          if (at >= 0) { q.choices[at] = b.value; }
        }
        q.a = b.value;
        save();
      });
      row.appendChild(a);
      row.appendChild(b);
      row.appendChild(on(el('button', 'mini', '−'), 'click', function () {
        S.questions.splice(i, 1); save(); render();
      }));
      card.appendChild(row);
    });

    card.appendChild(on(el('button', 'go ghost', '+ Add a question'), 'click', function () {
      var cats = boardCats();
      questions().push({
        q: 'New question',
        a: 'New answer',
        cat: cats.length ? cats[0].name : DATA.subjectName,
        points: 100,
        choices: null
      });
      save(); render();
    }));
    wrap.appendChild(card);

    var reset = el('button', 'go ghost', 'Reset to the original questions');
    on(reset, 'click', function () {
      S.questions = null;
      try { window.localStorage.removeItem(LS_KEY); } catch (e) { /* fine */ }
      render();
    });
    wrap.appendChild(reset);

    var done = el('button', 'go', 'Done →');
    on(done, 'click', function () { S.screen = 'setup'; render(); });
    wrap.appendChild(done);
    return wrap;
  }

  /* -------------------------------------------------------------- render */
  function render() {
    clear(root);
    root.appendChild(header());
    if (S.screen === 'play' && DATA.mode !== 'bingo') { root.appendChild(scoreboard(S.locked)); }
    var main = doc.createElement('main');
    var view;
    if (S.screen === 'setup') { view = setupScreen(); }
    else if (S.screen === 'editor') { view = editorScreen(); }
    else if (S.screen === 'over') { view = overScreen(); }
    else if (DATA.mode === 'board') { view = boardScreen(); }
    else if (DATA.mode === 'bingo') { view = bingoScreen(); }
    else { view = buzzerScreen(); }
    main.appendChild(view);
    root.appendChild(main);
  }

  /* ------------------------------------------------------- global keys */
  doc.addEventListener('keydown', function (e) {
    if (doc.querySelector('.overlay')) { return; }
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') { return; }
    if (S.screen !== 'play') { return; }
    if (DATA.mode === 'buzzer') {
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= S.teams.length) { buzz(n - 1); return; }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (S.revealed) { nextQuestion(); }
        else if (S.locked < 0) { stopTimer(); S.revealed = true; render(); }
      }
    }
  });

  load();
  render();
};
