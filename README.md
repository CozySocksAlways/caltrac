# CalTrac

Personal calorie tracker PWA. Log a meal by typing what you ate, an LLM estimates the
calories, and the entry is committed straight to a git repo you control — no backend server.

See [PLAN.md](./PLAN.md) for the full design.

## Setup

```sh
npm install
npm run dev
```

Open the app and fill in the **Setup** screen:

- LLM base URL, API key, and model (any OpenAI-compatible chat-completions endpoint)
- A separate GitHub repo (recommended private) to hold your calorie log data, plus a
  token with read/write access to it

## Scripts

- `npm run dev` — local dev server
- `npm run build` — typecheck + production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — oxlint

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the app and publishes
it to GitHub Pages (must be enabled in the repo's Pages settings, source: GitHub Actions).
