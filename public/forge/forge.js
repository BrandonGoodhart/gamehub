/* Game Forge — the builder page.
 *
 * Runs the prompt through generator.js one visible step at a time, drawing a
 * real preview of the thing it just decided, and finishes with a downloadable
 * single-file game.
 */
(function (F) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var S = { plan: null, spec: null, html: null, url: null, busy: false };

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function sleep(ms) { return new Promise(function (r) { window.setTimeout(r, ms); }); }
  function kb(n) { return (n / 1024).toFixed(0) + ' KB'; }
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'class-game';
  }

  /* Wrap text into at most `lines` rows of roughly `per` characters. */
  function wrap(text, per, lines) {
    var words = String(text).split(/\s+/).filter(Boolean);
    var out = [];
    var cur = '';
    words.forEach(function (w) {
      if (!cur.length) { cur = w; }
      else if ((cur + ' ' + w).length <= per) { cur += ' ' + w; }
      else { out.push(cur); cur = w; }
    });
    if (cur) { out.push(cur); }
    if (out.length > lines) {
      out = out.slice(0, lines);
      out[lines - 1] = out[lines - 1].replace(/.{0,2}$/, '') + '…';
    }
    return out;
  }

  /* ==================================================================== art
     Every tile below is drawn from the spec that was just decided, so the
     pictures are a preview of the real game, not decoration. */

  function frame(theme, inner) {
    return '<svg viewBox="0 0 320 200" role="img" xmlns="http://www.w3.org/2000/svg">'
      + '<rect width="320" height="200" rx="12" fill="' + theme.bg + '"/>'
      + inner + '</svg>';
  }
  function txt(x, y, s, size, fill, weight, anchor) {
    return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill
      + '" font-weight="' + (weight || 400) + '" text-anchor="' + (anchor || 'start')
      + '" font-family="ui-sans-serif,system-ui,sans-serif">' + esc(s) + '</text>';
  }
  function box(x, y, w, h, r, fill, stroke) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r
      + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '"' : '') + '/>';
  }

  function promptArt(plan, theme) {
    var g = txt(16, 26, 'YOUR WORDS', 9, theme.dim, 700);
    wrap(plan.prompt, 42, 4).forEach(function (line, i) {
      g += txt(16, 48 + i * 15, line, 10.5, theme.ink, 400);
    });
    var x = 16;
    plan.notes.slice(0, 3).forEach(function (n, i) {
      var label = n.value;
      var w = Math.min(130, 13 + label.length * 5.3);
      if (x + w > 304) { return; }
      var col = [theme.accent, theme.accent2, theme.ok][i % 3];
      g += box(x, 128, w, 22, 11, col);
      g += txt(x + w / 2, 143, label, 9.5, theme.bg, 700, 'middle');
      x += w + 7;
    });
    g += txt(16, 176, 'read ' + plan.notes.length + ' signals from the prompt', 9.5, theme.dim, 500);
    return frame(theme, g);
  }

  function shapeArt(plan, theme) {
    var g = txt(16, 24, F.MODES[plan.mode].name.toUpperCase(), 9, theme.dim, 700);
    var i;
    if (plan.mode === 'board') {
      for (var c = 0; c < 5; c += 1) {
        g += box(16 + c * 58, 36, 52, 20, 5, theme.accent2);
        for (var r = 0; r < 4; r += 1) {
          g += box(16 + c * 58, 62 + r * 30, 52, 24, 5, theme.panel, theme.line);
          g += txt(16 + c * 58 + 26, 78 + r * 30, String((r + 1) * 100), 9.5, theme.accent, 800, 'middle');
        }
      }
    } else if (plan.mode === 'bingo') {
      g += box(16, 34, 180, 150, 8, theme.panel, theme.line);
      for (i = 0; i < 25; i += 1) {
        var bx = 24 + (i % 5) * 34;
        var by = 42 + Math.floor(i / 5) * 28;
        var mid = i === 12;
        g += box(bx, by, 30, 24, 4, mid ? theme.accent : theme.bg, theme.line);
      }
      g += box(208, 34, 96, 150, 8, theme.panel, theme.line);
      g += txt(256, 62, 'CALLER', 9, theme.dim, 700, 'middle');
      for (i = 0; i < 4; i += 1) {
        g += box(218, 74 + i * 26, 76, 18, 4, i ? theme.bg : theme.accent2);
      }
    } else {
      g += box(16, 34, 288, 96, 8, theme.panel, theme.line);
      g += box(28, 48, 64, 16, 8, theme.accent2);
      [200, 150].forEach(function (w, k) {
        g += box(28, 76 + k * 18, w, 10, 5, theme.line);
      });
      for (i = 0; i < 4; i += 1) {
        g += box(16 + i * 74, 140, 66, 44, 8, F.PALETTE[i]);
        g += txt(16 + i * 74 + 33, 167, String(i + 1), 13, theme.bg, 800, 'middle');
      }
    }
    return frame(theme, g);
  }

  function paletteArt(plan, theme) {
    var g = txt(16, 24, theme.name.toUpperCase() + ' PALETTE', 9, theme.dim, 700);
    var picks = [['accent', theme.accent], ['accent2', theme.accent2], ['ok', theme.ok]];
    picks.forEach(function (p, i) {
      g += box(16 + i * 98, 34, 90, 62, 8, p[1]);
      g += txt(16 + i * 98 + 45, 112, p[1].toUpperCase(), 9, theme.dim, 600, 'middle');
    });
    g += txt(16, 138, 'TEAM COLOURS', 9, theme.dim, 700);
    for (var t = 0; t < Math.min(10, plan.teamCount); t += 1) {
      g += '<circle cx="' + (22 + t * 24) + '" cy="164" r="10" fill="' + F.PALETTE[t] + '"/>';
    }
    return frame(theme, g);
  }

  function questionArt(spec, theme) {
    var q = spec.questions[0] || { q: '', a: '', cat: '' };
    var g = box(0, 0, 320, 30, 0, theme.panel);
    g += box(14, 8, Math.min(120, 16 + q.cat.length * 4.6), 15, 7, theme.accent2);
    g += txt(14 + Math.min(120, 16 + q.cat.length * 4.6) / 2, 19, q.cat, 8.5, theme.bg, 700, 'middle');
    g += txt(304, 19, '+' + q.points, 11, theme.accent, 800, 'end');
    wrap(q.q, 38, 2).forEach(function (line, i) {
      g += txt(160, 56 + i * 17, line, 12.5, theme.ink, 700, 'middle');
    });
    var choices = q.choices || [q.a];
    choices.slice(0, 4).forEach(function (c, i) {
      var right = c === q.a;
      var y = 96 + i * 24;
      g += box(16, y, 288, 20, 5, right ? theme.ok : theme.panel, right ? theme.ok : theme.line);
      g += txt(26, y + 14, 'ABCD'.charAt(i), 9, right ? theme.bg : theme.dim, 800);
      g += txt(40, y + 14, wrap(c, 46, 1)[0] || '', 9.5, right ? theme.bg : theme.ink, right ? 700 : 400);
    });
    return frame(theme, g);
  }

  function teamArt(spec, theme) {
    var g = txt(16, 24, 'SCOREBOARD', 9, theme.dim, 700);
    var fake = [0, 300, 100, 200, 0, 100, 0, 200, 100, 0];
    spec.teams.slice(0, 6).forEach(function (t, i) {
      var y = 34 + i * 26;
      g += box(16, y, 288, 22, 6, theme.panel, i === 1 ? theme.accent : theme.line);
      g += box(24, y + 6, 10, 10, 3, t.color);
      g += txt(42, y + 15, wrap(t.name, 24, 1)[0], 10, theme.ink, 600);
      g += txt(296, y + 15, String(fake[i]), 11, theme.accent, 800, 'end');
    });
    var note = spec.teams.length + ' teams · rename them in the game';
    g += txt(16, 192, note, 9.5, theme.dim, 500);
    return frame(theme, g);
  }

  function fileArt(spec, theme, bytes) {
    var g = box(96, 22, 128, 150, 10, theme.panel, theme.line);
    g += '<path d="M188 22 L224 58 L188 58 Z" fill="' + theme.accent + '"/>';
    g += txt(160, 92, '.html', 20, theme.accent, 800, 'middle');
    wrap(spec.title, 20, 2).forEach(function (line, i) {
      g += txt(160, 116 + i * 14, line, 10.5, theme.ink, 700, 'middle');
    });
    g += txt(160, 156, kb(bytes), 10, theme.dim, 600, 'middle');
    ['no internet', 'no install', 'opens in Safari'].forEach(function (t, i) {
      g += txt(16 + i * 100 + 50, 190, '✓ ' + t, 8.5, theme.ok, 600, 'middle');
    });
    return frame(theme, g);
  }

  /* ============================================================== pipeline */

  var STAGES = [
    {
      title: 'Reading your prompt',
      run: function (ctx) {
        /* A rebuild arrives with a plan the teacher edited by hand — re-parsing
           the prompt here would silently throw those changes away. */
        if (!ctx.plan) { ctx.plan = F.parsePrompt(ctx.text); }
      },
      detail: function (ctx) {
        var lines = ctx.plan.notes.map(function (n) { return n.label + ': ' + n.value + ' — ' + n.why; });
        if (ctx.manual) { lines.unshift('<b>Using the settings you picked</b>, keeping the same prompt.'); }
        return lines.join('<br>');
      },
      art: function (ctx) { return [promptArt(ctx.plan, ctx.theme()), 'what it heard']; }
    },
    {
      title: 'Choosing the game shape',
      detail: function (ctx) {
        var m = F.MODES[ctx.plan.mode];
        return m.blurb + '<br>' + m.best;
      },
      art: function (ctx) { return [shapeArt(ctx.plan, ctx.theme()), 'the layout']; }
    },
    {
      title: 'Mixing the colours',
      detail: function (ctx) {
        return 'Theme: <b>' + esc(ctx.theme().name) + '</b>. Big type, strong contrast, readable from the back row.';
      },
      art: function (ctx) { return [paletteArt(ctx.plan, ctx.theme()), 'the palette']; }
    },
    {
      title: 'Writing the questions',
      run: function (ctx) { ctx.spec = F.buildSpec(ctx.plan); },
      detail: function (ctx) {
        var cats = {};
        ctx.spec.questions.forEach(function (q) { cats[q.cat] = 1; });
        var n = ctx.spec.questions.length;
        if (ctx.plan.mode === 'bingo') {
          return n + ' clues and ' + ctx.spec.terms.length + ' answer squares, pitched at ' + F.BAND_LABEL[ctx.plan.band] + '.';
        }
        return n + ' questions across ' + Object.keys(cats).length + ' categor'
          + (Object.keys(cats).length === 1 ? 'y' : 'ies')
          + ', pitched at ' + F.BAND_LABEL[ctx.plan.band]
          + (ctx.plan.mode === 'board' ? '. Cheap rows are easier, 500s are the stretch ones.' : '.');
      },
      art: function (ctx) { return [questionArt(ctx.spec, ctx.theme()), 'a real question']; }
    },
    {
      title: 'Setting up the teams',
      detail: function (ctx) {
        return ctx.spec.teams.length + ' teams: ' + esc(ctx.spec.teams.map(function (t) { return t.name; }).join(', '))
          + '.<br>' + (ctx.plan.timer ? ctx.plan.timer + '-second timer per question.' : 'No timer.')
          + ' Scores stay on screen the whole game.';
      },
      art: function (ctx) { return [teamArt(ctx.spec, ctx.theme()), 'the scoreboard']; }
    },
    {
      title: 'Packaging one file',
      run: function (ctx) { ctx.html = F.buildGame(ctx.spec); },
      detail: function (ctx) {
        return 'Everything — questions, scoreboard, timer, sounds — folded into a single '
          + kb(ctx.html.length) + ' file. No server, no sign-in, nothing to install.';
      },
      art: function (ctx) { return [fileArt(ctx.spec, ctx.theme(), ctx.html.length), 'your file']; }
    }
  ];

  function logLine(title) {
    var li = document.createElement('li');
    li.className = 'run';
    li.innerHTML = '<span class="ic"></span><span class="txt"><b>' + esc(title) + '</b><span></span></span>';
    $('log').appendChild(li);
    return li;
  }
  function finishLine(li, detail) {
    li.className = 'ok';
    li.querySelector('.ic').textContent = '✓';
    li.querySelector('.txt span').innerHTML = detail;
  }
  function addArt(svg, caption) {
    var fig = document.createElement('figure');
    fig.innerHTML = svg + '<figcaption>' + esc(caption) + '</figcaption>';
    $('film').appendChild(fig);
  }
  function progress(p) {
    $('barFill').style.width = p + '%';
    $('pct').textContent = Math.round(p) + '%';
  }
  function tint(theme) {
    document.documentElement.style.setProperty('--spark', theme.accent);
    document.documentElement.style.setProperty('--spark2', theme.accent2);
  }

  async function build(text, opts) {
    if (S.busy) { return; }
    S.busy = true;
    var fast = opts && opts.fast;
    var preset = opts && opts.plan;

    $('build').disabled = true;
    $('promptCard').hidden = true;
    $('doneCard').hidden = true;
    $('buildCard').hidden = false;
    $('log').innerHTML = '';
    $('film').innerHTML = '';
    $('buildTitle').textContent = preset ? 'Rebuilding your game' : 'Building your game';
    $('buildPrompt').textContent = '“' + text + '”';
    progress(0);
    $('buildCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    var ctx = {
      text: text,
      plan: preset || null,
      manual: !!preset,
      theme: function () { return F.THEMES[(ctx.plan && ctx.plan.themeId) || 'chalkboard']; }
    };

    for (var i = 0; i < STAGES.length; i += 1) {
      var stage = STAGES[i];
      var li = logLine(stage.title);
      await sleep(fast ? 90 : 260 + Math.random() * 220);
      if (stage.run) {
        try {
          stage.run(ctx);
        } catch (err) {
          finishLine(li, 'Something went wrong here: ' + esc(err.message) + '. Try rewording the prompt.');
          li.className = 'ok';
          S.busy = false;
          $('build').disabled = false;
          return;
        }
      }
      if (i === 0) { tint(ctx.theme()); }
      finishLine(li, stage.detail(ctx));
      if (stage.art) {
        var a = stage.art(ctx);
        addArt(a[0], a[1]);
      }
      progress(((i + 1) / STAGES.length) * 100);
      await sleep(fast ? 40 : 150);
    }

    S.plan = ctx.plan;
    S.spec = ctx.spec;
    S.html = ctx.html;
    await sleep(fast ? 60 : 350);
    showResult();
    S.busy = false;
    $('build').disabled = false;
  }

  /* ================================================================ result */

  function showResult() {
    var spec = S.spec;
    $('doneCard').hidden = false;
    $('gameTitle').textContent = spec.title;
    $('previewName').textContent = slug(spec.title) + '.html';

    var metas = [
      ['Shape', F.MODES[spec.mode].name],
      ['Level', F.BAND_LABEL[spec.band]],
      ['Subject', spec.subjectName],
      ['Teams', String(spec.teams.length)],
      [spec.mode === 'bingo' ? 'Clues' : 'Questions', String(spec.questions.length)],
      ['Timer', spec.timer ? spec.timer + 's' : 'off'],
      ['File', kb(S.html.length)]
    ];
    $('metas').innerHTML = metas.map(function (m) {
      return '<span class="meta">' + esc(m[0]) + ' <b>' + esc(m[1]) + '</b></span>';
    }).join('');

    $('preview').srcdoc = S.html;
    $('preview').setAttribute('allowfullscreen', '');
    $('downloadNote').textContent = 'Saves as ' + slug(spec.title) + '.html · ' + kb(S.html.length);
    buildTweaks();
    $('doneCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function fileURL() {
    if (S.url) { URL.revokeObjectURL(S.url); }
    S.url = URL.createObjectURL(new Blob([S.html], { type: 'text/html;charset=utf-8' }));
    return S.url;
  }

  /* =============================================================== tweaks */

  function select(label, value, options, onChange) {
    var wrapEl = document.createElement('div');
    wrapEl.className = 'field';
    var id = 'f-' + slug(label);
    wrapEl.innerHTML = '<label for="' + id + '">' + esc(label) + '</label>';
    var sel = document.createElement('select');
    sel.id = id;
    options.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = String(o[0]);
      opt.textContent = o[1];
      if (String(o[0]) === String(value)) { opt.selected = true; }
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () { onChange(sel.value); });
    wrapEl.appendChild(sel);
    return wrapEl;
  }

  function buildTweaks() {
    var t = $('tweaks');
    t.innerHTML = '';
    var plan = S.plan;

    var titleField = document.createElement('div');
    titleField.className = 'field';
    titleField.innerHTML = '<label for="f-title">Name</label>';
    var titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.id = 'f-title';
    titleInput.value = plan.title;
    titleInput.addEventListener('input', function () {
      plan.title = titleInput.value || 'Class Game';
      plan.titleTouched = true;
    });
    titleField.appendChild(titleInput);
    t.appendChild(titleField);

    var subjects = [['mixed', 'A bit of everything']].concat(
      Object.keys(F.BANK).map(function (k) { return [k, F.BANK[k].name]; })
    );
    t.appendChild(select('Subject', plan.subject, subjects, function (v) { plan.subject = v; }));
    t.appendChild(select('Level', plan.band, Object.keys(F.BAND_LABEL).map(function (b) {
      return [b, F.BAND_LABEL[b]];
    }), function (v) { plan.band = v; }));
    t.appendChild(select('Game shape', plan.mode, Object.keys(F.MODES).map(function (m) {
      return [m, F.MODES[m].name];
    }), function (v) { plan.mode = v; }));

    var teamOpts = [];
    for (var n = 2; n <= 10; n += 1) { teamOpts.push([n, n + ' teams']); }
    t.appendChild(select('Teams', plan.teamCount, teamOpts, function (v) { plan.teamCount = parseInt(v, 10); }));
    t.appendChild(select('Timer', plan.timer, [
      [0, 'No timer'], [10, '10 seconds'], [15, '15 seconds'], [20, '20 seconds'],
      [30, '30 seconds'], [45, '45 seconds'], [60, '60 seconds']
    ], function (v) { plan.timer = parseInt(v, 10); }));

    if (plan.mode === 'buzzer') {
      var roundOpts = [];
      [8, 10, 12, 15, 20, 25, 30].forEach(function (r) { roundOpts.push([r, r + ' questions']); });
      t.appendChild(select('Length', plan.rounds, roundOpts, function (v) { plan.rounds = parseInt(v, 10); }));
    }
    t.appendChild(select('Look', plan.themeId, Object.keys(F.THEMES).map(function (k) {
      return [k, F.THEMES[k].name];
    }), function (v) { plan.themeId = v; }));

    if (plan.mode === 'bingo') {
      var sizeOpts = [];
      for (var cs = 8; cs <= 40; cs += 2) { sizeOpts.push([cs, cs + ' students']); }
      t.appendChild(select('Cards to print', plan.classSize, sizeOpts, function (v) {
        plan.classSize = parseInt(v, 10);
      }));
    }

    [['showChoices', 'Show multiple-choice options'], ['negative', 'Wrong answers lose points']].forEach(function (pair) {
      var f = document.createElement('div');
      f.className = 'field check';
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = 'f-' + pair[0];
      cb.checked = !!plan[pair[0]];
      cb.addEventListener('change', function () { plan[pair[0]] = cb.checked; });
      var lb = document.createElement('label');
      lb.setAttribute('for', cb.id);
      lb.textContent = pair[1];
      f.appendChild(cb);
      f.appendChild(lb);
      t.appendChild(f);
    });

    var go = document.createElement('button');
    go.className = 'btn primary';
    go.textContent = 'Rebuild with these settings';
    go.addEventListener('click', function () {
      if (!plan.titleTouched) { plan.title = F.retitle(plan); }
      build(plan.prompt || $('prompt').value, { fast: true, plan: plan });
    });
    t.appendChild(go);
  }

  /* ================================================================= wiring */

  function init() {
    F.EXAMPLES.forEach(function (ex) {
      var b = document.createElement('button');
      b.className = 'chip';
      b.type = 'button';
      b.textContent = ex;
      b.addEventListener('click', function () {
        $('prompt').value = ex;
        $('prompt').focus();
      });
      $('examples').appendChild(b);
    });

    $('build').addEventListener('click', function () {
      var text = $('prompt').value.trim();
      if (!text) {
        text = F.EXAMPLES[0];
        $('prompt').value = text;
      }
      build(text, {});
    });

    $('surprise').addEventListener('click', function () {
      var ex = F.EXAMPLES[Math.floor(Math.random() * F.EXAMPLES.length)];
      $('prompt').value = ex;
      build(ex, {});
    });

    $('prompt').addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { $('build').click(); }
    });

    $('download').addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = fileURL();
      a.download = slug(S.spec.title) + '.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      $('downloadNote').textContent = 'Saved. On iPhone or iPad look in Files › Downloads.';
    });

    $('openTab').addEventListener('click', function () {
      var win = window.open(fileURL(), '_blank');
      if (!win) {
        $('downloadNote').textContent = 'Safari blocked the new tab — allow pop-ups for this site, or just download the file.';
      }
    });

    $('tweak').addEventListener('click', function () {
      var t = $('tweaks');
      t.hidden = !t.hidden;
      $('tweak').textContent = t.hidden ? 'Change something' : 'Hide settings';
    });

    $('again').addEventListener('click', function () {
      $('promptCard').hidden = false;
      $('buildCard').hidden = true;
      $('doneCard').hidden = true;
      $('prompt').value = '';
      $('prompt').focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}(window.FORGE));
