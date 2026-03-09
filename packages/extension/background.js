/**
 * Firefox background script (Manifest V2).
 * Thin wrapper that wires browser.* APIs to lib/ modules.
 *
 * Loaded after: jszip, cobertura-parser, coverage-loader, github-api, cache
 */

(function () {
  "use strict";

  var DEFAULT_ARTIFACT_NAME = "pr-coverage";
  var cache = CoverageLensCache.create();

  var CONTENT_SCRIPTS = [
    "lib/diagnostics.js",
    "lib/path-matcher.js",
    "lib/indicators.js",
    "content.js",
  ];

  async function getSettings() {
    var result = await browser.storage.local.get([
      "githubPat",
      "artifactName",
      "showDebugPanel",
      "enabledRepos",
    ]);
    return {
      pat: result.githubPat || null,
      artifactName: result.artifactName || DEFAULT_ARTIFACT_NAME,
      showDebugPanel: !!result.showDebugPanel,
      enabledRepos: result.enabledRepos || [],
    };
  }

  function isRepoEnabled(enabledRepos, owner, repo) {
    var fullName = (owner + "/" + repo).toLowerCase();
    for (var i = 0; i < enabledRepos.length; i++) {
      var entry = enabledRepos[i].toLowerCase().trim();
      if (!entry) continue;
      // Match "owner/repo" exactly or "owner/*" for all repos under an owner
      if (entry === fullName) return true;
      if (entry.endsWith("/*") && fullName.startsWith(entry.slice(0, -1))) return true;
    }
    return false;
  }

  function parseRepoFromUrl(url) {
    var match = url && url.match(
      /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/\d+\/(files|changes)/
    );
    return match ? { owner: match[1], repo: match[2] } : null;
  }

  async function handleGetCoverage(owner, repo, pr) {
    var settings = await getSettings();
    if (!settings.pat) {
      return {
        error:
          "No GitHub token configured. Click the extension icon to set one.",
      };
    }

    if (!isRepoEnabled(settings.enabledRepos, owner, repo)) {
      return {
        error:
          "Repository " + owner + "/" + repo + " is not in the whitelist. Add it in the extension settings.",
      };
    }

    var key = cache.key(owner, repo, pr);
    var cached = cache.get(key);
    if (cached) {
      return { coverage: cached, showDebugPanel: settings.showDebugPanel };
    }

    try {
      var coverageData = await CoverageLensAPI.fetchCoverage(
        owner,
        repo,
        pr,
        settings.pat,
        settings.artifactName
      );
      if (!coverageData) {
        return {
          error:
            "No coverage artifact found. Has the CI pipeline run for this PR?",
        };
      }
      cache.set(key, coverageData);
      return { coverage: coverageData, showDebugPanel: settings.showDebugPanel };
    } catch (err) {
      console.error("[Coverage Lens] Error fetching coverage:", err);
      return { error: err.message };
    }
  }

  // -- Message handler -------------------------------------------------------

  browser.runtime.onMessage.addListener(function (msg) {
    if (msg.type === "getCoverage") {
      return handleGetCoverage(msg.owner, msg.repo, msg.pr);
    }
  });

  // -- Tab injection (only for whitelisted repos) ----------------------------

  async function injectIntoTab(tabId, url) {
    var parsed = parseRepoFromUrl(url);
    if (!parsed) return;

    var settings = await getSettings();
    if (!isRepoEnabled(settings.enabledRepos, parsed.owner, parsed.repo)) return;

    browser.tabs
      .insertCSS(tabId, { file: "content.css" })
      .catch(function () {});
    CONTENT_SCRIPTS.forEach(function (file) {
      browser.tabs
        .executeScript(tabId, { file: file })
        .catch(function () {});
    });
  }

  browser.tabs.onUpdated.addListener(function (id, changeInfo, tab) {
    if (changeInfo.status === "complete" && tab.url)
      injectIntoTab(id, tab.url);
  });

  browser.tabs
    .query({
      url: [
        "https://github.com/*/*/pull/*/files*",
        "https://github.com/*/*/pull/*/changes*",
      ],
    })
    .then(function (tabs) {
      tabs.forEach(function (tab) {
        injectIntoTab(tab.id, tab.url);
      });
    });
})();
