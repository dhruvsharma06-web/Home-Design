/* Landing: the original photoreal exterior, sharpened, with per-level hover and a zoom into the level. */
(function () {
  const BANDS = {                       // level bands on the exterior image (image px, 1536 × 1024)
    t:  [[548, 116], [940, 116], [956, 183], [548, 183]],
    f3: [[560, 183], [956, 183], [956, 357], [560, 357]],
    f2: [[560, 357], [956, 357], [956, 521], [560, 521]],
    f1: [[560, 521], [956, 521], [956, 688], [560, 688]],
    g:  [[560, 688], [956, 688], [956, 795], [1062, 795], [1062, 895], [535, 895], [535, 795], [560, 795]],
  };
  const land = document.getElementById('land'), NS = 'http://www.w3.org/2000/svg';
  land.insertAdjacentHTML('afterbegin', `<svg class="hero-svg" id="heroSvg" viewBox="0 0 1536 1024" preserveAspectRatio="xMidYMid slice">
    <defs><mask id="spot"><rect width="1536" height="1024" fill="white"/><polygon id="spotHole" fill="black"/></mask>
    <radialGradient id="vig" cx="50%" cy="45%" r="78%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#05070a" stop-opacity=".55"/></radialGradient></defs>
    <image href="assets/exterior_hq.jpg" width="1536" height="1024" class="hero-img"/><image id="heroEve" href="assets/exterior_evening.jpg" width="1536" height="1024" class="hero-img eve"/>
    <rect width="1536" height="1024" fill="url(#vig)" pointer-events="none"/>
    <rect class="dim" width="1536" height="1024" mask="url(#spot)" pointer-events="none"/>
    <g id="floorHits"></g><g class="leader"><line id="leaderLine"/><circle id="leaderDot" r="4"/></g></svg>`);
  const svg = document.getElementById('heroSvg'), hits = document.getElementById('floorHits');
  const centre = (id) => { const ys = BANDS[id].map((q) => q[1]); return id === 'g' ? 745 : (Math.min(...ys) + Math.max(...ys)) / 2; };
  const toScreen = (x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(svg.getScreenCTM()); };
  let onHover = () => {}, onClick = () => {};

  window.landHover = function (id) {
    land.classList.toggle('active', !!id); document.body.classList.toggle('lvl', !!id);
    hits.querySelectorAll('polygon').forEach((p) => p.classList.toggle('on', p.dataset.id === id));
    document.querySelectorAll('#floorRail button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    if (!id) return;
    document.getElementById('spotHole').setAttribute('points', BANDS[id].map((q) => q.join(',')).join(' '));
    const y = centre(id), l = document.getElementById('leaderLine');
    l.setAttribute('x1', 956); l.setAttribute('y1', y); l.setAttribute('x2', 1000); l.setAttribute('y2', y);
    document.getElementById('leaderDot').setAttribute('cx', 956); document.getElementById('leaderDot').setAttribute('cy', y);
    onHover(id);
    const c = document.getElementById('heroCard'), s = toScreen(1000, y);
    if (innerWidth > 900) { c.style.left = s.x + 'px'; c.style.top = s.y - c.offsetHeight / 2 + 'px'; }
  };
  window.landNight = function (n) { document.getElementById('land').classList.toggle('night', n); };
  window.landInit = function (hover, click) { onHover = hover; onClick = click; };
  for (const id of Object.keys(BANDS)) {
    const p = document.createElementNS(NS, 'polygon'); p.setAttribute('points', BANDS[id].map((q) => q.join(',')).join(' ')); p.setAttribute('class', 'fhit'); p.dataset.id = id;
    p.addEventListener('mouseenter', () => !matchMedia('(hover: none)').matches && window.landHover(id));
    p.addEventListener('click', () => (matchMedia('(hover: none)').matches && !p.classList.contains('on') ? window.landHover(id) : onClick(id)));
    hits.appendChild(p);
  }
  hits.addEventListener('mouseleave', () => window.landHover(null));
  /** zoom the photo into the level, then hand over */
  window.landZoom = function (id, done) {
    const s = toScreen(758, centre(id)); svg.style.transformOrigin = `${s.x}px ${s.y}px`;
    land.classList.add('zoom'); svg.style.transform = `scale(${id === 't' ? 3.4 : 2.8})`; window.landHover(null);
    setTimeout(done, 650);
  };
  window.landShow = function () { land.classList.remove('zoom'); svg.style.transform = 'scale(1)'; };
  addEventListener('resize', () => document.body.classList.contains('lvl') && window.landHover(document.querySelector('#floorRail button.on')?.dataset.id));
})();
