/* Game Forge — the website builder.
 *
 * The chat collects real details from the person; this turns those answers into
 * a finished, single-file website. Blocks are composed per site type, so adding
 * a new type is a recipe, not new rendering code.
 */
window.FORGE = window.FORGE || {};

(function (F) {
  'use strict';

  var S = {};
  F.SITE = S;

  /* ------------------------------------------------------------- palettes */
  S.THEMES = {
    calm: {
      name: 'Calm', dark: false,
      bg: '#f7f8fb', surface: '#ffffff', ink: '#171b2b', dim: '#5d6479', line: '#e3e6ef',
      accent: '#4f5bd5', accentInk: '#ffffff', soft: '#eef0fb', font: 'sans'
    },
    fresh: {
      name: 'Fresh', dark: false,
      bg: '#ffffff', surface: '#f6fbf8', ink: '#0f2119', dim: '#4f6a5e', line: '#dceae3',
      accent: '#0f9d63', accentInk: '#ffffff', soft: '#e6f5ee', font: 'sans'
    },
    playful: {
      name: 'Playful', dark: false,
      bg: '#fffaf3', surface: '#ffffff', ink: '#2c1e14', dim: '#7a6152', line: '#f0e2d2',
      accent: '#ef5f4c', accentInk: '#ffffff', soft: '#ffeee6', font: 'round'
    },
    elegant: {
      name: 'Elegant', dark: false,
      bg: '#fbf9f4', surface: '#ffffff', ink: '#1d2420', dim: '#5f6b62', line: '#e6e2d6',
      accent: '#1f5c43', accentInk: '#f6f2e7', soft: '#edf1ec', font: 'serif'
    },
    bold: {
      name: 'Bold', dark: true,
      bg: '#0a0a0c', surface: '#141418', ink: '#f5f5f7', dim: '#9a9aa5', line: '#26262e',
      accent: '#d8ff3e', accentInk: '#0a0a0c', soft: '#1b1b21', font: 'sans'
    },
    night: {
      name: 'Night', dark: true,
      bg: '#0b1220', surface: '#121b2e', ink: '#eaf0ff', dim: '#8fa0c0', line: '#22304c',
      accent: '#4cc4ff', accentInk: '#06131f', soft: '#16233a', font: 'sans'
    }
  };

  var FONTS = {
    sans: 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
    serif: 'ui-serif,Georgia,"Iowan Old Style","Times New Roman",serif',
    round: 'ui-rounded,"SF Pro Rounded",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'
  };

  /* ---------------------------------------------------------- site types */
  /* Each type is a recipe: which blocks, in what order, with which labels.
     `ask` drives the chat, so a new type needs no new chat code. */
  S.TYPES = {
    business: {
      name: 'A small business', emoji: '🏪', theme: 'calm',
      blurb: 'Shop, salon, studio, tradesperson — what you do, and how to reach you.',
      ask: {
        name: ['What is the business called?', 'e.g. Ridgeway Bakehouse'],
        tagline: ['Say what you do in one line.', 'e.g. Sourdough and pastries, baked every morning'],
        items: ['List what you offer, separated by commas.', 'e.g. Sourdough loaves, Pastries, Celebration cakes'],
        contact: ['How do people reach you? (email, phone, address)', 'e.g. hello@ridgeway.co, 01234 567890']
      },
      labels: { items: 'What we do', about: 'About us', contact: 'Come and find us' },
      blocks: ['hero', 'cards', 'about', 'contact']
    },
    menu: {
      name: 'A cafe or restaurant', emoji: '🍽️', theme: 'elegant',
      blurb: 'A menu that reads beautifully on a phone at the table.',
      ask: {
        name: ['What is the place called?', 'e.g. The Blue Kettle'],
        tagline: ['Describe it in one line.', 'e.g. Small plates and long evenings'],
        items: ['List the menu. One per comma — "Dish: price" works too.', 'e.g. Focaccia: 6, Ricotta gnudi: 14, Tiramisu: 8'],
        contact: ['Opening hours and how to book.', 'e.g. Tue-Sun 5pm-11pm, book on 01234 567890']
      },
      labels: { items: 'The menu', about: 'The place', contact: 'Hours and bookings' },
      blocks: ['hero', 'list', 'about', 'contact']
    },
    event: {
      name: 'An event', emoji: '🎟️', theme: 'bold',
      blurb: 'Party, fundraiser, recital, launch — the details and how to RSVP.',
      ask: {
        name: ['What is the event called?', 'e.g. Spring Showcase 2026'],
        tagline: ['When and where is it?', 'e.g. Saturday 14 March, 7pm, Northgate Hall'],
        items: ['What happens? List the running order.', 'e.g. Doors open: 6:30, Performances: 7:00, Raffle: 9:00'],
        contact: ['How do people RSVP or ask questions?', 'e.g. rsvp@northgate.org']
      },
      labels: { items: 'Running order', about: 'What to expect', contact: 'RSVP' },
      blocks: ['hero', 'list', 'about', 'contact']
    },
    club: {
      name: 'A club or team', emoji: '⚑', theme: 'fresh',
      blurb: 'Who you are, when you meet, how to join.',
      ask: {
        name: ['What is the club called?', 'e.g. Hillside Chess Club'],
        tagline: ['What is it, in one line?', 'e.g. Friendly chess for all levels, every Thursday'],
        items: ['What do you do together?', 'e.g. Weekly meets, Ladder tournament, Coaching for beginners'],
        contact: ['Where do you meet and how do people join?', 'e.g. Room 12, Hillside School. Email join@hillsidechess.org']
      },
      labels: { items: 'What we do', about: 'About the club', contact: 'Come along' },
      blocks: ['hero', 'cards', 'about', 'contact']
    },
    portfolio: {
      name: 'A portfolio', emoji: '🎨', theme: 'bold',
      blurb: 'Your work, shown large, with a way to get in touch.',
      ask: {
        name: ['What is your name?', 'e.g. Ama Boateng'],
        tagline: ['What do you do?', 'e.g. Illustrator working in ink and risograph'],
        items: ['Name your pieces or projects.', 'e.g. Night Market, Field Notes, Paper Birds'],
        contact: ['How should people reach you?', 'e.g. studio@amaboateng.com']
      },
      labels: { items: 'Selected work', about: 'About', contact: 'Work with me' },
      blocks: ['hero', 'gallery', 'about', 'contact']
    },
    personal: {
      name: 'A personal link page', emoji: '🔗', theme: 'night',
      blurb: 'One tidy page holding everything you want to point people at.',
      ask: {
        name: ['What is your name?', 'e.g. Sam Rivera'],
        tagline: ['One line about you.', 'e.g. Teacher, runner, occasional baker'],
        items: ['List your links. "Label: address" works.', 'e.g. My newsletter: example.com, Email me: sam@example.com'],
        contact: ['Anything else people should know? (optional)', 'e.g. Based in Leeds']
      },
      labels: { items: 'Find me here', about: 'A bit more', contact: 'Say hello' },
      blocks: ['hero', 'links', 'about']
    },
    classpage: {
      name: 'A class page', emoji: '🎒', theme: 'calm',
      blurb: 'Homework, notices and links, in one place families can actually find.',
      ask: {
        name: ['Which class is this for?', 'e.g. Year 5 Oak'],
        tagline: ['One line for families.', 'e.g. Everything you need for Year 5 Oak, in one place'],
        items: ['What is coming up? "Thing: detail" works.', 'e.g. Spelling test: Friday, Trip money due: 12 March'],
        contact: ['How do families contact you?', 'e.g. mrjones@school.uk']
      },
      labels: { items: 'Coming up', about: 'How our week works', contact: 'Getting in touch' },
      blocks: ['hero', 'list', 'about', 'contact']
    },
    project: {
      name: 'A product or project', emoji: '🚀', theme: 'night',
      blurb: 'A landing page: what it is, why it is good, what to do next.',
      ask: {
        name: ['What is it called?', 'e.g. Tidepool'],
        tagline: ['What does it do, in one line?', 'e.g. Turns your reading notes into a searchable library'],
        items: ['List the main things it does.', 'e.g. Instant search, Works offline, Exports to plain text'],
        contact: ['What should people do next?', 'e.g. Email hello@tidepool.app for early access']
      },
      labels: { items: 'What it does', about: 'Why it exists', contact: 'Get started' },
      blocks: ['hero', 'cards', 'about', 'cta'],
      blocksTail: ['contact']
    },
    resume: {
      name: 'A CV or résumé', emoji: '📄', theme: 'elegant',
      blurb: 'A clean one-pager that prints properly.',
      ask: {
        name: ['What is your name?', 'e.g. Priya Raman'],
        tagline: ['What is your role?', 'e.g. Primary school teacher, 8 years in Key Stage 2'],
        items: ['List your roles. "Job: where and when" works.', 'e.g. Class teacher: Hillside Primary, 2019-now'],
        contact: ['Contact details.', 'e.g. priya@example.com, 07700 900123']
      },
      labels: { items: 'Experience', about: 'Profile', contact: 'Contact' },
      blocks: ['hero', 'list', 'about', 'contact']
    },
    game: {
      name: 'A game for a class', emoji: '🎮', theme: 'night',
      blurb: 'Trivia, a points board or printable bingo — built for a whole class.',
      isGame: true
    }
  };

  /* --------------------------------------------------------- type guessing */
  var TYPE_WORDS = {
    game: ['game', 'trivia', 'quiz', 'bingo', 'jeopardy', 'kahoot', 'buzzer', 'points board'],
    menu: ['restaurant', 'cafe', 'coffee', 'menu', 'bakery', 'food', 'bar', 'pizzeria', 'takeaway', 'diner', 'kitchen'],
    event: ['event', 'party', 'wedding', 'fundraiser', 'concert', 'recital', 'show', 'launch', 'conference', 'invite', 'invitation', 'rsvp'],
    club: ['club', 'team', 'society', 'group', 'troop', 'squad', 'scouts', 'choir', 'band'],
    portfolio: ['portfolio', 'artist', 'photographer', 'designer', 'illustrator', 'gallery', 'my work', 'photography'],
    personal: ['links', 'link page', 'link in bio', 'linktree', 'about me', 'personal page', 'profile'],
    classpage: ['class page', 'classroom', 'homework', 'my class', 'parents', 'school page', 'students'],
    project: ['product', 'app', 'startup', 'launch page', 'landing page', 'saas', 'tool', 'project'],
    resume: ['cv', 'resume', 'curriculum vitae', 'job application'],
    business: ['business', 'shop', 'store', 'salon', 'plumber', 'electrician', 'studio', 'company', 'services', 'freelance', 'cleaning', 'garage']
  };

  function wordHit(text, word) {
    var safe = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^a-z0-9])' + safe + 's?([^a-z0-9]|$)', 'i').test(text);
  }

  S.detectType = function (input) {
    var text = String(input || '').toLowerCase();
    var best = null;
    var bestScore = 0;
    Object.keys(TYPE_WORDS).forEach(function (key) {
      var score = 0;
      TYPE_WORDS[key].forEach(function (w) { if (wordHit(text, w)) { score += w.indexOf(' ') > -1 ? 2 : 1; } });
      if (score > bestScore) { bestScore = score; best = key; }
    });
    return best;
  };

  S.detectTheme = function (input) {
    var text = String(input || '').toLowerCase();
    /* People ask for changes in comparatives — "make it darker", "something
       simpler" — so the comparative forms are listed, not just the adjective. */
    var words = {
      night: ['dark', 'darker', 'darkest', 'night', 'moody', 'techy', 'sleek'],
      bold: ['bold', 'bolder', 'loud', 'louder', 'striking', 'neon', 'punchy', 'modern', 'stronger'],
      playful: ['playful', 'fun', 'funner', 'friendly', 'friendlier', 'colourful', 'colorful',
        'bright', 'brighter', 'kids', 'cheerful', 'warmer'],
      elegant: ['elegant', 'classy', 'classier', 'smart', 'smarter', 'refined', 'classic',
        'formal', 'fancy', 'fancier', 'posh'],
      fresh: ['fresh', 'fresher', 'green', 'greener', 'natural', 'clean', 'cleaner', 'lighter'],
      calm: ['calm', 'calmer', 'quiet', 'quieter', 'professional', 'plain', 'plainer',
        'minimal', 'simple', 'simpler']
    };
    var order = ['night', 'bold', 'playful', 'elegant', 'fresh', 'calm'];
    var found = null;
    order.forEach(function (id) {
      words[id].forEach(function (w) { if (!found && wordHit(text, w)) { found = id; } });
    });
    return found;
  };

  /* ------------------------------------------------------- answer parsing */
  /* People write lists the way they talk: commas, newlines, bullets, and
     sometimes "Thing: detail". Accept all of it. */
  function splitItems(text) {
    return String(text || '')
      .split(/\r?\n|,|;|•|(?:^|\s)[-*]\s/)
      .map(function (s) { return s.trim().replace(/^[-*•]\s*/, ''); })
      .filter(function (s) { return s.length > 0; })
      .slice(0, 12);
  }

  function splitPair(raw) {
    var m = String(raw).match(/^(.{1,60}?)\s*[:–—-]\s+(.+)$/);
    if (m) { return { title: m[1].trim(), detail: m[2].trim() }; }
    m = String(raw).match(/^(.+?):\s*(.+)$/);
    if (m) { return { title: m[1].trim(), detail: m[2].trim() }; }
    return { title: String(raw).trim(), detail: '' };
  }

  function isSkip(text) {
    return !text || /^(skip|none|no|nothing|n\/a|na|later|not sure|dunno)\.?$/i.test(String(text).trim());
  }
  S.isSkip = isSkip;

  /* Pull links out of free text so a link page and a contact block both work. */
  function findContacts(text) {
    var out = { email: '', phone: '', other: [], rest: String(text || '').trim() };
    if (isSkip(text)) { out.rest = ''; return out; }
    var email = out.rest.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    if (email) { out.email = email[0]; }
    var phone = out.rest.match(/(?:\+?\d[\d\s()-]{6,}\d)/);
    if (phone) { out.phone = phone[0].trim(); }
    return out;
  }

  function href(raw) {
    var t = String(raw).trim();
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(t)) { return 'mailto:' + t; }
    if (/^\+?[\d\s()-]{7,}$/.test(t)) { return 'tel:' + t.replace(/[^\d+]/g, ''); }
    if (/^https?:\/\//i.test(t)) { return t; }
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t)) { return 'https://' + t; }
    return '';
  }

  S.buildSpec = function (answers) {
    var type = S.TYPES[answers.type] || S.TYPES.business;
    var themeId = answers.theme || type.theme || 'calm';
    var name = (answers.name || '').trim() || 'Your new site';
    var tagline = (answers.tagline || '').trim();
    var rawItems = isSkip(answers.items) ? [] : splitItems(answers.items);
    var items = rawItems.map(function (raw) {
      var p = splitPair(raw);
      return { title: p.title, detail: p.detail, url: href(p.detail) };
    });
    var contact = findContacts(answers.contact);

    return {
      id: 's' + Math.random().toString(36).slice(2, 8),
      typeId: answers.type,
      typeName: type.name,
      title: name,
      tagline: tagline,
      items: items,
      labels: type.labels,
      blocks: (type.blocks || ['hero', 'cards', 'about', 'contact']).concat(type.blocksTail || []),
      contact: contact,
      theme: S.THEMES[themeId] || S.THEMES.calm,
      themeId: themeId,
      brief: answers.brief || '',
      about: isSkip(answers.more) ? '' : String(answers.more || '').trim()
    };
  };
}(window.FORGE));

/* ------------------------------------------------------------------------
 * Rendering. Everything below ends up inside the downloaded .html file.
 * ---------------------------------------------------------------------- */
(function (F) {
  'use strict';
  var S = F.SITE;

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Blend two hex colours at build time so the output needs no colour
     functions at runtime — it renders the same in every browser. */
  function hex(c) {
    var h = String(c).replace('#', '');
    if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(a, b, t) {
    var x = hex(a), y = hex(b);
    var out = [0, 1, 2].map(function (i) {
      return Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, '0');
    });
    return '#' + out.join('');
  }
  function rgba(c, a) {
    var x = hex(c);
    return 'rgba(' + x[0] + ',' + x[1] + ',' + x[2] + ',' + a + ')';
  }

  /* ------------------------------------------------------------ site CSS */
  S.css = function (t, fonts) {
    return [
      '*,*::before,*::after{box-sizing:border-box}',
      ':root{--bg:' + t.bg + ';--surface:' + t.surface + ';--ink:' + t.ink + ';--dim:' + t.dim + ';',
      '--line:' + t.line + ';--accent:' + t.accent + ';--accent-ink:' + t.accentInk + ';--soft:' + t.soft + ';',
      '--shadow:' + rgba(t.ink, t.dark ? 0.5 : 0.08) + '}',
      'html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}',
      'body{margin:0;background:var(--bg);color:var(--ink);font-family:' + fonts + ';line-height:1.65;',
      '-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent}',
      'img{max-width:100%}',
      'a{color:inherit}',
      '.wrap{width:100%;max-width:1060px;margin:0 auto;padding:0 22px}',

      /* header */
      '.bar{position:sticky;top:0;z-index:30;background:' + rgba(t.bg, 0.86) + ';backdrop-filter:blur(12px);',
      '-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}',
      '.bar .wrap{display:flex;align-items:center;gap:18px;min-height:62px}',
      '.brand{font-weight:800;letter-spacing:-.02em;font-size:18px;text-decoration:none;margin-right:auto;',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%}',
      '.links-nav{display:flex;gap:22px}',
      '.links-nav a{text-decoration:none;color:var(--dim);font-size:15px;font-weight:500}',
      '.links-nav a:hover{color:var(--ink)}',
      '.burger{display:none;border:1px solid var(--line);background:none;border-radius:10px;padding:8px 12px;',
      'color:var(--ink);font:inherit;font-size:14px;cursor:pointer}',
      '@media (max-width:720px){',
      '  .burger{display:block}',
      '  .links-nav{position:absolute;top:100%;left:0;right:0;background:var(--surface);border-bottom:1px solid var(--line);',
      '    flex-direction:column;gap:0;padding:8px 22px 16px;display:none}',
      '  .links-nav.open{display:flex}',
      '  .links-nav a{padding:11px 0;border-bottom:1px solid var(--line);font-size:16px}',
      '  .links-nav a:last-child{border-bottom:0}',
      '}',

      /* hero */
      '.hero{position:relative;overflow:hidden;padding:clamp(62px,11vw,124px) 0 clamp(52px,9vw,96px)}',
      '.hero::before{content:"";position:absolute;inset:-40% -20% auto -20%;height:130%;pointer-events:none;',
      'background:radial-gradient(60% 55% at 22% 12%,' + rgba(t.accent, t.dark ? 0.3 : 0.18) + ',transparent 70%),',
      'radial-gradient(45% 45% at 88% 0%,' + rgba(t.accent, t.dark ? 0.16 : 0.1) + ',transparent 70%)}',
      '.hero .wrap{position:relative}',
      '.eyebrow{margin:0 0 14px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);font-weight:800}',
      '.hero h1{margin:0;font-size:clamp(38px,7.4vw,74px);line-height:1.02;letter-spacing:-.035em;font-weight:800;max-width:16ch}',
      '.lede{margin:20px 0 0;font-size:clamp(17px,2.4vw,23px);color:var(--dim);max-width:46ch;line-height:1.5}',
      '.acts{display:flex;gap:12px;flex-wrap:wrap;margin-top:34px}',
      '.btn{display:inline-block;text-decoration:none;border:1px solid var(--line);background:var(--surface);',
      'border-radius:12px;padding:14px 24px;font-weight:700;font-size:16px;transition:transform .12s,box-shadow .12s}',
      '.btn:hover{transform:translateY(-2px);box-shadow:0 8px 22px var(--shadow)}',
      '.btn.primary{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}',
      '.hero.center{text-align:center}',
      '.hero.center h1,.hero.center .lede{max-width:none;margin-left:auto;margin-right:auto}',
      '.hero.center .acts{justify-content:center}',
      '.avatar{width:96px;height:96px;border-radius:50%;background:var(--accent);color:var(--accent-ink);',
      'display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;margin:0 auto 24px;letter-spacing:-.02em}',

      /* sections */
      '.sec{padding:clamp(52px,8vw,92px) 0;border-top:1px solid var(--line)}',
      '.sec h2{margin:0 0 10px;font-size:clamp(26px,4.2vw,40px);letter-spacing:-.025em;line-height:1.12;font-weight:800}',
      '.sec .intro{margin:0 0 34px;color:var(--dim);font-size:17px;max-width:54ch}',

      /* cards */
      '.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(248px,1fr));gap:16px}',
      '.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:24px;transition:transform .14s,box-shadow .14s}',
      '.card:hover{transform:translateY(-3px);box-shadow:0 12px 30px var(--shadow)}',
      '.ico{display:flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;',
      'background:var(--soft);color:var(--accent);font-weight:800;font-size:16px;margin-bottom:16px}',
      '.card-t{margin:0 0 7px;font-size:19px;font-weight:700;letter-spacing:-.01em}',
      '.card p{margin:0;color:var(--dim);font-size:15.5px}',

      /* rows */
      '.rows{border-top:1px solid var(--line)}',
      '.row{display:flex;align-items:baseline;gap:12px;padding:17px 0;border-bottom:1px solid var(--line)}',
      '.row-t{font-weight:700;font-size:17.5px;letter-spacing:-.01em}',
      '.leader{flex:1;border-bottom:1px dotted var(--line);min-width:18px;transform:translateY(-4px)}',
      '.row-d{color:var(--dim);font-size:16px;text-align:right;white-space:nowrap}',
      '@media (max-width:560px){.row{flex-wrap:wrap;gap:4px}.leader{display:none}.row-d{text-align:left;white-space:normal;width:100%}}',

      /* gallery */
      '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}',
      '.tile{border-radius:16px;overflow:hidden;border:1px solid var(--line);background:var(--surface)}',
      '.tile .art{aspect-ratio:4/3;display:flex;align-items:flex-end;padding:18px;font-size:40px;font-weight:800;',
      'color:rgba(0,0,0,.42);letter-spacing:-.03em}',
      '.cap{margin:0;padding:15px 18px;font-weight:700;font-size:16px}',

      /* link buttons */
      '.stack{display:flex;flex-direction:column;gap:11px;max-width:560px;margin:0 auto}',
      '.big-link{display:flex;align-items:center;gap:14px;text-decoration:none;background:var(--surface);',
      'border:1px solid var(--line);border-radius:14px;padding:18px 20px;font-weight:700;font-size:17px;',
      'transition:transform .12s,box-shadow .12s}',
      '.big-link:hover{transform:translateY(-2px);box-shadow:0 10px 26px var(--shadow);border-color:var(--accent)}',
      '.big-link .arw{margin-left:auto;color:var(--accent);font-weight:800}',
      '.big-link small{display:block;font-weight:500;color:var(--dim);font-size:13.5px;margin-top:2px;word-break:break-all}',

      /* about + contact */
      '.two{display:grid;grid-template-columns:1.5fr 1fr;gap:30px;align-items:start}',
      '@media (max-width:760px){.two{grid-template-columns:1fr}}',
      '.prose p{margin:0 0 16px;font-size:17.5px;color:var(--dim);max-width:58ch}',
      '.panel{background:var(--soft);border:1px solid var(--line);border-radius:16px;padding:22px}',
      '.panel h3{margin:0 0 14px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}',
      '.panel a,.panel span{display:block;text-decoration:none;font-weight:700;font-size:16.5px;margin-bottom:10px;word-break:break-word}',
      '.panel a:hover{color:var(--accent)}',

      /* cta */
      '.cta{background:var(--accent);color:var(--accent-ink);border-radius:22px;padding:clamp(34px,6vw,58px);text-align:center;margin:0 0 6px}',
      '.cta h2{margin:0 0 12px;font-size:clamp(25px,4vw,38px);letter-spacing:-.025em}',
      '.cta p{margin:0 auto 26px;max-width:46ch;opacity:.86;font-size:17px}',
      '.cta .btn{background:var(--accent-ink);color:var(--accent);border-color:transparent}',

      /* footer */
      'footer{border-top:1px solid var(--line);padding:34px 0 46px;color:var(--dim);font-size:14.5px}',
      'footer .wrap{display:flex;gap:14px;flex-wrap:wrap;align-items:center}',
      '.foot-note{margin:0}',
      'footer .made{margin-left:auto;opacity:.75}',

      /* reveal */
      /* Content is visible by default. Only a page that has run its script
         hides it to animate in, so no-JS, print and screenshots keep the text. */
      '.js .rise{opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s cubic-bezier(.2,.7,.3,1)}',
      '.js .rise.in{opacity:1;transform:none}',

      /* edit mode */
      '#edit-bar{position:fixed;right:16px;bottom:16px;z-index:60;display:flex;gap:8px;',
      'background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:7px;box-shadow:0 10px 30px var(--shadow)}',
      '#edit-bar button{border:0;background:none;color:var(--ink);font:inherit;font-size:14px;font-weight:700;',
      'padding:9px 16px;border-radius:999px;cursor:pointer}',
      '#edit-bar button.on{background:var(--accent);color:var(--accent-ink)}',
      'body.editing [contenteditable]{outline:2px dashed ' + rgba(t.accent, 0.5) + ';outline-offset:4px;border-radius:4px}',
      'body.editing [contenteditable]:focus{outline:2px solid var(--accent)}',

      '@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.js .rise{opacity:1;transform:none;transition:none}}',
      '@media print{.bar,#edit-bar,.acts,.cta{display:none}.sec,.hero{padding:18px 0;border:0}',
      '.js .rise{opacity:1 !important;transform:none !important}',
      'body{background:#fff;color:#000}.card,.panel,.tile{border-color:#bbb}}'
    ].join('\n');
  };

  /* -------------------------------------------------------- site runtime */
  S.RUNTIME = function () {
    'use strict';
    var d = document;

    /* mobile menu */
    var burger = d.querySelector('.burger');
    var nav = d.querySelector('.links-nav');
    if (burger && nav) {
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(open));
      });
      nav.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') { nav.classList.remove('open'); }
      });
    }

    /* reveal on scroll */
    var rise = [].slice.call(d.querySelectorAll('.rise'));
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    function revealAll() { rise.forEach(function (n) { n.classList.add('in'); }); }
    if (!window.IntersectionObserver || reduce) {
      revealAll();
    } else {
      var io = new window.IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px' });
      rise.forEach(function (n) { io.observe(n); });
      /* The fade is decoration. If anything has not been reached — a print
         job, a screenshot, a page that never gets scrolled — show it anyway
         rather than leave a section blank. */
      window.setTimeout(revealAll, 1500);
    }
    window.addEventListener('beforeprint', revealAll);

    /* Edit the words on the page, then save a new copy of the file. The whole
       point is that someone who cannot code can still change their own site. */
    var SEL = 'h1,h2,h3,.card-t,.row-t,.row-d,.cap,.lede,.intro,.eyebrow,.prose p,.cta p,.foot-note,.big-link span';
    /* In a preview frame the floating button just covers the design. It is for
       the real, opened page. */
    var framed = false;
    try { framed = window.self !== window.top; } catch (e) { framed = true; }
    if (framed) { return; }
    var editing = false;
    var bar = d.createElement('div');
    bar.id = 'edit-bar';
    var toggle = d.createElement('button');
    toggle.type = 'button';
    toggle.textContent = 'Edit text';
    var saver = d.createElement('button');
    saver.type = 'button';
    saver.textContent = 'Save a copy';
    saver.style.display = 'none';
    bar.appendChild(toggle);
    bar.appendChild(saver);
    d.body.appendChild(bar);

    function mode() {
      /* plaintext-only keeps people from pasting markup into their own page */
      var probe = d.createElement('div');
      probe.setAttribute('contenteditable', 'plaintext-only');
      return probe.contentEditable === 'plaintext-only' ? 'plaintext-only' : 'true';
    }

    toggle.addEventListener('click', function () {
      editing = !editing;
      var m = mode();
      d.body.classList.toggle('editing', editing);
      toggle.classList.toggle('on', editing);
      toggle.textContent = editing ? 'Done' : 'Edit text';
      saver.style.display = editing ? 'block' : 'none';
      [].forEach.call(d.querySelectorAll(SEL), function (n) {
        if (editing) { n.setAttribute('contenteditable', m); }
        else { n.removeAttribute('contenteditable'); }
      });
    });

    saver.addEventListener('click', function () {
      var clone = d.documentElement.cloneNode(true);
      var stale = clone.querySelector('#edit-bar');
      if (stale && stale.parentNode) { stale.parentNode.removeChild(stale); }
      [].forEach.call(clone.querySelectorAll('[contenteditable]'), function (n) {
        n.removeAttribute('contenteditable');
      });
      var b = clone.querySelector('body');
      if (b) { b.classList.remove('editing'); }
      [].forEach.call(clone.querySelectorAll('.rise'), function (n) { n.classList.remove('in'); });
      var html = '<!doctype html>\n' + clone.outerHTML;
      var url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
      var a = d.createElement('a');
      a.href = url;
      a.download = (d.title || 'website').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.html';
      d.body.appendChild(a);
      a.click();
      d.body.removeChild(a);
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      saver.textContent = 'Saved';
      window.setTimeout(function () { saver.textContent = 'Save a copy'; }, 2200);
    });
  };
}(window.FORGE));

/* ------------------------------------------------------------------------
 * Blocks and assembly.
 * ---------------------------------------------------------------------- */
(function (F) {
  'use strict';
  var S = F.SITE;

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function hex(c) {
    var h = String(c).replace('#', '');
    if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function mix(a, b, t) {
    var x = hex(a), y = hex(b);
    return '#' + [0, 1, 2].map(function (i) {
      var v = Math.round(x[i] + (y[i] - x[i]) * t);
      return Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0');
    }).join('');
  }

  /* Rotating the accent's hue per tile keeps a gallery on-brand but stops
     every piece looking like the same green rectangle. */
  function hueOf(c) {
    var x = hex(c).map(function (v) { return v / 255; });
    var max = Math.max.apply(null, x), min = Math.min.apply(null, x), d = max - min;
    var h = 0;
    if (d) {
      if (max === x[0]) { h = ((x[1] - x[2]) / d) % 6; }
      else if (max === x[1]) { h = (x[2] - x[0]) / d + 2; }
      else { h = (x[0] - x[1]) / d + 4; }
      h *= 60;
    }
    return (h + 360) % 360;
  }
  function hsl(h, sat, li) { return 'hsl(' + Math.round((h + 360) % 360) + ',' + sat + '%,' + li + '%)'; }

  function initials(name) {
    var parts = String(name).trim().split(/\s+/).slice(0, 2);
    return parts.map(function (w) { return w.charAt(0).toUpperCase(); }).join('') || 'A';
  }
  function linkFor(raw) {
    var t = String(raw).trim();
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(t)) { return 'mailto:' + t; }
    if (/^\+?[\d\s()-]{7,}$/.test(t)) { return 'tel:' + t.replace(/[^\d+]/g, ''); }
    if (/^https?:\/\//i.test(t)) { return t; }
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t)) { return 'https://' + t; }
    return '';
  }
  function paras(text) {
    return String(text).split(/\n+/).map(function (p) { return p.trim(); }).filter(Boolean);
  }

  /* Which sections will actually have something in them. */
  function plan(spec) {
    var out = { what: false, about: false, contact: false };
    spec.blocks.forEach(function (b) {
      if ((b === 'cards' || b === 'list' || b === 'gallery' || b === 'links') && spec.items.length) { out.what = true; }
      if (b === 'about' && spec.about) { out.about = true; }
      if (b === 'contact' && (spec.contact.rest || spec.contact.email)) { out.contact = true; }
    });
    return out;
  }

  var BLOCKS = {
    hero: function (spec, has) {
      var centred = spec.typeId === 'personal' || spec.typeId === 'resume';
      var acts = [];
      if (has.contact) {
        acts.push('<a class="btn primary" href="#contact">' + esc(spec.labels.contact) + '</a>');
      }
      if (has.what) {
        acts.push('<a class="btn" href="#what">' + esc(spec.labels.items) + '</a>');
      }
      return {
        html: '<section class="hero' + (centred ? ' center' : '') + '"><div class="wrap rise">'
          + (centred ? '<div class="avatar">' + esc(initials(spec.title)) + '</div>' : '')
          + '<h1>' + esc(spec.title) + '</h1>'
          + (spec.tagline ? '<p class="lede">' + esc(spec.tagline) + '</p>' : '')
          + (acts.length ? '<div class="acts">' + acts.join('') + '</div>' : '')
          + '</div></section>'
      };
    },

    cards: function (spec) {
      if (!spec.items.length) { return null; }
      var cards = spec.items.map(function (it, i) {
        return '<article class="card rise" style="transition-delay:' + (i % 3) * 70 + 'ms">'
          + '<span class="ico">' + String(i + 1).padStart(2, '0') + '</span>'
          + '<h3 class="card-t">' + esc(it.title) + '</h3>'
          + (it.detail ? '<p>' + esc(it.detail) + '</p>' : '')
          + '</article>';
      }).join('');
      return {
        nav: ['what', spec.labels.items],
        html: '<section class="sec" id="what"><div class="wrap">'
          + '<h2 class="rise">' + esc(spec.labels.items) + '</h2>'
          + '<div class="cards">' + cards + '</div></div></section>'
      };
    },

    list: function (spec) {
      if (!spec.items.length) { return null; }
      var rows = spec.items.map(function (it) {
        return '<div class="row rise"><span class="row-t">' + esc(it.title) + '</span>'
          + (it.detail ? '<span class="leader"></span><span class="row-d">' + esc(it.detail) + '</span>' : '')
          + '</div>';
      }).join('');
      return {
        nav: ['what', spec.labels.items],
        html: '<section class="sec" id="what"><div class="wrap">'
          + '<h2 class="rise">' + esc(spec.labels.items) + '</h2>'
          + '<div class="rows">' + rows + '</div></div></section>'
      };
    },

    gallery: function (spec) {
      if (!spec.items.length) { return null; }
      var t = spec.theme;
      var base = hueOf(t.accent);
      var tiles = spec.items.map(function (it, i) {
        var h = base + i * 41;
        var a = hsl(h, 62, t.dark ? 58 : 64);
        var b = hsl(h + 26, 52, t.dark ? 36 : 46);
        return '<figure class="tile rise" style="margin:0;transition-delay:' + (i % 3) * 70 + 'ms">'
          + '<div class="art" style="background:linear-gradient(152deg,' + a + ',' + b + ')">'
          + esc(String(i + 1).padStart(2, '0')) + '</div>'
          + '<figcaption class="cap">' + esc(it.title) + '</figcaption></figure>';
      }).join('');
      return {
        nav: ['what', spec.labels.items],
        html: '<section class="sec" id="what"><div class="wrap">'
          + '<h2 class="rise">' + esc(spec.labels.items) + '</h2>'
          + '<div class="grid">' + tiles + '</div></div></section>'
      };
    },

    links: function (spec) {
      if (!spec.items.length) { return null; }
      var rows = spec.items.map(function (it, i) {
        var url = it.url || linkFor(it.title);
        var label = esc(it.title);
        var sub = it.detail && it.url ? '<small>' + esc(it.detail) + '</small>' : '';
        var inner = '<span>' + label + sub + '</span><span class="arw" aria-hidden="true">&rarr;</span>';
        return url
          ? '<a class="big-link rise" style="transition-delay:' + (i % 4) * 60 + 'ms" href="' + esc(url) + '">' + inner + '</a>'
          : '<div class="big-link rise">' + inner + '</div>';
      }).join('');
      return {
        nav: ['what', spec.labels.items],
        html: '<section class="sec" id="what"><div class="wrap">'
          + '<h2 class="rise" style="text-align:center">' + esc(spec.labels.items) + '</h2>'
          + '<div class="stack">' + rows + '</div></div></section>'
      };
    },

    about: function (spec) {
      if (!spec.about) { return null; }
      var body = paras(spec.about).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
      return {
        nav: ['about', spec.labels.about],
        html: '<section class="sec" id="about"><div class="wrap">'
          + '<h2 class="rise">' + esc(spec.labels.about) + '</h2>'
          + '<div class="prose rise">' + body + '</div></div></section>'
      };
    },

    contact: function (spec) {
      var c = spec.contact;
      if (!c.rest && !c.email) { return null; }
      var panel = '';
      if (c.email) { panel += '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>'; }
      if (c.phone) { panel += '<a href="tel:' + esc(c.phone.replace(/[^\d+]/g, '')) + '">' + esc(c.phone) + '</a>'; }
      var extra = c.rest;
      if (c.email) { extra = extra.split(c.email).join(''); }
      if (c.phone) { extra = extra.split(c.phone).join(''); }
      extra = extra.replace(/\s{2,}/g, ' ');
      /* Pulling the phone number out of "book on 01234 567890" leaves a
         dangling "book on"; trim the connector words it hung off. */
      extra = extra.replace(
        /[\s,;.]*\b(?:book(?:ings?)?(?: on| via)?|call(?: us)?(?: on)?|ring|phone|tel|email(?: us)?(?: at| on)?|contact(?: us)?(?: on| at)?|reach(?: us)?(?: on| at)?|on|at|via|or|by)[\s,;.]*$/i,
        ''
      );
      extra = extra.replace(/^[\s,;.]+|[\s,;.]+$/g, '');
      return {
        nav: ['contact', spec.labels.contact],
        html: '<section class="sec" id="contact"><div class="wrap">'
          + '<h2 class="rise">' + esc(spec.labels.contact) + '</h2>'
          + '<div class="two rise">'
          + '<div class="prose">' + (extra ? '<p>' + esc(extra) + '</p>' : '')
          + (c.email ? '<a class="btn primary" href="mailto:' + esc(c.email) + '">Send a message</a>' : '')
          + '</div>'
          + (panel ? '<div class="panel"><h3>Get in touch</h3>' + panel + '</div>' : '')
          + '</div></div></section>'
      };
    },

    cta: function (spec) {
      if (!spec.contact.email) { return null; }
      return {
        html: '<section class="sec" style="border:0"><div class="wrap"><div class="cta rise">'
          + '<h2>' + esc(spec.labels.contact) + '</h2>'
          + (spec.tagline ? '<p>' + esc(spec.tagline) + '</p>' : '')
          + '<a class="btn" href="mailto:' + esc(spec.contact.email) + '">' + esc(spec.contact.email) + '</a>'
          + '</div></div></section>'
      };
    }
  };

  S.buildSite = function (spec) {
    var t = spec.theme;
    var has = plan(spec);
    var body = [];
    var nav = [];
    var seenNav = {};

    spec.blocks.forEach(function (id) {
      var make = BLOCKS[id];
      if (!make) { return; }
      var out = make(spec, has);
      if (!out) { return; }
      if (out.nav && !seenNav[out.nav[0]]) {
        seenNav[out.nav[0]] = true;
        nav.push('<a href="#' + out.nav[0] + '">' + esc(out.nav[1]) + '</a>');
      }
      body.push(out.html);
    });

    var fonts = {
      sans: 'ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
      serif: 'ui-serif,Georgia,"Iowan Old Style","Times New Roman",serif',
      round: 'ui-rounded,"SF Pro Rounded",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'
    }[t.font] || 'ui-sans-serif,system-ui,sans-serif';

    var favicon = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
      + '<rect width="32" height="32" rx="8" fill="' + t.accent + '"/>'
      + '<text x="16" y="22" font-family="system-ui,sans-serif" font-size="16" font-weight="700"'
      + ' text-anchor="middle" fill="' + t.accentInk + '">' + esc(initials(spec.title)) + '</text></svg>'
    );

    return [
      '<!doctype html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
      '<meta name="theme-color" content="' + esc(t.bg) + '">',
      '<meta name="description" content="' + esc(spec.tagline || spec.title) + '">',
      '<meta property="og:title" content="' + esc(spec.title) + '">',
      '<meta property="og:description" content="' + esc(spec.tagline || '') + '">',
      '<title>' + esc(spec.title) + '</title>',
      '<link rel="icon" href="' + esc(favicon) + '">',
      '<link rel="apple-touch-icon" href="' + esc(favicon) + '">',
      '<script>document.documentElement.className="js";<\/script>',
      '<style>',
      S.css(t, fonts),
      '</style>',
      '</head>',
      '<body>',
      '<header class="bar"><div class="wrap">',
      '<a class="brand" href="#top">' + esc(spec.title) + '</a>',
      nav.length ? '<button class="burger" type="button" aria-expanded="false">Menu</button>' : '',
      nav.length ? '<nav class="links-nav">' + nav.join('') + '</nav>' : '',
      '</div></header>',
      '<main id="top">',
      body.join('\n'),
      '</main>',
      '<footer><div class="wrap">',
      '<p class="foot-note">' + esc(spec.title) + '</p>',
      '<span class="made">Made with Game Forge</span>',
      '</div></footer>',
      '<script>',
      '(' + S.RUNTIME.toString() + ')();',
      '<\/script>',
      '</body>',
      '</html>',
      ''
    ].filter(function (line) { return line !== ''; }).join('\n');
  };
}(window.FORGE));
