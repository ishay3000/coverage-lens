# Python Coverage Setup

## Using pytest-cov

```yaml
name: PR Tests
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - run: pip install pytest pytest-cov

      - name: Run tests with coverage
        run: pytest --cov=myapp --cov-report=xml:coverage.xml

      - uses: actions/upload-artifact@v4
        with:
          name: pr-coverage
          path: coverage.xml
          retention-days: 7
```
