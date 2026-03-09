# Coverage Lens

Line-by-line code coverage overlay for GitHub Pull Requests. See which lines are covered (or not) directly in the PR diff view — like GitLab's built-in coverage visualization, but for GitHub.

![Firefox](https://img.shields.io/badge/Firefox-MV2-orange) ![License](https://img.shields.io/badge/license-MIT-green)

## How It Works

1. Your CI runs tests and produces a **Cobertura XML** coverage report
2. CI uploads the report as a GitHub Actions **artifact** named `pr-coverage`
3. The browser extension detects PR diff pages, downloads the artifact, and overlays coverage indicators

**Green bar** = line is covered | **Red bar** = line is not covered | **No bar** = line is not instrumented

## Quick Start

### 1. Add coverage to your CI (2 lines)

After your tests generate a Cobertura XML file, add this to your workflow:

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: pr-coverage
    path: path/to/your/coverage.xml
    retention-days: 7
```

That's it on the CI side. No special actions, no conversion scripts. Every major test framework can produce Cobertura XML natively:

| Language | How to get Cobertura XML |
|----------|--------------------------|
| **C# / .NET** | `dotnet test --collect:"XPlat Code Coverage"` (Coverlet) |
| **Python** | `pytest --cov --cov-report=xml` |
| **JavaScript/TS** | `jest --coverage --coverageReporters=cobertura` |
| **Java** | JaCoCo with `jacoco:report` (outputs Cobertura-compatible XML) |
| **C/C++** | `gcov` → `lcov` → `lcov_cobertura.py` to convert |
| **Go** | `go test -coverprofile=c.out` → `gocover-cobertura` to convert |

See [docs/ci-examples/](docs/ci-examples/) for complete copy-paste workflow snippets.

### 2. Install the extension

**Firefox:** `about:debugging` → Load Temporary Add-on → select `packages/extension/manifest.json`

### 3. Configure

Click the extension icon → enter your **GitHub Personal Access Token**:
- **Classic token:** needs `repo` scope
- **Fine-grained token:** needs Contents + Actions + Pull requests (Read)
- If your org uses SSO, authorize the token for that org

Then navigate to any PR's "Files changed" tab. Coverage bars appear automatically.

## Multiple Test Jobs

If your CI has separate test jobs (e.g., unit + integration), each uploads its own artifact, then a merge step combines them:

```yaml
jobs:
  unit-tests:
    steps:
      - run: pytest --cov --cov-report=xml
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-unit        # prefix with coverage-
          path: coverage.xml
          retention-days: 1

  integration-tests:
    steps:
      - run: pytest --cov --cov-report=xml
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-integration  # prefix with coverage-
          path: coverage.xml
          retention-days: 1

  merge-coverage:
    needs: [unit-tests, integration-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          pattern: coverage-*
          path: coverage-parts
          merge-multiple: false

      # Option A: If you have just 1-2 files, pick the main one
      - run: cp coverage-parts/coverage-unit/*.xml coverage.xml

      # Option B: Merge with ReportGenerator (for .NET or multiple XMLs)
      - run: |
          dotnet tool install -g dotnet-reportgenerator-globaltool
          reportgenerator \
            "-reports:coverage-parts/**/*.xml" \
            "-targetdir:merged" \
            "-reporttypes:Cobertura" \
            "-assemblyfilters:-*Test*"
          cp merged/Cobertura.xml coverage.xml

      - uses: actions/upload-artifact@v4
        with:
          name: pr-coverage
          path: coverage.xml
          retention-days: 7
```

The extension looks for an artifact named `pr-coverage` (configurable in the popup). As long as that artifact contains a Cobertura XML file, it works.

## Project Structure

```
coverage-lens/
├── packages/
│   ├── extension/     Browser extension (Firefox MV2)
│   └── action/        Optional GitHub Action for merging
└── docs/
    └── ci-examples/   Copy-paste CI configs per language
```

## Building

```bash
cd packages/extension
./build.sh firefox   # → dist/firefox/
```

## Development

Open `packages/extension/test/test-page.html` in a browser to test coverage rendering with mock data. Drag-and-drop a Cobertura XML file to test the parser.

## License

MIT
