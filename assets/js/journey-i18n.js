/* Extra English strings for the HQ tour (sections 2-6). Arabic is the source copy in the markup and the 3D modules. */
(function () {
  var D = (window.DP_I18N = window.DP_I18N || { en: {}, messages: {}, meta: {} });
  D.en = D.en || {};
  var add = {
    "j.progress": "Progress",
    "j.scroll": "Keep scrolling",
    "j.lite": "Lite mode",
    "j.full": "Enable 3D",
    "j.loading": "Preparing the building…",
    "j.more": "Service details"
  };
  for (var k in add) if (!D.en[k]) D.en[k] = add[k];
})();
