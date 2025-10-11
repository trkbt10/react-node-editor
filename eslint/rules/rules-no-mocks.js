/**
 * @file Rule group: 6. Forbid mocking APIs and globals from common test libraries
 */

export default {
  // Ban global access to jest / vi (Vitest)
  "no-restricted-globals": [
    "error",
    { name: "jest", message: "Using Jest global is prohibited in this repository." },
    { name: "vi", message: "Using Vitest global is prohibited in this repository." },
  ],

  // Ban specific mocking helpers
  "no-restricted-properties": [
    "error",
    { object: "jest", property: "mock", message: "Mock APIs are prohibited. Prefer DI or simple fakes instead." },
    { object: "jest", property: "fn", message: "Mock APIs are prohibited. Prefer DI or simple fakes instead." },
    {
      object: "jest",
      property: "spyOn",
      message: "Mock APIs are prohibited. Prefer DI or simple fakes instead.",
    },
    { object: "vi", property: "mock", message: "Mock APIs are prohibited. Prefer DI or simple fakes instead." },
    { object: "vi", property: "fn", message: "Mock APIs are prohibited. Prefer DI or simple fakes instead." },
    { object: "vi", property: "spyOn", message: "Mock APIs are prohibited. Prefer DI or simple fakes instead." },
    {
      object: "mock",
      property: "module",
      message: "Mock APIs are prohibited. Prefer DI or simple fakes instead.",
    },
  ],
};
