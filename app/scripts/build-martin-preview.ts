import { resolve } from "node:path";

const app = resolve(import.meta.dir, "..");
const out = await Bun.build({
  entrypoints: [resolve(app, "showcase/preview.tsx")],
  target: "browser",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
});
if (!out.success)
  throw new AggregateError(out.logs, "Could not build the Martin Bot preview");
const template = await Bun.file(
  resolve(app, "showcase/preview.template.html"),
).text();
const script = (await out.outputs[0].text()).replace(
  /<\/script/gi,
  "<\\/script",
);
const license = await Bun.file(
  resolve(app, "node_modules/react/LICENSE"),
).text();
const attribution = "<!-- React, React DOM, Scheduler\n" + license + "\n-->";
await Bun.write(
  resolve(app, "../showcase/index.html"),
  template.replace(
    "<!--APP-->",
    () => attribution + "<script>" + script + "</script>",
  ),
);
