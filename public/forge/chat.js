/* Game Forge — the chat.
 *
 * It asks for the things only you know, but it is not a form: "why?",
 * "what do you mean?", "like what?", "you pick" and "can it do X?" all get a
 * real answer, and then it picks the thread back up where it left off.
 */
(function (F) {
  'use strict';

  var S = F.SITE;
  var B = F.BRAIN;
  var messages = document.getElementById('messages');
  var input = document.getElementById('say');
  var sendBtn = document.getElementById('send');

  var A = {};           /* answers so far */
  var queue = [];       /* question ids still to ask */
  var history = [];     /* question ids already answered, for "go back" */
  var current = null;
  var built = false;
  var busy = false;
  var lastHTML = '';
  var lastName = 'website';
  var blobURL = null;
  var AI = F.AI;
  var aiMode = false;      /* a model is answering, not the script */
  var aiTurns = 0;

  /* ------------------------------------------------------------ helpers */
  function sleep(ms) { return new Promise(function (r) { window.setTimeout(r, ms); }); }
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'website';
  }
  function scrollDown() {
    window.requestAnimationFrame(function () { window.scrollTo(0, document.body.scrollHeight); });
  }
  function shorten(s, n) {
    return s.length > n ? s.slice(0, n - 1).replace(/[\s,.:;-]+$/, '') + '…' : s;
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
      if (!line) { return; }
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

  function clearChips() {
    [].forEach.call(messages.querySelectorAll('.chips'), function (n) { n.remove(); });
  }

  function addChips(bubble, chips, onPick) {
    var row = document.createElement('div');
    row.className = 'chips';
    chips.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.appendChild(document.createTextNode(c.label));
      b.addEventListener('click', function () {
        clearChips();
        youSaid(c.say || c.value || c.label);
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
    await sleep(ms || 400);
    bubble.parentNode.remove();
  }

  /* ------------------------------------------------------------ questions */
  var THEME_CHIPS = Object.keys(S.THEMES).map(function (id) {
    return { label: S.THEMES[id].name, value: id };
  });

  function questionFor(id) {
    var type = S.TYPES[A.type] || S.TYPES.business;
    if (id === 'more') {
      return {
        ask: 'Anything else you would like on the page?',
        hint: 'A sentence or two in your own words. Or say skip.',
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
        hint: 'Number of teams and how long you want it all help too.',
        placeholder: 'e.g. Year 5 science, 5 teams, 20 second timer'
      };
    }
    if (id === 'gameshape') {
      return {
        ask: 'And what kind of game?',
        chips: [
          { label: 'Buzz-in quiz', value: 'buzzer quiz' },
          { label: 'Points board', value: 'jeopardy points board categories' },
          { label: 'Printable bingo', value: 'bingo' }
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

  function askCurrent(lead) {
    var q = questionFor(current);
    var bubble = say(lead ? [lead, q.ask] : q.ask, q.hint);
    input.placeholder = q.placeholder || 'Type your answer…';
    if (q.chips) {
      input.placeholder = 'Or type your own…';
      addChips(bubble, q.chips, function (c) { accept(c.value || c.label); });
    }
    input.focus();
    return bubble;
  }

  async function nextQuestion() {
    if (!queue.length) { return buildIt(); }
    current = queue.shift();
    await typing();
    askCurrent();
  }

  function flowFor(typeId) {
    return S.TYPES[typeId].isGame
      ? ['gamebrief', 'gameshape']
      : ['name', 'tagline', 'items', 'contact', 'more', 'theme'];
  }

  /* --------------------------------------------------- asides and replies */
  /* An aside answers the question they asked, then puts the thread back
     where it was so nothing is lost. */
  var LEADS = ['So — back to it.', 'Right, where were we.', 'Anyway —', 'Back to you.', 'Carrying on:'];
  var leadAt = 0;
  function nextLead() {
    var lead = LEADS[leadAt % LEADS.length];
    leadAt += 1;
    return lead;
  }

  async function aside(lines, hint) {
    await typing(380);
    say(lines, hint);
    if (built || !current) { return; }
    await sleep(320);
    askCurrent(nextLead());
  }

  function saidSoFar() {
    return [A.brief, A.name, A.tagline, A.items].filter(Boolean).join(' ');
  }

  async function offerExamples() {
    var ideas = B.examplesFor(current, A.type, saidSoFar());
    await typing(420);
    if (!ideas.length) {
      if (current === 'name') {
        return aside(
          'This is the one I genuinely cannot invent — it is your name for it, and it goes at the top of every screen.',
          'If it truly has no name yet, type anything now and reword it later with the Edit text button.'
        );
      }
      return aside(B.mean(current));
    }
    var bubble = say('Something like these — tap one to use it, or type your own.');
    addChips(bubble, ideas.map(function (t) {
      return { label: shorten(t, 58), value: t, say: t };
    }), function (c) { accept(c.value); });
    input.placeholder = 'Or type your own…';
  }

  async function delegate() {
    var ideas = B.examplesFor(current, A.type, saidSoFar());
    if (current === 'name') {
      return aside(
        'Happy to write the rest, but not this one — the name has to be yours. It is the title of the page and the first thing anyone reads.',
        'Anything will do for now; you can change it in the finished file.'
      );
    }
    if (!ideas.length) { return aside(B.mean(current)); }
    await typing(420);
    say(['Done — I have put this in:', ideas[0]], 'Change it later with the Edit text button, any time.');
    await sleep(240);
    accept(ideas[0], true);
  }

  function progressLine() {
    var left = queue.length + (current ? 1 : 0);
    if (built) { return 'All done — the site is above. Anything you say now I will treat as a change to it.'; }
    if (left <= 1) { return 'This is the last one, then I build it.'; }
    return left + ' questions left, including this one. You can say skip to most of them.';
  }

  async function goBack() {
    if (!history.length) {
      return aside('We are still on the first question, so there is nothing behind us yet.');
    }
    var prev = history.pop();
    if (current) { queue.unshift(current); }
    current = prev;
    delete A[prev];
    await typing(340);
    askCurrent('Of course — let us do that one again.');
  }

  /* -------------------------------------------------------- taking answers */
  function accept(value, quiet) {
    if (current === 'theme') { A.theme = value; }
    else { A[current] = value; }
    history.push(current);
    current = null;
    if (quiet) { return nextQuestion(); }
    return nextQuestion();
  }

  function handle(text) {
    var res = B.classify(text, { qid: current });

    if (!A.type) {
      /* Before a type is chosen, questions about the tool still deserve a
         real answer rather than being read as "a website about why". */
      if (res.intent === 'capability' || res.intent === 'mean' || res.intent === 'why') {
        var ans = B.capability(text);
        return aside(ans || (res.intent === 'capability' ? B.capabilityFallback
          : 'Tell me roughly what the page is for and I will take it from there — "a page for my mum’s bakery", "a quiz for my class", "somewhere to put my photos".'));
      }
      return pickType(text);
    }

    switch (res.intent) {
      case 'why': return aside(B.why(current));
      case 'mean': return aside(B.mean(current));
      case 'example': return offerExamples();
      case 'delegate': return delegate();
      case 'choice': return aside(B.choice(text));
      case 'capability': return aside(B.capability(text) || B.capabilityFallback);
      case 'progress': return aside(progressLine());
      case 'back': return goBack();
      case 'empty': return;
      default: break;
    }

    var q = questionFor(current);
    /* Offline, a whole paragraph typed at the name question becomes the page
       title and the filename. The model handles this properly; the script has
       to ask. */
    if (current === 'name' && text.length > 52) {
      return aside('That is a lot to put at the top of the page. What is it actually called, in a few words?',
        'Everything else you just told me is welcome \u2014 I will ask for it in a moment.');
    }
    if (res.intent === 'skip') {
      if (!q.optional) {
        return aside('I do need this one — without it the page has a hole in it where the ' + current + ' should be.',
          'Say "you pick" and I will write something you can change later.');
      }
      return accept('skip');
    }
    return accept(text);
  }

  async function pickType(text) {
    A.brief = text;
    var guess = S.detectType(text);
    if (!guess) {
      await typing();
      var bubble = say('I can build any of these — which is closest?');
      addChips(bubble, Object.keys(S.TYPES).map(function (id) {
        return { label: S.TYPES[id].name, value: id, say: S.TYPES[id].name };
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
    say(t.name + '. ' + t.blurb,
      'A few short questions. Ask me anything as we go — "why?", "like what?", or "you pick" all work.');
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
      li.innerHTML = '<b class="tick"></b>';
      li.appendChild(document.createTextNode(stepNames[i]));
      list.appendChild(li);
      scrollDown();
      await sleep(230);
    }

    lastHTML = html;
    lastName = slug(title);
    showResult(title);
    busy = false;
    sendBtn.disabled = false;
    built = true;
    current = null;
    input.placeholder = 'Want a change? Tell me…';
    if (aiMode) { AI.push('assistant', 'I built the site and showed it to them.'); }
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
      + 'Or tell me here: "make it darker", "add a line about the garden", or ask me anything.';
    frag.appendChild(note);

    var bubble = msg('bot', frag);
    if (!S.TYPES[A.type].isGame) {
      addChips(bubble, THEME_CHIPS, function (c) { restyle(c.value); });
    }
  }

  function restyle(themeId) {
    A.theme = themeId;
    buildIt('New look coming up.');
  }

  /* Once a site exists, a message is either a question or a change. */
  function followUp(text) {
    if (aiMode) { return aiTurn(text); }
    var res = B.classify(text, { qid: null });
    if (res.intent === 'capability') { return aside(B.capability(text) || B.capabilityFallback); }
    if (res.intent === 'choice') { return aside(B.choice(text)); }
    if (res.intent === 'progress') { return aside(progressLine()); }
    if (res.intent === 'why' || res.intent === 'mean') {
      return aside('The site above is built from what you told me. Tell me what to change and I will rebuild it — '
        + 'a different look ("make it darker"), or another line of text and I will add it to the page.');
    }
    var theme = S.detectTheme(text);
    if (theme) { return restyle(theme); }
    if (S.TYPES[A.type].isGame) {
      A.gamebrief = (A.gamebrief || '') + ' ' + text;
      return buildIt('Rebuilding with that.');
    }
    A.more = (A.more && !S.isSkip(A.more) ? A.more + '\n' : '') + text;
    buildIt('Added that in.');
  }

  /* ------------------------------------------------------------ AI turns */
  /* The model fills the same fields the script fills, then the browser builds
     the page. If a turn fails we say so once and finish on the script rather
     than stranding someone mid-conversation. */
  async function aiTurn(text) {
    busy = true;
    sendBtn.disabled = true;
    AI.push('user', text);

    var dots = document.createElement('div');
    dots.className = 'typing';
    dots.innerHTML = '<i></i><i></i><i></i>';
    var waiting = msg('bot', dots);

    var out;
    try {
      out = await AI.turn(A);
    } catch (err) {
      waiting.parentNode.remove();
      busy = false;
      sendBtn.disabled = false;
      aiMode = false;
      say('I lost my connection there, so I will carry on the simple way.',
        err && err.message ? err.message : '');
      if (!A.type) { return pickType(text); }
      queue = flowFor(A.type).filter(function (q) { return !A[q] && q !== 'theme'; });
      return nextQuestion();
    }

    waiting.parentNode.remove();
    Object.keys(out.patch).forEach(function (k) { A[k] = out.patch[k]; });
    say(out.reply);
    busy = false;
    sendBtn.disabled = false;

    /* The model decides when there is enough; second-guessing it made the
       conversation lurch into a build mid-question. buildable() is only a
       backstop for an interview that will not end. */
    aiTurns += 1;
    var stalled = aiTurns >= 10 && AI.buildable(A);
    if ((out.ready || stalled) && !built) {
      if (!A.theme) { A.theme = S.detectTheme(A.brief || A.tagline || '') || 'calm'; }
      return buildIt('');
    }
    input.focus();
  }

  /* --------------------------------------------------------------- input */
  function submit() {
    var text = input.value.trim();
    if (!text || busy) { return; }
    input.value = '';
    resize();
    youSaid(text);
    clearChips();
    if (aiMode) { return aiTurn(text); }
    if (built) { return followUp(text); }
    handle(text);
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

  /* ------------------------------------------------------------ kick off */
  async function hello() {
    var preset = (window.location.search.match(/[?&]kind=([^&]+)/) || [])[1];
    preset = preset ? decodeURIComponent(preset) : '';

    aiMode = await AI.probe();
    if (aiMode) {
      AI.reset();
      await typing(300);
      if (preset && S.TYPES[preset]) {
        A.type = preset;
        AI.push('user', 'I want ' + S.TYPES[preset].name.toLowerCase() + '.');
        say('Hello. Let us build you ' + S.TYPES[preset].name.toLowerCase() + '.',
          'Tell me about it in your own words and I will only ask for what is missing.');
      } else {
        say(['Hello. I build websites \u2014 one page, one file, yours to keep.',
          'Tell me what you want one for, in as much or as little detail as you like.'],
          'Say it all in one go if you want. I will only ask for what you leave out.');
      }
      input.focus();
      return;
    }

    await typing(300);
    if (preset && S.TYPES[preset]) {
      say('Hello. Let us build you ' + S.TYPES[preset].name.toLowerCase() + '.');
      A.brief = S.TYPES[preset].name;
      return startType(preset);
    }
    var bubble = say(
      ['Hello. I build websites — one page, one file, yours to keep.', 'What do you want one for?'],
      'Say it however you like. If you would rather ask me something first, go ahead.'
    );
    addChips(bubble, Object.keys(S.TYPES).slice(0, 6).map(function (id) {
      return { label: S.TYPES[id].name, value: id, say: S.TYPES[id].name };
    }), function (c) { A.brief = S.TYPES[c.value].name; startType(c.value); });
    input.focus();
  }

  hello();
}(window.FORGE));
