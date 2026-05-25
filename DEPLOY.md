# Render + Neon deployment — wedding invitation

The whole project (site + RSVP API) runs as **one** Node.js service on
Render's free tier, backed by a free Neon Postgres database.

## 1. Create the database (Neon — 2 minutes)

1. Go to https://neon.tech → **Sign up** (Google login is fine)
2. **Create a project** → pick any name (e.g. `wedding-rsvp`)
3. Region: pick the one closest to your guests (e.g. `Singapore`)
4. On the project dashboard you'll see a **Connection string** that
   looks like:

   ```
   postgres://username:password@ep-xxxx.ap-southeast-1.aws.neon.tech/dbname?sslmode=require
   ```

   Copy it. You'll paste it into Render in step 2.

## 2. Deploy to Render (3 minutes)

1. Go to https://render.com → **Sign up** (GitHub login)
2. Authorize Render to read your `Dansonhar/Wedding_Invitation` repo
3. From the Render dashboard click **New +** → **Web Service**
4. Pick the `Wedding_Invitation` repo → **Connect**
5. Settings:
   - **Name:** `wedding-invitation` (or anything)
   - **Region:** Singapore (or nearest to your guests)
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** **Free**
6. Click **Advanced** → add two **Environment Variables**:

   | Key            | Value                                                      |
   | -------------- | ---------------------------------------------------------- |
   | `DATABASE_URL` | (paste the Neon connection string from step 1)            |
   | `ADMIN_TOKEN`  | a secret, e.g. `danson2026` — keep in sync with admin.html |

7. **Create Web Service**

Render will install + boot the service. First boot takes ~2 minutes.
When you see "Live" in green, open the assigned URL
(e.g. `https://wedding-invitation.onrender.com`) — you should see the
invitation. Visit `/admin.html` to see the dashboard.

## 3. After deployment

Every `git push` to `main` will auto-redeploy.

### Custom domain (optional)
Render dashboard → service → **Settings → Custom Domain** → add (e.g. `rsvp.danson.com`). They give you DNS records to add at your domain registrar.

### Free-tier gotcha
Render free web services **sleep after 15 minutes** of no traffic. The
first request after a sleep takes ~30 sec to respond. For a wedding
that's fine; if you want it always-on, upgrade to Render's $7/month plan.

### Watching submissions
- **Admin dashboard:** `/admin.html` (password = `ADMIN_TOKEN` you set)
- **Direct DB access:** Neon's SQL editor lets you `SELECT * FROM rsvp`
- **Logs:** Render dashboard → service → **Logs**
