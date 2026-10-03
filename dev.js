/* ============================================================
   Ameya's Library — dev mode (hotspot alignment tool)
   ------------------------------------------------------------
   Only loaded when the URL ends in ?dev (see the loader at the
   bottom of app.js). Never ships to visitors.

   - Drag a hotspot to move it; drag the bottom-right corner to resize
   - Arrow keys nudge the selected hotspot 0.1%, shift+arrow 1%
   - Live x / y / w / h shown while dragging
   - Add / delete hotspots, toggle rect / ellipse
   - Changes persist to localStorage until you Reset
   - "Copy config" puts the full SECTIONS array on the clipboard
   ============================================================ */
(function () {
  "use strict";

  var L = window.Library;
  if (!L) { console.error("[dev] app.js must load before dev.js"); return; }

  var STORAGE_KEY = "ameyas-library.dev.sections";
  var stage = L.els.stage;
  var hotspotsEl = L.els.hotspots;

  /* ---------- Working copy of the config ---------- */
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* fall through */ }
    return clone(window.SECTIONS);
  }

  var draft = loadDraft();
  var selectedId = draft.length ? draft[0].id : null;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch (e) { /* ignore */ }
  }

  function selected() {
    for (var i = 0; i < draft.length; i++) if (draft[i].id === selectedId) return draft[i];
    return null;
  }

  function round1(n) { return Math.round(n * 10) / 10; }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* ---------- Render ---------- */
  function render() {
    L.setSections(draft);            // app.js redraws the buttons
    document.body.classList.add("dev-mode");
    var nodes = hotspotsEl.querySelectorAll(".hotspot");
    Array.prototype.forEach.call(nodes, function (btn) {
      btn.classList.toggle("dev-selected", btn.dataset.id === selectedId);
      var tag = document.createElement("span");
      tag.className = "dev-tag";
      tag.textContent = btn.dataset.id;
      btn.appendChild(tag);
      var grip = document.createElement("span");
      grip.className = "dev-grip";
      btn.appendChild(grip);
      btn.addEventListener("pointerdown", onPointerDown);
      btn.addEventListener("click", function (e) { e.stopImmediatePropagation(); e.preventDefault(); }, true);
    });
    updateReadout();
  }

  function updateReadout() {
    var s = selected();
    var h = s && s.hotspot;
    readout.textContent = s
      ? s.id + "  x " + round1(h.x).toFixed(1) + "  y " + round1(h.y).toFixed(1) + "  w " + round1(h.w).toFixed(1) + "  h " + round1(h.h).toFixed(1) + "  " + (s.shape || "rect")
      : "nothing selected";
    shapeBtn.textContent = s && s.shape === "ellipse" ? "Make rect" : "Make ellipse";
  }

  /* ---------- Drag / resize ---------- */
  var drag = null;

  function onPointerDown(e) {
    var btn = e.currentTarget;
    selectedId = btn.dataset.id;
    var s = selected();
    if (!s) return;
    var rect = stage.getBoundingClientRect();
    var resizing = e.target.classList.contains("dev-grip");
    drag = {
      section: s,
      resizing: resizing,
      startX: e.clientX, startY: e.clientY,
      origin: clone(s.hotspot),
      pxPerPctX: rect.width / 100,
      pxPerPctY: rect.height / 100
    };
    btn.setPointerCapture(e.pointerId);
    btn.addEventListener("pointermove", onPointerMove);
    btn.addEventListener("pointerup", onPointerUp);
    btn.addEventListener("pointercancel", onPointerUp);
    e.preventDefault();
    render();
  }

  function onPointerMove(e) {
    if (!drag) return;
    var dx = (e.clientX - drag.startX) / drag.pxPerPctX;
    var dy = (e.clientY - drag.startY) / drag.pxPerPctY;
    var h = drag.section.hotspot, o = drag.origin;
    if (drag.resizing) {
      h.w = round1(clamp(o.w + dx, 0.5, 100 - o.x));
      h.h = round1(clamp(o.h + dy, 0.5, 100 - o.y));
    } else {
      h.x = round1(clamp(o.x + dx, 0, 100 - o.w));
      h.y = round1(clamp(o.y + dy, 0, 100 - o.h));
    }
    var btn = e.currentTarget;
    btn.setAttribute("style", L.hotspotStyle(h));
    updateReadout();
  }

  function onPointerUp(e) {
    var btn = e.currentTarget;
    btn.removeEventListener("pointermove", onPointerMove);
    btn.removeEventListener("pointerup", onPointerUp);
    btn.removeEventListener("pointercancel", onPointerUp);
    drag = null;
    save();
    render();
  }

  /* ---------- Keyboard nudge ---------- */
  document.addEventListener("keydown", function (e) {
    var s = selected();
    if (!s) return;
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    var step = e.shiftKey ? 1 : 0.1;
    var h = s.hotspot, handled = true;
    switch (e.key) {
      case "ArrowLeft":  h.x = round1(clamp(h.x - step, 0, 100 - h.w)); break;
      case "ArrowRight": h.x = round1(clamp(h.x + step, 0, 100 - h.w)); break;
      case "ArrowUp":    h.y = round1(clamp(h.y - step, 0, 100 - h.h)); break;
      case "ArrowDown":  h.y = round1(clamp(h.y + step, 0, 100 - h.h)); break;
      default: handled = false;
    }
    if (handled) { e.preventDefault(); save(); render(); }
  });

  /* ---------- Toolbar ---------- */
  var bar = document.createElement("div");
  bar.className = "dev-bar";
  bar.innerHTML =
    '<strong>dev mode</strong>' +
    '<span class="dev-readout"></span>' +
    '<select class="dev-select"></select>' +
    '<button type="button" data-act="shape"></button>' +
    '<button type="button" data-act="add">Add hotspot</button>' +
    '<button type="button" data-act="delete">Delete</button>' +
    '<button type="button" data-act="copy">Copy config</button>' +
    '<button type="button" data-act="reset">Reset to config.js</button>' +
    '<span class="dev-hint">drag to move · corner to resize · arrows 0.1% · shift+arrows 1%</span>';
  document.body.appendChild(bar);

  var readout  = bar.querySelector(".dev-readout");
  var select   = bar.querySelector(".dev-select");
  var shapeBtn = bar.querySelector('[data-act="shape"]');

  function refreshSelect() {
    select.innerHTML = "";
    draft.forEach(function (s) {
      var o = document.createElement("option");
      o.value = s.id; o.textContent = s.id;
      if (s.id === selectedId) o.selected = true;
      select.appendChild(o);
    });
  }
  select.addEventListener("change", function () { selectedId = select.value; render(); });

  bar.addEventListener("click", function (e) {
    var act = e.target.dataset && e.target.dataset.act;
    if (!act) return;
    var s = selected();
    if (act === "shape" && s) {
      s.shape = s.shape === "ellipse" ? "rect" : "ellipse";
    } else if (act === "add") {
      var id = prompt("id for the new section (lowercase-with-hyphens):", "new-section");
      if (!id) return;
      draft.push({
        id: id, label: id.replace(/-/g, " ").replace(/^\w/, function (c) { return c.toUpperCase(); }),
        object: "describe the painted object", hotspot: { x: 40, y: 40, w: 10, h: 10 },
        shape: "rect", labelPosition: "right", theme: "paper", intro: "", items: []
      });
      selectedId = id;
      refreshSelect();
    } else if (act === "delete" && s) {
      if (!confirm("Delete hotspot " + s.id + " from the draft?")) return;
      draft = draft.filter(function (x) { return x.id !== s.id; });
      selectedId = draft.length ? draft[0].id : null;
      refreshSelect();
    } else if (act === "copy") {
      copyConfig();
      return;
    } else if (act === "reset") {
      if (!confirm("Discard local changes and reload from config.js?")) return;
      try { localStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
      draft = clone(window.SECTIONS);
      selectedId = draft.length ? draft[0].id : null;
      refreshSelect();
    }
    save();
    render();
  });

  /* ---------- Copy config, formatted for config.js ---------- */
  function fmtItem(item, indent) {
    var keys = ["title", "description", "image", "alt", "link", "linkLabel", "meta", "video"];
    var lines = keys.filter(function (k) { return k in item; }).map(function (k) {
      return indent + "  " + k + ": " + JSON.stringify(item[k]);
    });
    return indent + "{\n" + lines.join(",\n") + "\n" + indent + "}";
  }

  function fmtSection(s) {
    var h = s.hotspot;
    var out = "  {\n";
    out += "    id: " + JSON.stringify(s.id) + ",\n";
    out += "    label: " + JSON.stringify(s.label) + ",\n";
    out += "    object: " + JSON.stringify(s.object || "") + ",\n";
    out += "    hotspot: { x: " + round1(h.x) + ", y: " + round1(h.y) + ", w: " + round1(h.w) + ", h: " + round1(h.h) + " },\n";
    out += "    shape: " + JSON.stringify(s.shape || "rect") + ",\n";
    out += "    labelPosition: " + JSON.stringify(s.labelPosition || "right") + ",\n";
    out += "    theme: " + JSON.stringify(s.theme || "paper") + ",\n";
    out += "    intro: " + JSON.stringify(s.intro || "") + ",\n";
    out += "    items: [\n" + (s.items || []).map(function (it) { return fmtItem(it, "      "); }).join(",\n") + "\n    ]\n";
    out += "  }";
    return out;
  }

  function copyConfig() {
    var text = "const SECTIONS = [\n" + draft.map(fmtSection).join(",\n") + "\n];\n";
    function done() { readout.textContent = "copied " + draft.length + " sections to clipboard"; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
    console.log(text);
  }

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  /* ---------- Styles for dev mode ---------- */
  var css = document.createElement("style");
  css.textContent =
    ".dev-mode .hotspot{background:rgba(227,196,138,.12)!important;outline:1px dashed rgba(241,230,208,.8);outline-offset:-1px;cursor:move;touch-action:none;filter:none!important;opacity:1!important}" +
    ".dev-mode .hotspot.dev-selected{outline:2px dashed #e3c48a;background:rgba(227,196,138,.22)!important}" +
    ".dev-mode .hotspot::before,.dev-mode .hotspot::after,.dev-mode .hotspot-label{display:none!important}" +
    ".dev-tag{position:absolute;left:0;top:0;padding:1px 5px;font:11px/1.4 ui-monospace,monospace;background:rgba(31,36,51,.85);color:#f1e6d0;pointer-events:none;white-space:nowrap;border-radius:0 0 3px 0}" +
    ".dev-grip{position:absolute;right:-5px;bottom:-5px;width:12px;height:12px;background:#e3c48a;border:1px solid #1f2433;cursor:nwse-resize;border-radius:2px}" +
    ".dev-bar{position:fixed;left:0;right:0;bottom:0;z-index:1000;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px;background:rgba(31,36,51,.94);color:#f1e6d0;font:12px/1.4 ui-monospace,monospace}" +
    ".dev-bar button,.dev-bar select{font:inherit;padding:3px 8px;background:#f1e6d0;color:#1f2433;border:1px solid #c9a66b;border-radius:3px;cursor:pointer}" +
    ".dev-readout{min-width:24ch;white-space:pre}.dev-hint{opacity:.6;margin-left:auto}" +
    ".dev-mode .footer{display:none}";
  document.head.appendChild(css);

  refreshSelect();
  render();
  console.info("[dev] hotspot tool ready. Draft is in localStorage under " + STORAGE_KEY);
})();
