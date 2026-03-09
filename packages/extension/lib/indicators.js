/**
 * DOM indicator injection for GitHub PR diff pages.
 * Creates green/red coverage bars on diff line-number cells.
 *
 * Requires: CoverageLensPathMatcher, CoverageLensDiag (loaded before this script)
 */

/* exported CoverageLensIndicators */

var CoverageLensIndicators = (function () {
  "use strict";

  var MARKER = "data-cov-processed";
  var totalAnnotated = 0;
  var diagRun = 0;

  /**
   * Inject a coverage indicator bar into a line-number cell.
   */
  function injectIndicator(cell, status, info) {
    if (cell.querySelector(".coverage-indicator")) return;
    cell.setAttribute("data-coverage-host", "");
    cell.setAttribute("data-coverage", status);
    var bar = document.createElement("span");
    bar.className = "coverage-indicator";
    bar.setAttribute("data-coverage", status);

    var hits = (info && typeof info === "object") ? info.hits : null;
    if (hits !== null && hits !== undefined) {
      var hitsText = hits === 1 ? "1 time" : hits + " times";
      bar.title = status === "covered"
        ? "Covered (hit " + hitsText + ")"
        : "Not covered (0 hits)";
    } else {
      bar.title = status === "covered" ? "Covered" : "Not covered";
    }

    cell.insertBefore(bar, cell.firstChild);
  }

  /**
   * Extract file path from a diff table's aria-label or parent context.
   */
  function getFilePathFromTable(table) {
    var label = table.getAttribute("aria-label");
    if (label) {
      var m = label.match(/^Diff for:\s*(.+)$/);
      if (m) return m[1].trim();
    }
    var parent = table.parentElement;
    while (parent && parent !== document.body) {
      var btn = parent.querySelector("[data-file-path]");
      if (btn) return btn.getAttribute("data-file-path").trim();
      if (parent.id && parent.id.startsWith("diff-")) break;
      parent = parent.parentElement;
    }
    return null;
  }

  /**
   * Annotate a single diff table with coverage indicators.
   * @returns {{ path, cells, annotated }|undefined}
   */
  function annotateTable(table, coverageData) {
    var filePath = getFilePathFromTable(table);
    if (!filePath) return;

    var fileData = CoverageLensPathMatcher.getCoverageForPath(
      coverageData,
      filePath
    );
    if (!fileData) return;

    var cells = table.querySelectorAll(
      'td.new-diff-line-number[data-diff-side="right"]:not([' + MARKER + "])"
    );
    var count = 0;
    cells.forEach(function (cell) {
      cell.setAttribute(MARKER, "1");
      var lineNum = CoverageLensPathMatcher.parseLineNumber(
        cell.getAttribute("data-line-number")
      );
      if (lineNum == null) return;
      var info = fileData[lineNum] || fileData[String(lineNum)];
      if (!info) return;
      var status = typeof info === "string" ? info : info.status;
      injectIndicator(cell, status, info);
      count++;
    });
    totalAnnotated += count;
    return { path: filePath, cells: cells.length, annotated: count };
  }

  /**
   * Annotate all visible diff tables on the page.
   */
  function annotateAll(coverageData) {
    if (!coverageData) return;
    diagRun++;
    var run = diagRun;

    var tables = document.querySelectorAll('table[aria-label^="Diff for:"]');

    if (run <= 3) {
      CoverageLensDiag.log("--- annotateAll #" + run + " ---");
      CoverageLensDiag.log("Found " + tables.length + " diff tables");
      if (run === 1) {
        var covKeys = Object.keys(coverageData);
        CoverageLensDiag.log("Coverage: " + covKeys.length + " files");
        CoverageLensDiag.log(
          "  " +
            covKeys.slice(0, 5).join(", ") +
            (covKeys.length > 5 ? " ..." : "")
        );
      }
    }

    var matchedFiles = 0;
    tables.forEach(function (table) {
      var result = annotateTable(table, coverageData);
      if (result) {
        matchedFiles++;
        if (run <= 3) {
          CoverageLensDiag.log(
            "  " +
              result.path +
              ": " +
              result.annotated +
              "/" +
              result.cells +
              " lines annotated"
          );
        }
      }
    });

    if (run <= 3) {
      CoverageLensDiag.log(
        "Matched " +
          matchedFiles +
          " files, annotated " +
          totalAnnotated +
          " cells total"
      );
    }
  }

  /**
   * Remove all coverage indicators and reset state.
   */
  function clearAll() {
    totalAnnotated = 0;
    diagRun = 0;
    document
      .querySelectorAll("[" + MARKER + "]")
      .forEach(function (el) {
        el.removeAttribute(MARKER);
      });
    document
      .querySelectorAll("[data-coverage-host]")
      .forEach(function (el) {
        el.removeAttribute("data-coverage-host");
        el.removeAttribute("data-coverage");
        el.querySelectorAll(".coverage-indicator").forEach(function (c) {
          c.remove();
        });
      });
  }

  return {
    annotateAll: annotateAll,
    clearAll: clearAll,
    getFilePathFromTable: getFilePathFromTable,
  };
})();
