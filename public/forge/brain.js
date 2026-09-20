/* Game Forge — the part that understands what you said.
 *
 * The chat is not a form. People ask "why?", "what do you mean?", "like what?"
 * and "you pick" partway through, and all of those have to work. This module
 * decides what a message actually is, and holds the material it answers with:
 * per-question explanations, and real worked examples for every site type.
 */
window.FORGE = window.FORGE || {};

(function (F) {
  'use strict';

  var B = {};
  F.BRAIN = B;

  /* ==================================================================
   * 1. What kind of message is this?
   * ================================================================ */
  var PATTERNS = [
    ['why', /^(?:but\s+)?why\b|why (?:do|would) you (?:need|want|ask)|what(?:'s| is)? (?:that|this|it) for|what do you need (?:that|it|this) for|does it matter|do i have to/i],
    ['mean', /what do you mean|what does that mean|i (?:don'?t|do not|dont) (?:get|understand|know what)|confus|^(?:huh|eh|what)\??$|explain|say (?:that )?again|in plain english|simpler|not sure what you/i],
    ['example', /like what|for example|^examples?\b|give me (?:some|a few|an?)?\s*(?:ideas?|examples?|options?)|any ideas|such as|what (?:should|do) i (?:put|write|say|enter)|what goes (?:in )?(?:there|here)|show me|suggest|options\??$|help(?: me)?\??$|stuck/i],
    ['delegate', /you (?:choose|decide|pick|write|do|make)|write (?:it|one|something) for me|do it for me|make (?:it|one|something) up|whatever|surprise me|your (?:choice|call)|up to you|i don'?t mind|you know best|just pick|anything(?: is fine)?|fill it in/i],
    ['capability', /^(?:can|could|does|do|will|is|are|would)\s+(?:it|you|this|they|i)\b|^is (?:it|this|there)\b|^do i (?:need|have)/i],
    ['choice', /\bor\b[^?]*\?\s*$|^(?:should|shall|would|which|do) (?:i|you|we)\b/i],
    ['progress', /how (?:many|much) (?:more|left|questions)|how long|are we (?:nearly|almost) (?:done|there)|what'?s next|how far/i],
    ['back', /go back|change the (?:name|title|first)|start (?:that )?again|i made a mistake|redo that|scratch that|wrong answer/i]
  ];

  /* A real answer can contain the word "why". Only treat a message as a
     question when it is short, or actually ends in a question mark. */
  function looksLikeAside(text) {
    var t = text.trim();
    if (t.length > 110) { return false; }
    if (/[?]\s*$/.test(t)) { return true; }
    return t.split(/\s+/).length <= 12;
  }

  B.classify = function (raw, ctx) {
    var text = String(raw || '').trim();
    if (!text) { return { intent: 'empty' }; }
    if (F.SITE.isSkip(text)) { return { intent: 'skip' }; }

    /* A comma-separated list is an answer, even if a word inside it matches. */
    var listy = (ctx && (ctx.qid === 'items' || ctx.qid === 'contact')) && text.indexOf(',') > -1;
    if (!listy && looksLikeAside(text)) {
      for (var i = 0; i < PATTERNS.length; i += 1) {
        if (PATTERNS[i][1].test(text)) { return { intent: PATTERNS[i][0], text: text }; }
      }
    }
    return { intent: 'answer', text: text };
  };

  /* ==================================================================
   * 2. Why each question is asked, and a plainer way of asking it
   * ================================================================ */
  var WHY = {
    name: 'It goes at the top of the page, in the browser tab, and on the icon if someone saves it to their home screen. It is the one thing I cannot guess for you.',
    tagline: 'It sits just under the name, and it is the line that shows up when someone shares the link. One sentence that tells a stranger what this is.',
    items: 'This becomes the main part of the page — the bit people actually scroll down for. Cards for a business, a priced list for a menu, picture tiles for a portfolio.',
    contact: 'It builds the contact section, and turns an email or phone number into something tappable, so someone reading on a phone can reach you in one tap.',
    more: 'It becomes a short "about" paragraph in your own words. It is genuinely optional — the page reads fine without one.',
    theme: 'It sets the colours and the typeface for the whole page. You can change it straight after, so it is not a big decision.',
    gamebrief: 'It tells me the subject and the reading level, so the questions actually suit your class instead of being too easy or too hard.',
    gameshape: 'The three play very differently in a room full of children — one is fast and loud, one is a board you work through, one keeps everyone busy at once.'
  };

  var MEAN = {
    name: 'What do people call it? If it is on a sign, a shirt or a letterhead, that is the one. For example: "Ridgeway Bakehouse".',
    tagline: 'If someone asked "what is it?", what would you say in one breath? For example: "Sourdough and pastries, baked every morning".',
    items: 'The things you want listed on the page. Type them one after another with commas between. Adding "name: detail" gives each one a line underneath.',
    contact: 'However you want people to get hold of you — an email address, a phone number, an address, opening hours. All of it, or none of it.',
    more: 'Anything else you want written on the page. How long you have been going, what makes it yours, who you are. Or say skip.',
    theme: 'Just the look of it. Pick whichever name sounds closest and I will show you.',
    gamebrief: 'Which subject, and roughly what age? For example: "Year 5 science" or "8th grade history".',
    gameshape: 'Which of the three games you want. Tap one and I will show you what it looks like.'
  };

  /* ==================================================================
   * 3. Worked examples, per site type — the material it suggests from
   * ================================================================ */
  var C = {
    business: {
      tagline: [
        'Family-run since 1998, and still doing it by hand',
        'Honest work, fair prices, no call-out fee',
        'Small studio, careful work, booked by appointment'
      ],
      items: [
        'Sourdough loaves: baked fresh every morning, Morning pastries: butter croissants and almond swirls, Celebration cakes: made to order, two weeks notice',
        'Boiler servicing: annual checks and safety certificates, Emergency repairs: same-day where we can, Bathroom fitting: start to finish, tidy job',
        'Cut and finish: 45 minutes, Colour: consultation first, always, Children under 12: quick, cheerful, no fuss'
      ],
      contact: [
        'hello@example.co.uk, 01234 567890, 12 Mill Lane',
        'Open Tue to Sat, 8am to 4pm. Call 01234 567890'
      ],
      more: [
        'We have been on the same corner since 1998. Everything is made the morning it is sold, and whatever is left at four o’clock goes to the food bank down the road.',
        'It is a two-person shop. You will speak to whoever does the work, which is how we like it.'
      ],
      intro: 'What we do, and what it costs you to find out more.'
    },
    menu: {
      tagline: [
        'Small plates and long evenings',
        'Proper coffee, good bread, nothing complicated',
        'Wood-fired, ten tables, no reservations after eight'
      ],
      items: [
        'Sourdough loaves: baked at five every morning, Pastries: croissants, almond, pain au chocolat, Celebration cakes: two weeks notice please, Coffee: beans roasted down the road',
        'Focaccia and olive oil: 6, Ricotta gnudi: 14, Braised lamb shoulder: 19, Tiramisu: 8',
        'Flat white: 3.20, Sourdough toast and jam: 4.50, Bacon sandwich: 6, Cinnamon bun: 3.80',
        'Margherita: 9, Nduja and honey: 13, House salad: 6, Affogato: 5'
      ],
      contact: [
        'Tue to Sun, 5pm till 11pm. Book on 01234 567890',
        'Walk-ins only. Open 8am to 3pm, closed Mondays. hello@example.co.uk'
      ],
      more: [
        'The menu changes when the market changes, so what is written here is a good guess rather than a promise. Everything is cooked to order.',
        'Twelve covers, one chef, one oven. Bear with us on a Friday.'
      ],
      intro: 'Everything we are cooking at the moment.'
    },
    event: {
      tagline: [
        'Saturday 14 March, 7pm, Northgate Hall',
        'One night, twelve acts, all money to the hospice',
        'Friday 6 June, doors at 6.30, finished by 10'
      ],
      items: [
        'Doors open: 6.30pm, Performances begin: 7pm, Interval and raffle: 8.15pm, Finish: 9.30pm',
        'Registration: 9am, Keynote: 10am, Lunch: 12.30pm, Workshops: 2pm, Close: 4.30pm'
      ],
      contact: [
        'rsvp@example.org by 1 March please',
        'Tickets on the door, cash or card. Questions to hello@example.org'
      ],
      more: [
        'It is a relaxed evening. Bring whoever you like, wear whatever you want, and there will be tea at the interval.',
        'The hall is on the ground floor and step-free. Parking is free after 6pm on the street behind.'
      ],
      intro: 'How the evening runs.'
    },
    club: {
      tagline: [
        'Friendly chess for all levels, every Thursday',
        'We run, we talk, nobody is left behind',
        'Singing on Wednesdays since 1974'
      ],
      items: [
        'Weekly meets: Thursdays, 6pm till 8pm, Ladder tournament: runs all term, Coaching for beginners: first Thursday of the month',
        'Sunday long run: 9am from the car park, Track night: Tuesdays, 7pm, Social run and coffee: Saturdays, 8.30am'
      ],
      contact: [
        'Room 12, Hillside School. Email join@example.org',
        'We meet at the village hall. Just turn up, or message us first if you would rather'
      ],
      more: [
        'There is no trial and no audition. Come once and see what you think — most people stay.',
        'Subs are ten pounds a term, and nobody has ever been turned away over it.'
      ],
      intro: 'What we get up to.'
    },
    portfolio: {
      tagline: [
        'Illustrator working in ink and risograph',
        'Furniture made one piece at a time, in oak and ash',
        'Photographs, mostly of people, mostly outdoors'
      ],
      items: [
        'Night Market, Field Notes, Paper Birds, Harbour Lights',
        'The Long Table, Ash Stool No. 4, Reading Chair, Kitchen Bench'
      ],
      contact: [
        'studio@example.com',
        'studio@example.com. Commissions open from September'
      ],
      more: [
        'I work slowly and take on a handful of commissions a year. If something here is close to what you are after, send me a line.',
        'Trained in Glasgow, working from a shed in the garden. Everything is made by hand, which is why there is not much of it.'
      ],
      intro: 'A few things I have made.'
    },
    personal: {
      tagline: [
        'Teacher, runner, occasional baker',
        'I write about cities and why they are the shape they are',
        'Nurse. Gardener. Very slow cyclist.'
      ],
      items: [
        'My newsletter: example.com/letter, Email me: hello@example.com, Photos: example.com/photos',
        'Read my writing: example.com, Book a call: example.com/calendar, Say hello: hello@example.com'
      ],
      contact: ['Based in Leeds', 'Usually replies within a day or two'],
      more: [
        'This page exists so I only have to hand out one address. Everything else is behind the buttons above.'
      ],
      intro: 'Everything in one place.'
    },
    classpage: {
      tagline: [
        'Everything you need for Year 5 Oak, in one place',
        'Homework, notices and dates for 4B',
        'Our class page — check it on Sunday evening'
      ],
      items: [
        'Spelling test: every Friday, Reading record: signed by Monday, PE kit: Tuesdays and Thursdays, Trip money due: 12 March',
        'Homework set: Wednesdays, due Monday, Library books: change on Fridays, Forest school: bring wellies on Tuesday'
      ],
      contact: [
        'mrjones@example.sch.uk — I read email in the evening',
        'Message through the school office, or catch me at the gate'
      ],
      more: [
        'Reading five times a week makes more difference than anything else we do. Ten minutes is plenty, and it does not have to be a school book.',
        'If something at home is making homework hard, tell me. It is never a problem, and I would rather know.'
      ],
      intro: 'Dates and jobs to keep an eye on.'
    },
    project: {
      tagline: [
        'Turns your reading notes into a library you can actually search',
        'Rota planning for small teams, without the spreadsheet',
        'A quieter way to keep track of what you spend'
      ],
      items: [
        'Instant search: finds a note before you finish typing, Works offline: your notes live on your machine, Plain text export: nothing is locked in',
        'Drag-and-drop rotas: build a week in a minute, Shift swaps: staff sort it out between themselves, Payroll export: one click, any format'
      ],
      contact: [
        'hello@example.app for early access',
        'Email hello@example.app and I will send you a link'
      ],
      more: [
        'It started because I could not find a note I knew I had written. It is small on purpose, and it will stay that way.'
      ],
      intro: 'What it actually does.'
    },
    resume: {
      tagline: [
        'Primary school teacher, eight years in Key Stage 2',
        'Site manager, twenty years on commercial builds',
        'Registered nurse, emergency and acute care'
      ],
      items: [
        'Class teacher: Hillside Primary, 2019 to now, Year 4 teacher: Oakfield Junior, 2016 to 2019, Teaching assistant: Oakfield Junior, 2015 to 2016',
        'Site manager: Corven Construction, 2014 to now, Assistant site manager: Bellway, 2009 to 2014'
      ],
      contact: [
        'name@example.com, 07700 900123',
        'name@example.com — happy to send references on request'
      ],
      more: [
        'I am happiest in a classroom that talks. My last two years have been leading reading across the school, and results went up in both.'
      ],
      intro: 'Where I have worked.'
    },
    game: {
      gamebrief: [
        'Year 5 science, 5 teams, 20 second timer',
        '8th grade history, 30 students, quick rounds',
        'Year 3 times tables, no timer, four teams'
      ]
    }
  };

  /* Rank the worked examples by how much they overlap with what the person
     has already said, so a bakery is offered loaves rather than gnudi. */
  function words(text) {
    var out = {};
    String(text || '').toLowerCase().split(/[^a-z]+/).forEach(function (w) {
      if (w.length > 3) { out[w] = 1; }
    });
    return out;
  }
  B.examplesFor = function (qid, typeId, context) {
    var lib = C[typeId] || C.business;
    if (qid === 'name') { return []; }
    var all = (lib[qid] || []).slice();
    var ctx = words(context);
    if (!Object.keys(ctx).length) { return all.slice(0, 3); }
    return all
      .map(function (text, i) {
        var score = 0;
        Object.keys(words(text)).forEach(function (w) { if (ctx[w]) { score += 1; } });
        return { text: text, score: score, i: i };
      })
      .sort(function (a, b) { return b.score - a.score || a.i - b.i; })
      .map(function (e) { return e.text; })
      .slice(0, 3);
  };

  B.introFor = function (typeId) {
    return (C[typeId] || {}).intro || '';
  };

  B.why = function (qid) { return WHY[qid] || 'It helps me put the right thing on the page.'; };
  B.mean = function (qid) { return MEAN[qid] || 'Tell me in your own words and I will sort it out.'; };

  /* ==================================================================
   * 4. Questions about the tool itself — answered honestly, including
   *    the things it genuinely cannot do.
   * ================================================================ */
  var CAN = [
    [/photo|image|picture|logo|pic\b/i,
      'Not directly — I cannot upload photos. Where a picture would go I make a coloured tile with your caption on it. Once you have downloaded the file you can drop your own images in, or leave it as it is; it looks deliberate either way.'],
    [/online|host|publish|web ?address|website address|domain|url|\blive\b|internet|put it on the web|real website|proper website/i,
      'The file works anywhere you put it. Email it, AirDrop it, drop it on a school drive, or upload it to any web host and it is a real website. I do not host it for you, and there is nothing to sign up for.'],
    [/shop|sell|buy|payment|checkout|cart|stripe|paypal|take money/i,
      'No, and I would rather say so than fudge it. Taking payments needs a server and an account with a payment company. This is one file with no server behind it, so the honest option is to put your email or phone on the page and take orders that way.'],
    [/^(?!.*(?:shop|sell|buy|payment|checkout|cart)).*(?:\bfree\b|\bcosts?\b|how much|\bprices?\b|subscription|\bcharge)/i,
      'Free, and there is no account. Nothing is stored anywhere — the page is built right here in your browser.'],
    [/edit|change (?:it )?later|update|fix (?:it )?later|wrong word/i,
      'Yes. Open the file you downloaded and there is an Edit text button in the corner. Turn it on, click any wording and retype it, then Save a copy. You never need to come back here.'],
    [/offline|wifi|internet connection|no signal|aeroplane|airplane/i,
      'Yes. Once the file is on your device it needs no internet at all. That is the whole point of it being one file.'],
    [/print/i,
      'Yes, printing is set up properly — the menu bar and buttons drop away and the text reflows. A CV or a menu prints particularly well.'],
    [/(?:contact )?form|submit|send me a message|enquir/i,
      'Not a form that emails you by itself — that needs a server too. Instead I make your email address a tappable button, which opens the visitor’s mail app with your address already filled in. It works everywhere and never breaks.'],
    [/(?:more|multiple|second|extra|another) pages?|several pages/i,
      'One page, built to scroll, with a menu at the top that jumps to each section. For most of what people ask me for, that reads better than several pages anyway.'],
    [/mobile|phone|ipad|tablet|responsive/i,
      'Yes — it is built for a phone first. Everything stacks, the menu folds into a button, and the text stays readable without pinching.'],
    [/google|search engine|seo|found/i,
      'It has a proper title and description built in, so if you upload it to a web host it can be found. Sitting in your Files app it cannot be, because it is not on the internet yet.'],
    [/how (?:does|do) (?:it|you) (?:work|build)/i,
      'You answer a few questions, I put your words into a layout that suits the kind of site you asked for, and then I write the whole thing — text, colours, layout, code — into a single file and hand it to you.'],
    [/language|spanish|french|welsh|translat/i,
      'Write your answers in whatever language you like and they go on the page exactly as you typed them. My own questions are only in English at the moment.'],
    [/safe|private|data|track|cookie/i,
      'Nothing you type leaves your browser, and the page I build has no trackers, no cookies and no analytics in it.']
  ];

  B.capability = function (text) {
    for (var i = 0; i < CAN.length; i += 1) {
      if (CAN[i][0].test(text)) { return CAN[i][1]; }
    }
    return null;
  };

  /* "Should I put X or Y?" deserves a straight answer, not a shrug. */
  B.choice = function (raw) {
    var t = String(raw).replace(/^\s*(?:should|shall|would|do)\s+(?:i|you|we)\s+/i, '').replace(/[?.!]+\s*$/, '');
    var bits = t.split(/\s+or\s+/i).map(function (x) { return x.trim(); }).filter(Boolean);
    if (bits.length === 2 && bits[0].length < 60 && bits[1].length < 60) {
      return 'Either reads fine. If you want me to pick: "' + bits[0] + '" \u2014 it is the one you said first, '
        + 'which is usually the one you mean. Nothing is stuck, either: you can retype any wording in the '
        + 'finished file with the Edit text button.';
    }
    return 'Go with whichever is truer. There is no wrong answer here, and every word on the page can be '
      + 'changed later with the Edit text button in the finished file.';
  };

  B.capabilityFallback = 'I am not certain about that one. Here is what I definitely do: a one-page site with your words, your colours and a tappable contact section, handed to you as a single file that works offline and that you can reword yourself later. No shops, no logins, no photo uploads.';
}(window.FORGE));
