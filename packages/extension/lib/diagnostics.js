/**
 * Diagnostic panel and logging for Coverage Lens.
 * Shows a floating panel on PR pages when debug mode is enabled.
 */

/* exported CoverageLensDiag */

var CoverageLensDiag = (function () {
  "use strict";

  var enabled = false;
  var panel = null;
  var lines = [];

  function ensurePanel() {
    if (panel) return;
    panel = document.createElement("div");
    panel.id = "coverage-lens-diag";
    panel.style.cssText =
      "position:fixed;bottom:12px;right:12px;z-index:2147483647;" +
      "background:#1b1f23;color:#c9d1d9;font:11px/1.5 monospace;" +
      "padding:10px 14px;border-radius:8px;max-width:460px;max-height:50vh;" +
      "overflow:auto;box-shadow:0 4px 16px rgba(0,0,0,.5);white-space:pre-wrap;" +
      "border:1px solid #30363d;";
    var closeBtn = document.createElement("span");
    closeBtn.textContent = " [x]";
    closeBtn.style.cssText =
      "cursor:pointer;color:#f85149;float:right;font-weight:bold;";
    closeBtn.onclick = function () {
      panel.remove();
      panel = null;
    };
    panel.appendChild(closeBtn);
    document.documentElement.appendChild(panel);
  }

  /**
   * Log a diagnostic message. Always logs to console;
   * also renders to the floating panel if enabled.
   */
  function log(msg) {
    console.log("[Coverage Lens] " + msg);
    if (!enabled) return;
    lines.push(msg);
    ensurePanel();
    panel.textContent = lines.join("\n");
    panel.scrollTop = panel.scrollHeight;
  }

  /**
   * Enable or disable the diagnostic panel.
   */
  function setEnabled(value) {
    enabled = !!value;
  }

  /**
   * Clear all diagnostic messages and remove the panel.
   */
  function clear() {
    lines = [];
    if (panel) {
      panel.remove();
      panel = null;
    }
  }

  return {
    log: log,
    setEnabled: setEnabled,
    clear: clear,
  };
})();
