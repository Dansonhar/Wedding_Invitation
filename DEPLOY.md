# Deploying the wedding invitation to Render

Pure static-site deploy. No backend, no database. Render builds the
project (`npm run build` → `dist/`) and serves it from their global
CDN. Free tier, no expiry.

## 1. Sign up

https://render.com — log in with GitHub. Grant access to the
`Dansonhar/Wedding_Invitation` repo.

## 2. Create the site

From the Render dashboard:

1. **New +** → **Static Site**
2. Pick the `Wedding_Invitation` repo → **Connect**
3. Verify the auto-detected settings (Render reads `render.yaml`):
   - **Name:** `wedding-invitation` (or anything)
   - **Branch:** `main`
   - **Build Command:** `npm run build`
   - **Publish directory:** `./dist`
4. Click **Create Static Site**

First build takes ~30 seconds. When you see "Live" with a green dot,
your URL is at the top of the page — something like:

```
https://wedding-invitation.onrender.com
```

That URL is the **invitation**. Admin is at:

```
https://wedding-invitation.onrender.com/admin.html
```
(password: `danson2026` — change it in `admin.html` if you want)

## 3. After deployment

- Every `git push origin main` auto-redeploys (~30 sec).
- **Custom domain:** Render dashboard → service → **Settings →
  Custom Domain** → add your domain (e.g. `rsvp.danson.com`).

## Caveat about RSVPs

The form saves submissions to **localStorage** in the visitor's browser.
That data is private to that browser. If you want submissions from
different guests' phones to all flow into your admin dashboard, you
need a real backend (Postgres / Firebase / Apps Script) — ask me to
re-enable the Render Web Service + Neon setup that's in this repo's
git history.
