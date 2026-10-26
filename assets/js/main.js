(function () {
  "use strict";

  var CONFIG = window.DP_CONFIG || {};
  var I18N = window.DP_I18N || { en: {}, messages: {}, meta: {} };
  var LANG_KEY = "dp-lang";
  var root = document.documentElement;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function lang() { return root.lang === "en" ? "en" : "ar"; }
  function msg(key) { return (I18N.messages[lang()] || {})[key] || ""; }

  /* ------------------------------------------------------------------
     Language (Arabic default, English optional)
     ------------------------------------------------------------------ */
  // Cache the Arabic copy straight from the markup the first time we see it.
  function cacheArabic() {
    $$("[data-i18n]").forEach(function (el) { if (el.dataset.ar === undefined) el.dataset.ar = el.textContent; });
    $$("[data-i18n-html]").forEach(function (el) { if (el.dataset.arHtml === undefined) el.dataset.arHtml = el.innerHTML; });
    $$("[data-i18n-ph]").forEach(function (el) { if (el.dataset.arPh === undefined) el.dataset.arPh = el.getAttribute("placeholder") || ""; });
    $$("[data-i18n-aria]").forEach(function (el) { if (el.dataset.arAria === undefined) el.dataset.arAria = el.getAttribute("aria-label") || ""; });
  }

  function applyLanguage(next) {
    var en = next === "en";
    var dict = I18N.en || {};

    root.lang = en ? "en" : "ar";
    root.dir = en ? "ltr" : "rtl";

    $$("[data-i18n]").forEach(function (el) {
      var key = el.dataset.i18n;
      el.textContent = en && dict[key] ? dict[key] : el.dataset.ar;
    });
    $$("[data-i18n-html]").forEach(function (el) {
      var key = el.dataset.i18nHtml;
      el.innerHTML = en && dict[key] ? dict[key] : el.dataset.arHtml;
    });
    $$("[data-i18n-ph]").forEach(function (el) {
      var key = el.dataset.i18nPh;
      el.setAttribute("placeholder", en && dict[key] ? dict[key] : el.dataset.arPh);
    });
    $$("[data-i18n-aria]").forEach(function (el) {
      var key = el.dataset.i18nAria;
      el.setAttribute("aria-label", en && dict[key] ? dict[key] : el.dataset.arAria);
    });

    var meta = (I18N.meta || {})[en ? "en" : "ar"];
    if (meta) {
      document.title = meta.title;
      var desc = $('meta[name="description"]');
      if (desc) desc.setAttribute("content", meta.description);
    }

    $$("[data-lang-toggle]").forEach(function (btn) {
      btn.textContent = msg("langButton");
      btn.setAttribute("lang", en ? "ar" : "en");
    });

    renderContact();
    clearFormErrors();
  }

  function initLanguage() {
    cacheArabic();

    var fromUrl = new URLSearchParams(window.location.search).get("lang");
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* storage blocked */ }
    var initial = fromUrl === "en" || fromUrl === "ar" ? fromUrl : saved === "en" ? "en" : "ar";

    applyLanguage(initial);

    $$("[data-lang-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = lang() === "ar" ? "en" : "ar";
        applyLanguage(next);
        try { localStorage.setItem(LANG_KEY, next); } catch (e) { /* storage blocked */ }
      });
    });
  }

  /* ------------------------------------------------------------------
     Contact details from config.js (empty values are hidden)
     ------------------------------------------------------------------ */
  function renderContact() {
    var email = (CONFIG.email || "").trim();
    var phone = (CONFIG.phone || "").trim();
    var wa = String(CONFIG.whatsapp || "").replace(/\D/g, "");
    var loc = CONFIG.location ? CONFIG.location[lang()] || CONFIG.location.ar || "" : "";
    var values = { email: email, phone: phone, whatsapp: wa, location: loc };

    $$("[data-contact-item]").forEach(function (item) {
      item.hidden = !values[item.dataset.contactItem];
    });

    $$('[data-contact="email"]').forEach(function (a) { a.textContent = email; a.href = "mailto:" + email; });
    $$('[data-contact="phone"]').forEach(function (a) { a.textContent = phone; a.href = "tel:" + phone.replace(/[^\d+]/g, ""); });
    $$('[data-contact="whatsapp"], [data-contact="whatsapp-float"]').forEach(function (a) { a.href = "https://wa.me/" + wa; });
    $$('[data-contact="location"]').forEach(function (el) { el.textContent = loc; });

    var waFloat = $('[data-contact="whatsapp-float"]');
    if (waFloat) waFloat.hidden = !wa;

    var social = CONFIG.social || {};
    var networks = [
      { key: "linkedin", icon: "i-linkedin", label: "LinkedIn" },
      { key: "x", icon: "i-x", label: "X" },
      { key: "instagram", icon: "i-instagram", label: "Instagram" }
    ];
    $$("[data-socials]").forEach(function (box) {
      box.innerHTML = "";
      networks.forEach(function (n) {
        if (!social[n.key]) return;
        var a = document.createElement("a");
        a.href = social[n.key];
        a.target = "_blank";
        a.rel = "noopener";
        a.setAttribute("aria-label", n.label);
        a.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#' + n.icon + '"/></svg>';
        box.appendChild(a);
      });
    });
  }

  /* ------------------------------------------------------------------
     Header: scrolled state, mobile menu, active link
     ------------------------------------------------------------------ */
  function initHeader() {
    var header = $("#site-header");
    var nav = $("#main-nav");
    var toggle = $(".menu-toggle");

    function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 8); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    function setMenu(open) {
      nav.classList.toggle("is-open", open);
      header.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", msg(open ? "menuClose" : "menuOpen"));
    }
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

    if (!("IntersectionObserver" in window)) return;
    // Highlight the nav link of the section in the middle of the screen (none for sections without a link)
    var links = $$('a[href^="#"]', nav).filter(function (a) { return !a.classList.contains("btn"); });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main > section[id]").forEach(function (section) { spy.observe(section); });
  }

  /* ------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------ */
  function initReveal() {
    var targets = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    // Stagger siblings inside the same grid
    targets.forEach(function (el) {
      var siblings = el.parentElement ? $$(":scope > .reveal", el.parentElement) : [];
      var i = siblings.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i, 5) * 80 + "ms";
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------
     "Request this service" pre-selects the service in the form
     ------------------------------------------------------------------ */
  function initServiceLinks() {
    var select = $("#f-service");
    $$("[data-service]").forEach(function (link) {
      link.addEventListener("click", function () {
        if (select) select.value = link.dataset.service;
        setTimeout(function () { var name = $("#f-name"); if (name) name.focus({ preventScroll: true }); }, 600);
      });
    });
  }

  /* ------------------------------------------------------------------
     Contact form
     ------------------------------------------------------------------ */
  var form = null;

  function fieldOf(input) { return input.closest(".field"); }

  function setError(input, text) {
    var field = fieldOf(input);
    var out = field && $(".field-error", field);
    if (!field || !out) return;
    field.classList.toggle("has-error", !!text);
    out.textContent = text || "";
    if (text) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  }

  function clearFormErrors() {
    if (!form) return;
    $$("input, textarea", form).forEach(function (i) { setError(i, ""); });
  }

  function validate(input) {
    var v = input.value.trim();
    if (input.required && !v) return msg("required");
    if (input.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return msg("email");
    if (input.type === "tel" && v && v.replace(/\D/g, "").length < 9) return msg("phone");
    return "";
  }

  function showAlert(type, text) {
    var box = $(".alert", form);
    box.hidden = false;
    box.className = "alert field--full is-" + type;
    $("use", box).setAttribute("href", type === "error" ? "#i-alert" : "#i-check-circle");
    $("p", box).textContent = text;
  }

  function setLoading(on) {
    var btn = $(".submit-btn", form);
    var label = $(".btn-label", btn);
    btn.classList.toggle("is-loading", on);
    btn.disabled = on;
    label.textContent = on ? msg("sending") : (lang() === "en" ? I18N.en["form.submit"] : label.dataset.ar);
  }

  function mailtoFallback(data) {
    var lines = [
      (lang() === "en" ? "Name: " : "الاسم: ") + data.get("name"),
      (lang() === "en" ? "Company: " : "الشركة: ") + (data.get("company") || "-"),
      (lang() === "en" ? "Email: " : "البريد: ") + data.get("email"),
      (lang() === "en" ? "Phone: " : "الجوال: ") + data.get("phone"),
      (lang() === "en" ? "Service: " : "الخدمة: ") + (data.get("service_label") || "-"),
      "",
      data.get("message")
    ];
    window.location.href = "mailto:" + encodeURIComponent(CONFIG.email || "") +
      "?subject=" + encodeURIComponent(msg("mailSubject")) +
      "&body=" + encodeURIComponent(lines.join("\n"));
  }

  function initForm() {
    form = $("#contact-form");
    if (!form) return;

    var inputs = $$("input:not([name=website]), textarea", form);
    inputs.forEach(function (input) {
      input.addEventListener("blur", function () { if (input.value.trim()) setError(input, validate(input)); });
      input.addEventListener("input", function () { if (fieldOf(input).classList.contains("has-error")) setError(input, validate(input)); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var firstBad = null;
      inputs.forEach(function (input) {
        var err = validate(input);
        setError(input, err);
        if (err && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }

      // Spam trap filled → pretend success, send nothing.
      if (form.website && form.website.value) { form.reset(); showAlert("success", msg("success")); return; }

      var data = new FormData(form);
      data.delete("website");
      var select = $("#f-service");
      data.append("service_label", select.value ? select.options[select.selectedIndex].text : "");
      data.append("language", lang());
      data.append("page", window.location.href);

      var endpoint = (CONFIG.formEndpoint || "").trim();
      if (!endpoint) {
        mailtoFallback(data);
        showAlert("info", msg("mailto"));
        return;
      }

      setLoading(true);
      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          form.reset();
          showAlert("success", msg("success"));
        })
        .catch(function () { showAlert("error", msg("error")); })
        .then(function () { setLoading(false); });
    });
  }

  /* ------------------------------------------------------------------
     Youthful layer: rotating word, stickers, spotlight, magnetic buttons,
     service preview, tilt. All pointer effects are desktop-only and skip
     when the visitor prefers reduced motion.
     ------------------------------------------------------------------ */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function initRotator() {
    if (reduceMotion) return;
    var i = 0;
    setInterval(function () {
      // Re-query each tick: switching language rebuilds the hero copy.
      var box = $(".rotator");
      var word = box && $(".rotator-word", box);
      if (!word || document.hidden) return;
      var words = box.dataset.words.split("|");
      i = (words.indexOf(word.textContent) + 1) % words.length;
      word.classList.remove("is-in");
      word.classList.add("is-out");
      setTimeout(function () {
        word.textContent = words[i];
        word.classList.remove("is-out");
        word.classList.add("is-in");
      }, 260);
    }, 2400);
  }

  function initStickers() {
    $$(".sticker").forEach(function (el) {
      var startX, startY, baseX = 0, baseY = 0;
      el.addEventListener("pointerdown", function (e) {
        el.setPointerCapture(e.pointerId);
        el.classList.add("is-dragging");
        startX = e.clientX; startY = e.clientY;
      });
      el.addEventListener("pointermove", function (e) {
        if (!el.classList.contains("is-dragging")) return;
        el.style.setProperty("--dx", baseX + e.clientX - startX + "px");
        el.style.setProperty("--dy", baseY + e.clientY - startY + "px");
      });
      function drop(e) {
        if (!el.classList.contains("is-dragging")) return;
        baseX += e.clientX - startX; baseY += e.clientY - startY;
        el.classList.remove("is-dragging");
      }
      el.addEventListener("pointerup", drop);
      el.addEventListener("pointercancel", drop);
    });
  }

  function initSpotlight() {
    var hero = $(".hero");
    if (!hero || !finePointer || reduceMotion) return;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", e.clientX - r.left + "px");
      hero.style.setProperty("--my", e.clientY - r.top + "px");
    });
  }

  function initMagnetic() {
    if (!finePointer || reduceMotion) return;
    $$(".magnetic").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty("--tx", (e.clientX - r.left - r.width / 2) * 0.25 + "px");
        btn.style.setProperty("--ty", (e.clientY - r.top - r.height / 2) * 0.35 + "px");
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.setProperty("--tx", "0px");
        btn.style.setProperty("--ty", "0px");
      });
    });
  }

  function initServicePreview() {
    if (!finePointer || reduceMotion) return;
    var looks = [
      "linear-gradient(150deg, #1FC8F6, #2D63FC)",
      "linear-gradient(150deg, #183889, #0A1B3D)",
      "linear-gradient(150deg, #2D63FC, #122B67)"
    ];
    var card = document.createElement("div");
    card.className = "svc-preview";
    card.setAttribute("aria-hidden", "true");
    card.innerHTML = '<span class="pv-pixels"><i></i><i></i><i></i></span><span class="pv-num"></span><span class="pv-title"></span>';
    document.body.appendChild(card);

    var x = 0, y = 0, cx = 0, cy = 0, raf = null;
    function follow() {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      card.style.transform = "translate(" + (cx + 24) + "px," + (cy - 90) + "px)";
      card.style.setProperty("--pv-rot", Math.max(-8, Math.min(8, (x - cx) * 0.15)) + "deg");
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.5 ? requestAnimationFrame(follow) : null;
    }
    $$(".svc").forEach(function (row, i) {
      row.addEventListener("pointerenter", function (e) {
        $(".pv-num", card).textContent = $(".svc-num", row).textContent;
        $(".pv-title", card).textContent = $(".svc-title", row).textContent;
        card.style.setProperty("--pv-bg", looks[i % looks.length]);
        if (!card.classList.contains("is-on")) { cx = x = e.clientX; cy = y = e.clientY; }
        card.classList.add("is-on");
      });
      row.addEventListener("pointermove", function (e) {
        x = e.clientX; y = e.clientY;
        if (!raf) raf = requestAnimationFrame(follow);
      });
      row.addEventListener("pointerleave", function () { card.classList.remove("is-on"); });
    });
  }

  function initTilt() {
    if (!finePointer || reduceMotion) return;
    $$(".tile").forEach(function (tile) {
      tile.addEventListener("pointermove", function (e) {
        var r = tile.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tile.classList.add("is-tilting");
        tile.style.setProperty("--ry", px * 6 + "deg");
        tile.style.setProperty("--rx", -py * 6 + "deg");
      });
      tile.addEventListener("pointerleave", function () {
        tile.classList.remove("is-tilting");
        tile.style.setProperty("--rx", "0deg");
        tile.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ------------------------------------------------------------------ */
  function init() {
    var year = $("[data-year]");
    if (year) year.textContent = new Date().getFullYear();

    initForm();
    initLanguage();
    initHeader();
    initReveal();
    initServiceLinks();
    initRotator();
    initStickers();
    initSpotlight();
    initMagnetic();
    initServicePreview();
    initTilt();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
