(function () {
  const FLOORS = window.FLOORS, B = window.B4, $ = (s) => document.querySelector(s), byId = (id) => FLOORS.find((f) => f.id === id);
  const ORDER = ['t', 'f3', 'f2', 'f1', 'g'], touch = matchMedia('(hover: none)').matches, body = document.body;
  if (!window.World || !B) { $('#fatal').hidden = false; $('#veil').classList.remove('on'); return; }
  let current = null, mode = 'ext', plan = null, lastRoom = null, hT;
  const veil = (on, t) => { if (t) $('#veilText').textContent = t; $('#veil').classList.toggle('on', on); };
  const hint = (t) => { const h = $('#stageHint'); h.textContent = t; h.classList.add('on'); clearTimeout(hT); hT = setTimeout(() => h.classList.remove('on'), 9000); };

  const world = new window.World($('#view3d'), {
    onLevelHover: (id) => { const c = $('#heroCard'); body.classList.toggle('lvl', !!id); $('#floorRail').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id)); if (!id) return; const f = byId(id), a = world.levelAnchor(id); $('#hcNum').textContent = f.short; $('#hcTitle').textContent = f.title; $('#hcTag').textContent = f.tag; if (innerWidth > 900) { c.style.left = Math.min(innerWidth - 300, a.x + innerWidth * 0.14) + 'px'; c.style.top = a.y - 50 + 'px'; } },
    onLevel: (id) => enterLevel(id),
    onMode: setMode, onRoom: showRoom,
    onHover: (id) => $('#roomList').querySelectorAll('button').forEach((b) => b.classList.toggle('hover', b.dataset.id === id)),
    onSelect: (t) => { $('#selBar').hidden = !t; if (t) $('#selName').textContent = t; },
    onWhere: (w) => { if (plan) plan.setMe(w.x, w.y, w.yaw); const r = world.roomAt(w.x, w.y); if (r && r.id !== lastRoom) showRoom(r.id); $('#liftBtn').hidden = !(r && /lift|lobby|stair/.test(r.id)); },
  });
  window.b4world = world;

  /* ---------- landing ---------- */
  ORDER.forEach((id) => { const f = byId(id);
    for (const [host, cls] of [['#floorRail', 'li'], ['#fvRail', '']]) { const b = document.createElement('button'); b.dataset.id = id; b.innerHTML = `<span class="n">${f.short}</span><span class="t">${f.title}</span>`;
      if (cls) { b.addEventListener('mouseenter', () => { world.hoverLevel(id); world.cb.onLevelHover(id); }); b.addEventListener('click', () => enterLevel(id)); const li = document.createElement('li'); li.appendChild(b); $(host).appendChild(li); }
      else { b.addEventListener('click', () => goLevel(id)); $(host).appendChild(b); } } });
  $('#floorRail').addEventListener('mouseleave', () => { world.hoverLevel(null); world.cb.onLevelHover(null); });
  $('#heroCard').addEventListener('click', () => world.extHover && enterLevel(world.extHover));
  function showHouse() { body.classList.remove('inside', 'walk'); mode = 'ext'; current = null; world.showExterior(); history.replaceState(null, '', location.pathname); closeAll(); }
  function enterLevel(id) { if (body.classList.contains('busy')) return; body.classList.add('busy'); body.classList.remove('lvl'); world.diveTo(id, () => { veil(true, byId(id).title); setTimeout(() => { selectFloor(id); body.classList.add('inside'); veil(false); body.classList.remove('busy'); }, 420); }); }

  /* ---------- inside ---------- */
  function selectFloor(id) {
    const f = byId(id); current = f; lastRoom = null;
    $('#fvRail').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    $('#fvNum').textContent = f.short; $('#exTitle').textContent = f.title; $('#exTag').textContent = f.tag; $('#exSummary').textContent = f.summary;
    $('#exStats').innerHTML = f.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const list = $('#roomList'); list.innerHTML = f.rooms.filter((r) => !/^(t?lobby|.*strip|westwalk|pooldeck)$/.test(r.id)).map((r) => `<li><button data-id="${r.id}"><span>${r.name}</span><span>${(r.size || '').split('·')[0]}</span></button></li>`).join('');
    list.querySelectorAll('button').forEach((b) => { b.addEventListener('mouseenter', () => world.highlight(b.dataset.id)); b.addEventListener('mouseleave', () => world.highlight(null)); b.addEventListener('click', () => world.enterRoom(b.dataset.id)); });
    world.setOffset(innerWidth > 900 ? ($('#fvPanel').offsetWidth + 24) / 2 - 20 : 0); world.load(f); setMode('doll');
    plan = window.Plan2D.render($('#miniPlan'), f, { onSelect: (rid) => world.enterRoom(rid) }, { rot: false, mini: true });
    history.replaceState(null, '', `#level-${f.short.toLowerCase()}`);
  }
  function setMode(m) { mode = m; body.classList.toggle('walk', m === 'walk'); $('#walkBtn').textContent = m === 'walk' ? 'Dollhouse view' : 'Walk inside'; $('#backLabel').textContent = m === 'walk' ? 'Dollhouse' : 'The House';
    $('#mini').hidden = m !== 'walk'; $('#roomCard').hidden = m !== 'walk' || !lastRoom; $('#joy').hidden = !(m === 'walk' && touch); if (m !== 'walk') $('#liftBtn').hidden = true;
    hint(m === 'walk' ? (touch ? 'Drag to look · joystick to walk · tap the floor to go there · tap furniture to edit it' : 'Drag to look · W A S D or click the floor to walk · drag furniture to move it · R rotates · Del removes') : 'Drag to turn the model · scroll to zoom · click a room to step inside'); }
  function showRoom(id) { const r = current && current.rooms.find((x) => x.id === id); if (!r) return; lastRoom = id; const rc = $('#roomCard'); rc.hidden = mode !== 'walk';
    $('#rcFloor').textContent = current.title; $('#rcName').textContent = r.name; $('#rcSize').textContent = r.size || ''; $('#rcNotes').textContent = r.notes || ''; rc.classList.remove('in'); void rc.offsetWidth; rc.classList.add('in'); if (plan) plan.highlight(null, id); }
  /** change level: by lift when walking (doors close, ride, doors open), by crossfade otherwise */
  function goLevel(id, then) { if (!current || current.id === id) { then && then(); return; } const f = byId(id), walking = mode === 'walk', L = $('#lift');
    if (walking) { $('#liftNum').textContent = current.short; $('#liftTxt').textContent = 'Lift to ' + f.title; L.classList.add('shut'); setTimeout(() => { $('#liftNum').textContent = f.short; selectFloor(id); const p = world.liftPose(); world.standAt(p.at, p.yaw); showRoom((world.roomAt(p.at[0], p.at[1]) || {}).id); setTimeout(() => { L.classList.remove('shut'); then && then(); }, 900); }, 800); }
    else { veil(true, f.title); setTimeout(() => { selectFloor(id); veil(false); then && then(); }, 400); } }
  $('#fvBack').addEventListener('click', () => (mode === 'walk' ? world.overview() : showHouse()));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && body.classList.contains('inside') && !/INPUT/.test(e.target.tagName)) (mode === 'walk' ? world.overview() : showHouse()); });
  $('#walkBtn').addEventListener('click', () => (mode === 'walk' ? world.overview() : world.enterSpawn()));
  $('#timeSeg').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => setTime(b.dataset.n === '1')));
  function setTime(n) { $('#timeSeg').querySelectorAll('button').forEach((x) => x.classList.toggle('on', (x.dataset.n === '1') === n)); world.setNight(n); }
  $('#rotBtn').addEventListener('click', () => world.rotateSelected()); $('#delBtn').addEventListener('click', () => world.deleteSelected());
  $('#liftBtn').addEventListener('click', () => { $('#fvRail').classList.add('pulse'); hint('Lift: pick a level on the right'); setTimeout(() => $('#fvRail').classList.remove('pulse'), 4000); });
  const SW = ['#D8CFC2', '#F0ECE4', '#A89D8F', '#8F9A86', '#70745F', '#5B6068', '#B07F52', '#9C5B47', '#3F4246', '#C2A468'];
  $('#selSw').innerHTML = SW.map((c) => `<i style="background:${c}" data-c="${c}"></i>`).join(''); $('#selSw').addEventListener('click', (e) => e.target.dataset.c && world.tintItems(e.target.dataset.c));

  /* ---------- panels ---------- */
  const closeAll = () => ['cust', 'ai', 'dash'].forEach((k) => ($('#' + k).hidden = true));
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => ($('#' + b.dataset.close).hidden = true)));
  const toggle = (k) => { const el = $('#' + k), was = el.hidden; closeAll(); el.hidden = !was; };
  $('#custBtn').addEventListener('click', () => toggle('cust')); $('#aiBtn').addEventListener('click', () => toggle('ai')); $('#dashBtn').addEventListener('click', () => toggle('dash'));

  /* ---------- customise ---------- */
  const pills = (host, items, on, cur) => { $(host).innerHTML = items.map(([k, l]) => `<button data-k="${k}" class="${k === cur ? 'on' : ''}">${l}</button>`).join(''); $(host).querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { $(host).querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); on(b.dataset.k); })); };
  const COLS = [['wall', 'Walls'], ['fabric', 'Upholstery'], ['accent', 'Accent'], ['joinery', 'Wardrobes'], ['kitchen', 'Kitchen'], ['fins', 'Fins'], ['frame', 'Window frames']];
  function drawCust() { const th = B.THEME();
    pills('#presets', Object.keys(B.PRESETS).map((k) => [k, k]), (k) => { world.setTheme(B.PRESETS[k]); drawCust(); });
    pills('#floorsT', Object.entries(B.FLOORS_T).map(([k, v]) => [k, v.label]), (k) => world.setTheme({ floor: k }), th.floor);
    $('#colRows').innerHTML = COLS.map(([k, l]) => `<label class="crow"><span>${l}</span><input type="color" data-k="${k}" value="${th[k]}"></label>`).join('');
    $('#colRows').querySelectorAll('input').forEach((i) => i.addEventListener('input', () => world.setTheme({ [i.dataset.k]: i.value })));
    pills('#addObj', Object.keys(window.B4DIM).map((k) => [k, k]), (k) => { if (!current) return hint('Step into a level first'); if (!world.addItem(k)) hint('No free space there. Walk to an open spot and try again'); });
    pills('#qSeg', [['low', 'Low'], ['med', 'Medium'], ['high', 'High'], ['ultra', 'Ultra 4K']], (k) => world.setQuality(k), world.quality); }
  drawCust(); $('#resetBtn').addEventListener('click', () => world.resetLayout());

  /* ---------- overview dashboard ---------- */
  $('#dFacts').innerHTML = [['≈ 2,000', 'sq ft plot · 9.75 × 19 m'], ['G + 3', 'stilt, three residences, terrace'], ['6', 'bedrooms · 2BR / 4BR / 6BR stays'], ['11 × 11 ft', 'plunge pool, sunk in the terrace'], ['1.5 ft', 'sunken conversation pit'], ['2 storeys', 'backlit onyx wall']].map(([n, l]) => `<div class="gcard"><b>${n}</b><span>${l}</span></div>`).join('');
  $('#dLevels').innerHTML = ORDER.map((id) => { const f = byId(id); return `<button class="gcard" data-id="${id}"><i>${f.short}</i><b>${f.title}</b><span>${f.tag}</span><em>Step inside →</em></button>`; }).join('');
  $('#dLevels').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { closeAll(); enterLevel(b.dataset.id); }));
  $('#dMats').innerHTML = [['Spanish Beige marble', '#E2D2B8'], ['Warm white walls', '#EFEBE4'], ['Backlit onyx', '#EBD3A4'], ['Kota Brown', '#87705C'], ['Timber fins', '#A8774D'], ['Black granite', '#343436']].map(([l, c]) => `<div class="mrow"><i style="background:${c}"></i>${l}</div>`).join('');
  $('#dFeat').innerHTML = ['Open-air stilt with south garden', 'Fountain in the shear-wall plane', 'Mandir in the first-floor north-east', 'Double-height retreat on the second floor', 'Lift and stair to every level', 'Flush plunge pool and pergola on the terrace'].map((x) => `<li>${x}</li>`).join('');
  $('#dTour').innerHTML = ['Turn the house, click a level', 'Dollhouse view, then walk inside', 'Drag furniture, rotate, recolour', 'Change colours and materials', 'Day and evening lighting', 'Ask the AI guide to show you around'].map((x) => `<li>${x}</li>`).join('');

  /* ---------- joystick ---------- */
  (function () { const j = $('#joy'), k = j.firstElementChild; let id = null, cx = 0, cy = 0; const set = (x, y) => { const l = Math.hypot(x, y), m = 44; if (l > m) { x = (x / l) * m; y = (y / l) * m; } k.style.transform = `translate(${x}px,${y}px)`; world.joy = { x: x / m, y: y / m }; };
    j.addEventListener('pointerdown', (e) => { id = e.pointerId; j.setPointerCapture(id); const r = j.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; set(e.clientX - cx, e.clientY - cy); }); j.addEventListener('pointermove', (e) => e.pointerId === id && set(e.clientX - cx, e.clientY - cy)); const end = () => { id = null; set(0, 0); }; j.addEventListener('pointerup', end); j.addEventListener('pointercancel', end); })();

  /* ---------- AI guide (Gemini, with tools that drive the tour) ---------- */
  const KEY = 'b4-gemini-key', log = $('#aiLog'), hist = []; let model = null;
  const getKey = () => localStorage.getItem(KEY) || window.B4_GEMINI_KEY || '';
  const say = (who, t) => { const d = document.createElement('div'); d.className = 'msg ' + who; d.textContent = t; log.appendChild(d); log.scrollTop = 1e6; return d; };
  const keyUI = () => { const has = !!getKey(); $('#aiKeyBox').hidden = has; $('#aiForm').hidden = !has; $('#aiForget').hidden = !has; if (has && !log.children.length) say('ai', 'Hello. I can walk you through B4, explain any room, switch day and evening, and change colours, materials or furniture. Where shall we start?'); };
  $('#aiSave').addEventListener('click', () => { const v = $('#aiKey').value.trim(); if (v) { localStorage.setItem(KEY, v); $('#aiKey').value = ''; keyUI(); } });
  $('#aiForget').addEventListener('click', () => { localStorage.removeItem(KEY); model = null; keyUI(); }); keyUI();
  const P = (o, req) => ({ type: 'OBJECT', properties: o, required: req || [] }), S = (d, e) => ({ type: 'STRING', description: d, ...(e ? { enum: e } : {}) });
  const TOOLS = [{ functionDeclarations: [
    { name: 'go_to', description: 'Move the visitor. Give a level, and optionally a room id on that level to stand inside it. view "dollhouse" shows the level from above; "exterior" shows the whole house.', parameters: P({ level: S('level id', ['g', 'f1', 'f2', 'f3', 't']), room: S('room id on that level'), view: S('view', ['walk', 'dollhouse', 'exterior']) }) },
    { name: 'set_time', description: 'Switch lighting', parameters: P({ time: S('time', ['day', 'evening']) }, ['time']) },
    { name: 'set_design', description: 'Change the colour scheme or materials of the whole house. Colours are hex like #D8CFC2.', parameters: P({ preset: S('preset', Object.keys(B.PRESETS)), floor: S('floor material', Object.keys(B.FLOORS_T)), wall: S('hex'), fabric: S('hex'), accent: S('hex'), joinery: S('hex'), kitchen: S('hex'), fins: S('hex'), frame: S('hex') }) },
    { name: 'edit_objects', description: 'Add, remove or recolour furniture on the current level.', parameters: P({ action: S('action', ['add', 'remove', 'recolor']), type: S('object type', Object.keys(window.B4DIM)), room: S('room id'), color: S('hex colour for recolor') }, ['action', 'type']) },
  ] }];
  const sys = () => 'You are the guide and interior designer for B4, a private G+3 villa at Godrej Hillview, Khopoli. Be warm, specific and brief (2 to 4 sentences). Use the tools to take the visitor places and to make design changes, then describe what they are seeing. Only state facts from the data below. Vastu is a traditional design framework, not a guarantee.\nNow: ' + JSON.stringify(world.state()) + '\nHouse: ' + JSON.stringify(FLOORS.map((f) => ({ id: f.id, title: f.title, summary: f.summary, rooms: f.rooms.map((r) => ({ id: r.id, name: r.name, size: r.size, notes: r.notes })) })));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function run(name, a) {
    if (name === 'go_to') { if (a.view === 'exterior') { showHouse(); return { ok: true }; } const id = a.level || (current && current.id) || 'f1'; if (!body.classList.contains('inside')) { selectFloor(id); body.classList.add('inside'); } else await new Promise((r) => goLevel(id, r)); await wait(300);
      if (a.room) { if (!world.enterRoom(a.room)) return { ok: false, error: 'no such room on this level', rooms: current.rooms.map((r) => r.id) }; } else if (a.view === 'walk') world.enterSpawn(); else if (a.view === 'dollhouse') world.overview(); return { ok: true, now: world.state() }; }
    if (name === 'set_time') { setTime(a.time === 'evening'); return { ok: true }; }
    if (name === 'set_design') { const { preset, ...rest } = a; if (preset && B.PRESETS[preset]) world.setTheme(B.PRESETS[preset]); world.setTheme(rest); drawCust(); return { ok: true, theme: B.THEME() }; }
    if (name === 'edit_objects') { if (!current) return { ok: false, error: 'enter a level first' }; if (a.action === 'add') return { ok: !!world.addItem(a.type, a.room) }; if (a.action === 'remove') return { ok: true, removed: world.removeItems(a.type, a.room) }; const l = world.find(a.type, a.room); world.tintItems(a.color || '#D8CFC2', l); return { ok: true, changed: l.length }; }
    return { ok: false };
  }
  async function api(path, bodyObj) { const r = await fetch('https://generativelanguage.googleapis.com/v1beta/' + path, { method: bodyObj ? 'POST' : 'GET', headers: { 'x-goog-api-key': getKey(), 'Content-Type': 'application/json' }, body: bodyObj && JSON.stringify(bodyObj) }); const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || r.status); return j; }
  async function pickModel() { if (model) return model; try { const l = (await api('models?pageSize=200')).models || []; const c = l.filter((m) => /generateContent/.test((m.supportedGenerationMethods || []).join()) && /gemini-[\d.]+-flash$/.test(m.name)).map((m) => m.name.replace('models/', '')).sort((a, b) => parseFloat(b.split('-')[1]) - parseFloat(a.split('-')[1])); model = c[0] || 'gemini-2.0-flash'; } catch (e) { model = 'gemini-2.0-flash'; } return model; }
  $('#aiForm').addEventListener('submit', async (e) => { e.preventDefault(); const t = $('#aiIn').value.trim(); if (!t) return; $('#aiIn').value = ''; say('me', t); hist.push({ role: 'user', parts: [{ text: t }] }); const wait1 = say('ai', '…');
    try { const md = await pickModel(); for (let i = 0; i < 6; i++) { const res = await api(`models/${md}:generateContent`, { systemInstruction: { parts: [{ text: sys() }] }, contents: hist, tools: TOOLS }); const c = res.candidates && res.candidates[0] && res.candidates[0].content; if (!c) throw new Error('No reply'); hist.push(c);
        const calls = (c.parts || []).filter((p) => p.functionCall); if (!calls.length) { wait1.textContent = (c.parts || []).map((p) => p.text || '').join('').trim() || 'Done.'; break; }
        const out = []; for (const p of calls) out.push({ functionResponse: { name: p.functionCall.name, response: await run(p.functionCall.name, p.functionCall.args || {}) } }); hist.push({ role: 'user', parts: out }); } }
    catch (err) { wait1.textContent = 'I could not reach Gemini: ' + err.message; } log.scrollTop = 1e6; });

  /* ---------- start ---------- */
  const k = (location.hash.match(/^#level-(\w)$/) || [])[1], f0 = FLOORS.find((x) => x.short.toLowerCase() === k);
  setTimeout(() => { if (f0) { selectFloor(f0.id); body.classList.add('inside'); } else world.showExterior(); setTimeout(() => veil(false), 700); }, 60);
})();
