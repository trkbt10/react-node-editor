/**
 * @file ESLint rule to disallow nested try-catch statements.
 */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow nested try-catch statements",
    },
    schema: [],
    messages: {
      noNestedTry: "Nested try-catch statements are forbidden.",
    },
  },
  create(context) {
    return {
      TryStatement(node) {
        const findNestedTry = (startNode) => {
          const searchParent = (current) => {
            if (!current) return null;
            if (current.type === "TryStatement") {
              return current;
            }
            return searchParent(current.parent);
          };
          return searchParent(startNode.parent);
        };
        const nestedTry = findNestedTry(node);
        if (nestedTry) {
          context.report({ node, messageId: "noNestedTry" });
        }
      },
    };
  },
};
