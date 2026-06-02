# Deploying the RK backend to Railway

The code lives at **github.com/radwaa24/RK-BE** (branch `main`). Railway deploys
straight from GitHub. The goal: run the backend in the **same region as your
MongoDB Atlas cluster** so the slow BE↔DB hops (~900 ms each locally) become
~2 ms.

## 1. Open / create the Railway project
- Go to **https://railway.app** → log in with GitHub.
- If you already have the `rk-be-production` project: open it.
- Otherwise: **New Project → Deploy from GitHub repo → `radwaa24/RK-BE`**.

> Railway auto-detects Node, runs `npm install`, then `npm start` (= `node server.js`). No build config needed.

## 2. Pick a region near your Atlas cluster ⚠️ (this is what makes it fast)
- In the service → **Settings → Region**, choose the region closest to where you
  created the Atlas cluster (and to you). For MENA/Europe, pick an EU region
  (e.g. *EU West / Amsterdam*) and make sure your Atlas cluster is also in an EU
  region (e.g. AWS Frankfurt `eu-central-1`).
- If BE and DB are in different continents, it will still be slow — keep them together.

## 3. Set environment variables
Service → **Variables** → add:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | your **new** Atlas string (the `cluster0.qftnpcu…/rk-ecommerce…` one) |
| `JWT_SECRET` | a long random string (keep it secret) |
| `JWT_EXPIRE` | `7d` |
| `FRONTEND_URL` | `http://localhost:3000` (comma-add your deployed frontend later) |
| `NODE_ENV` | `production` |

Do **not** set `PORT` — Railway provides it and the app already reads `process.env.PORT`.

> The admin/owner user already exists in this Atlas cluster (we seeded it), so you
> do **not** need to run the seed again on Railway. If you ever do, use Railway's
> shell: `npm run seed:admin`.

## 4. Allow Railway to reach Atlas
- In **Atlas → Network Access**, make sure `0.0.0.0/0` is allowed (you added this
  when creating the cluster). That lets Railway connect.

## 5. Deploy & get the URL
- Railway deploys automatically on every push to `main`. Trigger one via
  **Deployments → Redeploy** if needed.
- In **Settings → Networking → Public Networking**, copy the public URL
  (e.g. `https://rk-be-production.up.railway.app`).
- Test it: open `<url>/api/health` — you should see `{"status":"OK",...}`.

## 6. Point the frontend at it
In `frontend/.env` set:
```
API_BASE_URL=https://<your-railway-url>/api
```
Then restart the frontend dev server. The browser now calls the remote backend,
which talks to a co-located DB — fast.

## Notes
- Free Railway has a monthly usage allowance; the service stays warm (no Render-style
  30–60 s cold starts).
- If login/CORS fails from the browser, double-check `FRONTEND_URL` exactly matches
  your frontend origin (scheme + host + port, no trailing slash).
