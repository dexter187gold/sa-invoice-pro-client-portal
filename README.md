# SA Invoice Pro — Client Portal

Customer-facing portal. Clients sign in with **email + PIN** issued by the shop from the desk app (Clients → Portal login).

## Deploy

### Cloudflare Pages
1. Connect this repo
2. Build command: *(none)* or leave empty
3. Output directory: `/` (root)
4. Env (optional): none required — API defaults to `https://saip-sync.onrender.com`

### Render Static Site
- Publish directory: `.`

After deploy, set on **saip-sync** Render service:
```
CLIENT_PORTAL_URL=https://YOUR-CLIENT-PORTAL-HOST
```

## Flow
1. Shop syncs cloud data
2. Clients → **Portal login** → email + 6-digit PIN generated
3. Customer opens this site → signs in
4. Sees invoices, quotes (accept/decline), jobs, payments

Product: **sainvoicepro@gmail.com**
