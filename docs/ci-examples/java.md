# Java Coverage Setup

## Using JaCoCo with Maven

Add the JaCoCo plugin to your `pom.xml`, then:

```yaml
name: PR Tests
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: Run tests with coverage
        run: mvn verify

      - uses: actions/upload-artifact@v4
        with:
          name: pr-coverage
          path: target/site/jacoco/jacoco.xml
          retention-days: 7
```

> JaCoCo produces Cobertura-compatible XML natively when configured with the `report` goal.

## Using Gradle

```yaml
      - run: ./gradlew test jacocoTestReport

      - uses: actions/upload-artifact@v4
        with:
          name: pr-coverage
          path: build/reports/jacoco/test/jacocoTestReport.xml
```
