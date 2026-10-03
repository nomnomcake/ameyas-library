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
  /* config.js declares these with const, which does NOT create window properties,
     so read them as bare globals guarded by typeof. */
  var CFG_SECTIONS = typeof SECTIONS !== "undefined" ? SECTIONS : null;
  var CFG_PAINTING = typeof PAINTING !== "undefined" ? PAINTING : null;
  var activeSections = Array.isArray(CFG_SECTIONS) ? CFG_SECTIONS : [];
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
      if (h === null) { /* deliberate: this section has no painted object yet */ }
      else if (!h || typeof h.x !== "number" || typeof h.y !== "number" || typeof h.w !== "number" || typeof h.h !== "number") {
        warn(name + " has no usable hotspot {x, y, w, h}.");
      } else if (h.x < 0 || h.y < 0 || h.x + h.w > 100.01 || h.y + h.h > 100.01) {
        warn(name + " hotspot runs off the painting: " + JSON.stringify(h));
      }
      if (s.shape && s.shape !== "rect" && s.shape !== "ellipse") warn(name + " shape must be rect or ellipse, got " + s.shape);
      if (s.labelPosition && ["left", "right", "above", "below"].indexOf(s.labelPosition) === -1) {
        warn(name + " labelPosition must be left, right, above or below.");
      }
      (s.items || []).forEach(function (item, j) {
        if (item.image && item.status !== "coming-soon") checkImage(item.image, name + " item " + j);
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

    if (CFG_PAINTING && painting) {
      painting.addEventListener("error", function () { warn("Painting failed to load: " + painting.getAttribute("src")); });
      painting.addEventListener("load", function () {
        var ratioCfg = CFG_PAINTING.width / CFG_PAINTING.height, ratioImg = painting.naturalWidth / painting.naturalHeight;
        if (painting.naturalWidth && Math.abs(ratioCfg - ratioImg) > 0.002) {
          warn("PAINTING.width/height in config.js (" + CFG_PAINTING.width + "x" + CFG_PAINTING.height + ") have a different aspect ratio from the served image (" +
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
      var soon = s.status === "coming-soon";
      if (soon) { btn.classList.add("is-coming-soon"); btn.setAttribute("aria-disabled", "true"); }
      btn.setAttribute("aria-label", soon ? (s.label || s.id) + ", coming soon" : "Open " + (s.label || s.id).toLowerCase());
      btn.setAttribute("style", hotspotStyle(s.hotspot));
      /* Step 3: the lit surface (sheen + lift) and the label beside the object. */
      var surface = document.createElement("span");
      surface.className = "hotspot-surface";
      surface.setAttribute("aria-hidden", "true");
      btn.appendChild(surface);
      var label = document.createElement("span");
      label.className = "hotspot-label";
      label.setAttribute("aria-hidden", "true");
      label.textContent = soon ? "Coming soon" : (s.label || s.id);
      btn.appendChild(label);
      if (!soon) {                         /* two tiny glints: the object catches the light */
        var g1 = document.createElement("span"); g1.className = "glint glint-a"; g1.setAttribute("aria-hidden", "true");
        var g2 = document.createElement("span"); g2.className = "glint glint-b"; g2.setAttribute("aria-hidden", "true");
        g1.style.setProperty("--d", (Math.random() * 6).toFixed(2) + "s");
        g2.style.setProperty("--d", (2 + Math.random() * 6).toFixed(2) + "s");
        btn.appendChild(g1); btn.appendChild(g2);
      }
      btn.addEventListener("click", function () { if (!soon) onHotspotClick(s, btn); });
      hotspotsEl.appendChild(btn);
    });
  }

  function onHotspotClick(section, btn) {
    btn.classList.remove("is-flaring"); void btn.offsetWidth; btn.classList.add("is-flaring");
    btn.addEventListener("animationend", function () { btn.classList.remove("is-flaring"); }, { once: true });
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
    if (item.status === "coming-soon") {
      card.classList.add("is-coming-soon");
      var stamp = el("span", "stamp", "Coming soon");
      stamp.setAttribute("aria-label", "Coming soon");
      card.appendChild(stamp);
    }
    if (item.title) card.appendChild(el("h3", "card-title", item.title));
    if (item.meta) card.appendChild(el("p", "card-meta", item.meta));
    if (item.description) card.appendChild(el("p", "card-desc", item.description));
    if (item.link && item.status !== "coming-soon") {
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

/* ============================================================
   Step 5: deep linking and history
   #fine-art opens that section; back closes the panel; forward reopens.
   ============================================================ */
(function () {
  "use strict";
  var L = window.Library;
  var SITE_TITLE = "Ameya Kohli";
  var baseTitle = document.title;
  var baseUrl = location.pathname + location.search;

  function titleFor(section) { return section ? section.label + ", " + SITE_TITLE : baseTitle; }

  /* Called by openSection / closeSection (step 4). opts.fromHistory means
     the browser moved us, so don't push another entry. */
  L.onSectionOpen = function (section, opts) {
    document.title = titleFor(section);
    if (opts.fromHistory) return;
    var url = baseUrl + "#" + section.id;
    if (location.hash === "#" + section.id) history.replaceState({ section: section.id }, "", url);
    else history.pushState({ section: section.id }, "", url);
  };

  L.onSectionClose = function (section, opts) {
    document.title = baseTitle;
    if (opts.fromHistory) return;
    history.pushState({ section: null }, "", baseUrl);
  };

  function sectionFromHash() {
    var id = (location.hash || "").replace(/^#/, "");
    var s = id && L.findSection(id);
    return s && s.status !== "coming-soon" ? id : null;
  }

  window.addEventListener("popstate", function () {
    var id = sectionFromHash();
    var open = L.currentSection();
    if (id && (!open || open.id !== id)) L.openSection(id, null, { fromHistory: true });
    else if (!id && open) L.closeSection({ fromHistory: true });
  });

  /* On load: wait for the painting so the sharp clip has something to show. */
  function openFromUrl() {
    var id = sectionFromHash();
    if (!id) { history.replaceState({ section: null }, "", location.href); return; }
    history.replaceState({ section: id }, "", location.href);
    L.openSection(id, null, { fromHistory: true });
  }
  /* Deferred a tick so every later script (themes, lightbox, contact) has
     registered its hooks before the first panel renders. */
  setTimeout(function () {
    var img = L.els.painting;
    if (img && !img.complete) {
      img.addEventListener("load", openFromUrl, { once: true });
      img.addEventListener("error", openFromUrl, { once: true });
    } else {
      openFromUrl();
    }
  }, 0);
})();

/* ============================================================
   Step 6: theme behaviour
   Most themes are CSS only. The "shelf" theme turns each card into
   a book spine that expands on click.
   ============================================================ */
(function () {
  "use strict";
  var L = window.Library;
  var previous = L.decoratePanel;

  L.decoratePanel = function (section, panel, itemsEl) {
    if (previous) previous(section, panel, itemsEl);
    if (section.theme !== "shelf") return;

    Array.prototype.forEach.call(itemsEl.querySelectorAll(".card"), function (card, i) {
      var title = card.querySelector(".card-title");
      var meta  = card.querySelector(".card-meta");
      var rest  = Array.prototype.filter.call(card.children, function (n) { return n !== title && n !== meta; });

      var spine = document.createElement("button");
      spine.type = "button";
      spine.className = "spine";
      spine.setAttribute("aria-expanded", "false");
      var bodyId = "spine-body-" + section.id + "-" + i;
      spine.setAttribute("aria-controls", bodyId);
      spine.appendChild(document.createTextNode(title ? title.textContent : "Untitled"));
      if (meta) { var m = document.createElement("span"); m.className = "spine-meta"; m.textContent = meta.textContent; spine.appendChild(m); }

      var body = document.createElement("div");
      body.className = "spine-body";
      body.id = bodyId;
      rest.forEach(function (n) { body.appendChild(n); });

      card.innerHTML = "";
      card.appendChild(spine);
      card.appendChild(body);

      spine.addEventListener("click", function () {
        var open = spine.getAttribute("aria-expanded") === "true";
        spine.setAttribute("aria-expanded", open ? "false" : "true");
        body.classList.toggle("is-open", !open);
      });
    });
  };
})();

/* ============================================================
   Step 7: artwork viewing and media
   Lightbox, lazy video embeds, and a light speed bump on saving art.
   ============================================================ */
(function () {
  "use strict";
  var L = window.Library;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Video embeds ---------- */
  function embedUrl(url) {
    var m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/))) {
      return "https://www.youtube-nocookie.com/embed/" + m[1] + "?rel=0";
    }
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) {
      return "https://player.vimeo.com/video/" + m[1] + "?dnt=1";
    }
    return null;
  }

  function addVideo(card, item) {
    var src = embedUrl(item.video);
    if (!src) { console.warn("[Ameya's Library] unrecognised video URL for " + item.title + ": " + item.video); return; }
    var box = document.createElement("div");
    box.className = "card-video";
    var iframe = document.createElement("iframe");
    iframe.src = src;                       // only created when its panel opens: lazy by construction
    iframe.loading = "lazy";
    iframe.title = item.title ? item.title + " (video)" : "Video";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.setAttribute("allowfullscreen", "");
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    box.appendChild(iframe);
    var fig = card.querySelector(".card-figure");
    card.insertBefore(box, fig ? fig : card.firstChild);
    if (fig) fig.remove();                  // the embed replaces the still
    card.classList.add("has-video");
  }

  /* ---------- Lightbox DOM ---------- */
  var lb = document.createElement("div");
  lb.id = "lightbox";
  lb.className = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Artwork viewer");
  lb.setAttribute("aria-hidden", "true");
  lb.innerHTML =
    '<button type="button" class="lightbox-btn lightbox-close" aria-label="Close viewer">' +
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4.5 4.5 19.5 19.5M19.5 4.5 4.5 19.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></button>' +
    '<button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous image">' +
      '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M15 4.5 7.5 12 15 19.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<button type="button" class="lightbox-btn lightbox-next" aria-label="Next image">' +
      '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M9 4.5 16.5 12 9 19.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '<div class="lightbox-stage"><img class="lightbox-img artwork" alt=""></div>' +
    '<figcaption class="lightbox-caption"><span class="lightbox-title"></span><span class="lightbox-desc"></span><span class="lightbox-count"></span></figcaption>';
  document.body.appendChild(lb);

  var imgEl   = lb.querySelector(".lightbox-img");
  var titleEl = lb.querySelector(".lightbox-title");
  var descEl  = lb.querySelector(".lightbox-desc");
  var countEl = lb.querySelector(".lightbox-count");
  var closeB  = lb.querySelector(".lightbox-close");
  var prevB   = lb.querySelector(".lightbox-prev");
  var nextB   = lb.querySelector(".lightbox-next");

  var gallery = [];     // [{ src, alt, title, description, trigger }]
  var index = 0;
  var isOpen = false;
  var returnTo = null;

  function show(i, animate) {
    index = (i + gallery.length) % gallery.length;
    var g = gallery[index];
    function swap() {
      imgEl.src = g.src;
      imgEl.alt = g.alt || "";
      titleEl.textContent = g.title || "";
      descEl.textContent = g.description || "";
      countEl.textContent = gallery.length > 1 ? (index + 1) + " of " + gallery.length : "";
      imgEl.classList.remove("is-swapping");
    }
    if (animate && !reduceMotion) { imgEl.classList.add("is-swapping"); setTimeout(swap, 180); }
    else swap();
  }

  function openLightbox(list, i, trigger) {
    gallery = list;
    returnTo = trigger || document.activeElement;
    lb.dataset.count = list.length;
    show(i, false);
    lb.setAttribute("aria-hidden", "false");
    void lb.offsetWidth;
    lb.classList.add("is-open");
    isOpen = true;
    closeB.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!isOpen) return;
    isOpen = false;
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    if (returnTo && document.contains(returnTo)) returnTo.focus({ preventScroll: true });
    returnTo = null;
  }

  closeB.addEventListener("click", closeLightbox);
  prevB.addEventListener("click", function () { show(index - 1, true); });
  nextB.addEventListener("click", function () { show(index + 1, true); });
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lightbox-stage")) closeLightbox(); });

  /* Keys. Capture phase so the panel's own handler never sees Escape while we're open. */
  document.addEventListener("keydown", function (e) {
    if (!isOpen) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeLightbox(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1, true); }
    else if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1, true); }
    else if (e.key === "Tab") {
      e.stopPropagation();
      var f = [closeB, prevB, nextB].filter(function (b) { return b.offsetParent !== null; });
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);
  L.escapeHandled = function () { return isOpen; };

  /* Swipe */
  var touchX = null, touchY = null;
  lb.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener("touchend", function (e) {
    if (touchX == null) return;
    var dx = e.changedTouches[0].clientX - touchX, dy = e.changedTouches[0].clientY - touchY;
    touchX = touchY = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1), true);
  }, { passive: true });

  /* ---------- Wire each panel ---------- */
  var previous = L.decoratePanel;
  L.decoratePanel = function (section, panel, itemsEl) {
    var cards = Array.prototype.slice.call(itemsEl.querySelectorAll(".card"));
    var items = section.items || [];

    cards.forEach(function (card, i) {
      var item = items[i];
      if (item && item.video) addVideo(card, item);
    });

    var list = [];
    cards.forEach(function (card, i) {
      var img = card.querySelector(".card-figure img");
      var item = items[i] || {};
      if (!img) return;
      img.classList.add("is-viewable", "artwork");
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "View " + (item.title || "image") + " full size");
      var pos = list.length;
      list.push({ src: item.image, alt: item.alt || "", title: item.title || "", description: item.description || "", trigger: img });
      function go() { openLightbox(list, pos, img); }
      img.addEventListener("click", go);
      img.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });

    if (previous) previous(section, panel, itemsEl);   // shelf accordion runs last so it can move the figures
  };

  L.onSectionCloseHooks = L.onSectionCloseHooks || [];
  var prevClose = L.onSectionClose;
  L.onSectionClose = function (section, opts) { closeLightbox(); if (prevClose) prevClose(section, opts); };

  /* ---------- Speed bump on artwork ----------
     This is NOT protection. Anyone can screenshot or read the source.
     It only stops the casual right-click-save. Delete this block to remove it. */
  document.addEventListener("contextmenu", function (e) {
    if (e.target && e.target.classList && e.target.classList.contains("artwork")) e.preventDefault();
  });
  document.addEventListener("dragstart", function (e) {
    if (e.target && e.target.classList && e.target.classList.contains("artwork")) e.preventDefault();
  });
})();

/* ============================================================
   Step 8: contact
   One small card: email, LinkedIn, Instagram, resume.
   ============================================================ */
(function () {
  "use strict";
  var L = window.Library;
  var C = typeof CONTACT !== "undefined" ? CONTACT : {};

  function row(label, text, href, opts) {
    var li = document.createElement("li");
    li.className = "contact-row";
    var k = document.createElement("span"); k.className = "contact-key"; k.textContent = label;
    var a = document.createElement("a"); a.className = "contact-link"; a.textContent = text;
    if (href) a.href = href;
    if (opts && opts.external) { a.target = "_blank"; a.rel = "noopener"; }
    li.appendChild(k); li.appendChild(a);
    return li;
  }

  var previous = L.decoratePanel;
  L.decoratePanel = function (section, panel, itemsEl) {
    if (previous) previous(section, panel, itemsEl);
    if (section.theme !== "contact") return;

    itemsEl.innerHTML = "";
    var card = document.createElement("article");
    card.className = "card contact-card";
    var list = document.createElement("ul");
    list.className = "contact-list";

    if (C.emailUser && C.emailDomain) {
      /* Assembled here, never printed whole in the HTML. */
      var li = row("Email", C.emailUser + " [at] " + C.emailDomain, "#");
      var a = li.querySelector("a");
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var addr = C.emailUser + "@" + C.emailDomain;
        a.textContent = addr;
        location.href = "mailto:" + addr;
      });
      a.addEventListener("focus", function () { a.textContent = C.emailUser + "@" + C.emailDomain; }, { once: true });
      list.appendChild(li);
    }
    if (C.linkedin)  list.appendChild(row("LinkedIn",  C.linkedin.replace(/^https?:\/\/(www\.)?/, ""),  C.linkedin,  { external: true }));
    if (C.instagram) list.appendChild(row("Instagram", C.instagram.replace(/^https?:\/\/(www\.)?/, ""), C.instagram, { external: true }));
    if (C.resume)    list.appendChild(row("Resume", "PDF", C.resume, { external: true }));

    card.appendChild(list);
    itemsEl.appendChild(card);
  };

  /* Check the resume exists. Only over http(s): file:// blocks the request. */
  if (C.resume && /^https?:/.test(location.protocol) && window.fetch) {
    fetch(C.resume, { method: "HEAD" }).then(function (r) {
      if (!r.ok) console.warn("[Ameya's Library config] CONTACT.resume not found: " + C.resume);
    }).catch(function () {});
  }
})();

/* ============================================================
   Step 9: mobile spine list, placeholder crossfade
   ============================================================ */
(function () {
  "use strict";
  var L = window.Library;

  /* ---------- Placeholder → painting crossfade ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".layer .painting"), function (img) {
    function reveal() { img.classList.add("is-loaded"); }
    if (img.complete && img.naturalWidth) reveal();
    else { img.addEventListener("load", reveal, { once: true }); img.addEventListener("error", reveal, { once: true }); }
  });

  /* ---------- Spine list for narrow screens ----------
     Same sections, same panel. Rendered always; CSS shows it under 768px. */
  var spinesEl = document.getElementById("spines");
  function renderSpines() {
    if (!spinesEl) return;
    spinesEl.innerHTML = "";
    L.getSections().forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "spine-link theme-" + (s.theme || "paper");
      b.dataset.id = s.id;
      var soon = s.status === "coming-soon";
      if (soon) { b.classList.add("is-coming-soon"); b.setAttribute("aria-disabled", "true"); }
      b.setAttribute("aria-label", soon ? (s.label || s.id) + ", coming soon" : "Open " + (s.label || s.id).toLowerCase());
      b.appendChild(document.createTextNode(s.label || s.id));
      var n = (s.items || []).length;
      if (soon) {
        var sm = document.createElement("span"); sm.className = "spine-meta"; sm.textContent = "coming soon"; b.appendChild(sm);
      } else if (n && ["gallery", "spread", "reel", "lab", "screen"].indexOf(s.theme) !== -1) {
        var m = document.createElement("span");
        m.className = "spine-meta";
        m.textContent = n + (n === 1 ? " piece" : " pieces");
        b.appendChild(m);
      }
      b.addEventListener("click", function () { if (!soon) L.openSection(s.id, b); });
      spinesEl.appendChild(b);
    });
  }
  renderSpines();
  var prevSet = L.setSections;
  L.setSections = function (list) { prevSet(list); renderSpines(); };
})();

/* ============================================================
   Cursor lamp: the glow follows the pointer with a little lag,
   like carrying a candle. Delete this block and the .cursor-lamp
   div to remove it.
   ============================================================ */
(function () {
  "use strict";
  var lamp = document.querySelector(".cursor-lamp");
  var stage = document.getElementById("stage");
  if (!lamp || !stage || !window.matchMedia("(hover: hover)").matches) return;
  var tx = 50, ty = 50, cx = 50, cy = 50, raf = null;
  function tick() {
    cx += (tx - cx) * 0.12;
    cy += (ty - cy) * 0.12;
    lamp.style.setProperty("--lx", cx + "%");
    lamp.style.setProperty("--ly", cy + "%");
    raf = (Math.abs(tx - cx) > 0.02 || Math.abs(ty - cy) > 0.02) ? requestAnimationFrame(tick) : null;
  }
  stage.addEventListener("pointermove", function (e) {
    var r = stage.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 100;
    ty = ((e.clientY - r.top) / r.height) * 100;
    document.body.classList.add("lamp-on");
    if (!raf) raf = requestAnimationFrame(tick);
  });
  stage.addEventListener("pointerleave", function () { document.body.classList.remove("lamp-on"); });
})();

/* ============================================================
   Two quiet things: shadow sweep on open, time-of-day tint.
   ============================================================ */
(function () {
  "use strict";
  var L = window.Library;
  var body = document.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. Shadow sweep, once per panel open */
  var sweep = document.querySelector(".shadow-sweep");
  if (sweep && !reduceMotion) {
    var prevOpen = L.onSectionOpen;
    L.onSectionOpen = function (section, opts) {
      if (prevOpen) prevOpen(section, opts);
      sweep.classList.remove("is-sweeping");
      void sweep.offsetWidth;
      sweep.classList.add("is-sweeping");
    };
    sweep.addEventListener("animationend", function () { sweep.classList.remove("is-sweeping"); });
  }

  /* 3. Time of day from the visitor's clock. Re-checked every few minutes. */
  function daylight() {
    var h = new Date().getHours();
    var band = h < 5 ? "night" : h < 11 ? "morning" : h < 17 ? "day" : h < 21 ? "evening" : "night";
    body.setAttribute("data-daylight", band);
  }
  daylight();
  setInterval(daylight, 5 * 60 * 1000);
})();


/* ============================================================
   The monitor: the drawing, one site at a time, arrows to flip.
   ============================================================ */
(function () {
  "use strict";
  var L = window.Library;
  var previous = L.decoratePanel;
  var cards = [], index = 0, nav = null, dots = null;

  /* The drawn computer: thick even ink line, flat fills. The screen rect
     is left unfilled: the panel behind it is the screen. */
  var DRAWING =
    '<svg viewBox="0 0 1000 580" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs>' +
        '<filter id="ink-wobble" x="-3%" y="-3%" width="106%" height="106%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="5" result="n"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/>' +
        '</filter>' +
        '<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0.35" stop-color="#f1e6d0" stop-opacity="0"/>' +
          '<stop offset="0.5"  stop-color="#f1e6d0" stop-opacity="0.08"/>' +
          '<stop offset="0.65" stop-color="#f1e6d0" stop-opacity="0"/>' +
        '</linearGradient>' +
      '</defs>' +
      '<g filter="url(#ink-wobble)" stroke="#1c1612" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" fill="none">' +
        /* body with chin */
        '<rect x="22" y="20" width="956" height="540" rx="22" fill="#2c231d"/>' +
        /* the screen: a light page, with the site content laid over it */
        '<rect x="36" y="34" width="928" height="512" rx="10" fill="#f4ecdc"/>' +
      '</g>' +
      /* a second, lighter stroke a few units off, like a pen going round twice */
      '<g transform="translate(5 4)" filter="url(#ink-wobble)" stroke="#1c1612" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none" opacity="0.55">' +
        '<rect x="22" y="20" width="956" height="540" rx="22"/>' +
        '<rect x="36" y="34" width="928" height="512" rx="10"/>' +
      '</g>' +
      '<rect x="38" y="36" width="924" height="508" rx="10" fill="url(#sheen)"/>' +
    '</svg>';

  function show(i) {
    if (!cards.length) return;
    index = (i + cards.length) % cards.length;
    cards.forEach(function (c, k) { c.classList.toggle("is-current", k === index); });
    if (nav) nav.querySelector(".screen-count").textContent = (index + 1) + " / " + cards.length;
  }

  function chevron(dir) {
    return '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="' +
      (dir < 0 ? "M15 4.5 7.5 12 15 19.5" : "M9 4.5 16.5 12 9 19.5") +
      '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /* A little folder icon with a window on it, in the desktop's ink and cream */
  function folderIcon() {
    return '<svg viewBox="0 0 48 40" aria-hidden="true">' +
      '<path d="M4 9 h14 l4 4 h22 v22 a3 3 0 0 1 -3 3 h-37 a3 3 0 0 1 -3 -3 z" fill="#f6efe0" stroke="#1c1612" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M4 17 h40" stroke="#1c1612" stroke-width="2.5"/>' +
      '<rect x="14" y="21" width="20" height="12" rx="1.5" fill="#e8c9a0" stroke="#1c1612" stroke-width="2"/>' +
      '<path d="M14 25 h20" stroke="#1c1612" stroke-width="2"/>' +
      '</svg>';
  }

  /* Window-control glyphs for the title bar's right side */
  function controls() {
    return '<span class="os-controls" aria-hidden="true">' +
      '<i title="minimise"><svg viewBox="0 0 12 12"><path d="M2 9h8" stroke="currentColor" stroke-width="2"/></svg></i>' +
      '<i title="maximise"><svg viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2"/></svg></i>' +
      '</span>';
  }

  /* Give a card the dialog-window chrome. The title bar carries the section
     name; the site's own name heads the text column. The screenshot is a link
     to the site; there is no separate button. */
  function dress(card, item, sectionLabel) {
    if (card.querySelector(".os-titlebar")) return;
    var bar = document.createElement("div");
    bar.className = "os-titlebar";
    var dots = document.createElement("span"); dots.className = "os-dots"; dots.innerHTML = "<i></i><i></i>";
    var name = document.createElement("span"); name.className = "os-window-name"; name.textContent = sectionLabel;
    bar.appendChild(dots); bar.appendChild(name);
    bar.insertAdjacentHTML("beforeend", controls());

    var meta = card.querySelector(".card-meta"); if (meta) meta.remove();
    var link = card.querySelector(".card-link"); if (link) link.remove();

    var fig = card.querySelector(".card-figure");
    if (fig && item && item.link && item.status !== "coming-soon") {
      var img = fig.querySelector("img");
      var fresh = img.cloneNode(true);                 // drops the lightbox listeners
      fresh.classList.remove("is-viewable"); fresh.removeAttribute("role"); fresh.removeAttribute("tabindex"); fresh.removeAttribute("aria-label");
      var go = document.createElement("a");
      go.className = "os-shot-link";
      go.href = item.link; go.target = "_blank"; go.rel = "noopener";
      go.setAttribute("aria-label", "Open " + (item.title || "site") + " in a new tab");
      go.appendChild(fresh);
      img.replaceWith(go);
    }

    var body = document.createElement("div");
    body.className = "os-body";
    var figure = card.querySelector(".card-figure");
    var text = document.createElement("div"); text.className = "os-text";
    var ttl = card.querySelector(".card-title"); if (ttl) text.appendChild(ttl);
    var dsc = card.querySelector(".card-desc"); if (dsc) text.appendChild(dsc);
    var stamp = card.querySelector(".stamp");
    if (figure) body.appendChild(figure);
    body.appendChild(text);
    while (card.firstChild) { var n = card.firstChild; if (n === stamp) { card.removeChild(n); continue; } body.appendChild(n); }
    if (stamp) card.appendChild(stamp);
    card.appendChild(bar);
    card.appendChild(body);
  }

  L.decoratePanel = function (section, panel, itemsEl) {
    if (previous) previous(section, panel, itemsEl);
    var frame = panel.querySelector(".monitor-frame");
    var scroll = panel.querySelector(".panel-scroll");
    var old;
    if ((old = panel.querySelector(".screen-nav"))) old.remove();
    cards = []; nav = null; dots = null;

    if (section.theme !== "screen") { if (frame) frame.remove(); return; }

    if (!frame) {
      frame = document.createElement("div");
      frame.className = "monitor-frame";
      frame.setAttribute("aria-hidden", "true");
      frame.innerHTML = DRAWING;
      panel.appendChild(frame);
    }

    cards = Array.prototype.slice.call(itemsEl.querySelectorAll(".card"));
    cards.forEach(function (c, k) { c.style.setProperty("--i", 0); dress(c, (section.items || [])[k], section.label || "Websites"); });

    /* Taskbar */
    nav = document.createElement("div");
    nav.className = "screen-nav";
    var tray = document.createElement("span"); tray.className = "os-tray"; tray.setAttribute("aria-hidden", "true");
    tray.innerHTML =
      '<i><svg viewBox="0 0 16 16"><path d="M1.5 4h5l1.5 1.5h6.5v8h-13z" fill="#e8c9a0" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></i>' +
      '<i><svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="1" fill="#f6efe0" stroke="currentColor" stroke-width="1.6"/><path d="M2 5l6 4 6-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></i>' +
      '<i><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#f6efe0" stroke="currentColor" stroke-width="1.6"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></i>' +
      '<i><svg viewBox="0 0 16 16"><rect x="3" y="2" width="10" height="12" rx="1" fill="#f6efe0" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></i>';
    var clock = document.createElement("span"); clock.className = "os-clock";
    function tickClock() { var d = new Date(); clock.textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
    tickClock(); setInterval(tickClock, 30000);
    var count = document.createElement("span"); count.className = "screen-count";
    var prev = document.createElement("button"); prev.type = "button"; prev.innerHTML = chevron(-1); prev.setAttribute("aria-label", "Previous site");
    var next = document.createElement("button"); next.type = "button"; next.innerHTML = chevron(1);  next.setAttribute("aria-label", "Next site");
     scroll.appendChild(nav);
    prev.addEventListener("click", function () { show(index - 1); });
    next.addEventListener("click", function () { show(index + 1); });
    show(0);
  };

  document.addEventListener("keydown", function (e) {
    var open = L.currentSection && L.currentSection();
    if (!open || open.theme !== "screen" || !nav) return;
    if (L.escapeHandled && L.escapeHandled()) return;       // lightbox owns the arrows while it is open
    if (e.key === "ArrowLeft")  { e.preventDefault(); show(index - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
  });
})();

/* ============================================================
   About me: the photo frame and the sticky note.
   ============================================================ */
(function () {
  "use strict";
  var L = window.Library;
  var previous = L.decoratePanel;
  L.decoratePanel = function (section, panel, itemsEl) {
    if (previous) previous(section, panel, itemsEl);
    panel.classList.toggle("is-about", section.id === "about");
    if (section.id !== "about") return;
    var card = itemsEl.querySelector(".card");
    if (!card || card.querySelector(".about-scene")) return;

    var fig = card.querySelector(".card-figure");
    var title = card.querySelector(".card-title");
    var desc = card.querySelector(".card-desc");

    var scene = document.createElement("div");
    scene.className = "about-scene";
    if (fig) { fig.classList.add("about-frame"); scene.appendChild(fig); }
    var note = document.createElement("div");
    note.className = "about-note";
    if (title) note.appendChild(title);
    if (desc) note.appendChild(desc);
    scene.appendChild(note);

    card.innerHTML = "";
    card.appendChild(scene);
    card.style.setProperty("--i", 0);
  };
})();
