/* B4 — real-time 3D world: dollhouse view, walk-inside view, movable furniture, day/night.
   Uses window.THREE + window.ADDONS (set by the module bootstrap in index.html). */
(function () {
  const T = window.THREE, AD = window.ADDONS;
  const H = 2.9, EYE = 1.6;
  const ROT = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 };
  const MOVABLE = new Set(['bed', 'nightstand', 'armchair', 'lounge', 'sofa', 'coffee', 'rug', 'dining', 'stool', 'chair', 'desk', 'bench', 'plant', 'floorlamp', 'sidetable', 'lounger', 'aasan', 'verna', 'boulder']);
  const NOCOLLIDE = new Set(['rug', 'aasan', 'curtain', 'stepstones', 'tankcover', 'vineplanter', 'fins', 'screen', 'pergola', 'tank', 'pitsteps', 'floatsteps', 'shearwall', 'gate', 'oshower']);
  const roomPts = (r) => r.poly || [[r.r[0], r.r[1]], [r.r[2], r.r[1]], [r.r[2], r.r[3]], [r.r[0], r.r[3]]];
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ============================ textures + materials ============================ */
  const TL = new T.TextureLoader();
  const texCache = {};
  function setMap(mat, prop, file, srgb, rep) {
    const key = file + '|' + (rep || 1);
    if (!texCache[key]) texCache[key] = new Promise((res) => TL.load('assets/tex/' + file, (t) => {
      t.wrapS = t.wrapT = T.RepeatWrapping; if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; if (rep) t.repeat.set(rep, rep); res(t);
    }, undefined, () => res(null)));
    texCache[key].then((t) => { if (t) { mat[prop] = t; mat.needsUpdate = true; } });
  }
  let M = null;
  function mats() {
    if (M) return M;
    const std = (color, o = {}) => new T.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o });
    const tx = (color, o, maps, tile, rep) => {
      const m = std(color, o); m.userData.tile = tile;
      if (maps.c) setMap(m, 'map', maps.c, true, rep); if (maps.n) setMap(m, 'normalMap', maps.n, false, rep); if (maps.r) setMap(m, 'roughnessMap', maps.r, false, rep);
      return m;
    };
    M = {
      marble: tx('#EADBC2', { roughness: 0.32 }, { c: 'marble_c.jpg', n: 'marble_n.jpg' }, 1.8),
      wall: tx('#F4F0E8', { roughness: 0.93 }, { n: 'plaster_n.jpg' }, 2.2),
      ceiling: std('#FAF8F4', { roughness: 1 }),
      kota: tx('#8C7460', { roughness: 0.62 }, { c: 'stone_c.jpg', n: 'stone_n.jpg' }, 1.2),
      kotaPol: tx('#94806C', { roughness: 0.28 }, { c: 'stone_c.jpg' }, 1.2),
      kotaGreen: tx('#8B9B8E', { roughness: 0.85 }, { c: 'stone_c.jpg', n: 'stone_n.jpg' }, 1.2),
      limeGrey: tx('#A4A39D', { roughness: 0.9 }, { c: 'stone_c.jpg', n: 'stone_n.jpg' }, 1.2),
      limeYellow: tx('#DCC89C', { roughness: 0.9 }, { c: 'stone_c.jpg', n: 'stone_n.jpg' }, 1.5),
      sandstone: tx('#DDBBA2', { roughness: 0.9 }, { n: 'stone_n.jpg' }, 1),
      terr: tx('#D9CDB8', { roughness: 0.8 }, { c: 'stone_c.jpg', n: 'stone_n.jpg' }, 1.4),
      wood: tx('#E3C39C', { roughness: 0.6 }, { c: 'wood_c.jpg', n: 'wood_n.jpg' }, 1.2),
      deck: tx('#C99B6E', { roughness: 0.7 }, { c: 'wood_c.jpg', n: 'wood_n.jpg' }, 1.0),
      fabric: tx('#E9E2D6', { roughness: 1 }, { c: 'fabric_c.jpg', n: 'fabric_n.jpg' }, 0.5, 3),
      fabricDark: tx('#A99E90', { roughness: 1 }, { c: 'fabric_c.jpg', n: 'fabric_n.jpg' }, 0.5, 3),
      linen: tx('#F5F1EA', { roughness: 1 }, { n: 'linen_n.jpg' }, 0.6, 2),
      sage: tx('#8F9A86', { roughness: 1 }, { n: 'linen_n.jpg' }, 0.6, 2),
      rug: tx('#DDD3C4', { roughness: 1 }, { c: 'fabric_c.jpg', n: 'linen_n.jpg' }, 0.6),
      grass: tx('#B9C99A', { roughness: 1 }, { c: 'grass_c.jpg', n: 'grass_n.jpg' }, 1.6),
      granite: tx('#3a3a3c', { roughness: 0.16 }, { c: 'granite_c.jpg' }, 1),
      lacquer: std('#F4F1EB', { roughness: 0.35 }),
      olive: std('#70745F', { roughness: 0.5 }),
      fins: std('#B9AC9B', { roughness: 0.45, metalness: 0.55 }),
      frame: std('#8D9095', { roughness: 0.4, metalness: 0.7 }),
      steel: std('#C9CBCD', { roughness: 0.3, metalness: 0.9 }),
      brass: std('#C2A468', { roughness: 0.35, metalness: 0.8 }),
      dark: std('#2b2a28', { roughness: 0.5, metalness: 0.3 }),
      ceramic: std('#FFFFFF', { roughness: 0.15 }),
      mirror: std('#EEF2F3', { roughness: 0.03, metalness: 1 }),
      pot: std('#D5CCBE', { roughness: 0.9 }),
      leaf: std('#4E7045', { roughness: 0.9 }), leaf2: std('#6C8E55', { roughness: 0.9 }), leaf3: std('#3D5C3A', { roughness: 0.9 }),
      trunk: std('#7A6248', { roughness: 1 }), rock: tx('#7D7A74', { roughness: 0.95 }, { n: 'stone_n.jpg' }, 1),
      glass: new T.MeshPhysicalMaterial({ color: '#E3ECEB', transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0, envMapIntensity: 1.6, depthWrite: false, side: T.DoubleSide }),
      sheer: new T.MeshStandardMaterial({ color: '#F6F1E7', transparent: true, opacity: 0.5, roughness: 1, side: T.DoubleSide, depthWrite: false }),
      water: new T.MeshPhysicalMaterial({ color: '#4FB3BF', transparent: true, opacity: 0.82, roughness: 0.06, metalness: 0.1, envMapIntensity: 1.4 }),
      poolTile: std('#CFE7E6', { roughness: 0.3 }),
      onyx: tx('#F3DDB0', { roughness: 0.2, emissive: new T.Color('#FFCF8A'), emissiveIntensity: 0.55 }, { c: 'marble_c.jpg' }, 2.9),
      glow: new T.MeshBasicMaterial({ color: '#FFE3BA' }),
      flame: new T.MeshBasicMaterial({ color: '#FFB25A' }),
      carPaint: new T.MeshPhysicalMaterial({ color: '#07080a', roughness: 0.2, metalness: 0.7, clearcoat: 1, clearcoatRoughness: 0.06 }),
      carGlass: std('#11161b', { roughness: 0.05, metalness: 0.6 }),
      tyre: std('#161616', { roughness: 0.9 }),
      ledW: new T.MeshBasicMaterial({ color: '#F4F8FF' }), ledR: new T.MeshBasicMaterial({ color: '#D01822' }),
      soffit: tx('#D8B68E', { roughness: 0.7 }, { c: 'wood_c.jpg', n: 'wood_n.jpg' }, 1.4),
    };
    setMap(M.onyx, 'emissiveMap', 'marble_c.jpg', true);
    setMap(M.water, 'normalMap', 'stone_n.jpg', false, 2);
    for (const k in M) M[k].userData.baseEnv = M[k].envMapIntensity === undefined ? 1 : M[k].envMapIntensity;
    return M;
  }

  /* ============================ geometry helpers ============================ */
  function scaleUV(g, w, h, d, t) {
    const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  }
  function box(w, h, d, mat, x = 0, y = 0, z = 0, cast = true) {
    const g = new T.BoxGeometry(w, h, d);
    if (mat.userData.tile) scaleUV(g, w, h, d, mat.userData.tile);
    const m = new T.Mesh(g, mat); m.position.set(x, y + h / 2, z); m.castShadow = cast; m.receiveShadow = true; return m;
  }
  function rbox(w, h, d, r, mat, x = 0, y = 0, z = 0) {
    const g = AD.RoundedBoxGeometry ? new AD.RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)) : new T.BoxGeometry(w, h, d);
    const m = new T.Mesh(g, mat); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; return m;
  }
  function cyl(r, h, mat, x = 0, y = 0, z = 0, seg = 28, r2) {
    const m = new T.Mesh(new T.CylinderGeometry(r2 === undefined ? r : r2, r, h, seg), mat); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; return m;
  }
  function blob(r, mat, x, y, z, sy = 1) {
    const m = new T.Mesh(new T.IcosahedronGeometry(r, 2), mat); m.position.set(x, y, z); m.scale.y = sy; m.castShadow = true; return m;
  }
  function shapeOf(pts, holes) {
    const s = new T.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, -y) : s.moveTo(x, -y)));
    (holes || []).forEach((r) => { const p = new T.Path(); p.moveTo(r[0], -r[1]); p.lineTo(r[0], -r[3]); p.lineTo(r[2], -r[3]); p.lineTo(r[2], -r[1]); p.lineTo(r[0], -r[1]); s.holes.push(p); });
    return s;
  }
  const rectPts = (r) => [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]];
  function flat(pts, holes, mat, y, tile) {
    const g = new T.ShapeGeometry(shapeOf(pts, holes));
    const t = tile || mat.userData.tile; if (t) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / t, uv.getY(i) / t); }
    const m = new T.Mesh(g, mat); m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true; return m;
  }
  function slab(pts, holes, mat, yTop, depth) {
    const m = new T.Mesh(new T.ExtrudeGeometry(shapeOf(pts, holes), { depth, bevelEnabled: false }), mat);
    m.rotation.x = -Math.PI / 2; m.position.y = yTop - depth; m.castShadow = true; m.receiveShadow = true; return m;
  }

  /* ============================ furniture ============================ */
  function plantModel(g, r, m, tall = 1.3) {
    g.add(cyl(r * 0.5, 0.42, m.pot, 0, 0, 0, 24, r * 0.6));
    g.add(cyl(0.02, tall - 0.5, m.trunk, 0, 0.4, 0, 8));
    g.add(blob(r * 0.85, m.leaf, 0, tall - 0.25, 0, 1.15)); g.add(blob(r * 0.6, m.leaf2, r * 0.3, tall + 0.15, -r * 0.15)); g.add(blob(r * 0.5, m.leaf3, -r * 0.3, tall - 0.05, r * 0.25));
  }
  function buildFurn(f, floor) {
    const m = mats(), face = f.face || 'n', swap = face === 'e' || face === 'w';
    const w = swap ? f.d : f.w, d = swap ? f.w : f.d, hw = w / 2, hd = d / 2;
    const g = new T.Group();
    switch (f.t) {
      case 'bed': {
        g.add(box(w + 0.06, 0.22, d, m.wood, 0, 0.06, 0)); g.add(rbox(w - 0.04, 0.26, d - 0.1, 0.06, m.linen, 0, 0.28, 0.04));
        g.add(rbox(w + 0.02, 0.1, d * 0.42, 0.04, m.sage, 0, 0.5, hd * 0.52));
        g.add(rbox(w + 0.5, 1.15, 0.1, 0.03, m.fabricDark, 0, 0, -hd + 0.03));
        for (const s of [-1, 1]) { g.add(rbox(w * 0.4, 0.16, 0.36, 0.07, m.linen, s * w * 0.23, 0.54, -hd + 0.34)); g.add(rbox(w * 0.3, 0.14, 0.3, 0.06, m.fabric, s * w * 0.23, 0.6, -hd + 0.62)); }
        break;
      }
      case 'sofa': {
        g.add(rbox(w, 0.34, d, 0.06, m.fabric, 0, 0.06, 0)); g.add(rbox(w, 0.5, 0.22, 0.08, m.fabric, 0, 0.36, -hd + 0.11));
        for (const s of [-1, 1]) g.add(rbox(0.2, 0.3, d, 0.08, m.fabric, s * (hw - 0.1), 0.36, 0));
        const n = Math.max(2, Math.round((w - 0.4) / 0.72)), cw = (w - 0.4) / n;
        for (let i = 0; i < n; i++) { const x = -hw + 0.2 + cw * (i + 0.5); g.add(rbox(cw - 0.02, 0.16, d - 0.3, 0.06, m.fabric, x, 0.38, 0.1)); g.add(rbox(cw - 0.06, 0.36, 0.16, 0.07, m.fabric, x, 0.5, -hd + 0.3)); }
        g.add(rbox(0.4, 0.36, 0.14, 0.06, m.sage, -hw + 0.5, 0.54, -hd + 0.42)); g.add(rbox(0.36, 0.32, 0.14, 0.06, m.fabricDark, hw - 0.5, 0.54, -hd + 0.42));
        break;
      }
      case 'armchair': case 'lounge': {
        const mat = f.t === 'lounge' ? m.fabricDark : m.linen;
        g.add(rbox(w, 0.3, d, 0.1, mat, 0, 0.12, 0)); g.add(rbox(w, 0.46, 0.18, 0.08, mat, 0, 0.36, -hd + 0.09));
        for (const s of [-1, 1]) g.add(rbox(0.14, 0.24, d * 0.85, 0.06, mat, s * (hw - 0.07), 0.4, 0));
        g.add(rbox(w - 0.3, 0.12, d - 0.26, 0.05, m.fabric, 0, 0.4, 0.06));
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.02, 0.12, m.wood, a * (hw - 0.08), 0, b * (hd - 0.08), 8));
        break;
      }
      case 'lounger': {
        g.add(box(w, 0.06, d, m.wood, 0, 0.26, 0)); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.05, 0.26, 0.05, m.wood, a * (hw - 0.05), 0, b * (hd - 0.08)));
        g.add(rbox(w - 0.06, 0.09, d * 0.66, 0.04, m.linen, 0, 0.32, d * 0.15));
        const b = rbox(w - 0.06, 0.09, d * 0.36, 0.04, m.linen, 0, 0, 0); b.position.set(0, 0.52, -hd + d * 0.16); b.rotation.x = 0.55; g.add(b);
        break;
      }
      case 'nightstand': g.add(rbox(w, 0.46, d, 0.02, m.wood, 0, 0.04, 0)); g.add(cyl(0.05, 0.03, m.brass, 0, 0.5, 0)); g.add(cyl(0.012, 0.3, m.brass, 0, 0.5, 0, 8));
        { const s = new T.Mesh(new T.CylinderGeometry(0.09, 0.13, 0.2, 24, 1, true), m.shade || (m.shade = new T.MeshStandardMaterial({ color: '#F6EBD8', emissive: '#FFD9A6', emissiveIntensity: 0.9, side: T.DoubleSide, roughness: 1 }))); s.position.y = 0.9; g.add(s); }
        break;
      case 'sidetable': g.add(cyl(w / 2, 0.03, m.marble, 0, 0.46, 0, 32)); g.add(cyl(0.025, 0.46, m.dark, 0, 0, 0, 10)); g.add(cyl(w * 0.32, 0.02, m.dark, 0, 0, 0, 24)); break;
      case 'stool': g.add(cyl(w / 2, 0.07, m.fabricDark, 0, 0.66, 0, 24)); g.add(cyl(0.02, 0.66, m.dark, 0, 0, 0, 8)); g.add(cyl(w * 0.42, 0.02, m.dark, 0, 0, 0, 24)); break;
      case 'coffee': g.add(rbox(w, 0.3, d, 0.04, m.marble, 0, 0.02, 0)); g.add(cyl(0.11, 0.05, m.pot, w * 0.15, 0.32, 0, 20)); g.add(blob(0.09, m.leaf2, w * 0.15, 0.45, 0)); break;
      case 'rug': g.add(box(w, 0.012, d, m.rug, 0, 0.002, 0, false)); break;
      case 'aasan': g.add(box(w, 0.03, d, m.sage, 0, 0.002, 0, false)); break;
      case 'tv': {
        g.add(box(w + 0.6, 2.5, 0.05, m.wood, 0, 0.1, -hd + 0.025)); g.add(rbox(w, 0.36, d * 0.7, 0.02, m.lacquer, 0, 0.3, -hd + d * 0.38));
        g.add(box(w * 0.66, 0.78, 0.035, m.dark, 0, 1.05, -hd + 0.07)); g.add(box(w + 0.6, 0.02, 0.03, m.glow, 0, 2.58, -hd + 0.06, false));
        break;
      }
      case 'wardrobe': case 'tall': {
        const mat = f.tone === 'olive' ? m.olive : m.lacquer;
        g.add(box(w, 2.5, d, mat, 0, 0.1, 0)); g.add(box(w, 0.1, d - 0.05, m.dark, 0, 0, -0.025));
        const n = Math.max(1, Math.round(w / 0.5));
        for (let i = 1; i < n; i++) g.add(box(0.006, 2.46, 0.006, m.dark, -hw + (w / n) * i, 0.12, hd + 0.001, false));
        for (let i = 0; i < n; i++) g.add(box(0.012, 0.3, 0.02, f.tone === 'olive' ? m.dark : m.brass, -hw + (w / n) * (i + 0.5) + (i % 2 ? -0.18 : 0.18), 1.1, hd + 0.012, false));
        if (f.glass) g.add(box(w - 0.08, 1.5, 0.01, m.glass, 0, 0.9, hd + 0.004, false));
        break;
      }
      case 'fridge': g.add(rbox(w, 1.85, d, 0.02, m.steel, 0, 0.02, 0)); g.add(box(0.01, 1.8, 0.01, m.dark, 0, 0.04, hd + 0.001, false)); break;
      case 'washer': g.add(rbox(w, 0.85, d, 0.03, m.ceramic, 0, 0, 0)); { const c = cyl(0.2, 0.02, m.dark, 0, 0, 0, 28); c.rotation.x = Math.PI / 2; c.position.set(0, 0.45, hd + 0.005); g.add(c); } break;
      case 'counter': {
        g.add(box(w, 0.1, d - 0.06, m.dark, 0, 0, -0.03)); g.add(box(w, 0.75, d, m.olive, 0, 0.1, 0)); g.add(box(w + 0.02, 0.04, d + 0.02, m.granite, 0, 0.85, 0));
        const n = Math.max(1, Math.round(w / 0.55)); for (let i = 1; i < n; i++) g.add(box(0.006, 0.72, 0.006, m.dark, -hw + (w / n) * i, 0.12, hd + 0.001, false));
        for (let i = 0; i < n; i++) g.add(box(0.16, 0.012, 0.02, m.dark, -hw + (w / n) * (i + 0.5), 0.74, hd + 0.012, false));
        if (!f.low) {
          g.add(box(w, 0.6, 0.02, m.marble, 0, 0.89, -hd + 0.01, false));           // backsplash
          g.add(box(w, 0.72, 0.34, m.olive, 0, 1.5, -hd + 0.17)); g.add(box(w, 0.015, 0.02, m.glow, 0, 1.49, -hd + 0.32, false));
          g.add(box(0.62, 0.012, 0.42, m.dark, w * 0.18, 0.892, 0.02, false)); g.add(box(0.5, 0.02, 0.38, m.steel, -w * 0.22, 0.89, 0.02, false));
          g.add(cyl(0.012, 0.28, m.steel, -w * 0.22, 0.9, -hd + 0.12, 8)); g.add(box(0.6, 0.28, 0.3, m.steel, w * 0.18, 1.5, -hd + 0.18));
        }
        break;
      }
      case 'island': g.add(box(w, 0.1, d - 0.1, m.dark, 0, 0, 0)); g.add(box(w, 0.76, d, m.olive, 0, 0.1, 0)); g.add(box(w + 0.06, 0.04, d + 0.06, m.granite, 0, 0.86, 0)); break;
      case 'bar': g.add(box(w, 1.0, d, m.limeYellow, 0, 0, 0)); g.add(box(w + 0.1, 0.05, d + 0.2, m.granite, 0, 1.0, 0.05)); break;
      case 'desk': g.add(box(w, 0.04, d, m.wood, 0, 0.72, 0)); for (const s of [-1, 1]) g.add(box(0.03, 0.72, d - 0.06, m.dark, s * (hw - 0.03), 0, 0)); break;
      case 'chair': {
        g.add(rbox(w, 0.07, d, 0.03, m.fabric, 0, 0.42, 0)); g.add(rbox(w, 0.4, 0.06, 0.03, m.fabric, 0, 0.48, -hd + 0.03));
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(cyl(0.016, 0.42, m.wood, a * (hw - 0.04), 0, b * (hd - 0.04), 8));
        break;
      }
      case 'bench': if (f.stone) { g.add(box(w, 0.1, d, m.limeGrey, 0, 0.34, 0)); for (const s of [-1, 1]) g.add(box(0.12, 0.34, d, m.limeGrey, s * (hw - 0.2), 0, 0)); } else g.add(rbox(w, 0.42, d, 0.02, m.wood, 0, 0, 0)); break;
      case 'dining': {
        const seats = f.seats || 6, long = d >= w, TW = long ? w * 0.9 : w, TD = long ? d : d * 0.9, top = f.outdoor ? m.wood : m.wood;
        g.add(rbox(TW, 0.045, TD, 0.02, top, 0, 0.72, 0));
        for (const s of [-1, 1]) g.add(long ? box(TW * 0.5, 0.72, 0.06, m.dark, 0, 0, s * TD * 0.34) : box(0.06, 0.72, TD * 0.5, m.dark, s * TW * 0.34, 0, 0));
        const per = seats / 2;
        const ch = (x, z, rot) => { const c = new T.Group(); c.add(rbox(0.46, 0.08, 0.46, 0.03, m.fabric, 0, 0.42, 0)); c.add(rbox(0.46, 0.4, 0.07, 0.03, m.fabric, 0, 0.48, -0.2)); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c.add(cyl(0.016, 0.42, m.wood, a * 0.19, 0, b * 0.19, 8)); c.position.set(x, 0, z); c.rotation.y = rot; g.add(c); };
        for (let i = 0; i < per; i++) { const t = -0.5 + (i + 0.5) / per; if (long) { ch(-TW / 2 - 0.12, t * TD, -Math.PI / 2); ch(TW / 2 + 0.12, t * TD, Math.PI / 2); } else { ch(t * TW, -TD / 2 - 0.12, 0); ch(t * TW, TD / 2 + 0.12, Math.PI); } }
        if (!f.outdoor) { g.add(box(long ? 0.05 : TW * 0.8, 0.035, long ? TD * 0.8 : 0.05, m.dark, 0, 1.95, 0, false)); g.add(box(long ? 0.03 : TW * 0.78, 0.01, long ? TD * 0.78 : 0.03, m.glow, 0, 1.94, 0, false)); for (const s of [-1, 1]) g.add(cyl(0.004, 0.9, m.dark, long ? 0 : s * TW * 0.35, 1.98, long ? s * TD * 0.35 : 0, 6)); }
        g.add(cyl(0.07, 0.22, m.ceramic, 0, 0.765, 0, 20, 0.05)); g.add(blob(0.11, m.leaf2, 0, 1.1, 0));
        break;
      }
      case 'wc': g.add(rbox(w - 0.04, 0.36, d - 0.1, 0.08, m.ceramic, 0, 0.08, 0.05)); g.add(box(w, 0.9, 0.1, m.kotaPol, 0, 0, -hd + 0.05)); g.add(box(0.2, 0.12, 0.02, m.steel, 0, 0.95, -hd + 0.105, false)); break;
      case 'basin': g.add(box(w, 0.1, d, m.marble, 0, 0.76, 0)); g.add(rbox(w * 0.7, 0.12, d * 0.7, 0.05, m.ceramic, 0, 0.84, 0)); g.add(box(w, 0.3, d - 0.04, m.wood, 0, 0.42, 0)); g.add(cyl(0.012, 0.22, m.steel, 0, 0.86, -hd + 0.06, 8));
        g.add(box(w * 0.9, 0.8, 0.02, m.mirror, 0, 1.15, -hd + 0.012, false)); g.add(box(w * 0.9, 0.02, 0.03, m.glow, 0, 1.97, -hd + 0.02, false)); break;
      case 'tub': g.add(rbox(w, 0.56, d, 0.12, m.ceramic, 0, 0, 0)); g.add(box(w - 0.16, 0.02, d - 0.16, m.water, 0, 0.5, 0, false)); break;
      case 'shower': g.add(box(0.012, 2.0, d, m.glass, -hw, 0, 0, false)); g.add(cyl(0.1, 0.02, m.steel, 0.1, 2.1, 0, 20)); break;
      case 'oshower': g.add(cyl(0.02, 2.2, m.steel, 0, 0, 0, 10)); g.add(cyl(0.14, 0.02, m.steel, 0, 2.2, 0.2, 20)); g.add(box(0.03, 0.03, 0.22, m.steel, 0, 2.2, 0.1)); break;
      case 'plant': plantModel(g, Math.min(w, d) / 2, m); break;
      case 'palm': {
        g.add(cyl(0.08, 2.6, m.trunk, 0, 0, 0, 10, 0.05));
        for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const l = box(0.22, 0.02, 1.5, i % 2 ? m.leaf : m.leaf2, 0, 0, 0); l.position.set(Math.sin(a) * 0.6, 2.55 - (i % 3) * 0.08, Math.cos(a) * 0.6); l.rotation.set(-0.45, a, 0, 'YXZ'); g.add(l); }
        break;
      }
      case 'shrub': { const n = Math.round(Math.max(w, d) / 0.45); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n - 0.5; const r = 0.26 + ((i * 37) % 10) / 60; g.add(blob(r, [m.leaf, m.leaf2, m.leaf3][i % 3], w >= d ? t * w : ((i * 53) % 10 - 5) / 12 * w, r * 0.85, w >= d ? ((i * 53) % 10 - 5) / 12 * d : t * d, 1.1)); } break; }
      case 'bamboo': { const n = Math.round(d / 0.16); for (let i = 0; i < n; i++) { const z = -hd + (d / n) * (i + 0.5), x = ((i * 31) % 10 - 5) / 30, h = 2.4 + ((i * 17) % 10) / 12; g.add(cyl(0.018, h, m.leaf2, x, 0, z, 6)); g.add(blob(0.2, i % 2 ? m.leaf : m.leaf3, x, h - 0.2, z, 1.8)); g.add(blob(0.16, m.leaf2, x + 0.05, h * 0.6, z, 1.6)); } break; }
      case 'boulder': { const b = new T.Mesh(new T.DodecahedronGeometry(Math.min(w, d) / 2, 1), m.rock); b.scale.set(1, 0.6, d / w); b.position.y = Math.min(w, d) * 0.22; b.rotation.y = w * 7; b.castShadow = true; b.receiveShadow = true; g.add(b); break; }
      case 'stepstones': {
        const st = (x, z) => g.add(box(0.5, 0.04, 0.5, m.limeGrey, x, 0.0, z, false));
        for (let x = -hw; x <= hw; x += 0.72) { st(x, hd - 0.1); if (Math.abs(x) > hw - 1.0) for (let z = -hd + 0.6; z < hd - 0.6; z += 0.72) st(x, z); }
        for (let x = -hw + 0.72; x < hw - 0.7; x += 0.72) st(x, -hd + 0.35);
        break;
      }
      case 'greenwall': {
        g.add(box(w, 2.5, d, m.dark, 0, 0, 0));
        for (let r = 0; r < 7; r++) for (let c = 0; c < Math.round(d / 0.34); c++) if ((r + c) % 2 === 0) g.add(blob(0.17, (r + c) % 4 ? m.leaf : m.leaf2, hw + 0.06, 0.3 + r * 0.33, -hd + 0.17 + c * 0.34, 0.9));
        break;
      }
      case 'planter': {
        g.add(box(w, 0.42, d, m.wall, 0, 0, 0));
        const n = Math.max(2, Math.round(Math.max(w, d) / 0.34)), r = Math.min(w, d) * (f.dense ? 0.5 : 0.6);
        for (let i = 0; i < n; i++) { const t = (i + 0.5) / n - 0.5; g.add(blob(r * (0.8 + ((i * 29) % 10) / 25), [m.leaf, m.leaf2, m.leaf3][i % 3], w >= d ? t * w : 0, 0.5 + ((i * 13) % 10) / 50, w >= d ? 0 : t * d, 1.15)); }
        break;
      }
      case 'vineplanter': {
        g.add(box(w, 0.4, d, m.wall, 0, 0, 0)); const n = Math.round(w / 0.26);
        for (let i = 0; i < n; i++) { const x = -hw + (w / n) * (i + 0.5); g.add(blob(0.2, i % 2 ? m.leaf : m.leaf2, x, 0.5, 0)); const len = 0.5 + ((i * 37) % 9) / 8; g.add(box(0.07, len, 0.06, i % 2 ? m.leaf3 : m.leaf, x + 0.04, -len + 0.1, (f.y < 0 ? -1 : 1) * (hd - 0.02), false)); }
        break;
      }
      case 'fins': { const n = Math.round(d / 0.2); for (let i = 0; i < n; i++) g.add(box(w * 0.9, (f.hh || H) + 0.3, 0.045, m.fins, 0, -0.3, -hd + (d / n) * (i + 0.5))); break; }
      case 'curtain': {
        const n = Math.max(4, Math.round(w / 0.14));
        for (let i = 0; i < n; i++) g.add(box(w / n + 0.01, H - 0.12, 0.015, m.sheer, -hw + (w / n) * (i + 0.5), 0.04, i % 2 ? 0.03 : -0.03, false));
        break;
      }
      case 'floorlamp': {
        g.add(cyl(0.14, 0.025, m.dark, 0, 0, 0)); g.add(cyl(0.011, 1.5, m.brass, 0, 0, 0, 8));
        const s = new T.Mesh(new T.CylinderGeometry(0.14, 0.19, 0.28, 28, 1, true), m.shade || (m.shade = new T.MeshStandardMaterial({ color: '#F6EBD8', emissive: '#FFD9A6', emissiveIntensity: 0.9, side: T.DoubleSide, roughness: 1 }))); s.position.y = 1.58; g.add(s);
        break;
      }
      case 'mandir': {
        const w = f.w, d = f.d, hw = w / 2, hd = d / 2; g.userData.rot = face === 'e' ? Math.PI : 0;
        g.add(box(w, 0.8, d, m.ceramic, 0, 0, 0)); g.add(box(w + 0.04, 0.04, d + 0.02, m.marble, 0, 0.8, 0));
        g.add(box(0.03, 1.75, d, m.marble, -hw + 0.015, 0.84, 0));
        for (let i = 0; i < 12; i++) g.add(cyl(0.035, 1.75, m.ceramic, -hw + 0.06, 0.84, -hd + 0.06 + i * ((d - 0.12) / 11), 10));
        g.add(box(w, 0.1, d, m.ceramic, 0, 2.6, 0)); g.add(box(w * 0.8, 0.015, d * 0.9, m.glow, 0, 2.585, 0, false));
        g.add(rbox(0.14, 0.34, 0.2, 0.04, m.brass, -0.02, 0.84, 0)); g.add(cyl(0.035, 0.02, m.brass, 0.14, 0.84, d * 0.25, 14)); g.add(cyl(0.012, 0.03, m.flame, 0.14, 0.86, d * 0.25, 8)); g.add(cyl(0.035, 0.02, m.brass, 0.14, 0.84, -d * 0.25, 14)); g.add(cyl(0.012, 0.03, m.flame, 0.14, 0.86, -d * 0.25, 8));
        g.userData.light = { y: 2.2, color: '#FFCF8A', i: 5 };
        break;
      }
      case 'onyx': {
        const hh = f.h || H, base = f.upper ? -H : 0, total = f.upper ? hh + H : hh;
        g.add(box(w, total, d, m.onyx, 0, base, 0));
        for (let i = 1; i < 3; i++) g.add(box(0.008, total, d + 0.006, m.brass, -hw + (w / 3) * i, base, 0, false));
        g.add(box(w, 0.03, 0.05, m.glow, 0, base + total - 0.05, hd + 0.03, false)); g.add(box(w, 0.03, 0.05, m.glow, 0, base + 0.02, hd + 0.03, false));
        g.userData.light = { y: (base + total) / 2 + 0.6, z: 0.9, color: '#FFD6A0', i: 14 };
        break;
      }
      case 'liftcar': {
        g.add(box(w, 0.04, d, m.steel, 0, 0, 0)); g.add(box(w, 2.2, 0.03, m.steel, 0, 0.04, -hd + 0.015)); for (const s of [-1, 1]) g.add(box(0.03, 2.2, d, m.steel, s * (hw - 0.015), 0.04, 0));
        g.add(box(w, 0.05, d, m.steel, 0, 2.24, 0)); g.add(box(w * 0.6, 0.012, d * 0.6, m.glow, 0, 2.228, 0, false)); g.add(box(w - 0.1, 0.03, 0.03, m.steel, 0, 0.95, -hd + 0.06, false));
        for (let x = -hw + 0.08; x < -hw + 0.34; x += 0.05) g.add(box(0.012, 2.1, 0.012, m.steel, x, 0.05, hd, false));   // collapsible door, folded open
        break;
      }
      case 'stairs': {
        const n = f.steps || 11, half = w / 2 - 0.04, run = (d - 1.0) / n, rise = (H / 2) / n, base = f.down ? -H : 0;
        const fl = (sx, dir, y0) => { for (let i = 0; i < n; i++) { const z = dir > 0 ? hd - 1.0 - run * (i + 0.5) + 0.0 : -hd + 1.0 + run * (i + 0.5) - 1.0 + 1.0; const zz = dir > 0 ? hd - run * (i + 0.5) : -hd + 1.0 + run * (i + 0.5); g.add(box(half, 0.05, run + 0.02, m.kota, sx, base + y0 + rise * (i + 1) - 0.05, zz)); g.add(box(half, rise * (i + 1), run, m.wall, sx, base + y0, zz)); } };
        fl(hw - half / 2 - 0.02, 1, 0);                                   // first flight, east half, rising north
        g.add(box(w, 0.08, 1.0, m.kota, 0, base + H / 2 - 0.08, -hd + 0.5)); g.add(box(w, H / 2 - 0.08, 1.0, m.wall, 0, base, -hd + 0.5));   // landing
        fl(-hw + half / 2 + 0.02, -1, H / 2);                              // second flight, west half, rising south
        g.add(box(0.04, 1.0, d - 1.0, m.glass, 0, base + H / 2 + 0.2, 0.5, false)); g.add(box(0.05, 0.04, d - 1.0, m.frame, 0, base + H / 2 + 1.2, 0.5, false));
        break;
      }
      case 'gate': for (let x = -hw; x <= hw; x += 0.1) g.add(box(0.035, 1.7, 0.05, m.dark, x, 0.05, 0)); g.add(box(w, 0.06, 0.07, m.dark, 0, 1.72, 0)); break;
      case 'verna': {
        const L = d, W = w, sh = new T.Shape();
        [[0, 0.28], [0.03, 0.58], [0.2, 0.7], [0.95, 0.78], [1.7, 0.86], [2.35, 1.4], [3.2, 1.44], [3.95, 1.04], [4.45, 0.98], [4.54, 0.7], [4.5, 0.28]].forEach(([z, y], i) => (i ? sh.lineTo(z, y) : sh.moveTo(z, y)));
        const body = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: W - 0.14, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 4 }), m.carPaint);
        body.rotation.y = Math.PI / 2; body.position.set(-(W - 0.14) / 2, 0, L / 2); body.castShadow = true; g.add(body);
        const gh = new T.Shape(); [[1.76, 0.9], [2.36, 1.39], [3.18, 1.42], [3.88, 1.06]].forEach(([z, y], i) => (i ? gh.lineTo(z, y) : gh.moveTo(z, y)));
        const gl = new T.Mesh(new T.ExtrudeGeometry(gh, { depth: W + 0.005, bevelEnabled: false }), m.carGlass); gl.rotation.y = Math.PI / 2; gl.position.set(-(W + 0.005) / 2, 0, L / 2); g.add(gl);
        g.add(box(W - 0.16, 0.025, 0.03, m.ledW, 0, 0.74, L / 2 + 0.045, false)); g.add(box(W - 0.1, 0.035, 0.03, m.ledR, 0, 0.93, -L / 2 - 0.04, false)); g.add(box(W * 0.6, 0.2, 0.03, m.carGlass, 0, 0.36, L / 2 + 0.05, false));
        for (const [a, zz] of [[-1, 1.37], [1, 1.37], [-1, -1.3], [1, -1.3]]) { const t = cyl(0.33, 0.22, m.tyre, 0, 0, 0, 32); t.rotation.z = Math.PI / 2; t.position.set(a * (W / 2 - 0.1), 0.33, zz); g.add(t); const r = cyl(0.2, 0.225, m.steel, 0, 0, 0, 20); r.rotation.z = Math.PI / 2; r.position.copy(t.position); g.add(r); }
        break;
      }
      case 'waterwall': {
        const w = f.w, d = f.d, hw = w / 2, hd = d / 2; g.userData.rot = face === 'e' ? Math.PI : 0;
        g.add(box(w, 0.4, d + 0.4, m.limeGrey, 0, 0, 0)); g.add(box(w - 0.12, 0.02, d + 0.28, m.water, 0, 0.36, 0, false));
        g.add(box(0.12, 2.5, d, m.kota, -hw + 0.06, 0.4, 0));
        for (let i = 0; i < Math.round(d / 0.07); i++) g.add(box(0.02, 2.5, 0.03, m.glass, -hw + 0.14, 0.4, -hd + 0.035 + i * 0.07, false));
        g.add(box(0.03, 0.03, d, m.glow, -hw + 0.16, 0.42, 0, false));
        g.userData.light = { y: 0.8, color: '#FFD9A6', i: 6 };
        break;
      }
      case 'tankcover': g.add(box(w, 0.015, d, m.dark, 0, 0.001, 0, false)); break;
      case 'shearwall': { const n = Math.round(w / 0.09); for (let i = 0; i < n; i++) g.add(cyl(0.045, H + 0.1, m.sandstone, -hw + (w / n) * (i + 0.5), 0, 0.02, 10)); g.add(box(w, 0.03, 0.06, m.glow, 0, 0.02, 0.1, false)); break; }
      case 'floatsteps': for (let i = 0; i < 3; i++) g.add(box(0.42, 0.06, d, m.limeGrey, -hw + 0.25 + i * 0.5, 0.0, 0, false)); break;
      case 'screen': {
        const c = document.createElement('canvas'); c.width = 512; c.height = 288; const x = c.getContext('2d'); const gr = x.createLinearGradient(0, 0, 0, 288);
        gr.addColorStop(0, '#f3b572'); gr.addColorStop(0.55, '#e98d6a'); gr.addColorStop(0.56, '#3d5f7a'); gr.addColorStop(1, '#16283a'); x.fillStyle = gr; x.fillRect(0, 0, 512, 288);
        x.fillStyle = '#ffe9c2'; x.beginPath(); x.arc(256, 150, 34, 0, 7); x.fill(); x.fillStyle = '#22384c'; x.beginPath(); x.moveTo(0, 162); x.lineTo(120, 120); x.lineTo(210, 160); x.lineTo(330, 110); x.lineTo(512, 162); x.fill();
        const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
        g.add(box(w + 0.1, 1.6, 0.03, m.dark, 0, 0.75, 0)); const s = new T.Mesh(new T.PlaneGeometry(w, 1.46), new T.MeshBasicMaterial({ map: tex })); s.position.set(0, 1.55, 0.02); g.add(s);
        break;
      }
      case 'pitbench': g.add(box(w, 0.4, d, m.limeYellow, 0, 0, 0)); g.add(rbox(w - 0.04, 0.12, d - 0.12, 0.04, m.fabric, 0, 0.4, 0.05)); g.add(rbox(w - 0.04, 0.36, 0.16, 0.06, m.fabric, 0, 0.46, -hd + 0.1)); g.add(rbox(0.36, 0.3, 0.12, 0.05, m.sage, -hw * 0.5, 0.56, -hd + 0.24)); break;
      case 'firetable': g.add(box(w, 0.34, d, m.limeGrey, 0, 0, 0)); g.add(box(w - 0.24, 0.02, d - 0.24, m.dark, 0, 0.34, 0, false));
        for (let i = 0; i < 6; i++) { const fl = new T.Mesh(new T.ConeGeometry(0.05, 0.2 + (i % 3) * 0.05, 8), m.flame); fl.position.set(-w * 0.3 + i * (w * 0.12), 0.46, 0); g.add(fl); }
        g.userData.light = { y: 0.8, color: '#FFAE60', i: 9 }; break;
      case 'pitsteps': g.add(box(w, 0.15, d, m.deck, 0, 0, 0)); g.add(box(w, 0.3, d / 2, m.deck, 0, 0, -d / 4)); break;
      case 'skylight': g.add(box(w + 0.24, 0.3, 0.12, m.wall, 0, 0, -hd)); g.add(box(w + 0.24, 0.3, 0.12, m.wall, 0, 0, hd)); g.add(box(0.12, 0.3, d, m.wall, -hw, 0, 0)); g.add(box(0.12, 0.3, d, m.wall, hw, 0, 0)); g.add(box(w, 0.02, d, m.glass, 0, 0.3, 0, false)); break;
      case 'pergola': {
        for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(box(0.1, 2.6, 0.1, m.fins, a * (hw - 0.05), 0, b * (hd - 0.05)));
        for (const s of [-1, 1]) g.add(box(w, 0.16, 0.1, m.fins, 0, 2.6, s * (hd - 0.05)));
        for (let x = -hw + 0.1; x < hw; x += 0.2) g.add(box(0.045, 0.12, d, m.fins, x, 2.62, 0));
        g.add(box(w - 0.3, 0.015, 0.04, m.glow, 0, 2.59, -hd + 0.12, false)); g.userData.light = { y: 2.3, color: '#FFD6A0', i: 7 };
        break;
      }
      case 'pool': {
        const hh = 1.0, th = 0.22;
        g.add(box(w, hh, th, m.terr, 0, 0, -hd + th / 2)); g.add(box(th, hh, d, m.terr, -hw + th / 2, 0, 0));
        g.add(box(w, hh - 0.06, 0.1, m.poolTile, 0, 0, hd - 0.05)); g.add(box(0.1, hh - 0.06, d, m.poolTile, hw - 0.05, 0, 0));          // infinity edges (south + east) sit lower
        g.add(box(w - 0.2, 0.05, d - 0.2, m.poolTile, 0, 0.05, 0, false));
        const wt = new T.Mesh(new T.PlaneGeometry(w - 0.24, d - 0.14), m.water); wt.rotation.x = -Math.PI / 2; wt.position.set(-0.05, hh - 0.05, 0.05); g.add(wt);
        g.add(box(w, 0.9, 0.012, m.water, 0, 0.04, hd + 0.01, false)); g.add(box(0.012, 0.9, d, m.water, hw + 0.01, 0, 0, false));        // falling sheet
        for (let i = 0; i < 3; i++) g.add(box(1.4, 0.33 * (3 - i), 0.32, m.terr, -hw + 0.9, 0, -hd - 0.16 - i * 0.32));                // steps on the north
        g.add(box(0.5, 0.45, d - 0.6, m.terr, -hw - 0.25, 0, 0.3)); g.add(rbox(0.46, 0.1, d - 0.7, 0.04, m.fabric, -hw - 0.25, 0.45, 0.3));   // west seating ledge
        g.add(box(w - 0.6, 0.02, 0.04, m.glow, 0, 0.03, -hd - 0.02, false)); g.userData.light = { y: 0.5, color: '#BFEFFF', i: 8 };
        break;
      }
      case 'tank': g.add(cyl(w / 2, 1.1, m.pot, 0, f.onRoof ? H + 0.15 : 0, 0, 24)); break;
      default: g.add(box(w, 0.5, d, m.fabric, 0, 0, 0));
    }
    g.rotation.y = g.userData.rot !== undefined ? g.userData.rot : ROT[face];
    g.position.set(f.x + f.w / 2, f.base || 0, f.y + f.d / 2);
    return g;
  }

  /* ============================ walls ============================ */
  function buildWall(wl, floor, parent, col) {
    const [x1, y1, x2, y2, t = 'w', o = {}] = wl, m = mats();
    const len = Math.hypot(x2 - x1, y2 - y1); if (len < 0.02) return;
    const g = new T.Group();
    const ext = x1 === x2 ? (x1 <= 0.001 || x1 >= floor.w - 0.001) : (y1 <= 0.001 || y1 >= floor.h - 0.001);
    const th = ext || t === 'c' ? 0.2 : 0.12, hh = o.hh || H;
    const glaze = (y0, hgt, heavy) => {
      g.add(box(len, hgt, 0.012, m.glass, 0, y0, 0, false));
      g.add(box(len, 0.05, 0.07, m.frame, 0, y0, 0, false)); g.add(box(len, 0.05, 0.07, m.frame, 0, y0 + hgt - 0.05, 0, false));
      const n = Math.max(1, Math.round(len / (heavy ? 1.15 : 0.9)));
      for (let i = 0; i <= n; i++) g.add(box(0.045, hgt, 0.07, m.frame, -len / 2 + (len / n) * i, y0, 0, false));
      if (hgt > 3.2) g.add(box(len, 0.06, 0.08, m.frame, 0, H, 0, false));
    };
    if (t === 'w') g.add(box(len + (ext ? th : 0), hh, th, m.wall, 0, 0, 0));
    else if (t === 'g') glaze(0, hh, true);
    else if (t === 'gp') { g.add(box(len, H, 0.012, m.glass, 0, 0, 0, false)); g.add(box(len, 0.03, 0.04, m.frame, 0, H - 0.03, 0, false)); }
    else if (t === 'win') { const s = o.s || 0.9, hd = o.h || 2.4; g.add(box(len, s, th, m.wall, 0, 0, 0)); g.add(box(len, H - hd, th, m.wall, 0, hd, 0)); glaze(s, hd - s, false); g.add(box(len, 0.03, th + 0.06, m.marble, 0, s - 0.03, 0, false)); }
    else if (t === 'd') g.add(box(len, H - 2.15, th, m.wall, 0, 2.15, 0));
    else if (t === 'r') { g.add(box(len, 1.05, 0.016, m.glass, 0, 0.02, 0, false)); g.add(box(len, 0.035, 0.05, m.frame, 0, 1.07, 0, false)); g.add(box(len, 0.04, 0.05, m.frame, 0, 0, 0, false)); }
    else if (t === 'c') { g.add(box(len, 1.25, th, m.wall, 0, 0, 0)); for (let x = -len / 2 + 0.1; x < len / 2; x += 0.14) g.add(box(0.03, 0.6, 0.05, m.fins, x, 1.25, 0, false)); g.add(box(len, 0.04, 0.07, m.fins, 0, 1.85, 0, false)); }
    else if (t === 'j') { for (let x = -len / 2 + 0.03; x < len / 2; x += 0.085) g.add(box(0.035, 2.45, 0.06, m.fins, x, 0, 0)); g.add(box(len, 0.05, 0.07, m.fins, 0, 2.45, 0)); }
    g.position.set((x1 + x2) / 2, 0, (y1 + y2) / 2); g.rotation.y = -Math.atan2(y2 - y1, x2 - x1);
    parent.add(g);
    if (t !== 'd') col.push({ x1, y1, x2, y2, r: th / 2 + 0.02, low: t === 'r' || t === 'c' });
  }

  /* ============================ WORLD ============================ */
  class World {
    constructor(el, cb = {}) {
      this.el = el; this.cb = cb;
      const w = el.clientWidth || innerWidth, h = el.clientHeight || innerHeight;
      this.mobile = matchMedia('(hover: none)').matches || innerWidth < 800;
      this.quality = this.mobile ? 'med' : 'high';
      const r = this.renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      r.setPixelRatio(Math.min(devicePixelRatio, this.mobile ? 1.5 : 2)); r.setSize(w, h);
      r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.outputColorSpace = T.SRGBColorSpace;
      r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
      el.appendChild(r.domElement); r.domElement.style.touchAction = 'none';
      this.scene = new T.Scene(); this.scene.background = new T.Color('#0c0f14');
      this.camera = new T.PerspectiveCamera(62, w / h, 0.05, 400);
      this.sun = new T.DirectionalLight('#FFE9CC', 3.0); this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(this.mobile ? 2048 : 4096, this.mobile ? 2048 : 4096);
      Object.assign(this.sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 90 }); this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03;
      this.scene.add(this.sun, this.sun.target);
      this.fill = new T.HemisphereLight('#DCE9FF', '#C9B79C', 0.35); this.scene.add(this.fill);
      this._env();
      this._composer(w, h);
      this.mode = 'doll'; this.night = false;
      this.orbit = { theta: -0.6, phi: 0.9, radius: 24, target: new T.Vector3() }; this.goal = { theta: -0.6, phi: 0.9, radius: 24, target: new T.Vector3() };
      this.player = { x: 0, z: 0, yaw: 0, pitch: 0 }; this.keys = {}; this.joy = { x: 0, y: 0 }; this.walkTo = null;
      this.ray = new T.Raycaster(); this.ptr = new T.Vector2();
      this._bind();
      new ResizeObserver(() => this.resize()).observe(el);
      this._t = performance.now(); this._loop = this._loop.bind(this); requestAnimationFrame(this._loop);
    }

    _env() {
      const pm = new T.PMREMGenerator(this.renderer);
      if (AD.RoomEnvironment) { this.scene.environment = pm.fromScene(new AD.RoomEnvironment(), 0.04).texture; }
      if (AD.RGBELoader) new AD.RGBELoader().load('assets/env/hills_1k.hdr', (hdr) => { hdr.mapping = T.EquirectangularReflectionMapping; this.scene.environment = pm.fromEquirectangular(hdr).texture; hdr.dispose(); }, undefined, () => {});
      TL.load('assets/env/hills.jpg', (t) => { t.mapping = T.EquirectangularReflectionMapping; t.colorSpace = T.SRGBColorSpace; this.sky = t; this._bg(); }, undefined, () => {});
    }
    _bg() {
      const inside = this.mode !== 'doll';
      if (inside && this.sky) { this.scene.background = this.sky; this.scene.backgroundIntensity = this.night ? 0.035 : 1; }
      else { this.scene.background = this._dark || (this._dark = new T.Color(this.night ? '#06080c' : '#0c0f14')); this.scene.backgroundIntensity = 1; }
    }
    _composer(w, h) {
      this.composer = null;
      if (this.quality === 'low' || !AD.EffectComposer) return;
      const rt = new T.WebGLRenderTarget(w, h, { type: T.HalfFloatType, samples: 4 });
      const c = this.composer = new AD.EffectComposer(this.renderer, rt);
      c.addPass(new AD.RenderPass(this.scene, this.camera));
      if (this.quality === 'high' && AD.GTAOPass) { try { const ao = new AD.GTAOPass(this.scene, this.camera, w, h); ao.blendIntensity = 0.9; ao.updateGtaoMaterial && ao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.4, thickness: 1, scale: 1.1, samples: 12 }); c.addPass(ao); this.ao = ao; } catch (e) { console.warn('AO off', e); } }
      this.bloom = new AD.UnrealBloomPass(new T.Vector2(w, h), 0.22, 0.7, 0.92); c.addPass(this.bloom);
      c.addPass(new AD.OutputPass());
    }
    setQuality(q) { this.quality = q; const w = this.el.clientWidth, h = this.el.clientHeight; this._composer(w, h); this.renderer.shadowMap.enabled = true; this._applyNight(); }
    resize() {
      const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h) return;
      this.renderer.setSize(w, h); if (this.composer) this.composer.setSize(w, h); this.camera.aspect = w / h; this._offset(); this.camera.updateProjectionMatrix();
    }
    setOffset(px) { this.offPx = px; this._offset(); this.camera.updateProjectionMatrix(); }
    _offset() { const w = this.el.clientWidth, h = this.el.clientHeight; if (this.offPx && this.mode === 'doll') this.camera.setViewOffset(w, h, -this.offPx, 0, w, h); else this.camera.clearViewOffset(); }

    /* ---------------- build a floor ---------------- */
    load(floor) {
      if (this.root) { this.scene.remove(this.root); this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
      const m = mats(), root = this.root = new T.Group(); this.floor = floor;
      this.col = []; this.boxes = []; this.roomMeshes = []; this.items = []; this.lights = [];
      const ceil = this.ceil = new T.Group(); const OX = floor.w / 2, OZ = floor.h / 2;
      const inner = new T.Group(); inner.position.set(-OX, 0, -OZ); root.add(inner); this.inner = inner;
      const matFor = (k) => ({ wet: m.kota, core: m.marble, stair: m.kota, bal: m.kotaGreen, out: m.limeYellow, pave: m.limeGrey, lawn: m.grass, pit: m.deck, terr: m.terr, pooldeck: m.terr })[k] || m.marble;

      // structural slab
      const outline = rectPts([0, 0, floor.w, floor.h]);
      const holes = [...(floor.slabHoles || []), ...(floor.voidR ? [floor.voidR] : [])];
      inner.add(slab(outline, holes, m.wall, -0.004, floor.id === 'g' ? 0.7 : 0.32));
      if (floor.id === 'g') { const gr = new T.Mesh(new T.CircleGeometry(70, 48), m.grass.clone()); gr.material.color = new T.Color('#8FA574'); gr.rotation.x = -Math.PI / 2; gr.position.y = -0.03; gr.receiveShadow = true; root.add(gr); }

      // room floors
      for (const r of floor.rooms) {
        if (r.kind === 'void') { const f = flat(roomPts(r), null, m.marble, -H, 1.8); inner.add(f); const hit = flat(roomPts(r), null, new T.MeshBasicMaterial({ visible: false }), 0.01); hit.userData.roomId = r.id; inner.add(hit); this.roomMeshes.push(hit); continue; }
        const mat = matFor(r.kind).clone(); mat.userData = matFor(r.kind).userData; mat.emissive = new T.Color('#E7B56A'); mat.emissiveIntensity = 0;
        const src = matFor(r.kind); const sync = () => { mat.map = src.map; mat.normalMap = src.normalMap; mat.roughnessMap = src.roughnessMap; mat.needsUpdate = true; }; sync(); setTimeout(sync, 1500); setTimeout(sync, 5000);
        const mesh = flat(roomPts(r), r.holes, mat, r.kind === 'pit' ? -0.45 : 0.002);
        mesh.userData.roomId = r.id; inner.add(mesh); this.roomMeshes.push(mesh);
        if (r.kind === 'pit') { const [a, b, c, d] = r.r; for (const [p, q, s, t] of [[a, b, c, b], [c, b, c, d], [c, d, a, d], [a, d, a, b]]) { const wl = box(Math.hypot(s - p, t - q), 0.45, 0.04, m.limeYellow, (p + s) / 2, -0.45, (q + t) / 2); wl.rotation.y = -Math.atan2(t - q, s - p); inner.add(wl); } }
      }
      // walls
      for (const wl of floor.walls) buildWall(wl, floor, inner, this.col);
      // double-height retreat (2nd floor): raise the west side of the volume
      if (floor.dbl) { const [a, b, c, d] = floor.dbl; const up = box(0.12, 5.8 - H, d - b, m.wall, a, H, (b + d) / 2); inner.add(up); const rail = box(0.016, 1.0, d - b - 0.2, m.glass, a + 0.07, H + 0.05, (b + d) / 2, false); inner.add(rail); }
      // void (3rd floor): the retreat continues below
      if (floor.voidR) { const [a, b, c, d] = floor.voidR; const g1 = new T.Group();
        g1.add(box(c - a, H, 0.012, m.glass, (a + c) / 2, -H, b, false)); g1.add(box(0.012, H, d - b, m.glass, c, -H, (b + d) / 2, false)); g1.add(box(0.12, H, d - b, m.wall, a, -H, (b + d) / 2));
        for (let i = 0; i <= 3; i++) g1.add(box(0.045, H, 0.07, m.frame, a + ((c - a) / 3) * i, -H, b, false));
        g1.add(rbox(0.78, 0.5, 0.78, 0.1, m.linen, a + 1.0, -H + 0.1, b + 0.85)); g1.add(rbox(0.78, 0.5, 0.78, 0.1, m.linen, a + 2.4, -H + 0.1, b + 0.85)); g1.add(box(2.6, 0.012, 1.5, m.rug, (a + c) / 2, -H + 0.004, b + 1.05, false));
        inner.add(g1); }
      // columns (stilt): leather-finish grey limestone cladding
      (floor.columns || []).forEach(([x, y]) => { inner.add(box(0.3, 3.0, 0.58, m.limeGrey, x + 0.15, 0, y + 0.29)); this.boxes.push({ x1: x, y1: y, x2: x + 0.3, y2: y + 0.58, fixed: true }); });

      // ceilings / soffits
      if (!floor.openAir) {
        const ch = [...(floor.dbl ? [floor.dbl] : []), ...(floor.voidR ? [floor.voidR] : []), ...(floor.skylight ? [floor.skylight] : [])];
        ceil.add(slab(outline, ch, m.ceiling, H + 0.3, 0.3));
        if (floor.dbl) ceil.add(slab(rectPts(floor.dbl), null, m.ceiling, 5.8 + 0.3, 0.3));
        if (floor.voidR) ceil.add(slab(rectPts(floor.voidR), null, m.ceiling, H + 0.3, 0.3));
        if (floor.skylight) { const s = floor.skylight; ceil.add(box(s[2] - s[0], 0.02, s[3] - s[1], m.glass, (s[0] + s[2]) / 2, H + 0.28, (s[1] + s[3]) / 2, false)); }
      } else if (floor.roof) {
        const r = floor.roof, yy = floor.id === 'g' ? 3.0 : H;
        ceil.add(slab(rectPts(r), null, floor.id === 'g' ? m.ceiling : m.wall, yy + 0.3, 0.3));
        if (floor.id === 'g') { ceil.add(box(3.6, 0.04, 3.2, m.soffit, 3.3, 2.96, 12.5, false)); for (let i = 0; i < 8; i++) ceil.add(box(3.6, 0.05, 0.05, m.soffit, 3.3, 2.91, 11.1 + i * 0.4, false)); }
      }
      // room lighting: warm downlights + cove (2700–3000K)
      const lit = new T.Group();
      for (const r of floor.rooms) {
        if (['void', 'lawn'].includes(r.kind)) continue;
        if (floor.openAir && !(floor.roof && this._in(r, floor.roof))) continue;
        const pts = roomPts(r), xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        const a = Math.min(...xs), c = Math.max(...xs), b = Math.min(...ys), d = Math.max(...ys), cx = (a + c) / 2, cy = (b + d) / 2;
        const yy = floor.id === 'g' ? 2.98 : H - 0.01, big = (c - a) * (d - b) > 9;
        const spots = big ? [[cx, b + (d - b) * 0.25], [cx, b + (d - b) * 0.75]] : [[cx, cy]];
        for (const [x, z] of spots) {
          const disc = new T.Mesh(new T.CircleGeometry(0.06, 20), m.glow); disc.rotation.x = Math.PI / 2; disc.position.set(x, yy - 0.002, z); lit.add(disc);
          const pl = new T.PointLight('#FFD9A8', 1, 8.5, 1.8); pl.position.set(x, yy - 0.35, z); pl.userData.base = big ? 7 : 4.5; inner.add(pl); this.lights.push(pl);
        }
        if (r.kind === '' && !floor.openAir && (c - a) > 2.2) { lit.add(box(c - a - 0.5, 0.02, 0.05, m.glow, cx, H - 0.06, b + 0.14, false)); lit.add(box(c - a - 0.5, 0.02, 0.05, m.glow, cx, H - 0.06, d - 0.14, false)); }
        if (r.kind === '' && (c - a) * (d - b) > 6 && !floor.openAir) lit.add(box(0.62, 0.035, 0.62, m.lacquer, cx + 0.9, H - 0.04, cy, false));   // Daikin cassette
      }
      ceil.add(lit); inner.add(ceil);

      // furniture
      const saved = this._saved();
      floor.furn.forEach((f, i) => {
        const ff = { ...f }; const s = saved[i]; if (s && MOVABLE.has(f.t)) { ff.x = s.x; ff.y = s.y; if (s.face) ff.face = s.face; if (s.face && (['e', 'w'].includes(s.face) !== ['e', 'w'].includes(f.face || 'n'))) { ff.w = f.d; ff.d = f.w; } }
        this._addItem(ff, i);
      });
      this.scene.add(root);
      // sun (matches the panorama's sun: south-east, raised for interior light)
      this.sun.target.position.set(0, 0, 0); this.sun.position.set(22, 20, 15);
      const v = floor.orbit || {}; const R = Math.max(floor.w, floor.h) * 1.3 + 5;
      this.home = { theta: v.theta ?? -0.62, phi: v.phi ?? 0.86, radius: R };
      this.goal.target.set(0, 0.5, 0); Object.assign(this.goal, this.home);
      Object.assign(this.orbit, { theta: this.home.theta + 0.55, phi: Math.max(0.05, this.home.phi - 0.25), radius: R * 1.45 }); this.orbit.target.set(0, 0.5, 0);
      this.tween = null; this.selected = null; this.walkTo = null;
      this.setMode('doll', true); this._applyNight();
    }
    _in(r, R) { const [cx, cy] = [(roomPts(r)[0][0] + roomPts(r)[2][0]) / 2, (roomPts(r)[0][1] + roomPts(r)[2][1]) / 2]; return cx > R[0] && cx < R[2] && cy > R[1] && cy < R[3]; }
    _addItem(f, idx) {
      const g = buildFurn(f, this.floor); g.userData = { ...g.userData, f, idx, movable: MOVABLE.has(f.t) };
      g.traverse((o) => { o.userData.item = g; });
      if (g.userData.light) { const L = g.userData.light; const pl = new T.PointLight(L.color, 1, 7, 1.8); pl.position.set(0, L.y, L.z || 0); pl.userData.base = L.i; pl.userData.accent = true; g.add(pl); this.lights.push(pl); }
      this.inner.add(g); this.items.push(g);
      if (!NOCOLLIDE.has(f.t) && !(f.base < 0 && f.t !== 'pitbench')) { const b = { x1: f.x, y1: f.y, x2: f.x + f.w, y2: f.y + f.d, item: g }; g.userData.box = b; this.boxes.push(b); }
      return g;
    }

    /* ---------------- saved layouts ---------------- */
    _key() { return 'b4-layout-' + this.floor.id; }
    _saved() { try { return JSON.parse(localStorage.getItem(this._key()) || '{}'); } catch (e) { return {}; } }
    _save(g) { const s = this._saved(); const f = g.userData.f; s[g.userData.idx] = { x: +f.x.toFixed(3), y: +f.y.toFixed(3), face: f.face || 'n' }; try { localStorage.setItem(this._key(), JSON.stringify(s)); } catch (e) {} }
    resetLayout() { try { localStorage.removeItem(this._key()); } catch (e) {} const mode = this.mode, p = { ...this.player }; this.load(this.floor); if (mode === 'walk') { this.player = p; this.setMode('walk', true); } }

    /* ---------------- modes ---------------- */
    setMode(mode, silent) {
      this.mode = mode; this.ceil.visible = mode !== 'doll'; this._bg(); this._offset();
      this.camera.fov = mode === 'doll' ? 38 : 68; this.camera.updateProjectionMatrix();
      this.renderer.domElement.style.cursor = mode === 'doll' ? 'grab' : 'crosshair';
      if (!silent && this.cb.onMode) this.cb.onMode(mode);
    }
    overview() { if (this.mode === 'doll') { Object.assign(this.goal, this.home); this.goal.target.set(0, 0.5, 0); return; }
      const from = this._pose(); this.setMode('doll'); this.orbit.radius = this.home.radius; Object.assign(this.goal, this.home); this.goal.target.set(0, 0.5, 0); this.orbit.theta = this.home.theta; this.orbit.phi = this.home.phi; this.orbit.target.set(0, 0.5, 0);
      this._orbitCam(); const to = this._pose(); this._fly(from, to, 1.3); }
    _pose() { return { p: this.camera.position.clone(), q: this.camera.quaternion.clone(), fov: this.camera.fov }; }
    _fly(from, to, dur, done) { this.tween = { from, to, t: 0, dur, done }; }
    /** fly inside to a standing pose: [x, y(plan), eye] looking at [x, y, h] */
    enter(fromPt, toPt) {
      const OX = this.floor.w / 2, OZ = this.floor.h / 2;
      const a = this._pose();
      this.player.x = fromPt[0] - OX; this.player.z = fromPt[1] - OZ;
      const dx = toPt[0] - fromPt[0], dz = toPt[1] - fromPt[1], dy = (toPt[2] ?? 1.2) - (fromPt[2] ?? EYE);
      this.player.yaw = Math.atan2(-dx, -dz); this.player.pitch = Math.atan2(dy, Math.hypot(dx, dz));
      this.setMode('walk'); this._walkCam(); const b = this._pose();
      a.fov = this.tween ? this.camera.fov : (this._lastFov || 38);
      this._fly({ ...a, fov: 38 }, b, 1.8);
    }
    enterRoom(id) { const r = this.floor.rooms.find((x) => x.id === id); if (!r) return; const c = r.cam || this._autoCam(r); this.enter(c.from, c.to); if (this.cb.onRoom) this.cb.onRoom(id); }
    enterSpawn() { const s = this.floor.spawn; const a = s.to, yaw = (s.to[2] * Math.PI) / 180; this.enter([a[0], a[1], EYE], [a[0] + Math.sin(yaw) * 3, a[1] - Math.cos(yaw) * 3, 1.2]); }
    _autoCam(r) { const pts = roomPts(r), xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); const a = Math.min(...xs), c = Math.max(...xs), b = Math.min(...ys), d = Math.max(...ys);
      const long = (d - b) > (c - a); return { from: long ? [(a + c) / 2, d - 0.45, 1.5] : [c - 0.45, (b + d) / 2, 1.5], to: [(a + c) / 2 - (long ? 0 : 0.6), (b + d) / 2 - (long ? 0.6 : 0), 1.0] }; }

    /* ---------------- day / night ---------------- */
    setNight(n) { this.night = n; this._dark = null; this._applyNight(); this._bg(); }
    _applyNight() {
      const n = this.night, m = mats();
      this.sun.intensity = n ? 0.12 : 3.0; this.sun.color.set(n ? '#9FB6E8' : '#FFE9CC'); this.fill.intensity = n ? 0.06 : 0.35;
      this.renderer.toneMappingExposure = n ? 0.9 : 1.0;
      const env = n ? 0.07 : 1; for (const k in m) if ('envMapIntensity' in m[k]) m[k].envMapIntensity = m[k].userData.baseEnv * env;
      if (this.root) this.root.traverse((o) => { if (o.material && 'envMapIntensity' in o.material && o.material.userData && o.material.userData.baseEnv === undefined) o.material.envMapIntensity = env; else if (o.material && o.material.userData && o.material.userData.baseEnv !== undefined) o.material.envMapIntensity = o.material.userData.baseEnv * env; });
      (this.lights || []).forEach((l) => { l.intensity = l.userData.base * (n ? 1.9 : (l.userData.accent ? 0.5 : 0.28)); });
      m.onyx.emissiveIntensity = n ? 1.25 : 0.55; if (m.shade) m.shade.emissiveIntensity = n ? 1.6 : 0.5;
      if (this.bloom) this.bloom.strength = n ? 0.5 : 0.2;
    }

    /* ---------------- input ---------------- */
    _bind() {
      const el = this.renderer.domElement; let down = null, moved = 0, pinch = 0;
      const pos = (e) => { const r = el.getBoundingClientRect(); this.ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
      el.addEventListener('pointerdown', (e) => {
        if (this.tween) return; el.setPointerCapture(e.pointerId); pos(e); down = { x: e.clientX, y: e.clientY, btn: e.button }; moved = 0; this.walkTo = null;
        const it = this._pickItem(); if (it && it.userData.movable) { this.drag = { g: it, off: null, valid: { x: it.userData.f.x, y: it.userData.f.y } }; this._select(it); const p = this._floorPoint(it.position.y); if (p) this.drag.off = { x: it.position.x - p.x, z: it.position.z - p.z }; el.style.cursor = 'grabbing'; }
      });
      el.addEventListener('pointermove', (e) => {
        pos(e);
        if (!down) { if (!this.mobile) this._hover(); return; }
        const dx = e.clientX - down.x, dy = e.clientY - down.y; down.x = e.clientX; down.y = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        if (this.drag) { const p = this._floorPoint(this.drag.g.position.y); if (p && this.drag.off) this._moveItem(this.drag.g, p.x + this.drag.off.x, p.z + this.drag.off.z); return; }
        if (this.mode === 'doll') {
          if (down.btn === 2 || e.shiftKey) { const k = this.orbit.radius * 0.0016; this.goal.target.x -= (Math.cos(this.orbit.theta) * dx + Math.sin(this.orbit.theta) * dy) * k; this.goal.target.z -= (-Math.sin(this.orbit.theta) * dx + Math.cos(this.orbit.theta) * dy) * k; }
          else { this.goal.theta -= dx * 0.006; this.goal.phi = Math.min(1.45, Math.max(0.04, this.goal.phi - dy * 0.005)); }
        } else { this.player.yaw += dx * 0.0042; this.player.pitch = Math.max(-1.2, Math.min(1.2, this.player.pitch + dy * 0.0036)); }
      });
      const up = (e) => {
        if (!down) return; const wasDrag = this.drag; down = null;
        if (wasDrag) { this._save(wasDrag.g); this.drag = null; el.style.cursor = this.mode === 'doll' ? 'grab' : 'crosshair'; return; }
        if (moved > 6 || this.tween) return; pos(e);
        const id = this._pickRoom();
        if (this.mode === 'doll') { if (id) this.enterRoom(id); }
        else { const p = this._floorPoint(0, true); if (p) this.walkTo = { x: p.x, z: p.z, t: 0 }; this._select(null); }
      };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', () => { down = null; this.drag = null; });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      el.addEventListener('wheel', (e) => { e.preventDefault(); if (this.mode === 'doll') this.goal.radius = Math.min(60, Math.max(4, this.goal.radius * (1 + Math.sign(e.deltaY) * 0.09))); else { this.camera.fov = Math.min(85, Math.max(35, this.camera.fov + Math.sign(e.deltaY) * 3)); this.camera.updateProjectionMatrix(); } }, { passive: false });
      el.addEventListener('touchmove', (e) => { if (e.touches.length === 2 && this.mode === 'doll') { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (pinch) this.goal.radius = Math.min(60, Math.max(4, this.goal.radius * (pinch / d))); pinch = d; } }, { passive: true });
      el.addEventListener('touchend', () => { pinch = 0; });
      addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; this.keys[e.code] = true; if (e.code === 'KeyR' && this.selected) this.rotateSelected(); });
      addEventListener('keyup', (e) => { this.keys[e.code] = false; });
      addEventListener('blur', () => { this.keys = {}; });
    }
    _pickItem() { this.ray.setFromCamera(this.ptr, this.camera); this.ray.far = this.mode === 'doll' ? 200 : 7; const h = this.ray.intersectObjects(this.items, true).find((x) => x.object.material !== mats().glass && x.object.material !== mats().sheer); this.ray.far = Infinity; if (!h) return null; return h.object.userData.item || null; }
    _pickRoom() { this.ray.setFromCamera(this.ptr, this.camera); const h = this.ray.intersectObjects(this.roomMeshes, false)[0]; return h ? h.object.userData.roomId : null; }
    _floorPoint(y = 0, mustHitFloor) { this.ray.setFromCamera(this.ptr, this.camera); if (mustHitFloor) { const h = this.ray.intersectObjects(this.roomMeshes, false)[0]; return h ? h.point : null; } const pl = new T.Plane(new T.Vector3(0, 1, 0), -y); const p = new T.Vector3(); return this.ray.ray.intersectPlane(pl, p) ? p : null; }
    _hover() { if (this.drag || this.tween) return; const it = this._pickItem(); const mv = it && it.userData.movable; const id = this.mode === 'doll' && !mv ? this._pickRoom() : null;
      this.renderer.domElement.style.cursor = mv ? 'grab' : this.mode === 'doll' ? (id ? 'pointer' : 'grab') : 'crosshair';
      if (id !== this.hoverId) { this.hoverId = id; this.highlight(id); if (this.cb.onHover) this.cb.onHover(id); } }
    highlight(id) { (this.roomMeshes || []).forEach((r) => { if (r.material.emissive) r.material.emissiveIntensity = r.userData.roomId === id ? 0.22 : 0; }); }
    _select(g) { this.selected = g; if (this.cb.onSelect) this.cb.onSelect(g ? g.userData.f.t : null); }

    /* ---------------- moving furniture ---------------- */
    _fits(f, x, y, self) {
      const a = x + 0.02, b = y + 0.02, c = x + f.w - 0.02, d = y + f.d - 0.02;
      if (a < 0 || b < 0 || c > this.floor.w || d > this.floor.h) return false;
      for (const s of this.col) { const sx1 = Math.min(s.x1, s.x2) - s.r, sx2 = Math.max(s.x1, s.x2) + s.r, sy1 = Math.min(s.y1, s.y2) - s.r, sy2 = Math.max(s.y1, s.y2) + s.r; if (a < sx2 && c > sx1 && b < sy2 && d > sy1) return false; }
      if (NOCOLLIDE.has(f.t)) return true;
      for (const o of this.boxes) { if (o.item === self) continue; if (o.item && NOCOLLIDE.has(o.item.userData.f.t)) continue; if (a < o.x2 && c > o.x1 && b < o.y2 && d > o.y1) return false; }
      return true;
    }
    _moveItem(g, wx, wz) {
      const f = g.userData.f, OX = this.floor.w / 2, OZ = this.floor.h / 2;
      let x = wx + OX - f.w / 2, y = wz + OZ - f.d / 2;
      const tryPos = (px, py) => { if (!this._fits(f, px, py, g)) return false; f.x = px; f.y = py; return true; };
      if (!tryPos(x, y) && !tryPos(x, f.y) && !tryPos(f.x, y)) return;
      g.position.set(f.x + f.w / 2, g.position.y, f.y + f.d / 2);
      if (g.userData.box) Object.assign(g.userData.box, { x1: f.x, y1: f.y, x2: f.x + f.w, y2: f.y + f.d });
    }
    rotateSelected() {
      const g = this.selected; if (!g) return; const f = g.userData.f, order = ['n', 'e', 's', 'w'];
      const nf = order[(order.indexOf(f.face || 'n') + 1) % 4], cx = f.x + f.w / 2, cy = f.y + f.d / 2;
      const nw = f.d, nd = f.w, test = { ...f, w: nw, d: nd };
      if (!this._fits(test, cx - nw / 2, cy - nd / 2, g)) return;
      f.face = nf; f.w = nw; f.d = nd; f.x = cx - nw / 2; f.y = cy - nd / 2;
      g.rotation.y = ROT[nf]; if (g.userData.box) Object.assign(g.userData.box, { x1: f.x, y1: f.y, x2: f.x + f.w, y2: f.y + f.d }); this._save(g);
    }

    /* ---------------- walking ---------------- */
    _floorY(x, z) { const p = this.floor.rooms.find((r) => r.kind === 'pit'); if (!p) return 0; const px = x + this.floor.w / 2, py = z + this.floor.h / 2, [a, b, c, d] = p.r; const e = Math.min(px - a, c - px, py - b, d - py); return e <= 0 ? 0 : -0.45 * Math.min(1, e / 0.5); }
    _collide(x, z) {
      const OX = this.floor.w / 2, OZ = this.floor.h / 2, R = 0.27; let px = x + OX, py = z + OZ;
      for (let it = 0; it < 3; it++) {
        for (const s of this.col) { const vx = s.x2 - s.x1, vy = s.y2 - s.y1, L = vx * vx + vy * vy; let t = L ? ((px - s.x1) * vx + (py - s.y1) * vy) / L : 0; t = Math.max(0, Math.min(1, t)); const cx = s.x1 + vx * t, cy = s.y1 + vy * t; let dx = px - cx, dy = py - cy, dist = Math.hypot(dx, dy), min = R + s.r; if (dist < min) { if (dist < 1e-5) { dx = 1; dy = 0; dist = 1; } px = cx + (dx / dist) * min; py = cy + (dy / dist) * min; } }
        for (const b of this.boxes) { if (b.item && b.item.userData.f.t === 'pitbench') continue; const cx = Math.max(b.x1, Math.min(px, b.x2)), cy = Math.max(b.y1, Math.min(py, b.y2)); let dx = px - cx, dy = py - cy, dist = Math.hypot(dx, dy); if (dist < R) { if (dist < 1e-5) { const l = px - b.x1, r = b.x2 - px, u = py - b.y1, dn = b.y2 - py, mn = Math.min(l, r, u, dn); if (mn === l) px = b.x1 - R; else if (mn === r) px = b.x2 + R; else if (mn === u) py = b.y1 - R; else py = b.y2 + R; } else { px = cx + (dx / dist) * R; py = cy + (dy / dist) * R; } } }
        px = Math.max(0.3, Math.min(this.floor.w - 0.3, px)); py = Math.max(0.3, Math.min(this.floor.h - 0.3, py));
      }
      return [px - OX, py - OZ];
    }
    _walk(dt) {
      const p = this.player, k = this.keys; let f = 0, s = 0;
      if (k.KeyW || k.ArrowUp) f += 1; if (k.KeyS || k.ArrowDown) f -= 1; if (k.KeyD) s += 1; if (k.KeyA) s -= 1;
      if (k.ArrowLeft) p.yaw += dt * 1.9; if (k.ArrowRight) p.yaw -= dt * 1.9; if (k.KeyQ) p.yaw += dt * 1.9; if (k.KeyE) p.yaw -= dt * 1.9;
      f += -this.joy.y; s += this.joy.x;
      let vx = 0, vz = 0; const sp = (k.ShiftLeft || k.ShiftRight ? 3.6 : 2.0);
      if (f || s) { this.walkTo = null; const l = Math.max(1, Math.hypot(f, s)); f /= l; s /= l; vx = (-Math.sin(p.yaw) * f + Math.cos(p.yaw) * s) * sp; vz = (-Math.cos(p.yaw) * f - Math.sin(p.yaw) * s) * sp; }
      else if (this.walkTo) { const dx = this.walkTo.x - p.x, dz = this.walkTo.z - p.z, dist = Math.hypot(dx, dz); this.walkTo.t += dt; if (dist < 0.35 || this.walkTo.t > 7) this.walkTo = null; else { const v = Math.min(2.6, 0.8 + dist * 1.2); vx = (dx / dist) * v; vz = (dz / dist) * v; } }
      if (vx || vz) { const [nx, nz] = this._collide(p.x + vx * dt, p.z + vz * dt); if (this.walkTo && Math.hypot(nx - p.x, nz - p.z) < 0.004) { this.walkTo.t += dt * 6; } p.x = nx; p.z = nz; this._bob = (this._bob || 0) + dt * 7.5; }
      this._walkCam();
    }
    _walkCam() { const p = this.player, y = EYE + this._floorY(p.x, p.z) + (this.walkTo || this._moving ? Math.sin(this._bob || 0) * 0.012 : 0); this.camera.position.set(p.x, y, p.z); this.camera.rotation.set(p.pitch, p.yaw, 0, 'YXZ'); }
    _orbitCam() { const o = this.orbit, sp = Math.sin(o.phi); this.camera.position.set(o.target.x + o.radius * sp * Math.sin(o.theta), o.target.y + o.radius * Math.cos(o.phi), o.target.z + o.radius * sp * Math.cos(o.theta)); this.camera.lookAt(o.target); }
    /** player position in plan coordinates + heading (deg, 0 = north) */
    where() { return { x: this.player.x + this.floor.w / 2, y: this.player.z + this.floor.h / 2, yaw: (-this.player.yaw * 180) / Math.PI }; }
    roomAt(x, y) { const inside = (pts) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
      let best = null, area = 1e9; for (const r of this.floor.rooms) { const pts = roomPts(r); if (!inside(pts)) continue; const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); const A = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)); if (A < area) { area = A; best = r; } } return best; }

    _loop(now) {
      const dt = Math.min(0.1, (now - this._t) / 1000); this._t = now;
      if (this.el.offsetParent !== null && this.root) {
        if (this.tween) {
          const tw = this.tween; tw.t += dt / tw.dur; const e = ease(Math.min(1, tw.t));
          this.camera.position.lerpVectors(tw.from.p, tw.to.p, e); this.camera.quaternion.slerpQuaternions(tw.from.q, tw.to.q, e);
          this.camera.fov = tw.from.fov + (tw.to.fov - tw.from.fov) * e; this.camera.updateProjectionMatrix();
          if (tw.t >= 1) { this.tween = null; tw.done && tw.done(); }
        } else if (this.mode === 'doll') {
          const o = this.orbit, g = this.goal, k = 1 - Math.pow(0.004, dt);
          while (g.theta - o.theta > Math.PI) g.theta -= Math.PI * 2; while (o.theta - g.theta > Math.PI) g.theta += Math.PI * 2;
          o.theta += (g.theta - o.theta) * k; o.phi += (g.phi - o.phi) * k; o.radius += (g.radius - o.radius) * k; o.target.lerp(g.target, k); this._orbitCam();
        } else {
          this._walk(dt);
          if (this.cb.onWhere && (this._wt = (this._wt || 0) + dt) > 0.12) { this._wt = 0; this.cb.onWhere(this.where()); }
        }
        const m = mats(); if (m.water.normalMap) { m.water.normalMap.offset.x += dt * 0.02; m.water.normalMap.offset.y += dt * 0.012; }
        this._lastFov = this.camera.fov;
        if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
      }
      requestAnimationFrame(this._loop);
    }
  }
  window.World = World;
})();
