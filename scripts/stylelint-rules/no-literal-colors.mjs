const COLOR_PROPERTIES = /^(?:color|background|background-color|border|border-color|border-block-color|border-inline-color|outline|outline-color|text-decoration-color|text-emphasis-color|text-shadow|box-shadow|fill|stroke|caret-color|accent-color|column-rule-color)$/i;
const LITERAL_FUNCTION = /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/i;
const NAMED_COLOR = /\b(?:white|black|red|green|blue|gray|grey|orange|purple|yellow|pink|brown|navy|teal|maroon|lime|silver|olive|aqua|fuchsia|rebeccapurple)\b/i;

export default {
  ruleName: "edumyles/no-literal-colors",
  rule(primary) {
    return (root, result) => {
      if (!primary) return;
      root.walkDecls((declaration) => {
        const withoutVariables = declaration.value
          .replace(/var\([^)]*\)/gi, "")
          .replace(/url\([^)]*\)/gi, "");
        if (
          COLOR_PROPERTIES.test(declaration.prop) &&
          (LITERAL_FUNCTION.test(declaration.value) || NAMED_COLOR.test(withoutVariables))
        ) {
          result.warn("Use an EduMyles color token instead of a literal color.", {
            node: declaration,
            ruleName: "edumyles/no-literal-colors",
          });
        }
      });
    };
  },
};
