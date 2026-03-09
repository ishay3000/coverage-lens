/**
 * File path normalization and fuzzy matching for coverage data.
 * Matches diff file paths against coverage report paths, handling:
 * - Backslash vs forward slash differences
 * - Leading slash variations
 * - Prefix/suffix matching for different root paths
 */

/* exported CoverageLensPathMatcher */

var CoverageLensPathMatcher = (function () {
  "use strict";

  /**
   * Normalize a file path: backslashes → forward slashes, strip leading slashes.
   */
  function normalizePath(p) {
    if (!p || typeof p !== "string") return p;
    return p.replace(/\\/g, "/").replace(/^\/+/, "");
  }

  /**
   * Look up coverage data for a file path using fuzzy matching.
   * Tries: exact match → leading slash → suffix match → prefix match.
   *
   * @param {Object} coverageData - { "path/to/file": { lineNum: status } }
   * @param {string} filePath - path from the diff table
   * @returns {Object|null} per-line coverage data or null
   */
  function getCoverageForPath(coverageData, filePath) {
    if (!coverageData || !filePath) return null;
    var norm = normalizePath(filePath);

    // Exact match
    if (coverageData[norm]) return coverageData[norm];

    // With leading slash
    if (coverageData["/" + norm]) return coverageData["/" + norm];

    // Suffix/prefix matching
    var keys = Object.keys(coverageData);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var nk = normalizePath(key);
      if (
        nk === norm ||
        key.endsWith("/" + norm) ||
        norm.endsWith("/" + nk)
      ) {
        return coverageData[key];
      }
    }
    return null;
  }

  /**
   * Parse a line number from a diff cell's data-line-number attribute.
   * Handles plain numbers and R-N/L-N prefixed formats.
   */
  function parseLineNumber(val) {
    if (val == null || val === "") return null;
    var s = String(val).trim();
    var num = parseInt(s, 10);
    if (!isNaN(num)) return num;
    var prefixed = s.match(/^[RL]-(\d+)$/);
    return prefixed ? parseInt(prefixed[1], 10) : null;
  }

  return {
    normalizePath: normalizePath,
    getCoverageForPath: getCoverageForPath,
    parseLineNumber: parseLineNumber,
  };
})();
