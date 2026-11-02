const literalColor = /(?:#[\da-f]{3,8}\b|\b(?:rgba?|hsla?)\(\s*\d|\b(?:white|black|red|green|blue)\b)/i;
const colorProperty = /^(?:color|background|backgroundColor|borderColor|outlineColor|fill|stroke|textDecorationColor)$/i;

export default {
  meta: {
    type: "problem",
    docs: { description: "Disallow literal colors in inline style objects" },
    schema: [],
    messages: { useToken: "Use an EduMyles semantic color token instead of a literal color." },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== "string" || !literalColor.test(node.value)) return;
        const ancestors = context.sourceCode.getAncestors(node);
        const styleAttribute = ancestors.find(
          (ancestor) =>
            ancestor.type === "JSXAttribute" &&
            ancestor.name?.type === "JSXIdentifier" &&
            ancestor.name.name === "style"
        );
        if (!styleAttribute) return;
        const property = ancestors
          .slice(ancestors.indexOf(styleAttribute))
          .reverse()
          .find((ancestor) => ancestor.type === "Property");
        if (!property) return;
        const propertyName = property.key?.name ?? property.key?.value;
        if (
          typeof propertyName === "string" &&
          (colorProperty.test(propertyName) || propertyName.startsWith("--"))
        ) {
          context.report({ node, messageId: "useToken" });
        }
      },
    };
  },
};
