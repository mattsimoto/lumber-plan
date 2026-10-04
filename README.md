# LumberPlan

LumberPlan turns project dimensions and component lists into a lumber shopping list and a visual cutting plan.

## Current features

- Dimension-based starter layouts for raised garden beds, simple benches, and freestanding shelves.
- Custom components with nominal lumber sizes, finished lengths, quantities, and cut-end notes.
- Stock lengths of 8, 10, 12, and 16 feet, configurable saw kerf, and optional spare allowance.
- Shopping quantities grouped by lumber size and stock length.
- Visual per-board cutting layouts and remaining offcuts.
- Initial hardware allowances and layout assumptions.
- Local photo and PDF references.
- CSV export, browser printing, and project recovery on the same browser/device.
- Responsive layout for desktop and mobile.

## Important limits

This is a working materials-planning foundation, not an automatic blueprint interpreter or an engineered construction design.

Uploaded photos and PDFs are references only. They remain in the browser and are not uploaded to a server or retained after a reload. Description matching suggests one of the three templates; it does not extract dimensions. Enter and confirm dimensions manually.

The cutting engine groups pieces by nominal size and uses a greedy packing heuristic that accounts for kerf between cuts. It does not guarantee a global minimum board count or lowest purchase cost. End trimming, defects, grain direction, and angled-cut geometry are not automatically accounted for. Optional spare boards are separate from the minimum cutting plan.

Hardware quantities are initial allowances. Verify actual lumber dimensions, joints, connector specifications, exposure, intended loads, and any applicable building requirements before buying or cutting. No roof spans, footings, structural load ratings, or code compliance are calculated.

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

Connect AI interpretation for descriptions, drawings, photos, and blueprints. Present extracted dimensions, inferred members, missing details, and assumptions for user confirmation before creating a materials plan. Keep measured facts distinct from estimates, particularly for hidden components and joints.

## Project storage

Project inputs and component lists are saved in this browser's local storage. There are no user accounts or cross-device project synchronization yet. Avoid treating browser storage as your only copy; export a CSV for a permanent materials record.
