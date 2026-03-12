/**
 * GitHub API client for fetching coverage artifacts.
 * Pure functions — no browser extension API dependencies.
 *
 * Requires: JSZip, parseCoverageJson, loadCoverageFromZip (loaded before this script)
 */

/* exported CoverageLensAPI */

var CoverageLensAPI = (function () {
  "use strict";

  /**
   * Authenticated fetch against the GitHub REST API.
   * @param {string} url
   * @param {string} pat - Personal Access Token
   * @returns {Promise<Response>}
   */
  async function ghFetch(url, pat) {
    var headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (pat) {
      headers.Authorization = "token " + pat;
    }
    var resp = await fetch(url, { headers: headers });
    if (!resp.ok) {
      var body = "";
      try {
        body = await resp.text();
      } catch (e) {
        /* ignore */
      }
      if (resp.status === 401 || resp.status === 403) {
        throw new Error(
          "API " +
            resp.status +
            ": " +
            (body
              ? body.substring(0, 120)
              : "token may lack 'repo' scope or SSO authorization")
        );
      }
      throw new Error("GitHub API " + resp.status + ": " + url);
    }
    return resp;
  }

  /**
   * Get the HEAD commit SHA for a pull request.
   */
  async function getHeadSha(owner, repo, pr, pat) {
    var resp = await ghFetch(
      "https://api.github.com/repos/" + owner + "/" + repo + "/pulls/" + pr,
      pat
    );
    var data = await resp.json();
    return data.head.sha;
  }

  /**
   * Find a coverage artifact matching the PR's head SHA.
   * Falls back to the most recent non-expired artifact if no SHA match.
   */
  async function findArtifact(owner, repo, headSha, pat, artifactName) {
    var resp = await ghFetch(
      "https://api.github.com/repos/" +
        owner +
        "/" +
        repo +
        "/actions/artifacts?name=" +
        artifactName +
        "&per_page=30",
      pat
    );
    var data = await resp.json();
    var artifacts = data.artifacts || [];

    // Primary: match by commit SHA
    for (var i = 0; i < artifacts.length; i++) {
      if (artifacts[i].expired) continue;
      if (
        artifacts[i].workflow_run &&
        artifacts[i].workflow_run.head_sha === headSha
      ) {
        return artifacts[i];
      }
    }
    // Fallback: most recent non-expired
    for (var j = 0; j < artifacts.length; j++) {
      if (!artifacts[j].expired) return artifacts[j];
    }
    return null;
  }

  /**
   * Download an artifact ZIP and extract coverage data.
   * Returns the parsed coverage object.
   */
  async function downloadAndUnzip(owner, repo, artifactId, pat) {
    var url =
      "https://api.github.com/repos/" +
      owner +
      "/" +
      repo +
      "/actions/artifacts/" +
      artifactId +
      "/zip";
    var resp = await fetch(url, {
      headers: {
        Authorization: "token " + pat,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!resp.ok) {
      throw new Error("Artifact download failed: " + resp.status);
    }

    var buf = await resp.arrayBuffer();
    var zip = await JSZip.loadAsync(buf);
    return loadCoverageFromZip(zip);
  }

  /**
   * Fetch coverage data for a PR. Orchestrates the full flow:
   * getHeadSha → findArtifact → downloadAndUnzip.
   *
   * @param {string} owner
   * @param {string} repo
   * @param {string} pr
   * @param {string} pat
   * @param {string} artifactName
   * @returns {Promise<Object>} coverage data
   */
  async function fetchCoverage(owner, repo, pr, pat, artifactName) {
    var headSha = await getHeadSha(owner, repo, pr, pat);
    var artifact = await findArtifact(owner, repo, headSha, pat, artifactName);
    if (!artifact) {
      return null;
    }
    return downloadAndUnzip(owner, repo, artifact.id, pat);
  }

  return {
    ghFetch: ghFetch,
    getHeadSha: getHeadSha,
    findArtifact: findArtifact,
    downloadAndUnzip: downloadAndUnzip,
    fetchCoverage: fetchCoverage,
  };
})();
