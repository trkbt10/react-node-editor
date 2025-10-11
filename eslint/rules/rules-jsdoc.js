/**
 * @file Rule group: 1. File JSDoc required/warning
 */

export default {
  // Disallow empty blocks (except empty catch is also disallowed here)
  "no-empty": ["warn", { allowEmptyCatch: false }],

  // Require file overview and JSDoc for public APIs
  "custom/no-empty-jsdoc": "error",
  "jsdoc/require-file-overview": "warn",
  "jsdoc/require-jsdoc": [
    "warn",
    {
      publicOnly: true,
      require: { FunctionDeclaration: true, ClassDeclaration: true },
    },
  ],
};
