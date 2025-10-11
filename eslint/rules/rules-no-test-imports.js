/**
 * @file Rule group: 5. Forbid loading specific test libraries (imports and requires)
 */

export default {
  // ES Module imports
  "no-restricted-imports": [
    "error",
    {
      paths: [
        {
          name: "bun:test",
          message: "Do not import test libraries. Use globals injected by the test runner (describe/it/expect).",
        },
        {
          name: "vitest",
          message: "Do not import test libraries. Use globals injected by the test runner (describe/it/expect).",
        },
        {
          name: "@jest/globals",
          message: "Do not import test libraries. Use globals injected by the test runner (describe/it/expect).",
        },
        {
          name: "jest",
          message: "Do not import test libraries. Use globals injected by the test runner (describe/it/expect).",
        },
        {
          name: "mocha",
          message: "Do not import test libraries. Use globals injected by the test runner (describe/it/expect).",
        },
      ],
      patterns: [
        {
          group: ["vitest/*", "jest/*", "mocha/*"],
          message: "Do not import test libraries. Use globals injected by the test runner (describe/it/expect).",
        },
      ],
    },
  ],

  // CommonJS requires
  "no-restricted-modules": [
    "error",
    {
      paths: ["bun:test", "vitest", "@jest/globals", "jest", "mocha"],
      patterns: ["vitest/*", "jest/*", "mocha/*"],
    },
  ],
};
