/**
 * Loads coverage data from a GitHub Actions artifact ZIP.
 * Supports both Cobertura XML and legacy JSON formats.
 *
 * Requires: JSZip, parseCoberturaXml
 */

/* exported loadCoverageFromZip */

var loadCoverageFromZip = (function () {
  "use strict";

  /**
   * Extract coverage data from a JSZip instance.
   * Tries Cobertura XML first, falls back to JSON.
   *
   * @param {JSZip} zip - loaded zip archive
   * @returns {Promise<Object>} coverage data
   */
  async function loadCoverageFromZip(zip) {
    // Try Cobertura XML first
    var xmlFiles = zip.file(/\.xml$/i);
    if (xmlFiles.length > 0) {
      // Prefer files with "cobertura" or "coverage" in the name
      var preferred = xmlFiles.filter(function (f) {
        return /cobertura|coverage/i.test(f.name);
      });
      var xmlFile = preferred.length > 0 ? preferred[0] : xmlFiles[0];

      var xmlText = await xmlFile.async("text");
      console.log("[Coverage Lens] XML file size: " + xmlText.length + " chars");
      console.log("[Coverage Lens] XML first 500 chars: " + xmlText.substring(0, 500));

      // Verify it's actually Cobertura XML (not some other XML)
      if (xmlText.indexOf("<coverage") !== -1) {
        console.log("[Coverage Lens] Parsing Cobertura XML:", xmlFile.name);
        var result = parseCoberturaXml(xmlText);
        console.log("[Coverage Lens] Parser returned " + Object.keys(result).length + " files");
        if (Object.keys(result).length > 0) {
          var firstKey = Object.keys(result)[0];
          console.log("[Coverage Lens] First file: " + firstKey);
        }
        return result;
      } else {
        console.log("[Coverage Lens] XML does not contain <coverage tag, skipping");
      }
    }

    // Fallback: JSON format
    var jsonFile =
      zip.file("coverage.json") ||
      (zip.file(/coverage\.json$/i)[0] || null);
    if (jsonFile) {
      console.log("[Coverage Lens] Parsing JSON:", jsonFile.name);
      var text = await jsonFile.async("text");
      return JSON.parse(text);
    }

    throw new Error(
      "No coverage data found in artifact. Expected Cobertura XML (.xml) or coverage.json"
    );
  }

  return loadCoverageFromZip;
})();
