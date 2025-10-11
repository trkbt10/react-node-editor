/**
 * @file Custom rule: disallow using && as a replacement for the ternary operator.
 */

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow using &&/|| as a replacement for the ternary operator; allow boolean logic and if(...) conditions",
    },
    schema: [],
  },
  create(context) {
    const comparisonOps = new Set(["==", "===", "!=", "!==", ">", ">=", "<", "<="]);
    const typeofLiterals = new Set([
      "undefined",
      "object",
      "boolean",
      "number",
      "bigint",
      "string",
      "symbol",
      "function",
    ]);

    function isTypeofCompare(node) {
      return (
        node &&
        node.type === "BinaryExpression" &&
        (node.operator === "==" || node.operator === "===" || node.operator === "!=" || node.operator === "!==") &&
        ((node.left.type === "UnaryExpression" &&
          node.left.operator === "typeof" &&
          node.right.type === "Literal" &&
          typeof node.right.value === "string" &&
          typeofLiterals.has(node.right.value)) ||
          (node.right.type === "UnaryExpression" &&
            node.right.operator === "typeof" &&
            node.left.type === "Literal" &&
            typeof node.left.value === "string" &&
            typeofLiterals.has(node.left.value)))
      );
    }

    function isBooleanLike(n) {
      if (!n) return false;
      switch (n.type) {
        case "Literal":
          return typeof n.value === "boolean";
        case "Identifier":
          // Heuristic: allow obvious boolean identifiers named true/false
          return n.name === "true" || n.name === "false";
        case "UnaryExpression":
          return n.operator === "!" || n.operator === "void" || n.operator === "delete"; // typically used in boolean contexts
        case "LogicalExpression":
          return isBooleanLike(n.left) && isBooleanLike(n.right);
        case "BinaryExpression":
          return comparisonOps.has(n.operator) || isTypeofCompare(n);
        case "CallExpression":
          // Conservative: treat predicate-like names as boolean
          if (n.callee.type === "Identifier") {
            const name = n.callee.name;
            return /^(is|has|can|should|equal|gt|lt|lte|gte|includes|startsWith|endsWith)$/i.test(name);
          }
          return false;
        default:
          return false;
      }
    }

    function isInConditionalTest(node) {
      const p = node.parent;
      if (!p) return false;
      if (
        (p.type === "IfStatement" && p.test === node) ||
        (p.type === "WhileStatement" && p.test === node) ||
        (p.type === "DoWhileStatement" && p.test === node) ||
        (p.type === "ForStatement" && p.test === node) ||
        (p.type === "ConditionalExpression" && p.test === node)
      ) {
        return true;
      }
      return false;
    }

    return {
      LogicalExpression(node) {
        if (node.operator !== "&&" && node.operator !== "||") return;

        // Allow in conditional tests like if (...) { ... }
        if (isInConditionalTest(node)) return;

        // Allow when both sides are clearly boolean expressions
        if (isBooleanLike(node.left) && isBooleanLike(node.right)) return;

        // Otherwise, this is likely used as a ternary substitute
        const message =
          node.operator === "&&"
            ? "Avoid using && as a replacement for the ternary operator; use a proper conditional or if-statement."
            : "Avoid using || as a replacement for the ternary operator; use a proper conditional or defaulting explicitly.";

        // Report in any position (return, variable init, assignment, expression, etc.)
        context.report({ node, message });
      },
    };
  },
};
