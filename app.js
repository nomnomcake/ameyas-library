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
      btn.addEventListener("click", function () { onHotspotClick(s, btn); });
      hotspotsEl.appendChild(btn);
    });
  }

  function onHotspotClick(section, btn) {
    console.log("[Ameya's Library] clicked:", section.id);
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
