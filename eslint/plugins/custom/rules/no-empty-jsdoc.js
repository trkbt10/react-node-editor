/**
 * @file Custom rule: disallow empty JSDoc-style block comments like:
 *   /**\n *   *\n *   *\/  (only whitespace)
 */

function isJsdocBlock(comment) {
  return comment.type === "Block" && typeof comment.value === "string" && comment.value.startsWith("*");
}

function isEmptyJsdocContent(rawValue) {
  // rawValue is the text inside /* ... */ — for JSDoc it starts with '*'
  // Treat it as empty if, after stripping leading '*' and surrounding whitespace on each line,
  // the concatenated content is empty.
  const content = rawValue
    .split(/\r?\n/)
    .map((line) => {
      const trimmedLeft = line.replace(/^\s+/, "");
      const withoutStar = trimmedLeft.startsWith("*") ? trimmedLeft.slice(1) : trimmedLeft;
      return withoutStar.trim();
    })
    .join("");
  return content.length === 0;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow empty JSDoc block comments (only whitespace)",
    },
    schema: [],
    fixable: "code",
    messages: {
      emptyJsdoc: "Empty JSDoc block comment is not allowed.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      Program() {
        const comments = sourceCode.getAllComments();
        for (const comment of comments) {
          if (!isJsdocBlock(comment)) continue;
          if (isEmptyJsdocContent(comment.value)) {
            context.report({
              loc: comment.loc,
              messageId: "emptyJsdoc",
              fix(fixer) {
                // Remove the entire comment token
                return fixer.removeRange(comment.range);
              },
            });
          }
        }
      },
    };
  },
};
