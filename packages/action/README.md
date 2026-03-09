# Coverage Lens Upload Action

Optional GitHub Action for merging multiple Cobertura XML coverage reports and uploading them as a single artifact for the Coverage Lens browser extension.

**Most repos don't need this action.** If your CI produces a single Cobertura XML, just use `actions/upload-artifact` directly:

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: pr-coverage
    path: coverage.xml
```

Use this action when you need to **merge coverage from multiple jobs** (e.g., .NET + C++ in one pipeline).

## Usage

```yaml
jobs:
  dotnet-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: dotnet test --collect:"XPlat Code Coverage"
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-dotnet
          path: "**/coverage.cobertura.xml"

  cpp-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: make test-coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-cpp
          path: coverage.xml

  merge-coverage:
    needs: [dotnet-tests, cpp-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: your-org/coverage-lens/packages/action@main
        with:
          artifact-pattern: "coverage-*"
          artifact-name: "pr-coverage"
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `artifact-pattern` | `coverage-*` | Pattern to match coverage artifacts |
| `artifact-name` | `pr-coverage` | Name of the final uploaded artifact |
| `retention-days` | `7` | Artifact retention period |
| `coverage-file` | | Direct path to a single file (skips download/merge) |
