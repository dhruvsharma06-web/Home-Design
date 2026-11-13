/* 2D interactive floor plan (SVG). 1 m = 100 units. */
(function () {
  const S = 100;
  const NS = 'http://www.w3.org/2000/svg';
  const ROT = { n: 0, e: 90, s: 180, w: -90 };

  const roomPts = (r) => r.poly || [[r.r[0], r.r[1]], [r.r[2], r.r[1]], [r.r[2], r.r[3]], [r.r[0], r.r[3]]];
  const ptsAttr = (pts) => pts.map(([x, y]) => `${x * S},${y * S}`).join(' ');

  function roomCenter(r) {
    if (r.r) return [(r.r[0] + r.r[2]) / 2, (r.r[1] + r.r[3]) / 2];
    // largest rectangle approximation: bbox centre nudged to the polygon mass
    const xs = r.poly.map((p) => p[0]), ys = r.poly.map((p) => p[1]);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  }
  window.roomCenter = roomCenter;
  window.roomPts = roomPts;

  /* ---------- furniture icons, canonical: centred, back at -d/2 ---------- */
  function icon(f, w, d) {
    const hw = w / 2, hd = d / 2;
    const R = (x, y, ww, hh, cls = 'fu', rx = 4) => `<rect class="${cls}" x="${x}" y="${y}" width="${ww}" height="${hh}" rx="${rx}"/>`;
    switch (f.t) {
      case 'bed':
        return R(-hw, -hd, w, d, 'fu', 6) + R(-hw, -hd, w, 12, 'fu2', 3) +
          R(-hw + 10, -hd + 18, w / 2 - 15, 28, 'fu', 8) + R(5, -hd + 18, w / 2 - 15, 28, 'fu', 8) +
          `<path class="fu-line" d="M${-hw} ${-hd + d * 0.42} H${hw}"/>`;
      case 'sofa':
        return R(-hw, -hd, w, d, 'fu2', 10) + R(-hw + 12, -hd + 22, w - 24, d - 26, 'fu', 6) +
          `<path class="fu-line" d="M${-hw + 12 + (w - 24) / 3} ${-hd + 22} v${d - 26} M${-hw + 12 + (2 * (w - 24)) / 3} ${-hd + 22} v${d - 26}"/>`;
      case 'armchair': case 'lounge':
        return R(-hw, -hd, w, d, 'fu2', 14) + R(-hw + 10, -hd + 18, w - 20, d - 24, 'fu', 10);
      case 'lounger':
        return R(-hw, -hd, w, d, 'fu', 10) + R(-hw + 6, -hd + 6, w - 12, d * 0.3, 'fu2', 8);
      case 'nightstand': case 'sidetable': case 'stool':
        return f.t === 'stool' ? `<circle class="fu" r="${hw}"/>` : R(-hw, -hd, w, d, 'fu', 5);
      case 'coffee':
        return R(-hw, -hd, w, d, 'fu', 18);
      case 'rug':
        return R(-hw, -hd, w, d, 'rug', 3);
      case 'lawn':
        return R(-hw, -hd, w, d, 'lawn', 6);
      case 'tv': case 'tall': case 'wardrobe': case 'counter': case 'desk': case 'bench':
        return R(-hw, -hd, w, d, f.t === 'counter' || f.t === 'desk' ? 'fu-solid' : 'fu', 2) +
          (f.t === 'wardrobe' || f.t === 'tall' ? `<path class="fu-line" d="M${-hw} ${hd - 4} H${hw}"/>` : '') +
          (f.t === 'counter' ? `<rect class="fu" x="${-hw * 0.6}" y="${-hd + d * 0.3}" width="${w * 0.6}" height="${Math.min(d * 0.18, 60)}" rx="10"/>` : '');
      case 'island':
        return R(-hw, -hd, w, d, 'fu-solid', 3);
      case 'chair':
        return R(-hw, -hd, w, d, 'fu', 8);
      case 'dining': {
        const seats = f.seats || 6;
        let s = '';
        const tw = Math.min(w, d) === w ? w * 0.62 : w;
        // table oriented along the long side
        const long = d >= w;
        const TW = long ? w * 0.6 : w, TD = long ? d : d * 0.6;
        s += R(-TW / 2, -TD / 2, TW, TD, 'fu-solid', 6);
        const per = seats / 2;
        for (let i = 0; i < per; i++) {
          if (long) {
            const yy = -TD / 2 + (TD / per) * (i + 0.5) - 20;
            s += R(-TW / 2 - 44, yy, 38, 40, 'fu', 8) + R(TW / 2 + 6, yy, 38, 40, 'fu', 8);
          } else {
            const xx = -TW / 2 + (TW / per) * (i + 0.5) - 20;
            s += R(xx, -TD / 2 - 44, 40, 38, 'fu', 8) + R(xx, TD / 2 + 6, 40, 38, 'fu', 8);
          }
        }
        return s;
      }
      case 'wc':
        return R(-hw + 4, -hd, w - 8, 14, 'fu', 3) + `<ellipse class="fu" cx="0" cy="${8}" rx="${hw - 6}" ry="${hd - 10}"/>`;
      case 'basin':
        return R(-hw, -hd, w, d, 'fu', 4) + `<ellipse class="fu2" cx="0" cy="3" rx="${hw - 10}" ry="${hd - 12}"/>`;
      case 'tub':
        return R(-hw, -hd, w, d, 'fu', 6) + R(-hw + 8, -hd + 8, w - 16, d - 16, 'fu2', 30);
      case 'shower':
        return R(-hw, -hd, w, d, 'shower', 2) + `<circle class="fu" r="6"/>`;
      case 'plant':
        return `<circle class="plant" r="${Math.min(hw, hd)}"/><circle class="plant2" r="${Math.min(hw, hd) * 0.5}"/>`;
      case 'planter':
        return R(-hw, -hd, w, d, 'planter', 4);
      case 'car':
        return R(-hw, -hd, w, d, 'car', 40) + R(-hw + 18, -hd + d * 0.28, w - 36, d * 0.42, 'car2', 18);
      case 'liftcar':
        return R(-hw, -hd, w, d, 'lift', 0) + `<path class="fu-line" d="M${-hw} ${-hd} L${hw} ${hd} M${hw} ${-hd} L${-hw} ${hd}"/>`;
      case 'stairs': {
        const n = f.steps || 10;
        let s = R(-hw, -hd, w, d, 'stairbg', 0);
        for (let i = 1; i < n; i++) s += `<path class="fu-line" d="M${-hw} ${-hd + (d / n) * i} H${hw}"/>`;
        s += `<path class="arrow" d="M0 ${hd - 10} V${-hd + 18} m-10 14 l10 -14 l10 14"/>`;
        return s;
      }
      case 'mandir':
        return R(-hw, -hd, w, d, 'mandir', 3) + `<circle class="diya" cx="0" cy="${-hd + 18}" r="7"/>`;
      case 'gate':
        return R(-hw, -hd, w, d, 'gate', 0);
      case 'tank':
        return R(-hw, -hd, w, d, 'tank', 4);
      case 'pool':
        return R(-hw, -hd, w, d, 'pool', 6) + R(-hw + 12, -hd + 12, w - 24, d - 24, 'pool2', 4) +
          R(-hw + 12, -hd + 12, 45, d - 24, 'poolstep', 2);
      case 'pergola': {
        let s = R(-hw, -hd, w, d, 'pergola', 0);
        for (let x = -hw + 20; x < hw; x += 30) s += `<path class="slat" d="M${x} ${-hd} V${hd}"/>`;
        return s;
      }
      case 'verna':
        return R(-hw, -hd, w, d, 'verna', 40) + R(-hw + 16, -hd + d * 0.36, w - 32, d * 0.36, 'verna2', 16) +
          `<path class="led" d="M${-hw + 14} ${hd - 6} H${hw - 14}"/><path class="ledr" d="M${-hw + 14} ${-hd + 5} H${hw - 14}"/>`;
      case 'pitbench':
        return R(-hw, -hd, w, d, 'fu-solid', 3) + R(-hw + 4, -hd + 4, w - 8, 14, 'fu2', 3);
      case 'firetable':
        return `<circle class="fu-solid" r="${hw}"/><circle class="diya" r="${hw * 0.25}"/>`;
      case 'pitsteps': {
        let t = R(-hw, -hd, w, d, 'fu', 0);
        t += `<path class="fu-line" d="M${-hw} 0 H${hw}"/>`;
        return t;
      }
      case 'aasan':
        return R(-hw, -hd, w, d, 'rug', 4);
      case 'featurewall':
        return R(-hw, -hd, w, d, 'feature', 0);
      case 'vineplanter':
        return R(-hw, -hd, w, d, 'planter', 2);
      case 'fins': {
        let t = '';
        for (let y = -hd + 10; y < hd; y += 22) t += `<path class="fin" d="M${-hw} ${y} H${hw}"/>`;
        return t;
      }
      case 'curtain':
        return `<path class="curtain" d="M${-hw} 0 ${Array.from({ length: Math.max(2, Math.round(w / 18)) }, (_, i) => `q ${w / Math.max(2, Math.round(w / 18)) / 2} ${i % 2 ? 6 : -6} ${w / Math.max(2, Math.round(w / 18))} 0`).join(' ')}"/>`;
      case 'floorlamp':
        return `<circle class="lamp" r="${hw}"/><circle class="lamp2" r="${hw * 0.35}"/>`;
      case 'vase':
        return `<circle class="plant" r="${hw}"/>`;
      default:
        return R(-hw, -hd, w, d);
    }
  }

  function furnSVG(f) {
    const face = f.face || 'n';
    const rot = ROT[face];
    const swap = face === 'e' || face === 'w';
    const cw = (swap ? f.d : f.w) * S, cd = (swap ? f.w : f.d) * S;
    const cx = (f.x + f.w / 2) * S, cy = (f.y + f.d / 2) * S;
    return `<g class="furn ${f.onRoof ? 'onroof' : ''}" transform="translate(${cx} ${cy}) rotate(${rot})">${icon(f, cw, cd)}</g>`;
  }

  function wallSVG([x1, y1, x2, y2, t = 'w']) {
    const a = `x1="${x1 * S}" y1="${y1 * S}" x2="${x2 * S}" y2="${y2 * S}"`;
    if (t === 'd') return '';
    if (t === 'g' || t === 'win' || t === 'gp') return `<line class="w-glass-o" ${a}/><line class="w-glass-i" ${a}/>`;
    if (t === 'r') return `<line class="w-rail" ${a}/>`;
    if (t === 'c') return `<line class="w-comp" ${a}/>`;
    if (t === 'j') return `<line class="w-jali" ${a}/>`;
    return `<line class="w-wall" ${a}/>`;
  }

  function render(container, floor, handlers, opts = {}) {
    const pad = 70;
    const W = floor.w * S, H = floor.h * S;
    const extraTop = floor.id === 'g' ? 40 : 0;
    // landscape stage → rotate the plan (north to the left) so it fills the space
    const rot = opts.rot === undefined ? container.clientWidth > container.clientHeight * 1.05 : opts.rot;
    const vb = rot
      ? `${-pad - extraTop} ${-W - pad} ${H + pad * 2 + extraTop} ${W + pad * 2}`
      : `${-pad} ${-pad - extraTop} ${W + pad * 2} ${H + pad * 2 + extraTop}`;
    const un = rot ? ' rotate(90)' : '';

    let s = `<svg xmlns="${NS}" viewBox="${vb}" class="plan-svg" role="img" aria-label="${floor.title} plan"><g transform="${rot ? 'rotate(-90)' : ''}">`;
    s += `<defs>
      <pattern id="hatch" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="16" stroke="#b9afa2" stroke-width="2"/></pattern>
    </defs>`;

    // site / slab
    s += `<rect class="slab" x="0" y="0" width="${W}" height="${H}"/>`;
    if (opts.mini) { /* no captions */ } else if (floor.id === 'g') {
      s += `<rect class="footprint" x="${1.5 * S}" y="${3 * S}" width="${6.75 * S}" height="${15.5 * S}"/>`;
      s += `<text class="road" x="${W / 2}" y="${-pad + 10}">R O A D</text>`;
    } else {
      s += `<text class="road" x="${W / 2}" y="${-pad + 30}">FRONT · ROAD SIDE</text>`;
    }

    // rooms
    s += '<g class="rooms">';
    for (const r of floor.rooms) {
      s += `<polygon class="room k-${r.kind || 'in'}" data-id="${r.id}" points="${ptsAttr(roomPts(r))}"/>`;
    }
    s += '</g>';

    // furniture
    s += '<g class="furns">' + floor.furn.map(furnSVG).join('') + '</g>';

    // columns
    if (floor.columns) {
      s += '<g>' + floor.columns.map(([x, y]) => `<rect class="col" x="${x * S}" y="${y * S}" width="30" height="58"/>`).join('') + '</g>';
    }

    // walls
    s += '<g class="walls">' + floor.walls.map(wallSVG).join('') + '</g>';

    // labels
    s += '<g class="labels">';
    for (const r of floor.rooms) {
      if (r.kind === 'core' && /lift|lobby/i.test(r.name) && floor.id !== 'g') continue;
      const [cx, cy] = r.label || roomCenter(r);
      const pts = roomPts(r);
      const bw = Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0]));
      const small = bw < 1.9;
      s += `<g class="lbl" data-id="${r.id}" transform="translate(${cx * S} ${cy * S})${un}">
        <text class="lbl-name ${small ? 'sm' : ''}" y="${r.size && !small ? -4 : 4}">${r.name.replace('&', '&amp;')}</text>
        ${r.size && !small ? `<text class="lbl-size" y="16">${r.size}</text>` : ''}
      </g>`;
    }
    s += '</g>';

    s += `<g class="me" id="planMe" style="display:none"><path d="M0 -46 L26 30 L0 14 L-26 30Z"/></g>`;
    // hit layer
    s += '<g class="hits">';
    for (const r of floor.rooms) s += `<polygon class="hit" data-id="${r.id}" points="${ptsAttr(roomPts(r))}"><title>${r.name}</title></polygon>`;
    s += '</g>';

    // north arrow + scale
    s += `<g class="north" transform="translate(${W + pad / 2} ${-pad / 2 - extraTop + 20})">
      <circle r="18"/><path d="M0 -14 L7 8 L0 3 L-7 8Z"/><text y="34" transform="${rot ? 'rotate(90 0 30)' : ''}">N</text></g>`;
    s += `<g class="scale" transform="translate(0 ${H + 40})">
      <rect width="100" height="6"/><rect x="100" width="100" height="6" class="alt"/>
      <text x="0" y="24">0</text><text x="100" y="24">1</text><text x="200" y="24">2 m</text></g>`;
    s += '</g></svg>';

    container.innerHTML = s;
    const svg = container.querySelector('svg');

    svg.querySelectorAll('.hit').forEach((el) => {
      el.addEventListener('mouseenter', () => handlers.onHover && handlers.onHover(el.dataset.id));
      el.addEventListener('mouseleave', () => handlers.onHover && handlers.onHover(null));
      el.addEventListener('click', () => handlers.onSelect && handlers.onSelect(el.dataset.id));
    });

    return {
      setMe(x, y, yaw) { const me = svg.querySelector('#planMe'); if (!me) return; me.style.display = ''; me.setAttribute('transform', `translate(${x * S} ${y * S}) rotate(${yaw})`); },
      highlight(id, selected) {
        svg.querySelectorAll('.room').forEach((el) => {
          el.classList.toggle('hover', el.dataset.id === id);
          el.classList.toggle('sel', el.dataset.id === selected);
        });
      },
    };
  }

  window.Plan2D = { render };
})();
