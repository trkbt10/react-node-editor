/**
 * @file Custom rule: enforce using `node:` protocol for Node.js core module imports.
 * Examples: `import fs from 'node:fs'` instead of `import fs from 'fs'`.
 */

import { builtinModules } from "node:module";

// Build a set of bare core module names (without the `node:` prefix)
const CORE_MODULES = new Set(
  builtinModules
    .map((m) => (m.startsWith("node:") ? m.slice(5) : m))
    .filter((m) => !m.includes("/"))
);

function needsNodePrefix(specifier) {
  if (typeof specifier !== "string") return false;
  if (specifier.startsWith("node:")) return false; // already using protocol
  const base = specifier.split("/")[0];
  return CORE_MODULES.has(base);
}

function makeFixedSpecifier(specifier) {
  return `node:${specifier}`;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Require `node:` protocol for Node.js core modules",
    },
    fixable: "code",
    schema: [],
    messages: {
      requireNodePrefix: "Use 'node:' protocol for Node.js core module '{{name}}'",
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const value = node.source && node.source.value;
        if (needsNodePrefix(value)) {
          const base = String(value).split("/")[0];
          context.report({
            node: node.source,
            messageId: "requireNodePrefix",
            data: { name: base },
            fix(fixer) {
              const fixed = makeFixedSpecifier(String(value));
              return fixer.replaceText(node.source, `'${fixed}'`);
            },
          });
        }
      },

      CallExpression(node) {
        // require('fs')
        if (
          node.callee &&
          node.callee.type === "Identifier" &&
          node.callee.name === "require" &&
          node.arguments &&
          node.arguments.length === 1 &&
          node.arguments[0].type === "Literal"
        ) {
          const arg = node.arguments[0];
          const value = arg.value;
          if (typeof value === "string" && needsNodePrefix(value)) {
            const base = value.split("/")[0];
            context.report({
              node: arg,
              messageId: "requireNodePrefix",
              data: { name: base },
              fix(fixer) {
                const fixed = makeFixedSpecifier(value);
                return fixer.replaceText(arg, `'${fixed}'`);
              },
            });
          }
        }
      },

      ImportExpression(node) {
        // dynamic import('fs')
        const source = node.source;
        if (source && source.type === "Literal" && typeof source.value === "string") {
          const value = source.value;
          if (needsNodePrefix(value)) {
            const base = value.split("/")[0];
            context.report({
              node: source,
              messageId: "requireNodePrefix",
              data: { name: base },
              fix(fixer) {
                const fixed = makeFixedSpecifier(value);
                return fixer.replaceText(source, `'${fixed}'`);
              },
            });
          }
        }
      },
    };
  },
};

