/* Extra English strings for the 3D journey (Arabic is the source copy in the markup / scenes). */
(function () {
  var D = (window.DP_I18N = window.DP_I18N || { en: {}, messages: {}, meta: {} });
  D.en = D.en || {};
  var add = {
    "j.progress": "Progress",
    "j.scroll": "Keep scrolling",
    "j.lite": "Lite mode",
    "j.full": "Enable 3D",
    "j.c.riyadh": "Riyadh", "j.c.jeddah": "Jeddah", "j.c.dammam": "Dammam", "j.c.dubai": "Dubai",
    "j.c.doha": "Doha", "j.c.kuwait": "Kuwait", "j.c.muscat": "Muscat", "j.c.manama": "Manama",
    "j.gate": "Websites & online stores",
    "j.gate1": "Systems & apps"
  };
  for (var k in add) if (!D.en[k]) D.en[k] = add[k];
  if (D.messages) {
    D.messages.ar = D.messages.ar || {}; D.messages.en = D.messages.en || {};
    D.messages.ar.liteOn = "وضع خفيف"; D.messages.ar.liteOff = "تفعيل 3D";
    D.messages.en.liteOn = "Lite mode"; D.messages.en.liteOff = "Enable 3D";
  }
})();
