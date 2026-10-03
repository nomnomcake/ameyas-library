/* ============================================================
   Ameya's Library — app
   ------------------------------------------------------------
   Plain script. Reads the global SECTIONS and PAINTING from
   config.js (which loads first). No modules, no build step.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- DOM handles ---------- */
  var stage     = document.getElementById("stage");
  var hotspotsEl = document.getElementById("hotspots");
  var layerBase  = document.getElementById("layer-base");
  var layerSharp = document.getElementById("layer-sharp");
  var painting   = document.getElementById("painting");

  /* Which sections to render. Dev mode (step 2) may swap this for a
     localStorage draft; everything else reads through getSections(). */
  var activeSections = Array.isArray(window.SECTIONS) ? window.SECTIONS : [];
  function getSections() { return activeSections; }
  function setSections(list) { activeSections = list; renderHotspots(); }

  /* ---------- Config validation ----------
     Fail loudly in the console, never silently in the UI. */
  function validateConfig(sections) {
    var problems = 0;
    function warn(msg) { problems++; console.warn("[Ameya's Library config] " + msg); }

    if (!Array.isArray(sections) || sections.length === 0) {
      warn("SECTIONS is empty or missing. Check config.js loads before app.js.");
      return;
    }

    var seenIds = {};
    sections.forEach(function (s, i) {
      var name = s && s.id ? s.id : "section #" + i;
      if (!s.id) warn(name + " has no id.");
      if (seenIds[s.id]) warn("Duplicate id: " + s.id);
      seenIds[s.id] = true;
      if (!s.label) warn(name + " has no label.");
      if (!s.theme) warn(name + " has no theme.");
      var h = s.hotspot;
      if (!h || typeof h.x !== "number" || typeof h.y !== "number" || typeof h.w !== "number" || typeof h.h !== "number") {
        warn(name + " has no usable hotspot {x, y, w, h}.");
      } else if (h.x < 0 || h.y < 0 || h.x + h.w > 100.01 || h.y + h.h > 100.01) {
        warn(name + " hotspot runs off the painting: " + JSON.stringify(h));
      }
      if (s.shape && s.shape !== "rect" && s.shape !== "ellipse") warn(name + " shape must be rect or ellipse, got " + s.shape);
      if (s.labelPosition && ["left", "right", "above", "below"].indexOf(s.labelPosition) === -1) {
        warn(name + " labelPosition must be left, right, above or below.");
      }
      (s.items || []).forEach(function (item, j) {
        if (item.image) checkImage(item.image, name + " item " + j);
        if (item.image && !item.alt) warn(name + " item " + j + " (" + (item.title || "untitled") + ") has an image but no alt text.");
      });
    });

    /* Overlap check: any two rect bounding boxes that intersect. */
    for (var a = 0; a < sections.length; a++) {
      for (var b = a + 1; b < sections.length; b++) {
        var p = sections[a].hotspot, q = sections[b].hotspot;
        if (!p || !q) continue;
        var overlap = p.x < q.x + q.w && p.x + p.w > q.x && p.y < q.y + q.h && p.y + p.h > q.y;
        if (overlap) warn("Hotspots overlap: " + sections[a].id + " and " + sections[b].id);
      }
    }

    if (window.PAINTING && painting) {
      painting.addEventListener("error", function () { warn("Painting failed to load: " + painting.getAttribute("src")); });
      painting.addEventListener("load", function () {
        if (painting.naturalWidth && (painting.naturalWidth !== PAINTING.width || painting.naturalHeight !== PAINTING.height)) {
          warn("PAINTING.width/height in config.js (" + PAINTING.width + "x" + PAINTING.height + ") don't match the actual image (" +
               painting.naturalWidth + "x" + painting.naturalHeight + "). Hotspots will drift.");
        }
      });
    }

    if (problems === 0) console.info("[Ameya's Library] config OK: " + sections.length + " sections.");
  }

  function checkImage(src, where) {
    var probe = new Image();
    probe.onerror = function () { console.warn("[Ameya's Library config] Image not found for " + where + ": " + src); };
    probe.src = src;
  }

  /* ---------- Hotspots ---------- */
  function hotspotStyle(h) {
    return "left:" + h.x + "%;top:" + h.y + "%;width:" + h.w + "%;height:" + h.h + "%;";
  }

  function renderHotspots() {
    hotspotsEl.innerHTML = "";
    getSections().forEach(function (s) {
      if (!s.hotspot) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hotspot" + (s.shape === "ellipse" ? " is-ellipse" : " is-rect") +
                      " label-" + (s.labelPosition || "right");
      btn.dataset.id = s.id;
      btn.setAttribute("aria-label", "Open " + (s.label || s.id).toLowerCase());
      btn.setAttribute("style", hotspotStyle(s.hotspot));
      /* Step 3: the lit surface (sheen + lift) and the label beside the object. */
      var surface = document.createElement("span");
      surface.className = "hotspot-surface";
      surface.setAttribute("aria-hidden", "true");
      btn.appendChild(surface);
      var label = document.createElement("span");
      label.className = "hotspot-label";
      label.setAttribute("aria-hidden", "true");
      label.textContent = s.label || s.id;
      btn.appendChild(label);
      btn.addEventListener("click", function () { onHotspotClick(s, btn); });
      hotspotsEl.appendChild(btn);
    });
  }

  function onHotspotClick(section, btn) {
    if (window.Library && window.Library.openSection) window.Library.openSection(section.id, btn);
    else console.log("[Ameya's Library] clicked:", section.id);
  }

  /* ---------- Boot ---------- */
  validateConfig(getSections());
  renderHotspots();

  /* Small public surface for dev.js (step 2) and later steps. */
  window.Library = {
    getSections: getSections,
    setSections: setSections,
    renderHotspots: renderHotspots,
    hotspotStyle: hotspotStyle,
    els: { stage: stage, hotspots: hotspotsEl, layerBase: layerBase, layerSharp: layerSharp, painting: painting }
  };
})();

/* ---------- Dev mode loader (step 2) ----------
   dev.js only loads when the URL ends in ?dev. Visitors never fetch it. */
(function () {
  if (/[?&]dev$/.test(location.search)) {
    var s = document.createElement("script");
    s.src = "dev.js";
    document.body.appendChild(s);
  }
})();

/* ============================================================
   Step 4: the panel
   ============================================================ */
(function () {
  "use strict";
  var L = window.Library;
  var body = document.body;
  var panel     = document.getElementById("panel");
  var scrim     = document.getElementById("scrim");
  var closeBtn  = document.getElementById("panel-close");
  var titleEl   = document.getElementById("panel-title");
  var introEl   = document.getElementById("panel-intro");
  var itemsEl   = document.getElementById("panel-items");
  var layerSharp = L.els.layerSharp;

  var current = null;          // { section, trigger }
  var savedScrollY = 0;
  var settleTimer = null;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function duration() { return reduceMotion ? 0 : 400; }

  function findSection(id) {
    var list = L.getSections();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* ---------- Keep the clicked object sharp ---------- */
  function clipFor(section) {
    var h = section.hotspot;
    if (!h) return "none";
    if (section.shape === "ellipse") {
      return "ellipse(" + (h.w / 2) + "% " + (h.h / 2) + "% at " + (h.x + h.w / 2) + "% " + (h.y + h.h / 2) + "%)";
    }
    var right = 100 - (h.x + h.w), bottom = 100 - (h.y + h.h);
    return "inset(" + h.y + "% " + right + "% " + bottom + "% " + h.x + "%)";
  }

  /* ---------- Rendering ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderCard(item, index) {
    var card = el("article", "card");
    card.style.setProperty("--i", index);
    if (item.image) {
      var fig = el("figure", "card-figure");
      var img = document.createElement("img");
      img.src = item.image;
      img.alt = item.alt || "";
      img.loading = "lazy";
      img.decoding = "async";
      fig.appendChild(img);
      card.appendChild(fig);
    }
    if (item.title) card.appendChild(el("h3", "card-title", item.title));
    if (item.meta) card.appendChild(el("p", "card-meta", item.meta));
    if (item.description) card.appendChild(el("p", "card-desc", item.description));
    if (item.link) {
      var a = el("a", "card-link", item.linkLabel || "See more");
      a.href = item.link;
      if (/^https?:/i.test(item.link)) { a.target = "_blank"; a.rel = "noopener"; }
      card.appendChild(a);
    }
    return card;
  }

  function renderPanel(section) {
    titleEl.textContent = section.label || section.id;
    introEl.textContent = section.intro || "";
    introEl.hidden = !section.intro;
    itemsEl.innerHTML = "";
    (section.items || []).forEach(function (item, i) { itemsEl.appendChild(renderCard(item, i)); });
    /* Theme class (step 6 styles these) */
    panel.className = panel.className.replace(/\btheme-[\w-]+/g, "").trim();
    panel.classList.add("theme-" + (section.theme || "paper"));
    if (L.decoratePanel) L.decoratePanel(section, panel, itemsEl);
  }

  /* ---------- Scroll lock ---------- */
  function lockScroll() {
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    body.style.top = -savedScrollY + "px";
    body.classList.add("scroll-locked");
  }
  function unlockScroll() {
    body.classList.remove("scroll-locked");
    body.style.top = "";
    window.scrollTo(0, savedScrollY);
  }

  /* ---------- Focus trap ---------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])';
  function focusables() {
    return Array.prototype.filter.call(panel.querySelectorAll(FOCUSABLE), function (n) {
      return n.offsetParent !== null || n === document.activeElement;
    });
  }
  function onKeydown(e) {
    if (!current) return;
    if (e.key === "Escape") {
      if (L.escapeHandled && L.escapeHandled()) return;   // the lightbox (step 7) takes Escape first
      e.preventDefault();
      closeSection();
      return;
    }
    if (e.key === "Tab") {
      var f = focusables();
      if (!f.length) { e.preventDefault(); panel.focus(); return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  /* ---------- Open / close ---------- */
  function openSection(id, trigger, opts) {
    opts = opts || {};
    var section = findSection(id);
    if (!section) { console.warn("[Ameya's Library] no section with id " + id); return; }
    var btn = trigger || L.els.hotspots.querySelector('.hotspot[data-id="' + id + '"]');

    if (current && current.section.id === id) return;
    var wasOpen = !!current;
    if (current) deactivateHotspot();

    current = { section: section, trigger: btn || document.activeElement };
    renderPanel(section);

    layerSharp.style.clipPath = clipFor(section);
    layerSharp.style.webkitClipPath = layerSharp.style.clipPath;
    if (btn) btn.classList.add("is-active");

    if (!wasOpen) lockScroll();
    body.classList.add("panel-open");
    scrim.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    panel.classList.remove("is-settled");
    panel.querySelector(".panel-scroll").scrollTop = 0;
    void panel.offsetWidth;   // flush styles so the slide runs from the hidden state
    panel.classList.add("is-open");

    clearTimeout(settleTimer);
    settleTimer = setTimeout(function () {
      panel.classList.add("is-settled");
      closeBtn.focus({ preventScroll: true });
    }, wasOpen ? 60 : duration());

    document.addEventListener("keydown", onKeydown);
    if (L.onSectionOpen) L.onSectionOpen(section, opts);
  }

  function deactivateHotspot() {
    var active = L.els.hotspots.querySelector(".hotspot.is-active");
    if (active) active.classList.remove("is-active");
  }

  function closeSection(opts) {
    opts = opts || {};
    if (!current) return;
    var closing = current;
    current = null;
    clearTimeout(settleTimer);

    panel.classList.remove("is-open", "is-settled");
    panel.setAttribute("aria-hidden", "true");
    body.classList.remove("panel-open");
    scrim.hidden = true;
    deactivateHotspot();
    document.removeEventListener("keydown", onKeydown);
    unlockScroll();

    setTimeout(function () {
      if (!current) { layerSharp.style.clipPath = ""; layerSharp.style.webkitClipPath = ""; itemsEl.innerHTML = ""; }
    }, duration());

    var t = closing.trigger;
    if (t && typeof t.focus === "function" && document.contains(t)) t.focus({ preventScroll: true });
    if (L.onSectionClose) L.onSectionClose(closing.section, opts);
  }

  closeBtn.addEventListener("click", function () { closeSection(); });
  scrim.addEventListener("click", function () { closeSection(); });

  L.openSection = openSection;
  L.closeSection = closeSection;
  L.currentSection = function () { return current ? current.section : null; };
  L.findSection = findSection;
  L.els.panel = panel;
  L.els.panelItems = itemsEl;
})();
