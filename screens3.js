/* RESPAWN screens, part 3: search, notifications, wallet, messages, settings, rules, status, menu. */
(function (root) {
  'use strict';
  var RS = root.RS, ui = RS.ui, store = RS.store, D = root.RespawnData, Games = root.RespawnGames;
  var esc = ui.esc, icon = ui.icon, S = RS.S, h = RS.h, A = RS.actions, st = h.st;

  /* ---------- Search & Explore ---------- */
  function searchAll(q) {
    var s = st(), t = q.trim().toLowerCase(), isTag = t.charAt(0) === '#', tag = isTag ? t.slice(1) : '';
    var res = { gamers: [], posts: [], games: [], events: [], tags: [] };
    if (!t) return res;
    D.GAMERS.forEach(function (u) { if (!h.isBlocked(u.id) && !isTag && (u.username.toLowerCase().indexOf(t) !== -1 || u.bio.toLowerCase().indexOf(t) !== -1 || Games.byId(u.game).name.toLowerCase().indexOf(t) !== -1)) res.gamers.push(u); });
    s.myPosts.concat(D.POSTS).forEach(function (p) {
      if (h.isBlocked(p.authorId)) return;
      if (isTag ? p.tags.indexOf(tag) !== -1 : (p.text.toLowerCase().indexOf(t) !== -1 || p.tags.indexOf(t) !== -1)) res.posts.push(p);
    });
    if (!isTag) {
      Games.GAMES.forEach(function (g) { if (g.name.toLowerCase().indexOf(t) !== -1) res.games.push(g); });
      D.TOURNAMENTS.forEach(function (e) { if (e.title.toLowerCase().indexOf(t) !== -1 || Games.byId(e.game).name.toLowerCase().indexOf(t) !== -1) res.events.push(e); });
    }
    var seen = {}; D.POSTS.concat(s.myPosts).forEach(function (p) { p.tags.forEach(function (x) { if (x.indexOf(isTag ? tag : t) !== -1) seen[x] = 1; }); });
    D.CLIPS.forEach(function (c) { c.tags.forEach(function (x) { if (x.indexOf(isTag ? tag : t) !== -1) seen[x] = 1; }); });
    res.tags = Object.keys(seen);
    return res;
  }

  RS.screens.search = function () {
    var q = S.q || '', html = h.pageHead('Search') +
      '<label class="field"><span class="sr-only">Search RESPAWN</span><input type="search" id="q" data-bind="q" data-live value="' + esc(q) + '" placeholder="Gamers, posts, games, events, #hashtags" autocomplete="off" aria-label="Search"></label><div id="results" style="margin-top:14px">';
    html += searchResultsHtml(q) + '</div>';
    return html;
  };
  function searchResultsHtml(q) {
    if (!q.trim()) {
      var tags = {}; D.POSTS.concat(D.CLIPS).forEach(function (x) { x.tags.forEach(function (t) { tags[t] = (tags[t] || 0) + 1; }); });
      var top = Object.keys(tags).sort(function (a, b) { return tags[b] - tags[a] || a.localeCompare(b); }).slice(0, 8);
      var up = D.TOURNAMENTS.filter(function (t) { return t.state === 'registration_open'; });
      return ui.demoNotice('Search covers the sample content in this demo, plus your own posts.') +
        '<div class="section-title"><h2>Trending hashtags</h2></div><div class="row wrap">' + top.map(function (t) { return '<button class="chip btnlike" data-act="tag" data-tag="' + esc(t) + '">#' + esc(t) + '</button>'; }).join('') + '</div>' +
        '<div class="section-title"><h2>Recommended gamers</h2></div><div class="hscroll">' + D.GAMERS.filter(function (u) { return !h.isBlocked(u.id); }).slice(0, 6).map(function (u) { return '<a class="card tight col" href="#/player/' + u.id + '" style="min-width:140px;text-decoration:none;color:inherit">' + ui.avatar(u.username, { size: 'sm' }) + '<b class="small">' + esc(u.username) + '</b>' + ui.gameBadge(u.game) + '</a>'; }).join('') + '</div>' +
        '<div class="section-title"><h2>Upcoming events</h2></div><div class="stack">' + up.map(function (t) { return '<a class="card tight" href="#/tournament/' + t.id + '" style="text-decoration:none;color:inherit"><b>' + esc(t.title) + '</b><div class="xs muted">Starts ' + ui.fmtDate(t.startsAt) + ' · free entry</div></a>'; }).join('') + '</div>';
    }
    var r = searchAll(q), n = r.gamers.length + r.posts.length + r.games.length + r.events.length + r.tags.length;
    if (!n) return ui.empty('search', 'No results for “' + q.trim() + '”', 'Check the spelling, or try a game name or a hashtag.');
    var out = '';
    if (r.gamers.length) out += '<h3>Gamers</h3><div class="stack" style="margin:8px 0 16px">' + r.gamers.slice(0, 5).map(function (u) { return '<a class="card tight row" href="#/player/' + u.id + '" style="text-decoration:none;color:inherit">' + ui.avatar(u.username, { size: 'sm' }) + '<div class="grow"><b>' + esc(u.username) + '</b><div class="xs muted">' + esc(u.bio) + '</div></div>' + ui.gameBadge(u.game) + '</a>'; }).join('') + '</div>';
    if (r.posts.length) out += '<h3>Posts</h3><div class="stack" style="margin:8px 0 16px">' + r.posts.slice(0, 5).map(function (p) { var a = h.gamer(p.authorId); return '<a class="card tight" href="#/player/' + esc(p.authorId) + '" style="text-decoration:none;color:inherit"><b class="small">' + esc(a ? a.username : '') + '</b><p class="small">' + esc(p.text) + '</p></a>'; }).join('') + '</div>';
    if (r.games.length) out += '<h3>Games</h3><div class="row wrap" style="margin:8px 0 16px">' + r.games.map(function (g) { return ui.gameBadge(g.id); }).join('') + '</div>';
    if (r.events.length) out += '<h3>Events</h3><div class="stack" style="margin:8px 0 16px">' + r.events.slice(0, 5).map(function (t) { return '<a class="card tight" href="#/tournament/' + t.id + '" style="text-decoration:none;color:inherit"><b class="small">' + esc(t.title) + '</b><div class="xs muted">' + esc(D.STATE_LABELS[t.state]) + '</div></a>'; }).join('') + '</div>';
    if (r.tags.length) out += '<h3>Hashtags</h3><div class="row wrap" style="margin:8px 0">' + r.tags.slice(0, 10).map(function (t) { return '<button class="chip btnlike" data-act="tag" data-tag="' + esc(t) + '">#' + esc(t) + '</button>'; }).join('') + '</div>';
    return out;
  }
  RS.searchResultsHtml = searchResultsHtml;

  /* ---------- Notifications ---------- */
  RS.screens.notifications = function () {
    var list = st().notifications, unread = store.unread();
    return h.pageHead('Notifications') +
      (list.length ? '<div class="row between" style="margin-bottom:10px"><span class="small muted">' + unread + ' unread</span><button class="btn sm" data-act="read-all"' + (unread ? '' : ' disabled') + '>Mark all as read</button></div><div class="stack">' + list.map(function (n) {
        return '<button class="card tight row" style="width:100%;text-align:left;cursor:pointer;' + (n.read ? 'opacity:.7' : 'border-color:var(--accent)') + '" data-act="read" data-id="' + esc(n.id) + '"><span style="width:8px;height:8px;border-radius:50%;flex:none;background:' + (n.read ? 'transparent' : 'var(--accent-2)') + '"></span><span class="grow small">' + esc(n.text) + '</span><span class="xs muted">' + ui.timeAgo(n.at) + '</span></button>'; }).join('') + '</div>'
        : ui.empty('bell', 'You’re all caught up', 'Real notifications — messages, follows, results — arrive once accounts and the backend are live.')) +
      '<div style="margin-top:16px">' + ui.notice('', 'Everything listed here comes from actions you took on this device. No fake activity is generated.') + '</div>';
  };
  A.read = function (el) { st().notifications.forEach(function (n) { if (n.id === el.dataset.id) n.read = true; }); store.save(); RS.app.render(); };
  A['read-all'] = function () { st().notifications.forEach(function (n) { n.read = true; }); store.save(); RS.app.render(); };

  /* ---------- Wallet ---------- */
  RS.screens.wallet = function () {
    return h.pageHead('Wallet') +
      '<div class="card glow stack" style="text-align:center"><div class="muted small">RESPAWN Coins</div><div style="font-size:44px;font-weight:900;color:var(--warn)">0</div><div class="xs muted">Virtual items with no cash value. Not withdrawable.</div></div>' +
      '<div style="margin-top:12px">' + ui.notice('demo', '<b>The coin wallet is not live.</b> Balances must be controlled by the server with an auditable ledger so no one can give themselves coins. Until that backend is connected, this app never awards, spends or changes coins.') + '</div>' +
      '<div class="section-title"><h2>Transaction history</h2></div><div class="card">' + ui.empty('wallet', 'No transactions', 'Earned and spent coins will be listed here with their reasons.') + '</div>' +
      '<div class="section-title"><h2>Missions &amp; cosmetic store</h2></div>' + ui.notice('', 'Daily missions, reward claiming and the cosmetic store are not built yet. Free customization is always available in the <a href="#/studio">Customization Studio</a>.') +
      '<div class="section-title"><h2>Premium membership</h2></div><div class="card small stack"><p>A future optional membership could add extra cosmetic slots, layouts and creator tools. The free tier stays fully usable.</p><p class="muted">No payments are set up, and RESPAWN will never show a purchase as complete without a real payment provider confirming it.</p></div>';
  };

  /* ---------- Messages: local-only prototype, not live messaging ---------- */
  function chatUser(id) {
    for (var i = 0; i < D.GAMERS.length; i++) if (D.GAMERS[i].id === id) return D.GAMERS[i];
    return null;
  }
  function chatList() {
    if (!Array.isArray(st().chats)) st().chats = [];
    return st().chats;
  }
  function getChat(id) {
    var chats = chatList(), found = null;
    chats.forEach(function (c) { if (c.id === id) found = c; });
    if (!found) { found = { id: id, unread: 0, messages: [] }; chats.push(found); }
    if (!Array.isArray(found.messages)) found.messages = [];
    return found;
  }
  function messageClock(ts) {
    try { return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
    catch (e) { return ''; }
  }
  RS.screens.messages = function (id) {
    var chats = chatList();
    if (id) {
      var user = chatUser(id);
      if (!user) return h.pageHead('Messages', '#/messages') + ui.empty('mail', 'Conversation not found', 'Choose a demo conversation from your inbox.');
      var chat = getChat(id);
      if (chat.unread) { chat.unread = 0; store.save(); }
      var lines = chat.messages.map(function (m) {
        return '<div class="chat-line ' + (m.from === 'me' ? 'mine' : 'theirs') + '"><div class="chat-bubble">' + esc(m.text) + '<span class="chat-time">' + messageClock(m.at) + '</span></div></div>';
      }).join('');
      return '<div class="chat-screen"><div class="chat-convo-head"><a class="icon-btn" href="#/messages" aria-label="Back to messages">' + icon('back') + '</a>' +
        ui.avatar(user.username, { size: 'sm' }) + '<div class="grow chat-person"><b>' + esc(user.username) + '</b><span>DEMO PLAYER · ' + esc((Games.byId(user.game) || {}).short || 'GAMER') + '</span></div>' +
        '<a class="icon-btn" href="#/player/' + esc(user.id) + '" aria-label="View gamer profile">' + icon('id') + '</a></div>' +
        '<div class="chat-context"><span class="status-dot"></span> DEMO CONVERSATION <span>·</span> SAVED ON THIS DEVICE</div>' +
        '<div class="chat-log" id="chat-log" aria-label="Conversation with ' + esc(user.username) + '">' +
        (lines || '<div class="chat-empty"><span class="chat-empty-icon">' + icon('comment') + '</span><b>Start the conversation</b><p>Send a demo message below. Nothing is sent to another player.</p></div>') + '</div>' +
        '<div class="chat-composer"><input id="chat-text" type="text" maxlength="500" placeholder="Message ' + esc(user.username) + '…" autocomplete="off" aria-label="Write a message"><button class="btn primary chat-send" data-act="chat-send" data-id="' + esc(id) + '" aria-label="Send message">' + icon('share') + '<span>Send</span></button></div>' +
        '<p class="chat-footnote">Prototype only. Real-time private chat needs accounts and a secure backend.</p></div>';
    }
    var sorted = chats.slice().sort(function (a, b) {
      var aa = a.messages && a.messages.length ? a.messages[a.messages.length - 1].at : 0;
      var bb = b.messages && b.messages.length ? b.messages[b.messages.length - 1].at : 0;
      return bb - aa;
    });
    var listed = sorted.map(function (c) {
      var u = chatUser(c.id); if (!u) return '';
      var last = c.messages && c.messages.length ? c.messages[c.messages.length - 1] : null;
      var preview = last ? (last.from === 'me' ? 'You: ' : '') + last.text : 'Start a conversation';
      return '<a class="chat-row" href="#/messages/' + esc(c.id) + '">' + ui.avatar(u.username, { size: 'lg' }) +
        '<span class="chat-row-copy"><span class="chat-row-top"><b>' + esc(u.username) + '</b><time>' + (last ? ui.timeAgo(last.at) : '') + '</time></span>' +
        '<span class="chat-row-preview">' + esc(preview) + '</span><span class="chat-row-game">' + esc((Games.byId(u.game) || {}).name || 'Gamer') + '</span></span><span class="chat-row-arrow" aria-hidden="true">›</span></a>';
    }).join('');
    return h.pageHead('Messages') +
      '<div class="chat-intro"><div><span class="eyebrow">YOUR INBOX</span><h2>Squad comms, simplified.</h2><p>Keep the next match one message away.</p></div><span class="chat-intro-mark">' + icon('comment') + '</span></div>' +
      '<div class="chat-disclaimer"><span class="chat-disclaimer-dot"></span><span><b>Demo inbox</b> · These are fictional sample conversations. Messages you send stay on this device; no player receives them.</span></div>' +
      '<section class="chat-list" aria-label="Conversations"><div class="chat-section-head"><h3>Recent</h3><span>' + sorted.length + ' chats</span></div>' +
      (listed || '<div class="empty"><h3>No conversations yet</h3><p class="small">Open a gamer profile to start a demo conversation.</p></div>') + '</section>';
  };
  A['chat-send'] = function (el) {
    var input = document.getElementById('chat-text'), text = input ? input.value.trim() : '', id = el.dataset.id;
    if (!text) { ui.toast('Write a message first'); if (input) input.focus(); return; }
    if (text.length > 500) text = text.slice(0, 500);
    var user = chatUser(id); if (!user) { ui.toast('Conversation not found', 'err'); return; }
    var chat = getChat(id); chat.messages.push({ from: 'me', text: text, at: Date.now() }); chat.unread = 0;
    store.save(); RS.app.render();
    var log = document.getElementById('chat-log'), next = document.getElementById('chat-text');
    if (log) log.scrollTop = log.scrollHeight;
    if (next) next.focus();
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'chat-text' && !e.shiftKey) {
      e.preventDefault();
      var button = document.querySelector('[data-act="chat-send"]');
      if (button && RS.actions['chat-send']) RS.actions['chat-send'](button, e);
    }
  });

  /* ---------- Settings, blocked users ---------- */
  RS.screens.settings = function () {
    var s = st(), p = s.profile; if (!p.show) p.show = { bio: true, rank: true, region: true, languages: true };
    function tg(label, path, val) { return '<label class="toggle"><span>' + label + '</span><input type="checkbox" data-bind="' + path + '" data-store' + (val ? ' checked' : '') + '></label>'; }
    var blocked = s.blocked.map(function (id) { return h.gamer(id); }).filter(Boolean);
    return h.pageHead('Settings & privacy') +
      (store.persisted ? '' : ui.notice('err', 'Your browser is blocking storage, so progress resets when you close this tab.') + '<div style="height:12px"></div>') +
      '<div class="card stack"><h3>Profile visibility</h3><label class="field">Who can see your Gamer ID<select data-bind="profile.visibility" data-store data-rerender><option value="private"' + (p.visibility === 'private' ? ' selected' : '') + '>Private (default)</option><option value="public"' + (p.visibility === 'public' ? ' selected' : '') + '>Public</option></select></label>' +
      tg('Show my bio', 'profile.show.bio', p.show.bio) + tg('Show my rank (self-reported)', 'profile.show.rank', p.show.rank) + tg('Show my region', 'profile.show.region', p.show.region) + tg('Show my languages', 'profile.show.languages', p.show.languages) +
      '<p class="xs muted">Your age, in-game IDs, exact location and contact details are never shown. In demo mode these choices only change the “Public preview”.</p></div>' +
      '<div class="section-title"><h2>Blocked players</h2></div><div class="card">' + (blocked.length ? blocked.map(function (u) { return '<div class="row between" style="min-height:48px"><b>' + esc(u.username) + '</b><button class="btn sm" data-act="unblock" data-id="' + u.id + '">Unblock</button></div>'; }).join('') : '<p class="small muted">You haven’t blocked anyone.</p>') + '</div>' +
      '<div class="section-title"><h2>Reports</h2></div><div class="card small">' + (s.reports.length ? s.reports.length + ' report' + (s.reports.length === 1 ? '' : 's') + ' saved on this device. The reported content is hidden for you. No moderator has received them (demo).' : 'No reports sent.') + '</div>' +
      '<div class="section-title"><h2>More</h2></div><div class="stack"><a class="btn block" href="#/rules">Community rules</a><a class="btn block" href="#/status">Feature status</a><button class="btn block danger" data-act="reset-demo">Reset all demo data</button></div>';
  };
  A.unblock = function (el) { st().blocked = st().blocked.filter(function (x) { return x !== el.dataset.id; }); store.save(); ui.toast('Unblocked'); RS.app.render(); };
  A['reset-demo'] = function () {
    ui.sheet('Reset everything?', '<p class="small muted">This erases your profile, posts, follows, blocks and invites from this device. It can’t be undone.</p><div class="row" style="margin-top:14px"><button class="btn grow" data-act="close">Cancel</button><button class="btn danger grow" data-act="reset-yes">Erase</button></div>');
  };
  A['reset-yes'] = function () { store.reset(); S.f = null; S.studio = null; S.onb = { step: 1, games: [], username: '', bio: '', region: 'North India', languages: ['English'], mic: 'Speaks', entries: {}, error: '' }; ui.closeOverlay(); location.hash = '#/welcome'; location.reload(); };

  /* ---------- Community rules ---------- */
  RS.screens.rules = function () {
    var rules = [
      ['Be kind', 'No bullying, hate or harassment. Trash talk that makes someone feel bad is not okay.'],
      ['Keep personal info private', 'Never share your address, school, phone number, exact location or passwords — and never ask others for theirs.'],
      ['Play fair', 'No cheats, hacks, account selling or scams.'],
      ['Keep it age-appropriate', 'No graphic, sexual or otherwise unsuitable content. RESPAWN includes players as young as 11.'],
      ['No gambling or real-money wagering', 'Events are free to enter and rewards are virtual items only.'],
      ['Be yourself', 'No pretending to be another player, creator or organizer.'],
      ['Report and block', 'If something feels wrong, report it and block the player. You can always say no to an invite.']
    ];
    return h.pageHead('Community rules', '#/settings') + '<div class="stack">' + rules.map(function (r, i) { return '<div class="card tight"><b>' + (i + 1) + '. ' + esc(r[0]) + '</b><p class="small muted">' + esc(r[1]) + '</p></div>'; }).join('') + '</div>' +
      '<div style="margin-top:12px">' + ui.notice('demo', 'Draft rules for the demo. Before a public launch they need legal review against applicable Indian privacy and child-safety requirements.') + '</div>';
  };

  /* ---------- Feature status (honest) ---------- */
  var STATUS = RS.STATUS = [
    ['A', 'Squad matching algorithm: weights total 100, hard constraints, explanations, determinism, filters, pagination', 'Unit-tested (Node)'],
    ['A', 'Sample data validity and algorithm ranking on varied profiles', 'Unit-tested (Node)'],
    ['A', 'Onboarding, navigation, feed actions, Squad Finder flow, ARENA, Gamer ID + studio, search, notifications, reporting/blocking in a mobile browser', 'Browser suite available; visual-refresh rerun pending Playwright Chromium'],
    ['C', 'Feed posts, likes, comments, follows, bookmarks', 'Demo — saved only on this device'],
    ['C', 'FRAGZ clips', 'Demo — no video files; upload checks files but stores nothing'],
    ['C', 'Squad invites, ARENA registration, achievements, notifications, reports, blocks', 'Demo — local only; nobody else is notified'],
    ['C', 'Gamer ID and Customization Studio (free items)', 'Demo — saved on this device'],
    ['D', 'Accounts: sign-up, login, password reset, sessions', 'Needs a backend (e.g. Supabase) — schema is tested locally, but the app does not call it yet'],
    ['A', 'Database schema + access rules (RLS) + server-owned coin ledger: 69 security checks incl. a 3-way concurrent double-spend race', 'Tested on local PostgreSQL 16 with a Supabase stand-in — NOT yet on a real Supabase project'],
    ['D', 'Running that schema on a real Supabase project and connecting the app to it', 'Needs your free Supabase account; app is not wired to it yet'],
    ['D', 'Media storage for images, clips, voice intros', 'Needs a storage provider'],
    ['D', 'Real-time chat, push notifications', 'Needs backend'],
    ['D', 'Hosting / public preview link', 'Not deployed'],
    ['C', 'One-to-one chat interface', 'Prototype only — demo messages stay on this device; no live messaging or group chat'],
    ['E', 'Real-time chat and group chat', 'Not built — needs accounts and secure backend'],
    ['E', 'Squads (create, join, leave, members) and incoming requests', 'Not built'],
    ['E', 'Comment replies, post editing, drafts, image/video posting', 'Not built'],
    ['E', 'Coin wallet, missions, cosmetic store, subscriptions', 'Not built (server-owned ledger required)'],
    ['E', 'Tournament creation, brackets, result reporting/verification, leaderboards, disputes', 'Not built'],
    ['E', 'Admin moderation dashboard, audit logs, rate limits', 'Not built'],
    ['E', 'Voice introduction, data-saver mode, official game integrations, Android APK', 'Not built']
  ];
  var CAT = { A: ['Implemented and tested', 'pill-ok'], B: ['Implemented, not yet tested', 'pill-warn'], C: ['Demo-only', 'pill-info'], D: ['Needs external setup', 'pill-warn'], E: ['Not implemented', 'pill-bad'] };
  RS.screens.status = function () {
    var html = h.pageHead('Feature status', '#/settings') + '<p class="small muted" style="margin-bottom:12px">An honest list of what works, what is a demo, and what is missing.</p>';
    ['A', 'B', 'C', 'D', 'E'].forEach(function (c) {
      var rows = STATUS.filter(function (r) { return r[0] === c; });
      html += '<div class="section-title"><h2>' + c + '. ' + CAT[c][0] + '</h2></div>' + (rows.length ? '<div class="stack">' + rows.map(function (r) { return '<div class="card tight"><div class="small">' + esc(r[1]) + '</div><span class="chip wrapok ' + CAT[c][1] + '" style="margin-top:6px">' + esc(r[2]) + '</span></div>'; }).join('') + '</div>' : '<p class="small muted">Nothing in this category.</p>');
    });
    return html;
  };

  /* ---------- Menu drawer ---------- */
  A.menu = function () {
    var items = [['search', 'Search & Explore', '#/search'], ['bell', 'Notifications', '#/notifications'], ['mail', 'Messages', '#/messages'], ['users', 'Squad invitations', '#/invites'], ['wallet', 'Wallet', '#/wallet'],
      ['palette', 'Customization Studio', '#/studio'], ['settings', 'Settings & privacy', '#/settings'], ['shield', 'Community rules', '#/rules'], ['list', 'Feature status', '#/status']];
    ui.drawer('<div class="row between" style="margin-bottom:8px;padding:0 6px"><b style="letter-spacing:.12em">MENU</b><button class="icon-btn" data-act="close" aria-label="Close menu">' + icon('x') + '</button></div>' +
      items.map(function (i) { return '<a href="' + i[2] + '" data-act="close">' + icon(i[0]) + esc(i[1]) + '</a>'; }).join(''));
  };
})(typeof self !== 'undefined' ? self : this);
