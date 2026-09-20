/* Game Forge — the model-backed conversation, when one is available.
 *
 * The scripted interview in brain.js still runs everything offline: from a
 * downloaded file, from the artifact, or from a deploy with no key set. This
 * layer only takes over when the site has an endpoint and a key behind it.
 *
 * The model never writes HTML. It fills in the same fields the scripted
 * interview fills in, and the browser builds the page from those, so a strange
 * answer can cost you a wrong word but never a broken site.
 */
window.FORGE = window.FORGE || {};

(function (F) {
  'use strict';

  var AI = {
    endpoint: '/api/forge-chat',
    available: false,
    provider: null,
    log: []           /* the conversation as the model sees it */
  };
  F.AI = AI;

  var FIELDS = ['type', 'name', 'tagline', 'items', 'contact', 'more', 'theme', 'gamebrief', 'gameshape'];

  /* A GET costs nothing and tells us whether a key is configured. Anything
     other than a clear yes means we stay on the scripted interview. */
  AI.probe = function () {
    if (window.location.protocol === 'file:') {
      return Promise.resolve(false);
    }
    return new Promise(function (resolve) {
      var done = false;
      var finish = function (ok, provider) {
        if (done) { return; }
        done = true;
        AI.available = !!ok;
        AI.provider = provider || null;
        resolve(AI.available);
      };
      window.setTimeout(function () { finish(false); }, 4000);
      window.fetch(AI.endpoint, { method: 'GET' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) { finish(data && data.ok, data && data.provider); })
        .catch(function () { finish(false); });
    });
  };

  AI.reset = function () { AI.log = []; };

  AI.push = function (role, content) {
    AI.log.push({ role: role, content: String(content) });
    if (AI.log.length > 30) { AI.log = AI.log.slice(-30); }
  };

  /* Returns { reply, patch, ready } or throws. The caller decides whether a
     throw means "show an error" or "quietly go back to the script". */
  AI.turn = function (known) {
    var payload = { messages: AI.log, known: {} };
    FIELDS.forEach(function (k) {
      payload.known[k] = (known && known[k] !== undefined && known[k] !== '') ? known[k] : null;
    });

    return window.fetch(AI.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) { throw new Error(data && data.error ? data.error : 'Request failed'); }
        return data;
      });
    }).then(function (data) {
      if (!data || typeof data.reply !== 'string') { throw new Error('Unexpected reply'); }
      var patch = {};
      FIELDS.forEach(function (k) {
        var v = data.patch ? data.patch[k] : null;
        if (typeof v === 'string' && v.trim()) { patch[k] = v.trim(); }
      });
      AI.push('assistant', data.reply);
      return { reply: data.reply, patch: patch, ready: !!data.ready };
    });
  };

  /* Enough to build something worth looking at. Mirrors the function's own
     rule so the client never waits on a model that has stopped saying ready. */
  AI.buildable = function (known) {
    if (!known || !known.type || !known.name) { return false; }
    if (F.SITE.TYPES[known.type] && F.SITE.TYPES[known.type].isGame) {
      return !!known.gamebrief;
    }
    return !!(known.tagline || known.items || known.contact);
  };
}(window.FORGE));
