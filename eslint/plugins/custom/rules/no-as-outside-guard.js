/**
 * @file ESLint rule to disallow `as any` and `as unknown` except in type guard casts.
 */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `as any` and `as unknown` except in type guard casts (`x as any as Y` inside `x is Y` functions).",
    },
    schema: [],
    messages: {
      noAs: "`as any` / `as unknown` assertions are forbidden (except as intermediate casts in type guard functions).",
    },
  },
  create(context) {
    return {
      TSAsExpression(node) {
        const t = node.typeAnnotation;
        if (!t || !["TSAnyKeyword", "TSUnknownKeyword"].includes(t.type)) {
          return; // safe, not any/unknown
        }

        // Find nearest function
        const findNearestFunction = (startNode) => {
          const searchParent = (current) => {
            if (!current) return null;
            if (["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"].includes(current.type)) {
              return current;
            }
            return searchParent(current.parent);
          };
          return searchParent(startNode.parent);
        };
        const func = findNearestFunction(node);

        // ✅ allow only if inside a type guard AND
        // the parent is another TSAsExpression (e.g., `value as any as Hoge`)
        if (
          func &&
          func.returnType &&
          func.returnType.typeAnnotation &&
          func.returnType.typeAnnotation.type === "TSTypePredicate" &&
          node.parent.type === "TSAsExpression"
        ) {
          return; // valid use
        }

        // ❌ otherwise error
        context.report({ node, messageId: "noAs" });
      },
    };
  },
};
