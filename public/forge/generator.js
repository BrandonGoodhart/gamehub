/* Game Forge — turns a plain-English prompt into a finished, standalone game file.
 *
 * Three stages, each usable on its own:
 *   parsePrompt(text) -> plan   (what the teacher seems to want; editable in the UI)
 *   buildSpec(plan)   -> spec   (a concrete game: questions, teams, theme, rules)
 *   buildGame(spec)   -> string (one self-contained .html file)
 */
window.FORGE = window.FORGE || {};

(function (F) {
  'use strict';

  /* ------------------------------------------------------------- themes */
  F.THEMES = {
    midnight: {
      name: 'Midnight', bg: '#0c1020', panel: '#151b32', line: '#2a3358', ink: '#eef1ff',
      dim: '#98a2cc', accent: '#7c8cff', accent2: '#c07dff', ok: '#3ddc97', bad: '#ff6b81'
    },
    chalkboard: {
      name: 'Chalkboard', bg: '#16241f', panel: '#1e3029', line: '#35544a', ink: '#f4f1e4',
      dim: '#9fb8ac', accent: '#ffd76a', accent2: '#7fd1a3', ok: '#7fd1a3', bad: '#ff8d6b'
    },
    neon: {
      name: 'Neon Arcade', bg: '#08090f', panel: '#12141f', line: '#2b2f45', ink: '#f3f6ff',
      dim: '#8d93ad', accent: '#c6ff4f', accent2: '#ff4fd8', ok: '#c6ff4f', bad: '#ff5470'
    },
    sunrise: {
      name: 'Sunrise', bg: '#1a1024', panel: '#261635', line: '#432a56', ink: '#fff2ef',
      dim: '#bda3c4', accent: '#ff9a52', accent2: '#ff5f9e', ok: '#5fd6a5', bad: '#ff5f6e'
    },
    ocean: {
      name: 'Deep Ocean', bg: '#061a26', panel: '#0f2b3a', line: '#164a63', ink: '#eaf8ff',
      dim: '#8fb6c8', accent: '#3ad2ff', accent2: '#5df2c4', ok: '#5df2c4', bad: '#ff7a8a'
    },
    forest: {
      name: 'Forest', bg: '#0e1a14', panel: '#152920', line: '#274538', ink: '#edfbf2',
      dim: '#96b8a4', accent: '#68e08a', accent2: '#d8e35a', ok: '#68e08a', bad: '#ff8080'
    },
    candy: {
      name: 'Candy Lab', bg: '#1b0f22', panel: '#2a1734', line: '#472a55', ink: '#fff0fb',
      dim: '#c3a3cd', accent: '#ff74c3', accent2: '#ffd95e', ok: '#66e2b0', bad: '#ff6161'
    },
    retro: {
      name: 'Retro Desk', bg: '#191410', panel: '#241d17', line: '#443628', ink: '#fdf3e3',
      dim: '#bda887', accent: '#ffb648', accent2: '#8fd4c5', ok: '#8fd4c5', bad: '#ff7a5c'
    }
  };

  F.PALETTE = [
    '#ff6b6b', '#4dabf7', '#ffd43b', '#51cf66', '#cc5de8',
    '#ff922b', '#22b8cf', '#f06595', '#94d82d', '#845ef7'
  ];

  F.TEAM_NAMES = [
    'Red Foxes', 'Blue Comets', 'Gold Lions', 'Green Dragons', 'Purple Owls',
    'Orange Tigers', 'Teal Sharks', 'Pink Falcons', 'Lime Rockets', 'Violet Wolves'
  ];

  /* --------------------------------------------------------- vocabulary */
  var SUBJECT_WORDS = {
    math: ['math', 'maths', 'mathematics', 'arithmetic', 'algebra', 'geometry', 'fraction', 'multiplication', 'times tables', 'number', 'calculus', 'counting', 'shape', 'addition', 'subtraction', 'division', 'place value'],
    science: ['science', 'biology', 'chemistry', 'physics', 'scientific', 'cells', 'matter', 'experiment', 'periodic', 'lab'],
    geography: ['geography', 'capitals', 'countries', 'continents', 'maps', 'world', 'states', 'rivers', 'oceans'],
    history: ['history', 'historical', 'social studies', 'civics', 'revolution', 'ancient', 'war', 'presidents', 'government'],
    words: ['vocabulary', 'vocab', 'spelling', 'spell', 'grammar', 'words', 'language arts', 'ela', 'synonyms', 'prefix', 'suffix'],
    reading: ['reading', 'literature', 'books', 'novel', 'story', 'poetry', 'shakespeare', 'author', 'literary'],
    animals: ['animals', 'animal', 'nature', 'wildlife', 'zoo', 'habitat', 'ecosystem', 'creatures'],
    space: ['space', 'astronomy', 'planets', 'solar system', 'stars', 'galaxy', 'nasa', 'universe'],
    tech: ['technology', 'tech', 'computer', 'computers', 'coding', 'code', 'programming', 'digital', 'internet', 'stem'],
    arts: ['art', 'arts', 'music', 'painting', 'artists', 'band', 'orchestra', 'drawing'],
    sports: ['sports', 'sport', 'pe', 'physical education', 'athletics', 'olympics', 'football', 'soccer', 'basketball']
  };

  /* Filler subjects used to round out a board with five categories. */
  var NEIGHBOURS = {
    math: ['science', 'tech', 'space', 'sports'],
    science: ['space', 'animals', 'tech', 'geography'],
    geography: ['history', 'animals', 'science', 'sports'],
    history: ['geography', 'reading', 'arts', 'words'],
    words: ['reading', 'history', 'arts', 'science'],
    reading: ['words', 'history', 'arts', 'geography'],
    animals: ['science', 'geography', 'space', 'arts'],
    space: ['science', 'math', 'tech', 'geography'],
    tech: ['math', 'science', 'space', 'words'],
    arts: ['reading', 'history', 'words', 'sports'],
    sports: ['geography', 'history', 'math', 'arts']
  };

  var BAND_ORDER = ['early', 'elementary', 'middle', 'high'];
  var BAND_LABEL = {
    early: 'Kindergarten – Grade 2',
    elementary: 'Grades 3 – 5',
    middle: 'Grades 6 – 8',
    high: 'Grades 9 – 12'
  };

  var NUMBER_WORDS = {
    two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30
  };

  F.BAND_LABEL = BAND_LABEL;

  F.MODES = {
    board: {
      name: 'Points Board',
      blurb: 'Five categories, five point values. Teams pick a square, you read the clue.',
      best: 'Best for review days and whole-class play on a projector.'
    },
    buzzer: {
      name: 'Buzz-In Quiz',
      blurb: 'One big question at a time. First team to buzz gets to answer.',
      best: 'Best for fast, loud, Kahoot-style rounds.'
    },
    bingo: {
      name: 'Review Bingo',
      blurb: 'Every student gets a different card. You read clues, they cover answers.',
      best: 'Best when you want all thirty kids busy at once.'
    }
  };

  /* --------------------------------------------------------------- parse */
  /* Whole-word matching, with an optional plural 's'. Substring matching
     looks fine until "kindergarten" trips the art keyword and "chalkboard"
     turns a buzzer game into a points board. */
  var reCache = {};
  function wordRe(word) {
    if (!reCache[word]) {
      var safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      reCache[word] = new RegExp('(^|[^a-z0-9])' + safe + 's?([^a-z0-9]|$)', 'i');
    }
    return reCache[word];
  }
  function hits(text, word) { return wordRe(word).test(text) ? 1 : 0; }
  function has(text, list) {
    for (var i = 0; i < list.length; i += 1) {
      if (hits(text, list[i])) { return true; }
    }
    return false;
  }

  function numberNear(text, patterns) {
    for (var i = 0; i < patterns.length; i += 1) {
      var m = text.match(patterns[i]);
      if (m) {
        var raw = m[1];
        var n = NUMBER_WORDS[raw] !== undefined ? NUMBER_WORDS[raw] : parseInt(raw, 10);
        if (!isNaN(n)) { return n; }
      }
    }
    return null;
  }

  F.parsePrompt = function (input) {
    var text = String(input || '').toLowerCase();
    var notes = [];

    /* subject */
    var subject = 'mixed';
    var bestHits = 0;
    Object.keys(SUBJECT_WORDS).forEach(function (key) {
      var hitCount = 0;
      SUBJECT_WORDS[key].forEach(function (w) { hitCount += hits(text, w); });
      if (hitCount > bestHits) { bestHits = hitCount; subject = key; }
    });
    notes.push(bestHits
      ? { label: 'Subject', value: F.BANK[subject].name, why: 'you mentioned it by name' }
      : { label: 'Subject', value: 'A bit of everything', why: 'no subject named, so the mix stays broad' });

    /* grade band */
    var band = null;
    var gradeNum = numberNear(text, [
      /grade\s*(\d{1,2})/, /(\d{1,2})(?:st|nd|rd|th)\s*grade/, /year\s*(\d{1,2})/
    ]);
    if (gradeNum !== null) {
      if (gradeNum <= 2) { band = 'early'; }
      else if (gradeNum <= 5) { band = 'elementary'; }
      else if (gradeNum <= 8) { band = 'middle'; }
      else { band = 'high'; }
    }
    if (!band && has(text, ['kindergarten', 'kinder', 'preschool', 'little kids', 'littles', 'youngest', 'first grade', 'second grade'])) { band = 'early'; }
    if (!band && has(text, ['elementary', 'primary', 'third grade', 'fourth grade', 'fifth grade'])) { band = 'elementary'; }
    if (!band && has(text, ['middle school', 'middle schooler', 'junior high', 'sixth grade', 'seventh grade', 'eighth grade'])) { band = 'middle'; }
    if (!band && has(text, ['high school', 'high schooler', 'highschool', 'freshman', 'sophomore', 'junior year', 'senior', 'college'])) { band = 'high'; }
    if (!band) {
      band = 'elementary';
      notes.push({ label: 'Level', value: BAND_LABEL[band], why: 'no grade given, so this is the safe middle' });
    } else {
      notes.push({ label: 'Level', value: BAND_LABEL[band], why: 'picked up from the grade you mentioned' });
    }

    /* game shape */
    var mode = 'buzzer';
    var modeWhy = 'trivia with buzzers is the closest thing to the games your class already knows';
    if (has(text, ['bingo'])) { mode = 'bingo'; modeWhy = 'you asked for bingo'; }
    else if (has(text, ['jeopardy', 'board', 'categories', 'category', 'point values', 'grid', 'review game', 'quiz bowl'])) {
      mode = 'board'; modeWhy = 'a points board matches what you described';
    } else if (has(text, ['buzz', 'buzzer', 'kahoot', 'fast', 'rapid', 'quick fire', 'race', 'blooket', 'gimkit', 'quizizz'])) {
      mode = 'buzzer'; modeWhy = 'you wanted something fast and buzzer-driven';
    }
    notes.push({ label: 'Game shape', value: F.MODES[mode].name, why: modeWhy });

    /* class size and teams */
    var classSize = numberNear(text, [
      /(\d{1,3}|twenty|thirty|fifteen|twelve|ten)\s+(?:[a-z]+\s+){0,2}(?:kids|students|children|players|pupils|schoolers|graders|learners)/,
      /class of\s*(\d{1,3})/
    ]);
    var teamCount = numberNear(text, [/(\d{1,2}|two|three|four|five|six|seven|eight|nine|ten)\s*teams/]);
    if (!teamCount) {
      if (classSize) { teamCount = Math.max(2, Math.min(8, Math.round(classSize / 5))); }
      else { teamCount = 4; }
    }
    teamCount = Math.max(2, Math.min(10, teamCount));
    notes.push({
      label: 'Teams',
      value: teamCount + ' teams',
      why: classSize ? 'about ' + Math.ceil(classSize / teamCount) + ' kids per team for a class of ' + classSize : 'a good default for a full class'
    });

    /* timer */
    var timer = 30;
    if (has(text, ['no timer', 'without a timer', 'untimed', 'no time limit', 'relaxed', 'take their time'])) { timer = 0; }
    else if (has(text, ['fast', 'rapid', 'quick', 'speed', 'lightning'])) { timer = 15; }
    else if (has(text, ['slow', 'thoughtful', 'discussion', 'think time'])) { timer = 60; }
    var explicitTimer = numberNear(text, [/(\d{1,3})\s*second/]);
    if (explicitTimer) { timer = Math.max(5, Math.min(180, explicitTimer)); }

    /* length */
    var rounds = numberNear(text, [/(\d{1,2}|ten|twelve|fifteen|twenty|thirty)\s*(?:questions|rounds|clues)/]) || 15;
    rounds = Math.max(4, Math.min(40, rounds));

    /* theme */
    var themeId = { space: 'midnight', science: 'ocean', animals: 'forest', arts: 'candy', tech: 'neon', history: 'retro' }[subject] || 'chalkboard';
    var themeWords = {
      neon: ['neon', 'arcade', 'glow', 'cyber', 'video game'],
      ocean: ['ocean', 'sea', 'underwater', 'blue'],
      forest: ['forest', 'jungle', 'nature', 'green'],
      candy: ['candy', 'sweet', 'pink', 'fun', 'silly', 'colorful', 'colourful'],
      sunrise: ['sunrise', 'sunset', 'warm', 'orange'],
      retro: ['retro', 'vintage', 'old school', 'classic'],
      midnight: ['midnight', 'night', 'space', 'galaxy', 'dark'],
      chalkboard: ['chalk', 'chalkboard', 'blackboard', 'classroom']
    };
    var themeRank = ['neon', 'candy', 'retro', 'ocean', 'forest', 'sunrise', 'midnight', 'chalkboard'];
    for (var ti = 0; ti < themeRank.length; ti += 1) {
      if (has(text, themeWords[themeRank[ti]])) { themeId = themeRank[ti]; break; }
    }

    var negative = has(text, ['lose points', 'minus points', 'penalty', 'negative points']);
    var showChoices = !has(text, ['no multiple choice', 'open answer', 'short answer', 'write the answer']);

    return {
      prompt: String(input || '').trim(),
      subject: subject,
      band: band,
      mode: mode,
      teamCount: teamCount,
      classSize: classSize || 30,
      timer: timer,
      rounds: rounds,
      themeId: themeId,
      negative: negative,
      showChoices: showChoices,
      shuffle: true,
      title: titleFor(subject, mode, text),
      notes: notes
    };
  };

  function titleFor(subject, mode, text) {
    var named = text.match(/call(?:ed)? it ["“]?([^"”.!?]{2,40})/);
    if (named) { return titleCase(named[1].trim()); }
    var subjName = subject === 'mixed' ? 'Everything' : F.BANK[subject].name.replace(' & Spelling', '').replace(' & Literature', '').replace(' & Coding', '').replace(' & Music', '').replace(' & Nature', '');
    if (mode === 'bingo') { return subjName + ' Bingo'; }
    if (mode === 'board') { return subjName + ' Showdown'; }
    return subjName + ' Buzz'; 
  }

  /* Re-derive a name after the subject or shape is changed by hand. */
  F.retitle = function (plan) {
    return titleFor(plan.subject, plan.mode, String(plan.prompt || '').toLowerCase());
  };

  function titleCase(s) {
    return s.replace(/\w\S*/g, function (w) { return w.charAt(0).toUpperCase() + w.slice(1); });
  }

  /* ------------------------------------------------- question selection */
  function setFor(subjectKey, band) {
    var subj = F.BANK[subjectKey];
    if (!subj) { return []; }
    if (subj.sets[band]) { return subj.sets[band]; }
    /* walk outward to the nearest band this subject actually has */
    var at = BAND_ORDER.indexOf(band);
    for (var d = 1; d < BAND_ORDER.length; d += 1) {
      var lower = BAND_ORDER[at - d];
      var upper = BAND_ORDER[at + d];
      if (lower && subj.sets[lower]) { return subj.sets[lower]; }
      if (upper && subj.sets[upper]) { return subj.sets[upper]; }
    }
    return [];
  }

  function shuffled(list, rnd) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i -= 1) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function toQuestion(row, catName, points, rnd) {
    return {
      q: row[0],
      a: row[1],
      cat: catName,
      points: points,
      choices: shuffled([row[1], row[2], row[3], row[4]], rnd)
    };
  }

  function subjectsFor(plan, count) {
    if (plan.subject === 'mixed') {
      return ['science', 'geography', 'history', 'words', 'math', 'animals', 'space', 'arts'].slice(0, count);
    }
    var list = [plan.subject].concat(NEIGHBOURS[plan.subject] || []);
    var all = Object.keys(F.BANK);
    for (var i = 0; i < all.length && list.length < count; i += 1) {
      if (list.indexOf(all[i]) === -1) { list.push(all[i]); }
    }
    return list.slice(0, count);
  }

  /* Rows of a board get harder as the points go up: the cheap row borrows
     from the band below, the expensive rows from the band above. */
  function ladder(band) {
    var at = BAND_ORDER.indexOf(band);
    var below = BAND_ORDER[Math.max(0, at - 1)];
    var above = BAND_ORDER[Math.min(BAND_ORDER.length - 1, at + 1)];
    return [below, band, band, above, above];
  }

  F.buildSpec = function (plan) {
    var seed = 1;
    for (var i = 0; i < plan.prompt.length; i += 1) { seed = (seed * 31 + plan.prompt.charCodeAt(i)) % 2147483647; }
    seed = seed || 12345;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }

    var theme = F.THEMES[plan.themeId] || F.THEMES.chalkboard;
    var questions = [];
    var terms = [];

    if (plan.mode === 'board') {
      var cats = subjectsFor(plan, 5);
      var rows = ladder(plan.band);
      cats.forEach(function (key) {
        var name = F.BANK[key].name;
        var used = {};
        rows.forEach(function (rowBand, r) {
          var pool = shuffled(setFor(key, rowBand), rnd);
          var pick = null;
          for (var k = 0; k < pool.length; k += 1) {
            if (!used[pool[k][0]]) { pick = pool[k]; used[pool[k][0]] = true; break; }
          }
          if (!pick) { return; }
          questions.push(toQuestion(pick, name, (r + 1) * 100, rnd));
        });
      });
    } else if (plan.mode === 'buzzer') {
      var pool = [];
      subjectsFor(plan, plan.subject === 'mixed' ? 8 : 3).forEach(function (key, i) {
        var weight = i === 0 ? 3 : 1;
        for (var w = 0; w < weight; w += 1) {
          setFor(key, plan.band).forEach(function (row) { pool.push({ row: row, cat: F.BANK[key].name }); });
        }
      });
      var seen = {};
      shuffled(pool, rnd).forEach(function (entry) {
        if (questions.length >= plan.rounds || seen[entry.row[0]]) { return; }
        seen[entry.row[0]] = true;
        questions.push(toQuestion(entry.row, entry.cat, 100, rnd));
      });
    } else {
      /* bingo: short answers make the squares, the questions become the clues */
      var seenTerm = {};
      var seenClue = {};
      /* Preferred subjects first, then everything else, until there are
         enough short answers to fill a 24-square card. */
      var order = subjectsFor(plan, 6);
      Object.keys(F.BANK).forEach(function (k) { if (order.indexOf(k) === -1) { order.push(k); } });
      order.forEach(function (key) {
        BAND_ORDER.forEach(function (b) {
          (F.BANK[key].sets[b] || []).forEach(function (row) {
            if (terms.length >= 34) { return; }
            if (seenTerm[row[1]] || seenClue[row[0]] || row[1].length > 22) { return; }
            seenTerm[row[1]] = true;
            seenClue[row[0]] = true;
            terms.push({ term: row[1], clue: row[0] });
          });
        });
      });
      terms = shuffled(terms, rnd).slice(0, 30);
      questions = terms.map(function (t) {
        return { q: t.clue, a: t.term, cat: 'Bingo', points: 100, choices: null };
      });
    }

    var teams = [];
    for (var t = 0; t < plan.teamCount; t += 1) {
      teams.push({ name: F.TEAM_NAMES[t % F.TEAM_NAMES.length], color: F.PALETTE[t % F.PALETTE.length] });
    }

    var subjectName = plan.subject === 'mixed' ? 'Mixed review' : F.BANK[plan.subject].name;

    return {
      id: 'g' + Math.abs(seed).toString(36),
      title: plan.title,
      tagline: F.MODES[plan.mode].name + ' · ' + subjectName + ' · ' + BAND_LABEL[plan.band],
      prompt: plan.prompt,
      mode: plan.mode,
      subjectName: subjectName,
      band: plan.band,
      theme: theme,
      themeId: plan.themeId,
      palette: F.PALETTE,
      teamNames: F.TEAM_NAMES,
      teams: teams,
      timer: plan.timer,
      rounds: Math.min(plan.rounds, questions.length),
      shuffle: plan.shuffle,
      negative: plan.negative,
      showChoices: plan.showChoices,
      questions: questions,
      terms: terms,
      cardCount: Math.max(6, Math.min(40, plan.classSize || 30)),
      rules: rulesFor(plan)
    };
  };

  function rulesFor(plan) {
    var common = [
      'Put this on the big screen. You drive, the class plays.',
      plan.timer
        ? 'Each question has a <b>' + plan.timer + ' second</b> timer. Turn it off in the file any time.'
        : 'No timer — take as long as the class needs.'
    ];
    if (plan.mode === 'board') {
      return [
        'Teams take turns picking a square. Higher points, harder question.',
        'Read the clue out loud, then hit <b>Show the answer</b>.',
        'Tap the team that got it (or press its <b>number key</b>) to give the points.'
      ].concat(common);
    }
    if (plan.mode === 'buzzer') {
      return [
        'One question at a time on screen. Teams shout or raise hands to buzz.',
        'Press the buzzing team’s <b>number key</b> — or tap its colour block — to lock them in.',
        'Mark it <b>Correct</b> or <b>Wrong</b>, then move to the next question.'
      ].concat(common);
    }
    return [
      'Open <b>Print cards</b> and print one card per student. Every card is different.',
      'Switch to <b>Caller</b> and read clues one at a time.',
      'Students cover the matching answer. Five in a row wins.',
      'Everyone plays at once — nobody is waiting for a turn.'
    ];
  }

  /* ------------------------------------------------------------- output */
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* JSON destined for a <script> tag: neutralise '<' and the two line
     separators that are legal in JSON but illegal in JS source. */
  function jsonLiteral(obj) {
    var BS = String.fromCharCode(92);
    return JSON.stringify(obj)
      .split('<').join(BS + 'u003c')
      .split(String.fromCharCode(0x2028)).join(BS + 'u2028')
      .split(String.fromCharCode(0x2029)).join(BS + 'u2029');
  }

  function favicon(theme) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
      + '<rect width="32" height="32" rx="7" fill="' + theme.bg + '"/>'
      + '<circle cx="16" cy="16" r="7" fill="' + theme.accent + '"/></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  F.buildGame = function (spec) {
    var t = spec.theme;
    var vars = [
      '--bg:' + t.bg, '--panel:' + t.panel, '--line:' + t.line, '--ink:' + t.ink,
      '--dim:' + t.dim, '--accent:' + t.accent, '--accent2:' + t.accent2,
      '--ok:' + t.ok, '--bad:' + t.bad
    ].join(';');

    return [
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
      '<meta name="apple-mobile-web-app-capable" content="yes">',
      '<meta name="mobile-web-app-capable" content="yes">',
      '<meta name="theme-color" content="' + esc(t.bg) + '">',
      '<meta name="description" content="' + esc(spec.tagline) + '">',
      '<title>' + esc(spec.title) + '</title>',
      '<link rel="icon" href="' + esc(favicon(t)) + '">',
      '<link rel="apple-touch-icon" href="' + esc(favicon(t)) + '">',
      '<style>:root{' + vars + '}',
      F.RUNTIME_CSS,
      '</style>',
      '</head>',
      '<body>',
      '<div id="app"></div>',
      '<noscript style="display:block;padding:32px;font:16px/1.6 system-ui;color:' + esc(t.ink) + '">',
      'This game needs JavaScript switched on. In Safari: Settings → Apps → Safari → Advanced → JavaScript.',
      '</noscript>',
      '<script>',
      '/* ' + esc(spec.title) + ' — made with Game Forge from the prompt:',
      '   "' + String(spec.prompt || '').split('*/').join('* /') + '"',
      '   One file. No internet needed. Edit the questions from inside the game. */',
      'var FORGE_GAME = ' + jsonLiteral(spec) + ';',
      '(' + F.RUNTIME.toString() + ')(FORGE_GAME);',
      '<\/script>',
      '</body>',
      '</html>',
      ''
    ].join('\n');
  };

}(window.FORGE));
