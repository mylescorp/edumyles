import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const requireFrontend = createRequire(path.join(rootDir, "../frontend/package.json"));
const postcss = requireFrontend("postcss");
const roots = ["frontend/src", "landing/src"].map((directory) => path.join(rootDir, "..", directory));
const namedColors =
  "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet " +
  "brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue " +
  "darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange " +
  "darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise " +
  "darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia " +
  "gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory " +
  "khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow " +
  "lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray " +
  "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine " +
  "mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise " +
  "mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab " +
  "orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru " +
  "pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen " +
  "seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle " +
  "tomato turquoise violet wheat white whitesmoke yellow yellowgreen";
const namedColorPattern = new RegExp(`(?<![-\\w])(?:${namedColors.split(/\s+/).join("|")})(?![\\w-])`, "i");
const literalPattern = /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/i;

async function collectCssFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectCssFiles(fullPath);
      return entry.isFile() && entry.name.endsWith(".css") ? [fullPath] : [];
    })
  );
  return nested.flat();
}

const violations = [];
for (const sourceRoot of roots) {
  for (const file of await collectCssFiles(sourceRoot)) {
    const css = await readFile(file, "utf8");
    const ast = postcss.parse(css, { from: file });
    ast.walkDecls((declaration) => {
      if (declaration.prop.toLowerCase() === "content") return;
      const value = declaration.value.replace(/url\([^)]*\)/gi, "");
      if (literalPattern.test(value) || namedColorPattern.test(value)) {
        violations.push(`${path.relative(rootDir, file)}:${declaration.source.start.line}: ${declaration.prop}: ${declaration.value}`);
      }
    });
  }
}

if (violations.length) {
  console.error("Literal colors are not allowed in frontend or landing stylesheets:");
  for (const violation of violations) console.error(`  ${violation}`);
  process.exitCode = 1;
} else {
  console.log("No literal colors found in frontend or landing stylesheets.");
}
