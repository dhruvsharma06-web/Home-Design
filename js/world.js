/* B4 — the live 3D world: exterior (landing), dollhouse, walk-inside, furniture editing, day / evening. */
(function () {
  const B = window.B4; if (!B) return;
  const T = B.T, AD = window.ADDONS || {}, HOUSE = window.HOUSE, EYE = 1.6;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const DIM = { sofa: [2.3, 0.92], armchair: [0.82, 0.85], bed: [2.1, 1.6], coffee: [1.1, 0.6], dining: [1.0, 1.8], plant: [0.5, 0.5], floorlamp: [0.35, 0.35], rug: [2.0, 1.4], sidetable: [0.42, 0.42], nightstand: [0.5, 0.42], desk: [1.2, 0.55], chair: [0.48, 0.5], stool: [0.36, 0.36], lounger: [0.7, 1.9], bench: [1.2, 0.4], tv: [1.8, 0.42] };
  const LOOKS = {
    day: { sun: 2.3, sunC: '#FFE7C8', hemi: 0.28, env: 0.62, exp: 0.86, bg: 1, lights: 0.2, accent: 0.4, onyx: 0.4, shade: 0.4, bloom: 0.16, fog: '#C9D6DA', sunPos: [22, 20, 15] },
    evening: { sun: 0.12, sunC: '#9FB6E8', hemi: 0.07, env: 0.08, exp: 0.8, bg: 0.035, lights: 0.42, accent: 0.5, onyx: 0.65, shade: 0.8, bloom: 0.2, fog: '#0B0F16', sunPos: [-18, 14, 12] },
    dusk: { sun: 0.75, sunC: '#FFB98A', hemi: 0.2, env: 0.32, exp: 0.98, bg: 0.42, lights: 1.25, accent: 1.2, onyx: 1.0, shade: 1.2, bloom: 0.36, fog: '#4A5568', sunPos: [-26, 9, 14] },
  };

  class World {
    constructor(el, cb = {}) {
      this.el = el; this.cb = cb;
      const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight;
      this.mobile = matchMedia('(hover: none)').matches || innerWidth < 800;
      this.quality = 'high';
      const r = this.renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      this.pr = this._cap(); r.setPixelRatio(this.pr); r.setSize(w, h);
      r.toneMapping = T.ACESFilmicToneMapping; r.outputColorSpace = T.SRGBColorSpace; r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
      B.setAniso(r.capabilities.getMaxAnisotropy());
      el.appendChild(r.domElement); r.domElement.style.touchAction = 'none';
      this.scene = new T.Scene(); this.scene.background = new T.Color('#0c0f14'); this.scene.fog = new T.Fog('#C9D6DA', 90, 520);
      this.camera = new T.PerspectiveCamera(40, w / h, 0.05, 1200);
      this.sun = new T.DirectionalLight('#FFE7C8', 2.3); this.sun.castShadow = true;
      const sm = this.mobile ? 2048 : 4096; this.sun.shadow.mapSize.set(sm, sm);
      Object.assign(this.sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 110 }); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
      this.scene.add(this.sun, this.sun.target);
      this.fill = new T.HemisphereLight('#DCE9FF', '#BCA98C', 0.28); this.scene.add(this.fill);
      this._envInit(); this._composer(w, h);
      this.mode = 'ext'; this.look = this.night ? 'evening' : 'day'; this.night = false; this.lights = []; this.items = []; this.roomMeshes = []; this.col = []; this.boxes = [];
      this.orbit = { theta: -0.5, phi: 1.25, radius: 40, target: new T.Vector3(0, 6.2, 1.25) }; this.goal = { theta: -0.5, phi: 1.25, radius: 40, target: new T.Vector3(0, 6.2, 1.25) };
      this.home = { theta: -0.5, phi: 1.25, radius: 40 };
      this.player = { x: 0, y: 0, yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, vx: 0, vy: 0, eye: EYE }; this.keys = {}; this.joy = { x: 0, y: 0 }; this.walkTo = null; this.o = new T.Vector3();
      this.ray = new T.Raycaster(); this.ptr = new T.Vector2(); this.ft = [];
      this._backdrop();
      this._bind(); new ResizeObserver(() => this.resize()).observe(el);
      this._t = performance.now(); this._loop = this._loop.bind(this); requestAnimationFrame(this._loop);
    }
    _cap() { const d = devicePixelRatio || 1; return this.quality === 'ultra' ? Math.min(d, 3) : this.quality === 'high' ? Math.min(d, 2) : this.quality === 'med' ? Math.min(d, 1.5) : 1; }

    _envInit() {
      const pm = new T.PMREMGenerator(this.renderer);
      if (AD.RoomEnvironment) this.scene.environment = pm.fromScene(new AD.RoomEnvironment(), 0.04).texture;
      if (AD.RGBELoader) new AD.RGBELoader().load('assets/env/hills_1k.hdr', (hdr) => { hdr.mapping = T.EquirectangularReflectionMapping; this.scene.environment = pm.fromEquirectangular(hdr).texture; hdr.dispose(); }, undefined, () => {});
      new T.TextureLoader().load('assets/env/hills.jpg', (t) => { t.mapping = T.EquirectangularReflectionMapping; t.colorSpace = T.SRGBColorSpace; this.sky = t; this._bg(); }, undefined, () => {});
    }
    _backdrop() {
      // scenery from the original exterior photo: the club + road once, behind the house (south, the club side);
      // everywhere else just sky, hills and fields
      const TL = new T.TextureLoader(), mk = (f, wrap, rep) => { const t = TL.load(f); t.colorSpace = T.SRGBColorSpace; t.wrapS = wrap; t.repeat.set(rep, 1); t.anisotropy = 8; if (rep < 0) t.offset.x = 1; return t; };
      this.bdTex = { day: [mk('assets/env/simple_day.jpg', T.MirroredRepeatWrapping, -12), mk('assets/env/hero_day.png', T.ClampToEdgeWrapping, -1)], evening: [mk('assets/env/simple_eve.jpg', T.MirroredRepeatWrapping, -12), mk('assets/env/hero_eve.png', T.ClampToEdgeWrapping, -1)] };
      const H = 171.8, g = new T.Group(); g.position.set(0, 30.5, 1.25); g.renderOrder = -1;
      const a = new T.Mesh(new T.CylinderGeometry(300, 300, H, 128, 1, true), new T.MeshBasicMaterial({ map: this.bdTex.day[0], side: T.BackSide, fog: false, depthWrite: false }));
      const ARC = 0.6244, b = new T.Mesh(new T.CylinderGeometry(296, 296, H, 64, 1, true, -ARC / 2, ARC), new T.MeshBasicMaterial({ map: this.bdTex.day[1], side: T.BackSide, fog: false, depthWrite: false, transparent: true }));
      a.renderOrder = -2; b.renderOrder = -1; g.add(a, b); this.bdParts = [a, b]; this.backdrop = g; this.scene.add(g);
      this.skyCol = { day: '#c9d5e9', evening: '#394468', dusk: '#394468' }; this.fieldCol = { day: '#51532f', evening: '#1d201a' };
    }
    _bg() {
      const L = LOOKS[this.look];
      const out = this.mode !== 'doll'; if (this.backdrop) { this.backdrop.visible = out; const tx = this.bdTex[this.look === 'day' ? 'day' : 'evening']; this.bdParts[0].material.map = tx[0]; this.bdParts[1].material.map = tx[1]; if (this.site && this.site.groundMat) this.site.groundMat.color.set(this.look === 'day' ? '#98AA6C' : '#3C4636'); this.backdrop.position.y = 30.5 + (this.mode === 'walk' && this.o ? this.o.y * 0.0 : 0); }
      if (out) { this.scene.background = new T.Color(this.skyCol[this.look]); this.scene.backgroundIntensity = 1; }
      else { this.scene.background = new T.Color(this.mode === 'doll' ? '#0b0d11' : L.fog); this.scene.backgroundIntensity = 1; }
      this.scene.fog.color.set(this.look === 'day' ? '#6E7C52' : '#1C2121'); this.scene.fog.near = this.mode === 'doll' ? 500 : 62; this.scene.fog.far = this.mode === 'doll' ? 2000 : 128;
    }
    _composer(w, h) {
      this.composer = null; this.ao = null; this.bloom = null;
      if (this.quality === 'low' || !AD.EffectComposer) return;
      const c = this.composer = new AD.EffectComposer(this.renderer, new T.WebGLRenderTarget(w, h, { type: T.HalfFloatType, samples: 4 }));
      c.setPixelRatio(this.pr); c.addPass(new AD.RenderPass(this.scene, this.camera));
      if ((this.quality === 'high' || this.quality === 'ultra') && AD.GTAOPass) { try { const ao = new AD.GTAOPass(this.scene, this.camera, w, h); ao.blendIntensity = 0.85; ao.updateGtaoMaterial && ao.updateGtaoMaterial({ radius: 0.4, distanceExponent: 1.4, thickness: 1, scale: 1.05, samples: this.quality === 'ultra' ? 16 : 10 }); c.addPass(ao); this.ao = ao; } catch (e) { console.warn('AO off', e); } }
      this.bloom = new AD.UnrealBloomPass(new T.Vector2(w, h), 0.18, 0.7, 0.93); c.addPass(this.bloom); c.addPass(new AD.OutputPass());
    }
    setQuality(q) { this.quality = q; this.pr = this._cap(); this.renderer.setPixelRatio(this.pr); const s = q === 'ultra' || (q === 'high' && !this.mobile) ? 4096 : 2048; if (this.sun.shadow.mapSize.x !== s) { this.sun.shadow.mapSize.set(s, s); if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; } } this._composer(this.el.clientWidth, this.el.clientHeight); this._applyLook(); }
    resize() { const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h) return; this.renderer.setSize(w, h); if (this.composer) this.composer.setSize(w, h); this.camera.aspect = w / h; this._offset(); this.camera.updateProjectionMatrix(); this._fit(); }
    setOffset(px) { this.offPx = px; this._offset(); this.camera.updateProjectionMatrix(); this._fit(); }
    _offset() { const w = this.el.clientWidth, h = this.el.clientHeight; if (this.offPx && this.mode === 'doll') this.camera.setViewOffset(w, h, -this.offPx, 0, w, h); else this.camera.clearViewOffset(); }
    /** camera distance at which a sphere of radius R always fits the window, whatever its shape */
    _fitR(R, fov) { const w = this.el.clientWidth - (this.mode === 'doll' ? (this.offPx || 0) * 2 : 0), h = this.el.clientHeight, v = (fov * Math.PI) / 360, hh = Math.atan(Math.tan(v) * Math.max(0.3, w / h)); return R / Math.sin(Math.min(v, hh)); }
    _fit() { if (this.mode === 'ext') { this.home.radius = this._fitR(11.5, 40); this.goal.radius = this.home.radius; } else if (this.mode === 'doll' && this.floor) { this.home.radius = this._fitR(Math.hypot(this.floor.w, this.floor.h) / 2 + 1.2, 38); this.goal.radius = this.home.radius; } }

    /* ---------------- site + exterior ---------------- */
    _site() { if (!this.site) { this.site = B.buildSite(); this.scene.add(this.site.group); } return this.site; }
    showExterior() {
      this._site();
      if (!this.ext) {
        const g = this.ext = new T.Group(); this.extPick = []; this.extLights = [];
        for (const f of window.FLOORS) {
          const lv = B.buildLevel(f, { shell: true }), e = HOUSE.elev[f.id];
          lv.group.position.set(f.id === 'g' ? -4.875 : -3.375, e, f.id === 'g' ? -9.5 : -6.5); g.add(lv.group); this.extLights.push(...lv.lights);
          const hh = f.id === 'g' ? 3.3 : f.id === 't' ? 3.4 : 3.2, pk = new T.Mesh(new T.BoxGeometry(7.9, hh, 16.6), new T.MeshBasicMaterial({ color: '#FFE2B0', transparent: true, opacity: 0, depthWrite: false }));
          pk.position.set(0, e + hh / 2 - 0.3, 1.25); pk.userData.floorId = f.id; pk.renderOrder = 5; g.add(pk); this.extPick.push(pk);
          const ed = new T.LineSegments(new T.EdgesGeometry(pk.geometry), new T.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })); pk.add(ed); pk.userData.edge = ed;
        }
        this.scene.add(g);
      }
      if (this.level) this.level.group.visible = false;
      if (this.selBox) { this.scene.remove(this.selBox); this.selBox = null; }
      this.ext.visible = true; this.site.group.visible = true; this.site.plotLite.visible = false;
      this.mode = 'ext'; this.look = this.night ? 'evening' : 'day'; this.lights = this.extLights; this.camera.fov = 40; this._offset(); this.camera.updateProjectionMatrix();
      this.home = { theta: 3.1416, phi: 1.36, radius: this._fitR(11.5, 40) }; this.goal.target.set(0, 6.4, 1.25); Object.assign(this.goal, this.home);
      if (!this._extSeen) { this._extSeen = true; Object.assign(this.orbit, { theta: 2.45, phi: 1.18, radius: this.home.radius * 1.5 }); this.orbit.target.set(0, 6.4, 1.25); }
      this.tween = null; this.diving = null; this._applyLook(); this._bg(); this.renderer.domElement.style.cursor = 'grab'; this.idle = 0;
    }
    /** screen position (px) beside a level, for the hover card */
    levelAnchor(id) { const e = HOUSE.elev[id], v = new T.Vector3(0, e + 1.5, 1.25).project(this.camera), r = this.el.getBoundingClientRect(); return { x: (v.x * 0.5 + 0.5) * r.width, y: (-v.y * 0.5 + 0.5) * r.height }; }
    hoverLevel(id) { this.extHover = id; (this.extPick || []).forEach((p) => { const on = p.userData.floorId === id; p.material.opacity = on ? 0.1 : 0; p.userData.edge.material.opacity = on ? 0.9 : 0; }); }
    /** fly toward a level, then hand over */
    diveTo(id, done) { const e = HOUSE.elev[id]; this.goal.target.set(0, e + 1.4, 1.25); this.goal.radius = 15; this.goal.phi = 1.05; this.hoverLevel(null); this.diving = { t: 0, start: performance.now(), done }; }

    /* ---------------- one level, in detail ---------------- */
    load(floor) {
      if (this.level) { this.scene.remove(this.level.group); this.level.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
      if (this.selBox) { this.scene.remove(this.selBox); this.selBox = null; }
      this._site(); this.floor = floor;
      const st = this._store(), furn = floor.furn.map((f, i) => ({ ...f, idx: i })).filter((f) => !st.del.includes(f.idx)).map((f) => { const s = st.m[f.idx]; if (!s || !B.MOVABLE.has(f.t)) return f; const sw = ['e', 'w'].includes(s.face) !== ['e', 'w'].includes(f.face || 'n'); return { ...f, x: s.x, y: s.y, face: s.face, w: sw ? f.d : f.w, d: sw ? f.w : f.d }; });
      st.add.forEach((a) => furn.push({ ...a, idx: 'a' + a.id, added: true }));
      const lv = this.level = B.buildLevel(floor, { furn });
      this.o.set(floor.id === 'g' ? -4.875 : -3.375, HOUSE.elev[floor.id], floor.id === 'g' ? -9.5 : -6.5); lv.group.position.copy(this.o);
      this.scene.add(lv.group); this.col = lv.col; this.boxes = lv.boxes; this.roomMeshes = lv.roomMeshes; this.items = lv.items; this.lights = lv.lights; this.ceil = lv.ceil;
      for (const g of this.items) { const t = st.tint[g.userData.idx] || g.userData.f.tint; if (t) this._tint(g, t); }
      if (this.ext) this.ext.visible = false;
      this.centre = new T.Vector3(this.o.x + floor.w / 2, this.o.y + 0.5, this.o.z + floor.h / 2);
      const v = floor.orbit || {}; this.mode = 'doll';
      this.home = { theta: v.theta ?? 2.52, phi: v.phi ?? 0.86, radius: this._fitR(Math.hypot(floor.w, floor.h) / 2 + 1.2, 38) };
      this.goal.target.copy(this.centre); Object.assign(this.goal, this.home);
      Object.assign(this.orbit, { theta: this.home.theta + 0.5, phi: Math.max(0.05, this.home.phi - 0.22), radius: this.home.radius * 1.35 }); this.orbit.target.copy(this.centre);
      this.tween = null; this.selected = null; this.walkTo = null; this.diving = null;
      this.look = this.night ? 'evening' : 'day'; this.setMode('doll', true); this._applyLook();
      clearTimeout(this._lt); this._lt = setTimeout(() => this._applyLook(), 2500);
    }
    setMode(mode, silent) {
      this.mode = mode; const inside = mode === 'walk';
      if (this.ceil) this.ceil.visible = inside; if (this.site) { this.site.group.visible = inside || mode === 'ext'; this.site.plotLite.visible = inside && this.floor && this.floor.id !== 'g'; }
      this._bg(); this._offset(); this.camera.fov = mode === 'walk' ? 68 : 38; this.camera.updateProjectionMatrix();
      this.renderer.domElement.style.cursor = mode === 'walk' ? 'crosshair' : 'grab';
      if (!silent && this.cb.onMode) this.cb.onMode(mode);
    }
    overview() { if (this.mode !== 'walk') { Object.assign(this.goal, this.home); this.goal.target.copy(this.centre); return; }
      const from = this._pose(); this.setMode('doll'); Object.assign(this.orbit, this.home); Object.assign(this.goal, this.home); this.orbit.target.copy(this.centre); this.goal.target.copy(this.centre); this._orbitCam(); this._fly(from, this._pose(), 1.4); }
    _pose() { return { p: this.camera.position.clone(), q: this.camera.quaternion.clone(), fov: this.camera.fov }; }
    _fly(from, to, dur, done) { this.tween = { from, to, t: 0, dur, done }; }
    /** stand at plan point `a`, looking toward plan point `b` */
    enter(a, b, dur = 1.9) {
      const from = this._pose(), p = this.player; from.fov = this.mode === 'walk' ? this.camera.fov : 38;
      p.x = a[0]; p.y = a[1]; p.vx = p.vy = 0; const dx = b[0] - a[0], dy = b[1] - a[1], dh = (b[2] ?? 1.2) - (a[2] ?? EYE);
      p.yaw = p.tyaw = Math.atan2(-dx, -dy); p.pitch = p.tpitch = Math.atan2(dh, Math.hypot(dx, dy)); p.eye = EYE + this._floorY(p.x, p.y);
      this.setMode('walk'); this._walkCam(); this._fly(from, this._pose(), dur);
    }
    enterRoom(id) { if (!this.floor) return false; const r = this.floor.rooms.find((x) => x.id === id); if (!r) return false; const c = r.cam || this._autoCam(r); this.enter(c.from, c.to); if (this.cb.onRoom) this.cb.onRoom(id); return true; }
    enterSpawn() { if (!this.floor) return; const a = this.floor.spawn.to, yaw = (a[2] * Math.PI) / 180; this.enter([a[0], a[1], EYE], [a[0] + Math.sin(yaw) * 3, a[1] - Math.cos(yaw) * 3, 1.3]); }
    standAt(pt, yawDeg) { const yaw = (yawDeg * Math.PI) / 180; this.enter([pt[0], pt[1], EYE], [pt[0] + Math.sin(yaw) * 3, pt[1] - Math.cos(yaw) * 3, 1.4], 0.01); }
    liftPose() { const id = this.floor.id; return id === 'g' ? { at: [3.3, 9.65], yaw: 90 } : id === 't' ? { at: [1.0, 7.7], yaw: 90 } : { at: [2.0, 7.62], yaw: 90 }; }
    _autoCam(r) { const [a, b, c, d] = B.bbox(B.roomPts(r)), long = (d - b) > (c - a); return { from: long ? [(a + c) / 2, d - 0.45, 1.5] : [c - 0.45, (b + d) / 2, 1.5], to: [(a + c) / 2 - (long ? 0 : 0.6), (b + d) / 2 - (long ? 0.6 : 0), 1.0] }; }
    state() { const w = this.where(), r = this.mode === 'walk' && this.floor ? this.roomAt(w.x, w.y) : null; return { view: this.mode === 'ext' ? 'exterior' : this.mode === 'doll' ? 'dollhouse' : 'walking', level: this.mode === 'ext' ? null : this.floor && this.floor.title, room: r && r.name, time: this.night ? 'evening' : 'day', theme: B.THEME() }; }

    /* ---------------- light ---------------- */
    setNight(n) { this.night = n; this.look = n ? 'evening' : 'day'; this._applyLook(); this._bg(); }
    _applyLook() {
      const L = LOOKS[this.look], m = B.mats();
      this.sun.intensity = L.sun; this.sun.color.set(L.sunC); this.fill.intensity = L.hemi; this.renderer.toneMappingExposure = L.exp;
      const c = this.mode === 'ext' ? new T.Vector3(0, 4, 1) : this.centre || new T.Vector3(); this.sun.target.position.copy(c); this.sun.position.set(c.x + L.sunPos[0], c.y + L.sunPos[1], c.z + L.sunPos[2]);
      for (const k in m) if ('envMapIntensity' in m[k]) m[k].envMapIntensity = m[k].userData.baseEnv * L.env;
      this.scene.traverse((o) => { const mt = o.material; if (mt && !Array.isArray(mt) && 'envMapIntensity' in mt && (!mt.userData || mt.userData.baseEnv === undefined)) mt.envMapIntensity = L.env; });
      const boost = this.mode === 'ext' && this.look !== 'day' ? 2.6 : 1; (this.lights || []).forEach((l) => { l.intensity = l.userData.base * (l.userData.accent ? L.accent : L.lights) * boost; });
      m.onyx.emissiveIntensity = L.onyx; m.villaGlass.emissiveIntensity = this.look === 'day' ? 0 : 0.16; m.shade.emissiveIntensity = L.shade; if (this.bloom) this.bloom.strength = L.bloom;
    }
    setTheme(th) { B.applyTheme(th); }

    /* ---------------- input ---------------- */
    _bind() {
      const el = this.renderer.domElement; let down = null, moved = 0, pinch = 0;
      const pos = (e) => { const r = el.getBoundingClientRect(); this.ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
      el.addEventListener('pointerdown', (e) => {
        if (this.tween || this.diving) return; el.setPointerCapture(e.pointerId); pos(e); down = { x: e.clientX, y: e.clientY, btn: e.button, t: performance.now() }; moved = 0; this.walkTo = null; this.idle = 0;
        if (this.mode === 'ext') return;
        const it = this._pickItem(); if (it && it.userData.movable) { this.drag = { g: it, off: null }; this._select(it); const p = this._floorPoint(this.o.y + (it.userData.f.base || 0)); if (p) this.drag.off = { x: it.position.x + this.o.x - p.x, z: it.position.z + this.o.z - p.z }; el.style.cursor = 'grabbing'; }
      });
      el.addEventListener('pointermove', (e) => {
        pos(e); if (!down) { if (!this.mobile) this._hover(); return; }
        const dx = e.clientX - down.x, dy = e.clientY - down.y; down.x = e.clientX; down.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        if (this.drag) { const p = this._floorPoint(this.o.y + (this.drag.g.userData.f.base || 0)); if (p && this.drag.off) this._moveItem(this.drag.g, p.x + this.drag.off.x - this.o.x, p.z + this.drag.off.z - this.o.z); return; }
        if (this.mode !== 'walk') {
          if ((down.btn === 2 || e.shiftKey) && this.mode === 'doll') { const k = this.orbit.radius * 0.0016; this.goal.target.x -= (Math.cos(this.orbit.theta) * dx + Math.sin(this.orbit.theta) * dy) * k; this.goal.target.z -= (-Math.sin(this.orbit.theta) * dx + Math.cos(this.orbit.theta) * dy) * k; }
          else { this.goal.theta -= dx * 0.006; this.goal.phi = Math.min(this.mode === 'ext' ? 1.5 : 1.45, Math.max(this.mode === 'ext' ? 0.5 : 0.04, this.goal.phi - dy * 0.005)); }
        } else { this.player.tyaw += dx * 0.0042; this.player.tpitch = Math.max(-1.2, Math.min(1.2, this.player.tpitch + dy * 0.0036)); }
      });
      el.addEventListener('pointerup', (e) => {
        if (!down) return; const wasDrag = this.drag, d0 = down; down = null;
        if (wasDrag) { this._saveItem(wasDrag.g); this.drag = null; el.style.cursor = this.mode === 'walk' ? 'crosshair' : 'grab'; return; }
        if (moved > 8 || this.tween || performance.now() - d0.t > 450) return; pos(e);
        if (this.mode !== 'ext' && this._pickDoor()) return;
        if (this.mode === 'ext') { const id = this._pickLevel(); if (id && this.cb.onLevel) this.cb.onLevel(id); return; }
        const id = this._pickRoom();
        if (this.mode === 'doll') { if (id) this.enterRoom(id); else this._select(null); }
        else { const p = this._floorPoint(0, true); if (p) this.walkTo = { x: p.x - this.o.x, y: p.z - this.o.z, t: 0 }; this._select(null); }
      });
      el.addEventListener('pointercancel', () => { down = null; this.drag = null; });
      el.addEventListener('pointerleave', () => { if (this.mode === 'ext' && !down) { this.hoverLevel(null); this.cb.onLevelHover && this.cb.onLevelHover(null); } });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      el.addEventListener('wheel', (e) => { e.preventDefault(); this.idle = 0; if (this.mode !== 'walk') this.goal.radius = Math.min(this.mode === 'ext' ? 90 : 60, Math.max(this.mode === 'ext' ? 16 : 4, this.goal.radius * (1 + Math.sign(e.deltaY) * 0.09))); else { this.camera.fov = Math.min(85, Math.max(35, this.camera.fov + Math.sign(e.deltaY) * 3)); this.camera.updateProjectionMatrix(); } }, { passive: false });
      el.addEventListener('touchmove', (e) => { if (e.touches.length === 2 && this.mode !== 'walk') { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinch) this.goal.radius = Math.min(90, Math.max(4, this.goal.radius * (pinch / d))); pinch = d; } }, { passive: true });
      el.addEventListener('touchend', () => { pinch = 0; });
      addEventListener('keydown', (e) => { if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; this.keys[e.code] = true; if (e.code === 'KeyR' && this.selected) this.rotateSelected(); if (e.code === 'Delete' && this.selected) this.deleteSelected(); });
      addEventListener('keyup', (e) => { this.keys[e.code] = false; }); addEventListener('blur', () => { this.keys = {}; });
    }
    pause(on) { this.paused = on; }
    _pickDoor() { const ds = (this.level && this.level.doors) || []; if (!ds.length) return false; this.ray.setFromCamera(this.ptr, this.camera); this.ray.far = this.mode === 'walk' ? 4 : 400; const h = this.ray.intersectObjects(ds, true)[0]; this.ray.far = Infinity; if (!h) return false; let d = h.object; while (d && !d.userData.door) d = d.parent; if (!d) return false; this.toggleDoor(d); return true; }
    toggleDoor(d) { const s = d.userData.door; s.open = !s.open; s.target = s.open ? s.openA : 0; const i = this.col.indexOf(s.seg); if (!s.open && i < 0) this.col.push(s.seg); if (s.open && i >= 0) this.col.splice(i, 1); }
    _doors(dt) { const ds = (this.level && this.level.doors) || []; const k = 1 - Math.exp(-dt * 6); for (const d of ds) { const s = d.userData.door; d.rotation.y += (s.target - d.rotation.y) * k; } }
    _pickLevel() { this.ray.setFromCamera(this.ptr, this.camera); const h = this.ray.intersectObjects(this.extPick || [], false)[0]; return h ? h.object.userData.floorId : null; }
    _pickItem() { this.ray.setFromCamera(this.ptr, this.camera); this.ray.far = this.mode === 'doll' ? 300 : 8; const h = this.ray.intersectObjects(this.items, true)[0]; this.ray.far = Infinity; return h ? (h.object.userData.item || null) : null; }
    _pickRoom() { this.ray.setFromCamera(this.ptr, this.camera); const h = this.ray.intersectObjects(this.roomMeshes, false)[0]; return h ? h.object.userData.roomId : null; }
    _floorPoint(y = 0, mustHit) { this.ray.setFromCamera(this.ptr, this.camera); if (mustHit) { const h = this.ray.intersectObjects(this.roomMeshes, false)[0]; return h ? h.point : null; } const p = new T.Vector3(); return this.ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -y), p) ? p : null; }
    _hover() {
      if (this.drag || this.tween || this.diving) return;
      if (this.mode === 'ext') { const id = this._pickLevel(); if (id !== this.extHover) { this.hoverLevel(id); this.cb.onLevelHover && this.cb.onLevelHover(id); } this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab'; return; }
      const it = this._pickItem(), mv = it && it.userData.movable, id = this.mode === 'doll' && !mv ? this._pickRoom() : null;
      this.renderer.domElement.style.cursor = mv ? 'grab' : this.mode === 'doll' ? (id ? 'pointer' : 'grab') : 'crosshair';
      if (id !== this.hoverId) { this.hoverId = id; this.highlight(id); this.cb.onHover && this.cb.onHover(id); }
    }
    highlight(id) { (this.roomMeshes || []).forEach((r) => { r.material.opacity = r.userData.roomId === id ? 0.2 : 0; }); }

    /* ---------------- furniture: select, move, rotate, add, remove, recolour ---------------- */
    _key() { return 'b4-layout2-' + this.floor.id; }
    _store() { let s = {}; try { s = JSON.parse(localStorage.getItem(this._key()) || '{}'); } catch (e) {} return { m: s.m || {}, del: s.del || [], add: s.add || [], tint: s.tint || {} }; }
    _put(s) { try { localStorage.setItem(this._key(), JSON.stringify(s)); } catch (e) {} }
    _saveItem(g) { const s = this._store(), f = g.userData.f, rec = { x: +f.x.toFixed(3), y: +f.y.toFixed(3), face: f.face || 'n' }; if (f.added) { const a = s.add.find((x) => 'a' + x.id === g.userData.idx); if (a) Object.assign(a, rec, { w: f.w, d: f.d }); } else s.m[g.userData.idx] = rec; this._put(s); }
    resetLayout() { try { localStorage.removeItem(this._key()); } catch (e) {} const walk = this.mode === 'walk', p = { ...this.player }; this.load(this.floor); if (walk) { this.player = p; this.setMode('walk', true); } this._select(null); }
    _select(g) {
      if (this.selBox) { this.scene.remove(this.selBox); this.selBox = null; }
      this.selected = g;
      if (g) { const b = new T.Box3().setFromObject(g), s = b.getSize(new T.Vector3()), c = b.getCenter(new T.Vector3()); this.selBox = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(s.x + 0.06, s.y + 0.04, s.z + 0.06)), new T.LineBasicMaterial({ color: '#FFD9A0' })); this.selBox.position.copy(c); this.scene.add(this.selBox); this.selOff = c.clone().sub(g.getWorldPosition(new T.Vector3())); }
      if (this.cb.onSelect) this.cb.onSelect(g ? g.userData.f.t : null);
    }
    _fits(f, x, y, self) {
      const a = x + 0.02, b = y + 0.02, c = x + f.w - 0.02, d = y + f.d - 0.02; if (a < 0 || b < 0 || c > this.floor.w || d > this.floor.h) return false;
      for (const s of this.col) { const sx1 = Math.min(s.x1, s.x2) - s.r, sx2 = Math.max(s.x1, s.x2) + s.r, sy1 = Math.min(s.y1, s.y2) - s.r, sy2 = Math.max(s.y1, s.y2) + s.r; if (a < sx2 && c > sx1 && b < sy2 && d > sy1) return false; }
      if (B.NOCOLLIDE.has(f.t)) return true;
      for (const o of this.boxes) { if (o.item === self || (o.t && B.NOCOLLIDE.has(o.t))) continue; if (a < o.x2 && c > o.x1 && b < o.y2 && d > o.y1) return false; }
      return true;
    }
    _moveItem(g, lx, ly) {
      const f = g.userData.f, x = lx - f.w / 2, y = ly - f.d / 2; const tryPos = (px, py) => { if (!this._fits(f, px, py, g)) return false; f.x = px; f.y = py; return true; };
      if (!tryPos(x, y) && !tryPos(x, f.y) && !tryPos(f.x, y)) return;
      g.position.set(f.x + f.w / 2, g.position.y, f.y + f.d / 2); if (g.userData.box) Object.assign(g.userData.box, { x1: f.x, y1: f.y, x2: f.x + f.w, y2: f.y + f.d });
      if (this.selBox) this.selBox.position.copy(g.getWorldPosition(new T.Vector3()).add(this.selOff));
    }
    rotateSelected() {
      const g = this.selected; if (!g) return; const f = g.userData.f, order = ['n', 'e', 's', 'w'], nf = order[(order.indexOf(f.face || 'n') + 1) % 4], cx = f.x + f.w / 2, cy = f.y + f.d / 2;
      if (!this._fits({ ...f, w: f.d, d: f.w }, cx - f.d / 2, cy - f.w / 2, g)) return;
      [f.w, f.d] = [f.d, f.w]; f.face = nf; f.x = cx - f.w / 2; f.y = cy - f.d / 2; g.rotation.y = B.ROT[nf];
      if (g.userData.box) Object.assign(g.userData.box, { x1: f.x, y1: f.y, x2: f.x + f.w, y2: f.y + f.d }); this._saveItem(g); this._select(g);
    }
    /** move an object: to a room, or by dx / dy metres (dx = east, dy = south) */
    moveItem(g, opt) { const f = g.userData.f; let cx = f.x + f.w / 2, cy = f.y + f.d / 2;
      if (opt.room) { const r = this.floor.rooms.find((x) => x.id === opt.room); if (!r) return false; const b = B.bbox(B.roomPts(r)); cx = (b[0] + b[2]) / 2; cy = (b[1] + b[3]) / 2; }
      cx += opt.dx || 0; cy += opt.dy || 0; const ox = f.x, oy = f.y;
      for (let r = 0; r < 2.5; r += 0.25) { let done = false; for (let a = 0; a < 6.28; a += 0.5) { const x = cx + Math.cos(a) * r - f.w / 2, y = cy + Math.sin(a) * r - f.d / 2; if (this._fits(f, x, y, g)) { f.x = x; f.y = y; done = true; break; } if (!r) break; } if (done) break; }
      if (f.x === ox && f.y === oy) return false;
      g.position.set(f.x + f.w / 2, g.position.y, f.y + f.d / 2); if (g.userData.box) Object.assign(g.userData.box, { x1: f.x, y1: f.y, x2: f.x + f.w, y2: f.y + f.d }); this._saveItem(g); if (this.selected === g) this._select(g); return true; }
    deleteSelected() { const g = this.selected; if (!g) return false; this._remove(g); this._select(null); return true; }
    _remove(g) { const s = this._store(); if (g.userData.f.added) s.add = s.add.filter((x) => 'a' + x.id !== g.userData.idx); else s.del.push(g.userData.idx); this._put(s);
      g.parent.remove(g); this.items = this.level.items = this.items.filter((x) => x !== g); this.boxes = this.level.boxes = this.boxes.filter((b) => b.item !== g); this.lights = this.level.lights = this.lights.filter((l) => { for (let p = l.parent; p; p = p.parent) if (p === g) return false; return true; }); }
    _register(f) {
      const g = B.buildFurn(f, {}); g.userData = { ...g.userData, f, idx: f.idx, movable: true, keep: true }; g.traverse((o) => { o.userData.item = g; });
      if (g.userData.light) { const L = g.userData.light, pl = new T.PointLight(L.color, 1, 7, 1.8); pl.position.set(0, L.y, L.z || 0); pl.userData.base = L.i; pl.userData.accent = true; g.add(pl); this.lights.push(pl); }
      this.level.group.add(g); this.items.push(g); if (!B.NOCOLLIDE.has(f.t)) { const b = { x1: f.x, y1: f.y, x2: f.x + f.w, y2: f.y + f.d, item: g, t: f.t }; g.userData.box = b; this.boxes.push(b); }
      if (f.tint) this._tint(g, f.tint); this._applyLook(); return g;
    }
    /** add a new object; `near` = plan point or room id */
    addItem(type, near) {
      const dm = DIM[type]; if (!dm || !this.floor || this.mode === 'ext') return null;
      let c; if (Array.isArray(near)) c = near; else if (near) { const r = this.floor.rooms.find((x) => x.id === near); if (r) { const b = B.bbox(B.roomPts(r)); c = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; } }
      if (!c) c = this.mode === 'walk' ? [this.player.x - Math.sin(this.player.yaw) * 1.7, this.player.y - Math.cos(this.player.yaw) * 1.7] : [this.floor.w * 0.72, this.floor.h * 0.3];
      const f = { t: type, w: dm[0], d: dm[1], face: 'n', added: true, id: Date.now() % 1e9 }; f.idx = 'a' + f.id;
      let ok = false; for (let r = 0; r < 3.2 && !ok; r += 0.3) for (let a = 0; a < 6.28 && !ok; a += 0.6) { const x = c[0] + Math.cos(a) * r - f.w / 2, y = c[1] + Math.sin(a) * r - f.d / 2; if (this._fits(f, x, y, null)) { f.x = x; f.y = y; ok = true; } }
      if (!ok) return null;
      const s = this._store(); s.add.push({ t: f.t, x: f.x, y: f.y, w: f.w, d: f.d, face: 'n', id: f.id }); this._put(s);
      const g = this._register(f); this._select(g); return g;
    }
    /** find objects by type (optionally within a room) */
    find(type, roomId) { const r = roomId && this.floor.rooms.find((x) => x.id === roomId), b = r && B.bbox(B.roomPts(r)); return this.items.filter((g) => { const f = g.userData.f; if (type && f.t !== type) return false; if (!b) return true; const cx = f.x + f.w / 2, cy = f.y + f.d / 2; return cx >= b[0] && cx <= b[2] && cy >= b[1] && cy <= b[3]; }); }
    removeItems(type, roomId) { const l = this.find(type, roomId); l.forEach((g) => this._remove(g)); this._select(null); return l.length; }
    _tint(g, color) { const m = B.mats(), soft = [m.fabric, m.linen, m.fabricDark, m.sage, m.rug], hard = [m.wood, m.lacquer, m.marble, m.pot]; let n = 0; const cache = {};
      const run = (set) => g.traverse((o) => { if (!o.isMesh) return; const src = o.userData.src || o.material; if (!set.includes(src)) return; o.userData.src = src; o.material = cache[src.uuid] || (cache[src.uuid] = Object.assign(src.clone(), { userData: src.userData })); o.material.color.set(color); if (src === m.fabricDark) o.material.color.multiplyScalar(0.75); n++; });
      run(soft); if (!n) run(hard); }
    tintItems(color, items) { const s = this._store(); (items || (this.selected ? [this.selected] : [])).forEach((g) => { this._tint(g, color); if (g.userData.f.added) { const a = s.add.find((x) => 'a' + x.id === g.userData.idx); if (a) a.tint = color; } else s.tint[g.userData.idx] = color; }); this._put(s); }

    /* ---------------- walking ---------------- */
    _floorY(x, y) { const p = this.floor.rooms.find((r) => r.kind === 'pit'); if (!p) return 0; const [a, b, c, d] = p.r, e = Math.min(x - a, c - x, y - b, d - y); return e <= 0 ? 0 : -0.45 * Math.min(1, e / 0.5); }
    _collide(px, py) {
      const R = 0.22;
      for (let it = 0; it < 3; it++) {
        for (const s of this.col) { const vx = s.x2 - s.x1, vy = s.y2 - s.y1, L = vx * vx + vy * vy; let t = L ? ((px - s.x1) * vx + (py - s.y1) * vy) / L : 0; t = Math.max(0, Math.min(1, t)); const cx = s.x1 + vx * t, cy = s.y1 + vy * t; let dx = px - cx, dy = py - cy, dist = Math.hypot(dx, dy), min = R + s.r; if (dist < min) { if (dist < 1e-5) { dx = 1; dy = 0; dist = 1; } px = cx + (dx / dist) * min; py = cy + (dy / dist) * min; } }
        for (const b of this.boxes) { if (b.t === 'pitbench') continue; const cx = Math.max(b.x1, Math.min(px, b.x2)), cy = Math.max(b.y1, Math.min(py, b.y2)); let dx = px - cx, dy = py - cy, dist = Math.hypot(dx, dy); if (dist < R) { if (dist < 1e-5) { const l = px - b.x1, r = b.x2 - px, u = py - b.y1, dn = b.y2 - py, mn = Math.min(l, r, u, dn); if (mn === l) px = b.x1 - R; else if (mn === r) px = b.x2 + R; else if (mn === u) py = b.y1 - R; else py = b.y2 + R; } else { px = cx + (dx / dist) * R; py = cy + (dy / dist) * R; } } }
        px = Math.max(0.3, Math.min(this.floor.w - 0.3, px)); py = Math.max(0.3, Math.min(this.floor.h - 0.3, py));
      }
      return [px, py];
    }
    _walk(dt) {
      const p = this.player, k = this.keys; let f = 0, s = 0;
      if (k.KeyW || k.ArrowUp) f += 1; if (k.KeyS || k.ArrowDown) f -= 1; if (k.KeyD) s += 1; if (k.KeyA) s -= 1;
      if (k.ArrowLeft || k.KeyQ) p.tyaw += dt * 1.8; if (k.ArrowRight || k.KeyE) p.tyaw -= dt * 1.8;
      f += -this.joy.y; s += this.joy.x;
      const kl = 1 - Math.exp(-dt * 16); p.yaw += (p.tyaw - p.yaw) * kl; p.pitch += (p.tpitch - p.pitch) * kl;       // smoothed look
      let tx = 0, ty = 0; const sp = k.ShiftLeft || k.ShiftRight ? 3.4 : 1.9;
      if (f || s) { this.walkTo = null; const l = Math.max(1, Math.hypot(f, s)); f /= l; s /= l; tx = (-Math.sin(p.yaw) * f + Math.cos(p.yaw) * s) * sp; ty = (-Math.cos(p.yaw) * f - Math.sin(p.yaw) * s) * sp; }
      else if (this.walkTo) { const dx = this.walkTo.x - p.x, dy = this.walkTo.y - p.y, dist = Math.hypot(dx, dy); this.walkTo.t += dt; if (dist < 0.3 || this.walkTo.t > 8) this.walkTo = null; else { const v = Math.min(2.4, 0.5 + dist * 1.3); tx = (dx / dist) * v; ty = (dy / dist) * v; } }
      const ka = 1 - Math.exp(-dt * (tx || ty ? 7 : 9)); p.vx += (tx - p.vx) * ka; p.vy += (ty - p.vy) * ka;                 // eased acceleration
      if (Math.abs(p.vx) + Math.abs(p.vy) > 0.004) { const [nx, ny] = this._collide(p.x + p.vx * dt, p.y + p.vy * dt); if (this.walkTo && Math.hypot(nx - p.x, ny - p.y) < 0.003) this.walkTo.t += dt * 5; p.x = nx; p.y = ny; }
      p.eye += (EYE + this._floorY(p.x, p.y) - p.eye) * (1 - Math.exp(-dt * 8)); this._walkCam();
    }
    _walkCam() { const p = this.player; this.camera.position.set(p.x + this.o.x, p.eye + this.o.y, p.y + this.o.z); this.camera.rotation.set(p.pitch, p.yaw, 0, 'YXZ'); }
    _orbitCam() { const o = this.orbit, sp = Math.sin(o.phi); this.camera.position.set(o.target.x + o.radius * sp * Math.sin(o.theta), o.target.y + o.radius * Math.cos(o.phi), o.target.z + o.radius * sp * Math.cos(o.theta)); this.camera.lookAt(o.target); }
    where() { return { x: this.player.x, y: this.player.y, yaw: (-this.player.yaw * 180) / Math.PI }; }
    roomAt(x, y) { const inside = (pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
      let best = null, area = 1e9; for (const r of this.floor.rooms) { const pts = B.roomPts(r); if (!inside(pts)) continue; const b = B.bbox(pts), A = (b[2] - b[0]) * (b[3] - b[1]); if (A < area) { area = A; best = r; } } return best; }

    _loop(now) {
      const raw = (now - this._t) / 1000, dt = Math.min(0.05, raw); this._t = now;
      if (this.el.isConnected && !this.paused) {
        this._doors(dt);
        if (this.tween) {
          const tw = this.tween; tw.t += Math.min(0.25, raw) / tw.dur; const e = ease(Math.min(1, tw.t));
          this.camera.position.lerpVectors(tw.from.p, tw.to.p, e); this.camera.quaternion.slerpQuaternions(tw.from.q, tw.to.q, e); this.camera.fov = tw.from.fov + (tw.to.fov - tw.from.fov) * e; this.camera.updateProjectionMatrix();
          if (tw.t >= 1) { this.tween = null; tw.done && tw.done(); }
        } else if (this.mode !== 'walk') {
          const o = this.orbit, g = this.goal, k = 1 - Math.pow(0.004, dt);
          if (this.mode === 'ext' && !this.diving) { this.idle = (this.idle || 0) + dt; if (this.idle > 2.5 && !this.extHover) g.theta += dt * 0.035; }
          while (g.theta - o.theta > Math.PI) g.theta -= Math.PI * 2; while (o.theta - g.theta > Math.PI) g.theta += Math.PI * 2;
          o.theta += (g.theta - o.theta) * k; o.phi += (g.phi - o.phi) * k; o.radius += (g.radius - o.radius) * k; o.target.lerp(g.target, k); this._orbitCam();
          if (this.diving) { this.diving.t += dt; if (this.diving.t > 0.75 || performance.now() - this.diving.start > 800) { const d = this.diving; this.diving = null; d.done && d.done(); } }
          if (this.mode === 'ext' && this.extHover && this.cb.onLevelHover) this.cb.onLevelHover(this.extHover);
        } else {
          this._walk(dt);
          if (this.cb.onWhere && (this._wt = (this._wt || 0) + dt) > 0.12) { this._wt = 0; this.cb.onWhere(this.where()); }
        }
        const m = B.mats(); if (m.water.normalMap) { m.water.normalMap.offset.x += dt * 0.02; m.water.normalMap.offset.y += dt * 0.012; }
        if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
        // keep it smooth: ease the render resolution down if frames run long, back up when there is headroom
        if (this.quality === 'auto') { this.ft.push(raw); if (this.ft.length >= 50) { const avg = this.ft.reduce((a, b) => a + b, 0) / this.ft.length; this.ft = []; const cap = this._cap(); let pr = this.pr; if (avg > 0.03 && pr > 0.7) pr = Math.max(0.7, pr - 0.2); else if (avg < 0.019 && pr < cap) pr = Math.min(cap, pr + 0.1); if (pr !== this.pr) { this.pr = pr; this.renderer.setPixelRatio(pr); if (this.composer) this.composer.setPixelRatio(pr); } } }
      }
      requestAnimationFrame(this._loop);
    }
  }
  window.World = World; window.B4DIM = DIM;
})();
