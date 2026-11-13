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
  kitchen: 'Godrej modular kitchen in matte olive-grey with a polished black granite counter. Hob, chimney and sink run along the east wall under the window. All units are soft-close with a 100 mm skirting.',
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
    { t: 'stairs', x: 1.6, y: 3.9, w: 1.75, d: 3.15, steps: 11 },
    { t: 'wc', x: 0.08, y: 8.5, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 1.75, y: 8.2, w: 0.55, d: 0.42, face: 'n' },
    { t: 'tall', x: 2.56, y: 8.22, w: 0.5, d: 1.02, face: 'w', tone: 'white' },
    { t: 'wc', x: 0.08, y: 9.45, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 1.15, y: 9.35, w: 0.55, d: 0.42, face: 'n' },
    { t: 'washer', x: 2.2, y: 9.36, w: 0.6, d: 0.6, face: 'n' },
    { t: 'tub', x: 0.06, y: 10.55, w: 1.48, d: 0.78 },
    { t: 'wardrobe', x: 1.68, y: 10.4, w: 1.7, d: 0.5, face: 'n' },
    { t: 'bed', x: 0.06, y: 12.5, w: 2.05, d: 1.6, face: 'w' },
    { t: 'nightstand', x: 0.06, y: 12.0, w: 0.45, d: 0.42 }, { t: 'nightstand', x: 0.06, y: 14.18, w: 0.45, d: 0.42 },
    { t: 'wardrobe', x: 2.82, y: 13.45, w: 0.56, d: 1.95, face: 'e' },
    { t: 'desk', x: 0.5, y: 14.95, w: 1.4, d: 0.48, face: 's' }, { t: 'chair', x: 0.95, y: 14.45, w: 0.46, d: 0.46, face: 'n' },
    { t: 'rug', x: 0.9, y: 12.15, w: 1.75, d: 2.3 },
    { t: 'curtain', x: 0.12, y: 15.34, w: 3.2, d: 0.1, face: 's' },
    { t: 'fridge', x: 2.9, y: 9.38, w: 0.5, d: 0.9, face: 'w' },
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
  { t: 'tv', x: 3.48, y: y0 + 0.55, w: 0.4, d: 2.2, face: 'w' },
  { t: 'sofa', x: 5.82, y: y0 + 0.45, w: 0.88, d: 2.4, face: 'e' },
  { t: 'coffee', x: 4.55, y: y0 + 1.1, w: 0.65, d: 1.1 },
  { t: 'armchair', x: 4.45, y: y0 + 2.75, w: 0.78, d: 0.78, face: 's' },
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
    summary: 'The stilt is the villa’s first open-air living level. You arrive at the north court, where the black Verna parks by the north-east gate and water feature. The lift and stair core sits in the middle. Behind it a 1.5 ft sunken conversation pit faces a projector wall, and the ~500 sq ft south garden opens toward the club-side landscape.',
    stats: [['Plot', '9.75 × 19.00 m · ≈ 2,000 sq ft'], ['Conversation pit', '1.5 ft sunken'], ['South garden', '≈ 500 sq ft']],
    slabHoles: [[1.75, 11.15, 4.85, 13.85]],
    rooms: [
      { id: 'court', name: 'North Arrival Court', size: '9.75 × 5.75 m', r: [0, 0, 9.75, 5.75], kind: 'pave', notes: 'Grey limestone, raw finish, in 2 × 2 ft slabs. The 12,750 litre underground water tank sits below the court. The black Hyundai Verna parks here, straight in from the north-east gate.', cam: { from: [8.9, 0.9, 1.6], to: [3.4, 4.6, 0.8] } },
      { id: 'water', name: 'North-East Water Feature', size: 'Arrival', r: [8.55, 3.2, 9.6, 5.9], kind: 'pave', notes: 'A quiet water wall at the north-east, the corner where the Bhoomi Pujan was held. Water runs down a ribbed stone face into a pebble trough, lit warm from below.', cam: { from: [6.6, 2.6, 1.6], to: [9.1, 4.6, 1.2] } },
      { id: 'passage', name: 'East Walk', size: '3.15 m wide', r: [5.1, 5.75, 9.75, 10.2], kind: 'out', notes: 'Yellow limestone walk from the arrival court to the garden, past the east-facing core threshold. Floating stone steps rise to the lift lobby at +0.90.' },
      { id: 'westwalk', name: 'West Planted Walk', size: '1.50 m wide', r: [0, 5.75, 1.53, 10.2], kind: 'lawn', notes: 'A planted buffer along the west boundary with bamboo screening.' },
      { id: 'gtoilet', name: 'Toilet', size: '1.23 × 1.70 m', r: [1.53, 5.75, 2.93, 7.6], kind: 'wet', notes: N.bath },
      { id: 'glift', name: 'Lift', size: '1.10 × 1.20 m shaft', r: [1.53, 7.6, 3.05, 9.1], kind: 'core', notes: N.lift },
      { id: 'gstair', name: 'Staircase', size: 'Kota Brown', r: [3.05, 5.75, 5.0, 9.1], kind: 'stair', notes: N.stair },
      { id: 'globby', name: 'Lift Lobby', size: '+0.90 m', r: [1.53, 9.1, 5.1, 10.2], kind: 'core', notes: 'A foyer-like pavilion at +0.90 that keeps the sanctioned stilt open. The core’s shear wall is clad in fluted pink sandstone.' },
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
      { t: 'waterwall', x: 9.0, y: 3.5, w: 0.5, d: 2.2, face: 'e' },
      { t: 'tankcover', x: 1.6, y: 0.6, w: 0.7, d: 0.7 }, { t: 'tankcover', x: 5.9, y: 0.6, w: 0.7, d: 0.7 },
      { t: 'planter', x: 0.2, y: 0.2, w: 6.1, d: 0.45, dense: true },
      { t: 'stairs', x: 3.12, y: 5.85, w: 1.8, d: 3.2, steps: 11 },
      { t: 'liftcar', x: 1.77, y: 7.82, w: 1.05, d: 1.1 },
      { t: 'wc', x: 1.6, y: 6.75, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 1.6, y: 5.9, w: 0.45, d: 0.5, face: 'w' },
      { t: 'shearwall', x: 1.53, y: 5.6, w: 3.47, d: 0.14, face: 's' },
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
      { t: 'plant', x: 5.3, y: 10.4, w: 0.55, d: 0.55 }, { t: 'plant', x: 7.2, y: 5.2, w: 0.55, d: 0.55 }, { t: 'plant', x: 5.3, y: 5.2, w: 0.55, d: 0.55 },
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
      { id: 'mandir', name: 'Mandir', size: 'North-east corner', r: [5.3, 0, 6.75, 1.75], kind: '', notes: 'In the north-east corner of the first floor. A white marble shrine stands on the east wall, so you face east in prayer. It has a fluted stone back panel with a warm concealed light and a brass diya ledge, and a slatted screen gives it privacy from the living room.', cam: { from: [4.3, 2.6, 1.45], to: [6.4, 0.9, 1.1] } },
      { id: 'dining', name: 'Dining', size: '3.10 × 3.75 m', r: [3.42, 5.6, 6.75, 9.35], kind: '', notes: 'A six-seat dining table where the drawing places it, between living and kitchen, under a slim linear pendant. The residence door from the lobby opens here.', cam: { from: [3.8, 5.9, 1.5], to: [5.6, 8.6, 0.8] } },
      { id: 'kitchen', name: 'Kitchen + Dining', size: '3.10 × 4.50 m', r: [3.42, 9.35, 6.75, 13.85], label: [4.7, 12.3], kind: '', notes: N.kitchen + ' On this floor the Godrej layout is an L: tall crockery units with glass shutters and a short counter return facing the dining table.', cam: { from: [3.8, 13.4, 1.5], to: [6.2, 10.6, 1.0] } },
      { id: 'balcony', name: 'Balcony', size: '2.95 × 1.50 m', r: [3.42, 13.85, 6.75, 15.5], kind: 'bal', notes: N.balcony },
      ...CORE.rooms,
    ],
    walls: [
      [0, 0, 6.75, 0, 'g'], ...EAST(false),
      [3.42, 0, 3.42, 2.35], [3.42, 2.35, 3.42, 3.25, 'd'], [3.42, 3.25, 3.42, 3.75],
      [5.3, 0.06, 5.3, 1.15, 'j'],
      [2.85, 9.3, 3.42, 9.3],
      ...CORE.walls,
    ],
    furn: [
      { t: 'bed', x: 0.06, y: 1.15, w: 2.05, d: 1.65, face: 'w' },
      { t: 'nightstand', x: 0.06, y: 0.68, w: 0.45, d: 0.42 }, { t: 'nightstand', x: 0.06, y: 2.85, w: 0.45, d: 0.42 },
      { t: 'wardrobe', x: 1.3, y: 3.18, w: 2.02, d: 0.52, face: 's' },
      { t: 'armchair', x: 2.5, y: 0.2, w: 0.75, d: 0.75, face: 'n' },
      { t: 'curtain', x: 0.12, y: 0.07, w: 3.2, d: 0.1, face: 'n' },
      { t: 'mandir', x: 6.22, y: 0.2, w: 0.48, d: 1.35, face: 'e' }, { t: 'aasan', x: 5.5, y: 0.6, w: 0.6, d: 0.6 },
      { t: 'curtain', x: 3.55, y: 0.07, w: 1.7, d: 0.1, face: 'n' },
      ...LIVING(1.9),
      { t: 'dining', x: 4.55, y: 6.7, w: 1.0, d: 1.8 },
      // Godrej kitchen, first floor: L with tall units + return
      { t: 'counter', x: 6.1, y: 10.3, w: 0.62, d: 3.5, face: 'e' },
      { t: 'counter', x: 4.7, y: 10.3, w: 1.4, d: 0.5, face: 'n', low: true },
      { t: 'tall', x: 3.48, y: 10.4, w: 0.6, d: 1.05, face: 'w', tone: 'olive', glass: true },
      { t: 'stool', x: 4.9, y: 9.75, w: 0.36, d: 0.36 }, { t: 'stool', x: 5.45, y: 9.75, w: 0.36, d: 0.36 },
      ...CORE.furn,
    ],
  },

  upper({ id: 'f2', level: 2, short: '2', title: 'Second Floor', drawing: 'assets/drawings/sf.png', cut: false }),
  upper({ id: 'f3', level: 3, short: '3', title: 'Third Floor', drawing: 'assets/drawings/tf.png', cut: true }),

  /* ============================ TERRACE ============================ */
  {
    id: 't', level: 4, short: 'T', title: 'Terrace', tag: 'Plunge Pool · Pergola · Terrace Garden',
    w: 6.75, h: 15.5, openAir: true, drawing: 'assets/drawings/tr.png',
    orbit: { theta: 0, phi: 0.05 },
    spawn: { from: [3.9, 6.9, 150], to: [4.3, 9.3, 172] },
    summary: 'The roof is the villa’s second garden and its water level. A raised plunge pool of about 11 × 11 ft sits in the south-east with infinity edges to the south and east. A pergola lounge and outdoor dining sit beside it, and a terrace garden surrounds the skylight at the front.',
    stats: [['Plunge pool', '≈ 11 × 11 ft · 3 ft deep'], ['Edges', 'Infinity to south + east'], ['Skylight', 'Over the third floor']],
    rooms: [
      { id: 'tgarden', name: 'Terrace Garden', size: '6.75 × 3.75 m', r: [0, 0, 6.75, 3.75], kind: 'lawn', notes: 'A lawn and planters around the skylight that brings daylight into the third-floor bedroom below. Two loungers face the hills to the north.', cam: { from: [6.2, 3.4, 1.6], to: [1.4, 1.2, 0.6] } },
      { id: 'tside', name: 'East Deck', size: '3.25 × 4.50 m', r: [3.5, 3.75, 6.75, 8.25], kind: 'terr', notes: 'An open deck beside the stair head, with a planter along the glass parapet and the outdoor shower on the mumty wall.' },
      { id: 'tdine', name: 'Outdoor Dining', size: '6.75 × 3.45 m', r: [0, 8.25, 6.75, 11.7], kind: 'terr', notes: 'A six-seat outdoor table and a stone bar counter, placed between the stair and the pool so the pool stays in view.', cam: { from: [0.6, 8.7, 1.6], to: [5.0, 12.6, 0.8] } },
      { id: 'tlounge', name: 'Pergola Lounge', size: '3.10 × 3.70 m', r: [0, 11.7, 3.15, 15.5], kind: 'terr', notes: 'A slatted pergola in the warm-greige metal of the façade fins, over an outdoor sofa set on the west side of the pool. This is the seating and safety edge to the west.', cam: { from: [0.5, 12.0, 1.55], to: [4.8, 14.2, 0.7] } },
      { id: 'pool', name: 'Plunge Pool', size: '≈ 11 × 11 ft · 0.90 m deep', r: [3.15, 11.7, 6.75, 15.5], kind: 'pooldeck', notes: 'A raised plunge pool about 11 × 11 ft and 3 ft deep. Water spills over the south and east infinity edges into a pebble channel, and stone steps rise from the north. An underwater warm light and hydrotherapy jets are provided for.', cam: { from: [2.6, 10.6, 1.9], to: [5.2, 13.8, 0.9] } },
      { id: 'ttoilet', name: 'Toilet', size: '1.23 × 1.70 m', r: [0, 3.75, 1.38, 5.6], kind: 'wet', notes: N.bath },
      { id: 'tlift', name: 'Lift Overrun', size: '3.60 m overhead', r: [0, 5.6, 1.53, 7.1], kind: 'core', notes: 'The lift serves the stilt to the third floor. This is its overrun, inside the mumty.' },
      { id: 'tstair', name: 'Stair Head', size: 'Mumty', r: [1.53, 3.75, 3.5, 8.25], kind: 'stair', notes: N.stair },
      { id: 'tlobby', name: 'Lobby', size: '', r: [0, 7.1, 1.53, 8.25], kind: 'core', notes: N.lobby },
    ],
    roof: [0, 3.75, 3.5, 8.25],
    walls: [
      [0, 0, 6.75, 0, 'r'], [6.75, 0, 6.75, 11.7, 'r'], [0, 15.5, 3.15, 15.5, 'r'], [0, 0, 0, 3.75, 'r'], [0, 8.25, 0, 15.5, 'r'],
      [0, 3.75, 0, 8.25], [0, 3.75, 3.5, 3.75], [3.5, 3.75, 3.5, 6.3], [3.5, 6.3, 3.5, 7.3, 'd'], [3.5, 7.3, 3.5, 8.25], [0, 8.25, 3.5, 8.25],
      [1.38, 3.75, 1.38, 4.7], [1.38, 4.7, 1.38, 5.45, 'd'], [1.38, 5.45, 1.38, 5.6], [0, 5.6, 1.53, 5.6], [1.53, 5.6, 1.53, 7.1], [0, 7.1, 1.53, 7.1],
    ],
    furn: [
      { t: 'skylight', x: 0.4, y: 1.0, w: 1.55, d: 1.5 },
      { t: 'lounger', x: 3.0, y: 0.7, w: 0.7, d: 1.9, face: 's' }, { t: 'lounger', x: 4.1, y: 0.7, w: 0.7, d: 1.9, face: 's' }, { t: 'sidetable', x: 3.72, y: 1.3, w: 0.36, d: 0.36 },
      { t: 'planter', x: 0.1, y: 0.1, w: 6.55, d: 0.4, dense: true }, { t: 'planter', x: 6.25, y: 0.6, w: 0.4, d: 3.0 }, { t: 'planter', x: 6.25, y: 3.9, w: 0.4, d: 4.2 },
      { t: 'wc', x: 0.08, y: 4.9, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 0.08, y: 3.9, w: 0.45, d: 0.5, face: 'w' },
      { t: 'stairs', x: 1.6, y: 3.9, w: 1.8, d: 2.6, steps: 9, down: true },
      { t: 'oshower', x: 3.56, y: 4.1, w: 0.2, d: 0.9, face: 'w' },
      { t: 'dining', x: 0.9, y: 9.0, w: 1.9, d: 1.0, seats: 6, outdoor: true },
      { t: 'bar', x: 4.2, y: 8.6, w: 2.0, d: 0.6 },
      { t: 'stool', x: 4.4, y: 9.3, w: 0.36, d: 0.36 }, { t: 'stool', x: 5.0, y: 9.3, w: 0.36, d: 0.36 }, { t: 'stool', x: 5.6, y: 9.3, w: 0.36, d: 0.36 },
      { t: 'pergola', x: 0.12, y: 11.85, w: 2.95, d: 3.5 },
      { t: 'sofa', x: 0.2, y: 12.3, w: 0.9, d: 2.5, face: 'w' }, { t: 'coffee', x: 1.45, y: 13.0, w: 0.7, d: 1.1 }, { t: 'armchair', x: 1.3, y: 14.55, w: 0.8, d: 0.8, face: 's' },
      { t: 'pool', x: 3.3, y: 12.0, w: 3.35, d: 3.35, depth: 0.9 },
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
    { id: 'kitchen', name: 'Kitchen + Dining', size: '3.10 × 5.62 m', label: [4.6, 11.4], r: [3.42, 8.25, 6.75, 13.85], kind: '', notes: N.kitchen + ' As drawn, the counter runs along the east wall and a compact island (the drawing gives 0.60 × 0.83 m) stands free with about 0.90 m clear around it. The six-seat dining table sits at the living end.', cam: { from: [3.8, 13.4, 1.5], to: [6.0, 9.6, 0.9] } },
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
    { t: 'bed', x: 0.06, y: 1.15, w: 2.05, d: 1.7, face: 'w' },
    { t: 'nightstand', x: 0.06, y: 0.68, w: 0.45, d: 0.42 }, { t: 'nightstand', x: 0.06, y: 2.9, w: 0.45, d: 0.42 },
    { t: 'wardrobe', x: 1.3, y: 3.18, w: 2.02, d: 0.52, face: 's' },
    { t: 'curtain', x: 0.12, y: 0.07, w: 3.2, d: 0.1, face: 'n' },
    ...LIVING(2.9),
    { t: 'dining', x: 4.6, y: 8.5, w: 1.0, d: 1.75 },
    { t: 'counter', x: 6.1, y: 10.1, w: 0.62, d: 3.7, face: 'e' },
    { t: 'island', x: 4.4, y: 12.39, w: 0.6, d: 0.83 },
    { t: 'tall', x: 3.48, y: 10.4, w: 0.6, d: 1.05, face: 'w', tone: 'olive', glass: true },
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
window.HOUSE = { H };
