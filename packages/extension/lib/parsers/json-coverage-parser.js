/**
 * Parses the compact Coverage Lens JSON format (v1) into the internal
 * coverage representation used by indicators and path-matcher.
 *
 * Input format (coverage-lens/v1):
 *   { "format": "coverage-lens/v1", "files": { "path": { "lineNum": hits } } }
 *
 * Output (internal):
 *   { "path": { "lineNum": { status: "covered"|"uncovered", hits: N } } }
 */

/* exported parseCoverageJson */

var parseCoverageJson = (function () {
  "use strict";

  var SUPPORTED_FORMATS = ["coverage-lens/v1"];

  function expandV1(compact) {
    var files = compact.files;
    if (!files || typeof files !== "object") return {};

    var result = {};
    var paths = Object.keys(files);
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      var lines = files[path];
      if (!lines || typeof lines !== "object") continue;

      var expanded = {};
      var lineNums = Object.keys(lines);
      for (var j = 0; j < lineNums.length; j++) {
        var num = lineNums[j];
        var hits = lines[num];
        if (typeof hits !== "number") continue;
        expanded[num] = {
          status: hits > 0 ? "covered" : "uncovered",
          hits: hits,
        };
      }
      if (Object.keys(expanded).length > 0) {
        result[path] = expanded;
      }
    }
    return result;
  }

  /**
   * Parse a Coverage Lens JSON string into internal coverage data.
   * Validates the format version and dispatches to the appropriate expander.
   *
   * @param {string} jsonString - raw JSON text
   * @returns {Object} coverage data keyed by file path
   * @throws {Error} if format is unrecognised
   */
  function parseCoverageJson(jsonString) {
    var data = JSON.parse(jsonString);

    if (!data || typeof data !== "object") {
      throw new Error("Coverage JSON is not an object");
    }

    var fmt = data.format;
    if (!fmt || SUPPORTED_FORMATS.indexOf(fmt) === -1) {
      throw new Error(
        "Unsupported coverage format: " +
          (fmt || "(missing)") +
          ". Expected one of: " +
          SUPPORTED_FORMATS.join(", ")
      );
    }

    if (fmt === "coverage-lens/v1") {
      return expandV1(data);
    }

    return {};
  }

  return parseCoverageJson;
})();
