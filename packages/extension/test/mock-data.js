// Mock coverage data for local testing.
// Keys are repo-relative file paths; values map line numbers to { status, hits }.
window.__COVERAGE_MOCK__ = {
  "src/Services/UserService.cs": {
    10: { status: "covered", hits: 3 },
    11: { status: "covered", hits: 3 },
    12: { status: "covered", hits: 5 },
    15: { status: "uncovered", hits: 0 },
    20: { status: "covered", hits: 1 },
    21: { status: "covered", hits: 1 },
    25: { status: "uncovered", hits: 0 },
    30: { status: "covered", hits: 12 }
  },
  "src/utils.ts": {
    2: { status: "covered", hits: 42 },
    3: { status: "covered", hits: 42 },
    4: { status: "covered", hits: 42 },
    8: { status: "uncovered", hits: 0 },
    12: { status: "covered", hits: 7 }
  }
};
