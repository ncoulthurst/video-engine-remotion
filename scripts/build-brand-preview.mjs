// Bundles src/brandPreview.tsx into a single browser-ready IIFE the Flask app
// serves as a static asset for the brand editor's live preview panel. Not
// part of the Remotion CLI pipeline — run manually (or via `npm run
// build:brand-preview`) after editing brandPreview.tsx or the two
// compositions it mounts (ParticleSandFill, PieShareChart).
import { build } from "esbuild";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Absolute, matching the fixed cross-repo path convention server.py already
// uses for this machine (e.g. remotion_dir = "/home/nathan/remotiontest").
const outfile = "/home/nathan/youtube/engine/static/brand_preview.bundle.js";

build({
  entryPoints: [path.resolve(__dirname, "../src/brandPreview.tsx")],
  bundle: true,
  outfile,
  format: "iife",
  platform: "browser",
  target: "es2019",
  minify: true,
  loader: { ".tsx": "tsx", ".ts": "ts" },
  define: { "process.env.NODE_ENV": '"production"' },
})
  .then(() => {
    console.log(`[build-brand-preview] wrote ${outfile}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
