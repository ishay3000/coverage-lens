# Coverage Lens

Line-by-line code coverage overlay for GitHub Pull Requests — mimicking [GitLab's built-in coverage visualization](https://docs.gitlab.com/ee/ci/testing/test_coverage_visualization.html), but for GitHub.

[![Firefox Add-on](https://img.shields.io/amo/v/coverage-lens?label=Firefox%20Add-on&logo=firefox&color=orange)](https://addons.mozilla.org/en-US/firefox/addon/coverage-lens/)
![Build](https://github.com/ishay3000/coverage-lens/actions/workflows/pr-build.yaml/badge.svg?branch=main)
![License](https://img.shields.io/badge/license-MIT-green)

![Coverage highlights on a PR diff](docs/images/Highlights.png)

## How It Works

1. Your CI runs tests and produces a **Cobertura XML** coverage report (any language, any framework)
2. The **Coverage Lens action** converts it to a compact JSON format and uploads it as a GitHub Actions artifact
3. The browser extension detects PR diff pages, downloads the artifact, and overlays coverage indicators

**Green bar** = line is covered | **Red bar** = line is not covered | **No bar** = line is not instrumented

Hover over any coverage bar to see the exact hit count (e.g. "Covered (hit 3 times)").

## Quick Start

### 1. Add to your CI workflow

After your tests generate a Cobertura XML file, add this step:

```yaml
- uses: ishay3000/coverage-lens/packages/action@main
  with:
    coverage-file: path/to/your/coverage.xml
    pr-files-only: "true"
  env:
    GH_TOKEN: ${{ github.token }}
```

The action automatically converts Cobertura XML to the compact JSON format the extension expects, resolves all file paths to be repo-relative, and uploads the artifact. **No manual path fixups or configuration needed.**

Every major test framework can produce Cobertura XML:

| Language | How to get Cobertura XML |
|----------|--------------------------|
| **C# / .NET** | `dotnet test --collect:"XPlat Code Coverage"` (Coverlet) |
| **Python** | `pytest --cov --cov-report=xml` |
| **JavaScript/TS** | `jest --coverage --coverageReporters=cobertura` |
| **Java** | JaCoCo with `jacoco:report` |
| **C/C++** | `gcov` + `lcov` + `lcov_cobertura` |
| **Go** | `go test -coverprofile=c.out` + `gocover-cobertura` |

See [docs/ci-examples/](docs/ci-examples/) for complete copy-paste workflow snippets per language.

### 2. Install the extension

**Firefox:** Install from [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/coverage-lens/)

**Chrome / Chromium-based (Vivaldi, Edge, Brave, etc.):** Load unpacked from `packages/extension/dist/chrome/` (Chrome Web Store listing coming soon)

### 3. Configure

Click the extension icon and:

1. Enter your **GitHub Personal Access Token** (classic token with `repo` scope). If your org uses SSO, authorize the token for that org.
2. **Add repositories to the whitelist.** The extension only activates on repos you explicitly enable. Enter one per line:
   - `myorg/myrepo` — a specific repo
   - `myorg/*` — all repos under an org/owner

Then navigate to any whitelisted PR's "Files changed" tab. Coverage bars appear automatically.

## Multiple Coverage Jobs

If your CI has separate test jobs (different languages, unit vs integration, etc.), each job uploads its own coverage artifact. The action merges them automatically:

```yaml
jobs:
  cpp-tests:
    steps:
      # ... build and test with lcov ...
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-cpp
          path: coverage.xml

  go-tests:
    steps:
      # ... go test + gocover-cobertura ...
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-go
          path: coverage.xml

  dotnet-tests:
    steps:
      # ... dotnet test + reportgenerator merge ...
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-dotnet
          path: merged/Cobertura.xml

  merge-coverage:
    needs: [cpp-tests, go-tests, dotnet-tests]
    if: always()
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    steps:
      - uses: actions/checkout@v4
      - uses: ishay3000/coverage-lens/packages/action@main
        with:
          artifact-pattern: "coverage-*"
          pr-files-only: "true"
        env:
          GH_TOKEN: ${{ github.token }}
```

The action downloads all artifacts matching the pattern, parses every Cobertura XML file, auto-resolves file paths to be repo-relative (using the `<sources>` element from the XML), merges line hit counts, filters to only PR-changed files, and uploads a single compact JSON artifact.

## Limitations

- **No GitHub Enterprise** — hardcoded to github.com (configurable GHE support is planned)
- **Artifact storage** — coverage artifacts count toward your repo's storage quota. Use short `retention-days` (7 or less) to avoid accumulation

## Future Plans

- **Dedicated settings page** — full options page instead of cramming everything into the popup
- **OAuth / GitHub Device Flow** — authenticate without manually creating a PAT
- **GitHub Enterprise support** — configurable API base URL
- **Chrome Web Store listing**
- **Rate limit handling** — detect GitHub API 429s and retry with backoff

## Diagnostics

The extension has a built-in debug panel. Enable it from the popup settings to see what's happening:

![Diagnostic panel](docs/images/Diag%20popup.png)

## Project Structure

```
coverage-lens/
├── packages/
│   ├── extension/     Browser extension (Firefox MV2 + Chrome MV3)
│   │   ├── lib/
│   │   │   ├── api/       GitHub API client + cache
│   │   │   ├── loaders/   Coverage data loading from ZIP artifacts
│   │   │   ├── parsers/   JSON coverage format parser
│   │   │   ├── ui/        Coverage indicators + diagnostics
│   │   │   └── vendor/    Third-party libs (JSZip)
│   │   ├── test/      Local test page with mock data
│   │   └── build.sh   Package for distribution
│   └── action/        GitHub Action: XML→JSON conversion + artifact upload
│       ├── action.yml
│       └── xml-to-json.py
└── docs/
    ├── ci-examples/   Copy-paste CI configs per language
    └── images/        Screenshots
```

## Building

```bash
cd packages/extension
./build.sh firefox   # → dist/firefox/
./build.sh chrome    # → dist/chrome/
```

## Development

Open `packages/extension/test/test-page.html` in a browser to test coverage rendering with mock data. Use the file picker to load a `coverage-lens/v1` JSON file and verify it renders correctly.

## License

MIT
