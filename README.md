# SA Invoice Pro — Client Portal

Customer-facing portal. Clients sign in with **email + PIN** issued by the shop from the desk app (Clients → Portal login).

## Cloudflare deploy (fix)

Your error was: **Missing entry-point to Worker script or to assets directory**.

This repo is a **static site**. Assets live in `public/`.

### Option A — Cloudflare Pages (recommended)

1. Workers & Pages → Create → Connect **`sa-invoice-pro-client-portal`**
2. **Build command:** *(leave empty)*
3. **Build output directory:** `public`
4. **Deploy command:** leave default / empty — do **not** use `npx wrangler deploy` unless using Option B
5. Save & deploy

### Option B — Wrangler Worker + assets

If the project is configured with deploy command `npx wrangler deploy`:

```bash
npm install
npx wrangler deploy
```

`wrangler.toml` points at `./public`.

### After deploy

Set on **saip-sync** (Render):

```text
CLIENT_PORTAL_URL=https://YOUR-HOST
```

## Flow

1. Shop syncs cloud data  
2. Clients → **Portal login** → email + 6-digit PIN  
3. Customer opens this site → signs in  
4. Sees invoices, quotes, jobs, payments  

Product: **sainvoicepro@gmail.com**
