/**
 * Simple in-memory TTL cache.
 * Used by the background script to cache coverage data per PR.
 */

/* exported CoverageLensCache */

var CoverageLensCache = (function () {
  "use strict";

  var DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

  function createCache(ttlMs) {
    var store = {};
    var ttl = ttlMs || DEFAULT_TTL_MS;

    return {
      /**
       * Get a cached value. Returns null if missing or expired.
       * @param {string} key
       * @returns {*|null}
       */
      get: function (key) {
        var entry = store[key];
        if (!entry) return null;
        if (Date.now() - entry.ts > ttl) {
          delete store[key];
          return null;
        }
        return entry.data;
      },

      /**
       * Store a value with the current timestamp.
       * @param {string} key
       * @param {*} value
       */
      set: function (key, value) {
        store[key] = { data: value, ts: Date.now() };
      },

      /**
       * Build a cache key from PR coordinates.
       * @param {string} owner
       * @param {string} repo
       * @param {string} pr
       * @returns {string}
       */
      key: function (owner, repo, pr) {
        return owner + "/" + repo + "/" + pr;
      },

      /**
       * Clear all cached entries.
       */
      clear: function () {
        store = {};
      },
    };
  }

  return { create: createCache };
})();
