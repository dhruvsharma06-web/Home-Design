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
  stair: 'Dog-leg staircase in light beige stone, matte finish, with a glass balustrade. It runs beside the lift from the stilt up to the terrace.',
  lobby: 'The landing between lift, stair and the west-facing residence door. Spanish Beige marble, warm white walls, nothing else.',
  bed2: 'South-west bedroom at the back of the house. Upholstered bed, a study desk at the south glazing and a TV on the east wall. Its bath sits behind a translucent glass partition, with the only wardrobe placed right beside it.',
  balcony: 'Open balcony 1.50 m wide in Kota Green, raw finish, with a frameless TOSTEM glass railing and two chairs.',
  kitchen: 'Godrej modular kitchen with a polished black granite counter. Hob, chimney and sink run along the east wall under the window. All units are soft-close with a 100 mm skirting.',
  powder: 'Guest toilet, 2.20 × 1.00 m. As the drawing notes, its door is hidden within the cupboard shutters, so the dining side reads as one clean wall.',
  wiw: 'Walk-in wardrobe beside the translucent glass of the Bedroom 2 bath: Godrej Kreation X3 modules, 1.5 ft deep. It is the only wardrobe in this room.',
};

/* ---------------- shared west core (floors 1–3) ---------------- */
const CORE = {
  rooms: [
    { id: 'bath1', name: 'Bath · Bedroom 1', size: '1.23 × 1.70 m', r: [0, 3.75, 1.38, 5.6], kind: 'wet', notes: N.bath },
    { id: 'lift', name: 'Lift', size: '1.10 × 1.20 m shaft', r: [0, 5.6, 1.53, 7.1], kind: 'core', notes: N.lift },
    { id: 'stair', name: 'Staircase', size: 'Light beige stone', r: [1.53, 3.75, 3.42, 7.1], kind: 'stair', notes: N.stair },
    { id: 'lobby', name: 'Lobby', size: '1.00 m landing', r: [0, 7.1, 3.42, 8.15], kind: 'core', notes: N.lobby },
    { id: 'powder', name: 'Guest Toilet', size: '2.20 × 1.00 m', r: [0, 8.15, 2.5, 9.3], kind: 'wet', notes: N.powder },
    { id: 'bed2', name: 'Bedroom 2', size: '3.20 × 3.90 m', r: [0, 11.4, 3.42, 15.5], kind: '', notes: N.bed2, cam: { from: [3.0, 15.0, 1.5], to: [0.8, 12.4, 0.9] } },
  ],
  walls: [
    // west exterior with windows as drawn (W6, ventilators, W9, W7)
    // west façade: every window is a 2 ft (0.6 m) high strip, sill 1.5 m, head 2.1 m
    [0, 0, 0, 3.1], [0, 3.1, 0, 3.7, 'win', { s: 1.5, h: 2.1 }], [0, 3.7, 0, 4.6], [0, 4.6, 0, 5.4, 'win', { s: 1.5, h: 2.1 }],
    [0, 5.4, 0, 7.15], [0, 7.15, 0, 8.0, 'win', { s: 1.5, h: 2.1 }], [0, 8.0, 0, 8.35], [0, 8.35, 0, 9.15, 'win', { s: 1.5, h: 2.1 }],
    [0, 9.15, 0, 9.7], [0, 9.7, 0, 10.6, 'win', { s: 1.5, h: 2.1 }], [0, 10.6, 0, 11.5], [0, 11.5, 0, 12.1, 'win', { s: 1.5, h: 2.1 }], [0, 12.1, 0, 15.5],
    // bath 1
    [0, 3.75, 0.55, 3.75], [0.55, 3.75, 1.3, 3.75, 'd'], [1.3, 3.75, 3.42, 3.75], [1.38, 3.75, 1.38, 5.6],
    // lift shaft
    [0, 5.6, 1.53, 5.6], [1.53, 5.6, 1.53, 7.1], [0, 7.1, 0.3, 7.1], [0.3, 7.1, 1.15, 7.1, 'd'], [1.15, 7.1, 1.53, 7.1],
    // stair + residence door (west-facing)
    [3.42, 3.75, 3.42, 7.2], [3.42, 7.2, 3.42, 8.1, 'd'], [3.42, 8.1, 3.42, 8.15],
    // guest toilet (door hidden in cupboard shutters)
    [0, 8.15, 3.42, 8.15], [2.5, 8.15, 2.5, 8.3], [2.5, 8.3, 2.5, 9.1, 'd'], [2.5, 9.1, 2.5, 9.3],
    [0, 9.3, 2.85, 9.3], [2.85, 9.3, 2.85, 10.35],
    // south
    [0, 15.5, 3.42, 15.5, 'g'], [3.42, 15.5, 6.75, 15.5, 'r'],
    // kitchen → balcony: door at the right (east) end, windows for the rest
    [3.42, 13.85, 5.75, 13.85, 'win', { s: 0.9, h: 2.4 }], [5.75, 13.85, 6.65, 13.85, 'd'], [6.65, 13.85, 6.75, 13.85],
  ],
  furn: [
    { t: 'wc', x: 0.08, y: 4.85, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 0.08, y: 3.9, w: 0.45, d: 0.5, face: 'w' }, { t: 'shower', x: 0.62, y: 4.72, w: 0.72, d: 0.84 },
    { t: 'liftcar', x: 0.22, y: 5.82, w: 1.05, d: 1.1 },
    { t: 'wc', x: 0.08, y: 8.5, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 1.75, y: 8.2, w: 0.55, d: 0.42, face: 'n' },
    { t: 'wc', x: 0.08, y: 9.45, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 1.15, y: 9.35, w: 0.55, d: 0.42, face: 'n' },
    { t: 'washer', x: 2.2, y: 9.36, w: 0.6, d: 0.6, face: 'n' },
    { t: 'bed', x: 0.06, y: 12.5, w: 2.05, d: 1.6, face: 'w' },
    { t: 'nightstand', x: 0.06, y: 12.0, w: 0.45, d: 0.42 }, { t: 'nightstand', x: 0.06, y: 14.18, w: 0.45, d: 0.42 },
    { t: 'tv', x: 2.94, y: 13.45, w: 0.42, d: 1.5, face: 'e' },
    { t: 'desk', x: 0.5, y: 14.85, w: 1.2, d: 0.55, face: 's' }, { t: 'chair', x: 0.86, y: 14.3, w: 0.48, d: 0.5, face: 'n' },
    { t: 'rug', x: 0.9, y: 12.15, w: 1.75, d: 2.3 },
    { t: 'curtain', x: 0.12, y: 15.34, w: 3.2, d: 0.1, face: 's' },
    { t: 'fridge', x: 2.87, y: 9.45, w: 0.55, d: 0.75, face: 'w' },
    // balcony
    { t: 'lounge', x: 3.6, y: 14.1, w: 0.72, d: 0.72, face: 's' }, { t: 'lounge', x: 4.85, y: 14.1, w: 0.72, d: 0.72, face: 's' }, { t: 'sidetable', x: 4.39, y: 14.25, w: 0.4, d: 0.4 },
    // façade: 5 full-height fins at the north-west corner; one 75%-height fin panel per floor on the east face, up to the window
    { t: 'fins', x: 6.8, y: 2.35, w: 0.4, d: 1.5, h75: true }, { t: 'fins', x: -0.42, y: 0.2, w: 0.4, d: 1.0 },
    // storage lofts at 7 ft over the washrooms
    { t: 'loft', x: 0.0, y: 3.75, w: 1.38, d: 1.85 }, { t: 'loft', x: 0.0, y: 8.15, w: 2.5, d: 1.15 },
  ],
};


/* Bath 2 zone: first floor keeps bath + walk-in wardrobe; second and third merge them into one large bathroom with a jacuzzi */
const BATH_F1 = {
  rooms: [
    { id: 'bath2', name: 'Bath · Bedroom 2', size: '1.50 × 1.90 m', poly: [[0, 9.3], [2.85, 9.3], [2.85, 10.35], [1.6, 10.35], [1.6, 11.4], [0, 11.4]], kind: 'wet', label: [1.2, 9.85], notes: N.bath + ' A walk-in shower sits behind the translucent glass partition, and the washing machine has its own niche.', cam: { from: [1.25, 11.1, 1.5], to: [0.4, 9.7, 0.8] } },
    { id: 'wiw', name: 'Walk-in Wardrobe', size: '1.55 × 1.90 m', r: [1.6, 10.35, 3.42, 11.4], kind: '', notes: N.wiw },
  ],
  walls: [
    [1.6, 10.35, 3.42, 10.35], [1.6, 10.35, 1.6, 10.6], [1.6, 10.6, 1.6, 11.3, 'd'], [1.6, 11.3, 1.6, 11.4],
    [0, 11.4, 0.85, 11.4, 'gpf'], [0.85, 11.4, 1.6, 11.4, 'd'], [1.6, 11.4, 2.3, 11.4], [2.3, 11.4, 3.2, 11.4, 'd'], [3.2, 11.4, 3.42, 11.4],
    [3.42, 10.35, 3.42, 11.5], [3.42, 11.5, 3.42, 12.4, 'd'], [3.42, 12.4, 3.42, 15.5],
  ],
  furn: [
    { t: 'shower', x: 0.06, y: 10.45, w: 0.9, d: 0.9 },
    { t: 'wardrobe', x: 1.68, y: 10.42, w: 1.7, d: 0.45, face: 'n' },
    { t: 'loft', x: 0.0, y: 9.3, w: 1.6, d: 2.1 },
  ],
};
const BATH_BIG = {
  rooms: [
    { id: 'bath2', name: 'Bathroom · Jacuzzi', size: '3.40 × 2.10 m', poly: [[0, 9.3], [2.85, 9.3], [2.85, 10.35], [3.42, 10.35], [3.42, 11.4], [0, 11.4]], kind: 'wet', label: [1.7, 9.9], notes: 'One large bathroom made by joining the Bedroom 2 bath and the old walk-in wardrobe. A 1.7 × 1.0 m jacuzzi with a hand shower sits against the translucent glass, with the WC, basin and the washing machine niche.', cam: { from: [2.9, 11.05, 1.5], to: [0.7, 10.3, 0.6] } },
  ],
  walls: [
    [2.85, 10.35, 3.42, 10.35],
    [0, 11.4, 0.85, 11.4, 'gpf'], [0.85, 11.4, 2.3, 11.4], [2.3, 11.4, 3.2, 11.4, 'd'], [3.2, 11.4, 3.42, 11.4],
    [3.42, 10.35, 3.42, 11.5], [3.42, 11.5, 3.42, 12.4, 'd'], [3.42, 12.4, 3.42, 15.5],
  ],
  furn: [
    { t: 'jacuzzi', x: 0.06, y: 10.32, w: 1.7, d: 1.0 },
    { t: 'wardrobe', x: 0.9, y: 11.47, w: 1.35, d: 0.45, face: 'n' },
    { t: 'loft', x: 0.0, y: 9.3, w: 2.85, d: 1.0 },
  ],
};

const EAST = (dbl, fr) => [
  [6.75, 0, 6.75, 0.15], [6.75, 0.15, 6.75, 2.25, 'g', dbl ? { hh: 5.8, frameless: true } : (fr ? { frameless: true } : undefined)], [6.75, 2.25, 6.75, 3.93],
  [6.75, 3.93, 6.75, 6.88, 'win', { s: 0.6, h: 2.5 }], [6.75, 6.88, 6.75, 7.29], [6.75, 7.29, 6.75, 9.95, 'win', { s: 0.6, h: 2.5 }],
  [6.75, 9.95, 6.75, 10.1], [6.75, 10.1, 6.75, 12.75, 'win', { s: 1.1, h: 2.3 }], [6.75, 12.75, 6.75, 13.85], [6.75, 13.85, 6.75, 15.5, 'r'],
];

// living, first floor: L-shaped sofa on the stair-side wall, TV on the solid east wall
const LIVING_F1 = [
  { t: 'rug', x: 4.0, y: 2.9, w: 2.3, d: 2.45 },
  { t: 'sofa', x: 3.48, y: 3.35, w: 0.92, d: 2.1, face: 'w' }, { t: 'sofa', x: 4.4, y: 4.55, w: 1.7, d: 0.92, face: 's' },
  { t: 'coffee', x: 4.8, y: 3.15, w: 0.6, d: 1.1 },
  { t: 'tv', x: 6.27, y: 2.35, w: 0.42, d: 1.55, face: 'e' },
  { t: 'floorlamp', x: 3.55, y: 1.55, w: 0.35, d: 0.35 },
];
// living, second / third floor: L-shaped sofa facing a TV wall on the north side
const LIVING_UP = [
  { t: 'rug', x: 3.95, y: 3.55, w: 2.55, d: 2.45 },
  { t: 'tv', x: 4.3, y: 2.32, w: 1.8, d: 0.42, face: 'n' },
  { t: 'sofa', x: 4.42, y: 5.4, w: 1.7, d: 0.92, face: 's' }, { t: 'sofa', x: 3.48, y: 3.95, w: 0.92, d: 2.37, face: 'w' },
  { t: 'coffee', x: 4.8, y: 4.15, w: 1.1, d: 0.6 },
  { t: 'floorlamp', x: 6.25, y: 2.85, w: 0.35, d: 0.35 },
];

window.FLOORS = [
  /* ============================ STILT ============================ */
  {
    id: 'g', level: 0, short: 'G', title: 'Stilt', tag: 'Arrival · Conversation Pit · South Garden',
    w: 9.75, h: 19.0, openAir: true, drawing: 'assets/drawings/gf.png',
    roof: [1.5, 3.0, 8.25, 18.5],
    orbit: { theta: -0.8, phi: 0.95 },
    spawn: { from: [8.2, 1.2, 180], to: [6.6, 9.2, 215] },
    summary: 'The open stilt, floored in beige stone. You enter through two 4.5 ft metal gates at the north-east, past a low marble fountain. The lift and stair core sits in the middle and stays open to the stilt. Behind it a 1.5 ft sunken conversation pit, finished entirely in marble, opens to the south lawn.',
    stats: [['Plot', '9.75 × 19.00 m · ≈ 2,000 sq ft'], ['Conversation pit', '1.5 ft sunken, marble'], ['Gates', '2 × 4.5 ft metal']],
    slabHoles: [[1.75, 11.15, 4.85, 13.85]],
    rooms: [
      { id: 'court', name: 'North Arrival Court', size: '9.75 × 5.75 m', r: [0, 0, 9.75, 5.75], kind: 'pave', notes: 'Beige stone paving from the gates. The 12,750 litre underground water tank sits below the court.', cam: { from: [8.9, 0.9, 1.6], to: [3.4, 4.6, 0.8] } },
      { id: 'water', name: 'Fountain', size: 'North-east corner', r: [8.55, 3.3, 9.65, 5.6], kind: 'pave', notes: 'A free-standing low marble fountain in the north-east arrival corner, the water feature named in the B4 documents. A thin water curtain falls into a marble basin, with no columns or planting around it.', cam: { from: [7.2, 5.7, 1.6], to: [9.1, 4.4, 0.6] } },
      { id: 'passage', name: 'East Walk', size: '3.15 m wide', r: [5.1, 5.75, 9.75, 10.2], kind: 'out', notes: 'Beige stone walk from the arrival court, past the open lift lobby, to the conversation pit and the lawn.' },
      { id: 'westwalk', name: 'West Strip', size: '1.50 m wide', r: [0, 5.75, 1.53, 10.2], kind: 'lawn', notes: 'A plain lawn strip along the west boundary.' },
      { id: 'gtoilet', name: 'Toilet', size: '1.23 × 1.70 m', r: [1.53, 5.75, 2.93, 7.6], kind: 'wet', notes: N.bath },
      { id: 'glift', name: 'Lift', size: '1.10 × 1.20 m shaft', r: [1.53, 7.6, 3.05, 9.1], kind: 'core', notes: N.lift },
      { id: 'gstair', name: 'Staircase', size: 'Light beige stone', r: [3.05, 5.75, 5.0, 9.1], kind: 'stair', notes: N.stair },
      { id: 'globby', name: 'Lift Lobby', size: '+0.90 m', r: [1.53, 9.1, 5.1, 10.2], kind: 'core', notes: 'The lift lobby is left open to the stilt on the east: no glass wall, no door, just the core walls around the lift, stair and toilet.' },
      { id: 'pavilion', name: 'Pavilion Deck', size: 'Beige stone', r: [1.53, 10.2, 9.75, 14.3], kind: 'out', holes: [[1.75, 11.15, 4.85, 13.85]], notes: 'The covered heart of the stilt in beige stone. The columns are greige up to the first slab, and two flush planter beds sit in the floor along the east edge.' },
      { id: 'pit', name: 'Conversation Pit', size: '3.10 × 2.70 m · 1.5 ft sunken', r: [1.75, 11.15, 4.85, 13.85], kind: 'pit', notes: 'Sunk 1.5 ft below the stilt floor and finished entirely in marble: floor, sides, steps and the built-in seats, which have greige cushions. A low marble table sits in the centre. The core wall beside it is plain white.', cam: { from: [5.6, 13.9, 1.5], to: [3.0, 11.6, 0.3] } },
      { id: 'garden', name: 'South Lawn', size: '≈ 500 sq ft', r: [0, 14.3, 9.75, 19.0], kind: 'lawn', notes: 'A plain lawn opening to the club side. Vertical gardens flank the middle column. The boundary here is a 1.5 ft wall with glass above.', cam: { from: [9.2, 16.4, 1.6], to: [3.0, 15.2, 1.0] } },
      { id: 'weststrip', name: 'West Strip', size: 'Lawn', r: [0, 10.2, 1.53, 14.3], kind: 'lawn', notes: 'A plain lawn strip beside the conversation pit.' },
    ],
    walls: [
      // compound wall: 1.5 ft Shine Grey wall, metal fence above on the road and sides, glass above at the back (south)
      [0, 0, 6.46, 0, 'c'], [0, 0, 0, 19, 'c'], [9.75, 0, 9.75, 19, 'c'], [0, 19, 9.75, 19, 'c'],
      // core (the lobby stays open to the east)
      [1.53, 5.75, 1.95, 5.75], [1.95, 5.75, 2.75, 5.75, 'd'], [2.75, 5.75, 5.0, 5.75], [1.53, 5.75, 1.53, 10.2], [2.93, 5.75, 2.93, 7.6], [1.53, 7.6, 3.05, 7.6],
      [3.05, 7.6, 3.05, 9.1], [1.53, 9.1, 1.85, 9.1], [1.85, 9.1, 2.7, 9.1, 'd'], [2.7, 9.1, 3.05, 9.1],
      [5.0, 5.75, 5.0, 9.1], [1.53, 10.2, 5.1, 10.2],
    ],
    columns: [[1.53, 3.0], [7.95, 3.0], [7.95, 10.1], [4.83, 14.5], [1.53, 14.5], [7.95, 14.5], [1.53, 17.9], [4.71, 17.9], [7.95, 17.9]],
    furn: [
      { t: 'gatepillar', x: 6.46, y: -0.12, w: 0.45, d: 0.45 },
      { t: 'gate2', x: 6.91, y: -0.03, w: 2.74, d: 0.06 },
      { t: 'fountain2', x: 8.7, y: 3.45, w: 0.85, d: 2.0 },
      { t: 'tankcover', x: 1.6, y: 0.6, w: 0.7, d: 0.7 }, { t: 'tankcover', x: 5.9, y: 0.6, w: 0.7, d: 0.7 },
      { t: 'liftcar', x: 1.77, y: 7.82, w: 1.05, d: 1.1 },
      { t: 'wc', x: 1.6, y: 6.75, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 1.6, y: 5.9, w: 0.45, d: 0.5, face: 'w' },
      { t: 'floatsteps', x: 5.15, y: 9.25, w: 1.5, d: 0.8 },
      { t: 'pitbench', x: 1.75, y: 11.6, w: 0.6, d: 2.25, face: 'w', base: -0.45 },
      { t: 'pitbench', x: 2.35, y: 13.25, w: 1.9, d: 0.6, face: 's', base: -0.45 },
      { t: 'pitbench', x: 4.25, y: 11.6, w: 0.6, d: 2.25, face: 'e', base: -0.45 },
      { t: 'pittable', x: 2.75, y: 12.0, w: 1.1, d: 0.6, base: -0.45 },
      { t: 'pitsteps', x: 2.6, y: 11.15, w: 1.4, d: 0.45, base: -0.45 },
      { t: 'vgarden', x: 3.93, y: 14.65, w: 0.9, d: 0.2 }, { t: 'vgarden', x: 5.28, y: 14.65, w: 0.9, d: 0.2 },
      { t: 'planterhole', x: 5.3, y: 5.95, w: 0.61, d: 0.61 }, { t: 'planterhole', x: 5.3, y: 8.4, w: 0.61, d: 0.61 },
      { t: 'planterhole', x: 8.95, y: 11.0, w: 0.61, d: 1.22 }, { t: 'planterhole', x: 8.95, y: 12.7, w: 0.61, d: 1.22 },
    ],
  },

  /* ============================ FIRST ============================ */
  {
    id: 'f1', level: 1, short: '1', title: 'First Floor', tag: 'Residence · Mandir · 2 Bedrooms',
    w: 6.75, h: 15.5, drawing: 'assets/drawings/ff.png',
    spawn: { from: [3.75, 7.65, 80], to: [4.2, 6.2, 20] },
    summary: 'A two-bedroom residence entered from the lift lobby through a west-facing door. The whole east side is one open run: living at the front with the open Mandir in the north-east corner behind a single glass panel, dining against the east window, and the south-east kitchen opening to the rear balcony.',
    stats: [['Footprint', '6.75 × 15.50 m'], ['Bedrooms', '2'], ['Mandir', 'North-east corner']],
    rooms: [
      { id: 'bed1', name: 'Bedroom 1', size: '3.20 × 3.60 m', r: [0, 0, 3.42, 3.75], kind: '', notes: 'North-west bedroom with the 1.0 m enclosed balcony zone along the front glass as a window seat. Upholstered bed facing a TV on the east wall, a 1.5 ft deep wardrobe on the south wall, sheer curtains, and its own bath.', cam: { from: [3.0, 3.3, 1.5], to: [0.9, 1.2, 0.9] } },
      { id: 'living', name: 'Living', size: '3.10 × 4.92 m', poly: [[3.42, 0], [5.3, 0], [5.3, 1.75], [6.75, 1.75], [6.75, 5.6], [3.42, 5.6]], label: [4.9, 3.6], kind: '', notes: 'Spanish Beige marble underfoot and warm white walls. An L-shaped sofa runs along the stair-side wall and faces a TV on the solid stretch of the east wall. Light comes from the north glazing and a warm cove.', cam: { from: [3.75, 2.0, 1.55], to: [6.3, 3.6, 1.0] } },
      { id: 'mandir', name: 'Mandir', size: 'North-east corner', r: [5.3, 0, 6.75, 1.75], kind: '', notes: 'In the north-east corner of the first floor. A white marble shrine stands on the east wall, so you face east in prayer. It has a fluted stone back panel with a warm concealed light and a brass diya ledge. There are no partition walls: it stays open to the living room on the west, with a single clear glass panel on its south side.', cam: { from: [5.45, 1.35, 1.45], to: [6.45, 0.9, 1.15] } },
      { id: 'dining', name: 'Dining', size: '3.10 × 3.75 m', r: [3.42, 5.6, 6.75, 9.35], kind: '', notes: 'A six-seat dining table set against the east window, between living and kitchen, under a slim linear pendant. The residence door from the lobby opens here.', cam: { from: [4.0, 9.1, 1.5], to: [5.7, 6.9, 0.8] } },
      { id: 'kitchen', name: 'Kitchen + Dining', size: '3.10 × 4.50 m', r: [3.42, 9.35, 6.75, 13.85], label: [4.7, 12.3], kind: '', notes: N.kitchen + ' Built to the Godrej drawing for this floor: a 3.0 m run on the east wall with a 1.2 m return facing the dining table, in matt grey. The balcony door is at the right (east) end of the back wall, with windows across the rest.', cam: { from: [5.0, 13.55, 1.5], to: [6.2, 10.4, 0.9] } },
      { id: 'balcony', name: 'Balcony', size: '2.95 × 1.50 m', r: [3.42, 13.85, 6.75, 15.5], kind: 'bal', notes: N.balcony },
      ...CORE.rooms, ...BATH_F1.rooms,
    ],
    walls: [
      [0, 0, 2.15, 0, 'g'], [2.15, 0, 2.4, 0], [2.4, 0, 6.75, 0, 'g'], ...EAST(false, false),
      [3.42, 0, 3.42, 2.35], [3.42, 2.35, 3.42, 3.25, 'd'], [3.42, 3.25, 3.42, 3.75],
      [5.3, 1.75, 6.75, 1.75, 'gp'],
      [2.85, 9.3, 3.42, 9.3],
      ...CORE.walls, ...BATH_F1.walls,
    ],
    furn: [
      { t: 'bed', x: 0.06, y: 0.95, w: 2.05, d: 1.65, face: 'w' },
      { t: 'nightstand', x: 0.06, y: 0.48, w: 0.45, d: 0.42 }, { t: 'nightstand', x: 0.06, y: 2.65, w: 0.45, d: 0.42 },
      { t: 'wardrobe', x: 1.4, y: 3.25, w: 1.65, d: 0.45, face: 's' },
      { t: 'tv', x: 2.94, y: 0.55, w: 0.42, d: 1.5, face: 'e' },
      { t: 'curtain', x: 0.12, y: 0.07, w: 3.2, d: 0.1, face: 'n' },
      { t: 'mandir', x: 6.2, y: 0.2, w: 0.5, d: 1.3, face: 'e' }, { t: 'aasan', x: 5.5, y: 0.55, w: 0.6, d: 0.6 },
      { t: 'curtain', x: 3.55, y: 0.07, w: 1.7, d: 0.1, face: 'n' },
      ...LIVING_F1,
      { t: 'dining', x: 5.2, y: 6.6, w: 0.95, d: 1.75 },
      // Godrej kitchen, first floor: L with tall units + return
      { t: 'counter', x: 6.03, y: 10.3, w: 0.6, d: 2.7, face: 'e' },
      { t: 'counter', x: 4.83, y: 10.3, w: 1.2, d: 0.5, face: 'n', low: true },
      { t: 'stool', x: 5.05, y: 9.8, w: 0.36, d: 0.36 }, { t: 'stool', x: 5.6, y: 9.8, w: 0.36, d: 0.36 },
      ...CORE.furn, ...BATH_F1.furn,
    ],
  },

  upper({ id: 'f2', level: 2, short: '2', title: 'Second Floor', drawing: 'assets/drawings/sf.png', cut: false }),
  upper({ id: 'f3', level: 3, short: '3', title: 'Third Floor', drawing: 'assets/drawings/tf.png', cut: true }),

  /* ============================ TERRACE ============================ */
  {
    id: 't', level: 4, short: 'T', title: 'Terrace', tag: 'Plunge Pool · Pergola · Lawn',
    w: 6.75, h: 15.5, openAir: true, drawing: 'assets/drawings/tr.png',
    orbit: { theta: 0, phi: 0.05 },
    spawn: { from: [4.2, 7.6, 180], to: [4.2, 7.6, 180] },
    slabHoles: [[3.3, 9.15, 6.65, 12.5]],
    summary: 'A green roof: lawn across the whole terrace and nothing else on it, no benches or tables. The 11 × 11 ft plunge pool is sunk flush into the slab just outside the stair door on the east. A large three-post pergola runs along the west side from the stair-head wall to the parapet. Two water tanks sit on the stair-head roof behind a screen of fins, and the skylight lights the third floor below.',
    stats: [['Plunge pool', '≈ 11 × 11 ft · 3 ft deep, flush'], ['Flooring', 'Lawn throughout'], ['Water tanks', '2, screened by fins']],
    rooms: [
      { id: 'tgarden', name: 'Front Lawn', size: '6.75 × 3.75 m', r: [0, 0, 6.75, 3.75], kind: 'lawn', notes: 'Lawn around the skylight that brings daylight into the third-floor bedroom below.', cam: { from: [6.2, 3.4, 1.6], to: [1.4, 1.2, 0.6] } },
      { id: 'tside', name: 'East Lawn', size: '3.25 × 4.50 m', r: [3.5, 3.75, 6.75, 8.25], kind: 'lawn', notes: 'Lawn beside the stair head, with the outdoor shower on the stair-head wall.' },
      { id: 'tpergola', name: 'Pergola', size: '3.20 × 7.25 m', r: [0, 8.25, 3.2, 15.5], kind: 'lawn', notes: 'A large slatted pergola on three posts, fixed to the stair-head wall at its north end and running south to the parapet. Lawn underneath, with nothing else on it.', cam: { from: [2.9, 15.0, 1.6], to: [1.4, 9.0, 1.9] } },
      { id: 'teast', name: 'Pool Lawn', size: '3.55 × 7.25 m', r: [3.2, 8.25, 6.75, 15.5], kind: 'lawn', holes: [[3.3, 9.15, 6.65, 12.5]], notes: 'Lawn around the pool and south to the glass parapet.' },
      { id: 'pool', name: 'Plunge Pool', size: '≈ 11 × 11 ft · 0.90 m deep', r: [3.3, 9.15, 6.65, 12.5], kind: 'pool', notes: 'Sunk below the terrace slab where the outdoor dining used to be, so the water is level with the lawn and you step straight down into it. About 11 × 11 ft and 3 ft deep, with a slim marble coping and an underwater warm light.', cam: { from: [4.0, 14.9, 1.7], to: [5.0, 10.8, -0.2] } },
      { id: 'ttoilet', name: 'Toilet', size: '1.23 × 1.70 m', r: [0, 3.75, 1.38, 5.6], kind: 'wet', notes: N.bath },
      { id: 'tlift', name: 'Lift Overrun', size: '3.60 m overhead', r: [0, 5.6, 1.53, 7.1], kind: 'core', notes: 'The lift serves the stilt to the third floor. This is its overrun, inside the stair head.' },
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
      { t: 'wc', x: 0.08, y: 4.9, w: 0.4, d: 0.55, face: 'w' }, { t: 'basin', x: 0.08, y: 3.9, w: 0.45, d: 0.5, face: 'w' },
      { t: 'oshower', x: 3.56, y: 4.1, w: 0.2, d: 0.9, face: 'w' },
      { t: 'poolflush', x: 3.3, y: 9.15, w: 3.35, d: 3.35, depth: 0.9 },
      { t: 'pergola3', x: 0.12, y: 8.3, w: 3.0, d: 7.08 },
      { t: 'tank', x: 0.45, y: 4.85, w: 1.0, d: 1.0, onRoof: true }, { t: 'tank', x: 1.85, y: 4.85, w: 1.0, d: 1.0, onRoof: true },
      { t: 'tankfins', x: 0.2, y: 4.55, w: 2.95, d: 1.6 },
    ],
  },
];

function upper({ id, level, short, title, drawing, cut }) {
  const master = cut
    ? { id: 'master', name: 'Bedroom 1 · Gallery', size: '3.20 × 3.60 m', r: [0, 0, 3.55, 3.75], kind: '', notes: 'On the third floor, Bedroom 1 looks through a glass railing into the double-height volume and its white marble wall, like a mezzanine gallery. The terrace skylight above brings daylight straight down into the room. A 1.5 ft deep wardrobe on the south wall and a low TV unit facing the bed.', cam: { from: [3.35, 2.95, 1.6], to: [5.2, 0.9, 0.2] } }
    : { id: 'master', name: 'Bedroom 1 · Double-height Retreat', size: '6.45 × 3.60 m', label: [5.1, 1.1], poly: [[0, 0], [6.75, 0], [6.75, 2.25], [3.55, 2.25], [3.55, 3.75], [0, 3.75]], kind: '', notes: 'The full-width bedroom across the north front. Its eastern half rises two storeys behind tall TOSTEM glazing, a private double-height retreat discovered upstairs and kept away from the entrance. The back wall of that volume is the home’s single hero moment: a white marble wall, two storeys tall, behind frameless glazing. Two armchairs and a reading lamp sit before it, and the bed faces a low TV unit.', cam: { from: [3.3, 2.05, 1.55], to: [5.9, 0.6, 2.6] } };
  const rooms = [
    master,
    { id: 'living', name: 'Living', size: '3.10 × 7.68 m', label: [5.1, 5.0], poly: [[3.55, 2.25], [6.75, 2.25], [6.75, 8.25], [3.42, 8.25], [3.42, 3.75], [3.55, 3.75]], kind: '', notes: 'Spanish Beige marble and warm white walls. An L-shaped sofa faces a TV wall on the north side, with a stone coffee table between. The hills fill both east windows.', cam: { from: [6.3, 7.9, 1.55], to: [4.2, 3.0, 1.0] } },
    { id: 'kitchen', name: 'Kitchen + Dining', size: '3.10 × 5.62 m', label: [4.6, 11.4], r: [3.42, 8.25, 6.75, 13.85], kind: '', notes: N.kitchen + (cut ? ' Built to the Godrej drawing for this floor: a straight 3.0 m run and a free-standing 820 × 700 mm island.' : ' Built to the Godrej drawing for this floor: the main run on the east wall, a tall glass-fronted crockery unit on the west wall, and an 820 × 700 mm island.') + ' Cabinets are matt grey. The six-seat dining table sits against the east window at the living end, and the balcony door is at the right end of the back wall.', cam: { from: [5.0, 13.55, 1.5], to: [6.2, 10.4, 0.9] } },
    { id: 'balcony', name: 'Balcony', size: '2.95 × 1.50 m', r: [3.42, 13.85, 6.75, 15.5], kind: 'bal', notes: N.balcony },
    ...CORE.rooms, ...BATH_BIG.rooms,
  ];
  if (cut) rooms.splice(1, 0, { id: 'void', name: 'Double-height Void', size: '3.25 × 2.25 m', r: [3.55, 0, 6.75, 2.25], kind: 'void', notes: 'The X on the drawing: the upper half of the second-floor retreat. You look down into it from the gallery railing, and the white marble wall continues up through it.', cam: { from: [3.25, 0.5, 1.6], to: [5.6, 1.6, -0.8] } });

  const walls = [
    [0, 0, 2.15, 0, 'g'], [2.15, 0, 2.4, 0], [2.4, 0, 3.55, 0, 'g'], [3.55, 0, 6.75, 0, 'g', cut ? { frameless: true } : { hh: 5.8, frameless: true }], ...EAST(!cut, true),
    [3.55, 2.25, 6.75, 2.25, 'w', cut ? undefined : { hh: 5.8 }], [3.55, 2.25, 3.55, 2.7], [3.55, 2.7, 3.55, 3.72, 'd'], [3.42, 3.75, 3.55, 3.75],
    [2.85, 9.3, 3.42, 9.3],
    ...CORE.walls, ...BATH_BIG.walls,
  ];
  if (cut) walls.push([3.55, 0.1, 3.55, 2.25, 'r']);

  const furn = [
    { t: 'bed', x: 0.06, y: 0.75, w: 2.1, d: 1.9, face: 'w' },
    { t: 'nightstand', x: 0.06, y: 0.28, w: 0.5, d: 0.42 }, { t: 'nightstand', x: 0.06, y: 2.7, w: 0.5, d: 0.42 },
    { t: 'wardrobe', x: 1.4, y: 3.25, w: 1.65, d: 0.45, face: 's' },
    { t: 'curtain', x: 0.12, y: 0.07, w: 3.2, d: 0.1, face: 'n' },
    { t: 'tv', x: 2.75, y: 1.1, w: 0.42, d: 1.5, face: 'e', low: true },
    ...LIVING_UP,
    { t: 'dining', x: 5.2, y: 8.5, w: 0.95, d: 1.75 },
    { t: 'counter', x: 6.03, y: 10.4, w: 0.6, d: 2.7, face: 'e' },
    { t: 'island', x: 4.35, y: 12.3, w: 0.7, d: 0.82 },
    ...(cut ? [] : [{ t: 'tall', x: 3.48, y: 12.55, w: 0.32, d: 1.05, face: 'w', tone: 'kitchen', glass: true }]),
    ...CORE.furn, ...BATH_BIG.furn,
  ];
  if (!cut) furn.push(
    { t: 'onyx', x: 3.6, y: 1.98, w: 3.1, d: 0.22, face: 's', h: 5.75 },
    { t: 'armchair', x: 4.15, y: 0.45, w: 0.78, d: 0.78, face: 'n' }, { t: 'armchair', x: 5.6, y: 0.45, w: 0.78, d: 0.78, face: 'n' },
    { t: 'sidetable', x: 5.03, y: 0.6, w: 0.42, d: 0.42 }, { t: 'floorlamp', x: 6.3, y: 1.35, w: 0.32, d: 0.32 },
    { t: 'rug', x: 3.9, y: 0.3, w: 2.6, d: 1.5 });
  else furn.push({ t: 'onyx', x: 3.6, y: 1.98, w: 3.1, d: 0.22, face: 's', h: 2.85, upper: true });

  return {
    id, level, short, title, w: 6.75, h: 15.5, drawing,
    tag: cut ? 'Residence · Gallery over the Retreat' : 'Residence · Double-height Retreat',
    spawn: { from: [3.75, 7.65, 80], to: [4.7, 6.9, 15] },
    dbl: cut ? null : [3.55, 0, 6.75, 2.25],            // region whose ceiling is two storeys up
    voidR: cut ? [3.55, 0, 6.75, 2.25] : null,           // floor hole
    skylight: cut ? [0.4, 1.0, 1.95, 2.5] : null,
    summary: cut
      ? 'Two bedrooms with living, dining and kitchen along the east side. At the north-east the floor is cut away (the X on the drawing) and Bedroom 1 becomes a gallery overlooking the double-height retreat below. A skylight from the terrace lights it from above, and Bath 2 is one large bathroom with a jacuzzi.'
      : 'Two bedrooms with living, dining and kitchen along the east side. Bedroom 1 spans the whole north front (6.45 m), and its eastern half is the double-height retreat with a white marble wall rising two storeys behind frameless glass. Bath 2 and the walk-in wardrobe are one large bathroom with a jacuzzi.',
    stats: [['Footprint', '6.75 × 15.50 m'], ['Bedrooms', '2'], cut ? ['Skylight', 'Over Bedroom 1'] : ['Marble wall', 'White, two storeys']],
    rooms, walls, furn,
  };
}
window.HOUSE = { H, elev: { g: 0, f1: 3.3, f2: 6.5, f3: 9.7, t: 12.9 }, off: { x: 1.5, z: 3.0 }, plot: { w: 9.75, h: 19.0 } };
