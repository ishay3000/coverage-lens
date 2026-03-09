(function () {
  "use strict";

  var B = typeof browser !== "undefined" ? browser : chrome;

  var patInput = document.getElementById("pat");
  var artifactInput = document.getElementById("artifact-name");
  var enabledReposInput = document.getElementById("enabled-repos");
  var debugToggle = document.getElementById("debug-panel");
  var saveBtn = document.getElementById("save");
  var statusEl = document.getElementById("status");

  function showStatus(configured) {
    if (configured) {
      statusEl.className = "status ok";
      statusEl.textContent = "Settings saved";
    } else {
      statusEl.className = "status missing";
      statusEl.textContent = "No token set";
    }
  }

  B.storage.local
    .get(["githubPat", "artifactName", "showDebugPanel", "enabledRepos"])
    .then(function (result) {
      if (result.githubPat) {
        patInput.value = result.githubPat;
        showStatus(true);
      } else {
        showStatus(false);
      }
      artifactInput.value = result.artifactName || "pr-coverage";
      debugToggle.checked = !!result.showDebugPanel;
      enabledReposInput.value = (result.enabledRepos || []).join("\n");
    });

  saveBtn.addEventListener("click", function () {
    var pat = patInput.value.trim();
    var artifactName = artifactInput.value.trim() || "pr-coverage";
    var showDebug = debugToggle.checked;
    var enabledRepos = enabledReposInput.value
      .split("\n")
      .map(function (line) { return line.trim(); })
      .filter(function (line) { return line.length > 0; });

    var settings = {
      artifactName: artifactName,
      showDebugPanel: showDebug,
      enabledRepos: enabledRepos,
    };

    if (pat) {
      settings.githubPat = pat;
    }

    B.storage.local.set(settings).then(function () {
      if (!pat) {
        B.storage.local.remove("githubPat");
      }
      showStatus(!!pat);
      setTimeout(function () {
        statusEl.textContent = "";
        statusEl.className = "";
      }, 3000);
    });
  });
})();
