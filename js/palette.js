/* B4 palette — from the Materials, Light & Façade document.
   Warm white · Spanish Beige marble · warm-greige fins · Shine Grey glazing · olive joinery. */
window.PALETTE = {
  white: '#FAF8F4', paper: '#F3EFE7', greige: '#CFC6BA', greigeDeep: '#B9AC9B', greigeDark: '#6F665C',
  ink: '#24211D', marble: '#EADBC2', shineGrey: '#8D9095', olive: '#70745F', onyx: '#F3DDB0', brass: '#C2A468',
};
(function () {
  const r = document.documentElement.style, P = window.PALETTE;
  for (const [k, v] of Object.entries({ '--white': P.white, '--paper': P.paper, '--greige': P.greige, '--greige-deep': P.greigeDeep, '--greige-dark': P.greigeDark, '--ink': P.ink, '--marble': P.marble, '--oak': P.brass, '--brass': P.brass })) r.setProperty(k, v);
})();
