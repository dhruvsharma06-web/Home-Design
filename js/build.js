/* B4 — materials, theme, furniture, stairs, walls, levels and the surrounding site.
   Uses window.THREE + window.ADDONS (module bootstrap in index.html). Exposes window.B4. */
(function () {
  const T = window.THREE, AD = window.ADDONS || {};
  if (!T) return;
  const H = 2.9, SLAB = 0.3;
  const ROT = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 };
  const MOVABLE = new Set(['bed', 'nightstand', 'armchair', 'lounge', 'sofa', 'coffee', 'rug', 'dining', 'stool', 'chair', 'desk', 'bench', 'plant', 'floorlamp', 'sidetable', 'lounger', 'aasan', 'verna', 'boulder', 'tv']);
  const NOCOLLIDE = new Set(['rug', 'aasan', 'curtain', 'stepstones', 'tankcover', 'vineplanter', 'fins', 'screen', 'pergola', 'tank', 'pitsteps', 'floatsteps', 'shearwall', 'gate', 'oshower', 'skylight']);
  const FACADE = new Set(['vineplanter', 'fins', 'planter', 'pergola', 'poolflush', 'skylight', 'verna', 'gate', 'palm', 'shrub', 'bamboo', 'shearwall', 'fountain', 'greenwall', 'boulder', 'stepstones', 'tank', 'pitbench', 'firetable', 'pitsteps', 'screen', 'lounger', 'bench', 'floatsteps', 'tankcover', 'onyx', 'curtain', 'sofa', 'bed', 'dining', 'tv', 'armchair', 'wardrobe', 'counter', 'island', 'tall', 'mandir', 'lounge', 'coffee', 'rug', 'floorlamp', 'plant', 'sidetable', 'nightstand', 'desk', 'chair', 'fridge', 'stool']);
  const roomPts = (r) => r.poly || [[r.r[0], r.r[1]], [r.r[2], r.r[1]], [r.r[2], r.r[3]], [r.r[0], r.r[3]]];
  const rectPts = (r) => [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
  const bbox = (pts) => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };

  /* ============================ theme ============================ */
  const PRESETS = {
    'Render': { wall: '#EFEBE4', floor: 'marble', fabric: '#D8CFC2', accent: '#8F9A86', joinery: '#F1EEE8', kitchen: '#8B8778', fins: '#A8774D', frame: '#232427' },
    'Greige & White': { wall: '#F1EEE8', floor: 'marble', fabric: '#CFC6BA', accent: '#A89D8F', joinery: '#F4F1EB', kitchen: '#B4AA9B', fins: '#B9AC9B', frame: '#8D9095' },
    'Olive & Oak': { wall: '#EDE8DE', floor: 'oak', fabric: '#E3DACB', accent: '#70745F', joinery: '#EFEADF', kitchen: '#70745F', fins: '#9A7650', frame: '#2B2C2A' },
    'Stone & Charcoal': { wall: '#E9E7E2', floor: 'stone', fabric: '#B9B2A8', accent: '#5B6068', joinery: '#E6E3DD', kitchen: '#3F4246', fins: '#6E6A64', frame: '#1F2022' },
  };
  const FLOORS_T = {
    marble: { label: 'Spanish Beige marble', color: '#E2D2B8', c: 'marble_c.jpg', n: 'marble_n.jpg', rough: 0.3, rep: 1 },
    white: { label: 'White marble', color: '#F1EEE9', c: 'marble_c.jpg', n: 'marble_n.jpg', rough: 0.26, rep: 1 },
    oak: { label: 'Oak timber', color: '#D9B78D', c: 'wood_c.jpg', n: 'wood_n.jpg', rough: 0.55, rep: 1.5 },
    stone: { label: 'Grey limestone', color: '#B4AFA6', c: 'stone_c.jpg', n: 'stone_n.jpg', rough: 0.7, rep: 1.5 },
  };
  let THEME = { ...PRESETS.Render };
  try { Object.assign(THEME, JSON.parse(localStorage.getItem('b4-theme') || '{}')); } catch (e) {}

  /* ============================ textures + materials ============================ */
  const TL = new T.TextureLoader(), texCache = {};
  let maxAniso = 8;
  function setMap(mat, prop, file, srgb, rep) {
    const key = file + '|' + (rep || 1) + '|' + (srgb ? 1 : 0);
    if (!texCache[key]) texCache[key] = new Promise((res) => TL.load('assets/tex/' + file, (t) => { t.wrapS = t.wrapT = T.RepeatWrapping; if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = maxAniso; if (rep) t.repeat.set(rep, rep); res(t); }, undefined, () => res(null)));
    const tok = (mat.userData['tok_' + prop] = Math.random());
    texCache[key].then((t) => { if (t && mat.userData['tok_' + prop] === tok) { mat[prop] = t; mat.needsUpdate = true; } });
  }
  let M = null;
  function mats() {
    if (M) return M;
    const std = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o });
    const tx = (color, o, maps, tile, rep) => { const m = std(color, o); m.userData.tile = tile; if (maps.c) setMap(m, 'map', maps.c, true, rep); if (maps.n) setMap(m, 'normalMap', maps.n, false, rep); return m; };
    M = {
      marble: tx('#E2D2B8', { roughness: 0.3 }, {}, 1.8),
      wall: tx('#EFEBE4', { roughness: 0.95 }, { n: 'plaster_n.jpg' }, 2.2),
      ceiling: std('#F3F0EA', { roughness: 1 }),
      kota: tx('#87705C', { roughness: 0.62 }, { c: 'stone_c.jpg', n: 'stone_n.jpg' }, 1.2),
      kotaPol: tx('#8F7B68', { roughness: 0.3 }, { c: 'stone_c.jpg' }, 1.2),
      kotaGreen: tx('#84948A', { roughness: 0.85 }, { c: 'stone_c.jpg', n: 'stone_n.jpg' }, 1.2),
      limeGrey: tx('#9C9B95', { roughness: 0.9 }, { c: 'stone_c.jpg', n: 'stone_n.jpg' }, 1.2),
      limeYellow: tx('#D0BC92', { roughness: 0.9 }, { c: 'stone_c.jpg', n: 'stone_n.jpg' }, 1.5),
      sandstone: tx('#D2B19A', { roughness: 0.9 }, { n: 'stone_n.jpg' }, 1),
      cladding: tx('#CDBB9E', { roughness: 0.92 }, { c: 'stone_c.jpg', n: 'stone_n.jpg' }, 0.9),
      terr: tx('#CFC3AE', { roughness: 0.8 }, { c: 'stone_c.jpg', n: 'stone_n.jpg' }, 1.4),
      wood: tx('#D9B78D', { roughness: 0.6 }, { c: 'wood_c.jpg', n: 'wood_n.jpg' }, 1.2),
      deck: tx('#BF9266', { roughness: 0.7 }, { c: 'wood_c.jpg', n: 'wood_n.jpg' }, 1.0),
      fabric: tx('#D8CFC2', { roughness: 1 }, { c: 'fabric_c.jpg', n: 'fabric_n.jpg' }, 0.5, 3),
      fabricDark: tx('#9F9486', { roughness: 1 }, { c: 'fabric_c.jpg', n: 'fabric_n.jpg' }, 0.5, 3),
      linen: tx('#F0ECE4', { roughness: 1 }, { n: 'linen_n.jpg' }, 0.6, 2),
      sage: tx('#8F9A86', { roughness: 1 }, { n: 'linen_n.jpg' }, 0.6, 2),
      rug: tx('#D5CBBB', { roughness: 1 }, { c: 'fabric_c.jpg', n: 'linen_n.jpg' }, 0.6),
      grass: tx('#A9BA8A', { roughness: 1 }, { c: 'grass_c.jpg', n: 'grass_n.jpg' }, 1.6),
      granite: tx('#343436', { roughness: 0.18 }, { c: 'granite_c.jpg' }, 1),
      lacquer: std('#F1EEE8', { roughness: 0.4 }),
      olive: std('#8B8778', { roughness: 0.5 }),
      fins: tx('#A8774D', { roughness: 0.55 }, { c: 'wood_c.jpg', n: 'wood_n.jpg' }, 1.0),
      frame: std('#232427', { roughness: 0.45, metalness: 0.6 }),
      steel: std('#C4C6C8', { roughness: 0.32, metalness: 0.9 }),
      brass: std('#BFA066', { roughness: 0.35, metalness: 0.85 }),
      dark: std('#2a2927', { roughness: 0.5, metalness: 0.3 }),
      ceramic: std('#F6F5F2', { roughness: 0.18 }),
      mirror: std('#E8EDEE', { roughness: 0.03, metalness: 1 }),
      pot: std('#CFC6B8', { roughness: 0.9 }),
      leaf: std('#4A6B42', { roughness: 0.9 }), leaf2: std('#67884F', { roughness: 0.9 }), leaf3: std('#3A5837', { roughness: 0.9 }),
      trunk: std('#75604A', { roughness: 1 }), rock: tx('#77746E', { roughness: 0.95 }, { n: 'stone_n.jpg' }, 1),
      glass: new T.MeshPhysicalMaterial({ color: '#DDE7E6', transparent: true, opacity: 0.14, roughness: 0.04, metalness: 0, envMapIntensity: 1.5, depthWrite: false, side: T.DoubleSide }),
      sheer: new T.MeshStandardMaterial({ color: '#F1ECE2', transparent: true, opacity: 0.46, roughness: 1, side: T.DoubleSide, depthWrite: false }),
      water: new T.MeshPhysicalMaterial({ color: '#56B6C0', transparent: true, opacity: 0.8, roughness: 0.06, metalness: 0.1, envMapIntensity: 1.4 }),
      poolTile: std('#C6E2E1', { roughness: 0.3 }),
      onyx: tx('#EBD3A4', { roughness: 0.22, emissive: new T.Color('#FFCB86'), emissiveIntensity: 0.4 }, { c: 'marble_c.jpg' }, 2.9),
      glow: new T.MeshBasicMaterial({ color: '#FFDDB0' }),
      shade: new T.MeshStandardMaterial({ color: '#F4E9D6', emissive: new T.Color('#FFD7A2'), emissiveIntensity: 0.5, side: T.DoubleSide, roughness: 1 }),
      flame: new T.MeshBasicMaterial({ color: '#FFAE55' }),
      carPaint: new T.MeshPhysicalMaterial({ color: '#07080a', roughness: 0.2, metalness: 0.7, clearcoat: 1, clearcoatRoughness: 0.06 }),
      carGlass: std('#10151a', { roughness: 0.05, metalness: 0.6 }),
      tyre: std('#161616', { roughness: 0.9 }),
      ledW: new T.MeshBasicMaterial({ color: '#F4F8FF' }), ledR: new T.MeshBasicMaterial({ color: '#D01822' }),
      soffit: tx('#CDAA82', { roughness: 0.7 }, { c: 'wood_c.jpg', n: 'wood_n.jpg' }, 1.4),
      asphalt: tx('#3E3F41', { roughness: 0.95 }, { n: 'stone_n.jpg' }, 3),
      paver: tx('#8E8B85', { roughness: 0.9 }, { c: 'stone_c.jpg', n: 'stone_n.jpg' }, 1.2),
      villa: std('#EEEAE3', { roughness: 0.92 }), villa2: std('#DCD0BE', { roughness: 0.92 }), villaGlass: std('#26323B', { roughness: 0.08, metalness: 0.55, emissive: new T.Color('#FFC27E'), emissiveIntensity: 0 }),
      hill: new T.MeshStandardMaterial({ color: '#5E7A5A', roughness: 1, flatShading: true }), hill2: new T.MeshStandardMaterial({ color: '#6F8A7C', roughness: 1, flatShading: true }),
      hl: new T.MeshBasicMaterial({ color: '#FFD9A0', transparent: true, opacity: 0.0, depthWrite: false }),
    };
    setMap(M.onyx, 'emissiveMap', 'marble_c.jpg', true);
    setMap(M.water, 'normalMap', 'stone_n.jpg', false, 2);
    for (const k in M) M[k].userData.baseEnv = M[k].envMapIntensity === undefined ? 1 : M[k].envMapIntensity;
    applyTheme(THEME, true);
    return M;
  }
  function applyTheme(th, quiet) {
    Object.assign(THEME, th); const m = M || mats();
    m.wall.color.set(THEME.wall); m.fabric.color.set(THEME.fabric); m.sage.color.set(THEME.accent); m.lacquer.color.set(THEME.joinery);
    m.olive.color.set(THEME.kitchen); m.fins.color.set(THEME.fins); m.frame.color.set(THEME.frame);
    m.fabricDark.color.set(THEME.fabric).multiplyScalar(0.72); m.rug.color.set(THEME.fabric).lerp(new T.Color('#ffffff'), 0.15);
    const F = FLOORS_T[THEME.floor] || FLOORS_T.marble; m.marble.color.set(F.color); m.marble.roughness = F.rough;
    setMap(m.marble, 'map', F.c, true, F.rep); setMap(m.marble, 'normalMap', F.n, false, F.rep);
    if (!quiet) try { localStorage.setItem('b4-theme', JSON.stringify(THEME)); } catch (e) {}
  }

  /* ============================ geometry helpers ============================ */
  function scaleUV(g, w, h, d, t) { const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); } }
  function box(w, h, d, mat, x = 0, y = 0, z = 0, cast = true) { const g = new T.BoxGeometry(w, h, d); if (mat.userData.tile) scaleUV(g, w, h, d, mat.userData.tile); const m = new T.Mesh(g, mat); m.position.set(x, y + h / 2, z); m.castShadow = cast; m.receiveShadow = true; return m; }
  function rbox(w, h, d, r, mat, x = 0, y = 0, z = 0) { const g = AD.RoundedBoxGeometry ? new AD.RoundedBoxGeometry(w, h, d, 3, Math.max(0.004, Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002))) : new T.BoxGeometry(w, h, d); const m = new T.Mesh(g, mat); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; return m; }
  function cyl(r, h, mat, x = 0, y = 0, z = 0, seg = 28, r2) { const m = new T.Mesh(new T.CylinderGeometry(r2 === undefined ? r : r2, r, h, seg), mat); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; return m; }
  function blob(r, mat, x, y, z, sy = 1) { const m = new T.Mesh(new T.IcosahedronGeometry(r, 2), mat); m.position.set(x, y, z); m.scale.y = sy; m.castShadow = true; return m; }
  function shapeOf(pts, holes) { const s = new T.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, -y) : s.moveTo(x, -y))); (holes || []).forEach((r) => { const p = new T.Path(); p.moveTo(r[0], -r[1]); p.lineTo(r[0], -r[3]); p.lineTo(r[2], -r[3]); p.lineTo(r[2], -r[1]); p.lineTo(r[0], -r[1]); s.holes.push(p); }); return s; }
  function flat(pts, holes, mat, y, tile) { const g = new T.ShapeGeometry(shapeOf(pts, holes)); const t = tile || mat.userData.tile; if (t) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / t, uv.getY(i) / t); } const m = new T.Mesh(g, mat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m; }
  function slab(pts, holes, mat, yTop, depth) { const m = new T.Mesh(new T.ExtrudeGeometry(shapeOf(pts, holes), { depth, bevelEnabled: false }), mat); m.rotation.x = -Math.PI / 2; m.position.y = yTop - depth; m.castShadow = true; m.receiveShadow = true; return m; }

  /** merge every static mesh under root into one mesh per material (huge draw-call saving) */
  function mergeStatic(root) {
    const BGU = AD.BufferGeometryUtils; if (!BGU) return;
    root.updateMatrixWorld(true); const inv = new T.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map(), rm = [];
    root.traverse((o) => {
      if (!o.isMesh || o.userData.keep || Array.isArray(o.material)) return;
      for (let p = o.parent; p && p !== root; p = p.parent) if (p.userData.keep) return;
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      if (!g.attributes.uv || !g.attributes.normal) return;
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      const key = o.material.uuid + (o.castShadow ? 1 : 0);
      if (!buckets.has(key)) buckets.set(key, { m: o.material, c: o.castShadow, g: [] }); buckets.get(key).g.push(g); rm.push(o);
    });
    rm.forEach((o) => { o.parent.remove(o); o.geometry.dispose(); });
    for (const b of buckets.values()) { const geo = BGU.mergeGeometries(b.g, false); if (!geo) continue; b.g.forEach((x) => x.dispose()); const m = new T.Mesh(geo, b.m); m.castShadow = b.c; m.receiveShadow = true; m.userData.merged = true; root.add(m); }
  }

  /* ============================ glTF models (plants, console, diya) ============================ */
  const modelCache = {};
  function model(name) {
    if (!AD.GLTFLoader) return Promise.resolve(null);
    if (!modelCache[name]) modelCache[name] = new Promise((res) => new AD.GLTFLoader().load(`assets/models/${name}/${name}.gltf`, (g) => {
      g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material.map) o.material.map.anisotropy = maxAniso; if (o.material.transparent || o.material.alphaTest) { o.material.alphaTest = 0.4; o.material.transparent = false; o.material.side = T.DoubleSide; } } });
      res(g.scene);
    }, undefined, () => res(null)));
    return modelCache[name];
  }
  /** swap a procedural stand-in for a real model once it has loaded */
  function useModel(g, name, fit, tint) {
    model(name).then((src) => {
      if (!src || !g.parent) return;
      const c = src.clone(true), b = new T.Box3().setFromObject(c), size = b.getSize(new T.Vector3());
      const s = fit.h ? fit.h / size.y : Math.min(fit.w / size.x, fit.d / size.z);
      c.scale.setScalar(s); if (fit.sx) c.scale.x *= fit.sx;
      const b2 = new T.Box3().setFromObject(c), ctr = b2.getCenter(new T.Vector3());
      c.position.set(-ctr.x, -b2.min.y + (fit.y || 0), -ctr.z + (fit.z || 0));
      if (tint) c.traverse((o) => { if (o.isMesh && tint.test.test(o.material.name || '')) { o.material = o.material.clone(); o.material.color.set(tint.color); } });
      const keepLight = g.children.filter((x) => x.isLight || x.userData.stay); g.clear(); keepLight.forEach((x) => g.add(x));
      c.traverse((o) => { o.userData.item = g.userData.self || g; }); g.add(c);
    });
  }

  /* ============================ furniture ============================ */
  function plantModel(g, r, m, tall = 1.25) { g.add(cyl(r * 0.5, 0.42, m.pot, 0, 0, 0, 24, r * 0.6)); g.add(cyl(0.02, tall - 0.5, m.trunk, 0, 0.4, 0, 8)); g.add(blob(r * 0.85, m.leaf, 0, tall - 0.25, 0, 1.15)); g.add(blob(r * 0.6, m.leaf2, r * 0.3, tall + 0.15, -r * 0.15)); g.add(blob(r * 0.5, m.leaf3, -r * 0.3, tall - 0.05, r * 0.25)); }
  function chairModel(m, mat) { const c = new T.Group(); c.add(rbox(0.46, 0.07, 0.46, 0.03, mat, 0, 0.41, 0)); const b = rbox(0.44, 0.42, 0.05, 0.025, mat, 0, 0.5, -0.2); b.rotation.x = -0.1; c.add(b); for (const [a, e] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = cyl(0.014, 0.42, m.wood, a * 0.19, 0, e * 0.19, 8, 0.018); c.add(l); } return c; }

  function buildFurn(f, opt = {}) {
    const m = mats(), face = f.face || 'n', swap = face === 'e' || face === 'w';
    let w = swap ? f.d : f.w, d = swap ? f.w : f.d, hw = w / 2, hd = d / 2;
    const g = new T.Group(); const lite = opt.shell;
    switch (f.t) {
      case 'stairs': return null;
      case 'bed': {
        g.add(box(w + 0.08, 0.2, d + 0.02, m.wood, 0, 0.08, 0)); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.06, 0.08, 0.06, m.dark, a * (hw - 0.05), 0, b * (hd - 0.05)));
        g.add(rbox(w - 0.02, 0.24, d - 0.12, 0.07, m.linen, 0, 0.28, 0.05));                              // mattress 240 mm
        g.add(rbox(w + 0.02, 0.07, d * 0.5, 0.03, m.linen, 0, 0.5, hd * 0.44)); g.add(rbox(w + 0.03, 0.05, d * 0.2, 0.02, m.sage, 0, 0.56, hd * 0.66));
        g.add(rbox(w + 0.5, 1.2, 0.09, 0.03, m.fabricDark, 0, 0, -hd + 0.01));
        for (let i = 1; i < 5; i++) g.add(box(0.006, 1.16, 0.004, m.dark, -hw - 0.25 + ((w + 0.5) / 5) * i, 0.02, -hd + 0.058, false));
        for (const s of [-1, 1]) { const p = rbox(w * 0.42, 0.14, 0.4, 0.07, m.linen, s * w * 0.24, 0.56, -hd + 0.32); p.rotation.x = 0.25; g.add(p); const q = rbox(w * 0.3, 0.12, 0.3, 0.06, m.fabric, s * w * 0.24, 0.6, -hd + 0.62); q.rotation.x = 0.35; g.add(q); }
        break;
      }
      case 'sofa': {
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.02, 0.1, m.dark, a * (hw - 0.1), 0, b * (hd - 0.1), 8));
        g.add(rbox(w, 0.22, d, 0.05, m.fabric, 0, 0.1, 0)); g.add(rbox(w, 0.44, 0.2, 0.08, m.fabric, 0, 0.32, -hd + 0.1));
        for (const s of [-1, 1]) g.add(rbox(0.18, 0.28, d, 0.07, m.fabric, s * (hw - 0.09), 0.32, 0));
        const n = Math.max(2, Math.round((w - 0.36) / 0.68)), cw = (w - 0.36) / n;
        for (let i = 0; i < n; i++) { const x = -hw + 0.18 + cw * (i + 0.5); g.add(rbox(cw - 0.015, 0.13, d - 0.26, 0.05, m.fabric, x, 0.31, 0.1)); const b = rbox(cw - 0.04, 0.36, 0.15, 0.07, m.fabric, x, 0.43, -hd + 0.28); b.rotation.x = -0.14; g.add(b); }
        const c1 = rbox(0.42, 0.4, 0.13, 0.06, m.sage, -hw + 0.46, 0.46, -hd + 0.42); c1.rotation.set(-0.3, 0.25, 0); g.add(c1); const c2 = rbox(0.36, 0.34, 0.12, 0.05, m.fabricDark, hw - 0.46, 0.46, -hd + 0.42); c2.rotation.set(-0.3, -0.25, 0); g.add(c2);
        break;
      }
      case 'armchair': case 'lounge': {
        const mat = f.t === 'lounge' ? m.fabricDark : m.linen;
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = cyl(0.016, 0.2, m.wood, a * (hw - 0.07), 0, b * (hd - 0.07), 8, 0.024); g.add(l); }
        g.add(rbox(w, 0.16, d, 0.07, mat, 0, 0.2, 0)); const bk = rbox(w, 0.5, 0.16, 0.07, mat, 0, 0.34, -hd + 0.1); bk.rotation.x = -0.14; g.add(bk);
        for (const s of [-1, 1]) g.add(rbox(0.1, 0.24, d * 0.82, 0.045, mat, s * (hw - 0.05), 0.36, 0.02));
        g.add(rbox(w - 0.22, 0.11, d - 0.22, 0.05, m.fabric, 0, 0.36, 0.05));
        break;
      }
      case 'lounger': {
        g.add(box(w, 0.05, d, m.wood, 0, 0.27, 0)); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.05, 0.27, 0.05, m.wood, a * (hw - 0.05), 0, b * (hd - 0.1)));
        g.add(rbox(w - 0.06, 0.08, d * 0.66, 0.035, m.linen, 0, 0.32, d * 0.15)); const b = rbox(w - 0.06, 0.08, d * 0.36, 0.035, m.linen, 0, 0, 0); b.position.set(0, 0.5, -hd + d * 0.17); b.rotation.x = 0.55; g.add(b);
        break;
      }
      case 'nightstand': g.add(rbox(w, 0.4, d, 0.015, m.wood, 0, 0.1, 0)); g.add(box(w - 0.06, 0.1, d - 0.06, m.dark, 0, 0, 0)); g.add(box(w - 0.04, 0.004, 0.004, m.dark, 0, 0.3, hd + 0.001, false));
        g.add(cyl(0.055, 0.02, m.brass, 0, 0.5, 0)); g.add(cyl(0.01, 0.26, m.brass, 0, 0.5, 0, 8)); { const s = new T.Mesh(new T.CylinderGeometry(0.085, 0.12, 0.19, 24, 1, true), m.shade); s.position.y = 0.85; g.add(s); } break;
      case 'sidetable': g.add(cyl(w / 2, 0.025, m.marble, 0, 0.47, 0, 32)); g.add(cyl(0.02, 0.47, m.dark, 0, 0, 0, 10)); g.add(cyl(w * 0.3, 0.015, m.dark, 0, 0, 0, 24)); break;
      case 'stool': g.add(cyl(w / 2, 0.06, m.fabricDark, 0, 0.62, 0, 24)); for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283 + 0.78; const l = cyl(0.012, 0.63, m.dark, Math.cos(a) * w * 0.36, 0, Math.sin(a) * w * 0.36, 8); g.add(l); } g.add(new T.Mesh(new T.TorusGeometry(w * 0.34, 0.008, 6, 24), m.dark)); g.children[g.children.length - 1].rotation.x = Math.PI / 2; g.children[g.children.length - 1].position.y = 0.2; break;
      case 'coffee': g.add(rbox(w, 0.05, d, 0.02, m.marble, 0, 0.33, 0)); g.add(box(w - 0.2, 0.33, 0.04, m.dark, 0, 0, -hd + 0.15)); g.add(box(w - 0.2, 0.33, 0.04, m.dark, 0, 0, hd - 0.15)); g.add(box(w - 0.14, 0.02, d - 0.2, m.wood, 0, 0.12, 0));
        g.add(cyl(0.1, 0.03, m.ceramic, w * 0.12, 0.38, 0.05, 24)); g.add(box(0.26, 0.03, 0.19, m.fabricDark, -w * 0.18, 0.38, -0.04)); g.add(box(0.24, 0.025, 0.17, m.linen, -w * 0.18, 0.41, -0.04)); break;
      case 'rug': g.add(box(w, 0.012, d, m.rug, 0, 0.002, 0, false)); break;
      case 'aasan': g.add(box(w, 0.03, d, m.sage, 0, 0.002, 0, false)); break;
      case 'tv': {
        // media wall: timber back panel + low console (real cabinet model) + screen
        g.add(box(w + 0.5, 2.4, 0.04, m.wood, 0, 0.15, -hd + 0.02)); g.add(box(w + 0.5, 0.015, 0.03, m.glow, 0, 2.56, -hd + 0.05, false));
        const con = new T.Group(); con.userData.self = g; con.add(rbox(w, 0.42, d * 0.85, 0.015, m.wood, 0, 0.12, 0)); for (const s of [-1, 1]) con.add(box(0.03, 0.12, d * 0.6, m.dark, s * (hw - 0.15), 0, 0)); con.position.z = 0.04; g.add(con);
        if (!lite) useModel(con, 'modern_wooden_cabinet', { w, d: d * 0.95 });
        g.add(box(Math.min(1.45, w * 0.8), 0.82, 0.03, m.dark, 0, 0.95, -hd + 0.06)); g.add(box(Math.min(1.45, w * 0.8) - 0.03, 0.79, 0.005, m.carGlass, 0, 0.965, -hd + 0.078, false));
        break;
      }
      case 'wardrobe': case 'tall': {
        const mat = f.tone === 'kitchen' || f.tone === 'olive' ? m.olive : m.lacquer, hh = f.t === 'tall' && f.glass ? 1.9 : 2.4;
        g.add(box(w, 0.1, d - 0.06, m.dark, 0, 0, -0.03)); g.add(box(w, hh - 0.1, d, mat, 0, 0.1, 0)); g.add(box(w, H - hh - 0.02, d, mat, 0, hh + 0.01, 0));   // carcass + loft
        const n = Math.max(1, Math.round(w / 0.5));
        for (let i = 1; i < n; i++) { g.add(box(0.005, hh - 0.12, 0.005, m.dark, -hw + (w / n) * i, 0.11, hd + 0.001, false)); g.add(box(0.005, H - hh - 0.04, 0.005, m.dark, -hw + (w / n) * i, hh + 0.02, hd + 0.001, false)); }
        for (let i = 0; i < n; i++) g.add(box(0.012, 0.26, 0.018, f.tone ? m.dark : m.brass, -hw + (w / n) * (i + 0.5) + (i % 2 ? -(w / n) * 0.38 : (w / n) * 0.38), 1.05, hd + 0.011, false));
        if (f.glass) g.add(box(w - 0.06, hh - 0.5, 0.008, m.glass, 0, 0.4, hd + 0.004, false));
        break;
      }
      case 'fridge': g.add(rbox(w, 1.78, d, 0.015, m.steel, 0, 0.02, 0)); g.add(box(0.006, 1.74, 0.006, m.dark, 0, 0.04, hd + 0.001, false)); for (const s of [-1, 1]) g.add(box(0.02, 0.6, 0.03, m.dark, s * 0.05, 0.75, hd + 0.016, false)); break;
      case 'washer': g.add(rbox(w, 0.85, d, 0.02, m.ceramic, 0, 0, 0)); { const c = cyl(0.2, 0.02, m.dark, 0, 0, 0, 28); c.rotation.x = Math.PI / 2; c.position.set(0, 0.42, hd + 0.005); g.add(c); } break;
      case 'counter': {
        // Godrej module: 100 skirting + 700 carcass + 43 counter = 843 mm; wall units 600 above
        const CT = 0.843, n = Math.max(1, Math.round(w / 0.55));
        g.add(box(w, 0.1, d - 0.07, m.dark, 0, 0, -0.035)); g.add(box(w, 0.7, d, m.olive, 0, 0.1, 0)); g.add(box(w + 0.01, 0.043, d + 0.02, m.granite, 0, 0.8, 0.005));
        for (let i = 1; i < n; i++) g.add(box(0.005, 0.68, 0.005, m.dark, -hw + (w / n) * i, 0.11, hd + 0.001, false));
        for (let i = 0; i < n; i++) g.add(box(Math.min(0.2, w / n - 0.12), 0.01, 0.022, m.dark, -hw + (w / n) * (i + 0.5), 0.73, hd + 0.013, false));
        if (!f.low) {
          g.add(box(w, 0.6, 0.015, m.marble, 0, CT, -hd + 0.008, false));
          g.add(box(w, 0.6, 0.33, m.olive, 0, CT + 0.6, -hd + 0.165)); g.add(box(w, H - (CT + 1.2) - 0.02, 0.33, m.olive, 0, CT + 1.21, -hd + 0.165)); g.add(box(w - 0.1, 0.012, 0.02, m.glow, 0, CT + 0.588, -hd + 0.3, false));
          for (let i = 1; i < n; i++) { g.add(box(0.005, 0.58, 0.005, m.dark, -hw + (w / n) * i, CT + 0.61, -hd + 0.331, false)); }
          const hx = w * 0.2, sx = -w * 0.2;
          g.add(box(0.6, 0.012, 0.5, m.dark, hx, CT + 0.001, 0, false)); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.05, 0.02, m.steel, hx + a * 0.14, CT + 0.012, b * 0.12, 16));
          g.add(box(0.6, 0.3, 0.33, m.steel, hx, CT + 0.6, -hd + 0.165)); g.add(box(0.6, 0.05, 0.45, m.steel, hx, CT + 0.56, -hd + 0.225));
          g.add(box(0.56, 0.01, 0.42, m.steel, sx, CT + 0.002, 0.02, false)); g.add(cyl(0.012, 0.3, m.steel, sx, CT, -hd + 0.1, 8)); g.add(box(0.02, 0.02, 0.16, m.steel, sx, CT + 0.29, -hd + 0.17));
        }
        break;
      }
      case 'island': g.add(box(w - 0.1, 0.1, d - 0.1, m.dark, 0, 0, 0)); g.add(box(w, 0.7, d, m.olive, 0, 0.1, 0)); g.add(box(w + 0.05, 0.043, d + 0.05, m.granite, 0, 0.8, 0)); g.add(box(0.005, 0.68, 0.005, m.dark, 0, 0.11, hd + 0.001, false)); break;
      case 'desk': g.add(rbox(w, 0.035, d, 0.012, m.wood, 0, 0.715, 0)); for (const s of [-1, 1]) { g.add(box(0.025, 0.715, 0.025, m.dark, s * (hw - 0.04), 0, -hd + 0.05)); g.add(box(0.025, 0.715, 0.025, m.dark, s * (hw - 0.04), 0, hd - 0.05)); } g.add(box(w * 0.35, 0.1, d - 0.1, m.wood, hw - w * 0.2, 0.6, 0)); break;
      case 'chair': g.add(chairModel(m, m.fabric)); break;
      case 'bench': if (f.stone) { g.add(box(w, 0.1, d, m.limeGrey, 0, 0.34, 0)); for (const s of [-1, 1]) g.add(box(0.12, 0.34, d, m.limeGrey, s * (hw - 0.2), 0, 0)); } else g.add(rbox(w, 0.42, d, 0.02, m.wood, 0, 0, 0)); break;
      case 'dining': {
        const seats = f.seats || 6, long = d >= w, TW = long ? Math.min(w, 0.95) : w, TD = long ? d : Math.min(d, 0.95);
        g.add(rbox(TW, 0.04, TD, 0.015, m.wood, 0, 0.71, 0));                                           // 750 mm table
        for (const s of [-1, 1]) { const leg = long ? box(TW * 0.55, 0.71, 0.05, m.dark, 0, 0, s * TD * 0.36) : box(0.05, 0.71, TD * 0.55, m.dark, s * TW * 0.36, 0, 0); g.add(leg); }
        const per = seats / 2;
        for (let i = 0; i < per; i++) { const t = -0.5 + (i + 0.5) / per; const put = (x, z, r) => { const c = chairModel(m, m.fabric); c.position.set(x, 0, z); c.rotation.y = r; g.add(c); };
          if (long) { put(-TW / 2 - 0.16, t * TD, Math.PI / 2); put(TW / 2 + 0.16, t * TD, -Math.PI / 2); } else { put(t * TW, -TD / 2 - 0.16, 0); put(t * TW, TD / 2 + 0.16, Math.PI); } }
        if (!f.outdoor) { g.add(box(long ? 0.04 : TW * 0.8, 0.03, long ? TD * 0.8 : 0.04, m.brass, 0, 1.6, 0, false)); g.add(box(long ? 0.025 : TW * 0.78, 0.008, long ? TD * 0.78 : 0.025, m.glow, 0, 1.592, 0, false)); for (const s of [-1, 1]) g.add(cyl(0.003, H - 1.63, m.dark, long ? 0 : s * TW * 0.35, 1.63, long ? s * TD * 0.35 : 0, 6)); g.userData.light = { y: 1.5, color: '#FFD9A8', i: 3 }; }
        g.add(cyl(0.06, 0.2, m.ceramic, 0, 0.75, 0, 20, 0.045)); g.add(blob(0.1, m.leaf2, 0, 1.06, 0));
        break;
      }
      case 'wc': g.add(rbox(w - 0.03, 0.34, d - 0.08, 0.09, m.ceramic, 0, 0.08, 0.04)); g.add(rbox(w - 0.05, 0.02, d - 0.12, 0.008, m.ceramic, 0, 0.42, 0.05)); g.add(box(w + 0.1, 1.1, 0.12, m.kotaPol, 0, 0, -hd + 0.06)); g.add(box(0.22, 0.14, 0.015, m.steel, 0, 0.9, -hd + 0.123, false)); break;
      case 'basin': g.add(box(w, 0.05, d, m.marble, 0, 0.8, 0)); g.add(rbox(w * 0.62, 0.13, d * 0.66, 0.05, m.ceramic, 0, 0.85, 0.01)); g.add(box(w - 0.02, 0.32, d - 0.05, m.wood, 0, 0.46, -0.01)); g.add(cyl(0.012, 0.24, m.steel, 0, 0.85, -hd + 0.07, 8)); g.add(box(0.02, 0.02, 0.14, m.steel, 0, 1.08, -hd + 0.13));
        g.add(box(w * 0.92, 0.85, 0.02, m.mirror, 0, 1.2, -hd + 0.012, false)); g.add(box(w * 0.92, 0.015, 0.03, m.glow, 0, 2.07, -hd + 0.02, false)); break;
      case 'tub': g.add(rbox(w, 0.56, d, 0.14, m.ceramic, 0, 0, 0)); g.add(box(w - 0.18, 0.02, d - 0.18, m.water, 0, 0.5, 0, false)); g.add(cyl(0.012, 0.3, m.steel, -hw + 0.12, 0.56, 0, 8)); break;
      case 'shower': g.add(box(0.012, 2.05, d, m.glass, -hw, 0, 0, false)); g.add(cyl(0.11, 0.015, m.steel, 0.12, 2.15, 0, 24)); g.add(cyl(0.01, 0.2, m.steel, 0.12, 2.16, 0, 8)); break;
      case 'oshower': g.add(cyl(0.02, 2.2, m.steel, 0, 0, 0, 10)); g.add(cyl(0.14, 0.02, m.steel, 0, 2.2, 0.2, 20)); g.add(box(0.03, 0.03, 0.22, m.steel, 0, 2.2, 0.1)); break;
      case 'plant': plantModel(g, Math.min(w, d) / 2, m); if (!lite) useModel(g, 'potted_plant_02', { h: 1.15 }, { test: /pot/i, color: '#CFC6B8' }); break;
      case 'palm': { g.add(cyl(0.08, 2.6, m.trunk, 0, 0, 0, 10, 0.05)); for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const l = box(0.22, 0.02, 1.5, i % 2 ? m.leaf : m.leaf2, 0, 0, 0); l.position.set(Math.sin(a) * 0.6, 2.55 - (i % 3) * 0.08, Math.cos(a) * 0.6); l.rotation.set(-0.45, a, 0, 'YXZ'); g.add(l); } break; }
      case 'shrub': { const n = Math.round(Math.max(w, d) / 0.45); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n - 0.5; const r = 0.26 + ((i * 37) % 10) / 60; g.add(blob(r, [m.leaf, m.leaf2, m.leaf3][i % 3], w >= d ? t * w : ((i * 53) % 10 - 5) / 12 * w, r * 0.85, w >= d ? ((i * 53) % 10 - 5) / 12 * d : t * d, 1.1)); } break; }
      case 'bamboo': { const n = Math.round(d / 0.16); for (let i = 0; i < n; i++) { const z = -hd + (d / n) * (i + 0.5), x = ((i * 31) % 10 - 5) / 30, h = 2.4 + ((i * 17) % 10) / 12; g.add(cyl(0.018, h, m.leaf2, x, 0, z, 6)); g.add(blob(0.2, i % 2 ? m.leaf : m.leaf3, x, h - 0.2, z, 1.8)); g.add(blob(0.16, m.leaf2, x + 0.05, h * 0.6, z, 1.6)); } break; }
      case 'boulder': { const b = new T.Mesh(new T.DodecahedronGeometry(Math.min(w, d) / 2, 1), m.rock); b.scale.set(1, 0.6, d / w); b.position.y = Math.min(w, d) * 0.22; b.rotation.y = w * 7; b.castShadow = true; b.receiveShadow = true; g.add(b); break; }
      case 'stepstones': { const st = (x, z) => g.add(box(0.5, 0.04, 0.5, m.limeGrey, x, 0.0, z, false)); for (let x = -hw; x <= hw; x += 0.72) { st(x, hd - 0.1); if (Math.abs(x) > hw - 1.0) for (let z = -hd + 0.6; z < hd - 0.6; z += 0.72) st(x, z); } for (let x = -hw + 0.72; x < hw - 0.7; x += 0.72) st(x, -hd + 0.35); break; }
      case 'greenwall': { g.add(box(w, 2.5, d, m.dark, 0, 0, 0)); for (let r = 0; r < 7; r++) for (let c = 0; c < Math.round(d / 0.34); c++) if ((r + c) % 2 === 0) g.add(blob(0.17, (r + c) % 4 ? m.leaf : m.leaf2, hw + 0.06, 0.3 + r * 0.33, -hd + 0.17 + c * 0.34, 0.9)); break; }
      case 'planter': { g.add(box(w, 0.42, d, m.wall, 0, 0, 0)); const n = Math.max(2, Math.round(Math.max(w, d) / 0.34)), r = Math.min(w, d) * (f.dense ? 0.5 : 0.6); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n - 0.5; g.add(blob(r * (0.8 + ((i * 29) % 10) / 25), [m.leaf, m.leaf2, m.leaf3][i % 3], w >= d ? t * w : 0, 0.5 + ((i * 13) % 10) / 50, w >= d ? 0 : t * d, 1.15)); } break; }
      case 'vineplanter': { g.add(box(w, 0.4, d, m.wall, 0, 0, 0)); const n = Math.round(w / 0.26); for (let i = 0; i < n; i++) { const x = -hw + (w / n) * (i + 0.5); g.add(blob(0.2, i % 2 ? m.leaf : m.leaf2, x, 0.5, 0)); const len = 0.5 + ((i * 37) % 9) / 8; g.add(box(0.07, len, 0.06, i % 2 ? m.leaf3 : m.leaf, x + 0.04, -len + 0.1, (f.y < 0 ? -1 : 1) * (hd - 0.02), false)); } break; }
      case 'fins': { const n = Math.round(d / 0.2); for (let i = 0; i < n; i++) g.add(box(w * 0.9, H + SLAB, 0.045, m.fins, 0, -SLAB, -hd + (d / n) * (i + 0.5))); break; }
      case 'curtain': { const n = Math.max(4, Math.round(w / 0.14)); for (let i = 0; i < n; i++) g.add(box(w / n + 0.01, H - 0.1, 0.015, m.sheer, -hw + (w / n) * (i + 0.5), 0.03, i % 2 ? 0.03 : -0.03, false)); g.add(box(w, 0.04, 0.09, m.wall, 0, H - 0.05, 0, false)); break; }
      case 'floorlamp': { g.add(cyl(0.14, 0.02, m.dark, 0, 0, 0)); g.add(cyl(0.01, 1.48, m.brass, 0, 0, 0, 8)); const s = new T.Mesh(new T.CylinderGeometry(0.14, 0.19, 0.28, 28, 1, true), m.shade); s.position.y = 1.56; g.add(s); g.userData.light = { y: 1.45, color: '#FFD3A0', i: 2.2 }; break; }
      case 'mandir': {
        w = f.w; d = f.d; hw = w / 2; hd = d / 2; g.userData.rot = face === 'e' ? Math.PI : 0;       // built with its back on -x
        g.add(box(w, 0.75, d, m.ceramic, 0, 0, 0)); g.add(box(w + 0.04, 0.04, d + 0.04, m.marble, 0, 0.75, 0)); for (let i = 0; i < 3; i++) g.add(box(0.004, 0.7, d / 3 - 0.02, m.brass, hw + 0.001, 0.02, -hd + (d / 3) * (i + 0.5), false));
        g.add(box(0.03, 1.8, d, m.marble, -hw + 0.015, 0.79, 0)); for (let i = 0; i < 12; i++) g.add(cyl(0.035, 1.8, m.ceramic, -hw + 0.06, 0.79, -hd + 0.06 + i * ((d - 0.12) / 11), 10));
        for (const s of [-1, 1]) g.add(box(w, 1.8, 0.04, m.ceramic, 0, 0.79, s * (hd - 0.02)));
        g.add(box(w + 0.06, 0.1, d + 0.06, m.ceramic, 0, 2.59, 0)); g.add(box(w * 0.8, 0.012, d * 0.86, m.glow, 0, 2.578, 0, false));
        g.add(rbox(0.16, 0.36, 0.22, 0.05, m.brass, -0.03, 0.79, 0)); g.add(box(0.3, 0.03, 0.4, m.brass, 0.02, 0.79, 0));
        for (const s of [-1, 1]) { g.add(cyl(0.04, 0.02, m.brass, 0.12, 0.79, s * d * 0.3, 14)); g.add(cyl(0.012, 0.035, m.flame, 0.12, 0.81, s * d * 0.3, 8)); }
        const bell = new T.Group(); bell.userData.stay = true; bell.position.set(0.1, 1.75, 0); g.add(bell); if (!lite) useModel(bell, 'brass_diya_lantern', { h: 0.8 });
        g.userData.light = { y: 2.1, color: '#FFCF8A', i: 4 };
        break;
      }
      case 'onyx': {
        const hh = f.h || H, base = f.upper ? -(H + SLAB) : 0, total = f.upper ? hh + H + SLAB : hh;
        g.add(box(w, total, d, m.onyx, 0, base, 0)); for (let i = 1; i < 3; i++) g.add(box(0.008, total, d + 0.006, m.brass, -hw + (w / 3) * i, base, 0, false));
        g.add(box(w, 0.03, 0.05, m.glow, 0, base + total - 0.05, hd + 0.03, false)); g.add(box(w, 0.03, 0.05, m.glow, 0, base + 0.02, hd + 0.03, false));
        g.userData.light = { y: (f.upper ? 0 : total / 2) + 0.4, z: 0.9, color: '#FFD6A0', i: 6 };
        break;
      }
      case 'liftcar': {
        g.add(box(w, 0.04, d, m.steel, 0, 0, 0)); g.add(box(w, 2.2, 0.03, m.steel, 0, 0.04, -hd + 0.015)); for (const s of [-1, 1]) g.add(box(0.03, 2.2, d, m.steel, s * (hw - 0.015), 0.04, 0));
        g.add(box(w, 0.05, d, m.steel, 0, 2.24, 0)); g.add(box(w * 0.6, 0.012, d * 0.6, m.glow, 0, 2.228, 0, false)); g.add(box(w - 0.1, 0.03, 0.03, m.steel, 0, 0.95, -hd + 0.06, false));
        g.add(box(0.12, 0.3, 0.012, m.dark, hw - 0.12, 1.05, hd - 0.04, false)); for (let i = 0; i < 4; i++) g.add(box(0.03, 0.03, 0.004, m.glow, hw - 0.12, 1.1 + i * 0.06, hd - 0.032, false));
        for (let x = -hw + 0.06; x < -hw + 0.3; x += 0.045) g.add(box(0.01, 2.1, 0.01, m.steel, x, 0.05, hd, false));
        g.userData.light = { y: 2.0, color: '#FFE6C4', i: 1.5 };
        break;
      }
      case 'gate': for (let x = -hw; x <= hw; x += 0.1) g.add(box(0.035, 1.7, 0.05, m.dark, x, 0.05, 0)); g.add(box(w, 0.06, 0.07, m.dark, 0, 1.72, 0)); break;
      case 'verna': {
        const L = d, W = w, sh = new T.Shape();
        [[0, 0.28], [0.03, 0.58], [0.2, 0.7], [0.95, 0.78], [1.7, 0.86], [2.35, 1.4], [3.2, 1.44], [3.95, 1.04], [4.45, 0.98], [4.54, 0.7], [4.5, 0.28]].forEach(([z, y], i) => (i ? sh.lineTo(z, y) : sh.moveTo(z, y)));
        const body = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: W - 0.14, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 4 }), m.carPaint); body.rotation.y = Math.PI / 2; body.position.set(-(W - 0.14) / 2, 0, L / 2); body.castShadow = true; g.add(body);
        const gh = new T.Shape(); [[1.76, 0.9], [2.36, 1.39], [3.18, 1.42], [3.88, 1.06]].forEach(([z, y], i) => (i ? gh.lineTo(z, y) : gh.moveTo(z, y)));
        const gl = new T.Mesh(new T.ExtrudeGeometry(gh, { depth: W + 0.005, bevelEnabled: false }), m.carGlass); gl.rotation.y = Math.PI / 2; gl.position.set(-(W + 0.005) / 2, 0, L / 2); g.add(gl);
        g.add(box(W - 0.16, 0.025, 0.03, m.ledW, 0, 0.74, L / 2 + 0.045, false)); g.add(box(W - 0.1, 0.035, 0.03, m.ledR, 0, 0.93, -L / 2 - 0.04, false)); g.add(box(W * 0.6, 0.2, 0.03, m.carGlass, 0, 0.36, L / 2 + 0.05, false));
        for (const [a, zz] of [[-1, 1.37], [1, 1.37], [-1, -1.3], [1, -1.3]]) { const t = cyl(0.33, 0.22, m.tyre, 0, 0, 0, 32); t.rotation.z = Math.PI / 2; t.position.set(a * (W / 2 - 0.1), 0.33, zz); g.add(t); const r = cyl(0.2, 0.225, m.steel, 0, 0, 0, 20); r.rotation.z = Math.PI / 2; r.position.copy(t.position); g.add(r); }
        break;
      }
      case 'fountain': {
        w = f.w; d = f.d; hw = w / 2; hd = d / 2; g.userData.rot = face === 'e' ? Math.PI : 0;       // back on -x, in the shear-wall plane
        g.add(box(w, 0.42, d + 0.3, m.limeGrey, 0, 0, 0)); g.add(box(w - 0.14, 0.02, d + 0.16, m.water, 0.02, 0.37, 0, false));
        for (let i = 0; i < 14; i++) g.add(blob(0.05, m.rock, -hw + 0.16 + (i % 3) * 0.1, 0.4, -hd + 0.1 + i * (d / 14), 0.6));
        g.add(box(0.1, 2.55, d, m.kota, -hw + 0.05, 0.42, 0)); for (let i = 0; i < Math.round(d / 0.06); i++) g.add(box(0.012, 2.5, 0.022, m.water, -hw + 0.11, 0.44, -hd + 0.03 + i * 0.06, false));
        g.add(box(0.02, 0.03, d, m.glow, -hw + 0.13, 0.44, 0, false)); g.add(box(0.06, 0.05, d + 0.04, m.steel, -hw + 0.07, 2.97, 0));
        g.userData.light = { y: 0.9, z: 0, x: 0.3, color: '#FFD9A6', i: 5 };
        break;
      }
      case 'tankcover': g.add(box(w, 0.015, d, m.dark, 0, 0.001, 0, false)); break;
      case 'shearwall': { w = f.w; d = f.d; hw = w / 2; hd = d / 2; g.userData.rot = 0; const skip = [[0.6, 2.9]]; const n = Math.round(d / 0.09);
        for (let i = 0; i < n; i++) { const z = (d / n) * (i + 0.5); if (z > 0.62 && z < 2.88) continue; g.add(cyl(0.045, 3.0, m.sandstone, hw - 0.03, 0, -hd + z, 10)); } break; }
      case 'floatsteps': for (let i = 0; i < 3; i++) g.add(box(0.42, 0.06, d, m.limeGrey, -hw + 0.25 + i * 0.5, 0.0, 0, false)); break;
      case 'screen': {
        const c = document.createElement('canvas'); c.width = 512; c.height = 288; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 288);
        gr.addColorStop(0, '#f3b572'); gr.addColorStop(0.55, '#e98d6a'); gr.addColorStop(0.56, '#3d5f7a'); gr.addColorStop(1, '#16283a'); x.fillStyle = gr; x.fillRect(0, 0, 512, 288);
        x.fillStyle = '#ffe9c2'; x.beginPath(); x.arc(256, 150, 34, 0, 7); x.fill(); x.fillStyle = '#22384c'; x.beginPath(); x.moveTo(0, 162); x.lineTo(120, 120); x.lineTo(210, 160); x.lineTo(330, 110); x.lineTo(512, 162); x.fill();
        const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; g.add(box(w + 0.1, 1.6, 0.03, m.dark, 0, 0.75, 0)); const s = new T.Mesh(new T.PlaneGeometry(w, 1.46), new T.MeshBasicMaterial({ map: tex })); s.position.set(0, 1.55, 0.02); s.userData.keep = true; g.add(s);
        break;
      }
      case 'pitbench': g.add(box(w, 0.4, d, m.limeYellow, 0, 0, 0)); g.add(rbox(w - 0.04, 0.12, d - 0.12, 0.04, m.fabric, 0, 0.4, 0.05)); g.add(rbox(w - 0.04, 0.36, 0.16, 0.06, m.fabric, 0, 0.46, -hd + 0.1)); g.add(rbox(0.36, 0.3, 0.12, 0.05, m.sage, -hw * 0.5, 0.56, -hd + 0.24)); break;
      case 'firetable': g.add(box(w, 0.34, d, m.limeGrey, 0, 0, 0)); g.add(box(w - 0.24, 0.02, d - 0.24, m.dark, 0, 0.34, 0, false)); for (let i = 0; i < 6; i++) { const fl = new T.Mesh(new T.ConeGeometry(0.05, 0.2 + (i % 3) * 0.05, 8), m.flame); fl.position.set(-w * 0.3 + i * (w * 0.12), 0.46, 0); g.add(fl); } g.userData.light = { y: 0.8, color: '#FFAE60', i: 6 }; break;
      case 'pitsteps': g.add(box(w, 0.15, d, m.deck, 0, 0, 0)); g.add(box(w, 0.3, d / 2, m.deck, 0, 0, -d / 4)); break;
      case 'skylight': g.add(box(w + 0.24, 0.3, 0.12, m.wall, 0, 0, -hd)); g.add(box(w + 0.24, 0.3, 0.12, m.wall, 0, 0, hd)); g.add(box(0.12, 0.3, d, m.wall, -hw, 0, 0)); g.add(box(0.12, 0.3, d, m.wall, hw, 0, 0)); g.add(box(w, 0.02, d, m.glass, 0, 0.3, 0, false)); break;
      case 'pergola': {
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.1, 2.6, 0.1, m.fins, a * (hw - 0.05), 0, b * (hd - 0.05)));
        for (const s of [-1, 1]) g.add(box(w, 0.16, 0.1, m.fins, 0, 2.6, s * (hd - 0.05))); for (let x = -hw + 0.1; x < hw; x += 0.2) g.add(box(0.045, 0.12, d, m.fins, x, 2.62, 0));
        g.add(box(w - 0.3, 0.015, 0.04, m.glow, 0, 2.59, -hd + 0.12, false)); g.userData.light = { y: 2.3, color: '#FFD6A0', i: 5 }; break;
      }
      case 'poolflush': {
        // sunk below the terrace slab: water level with the deck, basin hangs under the slab
        const dep = f.depth || 0.9, co = 0.16;
        for (const s of [-1, 1]) { g.add(box(w, 0.05, co, m.marble, 0, -0.045, s * (hd - co / 2), false)); g.add(box(co, 0.05, d - co * 2, m.marble, s * (hw - co / 2), -0.045, 0, false)); }
        const wt = new T.Mesh(new T.PlaneGeometry(w - co * 2, d - co * 2), m.water); wt.rotation.x = -Math.PI / 2; wt.position.y = -0.06; wt.userData.keep = true; g.add(wt);
        g.add(box(w - co * 2, 0.05, d - co * 2, m.poolTile, 0, -dep - 0.05, 0, false));
        for (const s of [-1, 1]) { g.add(box(w - co * 2, dep, 0.05, m.poolTile, 0, -dep, s * (hd - co), false)); g.add(box(0.05, dep, d - co * 2, m.poolTile, s * (hw - co), -dep, 0, false)); }
        g.add(box(0.5, 0.3, d - co * 2, m.poolTile, -hw + co + 0.25, -dep, 0, false));                       // one sunken step on the west
        g.add(box(w + 0.1, dep + 0.25, d + 0.1, m.wall, 0, -dep - 0.3, 0)); g.children[g.children.length - 1].userData.under = true;
        g.add(box(w - 0.6, 0.02, 0.03, m.glow, 0, -0.4, -hd + co + 0.03, false)); g.userData.light = { y: -0.3, color: '#BFEFFF', i: 5 };
        break;
      }
      case 'tank': g.add(cyl(w / 2, 1.1, m.pot, 0, f.onRoof ? H + 0.45 : 0, 0, 24)); break;
      default: g.add(box(w, 0.5, d, m.fabric, 0, 0, 0));
    }
    g.rotation.y = g.userData.rot !== undefined ? g.userData.rot : ROT[face];
    g.position.set(f.x + f.w / 2, f.base || 0, f.y + f.d / 2);
    return g;
  }

  /* ============================ walls ============================ */
  let DOORS = null;
  function buildWall(wl, floor, parent, col) {
    const [x1, y1, x2, y2, t = 'w', o = {}] = wl, m = mats();
    const len = Math.hypot(x2 - x1, y2 - y1); if (len < 0.02) return;
    const g = new T.Group();
    const ext = floor.id !== 'g' && (x1 === x2 ? (x1 <= 0.001 || x1 >= floor.w - 0.001) : (y1 <= 0.001 || y1 >= floor.h - 0.001));
    const th = ext || t === 'c' ? 0.2 : 0.12, hh = o.hh || H;
    // black slim frames, tall clear panes — as in the exterior render
    const glaze = (y0, hgt, pane) => {
      g.add(box(len, hgt, 0.012, m.glass, 0, y0, 0, false));
      g.add(box(len, 0.06, 0.08, m.frame, 0, y0, 0, false)); g.add(box(len, 0.06, 0.08, m.frame, 0, y0 + hgt - 0.06, 0, false));
      const n = Math.max(1, Math.round(len / pane));
      for (let i = 0; i <= n; i++) g.add(box(i === 0 || i === n ? 0.06 : 0.04, hgt, 0.08, m.frame, -len / 2 + (len / n) * i, y0, 0, false));
      if (hgt > 3.2) g.add(box(len, 0.3, 0.1, m.wall, 0, H, 0, false));
    };
    if (t === 'w') { g.add(box(len + (ext ? th : 0), hh, th, m.wall, 0, 0, 0)); if (!ext && floor.id !== 'g') { g.add(box(len, 0.08, th + 0.02, m.lacquer, 0, 0, 0, false)); } }
    else if (t === 'g') glaze(0, hh, 1.5);
    else if (t === 'gp') { g.add(box(len, H, 0.012, m.glass, 0, 0, 0, false)); g.add(box(len, 0.03, 0.04, m.frame, 0, H - 0.03, 0, false)); }
    else if (t === 'win') { const s = o.s || 0.9, hd = o.h || 2.4; g.add(box(len, s, th, m.wall, 0, 0, 0)); g.add(box(len, H - hd, th, m.wall, 0, hd, 0)); glaze(s, hd - s, 1.3); g.add(box(len, 0.03, th + 0.06, m.marble, 0, s - 0.03, 0, false)); }
    else if (t === 'd') { g.add(box(len, H - 2.15, th, m.wall, 0, 2.15, 0)); if (len < 1.3 && floor.id !== 'g' && !(floor.openAir && floor.id === 't' && x1 === 1.38)) { for (const s of [-1, 1]) g.add(box(0.05, 2.15, th + 0.04, m.wood, s * (len / 2 - 0.025), 0, 0, false)); g.add(box(len, 0.05, th + 0.04, m.wood, 0, 2.1, 0, false));
      const pv = new T.Group(), lw = len - 0.12; pv.position.set(-len / 2 + 0.06, 0, 0); pv.userData.keep = true;
      pv.add(box(lw, 2.08, 0.04, m.wood, lw / 2, 0.01, 0)); for (const s of [-1, 1]) pv.add(box(0.02, 0.02, 0.14, m.brass, lw - 0.08, 1.02, s * 0.04, false));
      const openA = Math.PI / 2 * 0.92; pv.rotation.y = openA; pv.userData.door = { open: true, openA, target: openA, seg: { x1, y1, x2, y2, r: 0.05 } }; g.add(pv); if (DOORS) DOORS.push(pv); } }
    else if (t === 'r') { g.add(box(len, 1.05, 0.016, m.glass, 0, 0.02, 0, false)); g.add(box(len, 0.035, 0.05, m.frame, 0, 1.07, 0, false)); g.add(box(len, 0.04, 0.05, m.frame, 0, 0, 0, false)); }
    else if (t === 'c') { g.add(box(len, 1.25, th, m.wall, 0, 0, 0)); for (let x = -len / 2 + 0.1; x < len / 2; x += 0.14) g.add(box(0.03, 0.6, 0.05, m.fins, x, 1.25, 0, false)); g.add(box(len, 0.04, 0.07, m.fins, 0, 1.85, 0, false)); }
    else if (t === 'j' || t === 'jd') { if (t === 'j') { for (let x = -len / 2 + 0.03; x < len / 2; x += 0.075) g.add(box(0.03, H - 0.1, 0.06, m.fins, x, 0.04, 0)); g.add(box(len, 0.04, 0.08, m.fins, 0, 0, 0)); } g.add(box(len, 0.06, 0.08, m.fins, 0, H - 0.06, 0)); }
    g.position.set((x1 + x2) / 2, 0, (y1 + y2) / 2); g.rotation.y = -Math.atan2(y2 - y1, x2 - x1); parent.add(g);
    if (t !== 'd' && t !== 'jd') col.push({ x1, y1, x2, y2, r: th / 2 + 0.02 });
  }

  /* ============================ stairs (dog-leg, generated from the stair room) ============================ */
  function buildStairs(parent, R, floor, col) {
    const m = mats(), [x0, y0, x1, y1] = R, mid = (x0 + x1) / 2, LD = 1.0, n = 10, run = (y1 - y0 - LD) / n, lvl = floor.level;
    const up = lvl < 4, down = lvl > 0, F = lvl === 0 ? 3.3 : 3.2, Fd = lvl === 1 ? 3.3 : 3.2, wa = mid - x0 - 0.05, g = new T.Group();
    /** one flight: rises from yLow to yHigh; dir +1 = rising northwards (toward y0), -1 = rising southwards */
    const flight = (xc, dir, base, total) => {
      const rise = total / n, zS = dir > 0 ? y1 : y0 + LD;
      for (let i = 0; i < n; i++) { const z = dir > 0 ? y1 - run * (i + 0.5) : y0 + LD + run * (i + 0.5), top = base + rise * (i + 1);
        g.add(box(wa, 0.04, run + 0.03, m.kota, xc, top - 0.04, z + (dir > 0 ? 0.015 : -0.015))); g.add(box(wa, rise - 0.04, 0.02, m.wall, xc, top - rise, z + (dir > 0 ? run / 2 - 0.01 : -run / 2 + 0.01))); }
      const L = Math.hypot(run * n, total), ang = Math.atan2(total, run * n);
      const waist = box(wa, 0.16, L, m.wall, xc, 0, 0); waist.position.set(xc, base + total / 2 - 0.2, (y0 + LD + y1) / 2); waist.rotation.x = dir > 0 ? ang : -ang; g.add(waist);
      const rail = box(0.04, 0.05, L, m.wood, 0, 0, 0); rail.position.set(mid + (xc < mid ? -0.045 : 0.045), base + total / 2 + 0.92, (y0 + LD + y1) / 2); rail.rotation.x = dir > 0 ? ang : -ang; g.add(rail);
      for (let i = 0; i <= n; i += 2) { const z = dir > 0 ? y1 - run * i : y0 + LD + run * i; g.add(box(0.016, 0.9, 0.016, m.frame, rail.position.x, base + (total / n) * i, Math.min(y1 - 0.02, Math.max(y0 + LD + 0.02, z)), false)); }
    };
    if (up) { flight(x0 + 0.02 + wa / 2, 1, 0, F / 2); g.add(box(x1 - x0 - 0.04, 0.16, LD, m.wall, mid, F / 2 - 0.16, y0 + LD / 2)); g.add(box(x1 - x0 - 0.04, 0.03, LD, m.kota, mid, F / 2, y0 + LD / 2)); flight(x1 - 0.02 - wa / 2, -1, F / 2, F / 2); }
    if (down) { flight(x1 - 0.02 - wa / 2, -1, -Fd / 2, Fd / 2); g.add(box(x1 - x0 - 0.04, 0.16, LD, m.wall, mid, -Fd / 2 - 0.16, y0 + LD / 2)); g.add(box(x1 - x0 - 0.04, 0.03, LD, m.kota, mid, -Fd / 2, y0 + LD / 2));
      g.add(box(0.03, 1.0, y1 - y0 - LD, m.glass, mid, 0.02, (y0 + LD + y1) / 2, false)); g.add(box(0.05, 0.04, y1 - y0 - LD, m.wood, mid, 1.02, (y0 + LD + y1) / 2, false));
      if (!up) { g.add(box(x1 - mid, 1.0, 0.03, m.glass, (mid + x1) / 2, 0.02, y0 + LD, false)); g.add(box(x1 - mid, 0.04, 0.05, m.wood, (mid + x1) / 2, 1.02, y0 + LD, false)); } }
    parent.add(g);
    col.push({ x1: x0, y1: y1 - 0.05, x2: x1, y2: y1 - 0.05, r: 0.06 });
    return { hole: down ? [mid, y0 + LD, x1 - 0.01, y1 - 0.01] : null, upHole: up ? [x0 + 0.01, y0 + 0.01, x1 - 0.01, y1 - 0.01] : null };
  }

  /* ============================ one level ============================ */
  function buildLevel(floor, opt = {}) {
    const m = mats(), shell = !!opt.shell, group = new T.Group(), ceil = new T.Group(), stat = new T.Group();
    const out = { group, ceil, col: [], boxes: [], roomMeshes: [], hl: {}, items: [], lights: [], floor, doors: [] }; DOORS = shell ? null : out.doors;
    ceil.userData.keep = true; group.add(stat);
    const matFor = (k) => ({ wet: m.kota, core: m.marble, stair: m.kota, bal: m.kotaGreen, out: m.limeYellow, pave: m.limeGrey, lawn: m.grass, pit: m.deck, terr: m.terr })[k] || m.marble;
    const E = floor.id === 'g' ? 0 : 0.45;                                // the 0.45 m elevation feature all round
    const outline = rectPts([-E, -E, floor.w + E, floor.h + E]);

    // stairs first (they define floor / ceiling openings)
    let st = null; const sr = floor.rooms.find((r) => r.kind === 'stair');
    if (sr) st = buildStairs(stat, sr.stairR || sr.r, floor, out.col);

    const holes = [...(floor.slabHoles || []), ...(floor.voidR ? [floor.voidR] : []), ...(st && st.hole ? [st.hole] : [])];
    stat.add(slab(outline, holes, m.wall, -0.004, floor.id === 'g' ? 0.7 : SLAB));

    for (const r of floor.rooms) {
      const pts = roomPts(r);
      const hit = (y) => { const h = flat(pts, null, m.hl.clone(), y); h.userData.keep = true; h.userData.roomId = r.id; h.renderOrder = 2; group.add(h); out.roomMeshes.push(h); out.hl[r.id] = h; };
      if (r.kind === 'void') { stat.add(flat(pts, null, m.marble, -(H + SLAB), 1.8)); hit(0.012); continue; }
      if (r.kind === 'pool') { hit(-0.05); continue; }
      const rh = [...(r.holes || []), ...(r.kind === 'stair' && st && st.hole ? [st.hole] : [])];
      const y = r.kind === 'pit' ? -0.45 : 0.002;
      stat.add(flat(pts, rh, matFor(r.kind), y)); hit(y + 0.012);
      if (r.kind === 'pit') { const [a, b, c, d] = r.r; for (const [p, q, s, t] of [[a, b, c, b], [c, b, c, d], [c, d, a, d], [a, d, a, b]]) { const wl = box(Math.hypot(s - p, t - q), 0.45, 0.04, m.limeYellow, (p + s) / 2, -0.45, (q + t) / 2); wl.rotation.y = -Math.atan2(t - q, s - p); stat.add(wl); } }
    }
    for (const wl of floor.walls) buildWall(wl, floor, stat, out.col);

    if (floor.dbl) { const [a, b, c, d] = floor.dbl; stat.add(box(0.12, 5.8 - H, d - b, m.wall, a, H, (b + d) / 2)); stat.add(box(0.016, 1.0, d - b - 0.2, m.glass, a + 0.07, H + SLAB + 0.05, (b + d) / 2, false)); }
    if (floor.voidR) { const [a, b, c, d] = floor.voidR, D = H + SLAB;
      stat.add(box(c - a, D, 0.012, m.glass, (a + c) / 2, -D, b, false)); stat.add(box(0.012, D, d - b, m.glass, c, -D, (b + d) / 2, false)); stat.add(box(0.12, D, d - b, m.wall, a, -D, (b + d) / 2));
      for (let i = 0; i <= 2; i++) stat.add(box(0.05, D, 0.08, m.frame, a + ((c - a) / 2) * i, -D, b, false));
      stat.add(rbox(0.78, 0.5, 0.78, 0.1, m.linen, a + 1.0, -D + 0.1, b + 0.85)); stat.add(rbox(0.78, 0.5, 0.78, 0.1, m.linen, a + 2.4, -D + 0.1, b + 0.85)); stat.add(box(2.6, 0.012, 1.5, m.rug, (a + c) / 2, -D + 0.004, b + 1.05, false)); }
    (floor.columns || []).forEach(([x, y]) => { stat.add(box(0.3, 3.0, 0.58, m.limeGrey, x + 0.15, 0, y + 0.29)); out.boxes.push({ x1: x, y1: y, x2: x + 0.3, y2: y + 0.58, fixed: true }); });

    // ceilings / soffits (skipped for the stacked exterior, where the next slab is the ceiling)
    if (!shell) {
      if (!floor.openAir) {
        const ch = [...(floor.dbl ? [floor.dbl] : []), ...(floor.voidR ? [floor.voidR] : []), ...(floor.skylight ? [floor.skylight] : []), ...(st && st.upHole ? [st.upHole] : [])];
        ceil.add(slab(outline, ch, m.ceiling, H + SLAB, SLAB));
        if (floor.dbl) ceil.add(slab(rectPts(floor.dbl), null, m.ceiling, 5.8 + SLAB, SLAB));
        if (floor.voidR) ceil.add(slab(rectPts(floor.voidR), null, m.ceiling, H + SLAB, SLAB));
        if (floor.skylight) { const s = floor.skylight; ceil.add(box(s[2] - s[0], 0.02, s[3] - s[1], m.glass, (s[0] + s[2]) / 2, H + SLAB - 0.02, (s[1] + s[3]) / 2, false)); }
      } else if (floor.roof) {
        const yy = floor.id === 'g' ? 3.0 : H;
        ceil.add(slab(rectPts(floor.roof), st && st.upHole ? [st.upHole] : null, floor.id === 'g' ? m.ceiling : m.wall, yy + SLAB, SLAB));
        if (floor.id === 'g') { ceil.add(box(3.6, 0.04, 3.2, m.soffit, 3.3, 2.96, 12.5, false)); for (let i = 0; i < 8; i++) ceil.add(box(3.6, 0.05, 0.05, m.soffit, 3.3, 2.91, 11.1 + i * 0.4, false)); }
      }
    } else if (floor.id === 't' && floor.roof) stat.add(slab(rectPts(floor.roof), null, m.wall, H + SLAB, SLAB));

    // lighting: warm downlights (2700–3000K) + cove strips
    const lit = shell ? stat : ceil;
    for (const r of floor.rooms) {
      if (['void', 'lawn', 'pool'].includes(r.kind)) continue;
      const [a, b, c, d] = bbox(roomPts(r)), cx = (a + c) / 2, cy = (b + d) / 2;
      if (floor.openAir && !(floor.roof && cx > floor.roof[0] && cx < floor.roof[2] && cy > floor.roof[1] && cy < floor.roof[3])) continue;
      const yy = floor.id === 'g' ? 2.98 : H - 0.01, big = (c - a) * (d - b) > 9;
      const spots = shell ? (big ? [[cx, cy]] : []) : big ? [[cx, b + (d - b) * 0.27], [cx, b + (d - b) * 0.73]] : [[cx, cy]];
      for (const [x, z] of spots) {
        if (!shell) for (const [ox, oz] of [[-0.5, 0], [0.5, 0]]) { const disc = new T.Mesh(new T.CircleGeometry(0.045, 16), m.glow); disc.rotation.x = Math.PI / 2; disc.position.set(x + ox, yy - 0.002, z + oz); lit.add(disc); }
        const pl = new T.PointLight('#FFD3A0', 1, 8, 1.8); pl.position.set(x, yy - 0.4, z); pl.userData.base = big ? 5 : 3; group.add(pl); out.lights.push(pl);
      }
      if (!shell && r.kind === '' && !floor.openAir && (c - a) > 2.2) { lit.add(box(c - a - 0.5, 0.015, 0.04, m.glow, cx, H - 0.05, b + 0.13, false)); lit.add(box(c - a - 0.5, 0.015, 0.04, m.glow, cx, H - 0.05, d - 0.13, false)); }
      if (!shell && r.kind === '' && (c - a) * (d - b) > 6 && !floor.openAir) lit.add(box(0.62, 0.035, 0.62, m.lacquer, cx + 0.9, H - 0.04, cy, false));
    }
    group.add(ceil);

    // furniture
    const list = opt.furn || floor.furn;
    list.forEach((f, i) => {
      if (shell && !FACADE.has(f.t)) return;
      const g = buildFurn(f, { shell }); if (!g) return;
      const movable = !shell && (MOVABLE.has(f.t) || f.added);
      g.userData = { ...g.userData, f, idx: f.idx !== undefined ? f.idx : i, movable };
      if (g.userData.light && (!shell || ['onyx', 'firetable', 'poolflush', 'pergola', 'fountain'].includes(f.t))) { const L = g.userData.light; const pl = new T.PointLight(L.color, 1, 7, 1.8); pl.position.set(L.x || 0, L.y, L.z || 0); pl.userData.base = L.i; pl.userData.accent = true; g.add(pl); out.lights.push(pl); }
      if (movable) { g.userData.keep = true; g.traverse((o) => { o.userData.item = g; }); group.add(g); out.items.push(g); } else stat.add(g);
      if (!NOCOLLIDE.has(f.t) && !(f.base < 0 && f.t !== 'pitbench')) { const b = { x1: f.x, y1: f.y, x2: f.x + f.w, y2: f.y + f.d, item: g, t: f.t }; g.userData.box = b; out.boxes.push(b); }
    });
    mergeStatic(stat); mergeStatic(ceil);
    return out;
  }

  /* ============================ the site around the house ============================ */
  function buildSite() {
    const m = mats(), g = new T.Group(), s = new T.Group(); g.add(s);
    const rnd = (() => { let a = 1337; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
    const gm = m.grass.clone(); gm.color = new T.Color('#8EA070'); gm.userData = { tile: 2.4 };
    const ground = new T.Mesh(new T.CircleGeometry(125, 72), gm); { const uv = ground.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 90, uv.getY(i) * 90); }
    ground.rotation.x = -Math.PI / 2; ground.position.set(4.9, -0.06, 9.5); ground.receiveShadow = true; ground.userData.keep = true; g.add(ground);
    const sync = () => { gm.map = m.grass.map; gm.normalMap = m.grass.normalMap; gm.needsUpdate = true; }; setTimeout(sync, 1500); setTimeout(sync, 6000);
    // road + footpath on the north
    s.add(box(140, 0.06, 6.5, m.asphalt, 5, -0.08, -4.4, false)); s.add(box(140, 0.1, 1.1, m.paver, 5, -0.08, -0.6, false)); s.add(box(140, 0.1, 1.1, m.paver, 5, -0.08, -8.2, false));
    for (let x = -64; x < 70; x += 6) s.add(box(2.4, 0.005, 0.12, m.ceramic, x, -0.018, -4.4, false));
    // neighbouring villas
    // a modern G+2 / G+3 villa on a neighbouring plot, front to the road (north), in the same restrained language
    const villa = (x, z, w, d, fl, k) => { const v = new T.Group(), S = 3.0, F = 3.1, top = S + fl * F, body = k % 3 === 1 ? m.villa2 : m.villa, side = k % 2 ? 1 : -1;
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1]]) v.add(box(0.35, S, 0.45, m.villa, a * (w / 2 - 0.4), 0, b * (d / 2 - 0.5)));            // stilt columns
      v.add(box(w - 1.2, S - 0.2, d - 3, m.dark, 0, 0, 0.6));                                                                                  // shaded stilt core
      v.add(box(w, fl * F, d, body, 0, S, 0));
      for (let f = 0; f <= fl; f++) v.add(box(w + 0.5, 0.22, d + 0.5, m.villa, 0, S + f * F - 0.11, 0));                                         // slab bands
      for (let f = 0; f < fl; f++) { const y = S + f * F + 0.2;
        v.add(box(w * 0.58, 2.5, 0.05, m.villaGlass, -side * w * 0.12, y, -d / 2 - 0.02));                                                       // front glazing
        for (let i = 0; i <= 3; i++) v.add(box(0.05, 2.5, 0.07, m.frame, -side * w * 0.12 - w * 0.29 + (w * 0.58 / 3) * i, y, -d / 2 - 0.04, false));
        v.add(box(0.05, 1.3, d * 0.42, m.villaGlass, (w / 2 + 0.02) * side, y + 0.7, -d * 0.1)); v.add(box(0.05, 1.3, d * 0.3, m.villaGlass, -(w / 2 + 0.02) * side, y + 0.7, d * 0.18)); }
      for (let i = 0; i < 7; i++) v.add(box(0.05, fl * F, 0.32, m.fins, side * (w / 2 - 0.25 - i * 0.2), S, -d / 2 - 0.2));                       // timber fins
      if (k % 2 === 0) v.add(box(w * 0.22, fl * F, 0.06, m.cladding, side * w * 0.36, S, -d / 2 - 0.04));                                       // stone panel
      v.add(box(w, 1.05, 0.02, m.glass, 0, top + 0.12, -d / 2 + 0.05, false)); v.add(box(0.02, 1.05, d, m.glass, -w / 2 + 0.05, top + 0.12, 0, false)); v.add(box(0.02, 1.05, d, m.glass, w / 2 - 0.05, top + 0.12, 0, false));
      v.add(box(w * 0.4, 2.6, d * 0.32, body, side * w * 0.2, top, d * 0.12));                                                                  // stair mumty
      const cw = w + 3; v.add(box(cw, 1.25, 0.2, m.wall, 0, 0, -d / 2 - 4.2)); for (let q = -cw / 2 + 0.1; q < cw / 2; q += 0.14) v.add(box(0.03, 0.55, 0.05, m.fins, q, 1.25, -d / 2 - 4.2, false));
      v.add(box(3.2, 1.7, 0.06, m.dark, side * (cw / 2 - 1.8), 0.02, -d / 2 - 4.3));                                                             // gate
      v.add(box(cw, 0.04, d + 8, m.paver, 0, -0.03, 0, false));                                                                                   // plot paving
      v.position.set(x, 0, z); s.add(v); };

    // the society: neighbouring plotted villas on both sides and across the road (club side to the south stays open)
    villa(-4.875, 10.5, 6.75, 13, 2, 0); villa(-14.625, 10.5, 6.75, 13, 3, 1); villa(-24.375, 10.5, 6.75, 13, 2, 2); villa(14.625, 10.5, 6.75, 13, 3, 3); villa(24.375, 10.5, 6.75, 13, 2, 4); villa(34.125, 10.5, 6.75, 13, 3, 5);
    // trees
    const tree = (x, z, sc) => { const t = new T.Group(); t.add(cyl(0.12 * sc, 2.2 * sc, m.trunk, 0, 0, 0, 8, 0.07 * sc));
      for (let i = 0; i < 5; i++) t.add(blob((0.9 + rnd() * 0.7) * sc, [m.leaf, m.leaf2, m.leaf3][i % 3], (rnd() - 0.5) * 1.6 * sc, (2.6 + rnd() * 1.6) * sc, (rnd() - 0.5) * 1.6 * sc, 0.85)); t.position.set(x, 0, z); t.rotation.y = rnd() * 6; s.add(t); };



    // the Khopoli hills
    const ridge = (R, hMax, mat, seed) => { const seg = 96, pos = [], idx = []; let a = seed; const r2 = () => ((a = (a * 16807) % 2147483647) / 2147483647); const hs = []; for (let i = 0; i <= seg; i++) hs.push(hMax * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.37 + seed) * Math.cos(i * 0.13 + seed * 2))) * (0.75 + r2() * 0.5)); hs[seg] = hs[0];
      for (let i = 0; i <= seg; i++) { const t = (i / seg) * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t); pos.push(c * (R + 90), -2, sn * (R + 90), c * R, hs[i], sn * R, c * (R - 70), -2, sn * (R - 70)); }
      for (let i = 0; i < seg; i++) { const k = i * 3; idx.push(k, k + 1, k + 3, k + 1, k + 4, k + 3, k + 1, k + 2, k + 4, k + 2, k + 5, k + 4); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); const me = new T.Mesh(geo, mat); me.position.set(4.9, 0, 9.5); me.userData.keep = true; g.add(me); };

    // plot seen from above (used when you are on an upper floor)
    const lite = new T.Group(); lite.userData.keep = true;
    lite.add(box(9.75, 0.05, 5.75, m.limeGrey, 4.875, -0.03, 2.875, false)); lite.add(box(9.75, 0.05, 13.25, m.grass, 4.875, -0.03, 12.375, false));
    for (const [x, z, w, d] of [[4.875, 0, 9.75, 0.2], [4.875, 19, 9.75, 0.2], [0, 9.5, 0.2, 19], [9.75, 9.5, 0.2, 19]]) lite.add(box(w, 1.3, d, m.wall, x, 0, z));
    for (let i = 0; i < 9; i++) lite.add(blob(0.5 + rnd() * 0.3, [m.leaf, m.leaf2, m.leaf3][i % 3], 0.8 + rnd() * 8, 0.5, 15 + rnd() * 3.4, 1.1));
    mergeStatic(lite); g.add(lite);
    mergeStatic(s);
    g.position.set(-4.875, 0, -9.5);
    return { group: g, plotLite: lite, groundMat: gm };
  }

  window.B4 = { T, H, SLAB, ROT, MOVABLE, NOCOLLIDE, mats, applyTheme, THEME: () => THEME, PRESETS, FLOORS_T, buildLevel, buildFurn, buildSite, roomPts, bbox, box, setAniso: (a) => { maxAniso = a; } };
})();
