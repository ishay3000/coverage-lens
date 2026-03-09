# .NET / C# Coverage Setup

## Using Coverlet (built into `dotnet test`)

```yaml
name: PR Tests
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0'

      - name: Run tests with coverage
        run: |
          dotnet test \
            --collect:"XPlat Code Coverage" \
            --results-directory ./coverage

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: pr-coverage
          path: coverage/**/coverage.cobertura.xml
          retention-days: 7
```

## Multiple test projects

If you have multiple test projects and want a merged report, install [ReportGenerator](https://github.com/danielpalme/ReportGenerator):

```yaml
      - name: Merge coverage
        run: |
          dotnet tool install -g dotnet-reportgenerator-globaltool
          reportgenerator \
            -reports:"coverage/**/coverage.cobertura.xml" \
            -targetdir:coverage-merged \
            -reporttypes:Cobertura

      - uses: actions/upload-artifact@v4
        with:
          name: pr-coverage
          path: coverage-merged/Cobertura.xml
```
