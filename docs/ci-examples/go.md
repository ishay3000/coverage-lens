# Go Coverage Setup

## Using gocover-cobertura

```yaml
name: PR Tests
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Run tests with coverage
        run: go test -coverprofile=coverage.out ./...

      - name: Convert to Cobertura
        run: |
          go install github.com/boumenot/gocover-cobertura@latest
          gocover-cobertura < coverage.out > coverage.xml

      - uses: actions/upload-artifact@v4
        with:
          name: pr-coverage
          path: coverage.xml
          retention-days: 7
```
