# LumberPlan

LumberPlan turns project dimensions and component lists into a lumber shopping list and a visual cutting plan.

## Current features

- Dimension-based starter layouts for raised garden beds, simple benches, and freestanding shelves.
- Custom components with nominal lumber sizes, finished lengths, quantities, and cut-end notes.
- Stock lengths of 8, 10, 12, and 16 feet, configurable saw kerf, and optional spare allowance.
- Shopping quantities grouped by lumber size and stock length.
- Visual per-board cutting layouts and remaining offcuts.
- Initial hardware allowances and layout assumptions.
- Photo and PDF uploads with an AI analysis request and editable review flow (requires a server-side API credential).
- CSV export, browser printing, and project recovery on the same browser/device.
- Responsive layout for desktop and mobile.

## Important limits

This is a working materials-planning foundation, not an automatic blueprint interpreter or an engineered construction design.

Uploads remain local until you click **Analyze reference**. Analysis sends the reference and project details through the authenticated backend to OpenAI. Generated components are proposals: missing dimensions remain blank, and every included size, length and quantity must be confirmed before the list can be applied. The template suggestion button still uses simple keyword matching.

**Activation status:** the analysis implementation is present, but a server-side `OPENAI_API_KEY` has not yet been configured. It returns a clear setup message without calling the provider until that credential is supplied. See [AI analysis setup](docs/AI_ANALYSIS.md).

The cutting engine groups pieces by nominal size and uses a greedy packing heuristic that accounts for kerf between cuts. It does not guarantee a global minimum board count or lowest purchase cost. End trimming, defects, grain direction, and angled-cut geometry are not automatically accounted for. Optional spare boards are separate from the minimum cutting plan.

Hardware quantities are initial allowances. Verify actual lumber dimensions, joints, connector specifications, exposure, intended loads, and any applicable building requirements before buying or cutting. No roof spans, footings, structural load ratings, or code compliance are calculated.

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

The static output is written to `dist-pages/`. This build uses the same workbench and calculation code as the hosted version. The materials calculator needs no server. AI analysis uses a separate authenticated backend; no provider key is included in the GitHub Pages build. Project saving remains local to each browser.

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

Configure the backend AI credential and run a real labeled drawing/photo/PDF evaluation. The integration, input validation, and component review are implemented; provider calls have only been tested with mocked responses so far. Verify accuracy against known builds before treating generated lists as purchasing plans.

## Project storage

Project inputs, applied analysis notes and component lists are saved in this browser's local storage. Uploaded file bytes are not saved there. There are no user accounts or cross-device project synchronization yet. Avoid treating browser storage as your only copy; export a CSV for a permanent materials record.
