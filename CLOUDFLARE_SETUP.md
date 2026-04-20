# CLOUDFLARE_SETUP.md — Automated Cloudflare Workers Deployment

> **For GitHub Copilot Agent:** Execute this entire setup file automatically the first time the project is opened or when the user asks to "setup Cloudflare". Run all steps in order. Do not skip any step. Confirm completion of each step before moving to the next.

---

## Trigger Condition

Run this setup if **any** of the following are true:
- `wrangler.jsonc` does not exist at project root
- `open-next.config.ts` does not exist at project root
- `@opennextjs/cloudflare` is not in `package.json` devDependencies

---

## Step 1 — Install Required Packages

```bash
npm install -D @opennextjs/cloudflare wrangler
```

**Verify:** Check that both packages appear in `package.json` under `devDependencies`.

---

## Step 2 — Create `open-next.config.ts`

Create the file at the project root with this exact content:

```ts
// open-next.config.ts
import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
    },
  },
};

export default config;
```

---

## Step 3 — Patch `next.config.ts`

Open the existing `next.config.ts` and add the `initOpenNextCloudflareForDev()` call.

**Before:**
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // existing config
};

export default nextConfig;
```

**After:**
```ts
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // existing config
};

export default nextConfig;
```

> Do NOT overwrite any existing config options inside `nextConfig` — only add the import and the `initOpenNextCloudflareForDev()` call.

---

## Step 4 — Create `wrangler.jsonc`

Create the file at the project root. Replace `YOUR_APP_NAME` with the `name` field from `package.json`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "YOUR_APP_NAME",
  "compatibility_date": "2025-04-08",
  "compatibility_flags": [
    "nodejs_compat",
    "global_fetch_strictly_public"
  ],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "services": [
    {
      "binding": "WORKER_SELF_REFERENCE",
      "service": "YOUR_APP_NAME"
    }
  ]
}
```

---

## Step 5 — Update `package.json` Scripts

Merge the following scripts into the existing `scripts` block in `package.json`. Do NOT remove existing scripts:

```json
"preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
"cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
```

**Result `scripts` block should look like:**
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
  "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
  "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
}
```

---

## Step 6 — Update `.gitignore`

Append the following lines to `.gitignore` if they don't already exist:

```
# Cloudflare / OpenNext build output
.open-next/
cloudflare-env.d.ts
.wrangler/
.dev.vars
```

---

## Step 7 — Create `.dev.vars` (Local Secrets)

Create `.dev.vars` at the project root for local Wrangler development:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Remind the user: "Replace the placeholder values in `.dev.vars` with your actual Supabase credentials before running `npm run preview`."

---

## Step 8 — Generate Cloudflare Types

```bash
npm run cf-typegen
```

This generates `cloudflare-env.d.ts` at the root with proper TypeScript types for Cloudflare bindings.

---

## Step 9 — Scan & Remove Edge Runtime Declarations

Search the entire `app/` and `pages/` directories for this pattern:

```ts
export const runtime = "edge";
```

If found in any file, **remove that line** and add this comment in its place:

```ts
// NOTE: Cloudflare OpenNext adapter does not support edge runtime.
// Using Node.js runtime (default) instead.
```

---

## Step 10 — Verify Setup

Run a local preview to confirm everything works:

```bash
npm run preview
```

**Expected:** App starts locally in the Cloudflare Workers runtime at `http://localhost:3000`.

If errors occur, check:
- `wrangler.jsonc` `"name"` matches `package.json` `"name"`
- No `export const runtime = "edge"` remaining in source files
- `.dev.vars` has valid Supabase credentials

---

## Step 11 — Remind User: Cloudflare Dashboard Variables

After local preview succeeds, display this message to the user:

> ✅ **Local setup complete.**
>
> Before running `npm run deploy`, set these environment variables in your Cloudflare dashboard:
>
> **Dashboard → Workers & Pages → `YOUR_APP_NAME` → Settings → Variables & Secrets**
>
> | Variable | Value |
> |---|---|
> | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
> | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
>
> Then run: `npm run deploy`
>
> Your app will be live at: `https://YOUR_APP_NAME.workers.dev`

---

## Optional: Connect GitHub Repo to Workers Builds (CI/CD)

For automatic deploys on every `git push`:

1. Go to **Cloudflare Dashboard → Workers & Pages → Create → Connect to Git**
2. Select your GitHub repo
3. Set **Build command** to: `npx @opennextjs/cloudflare build`
4. Set **Deploy command** to: `npx @opennextjs/cloudflare deploy`
5. Add all environment variables under **Build Variables & Secrets**

---

## File Checklist (after setup)

```
✅ package.json           — updated scripts + devDependencies
✅ next.config.ts         — initOpenNextCloudflareForDev() added
✅ open-next.config.ts    — created
✅ wrangler.jsonc         — created
✅ .gitignore             — .open-next/, .dev.vars, cloudflare-env.d.ts added
✅ .dev.vars              — created (not committed)
✅ cloudflare-env.d.ts    — generated via cf-typegen
```
