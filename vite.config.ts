import { netlifyPlugin } from "@netlify/remix-adapter/plugin";
import { vitePlugin as remix } from "@remix-run/dev";
import slugify from "@sindresorhus/slugify";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import contactData from "./app/contact-data.json" assert { type: "json" };

export default defineConfig({
  plugins: [
    remix({
      future: {
        unstable_singleFetch: true,
      },
      buildEnd: async () => {
        console.log("build end");
        // do stuff
        const blobDeployDir = join(".netlify", "blobs", "deploy");
        await mkdir(blobDeployDir, { recursive: true });
        for (const contact of contactData.contacts) {
          const id = slugify(`${contact.first}-${contact.last}`);
          await writeFile(
            join(blobDeployDir, id),
            JSON.stringify({ id, ...contact })
          );
        }
      },
    }),
    netlifyPlugin(),
    tsconfigPaths(),
  ],
});
