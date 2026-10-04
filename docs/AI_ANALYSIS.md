# AI analysis setup

## Current status

The image/PDF/description integration is implemented. Live analysis remains inactive until a server-side AI credential is configured. Tests use mock provider responses; a live provider request and the cross-site sign-in flow have not yet been verified.

## Architecture

- GitHub Pages runs the calculator and review UI.
- Clicking **Analyze reference** opens `/analysis-bridge` on the existing private LumberPlan hosted app.
- If needed, the hosting platform asks the visitor to sign in.
- A nonce-bound `postMessage` handshake transfers the input. Both windows check the message origin, sender and request ID. The bridge only accepts the repository owner's GitHub Pages origin.
- The bridge calls the same-origin `/api/analyze` route. Sites supplies the authenticated user header; unauthenticated and foreign-origin requests are rejected.
- The server calls OpenAI's Responses API with a strict JSON schema and returns validated components.
- Users review proposed parts and missing values before replacing the current component list. The provider key never enters the Pages bundle or GitHub repository.

The bridge currently trusts `https://mattsimoto.github.io` and uses `https://timber-plan.magentaratsbane.chatgpt.site` as the backend. These are configured in `lib/analysis-contract.ts`. Update both if the app origins change. Do not host this API somewhere that trusts user-supplied authentication headers; its authentication boundary is Sites dispatch.

## Required server configuration

Set `OPENAI_API_KEY` as a **secret runtime environment variable on the backend Site**, then redeploy that backend. It is not a GitHub Pages build variable and must never use a `VITE_` or `NEXT_PUBLIC_` prefix. Do not commit credentials, insert them in frontend code, or paste them into repository issues.

Optional server variable: `OPENAI_VISION_MODEL`. The default is `gpt-4.1`, using image inputs, PDF file inputs and structured output. Confirm model access for the configured API project.

The backend remains private. Visitors need access to the hosted backend to use analysis, even though the calculator on GitHub Pages is public. Enabling a public multi-user AI service requires an appropriate authentication and usage-budget design first.

If sign-in severs the popup's opener connection, return to GitHub Pages and click Analyze again after sign-in. The app presents this recovery instruction. Users must allow the analysis window to open.

## Request and output behavior

Inputs accept JPG, PNG, WEBP and PDF, up to 15 MB each, with up to 12,000 description characters. Server checks include content type, file signature, base64 size and a bounded request body. One attachment is processed per request. Small legible drawings or individual PDF pages usually provide more useful results than large scans.

The prompt requires unresolved values to remain null and flags inferred components. The review prevents applying components with missing size, length or quantity. It asks users to confirm all included values and joints. Unchecked components are excluded, so a partially applied list is not necessarily a complete structure.

Images and text are sent to OpenAI only when the user requests analysis and the backend is configured. Responses use `store: false`; provider data-handling policies still apply. File bytes and raw provider responses are not saved by this app. Applied component and assumption data are saved in browser local storage.

## Verification

```sh
pnpm test:analysis
pnpm exec tsc --noEmit
pnpm build:pages
pnpm build
```

The API tests cover authentication, origin rejection, absent credentials, unknown measurements, malformed uploads, image/PDF request construction, provider refusal, invalid structured output and upstream errors. They do not make paid API calls.

After configuration, verify a labeled drawing, an unscaled photo (which should ask for measurements), and a one-page PDF from the GitHub Pages app. Confirm sign-in, return of results, editing, cancellation, applying the list, and persistence. No API credential should appear in generated assets, local storage, browser request bodies or Git history.
