/**
 * Boot recovery watchdog – loaded with defer to keep it off the critical path.
 * Shows a bottom-sheet overlay if the React app hasn't mounted within 9 s.
 */
(function () {
  var SHOWN_KEY = "boot_recovery_shown";
  var shown = false;
  var overlayEl = null;
  var dismissInterval = null;
  var DISMISS_EVENT = "lovable:app-mounted";
  var bootErrors = [];

  function pushBootError(entry) {
    try {
      if (!entry) return;
      bootErrors.push(entry);
      if (bootErrors.length > 20) bootErrors.shift();
      try { window.__BOOT_ERRORS__ = bootErrors; } catch (e) {}
    } catch (e) {}
  }

  function getDebugReport() {
    var lines = [];
    try { lines.push("URL: " + String(window.location.href)); } catch (e) {}
    try { lines.push("UA: " + String(navigator.userAgent)); } catch (e) {}
    try { lines.push("Time: " + new Date().toISOString()); } catch (e) {}
    lines.push("Errors: " + String(bootErrors.length));
    lines.push("---");
    for (var i = 0; i < bootErrors.length; i++) {
      try {
        var e = bootErrors[i];
        lines.push("#" + (i + 1) + " " + (e.type || "error"));
        if (e.url) lines.push("url: " + e.url);
        if (e.tag) lines.push("tag: " + e.tag);
        if (e.message) lines.push("message: " + e.message);
        if (e.filename) lines.push("file: " + e.filename);
        if (e.lineno != null) lines.push("line: " + e.lineno + ":" + e.colno);
        if (e.stack) lines.push("stack: " + e.stack);
        lines.push("---");
      } catch (err) {}
    }
    try {
      if (window.performance && performance.getEntriesByType) {
        var res = performance.getEntriesByType("resource");
        var tail = res.slice(Math.max(0, res.length - 15));
        lines.push("Resources (last " + tail.length + "):");
        for (var j = 0; j < tail.length; j++) {
          try { if (tail[j] && tail[j].name) lines.push("- " + tail[j].name); } catch (e2) {}
        }
      }
    } catch (e) {}
    return lines.join("\n");
  }

  try {
    window.addEventListener("error", function (event) {
      try {
        var t = event && event.target;
        var tag = t && t.tagName ? String(t.tagName).toLowerCase() : null;
        var url = null;
        try { url = t && (t.src || t.href) ? String(t.src || t.href) : null; } catch (e) {}
        if (tag && url) { pushBootError({ type: "resource", tag: tag, url: url }); return; }
        pushBootError({
          type: "runtime",
          message: event && event.message ? String(event.message) : "Unknown error",
          filename: event && event.filename ? String(event.filename) : null,
          lineno: event && event.lineno != null ? event.lineno : null,
          colno: event && event.colno != null ? event.colno : null,
          stack: event && event.error && event.error.stack ? String(event.error.stack) : null,
        });
      } catch (e) {}
    }, true);
  } catch (e) {}

  try {
    window.addEventListener("unhandledrejection", function (event) {
      try {
        var reason = event && event.reason;
        pushBootError({
          type: "unhandledrejection",
          message: reason && reason.message ? String(reason.message) : String(reason || "Unknown rejection"),
          stack: reason && reason.stack ? String(reason.stack) : null,
        });
      } catch (e) {}
    });
  } catch (e) {}

  function removeOverlay() {
    try { if (dismissInterval) { clearInterval(dismissInterval); dismissInterval = null; } } catch (e) {}
    try { if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl); } catch (e) {}
    overlayEl = null;
  }

  function scheduleAutoDismiss() {
    try { window.addEventListener(DISMISS_EVENT, function () { removeOverlay(); }, { once: true }); } catch (e) {}
    try {
      var startedAt = Date.now();
      dismissInterval = setInterval(function () {
        try { if (window.__APP_MOUNTED__) { removeOverlay(); return; } } catch (e) {}
        if (Date.now() - startedAt > 30000) { try { clearInterval(dismissInterval); } catch (e) {} dismissInterval = null; }
      }, 250);
    } catch (e) {}
  }

  function safeSessionGet(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } }
  function safeSessionSet(key, value) { try { sessionStorage.setItem(key, value); } catch (e) {} }

  function createButton(label) {
    var btn = document.createElement("button");
    btn.textContent = label;
    btn.style.cssText = "appearance:none;border:0;border-radius:12px;padding:12px 14px;font-weight:600;cursor:pointer;background:hsl(var(--foreground));color:hsl(var(--background));";
    return btn;
  }

  function createGhostButton(label) {
    var btn = document.createElement("button");
    btn.textContent = label;
    btn.style.cssText = "appearance:none;border:1px solid hsl(var(--foreground) / 0.2);border-radius:12px;padding:12px 14px;font-weight:600;cursor:pointer;background:transparent;color:hsl(var(--foreground));";
    return btn;
  }

  async function hardRecover() {
    try { if ("serviceWorker" in navigator) { var regs = await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(function (r) { return r.unregister(); })); } } catch (e) {}
    try { if ("caches" in window) { var names = await caches.keys(); await Promise.all(names.map(function (n) { return caches.delete(n); })); } } catch (e) {}
    var base = window.location.href.split("?")[0];
    window.location.href = base + "?_t=" + Date.now();
  }

  function showOverlay() {
    if (shown) return;
    shown = true;
    safeSessionSet(SHOWN_KEY, "1");

    var overlay = document.createElement("div");
    overlay.id = "boot-recovery";
    overlay.style.cssText = "position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483647;display:flex;align-items:flex-end;justify-content:center;pointer-events:none;";

    var card = document.createElement("div");
    card.style.cssText = "width:min(520px, 100%);border-radius:16px;border:1px solid hsl(var(--foreground) / 0.12);background:hsl(var(--background));box-shadow:0 20px 60px -20px rgba(0,0,0,0.25);padding:18px;pointer-events:auto;";

    var title = document.createElement("div");
    title.textContent = "Sayfa y\u00FCklenemedi";
    title.style.cssText = "font-weight:700;font-size:18px;color:hsl(var(--foreground));";

    var desc = document.createElement("div");
    desc.textContent = "Ba\u011Flant\u0131 veya g\u00FCncelleme nedeniyle a\u00E7\u0131l\u0131\u015F uzad\u0131. A\u015Fa\u011F\u0131dan yeniden deneyebilirsiniz.";
    desc.style.cssText = "margin-top:6px;font-size:13px;color:hsl(var(--foreground) / 0.72);line-height:1.45;";

    var actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;";

    var retry = createGhostButton("Tekrar Dene");
    retry.onclick = function () { window.location.reload(); };

    var fix = createButton("Sert Yenile");
    fix.onclick = function () { hardRecover(); };

    var copy = createGhostButton("Detaylar\u0131 Kopyala");
    copy.onclick = function () {
      var text = "";
      try { text = getDebugReport(); } catch (e) { text = "Debug report unavailable"; }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text); }
        else { window.prompt("Kopyalay\u0131n:", text); }
      } catch (e) { try { window.prompt("Kopyalay\u0131n:", text); } catch (e2) {} }
    };

    actions.appendChild(retry);
    actions.appendChild(fix);
    actions.appendChild(copy);

    var details = document.createElement("details");
    details.style.cssText = "margin-top:12px;border:1px solid hsl(var(--foreground) / 0.12);border-radius:12px;padding:10px;";

    var summary = document.createElement("summary");
    summary.textContent = "Teknik detaylar";
    summary.style.cssText = "cursor:pointer;font-weight:600;color:hsl(var(--foreground) / 0.85);";

    var pre = document.createElement("pre");
    pre.textContent = getDebugReport();
    pre.style.cssText = "margin-top:10px;white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.4;color:hsl(var(--foreground) / 0.78);max-height:220px;overflow:auto;";

    details.appendChild(summary);
    details.appendChild(pre);
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(actions);
    card.appendChild(details);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlayEl = overlay;
    scheduleAutoDismiss();
  }

  if (safeSessionGet(SHOWN_KEY)) return;

  setTimeout(function () {
    try { if (window.__APP_MOUNTED__) return; } catch (e) {}
    showOverlay();
  }, 9000);
})();
