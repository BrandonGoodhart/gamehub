/* Game Forge — the chat.
 *
 * A short scripted conversation that collects the details only the person
 * knows, then builds the site from them. Deliberately not an open-ended bot:
 * it asks, you answer, you get a website. Works offline, same as what it makes.
 */
(function (F) {
  'use strict';

  var S = F.SITE;
  var messages = document.getElementById('messages');
  var input = document.getElementById('say');
  var sendBtn = document.getElementById('send');

  var A = {};            /* the answers so far */
  var queue = [];        /* remaining question ids */
  var current = null;    /* the question on screen */
  var built = false;     /* a site exists, so replies are follow-ups */
  var busy = false;
  var lastHTML = '';
  var lastName = 'website';
  var blobURL = null;

  /* ------------------------------------------------------------ helpers */
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function sleep(ms) { return new Promise(function (r) { window.setTimeout(r, ms); }); }
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'website';
  }
  function scrollDown() {
    window.requestAnimationFrame(function () {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  function msg(side, node) {
    var row = document.createElement('div');
    row.className = 'msg ' + side;
    var who = document.createElement('span');
    who.className = 'who';
    who.textContent = side === 'bot' ? 'GF' : 'You';
    who.setAttribute('aria-hidden', 'true');
    var bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.appendChild(node);
    row.appendChild(who);
    row.appendChild(bubble);
    messages.appendChild(row);
    scrollDown();
    return bubble;
  }

  function say(lines, hint) {
    var frag = document.createDocumentFragment();
    (Array.isArray(lines) ? lines : [lines]).forEach(function (line) {
      var p = document.createElement('p');
      p.textContent = line;
      frag.appendChild(p);
    });
    if (hint) {
      var h = document.createElement('p');
      h.className = 'hint';
      h.textContent = hint;
      frag.appendChild(h);
    }
    return msg('bot', frag);
  }

  function youSaid(text) {
    var p = document.createElement('p');
    p.textContent = text;
    return msg('me', p);
  }

  function addChips(bubble, chips, onPick) {
    var row = document.createElement('div');
    row.className = 'chips';
    chips.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      if (c.emoji) {
        var e = document.createElement('span');
        e.className = 'e';
        e.textContent = c.emoji;
        b.appendChild(e);
      }
      b.appendChild(document.createTextNode(c.label));
      b.addEventListener('click', function () {
        row.remove();
        youSaid(c.label);
        onPick(c);
      });
      row.appendChild(b);
    });
    bubble.appendChild(row);
    scrollDown();
  }

  async function typing(ms) {
    var dots = document.createElement('div');
    dots.className = 'typing';
    dots.innerHTML = '<i></i><i></i><i></i>';
    var bubble = msg('bot', dots);
    await sleep(ms || 420);
    bubble.parentNode.remove();
  }

  function clearChips() {
    [].forEach.call(messages.querySelectorAll('.chips'), function (n) { n.remove(); });
  }

  /* ------------------------------------------------------------ questions */
  var THEME_CHIPS = Object.keys(S.THEMES).map(function (id) {
    return { label: S.THEMES[id].name, value: id };
  });

  function questionFor(id) {
    var type = S.TYPES[A.type];
    if (id === 'more') {
      return {
        ask: 'Anything else you would like on the page?',
        hint: 'A sentence or two about you. Or say skip.',
        placeholder: 'Say skip if you would rather not',
        optional: true
      };
    }
    if (id === 'theme') {
      return { ask: 'Last one — how should it look?', chips: THEME_CHIPS };
    }
    if (id === 'gamebrief') {
      return {
        ask: 'Tell me about the class — what subject, and what year group?',
        hint: 'Anything else helps too: how many teams, how long you want it.',
        placeholder: 'e.g. Year 5 science, 5 teams, 20 second timer'
      };
    }
    if (id === 'gameshape') {
      return {
        ask: 'And what kind of game?',
        chips: [
          { label: 'Buzz-in quiz', value: 'buzzer quiz', emoji: '⚡' },
          { label: 'Points board', value: 'jeopardy points board categories', emoji: '▦' },
          { label: 'Printable bingo', value: 'bingo', emoji: '🎯' }
        ]
      };
    }
    var pair = (type.ask || {})[id] || ['Tell me more.', ''];
    return {
      ask: pair[0],
      placeholder: pair[1],
      hint: (id === 'items' || id === 'contact') ? 'Say skip if you would rather not.' : '',
      optional: id === 'items' || id === 'contact'
    };
  }

  function flowFor(typeId) {
    return S.TYPES[typeId].isGame
      ? ['gamebrief', 'gameshape']
      : ['name', 'tagline', 'items', 'contact', 'more', 'theme'];
  }

  async function nextQuestion() {
    if (!queue.length) { return buildIt(); }
    current = queue.shift();
    var q = questionFor(current);
    await typing();
    var bubble = say(q.ask, q.hint);
    input.placeholder = q.placeholder || 'Type your answer…';
    if (q.chips) {
      input.placeholder = 'Or type your own…';
      addChips(bubble, q.chips, function (c) { answer(c.value || c.label, true); });
    }
    input.focus();
  }

  /* ------------------------------------------------------------- answers */
  function answer(text, fromChip) {
    if (busy) { return; }
    var value = String(text).trim();
    if (!fromChip) { youSaid(value); }
    clearChips();

    if (!A.type) { return pickType(value); }

    var q = questionFor(current);
    if (!value && !q.optional) {
      typing().then(function () { say('I need something for that one — even a rough answer works.'); });
      return;
    }
    if (current === 'theme') { A.theme = value; }
    else { A[current] = value; }
    nextQuestion();
  }

  async function pickType(text) {
    var guess = S.detectType(text);
    A.brief = text;
    if (!guess) {
      await typing();
      var bubble = say(
        'I can build any of these. Which is closest?',
        'Pick one and we will shape it from there.'
      );
      addChips(bubble, Object.keys(S.TYPES).map(function (id) {
        return { label: S.TYPES[id].name, value: id, emoji: S.TYPES[id].emoji };
      }), function (c) { startType(c.value); });
      return;
    }
    startType(guess);
  }

  async function startType(typeId) {
    A.type = typeId;
    var t = S.TYPES[typeId];
    var theme = S.detectTheme(A.brief || '');
    if (theme) { A.theme = theme; }
    queue = flowFor(typeId);
    if (A.theme) { queue = queue.filter(function (q) { return q !== 'theme'; }); }
    await typing(360);
    say(t.name + '. ' + t.blurb, 'A few quick questions and it is yours.');
    nextQuestion();
  }

  /* -------------------------------------------------------------- build */
  async function buildIt(note) {
    busy = true;
    sendBtn.disabled = true;
    input.placeholder = 'Building…';
    await typing(320);

    var bubble = say(note || 'Building it now.');
    var list = document.createElement('ul');
    list.className = 'steps-live';
    bubble.appendChild(list);

    var isGame = S.TYPES[A.type].isGame;
    var stepNames = isGame
      ? ['Reading what you told me', 'Picking the questions', 'Setting up the teams', 'Packing it into one file']
      : ['Working out the sections', 'Laying out the page', 'Choosing the colours', 'Packing it into one file'];

    var html = '';
    var title = '';
    try {
      if (isGame) {
        var plan = F.parsePrompt((A.gamebrief || '') + ' ' + (A.gameshape || ''));
        var gspec = F.buildSpec(plan);
        html = F.buildGame(gspec);
        title = gspec.title;
      } else {
        var spec = S.buildSpec(A);
        html = S.buildSite(spec);
        title = spec.title;
      }
    } catch (err) {
      busy = false;
      sendBtn.disabled = false;
      say('That one tripped me up: ' + err.message, 'Try rewording it, or hit Start over.');
      return;
    }

    for (var i = 0; i < stepNames.length; i += 1) {
      var li = document.createElement('li');
      li.innerHTML = '<b>✓</b>';
      li.appendChild(document.createTextNode(stepNames[i]));
      list.appendChild(li);
      scrollDown();
      await sleep(240);
    }

    lastHTML = html;
    lastName = slug(title);
    showResult(title);
    busy = false;
    sendBtn.disabled = false;
    built = true;
    input.placeholder = 'Want a change? Tell me…';
  }

  function fileURL() {
    if (blobURL) { URL.revokeObjectURL(blobURL); }
    blobURL = URL.createObjectURL(new Blob([lastHTML], { type: 'text/html;charset=utf-8' }));
    return blobURL;
  }

  function showResult(title) {
    var frag = document.createDocumentFragment();
    var p = document.createElement('p');
    p.textContent = 'Here it is.';
    frag.appendChild(p);

    var card = document.createElement('div');
    card.className = 'result';
    var head = document.createElement('div');
    head.className = 'head';
    head.innerHTML = '<span class="dot"></span>';
    head.appendChild(document.createTextNode(lastName + '.html'));
    card.appendChild(head);

    var frame = document.createElement('iframe');
    frame.title = 'Preview of ' + title;
    frame.setAttribute('allowfullscreen', '');
    frame.srcdoc = lastHTML;
    card.appendChild(frame);

    var acts = document.createElement('div');
    acts.className = 'acts';

    var dl = document.createElement('button');
    dl.type = 'button';
    dl.className = 'btn primary';
    dl.textContent = 'Download it';
    dl.addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = fileURL();
      a.download = lastName + '.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      dl.textContent = 'Saved';
      window.setTimeout(function () { dl.textContent = 'Download it'; }, 2200);
    });
    acts.appendChild(dl);

    var open = document.createElement('button');
    open.type = 'button';
    open.className = 'btn';
    open.textContent = 'Open in a new tab';
    open.addEventListener('click', function () {
      if (!window.open(fileURL(), '_blank')) {
        say('Safari blocked the new tab. Allow pop-ups for this site, or just download it.');
      }
    });
    acts.appendChild(open);
    card.appendChild(acts);
    frag.appendChild(card);

    var note = document.createElement('p');
    note.className = 'note';
    note.textContent = 'Download it and open it — on an iPhone or iPad it lands in Files › Downloads. '
      + 'The opened page has an Edit text button so you can reword anything yourself. '
      + 'Or tell me here: try "make it darker".';
    frag.appendChild(note);

    var bubble = msg('bot', frag);
    if (!S.TYPES[A.type].isGame) {
      addChips(bubble, THEME_CHIPS.map(function (c) {
        return { label: c.label, value: 'theme:' + c.value };
      }), function (c) { restyle(c.value.slice(6)); });
    }
  }

  function restyle(themeId) {
    A.theme = themeId;
    buildIt('New look coming up.');
  }

  /* Once a site exists, anything typed is a change request rather than an
     answer — the two things people actually ask for are a different look and
     another line of text. */
  function followUp(text) {
    var theme = S.detectTheme(text);
    if (theme) { return restyle(theme); }
    if (S.TYPES[A.type].isGame) {
      A.gamebrief = (A.gamebrief || '') + ' ' + text;
      return buildIt('Rebuilding with that.');
    }
    A.more = (A.more && !S.isSkip(A.more) ? A.more + '\n' : '') + text;
    buildIt('Added that in.');
  }

  /* --------------------------------------------------------------- input */
  function submit() {
    var text = input.value.trim();
    if (!text || busy) { return; }
    input.value = '';
    resize();
    if (built) { youSaid(text); clearChips(); return followUp(text); }
    answer(text);
  }

  function resize() {
    input.style.height = 'auto';
    input.style.height = Math.min(140, input.scrollHeight) + 'px';
  }

  input.addEventListener('input', resize);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  });
  sendBtn.addEventListener('click', submit);
  document.getElementById('restart').addEventListener('click', function () {
    window.location.href = 'chat.html';
  });

  /* ----------------------------------------------------------- kick off */
  async function hello() {
    var preset = (window.location.search.match(/[?&]kind=([^&]+)/) || [])[1];
    preset = preset ? decodeURIComponent(preset) : '';

    await typing(300);
    if (preset && S.TYPES[preset]) {
      say('Hello. Let us build you ' + S.TYPES[preset].name.toLowerCase() + '.');
      A.brief = S.TYPES[preset].name;
      return startType(preset);
    }
    var bubble = say(
      ['Hello. I build websites.', 'What do you want one for?'],
      'Say it however you like — "a page for my mum’s bakery", "a quiz for my class".'
    );
    addChips(bubble, Object.keys(S.TYPES).slice(0, 6).map(function (id) {
      return { label: S.TYPES[id].name, value: id, emoji: S.TYPES[id].emoji };
    }), function (c) { A.brief = S.TYPES[c.value].name; startType(c.value); });
    input.focus();
  }

  hello();
}(window.FORGE));
