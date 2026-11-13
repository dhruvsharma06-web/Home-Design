/* ------------------------------------------------------------------
   B4 · GODREJ HILLVIEW · KHOPOLI — house data
   Source: "Layout for all floors.pdf" (Amit Gurav | Architecture), the B4
   feature documents, Stones BOQ, Godrej kitchen set, lift + AC schedules.
   Units: metres. Origin = north-west corner, x → east, y → south.
   North / road is at the top (y = 0).
   Floors 1–3 + terrace: building footprint 6.75 × 15.50.
   Stilt: full plot 9.75 × 19.00 (building footprint sits at x 1.5, y 3.0).

   walls: [x1,y1,x2,y2,type,opts]
     'w' wall · 'g' full-height glazing · 'win' window {s:sill,h:head}
     'd' door opening (walk through) · 'r' glass railing · 'gp' glass partition
     'c' compound wall · 'j' slatted screen
   furn:  { t, x, y, w, d, face }  x,y = top-left, w along x, d along y,
           face = side the back sits against (n|s|e|w)
------------------------------------------------------------------- */
const H = 2.9; // clear height

const N = {
  bath: 'Kota Brown stone: leather-finish on the floor, polished on the walls. Kohler wall-hung WC and basin, a frameless glass shower screen and a backlit mirror.',
  lift: 'Kapoor Elevators passenger lift for 3 persons (204 kg), stilt to third floor, four stops opening on the same side. Stainless-steel hairline cabin, 750 × 700 mm inside, with an SS collapsible door, LED ceiling and cabin fan.',
  stair: 'Dog-leg staircase in Kota Brown, matte finish, with a slim metal railing. It runs beside the lift from the stilt up to the terrace.',
  lobby: 'The landing between lift, stair and the west-facing residence door. Spanish Beige marble, warm white walls, nothing else.',
  bed2: 'South-west bedroom. Upholstered bed in greige, a study desk at the south glazing, Godrej Kreation wardrobe. It opens onto its own bath through a glass partition, with a walk-in wardrobe beside it.',
  balcony: 'Open balcony 1.50 m wide in Kota Green, raw finish, with a TOSTEM glass railing, two chairs and planters.',
  kitchen: 'Godrej modular kitchen with a polished black granite counter. Hob, chimney and sink run along the east wall under the window. All units are soft-close with a 100 mm skirting.',
  powder: 'Guest toilet, 2.20 × 1.00 m. As the drawing notes, its door is hidden within the cupboard shutters, so the dining side reads as one clean wall.',
  wiw: 'Walk-in wardrobe between the bath and Bedroom 2, with Godrej Kreation X3 modules: hanging, shelves and drawers.',
};

/* ---------------- shared west core (floors 1–3) ---------------- */
const CORE = {
  rooms: [
    { id: 'bath1', name: 'Bath · Bedroom 1', size: '1.23 × 1.70 m', r: [0, 3.75, 1.38, 5.6], kind: 'wet', notes: N.bath },
    { id: 'lift', name: 'Lift', size: '1.10 × 1.20 m shaft', r: [0, 5.6, 1.53, 7.1], kind: 'core', notes: N.lift },
    { id: 'stair', name: 'Staircase', size: 'Kota Brown', r: [1.53, 3.75, 3.42, 7.1], kind: 'stair', notes: N.stair },
    { id: 'lobby', name: 'Lobby', size: '1.00 m landing', r: [0, 7.1, 3.42, 8.15], kind: 'core', notes: N.lobby },
    { id: 'powder', name: 'Guest Toilet', size: '2.20 × 1.00 m', r: [0, 8.15, 2.5, 9.3], kind: 'wet', notes: N.powder },
    { id: 'bath2', name: 'Bath · Bedroom 2', size: '1.50 × 1.90 m', poly: [[0, 9.3], [2.85, 9.3], [2.85, 10.35], [1.6, 10.35], [1.6, 11.4], [0, 11.4]], kind: 'wet', label: [1.2, 9.85], notes: N.bath + ' A bathtub sits behind the glass partition, and the washing machine has its own niche.' },
    { id: 'wiw', name: 'Walk-in Wardrobe', size: '1.55 × 1.90 m', r: [1.6, 10.35, 3.42, 11.4], kind: '', notes: N.wiw },
    { id: 'bed2', name: 'Bedroom 2', size: '3.20 × 3.90 m', r: [0, 11.4, 3.42, 15.5], kind: '', notes: N.bed2, cam: { from: [3.0, 15.0, 1.5], to: [0.8, 12.4, 0.9] } },
  ],
  walls: [
    // west exterior with windows as drawn (W6, ventilators, W9, W7)
    [0, 0, 0, 3.1], [0, 3.1, 0, 3.7, 'win', { s: 0.9, h: 2.4 }], [0, 3.7, 0, 4.6], [0, 4.6, 0, 5.4, 'win', { s: 1.8, h: 2.4 }],
    [0, 5.4, 0, 7.15], [0, 7.15, 0, 8.0, 'win', { s: 0.9, h: 2.4 }], [0, 8.0, 0, 8.35], [0, 8.35, 0, 9.15, 'win', { s: 1.8, h: 2.4 }],
    [0, 9.15, 0, 9.7], [0, 9.7, 0, 10.6, 'win', { s: 1.8, h: 2.4 }], [0, 10.6, 0, 11.5], [0, 11.5, 0, 12.1, 'win', { s: 0.9, h: 2.4 }], [0, 12.1, 0, 15.5],
    // bath 1
    [0, 3.75, 0.2, 3.75], [0.2, 3.75, 0.95, 3.75, 'd'], [0.95, 3.75, 3.42, 3.75], [1.38, 3.75, 1.38, 5.6],
    // lift shaft
    [0, 5.6, 1.53, 5.6], [1.53, 5.6, 1.53, 7.1], [0, 7.1, 0.3, 7.1], [0.3, 7.1, 1.15, 7.1, 'd'], [1.15, 7.1, 1.53, 7.1],
    // stair + residence door (west-facing)
    [3.42, 3.75, 3.42, 7.2], [3.42, 7.2, 3.42, 8.1, 'd'], [3.42, 8.1, 3.42, 8.15],
    // guest toilet (door hidden in cupboard shutters)
    [0, 8.15, 3.42, 8.15], [2.5, 8.15, 2.5, 8.3], [2.5, 8.3, 2.5, 9.1, 'd'], [2.5, 9.1, 2.5, 9.3],
    [0, 9.3, 2.85, 9.3], [2.85, 9.3, 2.85, 10.35],
    // bath 2 + walk-in wardrobe
    [1.6, 10.35, 3.42, 10.35], [1.6, 10.35, 1.6, 10.6], [1.6, 10.6, 1.6, 11.3, 'd'], [1.6, 11.3, 1.6, 11.4],
    [0, 11.4, 0.85, 11.4, 'gp'], [0.85, 11.4, 1.6, 11.4, 'd'], [1.6, 11.4, 2.3, 11.4], [2.3, 11.4, 3.2, 11.4, 'd'], [3.2, 11.4, 3.42, 11.4],
    [3.42, 10.35, 3.42, 12.4], [3.42, 12.4, 3.42, 13.3, 'd'], [3.42, 13.3, 3.42, 15.5],
    // south
    [0, 15.5, 3.42, 15.5, 'g'], [3.42, 15.5, 6.75, 15.5, 'r'],
    [3.42, 13.85, 4.5, 13.85, 'g'], [4.5, 13.85, 5.7, 13.85, 'd'], [5.7, 13.85, 6.75, 13.85, 'g'],
  ],
  furn: [
    { t: 'wc', x: 0.08, y: 4.85, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 0.08, y: 3.9, w: 0.45, d: 0.5, face: 'w' }, { t: 'shower', x: 0.62, y: 4.72, w: 0.72, d: 0.84 },
    { t: 'liftcar', x: 0.22, y: 5.82, w: 1.05, d: 1.1 },
    { t: 'wc', x: 0.08, y: 8.5, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 1.75, y: 8.2, w: 0.55, d: 0.42, face: 'n' },
    { t: 'tall', x: 2.56, y: 8.22, w: 0.5, d: 1.02, face: 'w', tone: 'white' },
    { t: 'wc', x: 0.08, y: 9.45, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 1.15, y: 9.35, w: 0.55, d: 0.42, face: 'n' },
    { t: 'washer', x: 2.2, y: 9.36, w: 0.6, d: 0.6, face: 'n' },
    { t: 'tub', x: 0.06, y: 10.55, w: 1.48, d: 0.78 },
    { t: 'wardrobe', x: 1.68, y: 10.4, w: 1.7, d: 0.5, face: 'n' },
    { t: 'bed', x: 0.06, y: 12.5, w: 2.05, d: 1.6, face: 'w' },
    { t: 'nightstand', x: 0.06, y: 12.0, w: 0.45, d: 0.42 }, { t: 'nightstand', x: 0.06, y: 14.18, w: 0.45, d: 0.42 },
    { t: 'wardrobe', x: 2.8, y: 13.45, w: 0.6, d: 1.8, face: 'e' },
    { t: 'desk', x: 0.5, y: 14.85, w: 1.2, d: 0.55, face: 's' }, { t: 'chair', x: 0.86, y: 14.3, w: 0.48, d: 0.5, face: 'n' },
    { t: 'rug', x: 0.9, y: 12.15, w: 1.75, d: 2.3 },
    { t: 'curtain', x: 0.12, y: 15.34, w: 3.2, d: 0.1, face: 's' },
    { t: 'fridge', x: 2.87, y: 9.45, w: 0.55, d: 0.75, face: 'w' },
    // balcony
    { t: 'planter', x: 3.5, y: 15.05, w: 3.15, d: 0.38 },
    { t: 'lounge', x: 3.85, y: 14.1, w: 0.72, d: 0.72, face: 's' }, { t: 'lounge', x: 5.4, y: 14.1, w: 0.72, d: 0.72, face: 's' }, { t: 'sidetable', x: 4.78, y: 14.25, w: 0.4, d: 0.4 },
    // façade
    { t: 'vineplanter', x: 0, y: -0.45, w: 3.42, d: 0.42 }, { t: 'vineplanter', x: 0, y: 15.53, w: 3.42, d: 0.42 },
    { t: 'fins', x: 6.8, y: 2.35, w: 0.4, d: 1.5 }, { t: 'fins', x: 6.8, y: 12.8, w: 0.4, d: 1.0 }, { t: 'fins', x: -0.42, y: 0.2, w: 0.4, d: 2.8 },
  ],
};

const EAST = (dbl) => [
  [6.75, 0, 6.75, 0.15], [6.75, 0.15, 6.75, 2.25, 'g', dbl ? { hh: 5.8 } : undefined], [6.75, 2.25, 6.75, 3.93],
  [6.75, 3.93, 6.75, 6.88, 'win', { s: 0.6, h: 2.5 }], [6.75, 6.88, 6.75, 7.29], [6.75, 7.29, 6.75, 9.95, 'win', { s: 0.6, h: 2.5 }],
  [6.75, 9.95, 6.75, 10.1], [6.75, 10.1, 6.75, 12.75, 'win', { s: 1.1, h: 2.3 }], [6.75, 12.75, 6.75, 13.85], [6.75, 13.85, 6.75, 15.5, 'r'],
];

const LIVING = (y0) => [
  { t: 'rug', x: 3.95, y: y0 + 0.2, w: 2.3, d: 2.9 },
  { t: 'tv', x: 3.48, y: y0 + 0.75, w: 0.42, d: 1.8, face: 'w' },
  { t: 'sofa', x: 5.78, y: y0 + 0.5, w: 0.92, d: 2.3, face: 'e' },
  { t: 'coffee', x: 4.55, y: y0 + 1.1, w: 0.65, d: 1.1 },
  { t: 'armchair', x: 4.4, y: y0 + 2.85, w: 0.82, d: 0.85, face: 's' },
  { t: 'floorlamp', x: 5.95, y: y0 + 2.95, w: 0.35, d: 0.35 },
  { t: 'plant', x: 3.6, y: y0 + 3.0, w: 0.5, d: 0.5 },
];

window.FLOORS = [
  /* ============================ STILT ============================ */
  {
    id: 'g', level: 0, short: 'G', title: 'Stilt', tag: 'Arrival · Conversation Pit · South Garden',
    w: 9.75, h: 19.0, openAir: true, drawing: 'assets/drawings/gf.png',
    roof: [1.5, 3.0, 8.25, 18.5],
    orbit: { theta: -0.8, phi: 0.95 },
    spawn: { from: [8.2, 1.2, 180], to: [6.6, 9.2, 215] },
    summary: 'The stilt is the villa’s first open-air living level. You arrive at the north court, where the black Verna parks inside the north-east gate. The lift and stair core sits in the middle, with a fountain on its east face in the plane of the sandstone shear wall. Behind it a 1.5 ft sunken conversation pit faces a projector wall, and the ~500 sq ft south garden opens toward the club-side landscape.',
    stats: [['Plot', '9.75 × 19.00 m · ≈ 2,000 sq ft'], ['Conversation pit', '1.5 ft sunken'], ['South garden', '≈ 500 sq ft']],
    slabHoles: [[1.75, 11.15, 4.85, 13.85]],
    rooms: [
      { id: 'court', name: 'North Arrival Court', size: '9.75 × 5.75 m', r: [0, 0, 9.75, 5.75], kind: 'pave', notes: 'Grey limestone, raw finish, in 2 × 2 ft slabs. The 12,750 litre underground water tank sits below the court. The black Hyundai Verna parks here, straight in from the north-east gate.', cam: { from: [8.9, 0.9, 1.6], to: [3.4, 4.6, 0.8] } },
      { id: 'water', name: 'Fountain', size: 'East face of the core', r: [5.1, 6.2, 6.3, 8.8], kind: 'out', notes: 'A water-curtain fountain on the eastern side of the core, set in the same plane as the fluted sandstone shear wall. Water runs down the stone into a pebble trough, lit warm from below, with a planter on each side.', cam: { from: [8.4, 8.9, 1.6], to: [5.2, 7.5, 1.3] } },
      { id: 'passage', name: 'East Walk', size: '3.15 m wide', r: [5.1, 5.75, 9.75, 10.2], kind: 'out', notes: 'Yellow limestone walk from the arrival court to the garden, past the east-facing core threshold. Floating stone steps rise to the lift lobby at +0.90.' },
      { id: 'westwalk', name: 'West Planted Walk', size: '1.50 m wide', r: [0, 5.75, 1.53, 10.2], kind: 'lawn', notes: 'A planted buffer along the west boundary with bamboo screening.' },
      { id: 'gtoilet', name: 'Toilet', size: '1.23 × 1.70 m', r: [1.53, 5.75, 2.93, 7.6], kind: 'wet', notes: N.bath },
      { id: 'glift', name: 'Lift', size: '1.10 × 1.20 m shaft', r: [1.53, 7.6, 3.05, 9.1], kind: 'core', notes: N.lift },
      { id: 'gstair', name: 'Staircase', size: 'Kota Brown', r: [3.05, 5.75, 5.0, 9.1], kind: 'stair', notes: N.stair },
      { id: 'globby', name: 'Lift Lobby', size: '+0.90 m', r: [1.53, 9.1, 5.1, 10.2], kind: 'core', notes: 'A foyer-like pavilion at +0.90 that keeps the sanctioned stilt open. The core’s east shear wall is clad in fluted pink sandstone, with the fountain set into the same plane.' },
      { id: 'pavilion', name: 'Pavilion Deck', size: 'Yellow limestone', r: [1.53, 10.2, 9.75, 14.3], kind: 'out', holes: [[1.75, 11.15, 4.85, 13.85]], notes: 'The covered heart of the stilt, in raw yellow limestone with columns clad in leather-finish grey limestone. Warm stone, planting and light are used in place of walls.' },
      { id: 'pit', name: 'Conversation Pit', size: '3.10 × 2.70 m · 1.5 ft sunken', r: [1.75, 11.15, 4.85, 13.85], kind: 'pit', notes: 'Only 1.5 ft down, so it is easy to step into. A U of built-in seating with greige cushions surrounds a linear gas fire table. It faces the projector wall on the core for movie nights, and opens to the garden on the south.', cam: { from: [5.6, 13.9, 1.5], to: [3.0, 11.6, 0.3] } },
      { id: 'garden', name: 'South Garden', size: '≈ 500 sq ft', r: [0, 14.3, 9.75, 19.0], kind: 'lawn', notes: 'A private lawn under and beyond the house, with a stepping-stone path around its edge. Excavation boulders are reused as seats and side tables, a stone bench sits in the south-west, and bamboo and palms screen the boundary.', cam: { from: [8.6, 14.9, 1.6], to: [2.2, 17.6, 0.5] } },
      { id: 'weststrip', name: 'West Garden Edge', size: 'Planted', r: [0, 10.2, 1.53, 14.3], kind: 'lawn', notes: 'A vertical green screen and planting beside the conversation pit.' },
    ],
    walls: [
      [0, 0, 6.45, 0, 'c'], [0, 0, 0, 19, 'c'], [9.75, 0, 9.75, 19, 'c'], [0, 19, 9.75, 19, 'c'],
      // core
      [1.53, 5.75, 5.0, 5.75], [1.53, 5.75, 1.53, 10.2], [2.93, 5.75, 2.93, 6.6], [2.93, 6.6, 2.93, 7.4, 'd'], [2.93, 7.4, 2.93, 7.6], [1.53, 7.6, 3.05, 7.6],
      [3.05, 7.6, 3.05, 9.1], [1.53, 9.1, 1.85, 9.1], [1.85, 9.1, 2.7, 9.1, 'd'], [2.7, 9.1, 3.05, 9.1],
      [5.0, 5.75, 5.0, 9.1], [1.53, 10.2, 5.1, 10.2], [5.1, 9.1, 5.1, 9.2], [5.1, 9.2, 5.1, 10.1, 'd'], [5.1, 10.1, 5.1, 10.2],
    ],
    columns: [[1.53, 3.0], [7.95, 3.0], [7.95, 10.1], [4.83, 14.5], [1.53, 14.5], [7.95, 14.5], [1.53, 17.9], [4.71, 17.9], [7.95, 17.9]],
    furn: [
      { t: 'gate', x: 6.45, y: -0.05, w: 3.3, d: 0.1 },
      { t: 'verna', x: 2.6, y: 0.75, w: 1.76, d: 4.54, face: 's' },
      { t: 'fountain', x: 5.06, y: 6.4, w: 0.5, d: 2.2, face: 'w' },
      { t: 'plant', x: 5.12, y: 5.82, w: 0.5, d: 0.5 }, { t: 'plant', x: 5.12, y: 8.68, w: 0.5, d: 0.5 },
      { t: 'tankcover', x: 1.6, y: 0.6, w: 0.7, d: 0.7 }, { t: 'tankcover', x: 5.9, y: 0.6, w: 0.7, d: 0.7 },
      { t: 'planter', x: 0.2, y: 0.2, w: 6.1, d: 0.45, dense: true },
      { t: 'liftcar', x: 1.77, y: 7.82, w: 1.05, d: 1.1 },
      { t: 'wc', x: 1.6, y: 6.75, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 1.6, y: 5.9, w: 0.45, d: 0.5, face: 'w' },
      { t: 'shearwall', x: 5.0, y: 5.75, w: 0.14, d: 3.4, face: 'w' },
      { t: 'floatsteps', x: 5.15, y: 9.25, w: 1.5, d: 0.8 },
      { t: 'screen', x: 2.05, y: 10.22, w: 2.6, d: 0.06, face: 'n' },
      { t: 'pitbench', x: 1.75, y: 11.6, w: 0.6, d: 2.25, face: 'w', base: -0.45 },
      { t: 'pitbench', x: 2.35, y: 13.25, w: 1.9, d: 0.6, face: 's', base: -0.45 },
      { t: 'pitbench', x: 4.25, y: 11.6, w: 0.6, d: 2.25, face: 'e', base: -0.45 },
      { t: 'firetable', x: 2.75, y: 12.0, w: 1.1, d: 0.6, base: -0.45 },
      { t: 'pitsteps', x: 2.6, y: 11.15, w: 1.4, d: 0.45, base: -0.45 },
      { t: 'greenwall', x: 0.25, y: 10.6, w: 0.3, d: 3.4, face: 'w' },
      { t: 'bamboo', x: 0.25, y: 14.6, w: 0.5, d: 3.8 }, { t: 'bamboo', x: 0.3, y: 6.0, w: 0.5, d: 3.8 },
      { t: 'boulder', x: 0.9, y: 17.7, w: 0.9, d: 0.8 }, { t: 'boulder', x: 1.9, y: 18.1, w: 0.6, d: 0.55 }, { t: 'boulder', x: 0.7, y: 16.7, w: 0.55, d: 0.5 },
      { t: 'bench', x: 2.3, y: 16.4, w: 1.5, d: 0.45, stone: true },
      { t: 'stepstones', x: 0.9, y: 14.6, w: 8.2, d: 4.0 },
      { t: 'palm', x: 8.6, y: 15.2, w: 0.8, d: 0.8 }, { t: 'palm', x: 8.7, y: 17.6, w: 0.8, d: 0.8 }, { t: 'palm', x: 5.9, y: 18.0, w: 0.8, d: 0.8 }, { t: 'palm', x: 3.4, y: 18.0, w: 0.7, d: 0.7 },
      { t: 'shrub', x: 5.8, y: 15.6, w: 1.6, d: 1.2 }, { t: 'shrub', x: 3.2, y: 15.2, w: 1.2, d: 0.9 }, { t: 'shrub', x: 8.7, y: 6.4, w: 0.8, d: 3.2 }, { t: 'shrub', x: 8.9, y: 10.6, w: 0.6, d: 3.4 },
      { t: 'plant', x: 5.3, y: 10.4, w: 0.55, d: 0.55 }, { t: 'plant', x: 7.2, y: 5.0, w: 0.55, d: 0.55 },
      { t: 'lounge', x: 6.3, y: 12.2, w: 0.75, d: 0.75, face: 'e' }, { t: 'lounge', x: 6.3, y: 13.2, w: 0.75, d: 0.75, face: 'e' }, { t: 'sidetable', x: 6.5, y: 11.6, w: 0.42, d: 0.42 },
    ],
  },

  /* ============================ FIRST ============================ */
  {
    id: 'f1', level: 1, short: '1', title: 'First Floor', tag: 'Residence · Mandir · 2 Bedrooms',
    w: 6.75, h: 15.5, drawing: 'assets/drawings/ff.png',
    spawn: { from: [3.75, 7.65, 80], to: [4.7, 6.6, 20] },
    summary: 'A two-bedroom residence entered from the lift lobby through a west-facing door. The whole east side is one open run: living at the front with the Mandir in the north-east corner, dining in the middle, and the south-east kitchen opening to the rear balcony.',
    stats: [['Footprint', '6.75 × 15.50 m'], ['Bedrooms', '2'], ['Mandir', 'North-east corner']],
    rooms: [
      { id: 'bed1', name: 'Bedroom 1', size: '3.20 × 3.60 m', r: [0, 0, 3.42, 3.75], kind: '', notes: 'North-west bedroom with the 1.0 m enclosed balcony zone along the front glass as a window seat. Upholstered bed, Godrej Kreation wardrobe on the south wall, sheer curtains, and its own bath.', cam: { from: [3.0, 3.3, 1.5], to: [0.9, 1.2, 0.9] } },
      { id: 'living', name: 'Living', size: '3.10 × 4.92 m', poly: [[3.42, 0], [5.3, 0], [5.3, 1.75], [6.75, 1.75], [6.75, 5.6], [3.42, 5.6]], label: [4.9, 3.6], kind: '', notes: 'Spanish Beige marble underfoot and warm white walls. A long greige sofa sits under the east window, with one armchair, a stone coffee table and a low TV wall. Light comes from the north glazing and a warm cove.', cam: { from: [3.9, 5.3, 1.5], to: [6.0, 1.8, 1.0] } },
      { id: 'mandir', name: 'Mandir', size: 'North-east corner', r: [5.3, 0, 6.75, 1.75], kind: '', notes: 'In the north-east corner of the first floor. A white marble shrine stands on the east wall, so you face east in prayer. It has a fluted stone back panel with a warm concealed light and a brass diya ledge, The temple is its own small room: slatted partitions close it on the west and south, with an opening on the south side to step in.', cam: { from: [5.75, 3.3, 1.5], to: [6.3, 0.8, 1.2] } },
      { id: 'dining', name: 'Dining', size: '3.10 × 3.75 m', r: [3.42, 5.6, 6.75, 9.35], kind: '', notes: 'A six-seat dining table where the drawing places it, between living and kitchen, under a slim linear pendant. The residence door from the lobby opens here.', cam: { from: [3.8, 5.9, 1.5], to: [5.6, 8.6, 0.8] } },
      { id: 'kitchen', name: 'Kitchen + Dining', size: '3.10 × 4.50 m', r: [3.42, 9.35, 6.75, 13.85], label: [4.7, 12.3], kind: '', notes: N.kitchen + ' Built to the Godrej drawing for this floor: a 3.0 m run on the east wall with a 1.2 m return facing the dining table. Base units are 700 mm on a 100 mm skirting with a 43 mm counter, and the wall units sit 600 mm above.', cam: { from: [3.8, 13.4, 1.5], to: [6.2, 10.6, 1.0] } },
      { id: 'balcony', name: 'Balcony', size: '2.95 × 1.50 m', r: [3.42, 13.85, 6.75, 15.5], kind: 'bal', notes: N.balcony },
      ...CORE.rooms,
    ],
    walls: [
      [0, 0, 6.75, 0, 'g'], ...EAST(false),
      [3.42, 0, 3.42, 2.35], [3.42, 2.35, 3.42, 3.25, 'd'], [3.42, 3.25, 3.42, 3.75],
      [5.3, 0.06, 5.3, 1.75, 'j'], [5.3, 1.75, 5.7, 1.75, 'j'], [5.7, 1.75, 6.45, 1.75, 'jd'], [6.45, 1.75, 6.75, 1.75, 'j'],
      [2.85, 9.3, 3.42, 9.3],
      ...CORE.walls,
    ],
    furn: [
      { t: 'bed', x: 0.06, y: 1.15, w: 2.05, d: 1.65, face: 'w' },
      { t: 'nightstand', x: 0.06, y: 0.68, w: 0.45, d: 0.42 }, { t: 'nightstand', x: 0.06, y: 2.85, w: 0.45, d: 0.42 },
      { t: 'wardrobe', x: 1.3, y: 3.1, w: 2.02, d: 0.6, face: 's' },
      { t: 'armchair', x: 2.5, y: 0.2, w: 0.75, d: 0.75, face: 'n' },
      { t: 'curtain', x: 0.12, y: 0.07, w: 3.2, d: 0.1, face: 'n' },
      { t: 'mandir', x: 6.2, y: 0.2, w: 0.5, d: 1.3, face: 'e' }, { t: 'aasan', x: 5.5, y: 0.55, w: 0.6, d: 0.6 },
      { t: 'curtain', x: 3.55, y: 0.07, w: 1.7, d: 0.1, face: 'n' },
      ...LIVING(1.9),
      { t: 'dining', x: 4.55, y: 6.7, w: 1.0, d: 1.8 },
      // Godrej kitchen, first floor: L with tall units + return
      { t: 'counter', x: 6.13, y: 10.3, w: 0.6, d: 3.0, face: 'e' },
      { t: 'counter', x: 4.93, y: 10.3, w: 1.2, d: 0.5, face: 'n', low: true },
      { t: 'stool', x: 5.05, y: 9.8, w: 0.36, d: 0.36 }, { t: 'stool', x: 5.6, y: 9.8, w: 0.36, d: 0.36 },
      ...CORE.furn,
    ],
  },

  upper({ id: 'f2', level: 2, short: '2', title: 'Second Floor', drawing: 'assets/drawings/sf.png', cut: false }),
  upper({ id: 'f3', level: 3, short: '3', title: 'Third Floor', drawing: 'assets/drawings/tf.png', cut: true }),

  /* ============================ TERRACE ============================ */
  {
    id: 't', level: 4, short: 'T', title: 'Terrace', tag: 'Sunken Pool · Pergola · Terrace Garden',
    w: 6.75, h: 15.5, openAir: true, drawing: 'assets/drawings/tr.png',
    orbit: { theta: 0, phi: 0.05 },
    spawn: { from: [3.9, 6.9, 150], to: [4.4, 9.2, 172] },
    slabHoles: [[3.3, 12.0, 6.65, 15.35]],
    summary: 'One flat roof deck with nothing raised on it. The plunge pool, about 11 × 11 ft, is sunk below the terrace slab so the water sits level with the floor, in the south-east corner behind the glass parapet. A pergola lounge sits beside it, and a terrace garden surrounds the skylight at the front.',
    stats: [['Plunge pool', '≈ 11 × 11 ft · 3 ft deep'], ['Pool', 'Sunk below the slab, flush'], ['Skylight', 'Over the third floor']],
    rooms: [
      { id: 'tgarden', name: 'Terrace Garden', size: '6.75 × 3.75 m', r: [0, 0, 6.75, 3.75], kind: 'lawn', notes: 'A lawn and planters around the skylight that brings daylight into the third-floor bedroom below. Two loungers face the hills to the north.', cam: { from: [6.2, 3.4, 1.6], to: [1.4, 1.2, 0.6] } },
      { id: 'tside', name: 'East Deck', size: '3.25 × 4.50 m', r: [3.5, 3.75, 6.75, 8.25], kind: 'terr', notes: 'An open deck beside the stair head, with a planter along the glass parapet and the outdoor shower on the mumty wall.' },
      { id: 'tdine', name: 'Outdoor Dining', size: '6.75 × 3.45 m', r: [0, 8.25, 6.75, 11.7], kind: 'terr', notes: 'A six-seat outdoor table on the open deck between the stair and the pool, so the pool stays in view.', cam: { from: [0.6, 8.7, 1.6], to: [5.0, 12.6, 0.4] } },
      { id: 'tlounge', name: 'Pergola Lounge', size: '3.10 × 3.70 m', r: [0, 11.7, 3.15, 15.5], kind: 'terr', notes: 'A slatted pergola over an outdoor sofa set on the west side of the pool. It stands directly on the deck with no raised platform.', cam: { from: [0.5, 12.0, 1.55], to: [4.8, 14.2, 0.2] } },
      { id: 'pooldeck', name: 'Pool Deck', size: 'Flush with the pool', r: [3.15, 11.7, 6.75, 15.5], kind: 'terr', holes: [[3.3, 12.0, 6.65, 15.35]], notes: 'The deck runs flat to the water’s edge with a slim stone coping. Two loungers sit on the north side.' },
      { id: 'pool', name: 'Plunge Pool', size: '≈ 11 × 11 ft · 0.90 m deep', r: [3.3, 12.0, 6.65, 15.35], kind: 'pool', notes: 'The pool is built below the terrace slab, so there is no raised wall or platform: you step straight down into it from the deck. About 11 × 11 ft and 3 ft deep, with an underwater warm light and hydrotherapy jets provided for. The glass parapet runs along its south and east edges.', cam: { from: [2.4, 10.8, 1.7], to: [5.2, 13.9, -0.2] } },
      { id: 'ttoilet', name: 'Toilet', size: '1.23 × 1.70 m', r: [0, 3.75, 1.38, 5.6], kind: 'wet', notes: N.bath },
      { id: 'tlift', name: 'Lift Overrun', size: '3.60 m overhead', r: [0, 5.6, 1.53, 7.1], kind: 'core', notes: 'The lift serves the stilt to the third floor. This is its overrun, inside the mumty.' },
      { id: 'tstair', name: 'Stair Head', size: 'Mumty', r: [1.53, 3.75, 3.5, 8.25], stairR: [1.53, 3.75, 3.5, 7.1], kind: 'stair', notes: N.stair },
      { id: 'tlobby', name: 'Lobby', size: '', r: [0, 7.1, 1.53, 8.25], kind: 'core', notes: N.lobby },
    ],
    roof: [0, 3.75, 3.5, 8.25],
    walls: [
      [0, 0, 6.75, 0, 'r'], [6.75, 0, 6.75, 15.5, 'r'], [0, 15.5, 6.75, 15.5, 'r'], [0, 0, 0, 3.75, 'r'], [0, 8.25, 0, 15.5, 'r'],
      [0, 3.75, 0, 8.25], [0, 3.75, 3.5, 3.75], [3.5, 3.75, 3.5, 7.2], [3.5, 7.2, 3.5, 8.1, 'd'], [3.5, 8.1, 3.5, 8.25], [0, 8.25, 3.5, 8.25],
      [1.38, 3.75, 1.38, 4.7], [1.38, 4.7, 1.38, 5.45, 'd'], [1.38, 5.45, 1.38, 5.6], [0, 5.6, 1.53, 5.6], [1.53, 5.6, 1.53, 7.1], [0, 7.1, 1.53, 7.1],
    ],
    furn: [
      { t: 'skylight', x: 0.4, y: 1.0, w: 1.55, d: 1.5 },
      { t: 'lounger', x: 3.0, y: 0.7, w: 0.7, d: 1.9, face: 's' }, { t: 'lounger', x: 4.1, y: 0.7, w: 0.7, d: 1.9, face: 's' }, { t: 'sidetable', x: 3.72, y: 1.3, w: 0.4, d: 0.4 },
      { t: 'planter', x: 0.1, y: 0.1, w: 6.55, d: 0.4, dense: true }, { t: 'planter', x: 6.25, y: 0.6, w: 0.4, d: 3.0 }, { t: 'planter', x: 6.25, y: 3.9, w: 0.4, d: 4.2 },
      { t: 'wc', x: 0.08, y: 4.9, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 0.08, y: 3.9, w: 0.45, d: 0.5, face: 'w' },
      { t: 'oshower', x: 3.56, y: 4.1, w: 0.2, d: 0.9, face: 'w' },
      { t: 'dining', x: 1.1, y: 9.0, w: 1.8, d: 0.9, seats: 6, outdoor: true },
      { t: 'lounger', x: 3.7, y: 9.6, w: 0.7, d: 1.9, face: 'n' }, { t: 'lounger', x: 4.8, y: 9.6, w: 0.7, d: 1.9, face: 'n' },
      { t: 'pergola', x: 0.12, y: 11.85, w: 2.95, d: 3.5 },
      { t: 'sofa', x: 0.2, y: 12.3, w: 0.92, d: 2.4, face: 'w' }, { t: 'coffee', x: 1.5, y: 13.0, w: 0.6, d: 1.1 }, { t: 'armchair', x: 1.3, y: 14.5, w: 0.82, d: 0.85, face: 's' },
      { t: 'poolflush', x: 3.3, y: 12.0, w: 3.35, d: 3.35, depth: 0.9 },
      { t: 'tank', x: 0.3, y: 5.9, w: 1.0, d: 1.0, onRoof: true },
      { t: 'vineplanter', x: 0, y: -0.45, w: 3.42, d: 0.42 },
    ],
  },
];

function upper({ id, level, short, title, drawing, cut }) {
  const master = cut
    ? { id: 'master', name: 'Bedroom 1 · Gallery', size: '3.20 × 3.60 m', r: [0, 0, 3.55, 3.75], kind: '', notes: 'On the third floor, Bedroom 1 looks through a glass railing into the double-height volume and its onyx wall, like a mezzanine gallery. The terrace skylight above brings daylight straight down into the room. Godrej Kreation wardrobe on the south wall.', cam: { from: [0.5, 3.3, 1.55], to: [4.6, 1.2, 1.5] } }
    : { id: 'master', name: 'Bedroom 1 · Double-height Retreat', size: '6.45 × 3.60 m', label: [5.1, 1.1], poly: [[0, 0], [6.75, 0], [6.75, 2.25], [3.55, 2.25], [3.55, 3.75], [0, 3.75]], kind: '', notes: 'The full-width bedroom across the north front. Its eastern half rises two storeys behind tall TOSTEM glazing, a private double-height retreat discovered upstairs and kept away from the entrance. The back wall of that volume is the home’s single hero moment: a backlit Beige/Statuario-pattern onyx wall, two storeys tall. Two armchairs and a reading lamp sit before it.', cam: { from: [0.7, 3.3, 1.5], to: [5.6, 1.4, 2.6] } };
  const rooms = [
    master,
    { id: 'living', name: 'Living', size: '3.10 × 7.68 m', label: [5.1, 5.0], poly: [[3.55, 2.25], [6.75, 2.25], [6.75, 8.25], [3.42, 8.25], [3.42, 3.75], [3.55, 3.75]], kind: '', notes: 'Spanish Beige marble and warm white walls. A long greige sofa sits under the east window, with an armchair, a stone coffee table and a low TV wall on the stair side. The hills fill both east windows.', cam: { from: [3.9, 8.0, 1.5], to: [5.8, 3.4, 1.0] } },
    { id: 'kitchen', name: 'Kitchen + Dining', size: '3.10 × 5.62 m', label: [4.6, 11.4], r: [3.42, 8.25, 6.75, 13.85], kind: '', notes: N.kitchen + (cut ? ' Built to the Godrej drawing for this floor: a straight 3.0 m run and a free-standing 820 × 700 mm island.' : ' Built to the Godrej drawing for this floor: the main run on the east wall, tall crockery units with glass shutters on the west wall, and an 820 × 700 mm island.') + ' The six-seat dining table sits at the living end.', cam: { from: [3.8, 13.4, 1.5], to: [6.0, 9.6, 0.9] } },
    { id: 'balcony', name: 'Balcony', size: '2.95 × 1.50 m', r: [3.42, 13.85, 6.75, 15.5], kind: 'bal', notes: N.balcony },
    ...CORE.rooms,
  ];
  if (cut) rooms.splice(1, 0, { id: 'void', name: 'Double-height Void', size: '3.25 × 2.25 m', r: [3.55, 0, 6.75, 2.25], kind: 'void', notes: 'The X on the drawing: the upper half of the second-floor retreat. You look down into it from the gallery railing, and the onyx wall continues up through it.', cam: { from: [1.4, 2.9, 1.6], to: [5.4, 1.4, 1.2] } });

  const walls = [
    [0, 0, 3.55, 0, 'g'], [3.55, 0, 6.75, 0, 'g', cut ? undefined : { hh: 5.8 }], ...EAST(!cut),
    [3.55, 2.25, 6.75, 2.25, 'w', cut ? undefined : { hh: 5.8 }], [3.55, 2.25, 3.55, 2.8], [3.55, 2.8, 3.55, 3.7, 'd'], [3.55, 3.7, 3.55, 3.75], [3.42, 3.75, 3.55, 3.75],
    [2.85, 9.3, 3.42, 9.3],
    ...CORE.walls,
  ];
  if (cut) walls.push([3.55, 0.1, 3.55, 2.25, 'r']);

  const furn = [
    { t: 'bed', x: 0.06, y: 0.95, w: 2.1, d: 1.9, face: 'w' },
    { t: 'nightstand', x: 0.06, y: 0.45, w: 0.5, d: 0.42 }, { t: 'nightstand', x: 0.06, y: 2.92, w: 0.5, d: 0.42 },
    { t: 'wardrobe', x: 1.3, y: 3.1, w: 2.02, d: 0.6, face: 's' },
    { t: 'curtain', x: 0.12, y: 0.07, w: 3.2, d: 0.1, face: 'n' },
    ...LIVING(2.9),
    { t: 'dining', x: 4.6, y: 8.5, w: 1.0, d: 1.75 },
    { t: 'counter', x: 6.13, y: 10.2, w: 0.6, d: cut ? 3.0 : 3.4, face: 'e' },
    { t: 'island', x: 4.35, y: 12.3, w: 0.7, d: 0.82 },
    ...(cut ? [] : [{ t: 'tall', x: 3.48, y: 10.45, w: 0.32, d: 1.05, face: 'w', tone: 'kitchen', glass: true }, { t: 'counter', x: 3.48, y: 11.5, w: 0.6, d: 1.05, face: 'w', low: true }]),
    ...CORE.furn,
  ];
  if (!cut) furn.push(
    { t: 'onyx', x: 3.6, y: 1.98, w: 3.1, d: 0.22, face: 's', h: 5.75 },
    { t: 'armchair', x: 4.15, y: 0.45, w: 0.78, d: 0.78, face: 'n' }, { t: 'armchair', x: 5.6, y: 0.45, w: 0.78, d: 0.78, face: 'n' },
    { t: 'sidetable', x: 5.03, y: 0.6, w: 0.42, d: 0.42 }, { t: 'floorlamp', x: 6.3, y: 0.3, w: 0.32, d: 0.32 },
    { t: 'rug', x: 3.9, y: 0.3, w: 2.6, d: 1.5 }, { t: 'armchair', x: 2.5, y: 0.2, w: 0.75, d: 0.75, face: 'n' });
  else furn.push({ t: 'onyx', x: 3.6, y: 1.98, w: 3.1, d: 0.22, face: 's', h: 2.85, upper: true }, { t: 'armchair', x: 2.5, y: 0.25, w: 0.75, d: 0.75, face: 'n' });

  return {
    id, level, short, title, w: 6.75, h: 15.5, drawing,
    tag: cut ? 'Residence · Gallery over the Retreat' : 'Residence · Double-height Retreat',
    spawn: { from: [3.75, 7.65, 80], to: [4.7, 6.9, 15] },
    dbl: cut ? null : [3.55, 0, 6.75, 2.25],            // region whose ceiling is two storeys up
    voidR: cut ? [3.55, 0, 6.75, 2.25] : null,           // floor hole
    skylight: cut ? [0.4, 1.0, 1.95, 2.5] : null,
    summary: cut
      ? 'Two bedrooms with living, dining and kitchen along the east side. At the north-east the floor is cut away (the X on the drawing) and Bedroom 1 becomes a gallery overlooking the double-height retreat below. A skylight from the terrace lights it from above.'
      : 'Two bedrooms with living, dining and kitchen along the east side. Bedroom 1 spans the whole north front (6.45 m), and its eastern half is the double-height retreat with the backlit onyx wall rising two storeys.',
    stats: [['Footprint', '6.75 × 15.50 m'], ['Bedrooms', '2'], cut ? ['Skylight', 'Over Bedroom 1'] : ['Onyx wall', 'Two storeys, backlit']],
    rooms, walls, furn,
  };
}
window.HOUSE = { H, elev: { g: 0, f1: 3.3, f2: 6.5, f3: 9.7, t: 12.9 }, off: { x: 1.5, z: 3.0 }, plot: { w: 9.75, h: 19.0 } };
