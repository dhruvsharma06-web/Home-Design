/* Landing: the live 3D house (drag to turn it), set in the scenery of the original exterior photo.
   These hooks keep app.js unchanged; the 3D world does the work. */
(function () {
  const w = () => window.b4world;
  window.landInit = function () {};
  window.landHover = function (id) { if (!w()) return; w().hoverLevel(id); w().cb.onLevelHover && w().cb.onLevelHover(id); };
  window.landZoom = function (id, done) { if (!w()) return done(); w().pause(false); w().diveTo(id, done); };
  window.landShow = function () { if (!w()) return; w().pause(false); w().showExterior(); };
  window.landNight = function () {};
})();
