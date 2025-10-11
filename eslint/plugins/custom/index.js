/**
 * @file Local ESLint plugin: custom rules for this repository.
 */
import ternaryLength from "./rules/ternary-length.js";
import noAndAsTernary from "./rules/no-and-as-ternary.js";
import preferNodeProtocol from "./rules/prefer-node-protocol.js";
import noEmptyJsdoc from "./rules/no-empty-jsdoc.js";
import noAsOutsideGuard from "./rules/no-as-outside-guard.js";
import noNestedTry from "./rules/no-nested-try.js";

export default {
  rules: {
    "ternary-length": ternaryLength,
    "no-and-as-ternary": noAndAsTernary,
    "prefer-node-protocol": preferNodeProtocol,
    "no-empty-jsdoc": noEmptyJsdoc,
    "no-as-outside-guard": noAsOutsideGuard,
    "no-nested-try": noNestedTry,
  },
};
