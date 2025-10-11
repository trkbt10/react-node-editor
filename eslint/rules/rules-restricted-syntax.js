/**
 * @file Rule group: 2. Prohibit specific syntax
 */

export default {
  "no-restricted-syntax": [
    "warn",
    { selector: "ImportExpression", message: "dynamic import() is prohibited" },
    { selector: "TSImportType", message: "type import() (TS import type expression) is prohibited" },
    { selector: "TSInterfaceDeclaration", message: "Please use type instead of interface" },
    { selector: "ExportAllDeclaration[exported!=null]", message: "export * as is prohibited" },
    { selector: "ExportAllDeclaration[exportKind='type']", message: "export type * from is prohibited" },
    {
      selector: "ClassDeclaration",
      message: "Class implementation is not recommended. Please write as function-based as much as possible.",
    },
    {
      selector:
        "VariableDeclaration[kind='let']" +
        ":not(ForStatement > VariableDeclaration)" +
        ":not(ForInStatement > VariableDeclaration)" +
        ":not(ForOfStatement > VariableDeclaration)",
      message:
        "Use of let is prohibited. If you need to branch, create a separate function and use its return value. If absolutely necessary for performance issues, explicitly use // eslint-disable-next-line.",
    },
    {
      selector: "TSAsExpression TSAnyKeyword",
      message:
        "Avoid using 'as any'. Code using 'as any' may indicate incorrect type definitions or a misunderstanding; review it carefully. Resolve this by using appropriate type guards or correct typings instead.",
    },
    {
      selector: "TSTypeAssertion TSAnyKeyword",
      message:
        "Avoid using 'as any'. Code using 'as any' may indicate incorrect type definitions or a misunderstanding; review it carefully. Resolve this by using appropriate type guards or correct typings instead.",
    },
    {
      selector:
        "CallExpression[callee.object.name='vi'][callee.property.name=/^(mock|fn|spyOn|restoreAllMocks|resetAllMocks)$/]",
      message: "Mock APIs (vi.mock/fn/spyOn/...) are prohibited. Prefer DI or simple fakes instead.",
    },
    {
      selector:
        "CallExpression[callee.object.name='jest'][callee.property.name=/^(mock|fn|spyOn|restoreAllMocks|resetAllMocks)$/]",
      message: "Mock APIs (jest.mock/fn/spyOn/...) are prohibited. Prefer DI or simple fakes instead.",
    },
    {
      selector:
        "CallExpression[callee.object.name='mock'][callee.property.name=/^(module|object|replace|restore|reset)$/]",
      message: "Mock APIs (bun:test mock.*) are prohibited. Prefer DI or simple fakes instead.",
    },
  ],

  "@typescript-eslint/consistent-type-definitions": ["error", "type"],

  "eslint-comments/require-description": [
    "warn",
    {
      ignore: [],
    },
  ],
};
