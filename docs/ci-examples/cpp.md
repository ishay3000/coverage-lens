# C/C++ Coverage Setup

## Using gcov + lcov

```yaml
name: PR Tests
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install tools
        run: |
          sudo apt-get update
          sudo apt-get install -y lcov
          pip install lcov_cobertura

      - name: Build with coverage flags
        run: |
          cmake -B build -DCMAKE_CXX_FLAGS="--coverage" -DCMAKE_C_FLAGS="--coverage"
          cmake --build build

      - name: Run tests
        run: ctest --test-dir build

      - name: Generate coverage
        run: |
          lcov --capture --directory build --output-file coverage.info
          lcov --remove coverage.info '/usr/*' '*/test/*' --output-file coverage.info
          lcov_cobertura coverage.info -o coverage.xml

      - uses: actions/upload-artifact@v4
        with:
          name: pr-coverage
          path: coverage.xml
          retention-days: 7
```
