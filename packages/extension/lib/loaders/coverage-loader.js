/**
 * Loads coverage data from a GitHub Actions artifact ZIP.
 * Expects the compact Coverage Lens JSON format (coverage-lens/v1).
 *
 * Requires: JSZip, parseCoverageJson
 */

/* exported loadCoverageFromZip */

var loadCoverageFromZip = (function () {
  "use strict";

  /**
   * Extract coverage data from a JSZip instance.
   * Looks for .json files, preferring names containing "coverage".
   *
   * @param {JSZip} zip - loaded zip archive
   * @returns {Promise<Object>} coverage data
   */
  async function loadCoverageFromZip(zip) {
    var jsonFiles = zip.file(/\.json$/i);
    if (jsonFiles.length === 0) {
      throw new Error(
        "No coverage data found in artifact. Expected a .json file in coverage-lens/v1 format."
      );
    }

    var preferred = jsonFiles.filter(function (f) {
      return /coverage/i.test(f.name);
    });
    var jsonFile = preferred.length > 0 ? preferred[0] : jsonFiles[0];

    var text = await jsonFile.async("text");
    console.log("[Coverage Lens] Parsing JSON:", jsonFile.name);
    return parseCoverageJson(text);
  }

  return loadCoverageFromZip;
})();
