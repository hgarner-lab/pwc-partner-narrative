import fs from "node:fs/promises";

const sources = JSON.parse(await fs.readFile(new URL("../crawler/sources.json", import.meta.url), "utf8"));

console.log(
  JSON.stringify(
    {
      status: "registry-only",
      message: "The Partner Narrative Kits prototype uses curated approved PwC sources. Add source refresh automation only after source governance is agreed.",
      sourceGroups: sources.sources.length,
      seedUrlCount: sources.sources.reduce((sum, source) => sum + source.urls.length, 0),
    },
    null,
    2,
  ),
);
