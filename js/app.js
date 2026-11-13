(function () {
  const FLOORS = window.FLOORS;
  const $ = (s) => document.querySelector(s);
  const byId = (id) => FLOORS.find((f) => f.id === id);
  const touch = matchMedia('(hover: none)').matches;

  /* Level bands on the exterior image (image px, 1536 × 1024). */
  const BANDS = {
    t:  [[548, 116], [940, 116], [956, 183], [548, 183]],
    f3: [[560, 183], [956, 183], [956, 357], [560, 357]],
    f2: [[560, 357], [956, 357], [956, 521], [560, 521]],
    f1: [[560, 521], [956, 521], [956, 688], [560, 688]],
    g:  [[560, 688], [956, 688], [956, 795], [1062, 795], [1062, 895], [535, 895], [535, 795], [560, 795]],
  };
  const ORDER = ['t', 'f3', 'f2', 'f1', 'g'];
  const CARD_X = 1000;

  /* ============================ LANDING ============================ */
  const hero = $('#hero'), svg = $('#heroSvg'), hits = $('#floorHits'), hole = $('#spotHole'), card = $('#heroCard'), rail = $('#floorRail');
  let heroActive = null;
  if (touch) $('#hintText').textContent = 'Tap a level · tap again to step inside';

  ORDER.forEach((id) => {
    const f = byId(id);
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    p.setAttribute('points', BANDS[id].map((q) => q.join(',')).join(' ')); p.setAttribute('class', 'fhit'); p.dataset.id = id;
    p.addEventListener('mouseenter', () => !touch && setHero(id));
    p.addEventListener('click', () => (touch && heroActive !== id ? setHero(id) : enterFloor(id)));
    hits.appendChild(p);
    const li = document.createElement('li');
    li.innerHTML = `<button data-id="${id}"><span class="n">${f.short}</span><span class="t">${f.title}</span></button>`;
    const b = li.firstChild;
    b.addEventListener('mouseenter', () => !touch && setHero(id)); b.addEventListener('focus', () => setHero(id));
    b.addEventListener('click', () => (touch && heroActive !== id ? setHero(id) : enterFloor(id)));
    rail.appendChild(li);
  });
  hits.addEventListener('mouseleave', () => setHero(null)); rail.addEventListener('mouseleave', () => setHero(null));
  card.addEventListener('click', () => heroActive && enterFloor(heroActive));

  function setHero(id) {
    heroActive = id; hero.classList.toggle('active', !!id);
    hits.querySelectorAll('.fhit').forEach((p) => p.classList.toggle('on', p.dataset.id === id));
    rail.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    if (!id) return;
    hole.setAttribute('points', BANDS[id].map((q) => q.join(',')).join(' '));
    const f = byId(id); $('#hcNum').textContent = f.short; $('#hcTitle').textContent = f.title; $('#hcTag').textContent = f.tag; positionCard();
  }
  function bandCentre(id) { const ys = BANDS[id].map((q) => q[1]); return { x: 758, y: id === 'g' ? 745 : (Math.min(...ys) + Math.max(...ys)) / 2, right: 956 }; }
  function toScreen(x, y) { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(svg.getScreenCTM()); }
  function positionCard() {
    if (!heroActive) return; const c = bandCentre(heroActive), line = $('#leaderLine');
    line.setAttribute('x1', c.right); line.setAttribute('y1', c.y); line.setAttribute('x2', CARD_X); line.setAttribute('y2', c.y);
    $('#leaderDot').setAttribute('cx', c.right); $('#leaderDot').setAttribute('cy', c.y);
    const s = toScreen(CARD_X, c.y); card.style.left = `${s.x}px`; card.style.top = `${s.y - card.offsetHeight / 2}px`;
  }
  addEventListener('resize', positionCard);

  /* ===================== ENTER / LEAVE ===================== */
  const fv = $('#floorView'); let isOpen = false, world = null, current = null, mode = 'doll', plan = null, lastRoom = null;

  function enterFloor(id) {
    if (isOpen) return; isOpen = true;
    const c = bandCentre(id), s = toScreen(c.x, c.y);
    svg.style.transformOrigin = `${s.x}px ${s.y}px`; hero.classList.add('entering'); svg.style.transform = `scale(${id === 't' ? 3.4 : 2.8})`;
    setTimeout(() => openView(id), 620);
  }
  function openView(id) {
    if (!window.World || !window.THREE) { $('#fatal').hidden = false; isOpen = false; hero.classList.remove('entering'); svg.style.transform = 'scale(1)'; return; }
    fv.classList.add('open'); fv.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => { selectFloor(id); history.replaceState(null, '', `#level-${byId(id).short.toLowerCase()}`); });
  }
  function leave() {
    fv.classList.remove('open'); fv.setAttribute('aria-hidden', 'true'); hero.classList.remove('entering'); svg.style.transform = 'scale(1)'; setHero(null);
    history.replaceState(null, '', location.pathname); setTimeout(() => { isOpen = false; }, 600);
  }
  $('#fvBack').addEventListener('click', () => (mode === 'walk' ? world.overview() : leave()));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) (mode === 'walk' ? world.overview() : leave()); });

  /* ============================ INSIDE ============================ */
  const fvRail = $('#fvRail');
  ORDER.forEach((id) => {
    const f = byId(id), b = document.createElement('button'); b.dataset.id = id;
    b.innerHTML = `<span class="n">${f.short}</span><span class="t">${f.title}</span>`;
    b.addEventListener('click', () => { if (current && current.id === id) return; const v = $('#veil'); v.classList.add('on'); setTimeout(() => { selectFloor(id); history.replaceState(null, '', `#level-${f.short.toLowerCase()}`); }, 380); });
    fvRail.appendChild(b);
  });

  function ensureWorld() {
    if (world) return world;
    world = new window.World($('#view3d'), {
      onMode: setMode,
      onRoom: (id) => showRoom(id),
      onHover: (id) => $('#roomList').querySelectorAll('button').forEach((b) => b.classList.toggle('hover', b.dataset.id === id)),
      onSelect: (t) => { $('#rotBtn').hidden = !t; if (t) hint('Drag to move it · press R or tap Rotate to turn it'); },
      onWhere: (w) => { if (plan) plan.setMe(w.x, w.y, w.yaw); const r = world.roomAt(w.x, w.y); if (r && r.id !== lastRoom) showRoom(r.id); },
    });
    $('#qSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.q === world.quality));
    layout(); return world;
  }
  function layout() { if (world) world.setOffset(innerWidth > 900 ? ($('#fvPanel').offsetWidth + 24) / 2 - 20 : 0); }
  addEventListener('resize', layout);

  function selectFloor(id) {
    const f = byId(id); current = f; lastRoom = null;
    fvRail.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    $('#fvNum').textContent = f.short; $('#exTitle').textContent = f.title; $('#exTag').textContent = f.tag; $('#exSummary').textContent = f.summary;
    $('#exStats').innerHTML = f.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const list = $('#roomList');
    list.innerHTML = f.rooms.filter((r) => !/^(t?lobby|.*strip|westwalk)$/.test(r.id)).map((r) => `<li><button data-id="${r.id}"><span>${r.name}</span><span>${(r.size || '').split('·')[0]}</span></button></li>`).join('');
    list.querySelectorAll('button').forEach((b) => {
      b.addEventListener('mouseenter', () => world.highlight(b.dataset.id)); b.addEventListener('mouseleave', () => world.highlight(null));
      b.addEventListener('click', () => world.enterRoom(b.dataset.id));
    });
    const w = ensureWorld(); w.load(f); setMode('doll');
    plan = window.Plan2D.render($('#miniPlan'), f, { onSelect: (rid) => world.enterRoom(rid) }, { rot: false, mini: true });
    $('#fvPanel').scrollTop = 0;
    setTimeout(() => $('#veil').classList.remove('on'), 500);
  }

  function setMode(m) {
    mode = m; fv.classList.toggle('walk', m === 'walk');
    $('#walkBtn').textContent = m === 'walk' ? 'Dollhouse view' : 'Walk inside';
    $('#backLabel').textContent = m === 'walk' ? 'Dollhouse' : 'The House';
    $('#mini').hidden = m !== 'walk'; $('#roomCard').hidden = m !== 'walk' || !lastRoom; $('#joy').hidden = !(m === 'walk' && touch); $('#rotBtn').hidden = true;
    hint(m === 'walk' ? (touch ? 'Drag to look · joystick to walk · tap the floor to go there · drag furniture to move it' : 'Drag to look · W A S D or click the floor to walk · drag furniture to move it · R rotates')
      : 'Drag to turn the model · scroll to zoom · click a room to step inside');
  }
  let hT; function hint(t) { const h = $('#stageHint'); h.textContent = t; h.classList.add('on'); clearTimeout(hT); hT = setTimeout(() => h.classList.remove('on'), 9000); }

  function showRoom(id) {
    const r = current.rooms.find((x) => x.id === id); if (!r) return; lastRoom = id;
    const rc = $('#roomCard'); rc.hidden = mode !== 'walk';
    $('#rcFloor').textContent = current.title; $('#rcName').textContent = r.name; $('#rcSize').textContent = r.size || ''; $('#rcNotes').textContent = r.notes || '';
    rc.classList.remove('in'); void rc.offsetWidth; rc.classList.add('in');
    if (plan) plan.highlight(null, id);
  }

  $('#walkBtn').addEventListener('click', () => (mode === 'walk' ? world.overview() : (world.enterSpawn(), showRoom((world.roomAt(current.spawn.to[0], current.spawn.to[1]) || {}).id))));
  $('#timeSeg').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { $('#timeSeg').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); world.setNight(b.dataset.n === '1'); fv.classList.toggle('night', b.dataset.n === '1'); }));
  $('#qSeg').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { $('#qSeg').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); world.setQuality(b.dataset.q); }));
  $('#resetBtn').addEventListener('click', () => world.resetLayout());
  $('#rotBtn').addEventListener('click', () => world.rotateSelected());

  /* touch joystick */
  (function () {
    const j = $('#joy'), knob = j.firstElementChild; let id = null, cx = 0, cy = 0;
    const set = (x, y) => { const l = Math.hypot(x, y), m = 44; if (l > m) { x = (x / l) * m; y = (y / l) * m; } knob.style.transform = `translate(${x}px, ${y}px)`; if (world) world.joy = { x: x / m, y: y / m }; };
    j.addEventListener('pointerdown', (e) => { id = e.pointerId; j.setPointerCapture(id); const r = j.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; set(e.clientX - cx, e.clientY - cy); });
    j.addEventListener('pointermove', (e) => { if (e.pointerId === id) set(e.clientX - cx, e.clientY - cy); });
    const end = () => { id = null; set(0, 0); }; j.addEventListener('pointerup', end); j.addEventListener('pointercancel', end);
  })();

  /* deep link: #level-1 opens straight inside */
  const open = () => { const k = (location.hash.match(/^#level-(\w)$/) || [])[1]; const f = FLOORS.find((x) => x.short.toLowerCase() === k); if (!f) return; if (isOpen) { if (current.id !== f.id) selectFloor(f.id); } else { isOpen = true; hero.classList.add('entering'); openView(f.id); } };
  open(); addEventListener('hashchange', open);
})();
