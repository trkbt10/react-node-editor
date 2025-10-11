/**
 * @file Custom rule: enforce single-line ternary and <=120 chars.
 */

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Ternary expressions must be single-line and within 120 characters",
    },
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      ConditionalExpression(node) {
        const text = sourceCode.getText(node);

        if (text.includes("\n")) {
          context.report({
            node,
            message:
              "Write ternary expressions on a single line. If the logic is complex, extract it into a function that returns the value (or reuse an existing one).",
          });
        }

        if (text.length > 120) {
          context.report({
            node,
            message: "Keep ternary expressions within 120 characters.",
          });
        }
      },
    };
  },
};
