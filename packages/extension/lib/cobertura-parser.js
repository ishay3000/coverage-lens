/**
 * Parses Cobertura XML into the internal coverage format.
 * Works in both DOM contexts (DOMParser) and service workers (regex fallback).
 *
 * Output: { "path/to/file": { "lineNum": { status: "covered"|"uncovered", hits: N } }, ... }
 */

/* exported parseCoberturaXml */

var parseCoberturaXml = (function () {
  "use strict";

  /**
   * Parse using DOMParser (available in pages and Firefox background scripts).
   */
  function parseWithDOM(xmlString) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(xmlString, "text/xml");
    var coverage = {};
    var classes = doc.querySelectorAll("class");

    for (var i = 0; i < classes.length; i++) {
      var cls = classes[i];
      var filename = cls.getAttribute("filename");
      if (!filename) continue;

      filename = filename.replace(/\\/g, "/").replace(/^\/+/, "");

      var lines = cls.querySelectorAll("lines > line");
      if (lines.length === 0) continue;

      var fileLines = coverage[filename] || {};
      for (var j = 0; j < lines.length; j++) {
        var num = lines[j].getAttribute("number");
        var hits = parseInt(lines[j].getAttribute("hits") || "0", 10);
        fileLines[num] = { status: hits > 0 ? "covered" : "uncovered", hits: hits };
      }
      coverage[filename] = fileLines;
    }

    return coverage;
  }

  /**
   * Parse using regex (for Chrome service workers where DOMParser is unavailable).
   * Only extracts <class filename="..."> and <line number="N" hits="H"/> elements.
   */
  function parseWithRegex(xmlString) {
    var coverage = {};

    // Match each <class ...>...</class> block
    var classRe = /<class\s[^>]*filename="([^"]*)"[^>]*>([\s\S]*?)<\/class>/gi;
    var lineRe = /<line\s[^>]*number="(\d+)"[^>]*hits="(\d+)"[^/>]*/gi;
    var match;

    while ((match = classRe.exec(xmlString)) !== null) {
      var filename = match[1].replace(/\\/g, "/").replace(/^\/+/, "");
      var classBody = match[2];

      var fileLines = coverage[filename] || {};
      var lineMatch;
      lineRe.lastIndex = 0;

      while ((lineMatch = lineRe.exec(classBody)) !== null) {
        var num = lineMatch[1];
        var hits = parseInt(lineMatch[2], 10);
        fileLines[num] = { status: hits > 0 ? "covered" : "uncovered", hits: hits };
      }

      if (Object.keys(fileLines).length > 0) {
        coverage[filename] = fileLines;
      }
    }

    return coverage;
  }

  /**
   * Parse a Cobertura XML string into coverage data.
   * Automatically selects DOM or regex parser based on environment.
   */
  function parseCoberturaXml(xmlString) {
    if (typeof DOMParser !== "undefined") {
      return parseWithDOM(xmlString);
    }
    return parseWithRegex(xmlString);
  }

  return parseCoberturaXml;
})();
