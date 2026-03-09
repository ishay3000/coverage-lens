/**
 * Content script orchestrator.
 * Injected into GitHub PR diff pages after lib/ modules.
 * Handles SPA navigation, coverage requests, and wires modules together.
 *
 * Loaded after: diagnostics.js, path-matcher.js, indicators.js
 */

(function () {
  "use strict";

  if (window.__coverageLensInjected) return;
  window.__coverageLensInjected = true;

  var coverageData = window.__COVERAGE_MOCK__ || null;

  // -- SPA navigation --------------------------------------------------------

  var lastUrl = location.href;
  var debounceTimer = null;
  var observer = new MutationObserver(function () {
    if (debounceTimer) return;
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      CoverageLensIndicators.annotateAll(coverageData);
    }, 300);
  });

  function startObserving() {
    var target =
      document.querySelector("#diff-comparison-viewer-container") ||
      document.querySelector("#diff") ||
      document.querySelector('[data-target="diff-layout.mainContainer"]') ||
      document.querySelector(".js-diff-progressive-container") ||
      document.body;
    CoverageLensDiag.log("Observing: " + (target.id || target.tagName));
    observer.observe(target, { childList: true, subtree: true });
  }

  function onUrlChange() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      coverageData = null;
      CoverageLensIndicators.clearAll();
      requestCoverage();
    }
  }

  document.addEventListener("turbo:load", onUrlChange);
  setInterval(onUrlChange, 1000);

  // -- Coverage request ------------------------------------------------------

  function parsePrUrl() {
    var match = location.pathname.match(
      /^\/([^/]+)\/([^/]+)\/pull\/(\d+)/
    );
    if (!match) return null;
    return { owner: match[1], repo: match[2], pr: match[3] };
  }

  function onCoverageLoaded(data) {
    coverageData = data;
    CoverageLensDiag.log(
      "Coverage loaded: " + Object.keys(coverageData).length + " files"
    );
    CoverageLensIndicators.annotateAll(coverageData);
    startObserving();
    setTimeout(function () { CoverageLensIndicators.annotateAll(coverageData); }, 800);
    setTimeout(function () { CoverageLensIndicators.annotateAll(coverageData); }, 2500);
    setTimeout(function () { CoverageLensIndicators.annotateAll(coverageData); }, 5000);
  }

  function requestCoverage() {
    // Mock data for local testing
    if (window.__COVERAGE_MOCK__) {
      coverageData = window.__COVERAGE_MOCK__;
      CoverageLensDiag.log(
        "Using mock data (" + Object.keys(coverageData).length + " files)"
      );
      CoverageLensIndicators.annotateAll(coverageData);
      startObserving();
      return;
    }

    var pr = parsePrUrl();
    if (!pr) {
      CoverageLensDiag.log("Not a PR page: " + location.pathname);
      return;
    }

    // Detect browser runtime
    var B =
      typeof browser !== "undefined" && browser.runtime
        ? browser
        : typeof chrome !== "undefined" && chrome.runtime
          ? chrome
          : null;
    if (!B) {
      CoverageLensDiag.log("ERROR: no extension runtime available");
      return;
    }

    CoverageLensDiag.log(
      "Requesting coverage for " +
        pr.owner + "/" + pr.repo + " #" + pr.pr + " ..."
    );

    var msgPromise = B.runtime.sendMessage({
      type: "getCoverage",
      owner: pr.owner,
      repo: pr.repo,
      pr: pr.pr,
    });
    // Chrome returns undefined from sendMessage; wrap in promise
    if (!msgPromise || typeof msgPromise.then !== "function") {
      msgPromise = new Promise(function (resolve) {
        B.runtime.sendMessage(
          { type: "getCoverage", owner: pr.owner, repo: pr.repo, pr: pr.pr },
          resolve
        );
      });
    }

    msgPromise
      .then(function (response) {
        if (!response) {
          CoverageLensDiag.log("ERROR: empty response from background");
          return;
        }
        if (response.error) {
          CoverageLensDiag.log("ERROR: " + response.error);
          return;
        }
        if (response.coverage) {
          if (response.showDebugPanel) CoverageLensDiag.setEnabled(true);
          onCoverageLoaded(response.coverage);
        } else {
          CoverageLensDiag.log("ERROR: response has no coverage data");
        }
      })
      .catch(function (err) {
        CoverageLensDiag.log(
          "ERROR: " + (err && err.message ? err.message : String(err))
        );
      });
  }

  // -- Init ------------------------------------------------------------------
  requestCoverage();
})();
