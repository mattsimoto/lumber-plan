# LumberPlan

LumberPlan turns project dimensions and component lists into a lumber shopping list and a visual cutting plan.

## Current features

- Dimension-based starter layouts for raised garden beds, simple benches, and freestanding shelves.
- Custom components with nominal lumber sizes, finished lengths, quantities, and cut-end notes.
- Stock lengths of 8, 10, 12, and 16 feet, configurable saw kerf, and optional spare allowance.
- Shopping quantities grouped by lumber size and stock length.
- Visual per-board cutting layouts and remaining offcuts.
- Initial hardware allowances and layout assumptions.
- Photo and PDF uploads with free local text extraction, optional browser vision and an editable review flow.
- CSV export, browser printing, and project recovery on the same browser/device.
- Responsive layout for desktop and mobile.

## Free on-device analysis

No API keys, inference fees, backend or sign-in are required. Select **Read drawing text** for local OCR and PDF text extraction, or **Understand photo** for an optional local vision model. Uploads stay in the browser. The browser downloads the libraries and models on first use.

Photo mode downloads several hundred MB and uses WebGPU when available, with a slower CPU fallback. It suggests visible part groups and offers standard-layout drafts for benches, raised beds and shelving. Draft dimensions and counts are assumptions to review, not measurements from the photo. Read [local analysis details](docs/AI_ANALYSIS.md) for limits, dependencies and verification status.

## Important limits

This is a materials-planning aid, not an engineered construction design. OCR can misread labels, and the small vision model can miss or misidentify members. Confirm every imported value. Text parsing handles explicit rows such as `4 legs, 2x4, 36 in`; it does not reconstruct arbitrary blueprint geometry. PDFs are analyzed one selected page at a time.

The cut engine uses greedy packing with saw kerf. It does not guarantee a global minimum board count or purchase cost. End trimming, defects, grain direction and angled-cut geometry are not automatically included. Hardware notes are provisional and do not establish connection strength.

## GitHub Pages

The app has a client-only build for GitHub Pages. Its project path is `/lumber-plan/`.

1. Open repository **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Run the **Deploy LumberPlan to GitHub Pages** workflow from the Actions tab if the first run happened before Pages was enabled. Future pushes to `main` publish automatically.

Once deployment succeeds, open **https://mattsimoto.github.io/lumber-plan/**.

```sh
pnpm build:pages
pnpm preview:pages
```

The static output is written to `dist-pages/`. This build uses the same workbench and calculation code as the hosted version. Both the calculator and local analysis run in the browser. No backend or provider key is used. Project saving remains local to each browser.

## Local development

Requires Node.js 22.13 or later and pnpm. The dependency lockfile is committed.

```sh
git clone https://github.com/mattsimoto/lumber-plan.git
cd lumber-plan
pnpm install --frozen-lockfile
pnpm dev
```

The portable development server normally runs at `http://localhost:5173`. Use the address printed by the command.

```sh
pnpm exec tsc --noEmit
pnpm build
```

The project uses React, TypeScript, and Vinext with a Cloudflare Workers build. It includes Sites hosting support. `.openai/hosting.json` identifies the existing hosted app; it contains no credentials. Local runtime profiles and build output are excluded from Git.

## Source layout

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Project workbench, editable components, results, and browser storage |
| `lib/planner.ts` | Starter-layout formulas and lumber packing logic |
| `app/globals.css` | Responsive interface and print styles |
| `app/layout.tsx` | Document metadata |
| `public/favicon.svg` | Ruler favicon |
| `scripts/` and `build/` | Framework, local development, and hosting helpers |

## Next milestone

Evaluate the local OCR and vision workflow on real labeled drawings and photos across desktop and mobile hardware. Improve part recognition while keeping measured information distinct from model suggestions.

## Project storage

Project inputs, applied analysis notes and component lists are saved in this browser's local storage. Uploaded file bytes are not saved there. There are no user accounts or cross-device project synchronization yet. Avoid treating browser storage as your only copy; export a CSV for a permanent materials record.

### Photo-to-plan drafts
Image uploads now default to visual analysis. A recognized bench, raised bed or shelving unit produces a standard-layout draft with explicit assumed dimensions, components and hardware allowances. Adjust dimensions in the review and recalculate, then accept the draft to generate the buy list and cut layout. This is not an exact reconstruction of arbitrary photos. Explicit component rows retain their supplied measurements. Unsupported or unrecognized structures retain unresolved parts and offer an explicitly manual starter-layout fallback.

Photo inference tries WebGPU or single-threaded CPU/WASM when no GPU adapter is available. CPU inference can take several minutes or exceed a phone's memory. First use downloads model weights. Real-device inference still needs testing.
