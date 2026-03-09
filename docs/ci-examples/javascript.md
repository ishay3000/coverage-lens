# JavaScript / TypeScript Coverage Setup

## Using Jest

```yaml
name: PR Tests
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npx jest --coverage --coverageReporters=cobertura

      - uses: actions/upload-artifact@v4
        with:
          name: pr-coverage
          path: coverage/cobertura-coverage.xml
          retention-days: 7
```

## Using Vitest

```yaml
      - run: npx vitest --coverage.reporter=cobertura

      - uses: actions/upload-artifact@v4
        with:
          name: pr-coverage
          path: coverage/cobertura-coverage.xml
```

## Using nyc (Istanbul)

```yaml
      - run: npx nyc --reporter=cobertura npm test

      - uses: actions/upload-artifact@v4
        with:
          name: pr-coverage
          path: coverage/cobertura-coverage.xml
```
